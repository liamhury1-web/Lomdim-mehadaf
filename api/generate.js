// Server side of "לומדים מהדף": turns page photos or a typed topic into study material with Google Gemini (free tier).
// Needs GEMINI_API_KEY in Vercel → Settings → Environment Variables. Optional: GEMINI_MODEL (comma-separated list).
const MODELS = (process.env.GEMINI_MODEL || 'gemini-flash-latest,gemini-flash-lite-latest,gemini-2.5-flash,gemini-2.5-flash-lite').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));

const READING = `Reading passages, with comprehension questions (grade 1-2: 3-4 questions, otherwise 4-6).
Make them like real reading material: model each passage on the texts found in Israeli school textbooks, graded readers and learner websites for that grade and language (for English: the Israeli Ministry of Education curriculum and the CEFR level below). Facts (science, animals, places, history, sport) must be true; check them with Google Search when it is available. Write an original passage in that style; never copy a published text.
Questions must be good and easy: short, clear wording; most questions are answered directly by one sentence of the passage, asked in the order of the text; from grade 7 at most one inference or word-meaning question; exactly one correct option; wrong options are plausible but clearly wrong according to the text; no trick questions, no "all of the above".
- For a foreign language (English, French, Arabic...): "instructions", every question "q" and every option are in the target language; options have no translation. After the instructions and after each question add the Hebrew translation in parentheses, e.g. "Who found the dog? (מי מצא את הכלב?)". "explain" in Hebrew.
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
Multiple-choice questions (mcq and reading), in every subject:
- Exactly one option is correct; check each question against the material and the facts before writing it.
- Nothing may give the answer away: options never contain translations, hints or anything in parentheses (write "five", never "five (חמש)"); the question never contains the answer or a translation of it; in the Hebrew translation of a question keep the tested word as it is, untranslated.
- All options are the same kind of thing, in the same language and of similar length; wrong options are plausible (typical mistakes, words from the same topic), never silly; no "all/none of the above".
- Vary the position of the correct answer.
Math, physics and chemistry: every question must have exactly one correct option. Solve each one step by step before writing it, double-check the arithmetic, and put the short solution steps in "explain". Wrong options should come from typical mistakes.
Reply ONLY JSON:
{"title":"Hebrew topic, max 40 chars","termLang":"en","defLang":"he","alphabet":false,
"cards":[{"term":"","def":""}],
"mcq":[{"q":"","options":["","","",""],"answer":0,"explain":""}],
"scramble":[{"word":"","hint":""}],
"topics":[{"name":"Hebrew topic","query":"YouTube search"}],
"reading":[{"title":"","lang":"BCP-47 of the text","instructions":"","text":"passage, paragraphs split by \\n","questions":[{"q":"","options":["","","",""],"answer":0,"explain":""}]}]}
cards 6-25, mcq 6-12, scramble up to 10 single words of 3-12 letters, topics 2-3. Keep every text short. (The lesson is made separately, do not write one.) reading: [] unless asked for a reading passage or the material is itself a reading passage.
Never write Hebrew nikud yourself (it is added afterwards by a professional vocalizer). Arabic study words and sentences: full tashkeel up to grade 10.
${READING}alphabet true only if the material teaches letters.`;

const PAGES = `Study pages from a Hebrew-speaking student in Israel. Turn them into quiz material. Use only what is on the pages; for exercises you may write similar new ones, solved correctly. `;

