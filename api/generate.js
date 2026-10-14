const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const HOURLY_LIMIT = Number(process.env.HOURLY_LIMIT) || 40;
const MAX_IMAGES = 4;
const MAX_IMAGE_B64 = 2_500_000;
const hits = new Map();

function pagesPrompt({ from, to, total, note, first }) {
  return `You are turning photos of a student's study pages into practice material for a quiz app (like Quizlet). The student is a Hebrew speaker in Israel.
These images are pages ${from}-${to} of ${total}. Read every image carefully, including handwriting, tables and exercises.

Rules:
- Use only material that is actually on the pages. For exercises (math, physics, chemistry), you may write new practice questions of the same kind and you must solve them correctly.
- Keep terms in the language they appear in on the page. Write definitions/translations as the page gives them; if a vocabulary list has no translation, translate into Hebrew.
- Explanations ("explain") are one short sentence in Hebrew.
- Math and science: plain text with Unicode symbols (x², √, ½, ×, ÷, π, Δ, →, ≤). Never LaTeX. Every question must stand on its own.
- If an image is unreadable or not study material, skip it.
${note ? '- The student added this note, follow it: ' + String(note).replace(/\s+/g, ' ').slice(0, 500) + '\n' : ''}
Reply with ONLY one JSON object in this shape:
{"title":"short Hebrew name for the topic, up to 40 characters",
 "termLang":"BCP-47 code of the terms, e.g. en, he, ar, fr",
 "defLang":"BCP-47 code of the definitions",
 "alphabet":false,
 "cards":[{"term":"word / concept / formula name / short question","def":"translation / meaning / formula / short answer"}],
 "mcq":[{"q":"question","options":["A","B","C","D"],"answer":0,"explain":"why, in Hebrew"}],
 "scramble":[{"word":"single word for spelling practice","hint":"its meaning or a clue"}],
 "topics":[{"name":"Hebrew name of a topic on these pages","query":"YouTube search query that finds a good explainer video for it"}],
 "lesson":[{"title":"Hebrew section heading","body":"Hebrew explanation, 2-5 short paragraphs separated by \\n, with a worked example where it fits"}]}

Amounts: "cards" 6-40 items covering the page content (empty array if nothing fits). "mcq" 6-20 questions with 4 options each, plausible wrong options (for math, results of common mistakes), and "answer" is the index of the correct option; vary the position of the correct option. "scramble" only single words made of letters (3-12 letters) worth practising spelling, otherwise []. "topics" 2-5 distinct topics; write each query in the language most likely to find a good video for a Hebrew-speaking student (Hebrew for school subjects taught in Hebrew, English for learning English words). ${first ? '"lesson" 3-6 sections that teach this material simply, as a good teacher would.' : '"lesson" 1-3 sections only about material on these pages.'} Set "alphabet" to true only if the pages teach letters of an alphabet or capital and small letters.`;
}

function lessonPrompt({ title, material }) {
  return `A Hebrew-speaking student in Israel is studying this material (topic: ${String(title || '').slice(0, 80)}):

${String(material || '').slice(0, 12000)}

Write a short lesson that teaches this material simply, as a good teacher would, and suggest videos.
Plain text with Unicode symbols for math, never LaTeX.
Reply with ONLY one JSON object:
{"lesson":[{"title":"Hebrew section heading","body":"Hebrew explanation, 2-5 short paragraphs separated by \\n, with a worked example where it fits"}],
 "topics":[{"name":"Hebrew name of a topic","query":"YouTube search query that finds a good explainer video for it"}]}
"lesson" 3-6 sections. "topics" 2-5 distinct topics; write each query in the language most likely to find a good video for this student.`;
}

function parseJson(text) {
  if (!text) return null;
  const tryParse = s => { try { return JSON.parse(s); } catch { return null; } };
  let v = tryParse(text.trim());
  if (v) return v;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence && (v = tryParse(fence[1].trim()))) return v;
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a !== -1 && b > a) return tryParse(text.slice(a, b + 1));
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ code: 'method', error: 'POST only' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ code: 'no_key', error: 'ANTHROPIC_API_KEY is not set' });

  const code = process.env.ACCESS_CODE;
  if (code && req.headers['x-access-code'] !== code) return res.status(401).json({ code: 'need_code' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 3_600_000);
  if (recent.length >= HOURLY_LIMIT) return res.status(429).json({ code: 'rate' });
  recent.push(now); hits.set(ip, recent);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body && typeof body === 'object' ? body : {};

  const content = [];
  if (body.mode === 'lesson') {
    if (!body.material) return res.status(400).json({ code: 'bad_request' });
    content.push({ type: 'text', text: lessonPrompt(body) });
  } else {
    const images = Array.isArray(body.images) ? body.images : [];
    if (!images.length || images.length > MAX_IMAGES) return res.status(400).json({ code: 'bad_request', error: 'send 1-' + MAX_IMAGES + ' images' });
    for (const img of images) {
      const type = /^image\/(jpeg|png|webp|gif)$/.test(img?.type) ? img.type : null;
      if (!type || typeof img.data !== 'string' || !img.data || img.data.length > MAX_IMAGE_B64) return res.status(413).json({ code: 'too_big' });
      content.push({ type: 'image', source: { type: 'base64', media_type: type, data: img.data } });
    }
    content.push({ type: 'text', text: pagesPrompt({
      from: Number(body.from) || 1, to: Number(body.to) || images.length, total: Number(body.total) || images.length,
      note: typeof body.note === 'string' ? body.note : '', first: body.first !== false
    }) });
  }

  let r, data;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 12000, messages: [{ role: 'user', content }] })
    });
    data = await r.json().catch(() => null);
  } catch (e) {
    return res.status(502).json({ code: 'busy', error: 'could not reach the Claude API' });
  }
  if (!r.ok) {
    const msg = data?.error?.message || '';
    console.error('Claude API error', r.status, msg);
    if (r.status === 429 || r.status === 529 || r.status >= 500) return res.status(503).json({ code: 'busy' });
    return res.status(502).json({ code: 'upstream', error: msg });
  }
  const text = (data?.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const result = parseJson(text);
  if (!result) return res.status(502).json({ code: 'bad_json' });
  return res.status(200).json({ result, truncated: data?.stop_reason === 'max_tokens' });
}
