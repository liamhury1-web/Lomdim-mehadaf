// Server side of "לומדים מהדף": turns page photos or a typed topic into study material with Google Gemini (free tier).
// Needs GEMINI_API_KEY in Vercel → Settings → Environment Variables. Optional: GEMINI_MODEL (comma-separated list).
const MODELS = (process.env.GEMINI_MODEL || 'gemini-flash-latest,gemini-flash-lite-latest,gemini-2.5-flash,gemini-2.5-flash-lite').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));

const READING = `Reading passages, with comprehension questions (grade 1-2: 3-4 questions, otherwise 4-6).
Make them like real reading material: model each passage on the texts found in Israeli school textbooks, graded readers and learner websites for that grade and language (for English: the Israeli Ministry of Education curriculum and the CEFR level below). Facts (science, animals, places, history, sport) must be true; check them with Google Search when it is available. Write an original passage in that style; never copy a published text.
Questions must be good and easy: short, clear wording; most questions are answered directly by one sentence of the passage, asked in the order of the text; from grade 7 at most one inference or word-meaning question; exactly one correct option; wrong options are plausible but clearly wrong according to the text; no trick questions, no "all of the above".
- For a foreign language (English, French, Arabic...): "instructions", every question "q" and every option are in the target language, and after the instructions and after each question add the Hebrew translation in parentheses, e.g. "Who found the dog? (מי מצא את הכלב?)". "explain" in Hebrew.
- For Hebrew or other school subjects: all in Hebrew.
Vowel marks, the way real learner texts have them:
- Hebrew: never write nikud yourself, at any grade (a professional vocalizer adds it afterwards for young students). Use standard modern spelling.
- Arabic, up to grade 10: full tashkeel (fatha, kasra, damma, sukun, shadda, tanwin) on the passage, instructions, questions and options. Grade 11 and up: tashkeel only on words that could be misread.
- Russian, up to grade 10: stress marks (´) on words of two or more syllables, as in Russian textbooks for learners.
- Japanese, up to grade 10: after each word with kanji, its reading in hiragana in parentheses, e.g. 学校(がっこう).
- Chinese, up to grade 10: pinyin with tone marks in parentheses after each word.
- Other languages: normal spelling with all accents.
Grades (Israeli school; the level may be in Hebrew, e.g. "כיתה ה׳" = grade 5, "כיתה י״א" = grade 11):
  grade 1-2: 30-60 words, very short present-simple sentences, basic everyday words (pre-A1);
  grade 3-4: 60-100 words, simple sentences, present and simple past (pre-A1 to A1);
  grade 5-6: 100-160 words, short paragraphs, common connectors (A1);
  grade 7-8: 150-220 words, past and future, some descriptive words (A2);
  grade 9: 200-280 words, varied tenses and linking words (A2+);
  grade 10-11: 250-350 words, richer vocabulary, some inference questions (B1);
  grade 12 / bagrut: 300-450 words, bagrut-level text, inference and vocabulary-in-context questions (B1+ to B2);
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
Never write Hebrew nikud yourself (it is added afterwards by a professional vocalizer). Arabic study words and sentences: full tashkeel up to grade 10.
${READING}alphabet true only if the material teaches letters.`;

const PAGES = `Study pages from a Hebrew-speaking student in Israel. Turn them into quiz material. Use only what is on the pages; for exercises you may write similar new ones, solved correctly. `;

const TEXT = `A Hebrew-speaking student in Israel wrote what they want to study. It is either a topic request (for example "questions about healthy nutrition for 8th grade") or study material they pasted. For a topic: write accurate, well-established, age-appropriate material on it, checked against reliable sources (use Google Search when it is available), at the level they asked for (default: middle school). For pasted material: use only that material. Write questions and answers in Hebrew unless the request is about learning another language.
The student wrote:
"""
`;


const LANG_NAMES = { he:'Hebrew', en:'English', ar:'Arabic', fr:'French', es:'Spanish', ru:'Russian', de:'German', it:'Italian', pt:'Portuguese', am:'Amharic', zh:'Chinese (simplified)', ja:'Japanese (mostly hiragana for beginners)' };
const GENRES = { adventure:'adventure', funny:'funny / humorous', animals:'animals', sport:'sport', science:'science and nature (accurate facts)', mystery:'mystery / detective', daily:'everyday life (school, family, friends)', fantasy:'fantasy / magic' };
const SETTINGS = ['a city park', 'a space station', 'a desert trip', 'a school trip', 'a farm', 'a museum', 'a beach', 'a snowy village', 'a football match', 'a train', 'a market', 'a forest camp', 'a science fair', 'a birthday party', 'an old library', 'a rainy day at home', 'a zoo', 'a boat', 'a mountain hike', 'a robot workshop'];