const TEXT = `A Hebrew-speaking student in Israel wrote what they want to study. It is either a topic request (for example "questions about healthy nutrition for 8th grade") or study material they pasted. For a topic: write accurate, well-established, age-appropriate material on it, checked against reliable sources (use Google Search when it is available), at the level they asked for (default: middle school). Follow exactly what they wrote: the subject, grade, language, number of questions and the specific words or exercises they listed; do not drift to other topics. For pasted material: use only that material. Write questions and answers in Hebrew unless the request is about learning another language.
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
  // Accept the vocalized text only if it is the same text: same letters, except that pointed spelling
  // drops or adds the vowel letters ו and י (חיבור → חִבּוּר). Anything else means the answer is misaligned.
  const core = t => stripNikud(t).replace(/[^א-ת]/g, '').replace(/[וי]/g, '');
  const same = (a, b) => typeof a === 'string' && core(a) === core(b);
  await Promise.all(src.map(async (t, i) => { if (!same(out[i], t)) { console.error('nakdan retry', t.slice(0, 60)); out[i] = await dicta(t); } }));
  const bad = src.findIndex((t, i) => !same(out[i], t));
  if (bad >= 0) throw new Error('nakdan mismatch: ' + src[bad].slice(0, 80) + ' → ' + String(out[bad]).slice(0, 80));
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
    const t1 = Date.now(), sample = req.query.t ? { t: String(req.query.t).slice(0, 500) } : { reading: [{ title: 'הכלב של דני', text: 'דני הלך לגן עם הכלב שלו.\nהכלב רץ מהר.', questions: [{ q: 'Who found the dog? (מי מצא את הכלב?)', options: ['דני', 'אמא'] }] }] };
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
  } else if (b.mode === 'word') {
    const w = String(b.word || '').slice(0, 60), ctx = String(b.sentence || '').slice(0, 400);
    if (!w.trim()) return res.status(400).json({ code: 'bad_request' });
    parts.push({ text: `A Hebrew-speaking student reading a ${LANG_NAMES[String(b.lang || '').slice(0, 2)] || ''} text tapped the word "${w}" in this sentence: "${ctx}".
Give its Hebrew translation as used in this sentence (1-4 words), and its dictionary form in the original language (e.g. infinitive or singular).
Reply ONLY JSON: {"tr":"","base":""}` });
  } else if (b.mode === 'verify') { /* handled below */
  } else if (b.mode === 'lesson') parts.push({ text: LESSON + String(b.material || '').slice(0, 12000) });
  else if (b.mode === 'text') {
    const t = String(b.text || '').trim().slice(0, 12000);
    const subject = String(b.subject || '').slice(0, 40), level = String(b.level || '').slice(0, 40), lang = String(b.lang || '').slice(0, 12);
    if (t.length < 3 && !subject && (!lang || lang === 'he')) return res.status(400).json({ code: 'bad_request' });
    const extra = [subject && 'Subject: ' + subject, level && 'Level: ' + level,
      lang && lang !== 'he' && 'Target language: ' + lang + ' (write the study content, words, sentences and texts in this language; explanations stay in Hebrew)',
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
  // Google Search only where texts must follow real sources (stories); it makes a request much slower
  const story = b.mode === 'story', grounded = story || (b.mode === 'text' && !!b.reading);
  const t0 = Date.now();
  // A small thinking budget keeps answers fast but still checked; models that reject the setting get the request without it.
  let thinkOk = true;
  let usedModel = '';
  async function ask(parts, search, maxTokens, think = 1024, order = MODELS){
    const make = tools => JSON.stringify({ contents: [{ role: 'user', parts }], ...(tools ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { maxOutputTokens: maxTokens, ...(tools ? {} : { responseMimeType: 'application/json' }), ...(thinkOk ? { thinkingConfig: { thinkingBudget: think } } : {}) } });
    let last = 503;
    for (let n = 0; n < 2; n++) for (const M of order) for (const tools of search ? [true, false] : [false]) {
      if (Date.now() - t0 > 95000) break;
      try {
        const send = () => fetch('https://generativelanguage.googleapis.com/v1beta/models/' + M.trim() + ':generateContent', {
          method: 'POST', headers: { 'x-goog-api-key': k.trim(), 'content-type': 'application/json' }, body: make(tools)
        });
        let r = await send(), d = await r.json().catch(() => null);
        if (r.status === 400 && thinkOk && /thinking/i.test(d?.error?.message || '')) { thinkOk = false; r = await send(); d = await r.json().catch(() => null); }
        if (!r.ok) {
          console.error(M, tools ? 'search' : '', r.status, d?.error?.message); last = r.status;
          if (tools) continue;
          if ([429, 500, 503, 404].includes(r.status)) { if (n === 0) await wait(800); continue; }
          throw { status: 503, code: 'busy' };
        }
        const t = (d?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
        const a = t.indexOf('{'), z = t.lastIndexOf('}');
        try { const j = JSON.parse(t.slice(a, z + 1)); usedModel = M.trim(); return j; } catch { console.error(M, 'bad json'); continue; }
      } catch (e) { if (e && e.code) throw e; console.error(M, e); }
    }
    throw last === 429 ? { status: 429, code: 'rate' } : { status: 503, code: 'busy' };
  }

  if (b.mode === 'verify') return verify();

  // A second model, not the one that wrote the set, solves every question blind. Where the two disagree,
  // a third call sees both answers and decides; a question nobody can settle is removed.
  async function verify(){
    const S = (v, n) => String(v == null ? '' : v).slice(0, n);
    const qs = (Array.isArray(b.qs) ? b.qs : []).slice(0, 45).map(q => ({ id: S(q.id, 40), q: S(q.q, 700), o: (Array.isArray(q.o) ? q.o : []).slice(0, 6).map(x => S(x, 250)), a: Number(q.a), ctx: S(q.ctx, 40) }))
      .filter(q => q.id && q.q && q.o.length >= 2 && Number.isInteger(q.a));
    const cards = (Array.isArray(b.cards) ? b.cards : []).slice(0, 45).map(c => ({ id: S(c.id, 40), t: S(c.t, 200), d: S(c.d, 300) })).filter(c => c.id && c.t && c.d);
    const texts = (Array.isArray(b.texts) ? b.texts : []).slice(0, 4).map(r => ({ id: S(r.id, 40), text: S(r.text, 5000) }));
    if (!qs.length && !cards.length) return res.status(200).json({ changes: { q: [], cards: [] }, checked: 0 });
    const avoid = S(b.model, 60);
    // the checker is a different model than the writer, the stronger (non-lite) ones first
    const lite = m => /lite/.test(m) ? 1 : 0;
    const order = [...MODELS.filter(m => m.trim() !== avoid).sort((x, y) => lite(x) - lite(y)), ...MODELS.filter(m => m.trim() === avoid)];
    const passages = texts.length ? 'Reading passages (answer their questions only from the passage):\n' + texts.map(r => `[${r.id}]\n${r.text}`).join('\n\n') + '\n\n' : '';
    try {
      const one = await ask([{ text: `You are checking study material that another AI wrote for a Hebrew-speaking student${b.level ? ' (' + S(b.level, 30) + ')' : ''}. Work independently and carefully.
