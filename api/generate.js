// Server side of "לומדים מהדף": turns page photos or a typed topic into study material with Google Gemini (free tier).
// Needs GEMINI_API_KEY in Vercel → Settings → Environment Variables. Optional: GEMINI_MODEL (comma-separated list).
const MODELS = (process.env.GEMINI_MODEL || 'gemini-flash-latest,gemini-flash-lite-latest,gemini-2.5-flash,gemini-2.5-flash-lite').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));

const READING = `Reading passages: a story or text in the target language, with 4-6 comprehension questions.
- For a foreign language (English, French, Arabic...): "instructions", every question "q" and every option are in the target language, and after the instructions and after each question add the Hebrew translation in parentheses, e.g. "Who found the dog? (מי מצא את הכלב?)". "explain" in Hebrew.
- For Hebrew or other school subjects: all in Hebrew.
- Match the student's grade (Israeli school, foreign language for English):
  grade 1-2: 30-60 words, very short present-simple sentences, basic everyday words;
  grade 3-4: 60-100 words, simple sentences, present and simple past;
  grade 5-6: 100-160 words, short paragraphs, common connectors;
  grade 7-8: 150-220 words, past and future, some descriptive words;
  grade 9: 200-280 words, varied tenses and linking words;
  grade 10-11: 250-350 words, richer vocabulary, some inference questions;
  grade 12 / bagrut: 300-450 words, bagrut-level text, inference and vocabulary-in-context questions;
  no grade given: grade 7-8. For native Hebrew readers use the same lengths with age-appropriate richer language.
`;

const FORMAT = `Keep terms in their language; translate to Hebrew if no translation is given. Explanations: short and in Hebrew. Math: Unicode (x², √, ½, ×, ÷, π), no LaTeX.
Math, physics and chemistry: every question must have exactly one correct option. Solve each one step by step before writing it, double-check the arithmetic, and put the short solution steps in "explain". Wrong options should come from typical mistakes.
Reply ONLY JSON:
{"title":"Hebrew topic, max 40 chars","termLang":"en","defLang":"he","alphabet":false,
"cards":[{"term":"","def":""}],
"mcq":[{"q":"","options":["","","",""],"answer":0,"explain":""}],
"scramble":[{"word":"","hint":""}],
"topics":[{"name":"Hebrew topic","query":"YouTube search"}],
"lesson":[{"title":"Hebrew heading","body":"Hebrew explanation with example, paragraphs split by \\n"}],
"reading":[{"title":"","lang":"BCP-47 of the text","instructions":"","text":"passage, paragraphs split by \\n","questions":[{"q":"","options":["","","",""],"answer":0,"explain":""}]}]}
cards 6-40, mcq 6-20 (vary answer position), scramble only single words 3-12 letters, topics 2-5, lesson 3-6 sections. reading: [] unless asked for a reading passage or the material is itself a reading passage.
${READING}alphabet true only if the material teaches letters.`;

const PAGES = `Study pages from a Hebrew-speaking student in Israel. Turn them into quiz material. Use only what is on the pages; for exercises you may write similar new ones, solved correctly. `;

const TEXT = `A Hebrew-speaking student in Israel wrote what they want to study. It is either a topic request (for example "questions about healthy nutrition for 8th grade") or study material they pasted. For a topic: write accurate, well-established, age-appropriate material on it, at the level they asked for (default: middle school). For pasted material: use only that material. Write questions and answers in Hebrew unless the request is about learning another language.
The student wrote:
"""
`;


const LANG_NAMES = { he:'Hebrew', en:'English', ar:'Arabic', fr:'French', es:'Spanish', ru:'Russian', de:'German', it:'Italian', pt:'Portuguese', am:'Amharic', zh:'Chinese (simplified, add pinyin in parentheses after hard words)', ja:'Japanese (mostly hiragana for beginners)' };
const GENRES = { adventure:'adventure', funny:'funny / humorous', animals:'animals', sport:'sport', science:'science and nature (accurate facts)', mystery:'mystery / detective', daily:'everyday life (school, family, friends)', fantasy:'fantasy / magic' };
const SETTINGS = ['a city park', 'a space station', 'a desert trip', 'a school trip', 'a farm', 'a museum', 'a beach', 'a snowy village', 'a football match', 'a train', 'a market', 'a forest camp', 'a science fair', 'a birthday party', 'an old library', 'a rainy day at home', 'a zoo', 'a boat', 'a mountain hike', 'a robot workshop'];