const LESSON = `A Hebrew-speaking student studies this material. Write a simple Hebrew lesson and video topics. Reply ONLY JSON: {"lesson":[{"title":"","body":""}],"topics":[{"name":"","query":"YouTube search"}]}. lesson 3-6 sections, topics 2-5.\n\n`;

/* ---------- vowel marks ---------- */
// grade number from "כיתה ה׳", "כיתה י״א", "grade 5"…; 0 when unknown, 99 for university / adults
function gradeOf(level){
  const l = String(level || '');
  if (/אוניברסיט|מבוגר|adult|universit/i.test(l)) return 99;
  const n = l.match(/\d+/); if (n) return +n[0];
  const h = l.replace(/כיתה|[׳״'"\s]/g, '');
  return { 'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,'יא':11,'יב':12 }[h] || 0;
}
const HEB = /[א-ת]/;
const stripNikud = t => t.replace(/[֑-ֽֿ-ׂׄ-ׇ]/g, '');
// every string in the answer the student reads (not language codes or search queries)
function strings(o, test, out = []){
  if (Array.isArray(o)) o.forEach((v, i) => typeof v === 'string' ? (test(v) && out.push([o, i])) : strings(v, test, out));
  else if (o && typeof o === 'object') for (const key in o) {
    if (['lang', 'termLang', 'defLang', 'query', 'alphabet'].includes(key)) continue;
    const v = o[key]; if (typeof v === 'string') { if (test(v)) out.push([o, key]); } else strings(v, test, out);
  }
  return out;
}
// Hebrew nikud from Dicta's Nakdan (dicta.org.il), the professional Hebrew vocalizer, not from the language model.
const NAKDAN = process.env.NAKDAN_URL || 'https://nakdan-2-0.loadbalancer.dicta.org.il/api';
async function dicta(text){
  const r = await fetch(NAKDAN, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ task: 'nakdan', genre: 'modern', data: text, addmorph: false, keepqq: false }), signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error('nakdan ' + r.status);
  const raw = await r.json();
  if (!Array.isArray(raw)) throw new Error('nakdan shape');
  return raw.map(w => {
    if (!w || w.sep) return w ? String(w.word || '') : '';
    const o = Array.isArray(w.options) ? w.options[0] : null;
    const v = typeof o === 'string' ? o : Array.isArray(o) && typeof o[0] === 'string' ? o[0] : null;
    return v ? v.replace(/\|/g, '') : String(w.word || '');
  }).join('');
}
async function hebrewNikud(result){
  const refs = strings(result, v => HEB.test(v));
  if (!refs.length) return true;
  const src = refs.map(([o, key]) => stripNikud(o[key])), out = new Array(src.length), SEP = '\n@@@\n';
  const chunks = []; let cur = [], len = 0;
  src.forEach((t, i) => { if (len + t.length > 3500 && cur.length) { chunks.push(cur); cur = []; len = 0; } cur.push(i); len += t.length + 5; });
  if (cur.length) chunks.push(cur);
  await Promise.all(chunks.map(async ids => {
    const v = (await dicta(ids.map(i => src[i]).join(SEP))).split('@@@');
    if (v.length === ids.length) return ids.forEach((i, j) => { out[i] = v[j].replace(/^\n/, '').replace(/\n$/, ''); });
    await Promise.all(ids.map(async i => { out[i] = await dicta(src[i]); }));
  }));
  // only accept an answer whose letters are exactly the original letters
  const same = (a, b) => stripNikud(a).replace(/[^א-ת]/g, '') === stripNikud(b).replace(/[^א-ת]/g, '');
  if (!out.every((v, i) => typeof v === 'string' && same(v, src[i]))) throw new Error('nakdan mismatch');
  refs.forEach(([o, key], i) => { o[key] = out[i]; });
  return true;
}
const MARKS = {
  ar: 'Arabic tashkeel: every letter of every Arabic word carries its correct haraka (fatha, kasra, damma, sukun), plus shadda and tanwin where needed, following standard grammar (i‘rab) and the meaning in context',
  ru: 'Russian stress marks: the combining acute accent (U+0301) on the stressed vowel of every word with two or more syllables; ё always written as ё',
  ja: 'Japanese readings: after every word that contains kanji, its correct reading in hiragana in parentheses, e.g. 学校(がっこう)',
  zh: 'Chinese pinyin: after every word, its correct pinyin with tone marks in parentheses, e.g. 学校(xuéxiào)'
};
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // GET /api/generate?nikud=1 checks the connection to the Hebrew vocalizer
  if (req.method === 'GET' && req.query && req.query.nikud) {
    const t1 = Date.now(), sample = { reading: [{ title: 'הכלב של דני', text: 'דני הלך לגן עם הכלב שלו.\nהכלב רץ מהר.', questions: [{ q: 'Who found the dog? (מי מצא את הכלב?)', options: ['דני', 'אמא'] }] }] };
    try { await hebrewNikud(sample); return res.status(200).json({ ok: true, ms: Date.now() - t1, sample }); }
    catch (e) { return res.status(200).json({ ok: false, ms: Date.now() - t1, error: String(e && e.message || e) }); }
  }
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

  // Topic and story requests may use Google Search, so texts and facts follow real sources.
  // JSON mode and tools don't mix on every model, so a searched request asks for plain text and falls back to JSON mode.
  const story = b.mode === 'story', grounded = story || b.mode === 'text';
  const t0 = Date.now();
  async function ask(parts, search, maxTokens){
    const make = tools => JSON.stringify({ contents: [{ role: 'user', parts }], ...(tools ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { maxOutputTokens: maxTokens, ...(tools ? {} : { responseMimeType: 'application/json' }) } });
    let last = 503;
    for (let n = 0; n < 2; n++) for (const M of MODELS) for (const tools of search ? [true, false] : [false]) {
      if (Date.now() - t0 > 95000) break;
      try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + M.trim() + ':generateContent', {
          method: 'POST', headers: { 'x-goog-api-key': k.trim(), 'content-type': 'application/json' }, body: make(tools)
        });
        const d = await r.json().catch(() => null);
        if (!r.ok) {
          console.error(M, tools ? 'search' : '', r.status, d?.error?.message); last = r.status;
          if (tools) continue;
          if ([429, 500, 503, 404].includes(r.status)) { if (n === 0) await wait(800); continue; }
          throw { status: 503, code: 'busy' };
        }
        const t = (d?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
        const a = t.indexOf('{'), z = t.lastIndexOf('}');
        try { return JSON.parse(t.slice(a, z + 1)); } catch { console.error(M, 'bad json'); continue; }
      } catch (e) { if (e && e.code) throw e; console.error(M, e); }
    }
    throw last === 429 ? { status: 429, code: 'rate' } : { status: 503, code: 'busy' };
  }

  let result;
  try { result = await ask(parts, grounded, story ? 8000 : 16000); }
  catch (e) { return res.status(e.status || 503).json({ code: e.code || 'busy' }); }

  const grade = gradeOf(b.level), lang = String(b.lang || '').slice(0, 2), marks = {};
  // 1) other languages: a second, separate proofreading pass only for the vowel marks
  if ((story || b.mode === 'text') && MARKS[lang] && grade <= 10 && Date.now() - t0 < 70000) {
    const part = story ? { reading: result.reading } : { reading: result.reading || [], cards: result.cards || [] };
    try {
      const fixed = await ask([{ text: `You are a meticulous proofreader of learner texts. Check every word of every string below and make the ${MARKS[lang]}. Fix any mark that is wrong or missing. Do not change any word, spelling, punctuation, Hebrew text or the JSON structure. Reply ONLY the corrected JSON.\n\n` + JSON.stringify(part) }], false, 8000);
      // take a corrected string only when its words are the same as before, so the check can add marks but not rewrite text
      const base = t => t.normalize('NFD').replace(/\([^()]*\)/g, '').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/[\s\p{P}]/gu, '');
      const before = strings(part, () => true), after = strings(fixed, () => true);
      if (before.length === after.length) { before.forEach(([o, key], i) => { const v = after[i][0][after[i][1]]; if (base(v) === base(o[key])) o[key] = v; }); marks.checked = true; }
    } catch (e) { console.error('marks check', e); }
  }
  // 2) Hebrew nikud for grades 1-3 from Dicta; if it fails, the text stays without nikud rather than with wrong nikud
  const pointed = strings(result, v => HEB.test(v) && /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/.test(v)).length > 2;
  if (((story || b.mode === 'text') && grade >= 1 && grade <= 3) || (!b.mode && pointed)) {
    try { await hebrewNikud(result); marks.nikud = true; }
    catch (e) { console.error('nikud', e); strings(result, v => HEB.test(v)).forEach(([o, key]) => { o[key] = stripNikud(o[key]); }); marks.nikud = false; }
  } else strings(result, v => HEB.test(v)).forEach(([o, key]) => { o[key] = stripNikud(o[key]); });
  return res.status(200).json({ result, ...marks });
}