1) Solve every multiple-choice question yourself (math step by step) and give the index (0-based) of the correct option. "clear": false if the question is ambiguous, has no correct option, or has more than one correct option.
2) Check every flashcard: is the definition or translation correct for the term? List only wrong ones, with the correct definition in the same language as the old one.
${passages}Questions:
${qs.map(q => `[${q.id}]${q.ctx ? ' (passage ' + q.ctx + ')' : ''} ${q.q}\n${q.o.map((o, i) => `  ${i}) ${o}`).join('\n')}`).join('\n')}
Flashcards:
${cards.map(c => `[${c.id}] ${c.t} = ${c.d}`).join('\n')}
Reply ONLY JSON: {"answers":[{"id":"","answer":0,"clear":true}],"badCards":[{"id":"","def":""}]}` }], false, 6000, 2048, order);
      const mine = new Map((Array.isArray(one.answers) ? one.answers : []).map(x => [S(x && x.id, 40), x]));
      const disputed = qs.filter(q => { const x = mine.get(q.id); return x && (Number(x.answer) !== q.a || x.clear === false); });
      const badCards = (Array.isArray(one.badCards) ? one.badCards : []).map(x => ({ id: S(x && x.id, 40), def: S(x && x.def, 300) })).filter(x => x.def && cards.some(c => c.id === x.id));
      const changes = { q: [], cards: [] };
      if (disputed.length || badCards.length) {
        const two = await ask([{ text: `Two AI checkers disagree about this study material for a Hebrew-speaking student. Decide carefully what is correct (math step by step).