const LESSON = `A Hebrew-speaking student studies this material. Write a simple Hebrew lesson and video topics. Reply ONLY JSON: {"lesson":[{"title":"","body":""}],"topics":[{"name":"","query":"YouTube search"}]}. lesson 3-6 sections, topics 2-5.\n\n`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  const k = process.env.GEMINI_API_KEY;
  if (!k) return res.status(500).json({ code: 'no_key' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } b = b || {};

  const parts = [];
  if (b.mode === 'explain') {
    const q = String(b.q || '').slice(0, 1500), opts = Array.isArray(b.options) ? b.options.slice(0, 6).map(x => String(x).slice(0, 300)) : [];
    parts.push({ text: `A Hebrew-speaking student answered a quiz question wrong. Explain briefly in Hebrew (2-4 short sentences) why the correct answer is right and why their choice is wrong. For math or science, show the short solution steps (Unicode symbols, no LaTeX). Be encouraging.
Question: ${q}
Options: ${opts.join(' | ')}
Correct answer: ${String(b.correct || '').slice(0, 300)}
Student chose: ${String(b.chosen || '').slice(0, 300)}
Reply ONLY JSON: {"explain":"..."}` });
  } else if (b.mode === 'story') {
    const lang = String(b.lang || 'en').slice(0, 5), level = String(b.level || '').slice(0, 40);
    const genre = GENRES[b.genre] || 'any genre you like, be creative and surprising';
    const avoid = (Array.isArray(b.avoid) ? b.avoid : []).slice(-15).map(x => String(x).slice(0, 80)).filter(Boolean);
    const idea = String(b.idea || '').slice(0, 200), words = String(b.words || '').slice(0, 600);
    parts.push({ text: `Write ONE new reading passage for a Hebrew-speaking student in Israel.
Language of the passage: ${LANG_NAMES[lang] || lang}. Student level: ${level || 'grade 7-8'}. Genre: ${genre}.
${idea ? 'The student asked for: "' + idea + '"' : 'Possible setting (only if it fits the genre): ' + SETTINGS[Math.floor(Math.random() * SETTINGS.length)] + '.'}
${avoid.length ? 'It must be clearly different (topic, characters, setting) from these earlier passages: ' + avoid.join(' | ') + '.' : ''}
${words ? 'If it fits naturally, use a few of these words the student is learning: ' + words : ''}
Give it a short title in the passage language${lang === 'he' ? '' : ' with the Hebrew translation in parentheses'}.
${READING}
Reply ONLY JSON: {"reading":[{"title":"","lang":"${lang}","instructions":"","text":"paragraphs split by \\n","questions":[{"q":"","options":["","","",""],"answer":0,"explain":""}]}]}` });
  } else if (b.mode === 'lesson') parts.push({ text: LESSON + String(b.material || '').slice(0, 12000) });
  else if (b.mode === 'text') {
    const t = String(b.text || '').trim().slice(0, 12000);
    const subject = String(b.subject || '').slice(0, 40), level = String(b.level || '').slice(0, 40), lang = String(b.lang || '').slice(0, 12);
    if (t.length < 3 && !subject && !lang) return res.status(400).json({ code: 'bad_request' });
    const extra = [subject && 'Subject: ' + subject, level && 'Level: ' + level,
      lang && 'Target language: ' + lang + ' (write the study content, words, sentences and texts in this language; explanations stay in Hebrew)',
      b.reading && 'Include 1 reading passage with comprehension questions in "reading".'].filter(Boolean).join('\n');
    parts.push({ text: TEXT + (t || '(no text, build a good general set from the settings below)') + '\n"""\n' + extra + '\n\n' + FORMAT });
  } else {
    const im = Array.isArray(b.images) ? b.images.slice(0, 4) : [];
    if (!im.length) return res.status(400).json({ code: 'bad_request' });
    for (const i of im) parts.push({ inline_data: { mime_type: i.type || 'image/jpeg', data: String(i.data || '') } });
    parts.push({ text: PAGES + FORMAT + (b.note ? '\nStudent note: ' + String(b.note).slice(0, 300) : '') });
  }

  const body = JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16000, ...(b.mode === 'story' ? { temperature: 1.2 } : {}) } });
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
