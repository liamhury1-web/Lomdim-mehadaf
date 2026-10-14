const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
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
{"lesson":[{"title":"Hebrew section heading","body