For each question: give the index (0-based) of the one correct option, or -1 if the question is ambiguous, has no correct option or more than one.
For each flashcard: "old" if the old definition is correct, "new" if the proposed one is correct.
${passages}Questions:
${disputed.map(q => { const x = mine.get(q.id); return `[${q.id}]${q.ctx ? ' (passage ' + q.ctx + ')' : ''} ${q.q}\n${q.o.map((o, i) => `  ${i}) ${o}`).join('\n')}\n  checker A says ${q.a}; checker B says ${x.clear === false ? 'unclear' : Number(x.answer)}`; }).join('\n')}
Flashcards:
${badCards.map(x => { const c = cards.find(c => c.id === x.id); return `[${x.id}] ${c.t} | old: ${c.d} | proposed: ${x.def}`; }).join('\n')}
Reply ONLY JSON: {"questions":[{"id":"","answer":0}],"cards":[{"id":"","pick":"old"}]}` }], false, 4000, 2048);
        const verdict = new Map((Array.isArray(two.questions) ? two.questions : []).map(x => [S(x && x.id, 40), Number(x && x.answer)]));
        disputed.forEach(q => {
          const v = verdict.get(q.id);
          if (v === q.a) return;
          if (Number.isInteger(v) && v >= 0 && v < q.o.length) changes.q.push({ id: q.id, a: v });
          else changes.q.push({ id: q.id, drop: true });
        });
        const cv = new Map((Array.isArray(two.cards) ? two.cards : []).map(x => [S(x && x.id, 40), S(x && x.pick, 5)]));
        badCards.forEach(x => { if (cv.get(x.id) === 'new') changes.cards.push({ id: x.id, d: x.def }); });
      }
      return res.status(200).json({ changes, checked: qs.length + cards.length });
    } catch (e) { return res.status(e.status || 503).json({ code: e.code || 'busy' }); }
  }

  let result;
  try { result = await ask(parts, grounded, b.mode === 'word' ? 300 : story ? 6000 : 8192, b.mode === 'word' ? 0 : b.mode === 'explain' ? 512 : 1024); }
  catch (e) { return res.status(e.status || 503).json({ code: e.code || 'busy' }); }

  const grade = gradeOf(b.level), lang = String(b.lang || '').slice(0, 2), marks = {};
  // 1) other languages: a second, separate proofreading pass only for the vowel marks
  if ((story || b.mode === 'text') && MARKS[lang] && grade <= 10 && Date.now() - t0 < 70000) {
    const part = story ? { reading: result.reading } : { reading: result.reading || [], cards: result.cards || [] };
    try {
      const fixed = await ask([{ text: `You are a meticulous proofreader of learner texts. Check every word of every string below and make the ${MARKS[lang]}. Fix any mark that is wrong or missing. Do not change any word, spelling, punctuation, Hebrew text or the JSON structure. Reply ONLY the corrected JSON.\n\n` + JSON.stringify(part) }], false, 6000, 512);
      // take a corrected string only when its words are the same as before, so the check can add marks but not rewrite text
      const base = t => t.normalize('NFD').replace(/\([^()]*\)/g, '').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/[\s\p{P}]/gu, '');
      const before = strings(part, () => true), after = strings(fixed, () => true);
      if (before.length === after.length) { before.forEach(([o, key], i) => { const v = after[i][0][after[i][1]]; if (base(v) === base(o[key])) o[key] = v; }); marks.checked = true; }
    } catch (e) { console.error('marks check', e); }
  }
  // 2) Hebrew nikud for grades 1-3 from Dicta; if it fails, the text stays without nikud rather than with wrong nikud
  const pointed = strings(result, v => HEB.test(v) && /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/.test(v)).length > 2;
  if (((story || b.mode === 'text') && grade >= 1 && grade <= 3) || ((b.mode === 'pages' || !b.mode) && pointed)) {
    try { await hebrewNikud(result); marks.nikud = true; }
    catch (e) { console.error('nikud', e); strings(result, v => HEB.test(v)).forEach(([o, key]) => { o[key] = stripNikud(o[key]); }); marks.nikud = false; }
  } else strings(result, v => HEB.test(v)).forEach(([o, key]) => { o[key] = stripNikud(o[key]); });
  return res.status(200).json({ result, model: usedModel, ...marks });
}
