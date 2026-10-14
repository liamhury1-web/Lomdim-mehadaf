// Server side of "לומדים מהדף": turns page photos or a typed topic into study material with Google Gemini (free tier).
// Needs GEMINI_API_KEY in Vercel → Settings → Environment Variables. Optional: GEMINI_MODEL (comma-separated list).
const MODELS = (process.env.GEMINI_MODEL || 'gemini-flash-latest,gemini-flash-lite-latest,gemini-2.5-flash,gemini-2.5-flash-lite').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));

const FORMAT = `Keep terms in their language; translate to Hebrew if no translation is given. Explanations: one short Hebrew sentence. Math: Unicode, no LaTeX.
Reply ONLY JSON:
{"title":"Hebrew topic, max 40 chars","termLang":"en","defLang":"he","alphabet":false,
"cards":[{"term":"","def":""}],
"mcq":[{"q":"","options":["","","",""],"answer":0,"explain":""}],
"scramble":[{"word":"","hint":""}],
"topics":[{"name":"Hebrew topic","query":"YouTube search"}],
"lesson":[{"title":"Hebrew heading","body":"Hebrew explanation with example, paragraphs split by \\n"}]}
cards 6-40, mcq 6-20 (vary answer position), scramble only single words 3-12 letters, topics 2-5, lesson 3-6 sections. alphabet true only if the material teaches letters.`;

const PAGES = `Study pages from a Hebrew-speaking student in Israel. Turn them into quiz material. Use only what is on the pages; for exercises you may write similar new ones, solved correctly. `;

const TEXT = `A Hebrew-speaking student in Israel wrote what they want to study. It is either a topic request (for example "questions about healthy nutrition for 8th grade") or study material they pasted. For a topic: write accurate, well-established, age-appropriate material on it, at the level they asked for (default: middle school). For pasted material: use only that material. Write questions and answers in Hebrew unless the request is about learning another language.
The student wrote:
"""
`;

const LESSON = `A Hebrew-speaking student studies this material. Write a simple Hebrew lesson and video topics. Reply ONLY JSON: {"lesson":[{"title":"","body":""}],"topics":[{"name":"","query":"YouTube search"}]}. lesson 3-6 sections, topics 2-5.\n\n`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  const k = process.env.GEMINI_API_KEY;
  if (!k) return res.status(500).json({ code: 'no_key' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } b = b || {};

  const parts = [];
  if (b.mode === 'lesson') parts.push({ text: LESSON + String(b.material || '').slice(0, 12000) });
  else if (b.mode === 'text') {
    const t = String(b.text || '').trim().slice(0, 12000);
    if (t.length < 3) return res.status(400).json({ code: 'bad_request' });
    parts.push({ text: TEXT + t + '\n"""\n\n' + FORMAT });
  } else {
    const im = Array.isArray(b.images) ? b.images.slice(0, 4) : [];
    if (!im.length) return res.status(400).json({ code: 'bad_request' });
    for (const i of im) parts.push({ inline_data: { mime_type: i.type || 'image/jpeg', data: String(i.data || '') } });
    parts.push({ text: PAGES + FORMAT + (b.note ? '\nStudent note: ' + String(b.note).slice(0, 300) : '') });
  }

  const body = JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16000 } });
  let last = 503;
  for (let n = 0; n < 2; n++) for (const M of MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + M.trim() + ':generateContent', {
        method: 'POST', headers: { 'x-goog-api-key': k.trim(), 'content-type': 'application/json' }, body
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        console.error(M, r.status, d?.error?.message); last = r.status;
        if ([429, 500, 503, 404].includes(r.status)) { if (n === 0) await wait(1000); continue; }
        return res.status(503).json({ code: 'busy' });
      }
      const t = (d?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
      const a = t.indexOf('{'), z = t.lastIndexOf('}');
      try { return res.status(200).json({ result: JSON.parse(t.slice(a, z + 1)) }); }
      catch { console.error(M, 'bad json'); continue; }
    } catch (e) { console.error(M, e); }
  }
  return res.status(last === 429 ? 429 : 503).json({ code: last === 429 ? 'rate' : 'busy' });
}
