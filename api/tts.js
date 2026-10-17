// Natural-sounding speech for words and short texts, from Gemini's text-to-speech models.
// Returns a WAV file. Audio is cached in the Upstash Redis database (if connected) so each text is made once.
// GET /api/tts?test=1 reports which model answers, for checking the setup.
import { createHash } from 'crypto';

const KEY = process.env.GEMINI_API_KEY;
const MODELS = (process.env.TTS_MODEL || 'gemini-3.1-flash-tts-preview,gemini-3.8-flash-lite-tts,gemini-3.8-flash-tts,gemini-2.5-flash-preview-tts').split(',').map(m => m.trim()).filter(Boolean);
const VOICE = process.env.TTS_VOICE || 'Kore';
// the database variables may carry a prefix chosen in Vercel (e.g. STORAGE_KV_REST_API_URL), so look for any of them
function envEnd(...ends){ for (const e of ends) { if (process.env[e]) return process.env[e]; const k = Object.keys(process.env).find(n => n.endsWith('_' + e)); if (k) return process.env[k]; } return ''; }
const DB = envEnd('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL');
const DB_TOKEN = envEnd('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN');
const LANG = { he:'Hebrew', en:'English', ar:'Arabic', fr:'French', es:'Spanish', ru:'Russian', de:'German', it:'Italian', pt:'Portuguese', am:'Amharic', zh:'Mandarin Chinese', ja:'Japanese' };

async function redis(cmd){
  if (!DB || !DB_TOKEN) return null;
  try {
    const r = await fetch(DB.replace(/\/$/, ''), { method: 'POST', headers: { authorization: 'Bearer ' + DB_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmd), signal: AbortSignal.timeout(3000) });
    return r.ok ? (await r.json()).result : null;
  } catch { return null; }
}
// 16-bit mono PCM → WAV
function wav(pcm, rate){
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
async function speak(text, lang, log){
  const prompt = `Read aloud clearly and naturally, at a calm pace for a student${LANG[lang] ? ', in ' + LANG[lang] : ''}: ${text}`;
  for (const M of MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + M + ':generateContent', {
        method: 'POST', headers: { 'x-goog-api-key': KEY.trim(), 'content-type': 'application/json' }, signal: AbortSignal.timeout(25000),
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } } })
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) { log.push(M + ' ' + r.status + ' ' + String(d?.error?.message || '').slice(0, 120)); continue; }
      const part = (d?.candidates?.[0]?.content?.parts || []).find(p => p.inlineData || p.inline_data);
      const inl = part && (part.inlineData || part.inline_data);
      if (!inl || !inl.data) { log.push(M + ' no audio'); continue; }
      const mime = String(inl.mimeType || inl.mime_type || ''), raw = Buffer.from(inl.data, 'base64');
      log.push(M + ' ok ' + mime + ' ' + raw.length);
      if (/wav/i.test(mime) || raw.slice(0, 4).toString() === 'RIFF') return raw;
      const rate = +((mime.match(/rate=(\d+)/) || [])[1] || 24000);
      return wav(raw, rate);
    } catch (e) { log.push(M + ' ' + String(e && e.message || e).slice(0, 80)); }
  }
  return null;
}

export default async function handler(req, res) {
  if (!KEY) return res.status(500).json({ code: 'no_key' });
  if (req.method === 'GET' && req.query && req.query.test) {
    const log = [], t0 = Date.now(), a = await speak('Hello, how are you?', 'en', log);
    return res.status(200).json({ ok: !!a, bytes: a ? a.length : 0, ms: Date.now() - t0, log, cache: !!DB });
  }
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } b = b || {};
  const text = String(b.text || '').replace(/\s+/g, ' ').trim().slice(0, 450), lang = String(b.lang || '').slice(0, 2).toLowerCase();
  if (!text) return res.status(400).json({ code: 'bad_request' });
  const id = 'tts:' + VOICE + ':' + lang + ':' + createHash('sha1').update(text).digest('hex');
  const hit = await redis(['GET', id]);
  let audio = hit ? Buffer.from(hit, 'base64') : null;
  if (!audio) {
    const log = [];
    audio = await speak(text, lang, log);
    if (!audio) { console.error('tts', log.join(' | ')); return res.status(503).json({ code: 'busy' }); }
    const b64 = audio.toString('base64');
    if (b64.length < 900000) await redis(['SET', id, b64, 'EX', String(60 * 60 * 24 * 60)]);
  }
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.status(200).send(audio);
}
