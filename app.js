(function(){
'use strict';
const app = document.getElementById('app');

/* ---------------- helpers ---------------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rid = () => Math.random().toString(36).slice(2, 10);
const SUBJECTS = ['מתמטיקה', 'אנגלית', 'עברית ולשון', 'מדעים', 'פיזיקה', 'כימיה', 'ביולוגיה', 'היסטוריה', 'גאוגרפיה', 'תנ״ך', 'אזרחות', 'ספרות', 'ערבית', 'צרפתית', 'ספרדית', 'מחשבים ותכנות', 'תזונה ובריאות', 'ידע כללי'];
const LEVELS = ['כיתה א׳', 'כיתה ב׳', 'כיתה ג׳', 'כיתה ד׳', 'כיתה ה׳', 'כיתה ו׳', 'כיתה ז׳', 'כיתה ח׳', 'כיתה ט׳', 'כיתה י׳', 'כיתה י״א', 'כיתה י״ב', 'אוניברסיטה', 'מבוגרים'];
const LANGS = [['he', 'עברית'], ['en', 'English'], ['ar', 'العربية'], ['fr', 'Français'], ['es', 'Español'], ['ru', 'Русский'], ['de', 'Deutsch'], ['it', 'Italiano'], ['pt', 'Português'], ['am', 'አማርኛ'], ['zh', '中文'], ['ja', '日本語']];
const isRtl = s => /[֐-׿؀-ۿ]/.test(s);
const lettersOnly = /^\p{L}{2,14}$/u;
let toastT;
function toast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200); }
let cleanup = null;
function leave(){
  app.onchange = null; app.onsubmit = null;
  if (cleanup) { try { cleanup(); } catch(e){} cleanup = null; }
  stopSpeech();
  window.scrollTo(0, 0);
}
function tint(c){ if (c === undefined || c === null) delete app.dataset.c; else app.dataset.c = String(c); }

const I = {
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="4"/></svg>',
  img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  say:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
  cards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 012 2v12"/></svg>',
  abc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="7" r="2.5"/><path d="M11 7h10M11 17h10"/><circle cx="6" cy="17" r="2.5"/></svg>',
  match:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4a3 3 0 013 3V14" stroke-linecap="round"/></svg>',
  scr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2" y="8" width="6" height="8" rx="1.5"/><rect x="9" y="8" width="6" height="8" rx="1.5"/><rect x="16" y="8" width="6" height="8" rx="1.5"/></svg>',
  pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
  Aa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 19l5-14 5 14M4 14h6"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M21 12v7"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M8 7h7M8 11h5"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>'
};

/* ---------------- the app's pencil friend ---------------- */
function mascot(mood){
  const eyes = mood === 'happy' ? '<path d="M24 41q3-4 6 0M34 41q3-4 6 0" stroke="#2a2f3d" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    : mood === 'think' ? '<circle cx="27" cy="39" r="3" fill="#2a2f3d"/><circle cx="37" cy="39" r="3" fill="#2a2f3d"/><circle cx="28" cy="38" r="1" fill="#fff"/><circle cx="38" cy="38" r="1" fill="#fff"/>'
    : '<circle cx="27" cy="41" r="3.2" fill="#2a2f3d"/><circle cx="37" cy="41" r="3.2" fill="#2a2f3d"/><circle cx="28.2" cy="39.8" r="1.1" fill="#fff"/><circle cx="38.2" cy="39.8" r="1.1" fill="#fff"/>';
  const mouth = mood === 'think' ? '<ellipse cx="32" cy="50" rx="2.6" ry="2.2" fill="#2a2f3d"/>' : mood === 'happy' ? '<path d="M25 48q7 9 14 0z" fill="#2a2f3d"/><path d="M28 51q4 3 8 0" fill="#ff7a8a"/>' : '<path d="M26 49q6 6 12 0" stroke="#2a2f3d" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  return `<svg class="mascot ${mood || ''}" viewBox="0 0 64 104" aria-hidden="true">
    <rect x="17" y="4" width="30" height="14" rx="6" fill="#ff8fab"/><rect x="17" y="15" width="30" height="8" fill="#c7cdd9"/><rect x="17" y="17.5" width="30" height="2" fill="#aab2c2"/>
    <rect x="17" y="23" width="30" height="50" fill="#ffc93c"/><rect x="27" y="23" width="10" height="50" fill="#ffd866"/>
    <path d="M17 73h30l-15 25z" fill="#f3cf9c"/><path d="M27.5 90.5h9L32 98z" fill="#3a3f4b"/>
    <circle cx="22" cy="48" r="3" fill="#ff8fab" opacity=".55"/><circle cx="42" cy="48" r="3" fill="#ff8fab" opacity=".55"/>
    ${eyes}${mouth}</svg>`;
}
function confetti(){
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch(e){}
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = Array.from({ length: 40 }, (_, i) => `<i data-c="${i % 6}" style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .5}s;animation-duration:${1.6 + Math.random()}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  document.body.appendChild(box); setTimeout(() => box.remove(), 3200);
}

/* ---------------- speech ---------------- */
// A natural voice made on the server (Gemini text-to-speech, kept on the phone after the first time),
// and the phone's own best voice when the server voice is not available.
const canSpeak = (() => { try { return 'speechSynthesis' in window || typeof Audio !== 'undefined'; } catch(e){ return false; } })();
function guessLang(text, hint){
  if (hint) return String(hint).slice(0, 2).toLowerCase();
  const t = String(text);
  if (/[؀-ۿ]/.test(t)) return 'ar'; if (/[֐-׿]/.test(t)) return 'he';
  if (/[Ѐ-ӿ]/.test(t)) return 'ru'; if (/[぀-ヿ]/.test(t)) return 'ja';
  if (/[一-鿿]/.test(t)) return 'zh'; if (/[ሀ-፿]/.test(t)) return 'am';
  return 'en';
}
let voices = [];
try { const lv = () => { voices = speechSynthesis.getVoices() || []; }; lv(); speechSynthesis.onvoiceschanged = lv; } catch(e){}
function bestVoice(lang){
  const score = v => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 3 : 0) + (/enhanced|premium|siri/i.test(v.name) ? 3 : 0) + (v.localService === false ? 1 : 0);
  return voices.filter(v => String(v.lang).toLowerCase().replace('_', '-').startsWith(lang)).sort((x, y) => score(y) - score(x))[0] || null;
}
function speakLocal(text, lang){
  try {
    if (!('speechSynthesis' in window)) return Promise.resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = .92;
    const v = bestVoice(lang); if (v) u.voice = v;
    return new Promise(res => { u.onend = u.onerror = () => res(); speechSynthesis.speak(u); setTimeout(res, 60000); });
  } catch(e){ return Promise.resolve(); }
}
let player = null, speakSeq = 0, ttsFails = 0;
function stopSpeech(){ speakSeq++; try { speechSynthesis.cancel(); } catch(e){} if (player) { try { player.pause(); } catch(e){} player = null; } }
function chunksOf(text){
  const out = []; let cur = '';
  for (const piece of String(text).replace(/([.!?…؟。\n])\s+/g, '$1\u0001').split('\u0001')) {
    if (cur && (cur + ' ' + piece).length > 380) { out.push(cur); cur = ''; }
    cur = cur ? cur + ' ' + piece : piece;
    while (cur.length > 420) { out.push(cur.slice(0, 400)); cur = cur.slice(400); }
  }
  if (cur.trim()) out.push(cur);
  return out;
}
async function ttsBlob(text, lang){
  const key = new Request(location.origin + '/__tts/' + lang + '/' + encodeURIComponent(text).slice(0, 1800));
  let cache = null;
  try { cache = await caches.open('lomdim-tts'); const hit = await cache.match(key); if (hit) return await hit.blob(); } catch(e){}
  if (ttsFails >= 3 || navigator.onLine === false) return null;
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch('/api/tts', { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, lang }) });
    if (!r.ok) { ttsFails++; return null; }
    const blob = await r.blob(); ttsFails = 0;
    try { if (cache) await cache.put(key, new Response(blob, { headers: { 'content-type': 'audio/wav' } })); } catch(e){}
    return blob;
  } catch(e) { ttsFails++; return null; } finally { clearTimeout(t); }
}
function playBlob(blob){
  return new Promise(res => {
    const url = URL.createObjectURL(blob), a = new Audio(url); player = a;
    const done = ok => { URL.revokeObjectURL(url); res(ok); };
    a.onended = () => done(true); a.onerror = () => done(false);
    a.play().catch(() => done(false));
  });
}
async function speak(text, lang){
  if (!canSpeak || !String(text).trim()) return;
  ttsUsed = true;
  stopSpeech(); const my = speakSeq;
  lang = guessLang(text, lang);
  const parts = chunksOf(text);
  let next = ttsBlob(parts[0], lang);
  for (let i = 0; i < parts.length; i++) {
    const blob = await next;
    if (my !== speakSeq) return;
    if (i + 1 < parts.length) next = ttsBlob(parts[i + 1], lang);
    if (!blob || !(await playBlob(blob))) { if (my === speakSeq) return speakLocal(parts.slice(i).join(' '), lang); return; }
    if (my !== speakSeq) return;
  }
}
const sayBtn = (text, lang, cls = 'iconbtn') => canSpeak ? `<button class="${cls} say" type="button" data-say="${esc(text)}" data-lang="${esc(lang || '')}" aria-label="השמע">${I.say}</button>` : '';
document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { e.stopPropagation(); b.classList.add('busy'); speak(b.dataset.say, b.dataset.lang).finally(() => b.classList.remove('busy')); } }, true);

/* ---------------- storage (on this device) ---------------- */
const LKEY = 'lomdim_sets_v1', CODEKEY = 'lomdim_access_code';
function lget(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lset(k, v){ try { localStorage.setItem(k, v); return true; } catch(e){ return false; } }
let sets = [];
// if loading ever fails, keep a copy of what was saved so nothing is lost when the app saves again
sets = (() => { try { return (JSON.parse(lget(LKEY) || '[]') || []).map(fixSet); } catch(e){ const raw = lget(LKEY); if (raw) lset(LKEY + '_rescue', raw); return []; } })();
sets.sort((a, b) => (b.updated || 0) - (a.updated || 0));
function persist(){ if (!lset(LKEY, JSON.stringify(sets))) toast('אין מספיק מקום לשמור במכשיר'); }
function saveSet(s){ s.updated = Date.now(); if (!sets.includes(s)) sets.unshift(s); persist(); }
let saveT; function saveSoon(s){ clearTimeout(saveT); saveT = setTimeout(() => saveSet(s), 700); }
function removeSet(s){ sets = sets.filter(x => x !== s); persist(); }
function getSet(id){ return sets.find(s => s.id === id); }
function fixSet(s){
  s = s || {};
  const arr = v => Array.isArray(v) ? v : [];
  if (Array.isArray(s.mcq)) cleanQs(s.mcq);
  if (Array.isArray(s.reading)) s.reading.forEach(r => r && Array.isArray(r.q) && cleanQs(r.q));
  return { id: s.id || ('s' + rid()), title: s.title || 'סט ללא שם', created: s.created || Date.now(), updated: s.updated || Date.now(),
    color: Number.isInteger(s.color) ? Math.abs(s.color) % 6 : sets.length % 6,
    termLang: s.termLang || '', defLang: s.defLang || '', alphabet: !!s.alphabet, example: !!s.example,
    cards: arr(s.cards), mcq: arr(s.mcq), scr: arr(s.scr), topics: arr(s.topics), lesson: arr(s.lesson), reading: arr(s.reading),
    known: s.known && typeof s.known === 'object' ? s.known : {}, best: s.best && typeof s.best === 'object' ? s.best : {},
    srs: s.srs && typeof s.srs === 'object' ? s.srs : {}, folder: typeof s.folder === 'string' ? s.folder.slice(0, 40) : '', last: typeof s.last === 'string' ? s.last : '', nextStory: s.nextStory && s.nextStory.r ? s.nextStory : undefined, vok: s.vok && typeof s.vok === 'object' ? s.vok : {}, wordTr: s.wordTr && typeof s.wordTr === 'object' ? s.wordTr : {}, level: typeof s.level === 'string' ? s.level.slice(0, 30) : '', learn: typeof s.learn === 'string' ? s.learn.slice(0, 5) : '', challenge: s.challenge && typeof s.challenge === 'object' ? s.challenge : null };
}

/* An option like "five (חמש)" gives the answer away: drop a bracketed part written in another script than the option itself. */
// function declarations, not consts: fixSet() uses these while saved sets load at startup
function scriptOf(t){ return /[\u0590-\u05FF]/.test(t) ? 'he' : /[\u0600-\u06FF]/.test(t) ? 'ar' : /\p{L}/u.test(t) ? 'x' : ''; }
// no answer keeps a bracketed part at its end (a translation or hint there gives the answer away);
// in math, brackets are part of the answer, so there only a bracket in another language is removed
function cleanOpt(o){
  const m = String(o).match(/^(.*?\S)(\s*)[(（]([^()（）]+)[)）]\s*$/);
  if (!m || !/[\p{L}\p{N}]/u.test(m[3])) return o;
  const math = /[=+\-×÷*/^²³√<>≤≥]|\d\s*[a-z]\b/i.test(o), a = scriptOf(m[1]), b = scriptOf(m[3]), other = a && b && a !== b;
  return other || (!math && m[2]) ? m[1] : o;
}
function cleanQs(qs){ qs.forEach(m => { if (m && Array.isArray(m.o)) m.o = m.o.map(cleanOpt); }); }
/* ---------------- shaping the AI answer ---------------- */
function normalize(r){
  const o = r && typeof r === 'object' && !Array.isArray(r) ? r : {};
  const str = v => typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : '');
  const arr = v => Array.isArray(v) ? v : [];
  return {
    title: str(o.title).slice(0, 60),
    termLang: str(o.termLang).slice(0, 12), defLang: str(o.defLang).slice(0, 12), alphabet: o.alphabet === true,
    cards: arr(o.cards).map(c => ({ t: str(c && c.term), d: str(c && c.def) })).filter(c => c.t && c.d),
    mcq: arr(o.mcq).map(m => { const opts = arr(m && m.options).map(str).map(cleanOpt).filter(Boolean); return { q: str(m && m.q), o: opts, a: Number(m && m.answer), x: str(m && m.explain) }; })
      .filter(m => m.q && m.o.length >= 2 && m.o.length <= 6 && Number.isInteger(m.a) && m.a >= 0 && m.a < m.o.length),
    scr: arr(o.scramble).map(s => ({ w: str(s && s.word), h: str(s && s.hint) })).filter(s => lettersOnly.test(s.w)),
    topics: arr(o.topics).map(t => ({ name: str(t && t.name).slice(0, 80), q: str(t && t.query).slice(0, 120) })).filter(t => t.name && t.q),
    lesson: arr(o.lesson).map(x => ({ h: str(x && x.title).slice(0, 100), b: str(x && x.body).slice(0, 3000) })).filter(x => x.h && x.b),
    reading: (Array.isArray(o.reading) ? o.reading : (o.reading ? [o.reading] : [])).map(r => ({
      title: str(r && r.title).slice(0, 100), lang: str(r && r.lang).slice(0, 12), text: str(r && r.text).slice(0, 6000), instr: str(r && r.instructions).slice(0, 300),
      q: arr(r && r.questions).map(m => { const opts = arr(m && m.options).map(str).map(cleanOpt).filter(Boolean); return { q: str(m && m.q), o: opts, a: Number(m && m.answer), x: str(m && m.explain) }; })
        .filter(m => m.q && m.o.length >= 2 && m.o.length <= 6 && Number.isInteger(m.a) && m.a >= 0 && m.a < m.o.length)
    })).filter(r => r.text.length > 40)
  };
}
function mergeInto(s, p){
  if (!s.title || s.title === 'סט ללא שם') s.title = p.title || s.title;
  s.termLang = s.termLang || p.termLang; s.defLang = s.defLang || p.defLang; s.alphabet = s.alphabet || p.alphabet;
  const ck = new Set(s.cards.map(c => c.t.toLowerCase()));
  (p.cards || []).forEach(c => { const k = c.t.toLowerCase(); if (!ck.has(k)) { ck.add(k); s.cards.push({ id: 'c' + rid(), t: c.t, d: c.d }); } });
  const qk = new Set(s.mcq.map(m => m.q));
  (p.mcq || []).forEach(m => { if (!qk.has(m.q)) { qk.add(m.q); s.mcq.push({ id: 'q' + rid(), q: m.q, o: m.o, a: m.a, x: m.x }); } });
  const sk = new Set(s.scr.map(x => x.w.toLowerCase()));
  (p.scr || []).forEach(x => { const k = x.w.toLowerCase(); if (!sk.has(k)) { sk.add(k); s.scr.push({ id: 'w' + rid(), w: x.w, h: x.h }); } });
  const tk = new Set(s.topics.map(t => t.name));
  (p.topics || []).forEach(t => { if (!tk.has(t.name)) { tk.add(t.name); s.topics.push(t); } });
  (p.lesson || []).forEach(x => s.lesson.push(x));
  (p.reading || []).forEach(r => s.reading.push({ id: 'r' + rid(), ...r }));
}

/* ---------------- server calls ---------------- */
const ERR = {
  need_code:'צריך קוד גישה כדי ליצור סטים.',
  rate:'היו הרבה בקשות בזמן קצר. נסה שוב בעוד כמה דקות.',
  busy:'השירות עמוס כרגע. נסה שוב בעוד דקה.',
  bad_json:'התשובה הגיעה משובשת. לחץ שוב על "צור תרגול".',
  too_big:'התמונות גדולות מדי. נסה פחות דפים בבת אחת.',
  no_key:'האפליקציה עוד לא הוגדרה: חסר מפתח API בשרת.',
  offline:'אין חיבור לאינטרנט. התרגול עובד גם בלי אינטרנט, אבל יצירת סט צריכה חיבור.',
  no_server:'לא נמצא שרת. האפליקציה צריכה לרוץ מכתובת האתר שלה, לא כקובץ מקומי.'
};
const errText = e => ERR[e && e.code] || 'משהו השתבש. נסה שוב.';
async function callApi(payload, signal){
  let r;
  try {
    r = await fetch('/api/generate', { method: 'POST', signal,
      headers: { 'content-type': 'application/json', 'x-access-code': lget(CODEKEY) || '' }, body: JSON.stringify(payload) });
  } catch(e) {
    if (e && e.name === 'AbortError') throw e;
    const err = new Error('net'); err.code = navigator.onLine === false ? 'offline' : 'no_server'; throw err;
  }
  let data = null; try { data = await r.json(); } catch(e){}
  if (!r.ok) {
    const err = new Error('api'); err.code = (data && data.code) || (r.status === 404 ? 'no_server' : r.status === 413 ? 'too_big' : 'server'); throw err;
  }
  return data;
}
function blobToB64(blob){ return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = rej; fr.readAsDataURL(blob); }); }
async function prepImage(file){
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const max = 1600, s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .82));
    if (blob) return { type: 'image/jpeg', data: await blobToB64(blob) };
  } catch(e){}
  return { type: /^image\/(jpeg|png|webp|gif)$/.test(file.type) ? file.type : 'image/jpeg', data: await blobToB64(file) };
}

/* ---------------- photo check and editing ---------------- */
async function loadBitmap(file){
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch(e) { return await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); }
}
// sharpness: how much the brightness changes between neighbouring pixels (Laplacian variance) on a small copy
async function blurScore(file){
  try {
    const bmp = await loadBitmap(file), w = 360, h = Math.max(1, Math.round(bmp.height * w / bmp.width));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(bmp, 0, 0, w, h);
    const px = cx.getImageData(0, 0, w, h).data, g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = .299 * px[i * 4] + .587 * px[i * 4 + 1] + .114 * px[i * 4 + 2];
    let sum = 0, sq = 0, n = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      sum += l; sq += l * l; n++;
    }
    const m = sum / n; return sq / n - m * m;
  } catch(e) { return null; }
}
const BLURRY = 70;
function checkPage(p){ blurScore(p.file).then(v => { p.blurry = v != null && v < BLURRY; if (curView === 'create' && typeof redrawPages === 'function') redrawPages(); }); }
let redrawPages = null;

/* ---------------- share links (the whole set travels inside the link) ---------------- */
function b64url(bytes){ let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64url(str){ str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const b = atob(str); const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; }
async function encodeSet(s){
  const slim = { t: s.title, tl: s.termLang, dl: s.defLang, a: s.alphabet ? 1 : 0, k: s.color,
    c: s.cards.map(c => [c.t, c.d]), q: s.mcq.map(m => [m.q, m.o, m.a, m.x]), w: s.scr.map(x => [x.w, x.h]),
    tp: s.topics.map(t => [t.name, t.q]), l: s.lesson.map(x => [x.h, x.b]),
    r: s.reading.map(r => [r.title, r.lang, r.text, r.q.map(m => [m.q, m.o, m.a, m.x]), r.instr || '']),
    ch: { n: lget('lomdim_name') || '', m: s.best.matchTime || null, t: s.best.test == null ? null : s.best.test }, f: s.folder || '' };
  const bytes = new TextEncoder().encode(JSON.stringify(slim));
  if ('CompressionStream' in window) {
    try { const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')); return 'z' + b64url(new Uint8Array(await new Response(st).arrayBuffer())); } catch(e){}
  }
  return 'j' + b64url(bytes);
}
async function decodeSet(str){
  const kind = str[0], bytes = unb64url(str.slice(1));
  let raw;
  if (kind === 'z') { const st = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); raw = new Uint8Array(await new Response(st).arrayBuffer()); }
  else raw = bytes;
  const o = JSON.parse(new TextDecoder().decode(raw));
  const arr = v => Array.isArray(v) ? v : [];
  const s = fixSet({ title: String(o.t || 'סט משותף').slice(0, 60), termLang: o.tl, defLang: o.dl, alphabet: !!o.a, color: Number.isInteger(o.k) ? o.k : 0, folder: String(o.f || '') });
  if (o.ch && (o.ch.m || o.ch.t != null)) s.challenge = { n: String(o.ch.n || '').slice(0, 30), m: typeof o.ch.m === 'number' ? o.ch.m : null, t: typeof o.ch.t === 'number' ? o.ch.t : null };
  mergeInto(s, normalize({
    cards: arr(o.c).map(x => ({ term: x[0], def: x[1] })), mcq: arr(o.q).map(x => ({ q: x[0], options: x[1], answer: x[2], explain: x[3] })),
    scramble: arr(o.w).map(x => ({ word: x[0], hint: x[1] })), topics: arr(o.tp).map(x => ({ name: x[0], query: x[1] })), lesson: arr(o.l).map(x => ({ title: x[0], body: x[1] })),
    reading: arr(o.r).map(x => ({ title: x[0], lang: x[1], text: x[2], instructions: x[4] || '', questions: arr(x[3]).map(m => ({ q: m[0], options: m[1], answer: m[2], explain: m[3] })) }))
  }));
  return s;
}
async function shareSet(s){
  if (!lget('lomdim_name')) { const n = prompt('איך לקרוא לך באתגר? (החבר יראה את השם ואת השיאים שלך)', ''); if (n && n.trim()) lset('lomdim_name', n.trim().slice(0, 30)); }
  let url, data;
  try { data = await encodeSet(s); url = location.origin + '/#s=' + data; } catch(e) { return toast('לא הצלחתי ליצור קישור'); }
  // a short link (the set is kept on the server under a 6-letter code); the long link still works without it
  try { const r = await fetch('/api/room', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'put', data }) });
    const d = await r.json(); if (r.ok && d.code) url = location.origin + '/#k=' + d.code; } catch(e){}
  const chText = (s.best.test != null || s.best.matchTime) ? ' · נסה לשבור את השיא שלי!' : '';
  if (navigator.share) { try { await navigator.share({ title: s.title, text: 'סט לתרגול: ' + s.title + chText, url }); return; } catch(e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('הקישור הועתק'); } catch(e) { prompt('העתק את הקישור:', url); }
}

/* ---------------- install to home screen ---------------- */
let installEvt = null;
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (curView === 'home') viewHome(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('האפליקציה הותקנה'); if (curView === 'home') viewHome(); });
function installHtml(){
  if (isStandalone() || lget('lomdim_install_hide')) return '';
  if (installEvt) return `<div class="install"><img src="/icon-192.png" alt=""><div class="grow"><strong>התקן את האפליקציה</strong><p class="small muted">אייקון במסך הבית, פותח במסך מלא.</p></div><button class="btn primary" data-a="install">התקן</button></div>`;
  if (isIOS) return `<div class="install"><img src="/icon-192.png" alt=""><div class="grow"><strong>הוסף למסך הבית</strong><p class="small muted">ב-Safari: כפתור השיתוף ואז "הוסף למסך הבית".</p></div><button class="iconbtn" data-a="hideinstall" aria-label="סגור">${I.close}</button></div>`;
  return '';
}

/* ---------------- file pickers ---------------- */
let onPicked = null;
['pickCam', 'pickGal'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('change', () => { const files = [...(el.files || [])]; el.value = ''; if (onPicked && files.length) onPicked(files); });
});
let onPickedJson = null;
(() => { const el = document.createElement('input'); el.type = 'file'; el.accept = '.json,application/json'; el.id = 'pickJson'; el.className = 'vh'; el.tabIndex = -1;
  el.addEventListener('change', () => { const f = el.files && el.files[0]; el.value = ''; if (f && onPickedJson) onPickedJson(f); }); document.body.appendChild(el); })();
function openPicker(which){ const el = document.getElementById(which === 'cam' ? 'pickCam' : 'pickGal'); el.value = ''; el.click(); }


/* ---------------- mini games while waiting ---------------- */
const GAMES = [['bub', 'בועות'], ['math', 'חשבון מהיר'], ['simon', 'זיכרון צבעים']];
function gameZone(){
  let last = lget('lomdim_game') || 'bub';
  if (!GAMES.some(g => g[0] === last)) last = 'bub';
  return `<section class="gamezone" id="gz">
    <div class="row between"><strong>משחק בזמן שמחכים</strong><span class="small muted count" id="gscore"></span></div>
    <div class="gtabs" role="tablist">${GAMES.map(([id, n], i) => `<button type="button" role="tab" data-c="${[1, 3, 4][i]}" data-g="${id}" aria-selected="${id === last}">${n}</button>`).join('')}</div>
    <div class="garea" id="garea"></div>
  </section>`;
}
function startGames(){
  const gz = document.getElementById('gz'); if (!gz) return () => {};
  const area = document.getElementById('garea'), scoreEl = document.getElementById('gscore');
  let stopCur = () => {};
  const best = id => +(lget('lomdim_best_' + id) || 0);
  function show(score, id){
    if (score > best(id)) lset('lomdim_best_' + id, String(score));
    scoreEl.textContent = 'ניקוד ' + score + ' · שיא ' + Math.max(best(id), score);
  }
  function run(id){
    stopCur(); lset('lomdim_game', id);
    gz.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.g === id)));
    area.innerHTML = ''; area.onclick = null;
    stopCur = ({ bub: gameBubbles, math: gameMath, simon: gameSimon })[id](area, sc => show(sc, id));
  }
  gz.addEventListener('click', e => { const t = e.target.closest('[data-g]'); if (t) run(t.dataset.g); });
  run(lget('lomdim_game') && GAMES.some(g => g[0] === lget('lomdim_game')) ? lget('lomdim_game') : 'bub');
  return () => stopCur();
}
function gameBubbles(area, report){
  let score = 0; report(0);
  area.classList.add('bubbles');
  const spawn = () => {
    const b = document.createElement('button');
    const size = 38 + Math.random() * 34;
    b.type = 'button'; b.className = 'bubble'; b.dataset.c = String(Math.random() * 6 | 0);
    b.style.width = b.style.height = size + 'px';
    b.style.left = Math.random() * (area.clientWidth - size) + 'px';
    b.style.animationDuration = (3.2 + Math.random() * 2.5) + 's';
    b.style.setProperty('--y', (10 + Math.random() * 70) + '%');
    b.setAttribute('aria-label', 'בועה');
    b.onclick = () => { score++; report(score); b.classList.add('pop'); setTimeout(() => b.remove(), 180); };
    area.appendChild(b);
    setTimeout(() => b.remove(), 6500);
  };
  const iv = setInterval(spawn, 650); spawn();
  return () => { clearInterval(iv); area.classList.remove('bubbles'); area.innerHTML = ''; };
}
function gameMath(area, report){
  let score = 0, streak = 0, stopped = false, t = 0; report(0);
  function next(){
    if (stopped) return;
    const lvl = Math.min(4, 1 + Math.floor(streak / 4));
    const ops = lvl < 2 ? ['+', '−'] : ['+', '−', '×'];
    const op = ops[Math.random() * ops.length | 0];
    let a = 1 + (Math.random() * (5 * lvl + 5) | 0), b = 1 + (Math.random() * (5 * lvl + 5) | 0);
    if (op === '×') { a = 2 + (Math.random() * (3 + 2 * lvl) | 0); b = 2 + (Math.random() * 8 | 0); }
    if (op === '−' && b > a) [a, b] = [b, a];
    const ans = op === '+' ? a + b : op === '−' ? a - b : a * b;
    const opts = new Set([ans]);
    while (opts.size < 3) { const d = ans + ((Math.random() * 7 | 0) - 3 || 1); if (d >= 0) opts.add(d); }
    const list = shuffle([...opts]);
    area.innerHTML = `<div class="mq" dir="ltr">${a} ${op} ${b} = ?</div><div class="mopts">${list.map(v => `<button type="button" data-v="${v}">${v}</button>`).join('')}</div><div class="small muted mstreak">${streak ? 'רצף ' + streak : 'כמה זה?'}</div>`;
    area.onclick = e => {
      const btn = e.target.closest('[data-v]'); if (!btn) return;
      if (+btn.dataset.v === ans) { score++; streak++; report(score); btn.classList.add('right'); }
      else { streak = 0; btn.classList.add('wrong'); area.querySelector(`[data-v="${ans}"]`).classList.add('right'); }
      area.onclick = null; t = setTimeout(next, 450);
    };
  }
  next();
  return () => { stopped = true; clearTimeout(t); area.onclick = null; area.innerHTML = ''; };
}
function gameSimon(area, report){
  let seq = [], pos = 0, busy = true, timers = [];
  area.innerHTML = `<div class="simon">${[0, 1, 2, 3].map(i => `<button type="button" data-p="${i}" data-c="${[0, 1, 3, 2][i]}" aria-label="צבע ${i + 1}"></button>`).join('')}</div><div class="small muted mstreak" id="smsg">הסתכל וחזור על הסדר</div>`;
  const pads = [...area.querySelectorAll('[data-p]')], msg = area.querySelector('#smsg');
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  const flash = i => { pads[i].classList.add('lit'); later(() => pads[i].classList.remove('lit'), 320); };
  function round(){
    seq.push(Math.random() * 4 | 0); pos = 0; busy = true; msg.textContent = 'שלב ' + seq.length;
    seq.forEach((p, k) => later(() => flash(p), 600 + k * 520));
    later(() => { busy = false; msg.textContent = 'תורך'; }, 600 + seq.length * 520);
  }
  area.onclick = e => {
    const b = e.target.closest('[data-p]'); if (!b || busy) return;
    const i = +b.dataset.p; flash(i);
    if (i !== seq[pos]) { busy = true; msg.textContent = 'אופס! מתחילים מחדש'; report(0); seq = []; later(round, 1100); return; }
    pos++;
    if (pos === seq.length) { report(seq.length); busy = true; later(round, 700); }
  };
  report(0); round();
  return () => { timers.forEach(clearTimeout); area.onclick = null; area.innerHTML = ''; };
}


/* ---------------- progress: spaced review, points, streak, badges ---------------- */
const DAY = 86400000, BOX_DAYS = [0, 1, 2, 4, 7, 15];
const today = (d = new Date()) => d.toLocaleDateString('en-CA');
function srsOf(s){ if (!s.srs || typeof s.srs !== 'object') s.srs = {}; return s.srs; }
function srsMark(s, id, ok){
  if (!id) return;
  const r = srsOf(s), cur = r[id] || { b: 0, d: 0 };
  const b = ok ? Math.min(5, cur.b + 1) : 1;
  r[id] = { b, d: Date.now() + (ok ? BOX_DAYS[b] * DAY : 5 * 60000) };
}
function dueIds(s){
  const r = srsOf(s), now = Date.now(), ids = new Set([...s.cards.map(c => c.id), ...s.mcq.map(m => m.id)]);
  return Object.keys(r).filter(id => ids.has(id) && r[id].d <= now);
}
const SKEY = 'lomdim_stats';
function stats(){ try { const o = JSON.parse(lget(SKEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch(e){ return {}; } }
function saveStats(st){ lset(SKEY, JSON.stringify(st)); }
function streakOf(st){
  const days = st.days || {}; let n = 0; const d = new Date();
  if (!days[today(d)]) d.setDate(d.getDate() - 1);
  while (days[today(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const BADGES = [
  ['first', '🌱', 'תשובה ראשונה', st => (st.answers || 0) >= 1],
  ['c50', '⭐', '50 תשובות נכונות', st => (st.correct || 0) >= 50],
  ['c250', '🏅', '250 תשובות נכונות', st => (st.correct || 0) >= 250],
  ['c1000', '🏆', '1000 תשובות נכונות', st => (st.correct || 0) >= 1000],
  ['s3', '🔥', '3 ימים ברצף', st => streakOf(st) >= 3],
  ['s7', '🚀', 'שבוע ברצף', st => streakOf(st) >= 7],
  ['s30', '💎', 'חודש ברצף', st => streakOf(st) >= 30],
  ['perfect', '🎯', 'מבחן מושלם', st => (st.perfect || 0) >= 1],
  ['sets5', '📚', '5 סטים', () => sets.length >= 5],
  ['win', '🥇', 'ניצחון באתגר', st => (st.wins || 0) >= 1]
];
function award(ok, extra){
  const st = stats();
  st.answers = (st.answers || 0) + 1;
  if (ok) st.correct = (st.correct || 0) + 1;
  st.points = (st.points || 0) + (ok ? 10 : 2);
  st.days = st.days || {}; st.days[today()] = (st.days[today()] || 0) + 1;
  if (extra) Object.keys(extra).forEach(k => st[k] = (st[k] || 0) + extra[k]);
  st.badges = st.badges || [];
  BADGES.forEach(([id, icon, name, test]) => { if (!st.badges.includes(id) && test(st)) { st.badges.push(id); setTimeout(() => toast('תג חדש: ' + icon + ' ' + name), 300); } });
  saveStats(st);
}
function bump(extra){ const st = stats(); Object.keys(extra).forEach(k => st[k] = (st[k] || 0) + extra[k]); st.badges = st.badges || [];
  BADGES.forEach(([id, icon, name, test]) => { if (!st.badges.includes(id) && test(st)) { st.badges.push(id); toast('תג חדש: ' + icon + ' ' + name); } }); saveStats(st); }
function statsBar(){
  const st = stats(), sk = streakOf(st), pts = st.points || 0, earned = BADGES.filter(b => (st.badges || []).includes(b[0]));
  if (!st.answers) return '';
  return `<div class="statsbar"><span class="pill">🔥 ${sk} ${sk === 1 ? 'יום' : 'ימים'} ברצף</span><span class="pill">⭐ ${pts.toLocaleString('he-IL')} נקודות</span></div>
    ${earned.length ? `<div class="badges">${earned.map(b => `<span class="badge" title="${esc(b[2])}">${b[1]} ${esc(b[2])}</span>`).join('')}</div>` : ''}`;
}

/* ---------------- mixed quiz runner: review, test, dictation ---------------- */
const normAns = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-֑ͯ-ׇ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// one wrong, missing or extra letter (two in long words) is "almost": the answer is shown with the wrong spot marked
function editDist(a, b){
  const m = [...a], n = [...b], d = Array.from({ length: m.length + 1 }, (_, i) => [i, ...Array(n.length).fill(0)]);
  for (let j = 1; j <= n.length; j++) d[0][j] = j;
  for (let i = 1; i <= m.length; i++) for (let j = 1; j <= n.length; j++) d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (m[i-1] === n[j-1] ? 0 : 1));
  return d[m.length][n.length];
}
function checkAns(given, want){
  const a = normAns(given), b = normAns(want);
  if (a === b) return 'ok';
  const len = [...b].length, dist = editDist(a, b);
  return len >= 4 && (dist === 1 || (len >= 9 && dist === 2)) ? 'almost' : 'no';
}
// the right spelling, with the letters the student missed or got wrong highlighted
function spellDiff(given, want){
  const a = [...String(given).trim().toLowerCase()], w = [...String(want)], b = w.map(c => c.toLowerCase());
  const L = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i+1][j+1] + 1 : Math.max(L[i+1][j], L[i][j+1]);
  const keep = new Set(); let i = 0, j = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { keep.add(j); i++; j++; } else if (L[i+1][j] >= L[i][j+1]) i++; else j++; }
  return w.map((c, k) => keep.has(k) ? esc(c) : `<mark>${esc(c)}</mark>`).join('');
}
function answerNote(res, given, want){
  if (res === 'ok') return '<p class="note good">נכון!</p>';
  if (res === 'almost') return `<p class="note almost">כמעט! 🤏 שים לב לאיות: <strong dir="auto">${spellDiff(given, want)}</strong></p>`;
  return `<p class="note bad">התשובה: <strong dir="auto">${esc(want)}</strong></p><button class="btn ghost" type="button" data-mine="1" data-w="mine">צדקתי, זו רק שגיאת הקלדה</button>`;
}
function itemsOf(s){ return [...s.cards.map(c => ({ s, id: c.id, kind: 'card', c })), ...s.mcq.map(m => ({ s, id: m.id, kind: 'mcq', m }))]; }
function shapeQ(it, prefer){
  if (it.kind === 'mcq') return { ...it, type: 'mcq', q: it.m.q, o: it.m.o, a: it.m.a, x: it.m.x };
  const c = it.c, s = it.s, types = ['flash', 'write'];
  if (s.cards.length >= 4) types.push('mcq', 'mcq');
  if (canSpeak && c.t.length <= 40) types.push('dict');
  const t = prefer && types.includes(prefer) ? prefer : types[Math.random() * types.length | 0];
  if (t === 'mcq') {
    const others = shuffle(s.cards.filter(o => o !== c && o.d !== c.d)).slice(0, 3).map(o => o.d);
    const o = shuffle([c.d, ...others]);
    return { ...it, type: 'mcq', q: c.t, o, a: o.indexOf(c.d), x: '', say: true };
  }
  return { ...it, type: t };
}
function runQuiz(title, qs, back, opts){
  opts = opts || {};
  leave(); curView = 'practice';
  if (!qs.length) { toast('אין שאלות כרגע'); return back(); }
  let i = 0, right = 0, answered = false; const wrong = [];
  const base = qs.length;
  function record(q, ok){
    if (answered) return; answered = true;
    if (q.again) { srsMark(q.s, q.id, ok); award(ok); saveSoon(q.s); return; }
    if (ok) right++; else { wrong.push(q); if (q.type === 'mcq') qs.push({ ...q, again: true }); }
    srsMark(q.s, q.id, ok);
    if (q.kind === 'card') { if (ok) q.s.known[q.id] = true; else delete q.s.known[q.id]; }
    award(ok); saveSoon(q.s);
  }
  function nextBtn(){ return `<button class="btn primary wide" type="button" data-n="1">${i + 1 < qs.length ? 'הבא' : 'לתוצאה'}</button>`; }
  function draw(){
    const q = qs[i], s = q.s; answered = false; tint(s.color);
    let body = '';
    if (q.type === 'mcq') body = `<div class="panel stack">${q.again ? '<span class="eyebrow">🔁 עוד הזדמנות לשאלה שטעית בה</span>' : ''}<div class="row" style="align-items:flex-start"><p class="q grow" dir="auto">${esc(q.q)}</p>${q.say ? sayBtn(q.q, s.termLang) : ''}</div></div>
      <div class="opts">${q.o.map((o, j) => `<button class="opt" data-c="${j % 6}" data-o="${j}"><span class="k">${'אבגדהו'[j]}</span><span dir="auto">${esc(o)}</span></button>`).join('')}</div>`;
    else if (q.type === 'flash') body = `<div class="panel stack qflash"><span class="eyebrow">אתה יודע מה זה?</span><p class="q" dir="auto">${esc(q.c.t)}</p>${sayBtn(q.c.t, s.termLang)}
      <div id="rev" hidden><p class="explain" dir="auto">${esc(q.c.d)}</p></div>
      <button class="btn wide" type="button" data-show="1">הצג תשובה</button></div>
      <div class="row" id="fl" hidden><button class="btn grow big no" data-f="no">לא ידעתי</button><button class="btn grow big yes" data-f="yes">ידעתי ✓</button></div>`;
    else body = `<div class="panel stack">${q.type === 'dict'
        ? `<span class="eyebrow">הקשב וכתוב</span><button class="btn colored wide dictbtn" type="button" data-say="${esc(q.c.t)}" data-lang="${esc(s.termLang || '')}">${I.say} השמע שוב</button>`
        : `<span class="eyebrow">כתוב את המילה שמתאימה</span><p class="q" dir="auto">${esc(q.c.d)}</p>`}</div>
      <form id="qf" class="stack"><input type="text" id="ans" dir="auto" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="התשובה שלך" placeholder="התשובה שלך">
      <button class="btn primary wide" type="submit" id="chk">בדוק</button></form>`;
    app.innerHTML = `${topbar(title, (i + 1) + '/' + qs.length)}<div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>${body}<div id="after"></div>`;
    if (q.type === 'dict') setTimeout(() => speak(q.c.t, s.termLang), 250);
    const nq = qs[i + 1]; if (nq && nq.c) prefetchSay(nq.c.t, nq.s.termLang, nq.type === 'dict');
    if (q.type === 'write' || q.type === 'dict') setTimeout(() => { const inp = document.getElementById('ans'); if (inp) inp.focus(); }, 60);
  }
  function finish(){
    const pct = Math.round(right / base * 100);
    if (opts.onDone) opts.onDone(pct, right);
    const extra = wrong.length ? '<button class="btn" data-r="extra">חזרה על הטעויות</button>' : '';
    resultView(opts.home ? null : qs[0].s, title, opts.test ? pct + '%' : `${right}/${base}`, pct === 100 ? 'מושלם! 🎉' : `${right} נכונות מתוך ${base}`,
      only => only ? runQuiz(title, shuffle(wrong).map(q => shapeQ(q, q.type)), back, { home: opts.home }) : (opts.again ? opts.again() : back()), extra);
  }
  draw();
  app.onsubmit = ev => {
    ev.preventDefault();
    const q = qs[i], inp = document.getElementById('ans'); if (answered || !inp || !inp.value.trim()) return;
    const res = checkAns(inp.value, q.c.t), ok = res !== 'no'; record(q, ok);
    if (res === 'almost') srsMark(q.s, q.id, false); // counts, but comes back for review
    inp.readOnly = true; inp.style.borderColor = res === 'ok' ? 'var(--ok)' : res === 'almost' ? 'var(--warn,#c98a00)' : 'var(--bad)'; document.getElementById('chk').hidden = true;
    document.getElementById('after').innerHTML = `<div class="stack">${answerNote(res, inp.value, q.c.t)}${nextBtn()}</div>`;
  };
  app.onclick = async e => {
    if (e.target.closest('[data-a="quit"]')) return back();
    const q = qs[i];
    if (e.target.closest('[data-n]')) { i++; return i >= qs.length ? finish() : draw(); }
    if (e.target.closest('[data-mine]')) { right++; wrong.pop(); srsMark(q.s, q.id, true); q.s.known[q.id] = true; award(true); e.target.closest('[data-mine]').remove(); return; }
    if (e.target.closest('[data-show]')) { document.getElementById('rev').hidden = false; document.getElementById('fl').hidden = false; e.target.closest('[data-show]').remove(); return; }
    const f = e.target.closest('[data-f]');
    if (f && !answered) { record(q, f.dataset.f === 'yes'); i++; return i >= qs.length ? finish() : draw(); }
    const why = e.target.closest('[data-why]');
    if (why) { why.disabled = true; why.textContent = 'חושב…'; const out = await explainWhy(q, +why.dataset.why); why.replaceWith(Object.assign(document.createElement('p'), { className: 'explain', dir: 'auto', textContent: out })); return; }
    const o = e.target.closest('[data-o]'); if (!o || answered || q.type !== 'mcq') return;
    const pick = +o.dataset.o, ok = pick === q.a; record(q, ok);
    app.querySelectorAll('.opt').forEach((b, j) => { if (j === q.a) b.classList.add('right'); else if (j === pick) b.classList.add('wrong'); b.disabled = true; });
    document.getElementById('after').innerHTML = `<div class="stack">${q.x ? `<p class="explain" dir="auto">${esc(q.x)}</p>` : ''}${!ok ? `<button class="btn ghost" type="button" data-why="${pick}">🤔 למה זו התשובה?</button>` : ''}${nextBtn()}</div>`;
  };
}
async function explainWhy(q, pick){
  try {
    const data = await callApi({ mode: 'explain', q: q.q, options: q.o, correct: q.o[q.a], chosen: q.o[pick] });
    return String((data && data.result && data.result.explain) || 'לא הצלחתי להסביר כרגע.');
  } catch(e) { return e && e.code === 'need_code' ? 'צריך קוד גישה כדי לקבל הסבר.' : errText(e); }
}
function modeReview(s){ const ids = new Set(dueIds(s)); runQuiz('חזרה להיום', shuffle(itemsOf(s).filter(it => ids.has(it.id))).slice(0, 20).map(it => shapeQ(it)), () => viewSet(s)); }
function modeTest(s){
  runQuiz('מבחן', shuffle(itemsOf(s)).slice(0, 15).map(it => shapeQ(it)), () => viewSet(s), { test: true, again: () => modeTest(s), onDone: pct => {
    if (pct === 100) bump({ perfect: 1 });
    if (!s.best.test || pct > s.best.test) { s.best.test = pct; saveSoon(s); }
    if (s.challenge && s.challenge.t != null && pct > s.challenge.t && !s.challenge.wonT) { s.challenge.wonT = 1; bump({ wins: 1 }); setTimeout(() => toast('🥇 ניצחת את ' + (s.challenge.n || 'החבר') + ' במבחן!'), 400); }
  } });
}
function modeDict(s){ runQuiz('הכתבה', shuffle(s.cards.filter(c => c.t.length <= 40)).slice(0, 10).map(c => shapeQ({ s, id: c.id, kind: 'card', c }, 'dict')), () => viewSet(s), { again: () => modeDict(s) }); }
function dailyReview(){
  const all = [];
  sets.forEach(s => { const ids = new Set(dueIds(s)); itemsOf(s).forEach(it => { if (ids.has(it.id)) all.push(it); }); });
  runQuiz('חזרה יומית', shuffle(all).slice(0, 25).map(it => shapeQ(it)), () => viewHome(), { home: true });
}
function totalDue(){ return sets.reduce((n, s) => n + dueIds(s).length, 0); }

/* ---------------- backup ---------------- */
function backupNow(){
  const data = JSON.stringify({ app: 'lomdim-mehadaf', v: 1, at: new Date().toISOString(), sets, stats: stats() });
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lomdim-backup-' + today() + '.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('הגיבוי נשמר בתיקיית ההורדות');
}
function restoreFrom(file){
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const o = JSON.parse(fr.result); if (!o || !Array.isArray(o.sets)) throw 0;
      let added = 0;
      o.sets.forEach(x => { const s = fixSet(x), cur = getSet(s.id); if (!cur) { sets.push(s); added++; } else if ((s.updated || 0) > (cur.updated || 0)) { Object.assign(cur, s); added++; } });
      if (o.stats && typeof o.stats === 'object') { const st = stats(); if ((o.stats.points || 0) > (st.points || 0)) saveStats({ ...o.stats, ...st, points: o.stats.points, correct: Math.max(o.stats.correct || 0, st.correct || 0), answers: Math.max(o.stats.answers || 0, st.answers || 0), days: { ...(o.stats.days || {}), ...(st.days || {}) }, badges: [...new Set([...(o.stats.badges || []), ...(st.badges || [])])] }); }
      persist(); toast(added ? 'שוחזרו ' + added + ' סטים' : 'כל הסטים כבר קיימים'); viewHome();
    } catch(e) { toast('הקובץ הזה לא נראה כמו גיבוי של האפליקציה'); }
  };
  fr.readAsText(file);
}

/* ---------------- views ---------------- */
let curView = '';
let pages = [], createTarget = null;

function setStats(s){
  const p = [];
  if (s.cards.length) p.push(s.cards.length + ' כרטיסיות');
  if (s.mcq.length) p.push(s.mcq.length + ' שאלות');
  if (s.reading.length) p.push(s.reading.length === 1 ? 'קטע קריאה' : s.reading.length + ' קטעי קריאה');
  if (s.lesson.length) p.push('שיעור');
  return p.join(' · ') || 'ריק';
}
const knownCount = s => s.cards.filter(c => s.known[c.id]).length;

let homeFolder = '';
let createTab = 'photo';
function startCreate(tab){ createTarget = null; pages = []; createTab = tab || 'photo'; viewCreate(); }
function viewHome(){
  leave(); curView = 'home'; tint(null);
  const due = totalDue(), folders = [...new Set(sets.map(s => s.folder).filter(Boolean))].sort();
  if (homeFolder && !folders.includes(homeFolder)) homeFolder = '';
  const shown = homeFolder ? sets.filter(s => s.folder === homeFolder) : sets;
  const st = stats(), sk = streakOf(st), nb = BADGES.filter(b => (st.badges || []).includes(b[0])).length;
  app.innerHTML = `
    <header class="hero${sets.length ? ' compact' : ''}">
      <div class="rainbow" aria-hidden="true">${[0,1,2,3,4,5].map(c => `<i data-c="${c}"></i>`).join('')}</div>
      <div class="row herorow">${sets.length ? '' : mascot('')}<h1><span>לומדים</span> מהדף</h1></div>
      ${sets.length ? '' : '<p class="muted">מצלמים דף או כותבים נושא, ומקבלים תרגול.</p>'}
    </header>
    ${installHtml()}
    ${sets.length ? `
      ${st.answers ? `<div class="statsbar"><span class="pill">🔥 ${sk} ${sk === 1 ? 'יום' : 'ימים'} ברצף</span><span class="pill">⭐ ${(st.points || 0).toLocaleString('he-IL')}</span>${nb ? `<button type="button" class="pill" data-a="badges">🏅 ${nb} תגים</button>` : ''}</div>` : ''}
      ${due ? `<button class="btn colored wide big" data-c="3" data-a="daily">🔁 חזרה יומית <small>${due} פריטים מחכים לך</small></button>` : ''}
      <div class="newrow">
        <button class="btn primary grow big" data-a="photo">${I.cam} צלם דף</button>
        <button class="btn primary grow big alt" data-a="topic">${I.pen} כתוב נושא</button>
      </div>
      <div class="row between"><h2>הסטים שלי</h2><span class="muted small count">${shown.length}</span></div>
      ${folders.length > 1 ? `<div class="chips">${['', ...folders].map(f => `<button type="button" class="chip" data-folder="${esc(f)}" aria-pressed="${homeFolder === f}">${esc(f || 'הכול')}</button>`).join('')}</div>` : ''}
      <div class="sets">${shown.map(s => {
        const k = knownCount(s), n = s.cards.length, d = dueIds(s).length;
        const cont = s.last && s.last !== 'go' && MODE_NAME[s.last] ? 'המשך: ' + MODE_NAME[s.last] : d ? d + ' לחזרה' : 'תרגל';
        return `<div class="setcard" data-c="${s.color}">
          <button class="setopen" data-open="${esc(s.id)}">
            <h3 dir="auto">${esc(s.title)}</h3>
            ${n ? `<div class="row" style="width:100%"><div class="meter grow"><i style="width:${Math.round(k / n * 100)}%"></i></div><span class="small count">${k}/${n}</span></div>` : `<span class="muted small">${esc(setStats(s))}</span>`}
          </button>
          <button class="setplay" data-play="${esc(s.id)}" aria-label="${esc(cont)}"><span class="pl">${I.play}</span><span class="small">${esc(cont)}</span></button>
        </div>`; }).join('')}</div>
      <button class="btn wide" data-a="vs">⚔️ שחק מול חבר</button>`
    : `
      <section class="panel stack start">
        <h2>איך מתחילים?</h2>
        <button class="choice" data-c="0" data-a="photo"><span class="ci">${I.cam}</span><span class="grow"><strong>צלם דף לימוד</strong><span>דף עבודה, סיכום או רשימת מילים</span></span></button>
        <button class="choice" data-c="1" data-a="topic"><span class="ci">${I.pen}</span><span class="grow"><strong>כתוב מה ללמוד</strong><span>למשל: מילים באנגלית לכיתה ה׳</span></span></button>
        <button class="choice" data-c="2" data-a="example"><span class="ci">${I.play}</span><span class="grow"><strong>נסה סט לדוגמה</strong><span>מילים באנגלית, כדי לראות איך זה עובד</span></span></button>
      </section>
      <p class="muted small center">האפליקציה בונה כרטיסיות, שאלות אמריקאיות, משחקים וקטעי קריאה, ושומרת הכול בטלפון.</p>`}
    <details class="more">
      <summary>⚙️ גיבוי והעברה לטלפון אחר</summary>
      <p class="muted small">הסטים נשמרים רק בטלפון הזה. שמור גיבוי לקובץ, ותוכל לשחזר אותו בטלפון אחר.</p>
      <div class="row"><button class="btn grow" type="button" data-a="backup">שמור גיבוי</button><button class="btn grow" type="button" data-a="restore">שחזר מגיבוי</button></div>
    </details>`;
  app.onclick = async e => {
    const o = e.target.closest('[data-open]'); if (o) return viewSet(getSet(o.dataset.open));
    const pl = e.target.closest('[data-play]'); if (pl) { const s = getSet(pl.dataset.play); return startMode(s, s.last && MODE_NAME[s.last] ? s.last : 'go'); }
    const fo = e.target.closest('[data-folder]'); if (fo) { homeFolder = fo.dataset.folder; return viewHome(); }
    const a = e.target.closest('[data-a]'); if (!a) return;
    switch (a.dataset.a) {
      case 'photo': return startCreate('photo');
      case 'topic': return startCreate('topic');
      case 'example': { const s = exampleSet(); saveSet(s); return viewSet(s); }
      case 'install': if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch(err){} installEvt = null; } return viewHome();
      case 'hideinstall': lset('lomdim_install_hide', '1'); return viewHome();
      case 'daily': return dailyReview();
      case 'vs': return vsHome();
      case 'badges': return toast(BADGES.filter(b => (st.badges || []).includes(b[0])).map(b => b[1] + ' ' + b[2]).join(' · '));
      case 'backup': return backupNow();
      case 'restore': onPickedJson = f => restoreFrom(f); return document.getElementById('pickJson').click();
    }
  };
}

function viewCreate(errMsg){
  leave(); curView = 'create';
  const target = createTarget ? getSet(createTarget) : null;
  tint(target ? target.color : 0);
  const maxPages = 20, tab = createTab;
  const tabs = [['photo', '📷 צילום'], ['topic', '✏️ נושא'], ['list', '⌨️ רשימה שלי']];
  app.innerHTML = `
    <div class="topbar"><button class="iconbtn" data-a="back" aria-label="חזרה">${I.back}</button><div class="grow">${target ? 'הוספה ל: ' + esc(target.title) : 'תרגול חדש'}</div></div>
    <div class="seg" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}">${n}</button>`).join('')}</div>
    <div id="msg">${errMsg ? `<p class="note bad">${esc(errMsg)}</p>` : ''}</div>
    ${tab === 'photo' ? `
    <section class="panel stack">
      <p class="muted small">צלם דף אחד או כמה דפים. האפליקציה קוראת אותם ובונה תרגול.</p>
      <div class="pages" id="pages"></div><div id="pgtip"></div>
      <div class="row">
        <button class="btn primary grow" type="button" data-a="cam">${I.cam} צלם</button>
        <button class="btn grow" type="button" data-a="gal">${I.img} מהגלריה</button>
      </div>
      <details class="more inner"><summary>הוסף הערה (לא חובה)</summary>
        <textarea id="note" rows="2" placeholder="למשל: רק המילים באנגלית, או: שאלות ברמה של כיתה ח׳"></textarea></details>
      <button class="btn colored wide big" data-c="2" id="go" type="button" data-a="go">✨ צור תרגול <small id="pc"></small></button>
    </section>` : tab === 'topic' ? `
    <section class="panel stack">
      <label class="stack" for="topic" style="gap:6px"><span>על מה תרצה לתרגל?</span>
        <textarea id="topic" rows="3" placeholder="למשל: מילים באנגלית על חיות&#10;או: משוואות עם נעלם אחד&#10;או הדבק כאן סיכום"></textarea></label>
      <label class="stack" for="lvl" style="gap:6px"><span class="small muted">כיתה</span>
        <select id="lvl"><option value="">לא משנה</option>${LEVELS.map(x => `<option>${x}</option>`).join('')}</select></label>
      <details class="more inner"><summary>אפשרויות נוספות</summary>
        <div class="pickrow two">
          <label for="subj"><span class="small muted">מקצוע</span><select id="subj"><option value="">כל נושא</option>${SUBJECTS.map(x => `<option>${x}</option>`).join('')}</select></label>
          <label for="lng"><span class="small muted">שפה</span><select id="lng">${LANGS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></label>
        </div>
        <label class="row small" for="wantread" style="gap:8px"><input type="checkbox" id="wantread"> הוסף סיפור לקריאה עם שאלות</label>
      </details>
      <button class="btn colored wide big" data-c="2" type="button" data-a="text">✨ צור תרגול</button>
    </section>` : `
    <section class="panel stack">
      <label class="stack" for="manual" style="gap:6px"><span>כתוב את המילים שלך, שורה לכל מילה</span>
        <textarea id="manual" rows="7" placeholder="apple - תפוח&#10;river - נהר&#10;כוח - מסה כפול תאוצה"></textarea></label>
      <p class="small muted">בכל שורה: המילה, מקף, והפירוש.</p>
      <button class="btn colored wide big" data-c="2" type="button" data-a="manual">✨ צור תרגול</button>
    </section>`}`;
  const pagesEl = document.getElementById('pages'), pc = document.getElementById('pc'), go = document.getElementById('go');
  function drawPages(){
    if (!pagesEl) return;
    pagesEl.innerHTML = pages.map((p, i) => `<div class="thumb${p.blurry ? ' blurry' : ''}"><img src="${p.url}" alt="דף ${i + 1}"><b>${i + 1}</b>${p.blurry ? '<span class="warn" title="מטושטש">⚠️</span>' : ''}<button type="button" data-rm="${i}" aria-label="הסר דף ${i + 1}">×</button></div>`).join('')
      + (pages.length && pages.length < maxPages ? `<button class="addtile" type="button" data-a="gal">${I.plus}<span>עוד דף</span></button>` : '');
    pagesEl.hidden = !pages.length;
    const bl = pages.map((p, i) => p.blurry ? i + 1 : 0).filter(Boolean), tip = document.getElementById('pgtip');
    if (tip) tip.innerHTML = !pages.length ? '' : bl.length ? `<p class="note almost">⚠️ ${bl.length === 1 ? 'דף ' + bl[0] + ' נראה מטושטש' : 'הדפים ' + bl.join(', ') + ' נראים מטושטשים'}. כדאי לצלם שוב, מקרוב ובאור טוב, כדי שהשאלות ייצאו מדויקות.</p>` : '';
    pc.textContent = pages.length ? (pages.length === 1 ? 'מדף אחד' : 'מ-' + pages.length + ' דפים') : '';
    go.disabled = !pages.length;
  }
  pages.forEach(p => { if (p.blurry === undefined) { p.blurry = false; checkPage(p); } });
  drawPages(); redrawPages = drawPages;
  onPicked = files => {
    for (const f of files) {
      if (pages.length >= maxPages) { toast('אפשר עד ' + maxPages + ' דפים בבת אחת'); break; }
      if (!f.type || f.type.startsWith('image/')) { const p = { file: f, url: URL.createObjectURL(f) }; pages.push(p); checkPage(p); }
    }
    if (curView === 'create') drawPages();
  };
  app.onclick = e => {
    const tb = e.target.closest('[data-tab]'); if (tb) { createTab = tb.dataset.tab; return viewCreate(); }
    const rm = e.target.closest('[data-rm]');
    if (rm) { const i = +rm.dataset.rm; URL.revokeObjectURL(pages[i].url); pages.splice(i, 1); return drawPages(); }
    const a = e.target.closest('[data-a]'); if (!a) return;
    switch (a.dataset.a) {
      case 'back': return target ? viewSet(target) : viewHome();
      case 'cam': return openPicker('cam');
      case 'gal': return openPicker('gal');
      case 'go': return generate(target, (document.getElementById('note') || {}).value?.trim() || '');
      case 'text': {
        const t = document.getElementById('topic').value.trim();
        const opts = { subject: document.getElementById('subj').value, level: document.getElementById('lvl').value,
          lang: document.getElementById('lng').value, reading: document.getElementById('wantread').checked };
        if (t.length < 3 && !opts.subject && (!opts.lang || opts.lang === 'he')) return toast('כתוב על מה תרצה לתרגל');
        return generateText(target, t, opts);
      }
      case 'manual': {
        const lines = document.getElementById('manual').value.split('\n').map(l => l.trim()).filter(Boolean);
        const cards = lines.map(l => { const m = l.split(/\s+[-–—:=]\s+|\t|\s*[–—=]\s*/); return m.length >= 2 ? { t: m[0].trim(), d: m.slice(1).join(' - ').trim() } : null; }).filter(c => c && c.t && c.d);
        if (!cards.length) return toast('כתוב כל מילה בשורה: מילה - פירוש');
        const s = target || fixSet({ title: 'הרשימה שלי' });
        mergeInto(s, { cards }); saveSet(s); return viewSet(s);
      }
    }
  };
}

function viewNeedCode(retry){
  leave(); curView = 'code'; tint(0);
  app.innerHTML = `
    <div class="topbar"><button class="iconbtn" data-a="back" aria-label="חזרה">${I.back}</button><div class="grow">קוד גישה</div></div>
    <form class="panel stack" id="cf">
      <h3>צריך קוד גישה</h3>
      <p class="muted small">מי שהתקין את האפליקציה נתן לה קוד, כדי שרק מי שמכיר אותו יוכל ליצור סטים מצילום. תרגול של סטים קיימים לא צריך קוד.</p>
      <input type="password" id="code" autocomplete="off" aria-label="קוד גישה" placeholder="הקוד">
      <button class="btn primary wide" type="submit">המשך</button>
    </form>`;
  app.onclick = e => { if (e.target.closest('[data-a="back"]')) viewCreate(); };
  app.onsubmit = e => { e.preventDefault(); const v = document.getElementById('code').value.trim(); if (!v) return; lset(CODEKEY, v); retry(); };
}

async function generateText(target, text, opts){
  opts = opts || {};
  const label = [opts.subject, opts.level, text].filter(Boolean).join(' · ') || 'תרגול חדש';
  leave(); curView = 'working';
  app.innerHTML = `
    <div class="panel working">
      ${mascot('think')}
      <h2>בונה תרגול</h2>
      <p class="muted" dir="auto">${esc(label.length > 80 ? label.slice(0, 78) + '…' : label)}</p>
      <p class="small muted">זה לוקח בדרך כלל חצי דקה עד דקה.</p>
      <button class="btn" type="button" data-a="stop">עצור</button>
    </div>${gameZone()}`;
  cleanup = startGames();
  const ctl = new AbortController();
  app.onclick = e => { if (e.target.closest('[data-a="stop"]')) ctl.abort(); };
  try {
    const data = await callApi({ mode: 'text', text, subject: opts.subject || '', level: opts.level || '', lang: opts.lang || '', reading: !!opts.reading }, ctl.signal);
    const part = normalize(data && data.result);
    if (!(part.cards.length || part.mcq.length || part.reading.length)) throw { code: 'empty' };
    const s = target || fixSet({ title: '' });
    mergeInto(s, part);
    if (!s.title || s.title === 'סט ללא שם') s.title = label.slice(0, 40);
    if (!target && opts.subject && !s.folder) s.folder = opts.subject;
    if (opts.level) s.level = opts.level;
    if (opts.lang && opts.lang !== 'he') s.learn = opts.lang;
    saveSet(s); viewSet(s); nikudNote(data); verifySet(s, data && data.model);
  } catch(e) {
    if (e && e.name === 'AbortError') return viewCreate();
    if (e && e.code === 'need_code') return viewNeedCode(() => generateText(target, text, opts));
    viewCreate(e && e.code === 'empty' ? 'לא הצלחתי לבנות תרגול מהטקסט. נסה לנסח את הנושא אחרת.' : errText(e));
    const ta = document.getElementById('topic'); if (ta) ta.value = text;
  }
}

async function generate(target, note){
  if (!pages.length) return;
  leave(); curView = 'working';
  app.innerHTML = `
    <div class="panel working">
      ${mascot('think')}
      <h2>קורא את הדפים</h2>
      <p class="muted" id="st">מכין את התמונות…</p>
      <p class="small muted">זה לוקח בדרך כלל 15–40 שניות.</p>
      <button class="btn" type="button" data-a="stop">עצור</button>
    </div>${gameZone()}`;
  cleanup = startGames();
  const st = document.getElementById('st');
  const ctl = new AbortController();
  app.onclick = e => { if (e.target.closest('[data-a="stop"]')) ctl.abort(); };
  let prepared;
  try { prepared = await Promise.all(pages.map(p => prepImage(p.file))); }
  catch(e) { return viewCreate('לא הצלחתי לקרוא את התמונות. נסה לצלם שוב.'); }
  // chunks: up to 3 images and about 3MB per request
  const chunks = []; let cur = [], size = 0;
  prepared.forEach(img => { if (cur.length && (cur.length >= 3 || size + img.data.length > 3e6)) { chunks.push(cur); cur = []; size = 0; } cur.push(img); size += img.data.length; });
  if (cur.length) chunks.push(cur);
  const s = target || fixSet({ title: '' });
  // two requests at a time, so many pages don't wait for each other; results are merged in page order
  let ok = 0, lastErr = null, cancelled = false, stop = false, finished = 0, next = 0, usedModel = '';
  const parts = new Array(chunks.length), starts = []; let k = 1; chunks.forEach(c => { starts.push(k); k += c.length; });
  const show = () => { st.textContent = pages.length > 1 ? `קורא ${pages.length} דפים · ${finished}/${chunks.length} מוכנים` : 'קורא את הדף'; };
  show();
  async function worker(){
    while (!stop && next < chunks.length) {
      const i = next++;
      if (ctl.signal.aborted) { cancelled = true; stop = true; return; }
      try {
        const data = await callApi({ mode: 'pages', images: chunks[i], note, from: starts[i], to: starts[i] + chunks[i].length - 1, total: pages.length, first: i === 0 }, ctl.signal);
        const part = normalize(data && data.result);
        if (part.cards.length || part.mcq.length || part.scr.length || part.lesson.length) { parts[i] = part; ok++; usedModel = (data && data.model) || usedModel; }
        else lastErr = { code: 'empty' };
      } catch(e) {
        if (e && e.name === 'AbortError') { cancelled = true; stop = true; return; }
        lastErr = e;
        if (['need_code','rate','no_key','offline','no_server'].includes(e && e.code)) { stop = true; return; }
      }
      finished++; show();
    }
  }
  await Promise.all([worker(), worker()]);
  if (lastErr && lastErr.code === 'need_code' && !ok) return viewNeedCode(() => generate(target, note));
  parts.forEach(p => { if (p) mergeInto(s, p); });
  if (ok) {
    if (!s.title || s.title === 'סט ללא שם') s.title = 'סט חדש';
    pages.forEach(p => URL.revokeObjectURL(p.url)); pages = [];
    saveSet(s); viewSet(s); verifySet(s, usedModel);
    if (cancelled) toast('נעצר. מה שכבר נוצר נשמר');
    else if (ok < chunks.length) toast('חלק מהדפים לא נקראו, השאר נשמרו');
  } else {
    viewCreate(cancelled ? '' : (lastErr && lastErr.code === 'empty' ? 'לא מצאתי בדפים חומר לתרגול. נסה צילום חד יותר, מקרוב ובאור טוב.' : errText(lastErr)));
  }
}

/* ---------------- second opinion ---------------- */
// After a set is made, another model checks it in the background while the student already practises.
// Wrong answers are corrected, questions with no single right answer are removed, wrong translations fixed.
async function verifySet(s, model){
  const v = s.vok || (s.vok = {});
  const qs = s.mcq.filter(m => !v[m.id]).map(m => ({ id: m.id, q: m.q, o: m.o, a: m.a }));
  const texts = [];
  s.reading.forEach(r => {
    if (!r.id) r.id = 'r' + rid();
    const todo = r.q.map((m, i) => ({ m, i })).filter(({ i }) => !v[r.id + '_' + i]);
    if (!todo.length) return;
    texts.push({ id: r.id, text: r.text });
    todo.forEach(({ m, i }) => qs.push({ id: r.id + '_' + i, q: m.q, o: m.o, a: m.a, ctx: r.id }));
  });
  const cards = s.cards.filter(c => !v[c.id]).map(c => ({ id: c.id, t: c.t, d: c.d }));
  if (!qs.length && !cards.length) return;
  let d;
  try { d = await callApi({ mode: 'verify', model: model || '', level: s.level || '', qs: qs.slice(0, 45), cards: cards.slice(0, 45), texts: texts.slice(0, 4) }); }
  catch(e) { return; } // no second opinion this time; nothing changes
  const ch = (d && d.changes) || {}, fixedQ = [], dropped = [];
  (ch.q || []).forEach(c => {
    const m = s.mcq.find(x => x.id === c.id);
    const [rid_, qi] = String(c.id).split('_'), r = !m && s.reading.find(x => x.id === rid_);
    const list = m ? s.mcq : r ? r.q : null, item = m || (r && r.q[+qi]);
    if (!item) return;
    if (c.drop) dropped.push({ list, item });
    else if (Number.isInteger(c.a) && c.a >= 0 && c.a < item.o.length) { item.a = c.a; item.x = ''; fixedQ.push(item); }
  });
  dropped.forEach(({ list, item }) => { const i = list.indexOf(item); if (i >= 0) list.splice(i, 1); });
  let fixedC = 0;
  (ch.cards || []).forEach(c => { const card = s.cards.find(x => x.id === c.id); if (card && c.d) { card.d = c.d; fixedC++; } });
  qs.slice(0, 45).forEach(q => { v[q.id] = 1; }); cards.slice(0, 45).forEach(c => { v[c.id] = 1; });
  if (sets.includes(s)) saveSet(s);
  const n = fixedQ.length + dropped.length + fixedC;
  toast(n ? `🔎 בדיקה שנייה: תיקנתי ${n} ${n === 1 ? 'פריט' : 'פריטים'} בסט "${s.title}"` : `🔎 בדיקה שנייה: הכל בסט נכון ✓`);
}

/* ---------------- set screen ---------------- */
function scrItems(s){
  const m = new Map();
  s.scr.forEach(x => m.set(x.w.toLowerCase(), { w: x.w, h: x.h }));
  s.cards.forEach(c => { if (lettersOnly.test(c.t) && !m.has(c.t.toLowerCase())) m.set(c.t.toLowerCase(), { w: c.t, h: c.d }); });
  return [...m.values()];
}
/* "big and small letters" in the set's own language. Languages without case get their own version:
   Hebrew final letters, Arabic letter forms, Japanese hiragana ↔ katakana. */
const ABC = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', fr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÉÈÊÀÂÇÎÔÙÛË', es: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ',
  de: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ', it: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÈÉÌÒÙ', pt: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÂÃÀÇÉÊÍÓÔÕÚ',
  ru: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', el: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'
};
const AR_JOIN = 'بتثجحخسشصضطظعغفقكلمنهي', AR_END = 'اأإآدذرزوة';
const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const SCRIPTS = { lat: /\p{Script=Latin}/u, cyr: /\p{Script=Cyrillic}/u, grk: /\p{Script=Greek}/u, heb: /\p{Script=Hebrew}/u, ara: /\p{Script=Arabic}/u, kana: /[\p{Script=Hiragana}\p{Script=Katakana}]/u, han: /\p{Script=Han}/u, eth: /\p{Script=Ethiopic}/u };
const BYLANG = { en:'lat', fr:'lat', es:'lat', de:'lat', it:'lat', pt:'lat', ru:'cyr', el:'grk', ar:'ara', ja:'kana', zh:'han', am:'eth' };
const LANG_SUBJ = ['אנגלית', 'ערבית', 'צרפתית', 'ספרדית'];
const kata = ch => String.fromCharCode(ch.charCodeAt(0) + 0x60);
// Only for sets that teach a foreign language, and always in that language, never in Hebrew (the app's language).
function caseInfo(s){
  const hide = { pairs: [], hide: true };
  if (s.folder && SUBJECTS.includes(s.folder) && !LANG_SUBJ.includes(s.folder)) return hide;
  const code = [s.termLang, s.defLang, ...s.reading.map(r => r.lang)].map(x => String(x || '').slice(0, 2).toLowerCase()).find(x => BYLANG[x]) || '';
  const fields = [...s.cards.flatMap(c => [c.t, c.d]), ...s.scr.map(x => x.w)].map(w => String(w || '').trim()).filter(Boolean);
  const tokens = [...new Set(fields.join(' ').match(/\p{L}{2,}/gu) || [])].filter(w => !/\p{Script=Hebrew}/u.test(w));
  const count = {}; tokens.forEach(w => { for (const k in SCRIPTS) if (SCRIPTS[k].test(w)) { count[k] = (count[k] || 0) + 1; break; } });
  const top = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  const sc = code && (count[BYLANG[code]] || !top) ? BYLANG[code] : top;
  const inSc = w => [...w].every(ch => SCRIPTS[sc].test(ch));
  if (!sc || (!(count[sc] >= 3) && !(code && s.alphabet))) return hide;
  const raw = [...new Set(tokens.filter(inSc))];
  const tl = code && BYLANG[code] === sc ? code : '';
  if (sc === 'lat' || sc === 'cyr' || sc === 'grk') {
    const re = SCRIPTS[sc], loc = tl || undefined;
    const up = w => { try { return w.toLocaleUpperCase(loc); } catch(e){ return w.toUpperCase(); } };
    const low = w => { try { return w.toLocaleLowerCase(loc); } catch(e){ return w.toLowerCase(); } };
    const words = [...new Set(raw.filter(w => w.length <= 12).map(low))].filter(w => up(w) !== w).slice(0, 30);
    let letters = [...new Set([...words.join('')].map(up))].filter(L => L.length === 1 && low(L) !== L);
    const abc = ABC[tl] || (sc === 'cyr' ? ABC.ru : sc === 'grk' ? ABC.el : ABC.en);
    if (letters.length < 8 && (s.alphabet || words.length)) letters = [...new Set([...letters, ...shuffle([...abc]).slice(0, 10 - letters.length)])];
    const sample = [...letters.slice(0, 2), ...words.slice(0, 1)].map(x => up(x) + ' ↔ ' + low(x)).join(' · ');
    return { pairs: [...letters.map(L => [L, low(L)]), ...words.map(w => [up(w), w])], name: 'גדולות וקטנות', sub: sample };
  }
  if (sc === 'ara') {
    const used = [...new Set([...raw.join('')].filter(ch => AR_JOIN.includes(ch) || AR_END.includes(ch)))];
    let letters = used.length >= 6 ? used : [...new Set([...used, ...shuffle([...AR_JOIN]).slice(0, 8)])];
    const form = ch => AR_END.includes(ch) ? 'ـ' + ch : ['بـ', 'ـبـ', 'ـب'][Math.floor(Math.random() * 3)].replace(/ب/g, ch);
    return { pairs: letters.map(ch => [ch, form(ch)]), name: 'צורות האותיות', sub: 'ب ↔ بـ ـبـ ـب · אות בודדת ואות בתוך מילה' };
  }
  if (sc === 'kana') {
    const toK = w => [...w].map(ch => /\p{Script=Hiragana}/u.test(ch) ? kata(ch) : ch).join('');
    const hira = raw.map(w => [...w].map(ch => /\p{Script=Katakana}/u.test(ch) && ch.charCodeAt(0) >= 0x30A1 && ch.charCodeAt(0) <= 0x30F6 ? String.fromCharCode(ch.charCodeAt(0) - 0x60) : ch).join(''));
    const words = [...new Set(hira.filter(w => /^\p{Script=Hiragana}{2,6}$/u.test(w)))];
    let letters = [...new Set([...words.join('')].filter(ch => HIRA.includes(ch)))];
    if (letters.length < 8) letters = [...new Set([...letters, ...shuffle([...HIRA]).slice(0, 10 - letters.length)])];
    return { pairs: [...letters.map(ch => [ch, kata(ch)]), ...words.map(w => [w, toK(w)])], name: 'הירגנה ↔ קטקנה', sub: 'あ ↔ ア · ねこ ↔ ネコ' };
  }
  return hide;
}
const casePool = s => caseInfo(s).pairs;
function mcqPool(s){
  const out = s.mcq.map(m => ({ id: m.id, q: m.q, o: m.o.map(cleanOpt), a: m.a, x: m.x }));
  // questions from the flashcards: not for single letters ("z" → "זד" teaches nothing),
  // and the wrong answers are written in the same language as the right one
  const usable = s.cards.filter(c => !/^\s*\p{L}\s*$/u.test(String(c.t)) && !/^\s*\p{L}\s*$/u.test(cleanOpt(c.d)));
  if (usable.length >= 4) usable.forEach(c => {
    const right = cleanOpt(c.d), sc = scriptOf(right);
    const pool = s.cards.filter(o => o !== c && cleanOpt(o.d) !== right).map(o => cleanOpt(o.d));
    const same = pool.filter(d => scriptOf(d) === sc);
    const others = shuffle([...new Set(same.length >= 2 ? same : pool)]).slice(0, 3);
    if (others.length < 2) return;
    const o = shuffle([right, ...others]);
    out.push({ id: c.id, q: c.t, o, a: o.indexOf(right), x: '', say: true });
  });
  return out;
}

const MODE_NAME = { balloon:'הצל את הבלון', sentence:'בנה משפט', catch:'תפוס את הנכון', flash:'כרטיסיות', mcq:'אמריקאיות', match:'התאמת זוגות', write:'כתיבה', read:'קטע קריאה', scr:'סידור אותיות', dict:'הכתבה', case:'גדולות וקטנות', test:'מבחן', review:'חזרה' };
function viewSet(s){
  leave(); curView = 'set';
  if (!s) return viewHome();
  tint(s.color);
  const n = s.cards.length, k = knownCount(s), scr = scrItems(s), ci = caseInfo(s), cp = ci.pairs, mp = mcqPool(s);
  const due = dueIds(s).length, speakable = canSpeak && n > 0, any = n + s.mcq.length > 0;
  const main = [
    { id:'flash', c:0, ic:I.cards, name:'כרטיסיות', ok: n > 0 },
    { id:'mcq', c:1, ic:I.abc, name:'אמריקאיות', ok: mp.length > 0 },
    { id:'match', c:2, ic:I.match, name:'התאמת זוגות', ok: n >= 3 },
    { id:'write', c:5, ic:I.pen, name:'כתיבה', ok: n > 0 },
    { id:'read', c:3, ic:I.book, name:'קטע קריאה', ok: true },
    { id:'lesson', c:4, ic:I.book, name:'שיעור קצר', ok: any }
  ].filter(m => m.ok);
  const more = [
    { id:'balloon', c:1, ic:'<span class="emo">🎈</span>', name:'הצל את הבלון', ok: balloonWords(s).length >= 3 },
    { id:'catch', c:3, ic:'<span class="emo">🧺</span>', name:'תפוס את הנכון', ok: mp.length >= 3 },
    { id:'sentence', c:5, ic:'<span class="emo">🧩</span>', name:'בנה משפט', ok: sentencesOf(s).length >= 3 },
    { id:'scr', c:3, ic:I.scr, name:'סידור אותיות', ok: scr.length > 0 },
    { id:'dict', c:0, ic:I.say, name:'הכתבה', ok: speakable },
    { id:'case', c:4, ic:I.Aa, name: ci.name, ok: cp.length >= 3 && !ci.hide },
    { id:'test', c:2, ic:I.abc, name: 'מבחן' + (s.best.test != null ? ' · ' + s.best.test + '%' : ''), ok: any },
    { id:'videos', c:1, ic:I.play, name:'סרטונים', ok: true }
  ].filter(m => m.ok);
  const tile = m => `<button class="mode" data-c="${m.c}" data-mode="${m.id}">${m.ic}<strong>${m.name}</strong></button>`;
  app.innerHTML = `
    <div class="topbar"><button class="iconbtn" data-a="home" aria-label="לכל הסטים">${I.back}</button><div class="grow"></div>
      <button class="iconbtn" data-a="share" aria-label="שתף">${I.share}</button><button class="iconbtn" data-a="edit" aria-label="עריכה">${I.pen}</button></div>
    <div class="stack" style="gap:6px">
      <h1 class="settitle" dir="auto">${esc(s.title)}</h1>
      ${n ? `<div class="row"><div class="meter grow"><i style="width:${Math.round(k / n * 100)}%"></i></div><span class="small count">יודע ${k} מתוך ${n}</span></div>` : ''}
      ${challengeHtml(s)}
    </div>
    ${any ? `<button class="btn colored wide big" data-c="2" data-a="go">▶ התחל לתרגל${due ? ` <small>${due} מילים לחזרה היום</small>` : ''}</button>` : ''}
    <div class="modes">${main.map(tile).join('')}</div>
    ${more.length ? `<details class="more"><summary>🎮 משחקים</summary><div class="modes small">${more.map(tile).join('')}</div></details>` : ''}
    ${mp.length >= 4 ? `<button class="btn wide" data-mode="vs">⚔️ שחק מול חבר</button>` : ''}`;
  app.onclick = e => {
    const m = e.target.closest('[data-mode]');
    if (m) return startMode(s, m.dataset.mode);
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'home') return viewHome();
    if (a.dataset.a === 'share') return shareSet(s);
    if (a.dataset.a === 'edit') return viewEditSet(s);
    if (a.dataset.a === 'go') return startMode(s, 'go');
  };
  prepareAhead(s);
}

// one screen for everything that changes a set: name, words, questions, folder, color, more pages, delete
function viewEditSet(s){
  leave(); curView = 'edit'; tint(s.color);
  const w = JSON.parse(JSON.stringify({ title: s.title, folder: s.folder || '', color: s.color, cards: s.cards, mcq: s.mcq }));
  let delArm = 0;
  const pull = () => {
    w.title = (document.getElementById('title').value.trim() || w.title).slice(0, 60);
    w.folder = document.getElementById('folder').value.trim().slice(0, 40);
    w.cards.forEach(c => { const t = document.getElementById('t_' + c.id), d = document.getElementById('d_' + c.id); if (t) c.t = t.value.trim() || c.t; if (d) c.d = d.value.trim() || c.d; });
    const nt = document.getElementById('t_new'), nd = document.getElementById('d_new');
    if (nt && nd && nt.value.trim() && nd.value.trim()) { w.cards.push({ id: 'c' + rid(), t: nt.value.trim(), d: nd.value.trim() }); nt.value = ''; nd.value = ''; }
  };
  function draw(){
    app.innerHTML = `
      <div class="topbar"><button class="iconbtn" data-a="back" aria-label="חזרה בלי לשמור">${I.back}</button><div class="grow">עריכה</div>
        <button class="btn primary" data-a="save">שמור</button></div>
      <section class="panel stack">
        <label class="stack" for="title" style="gap:4px"><span class="small muted">שם</span><input id="title" type="text" value="${esc(w.title)}" dir="auto"></label>
        <label class="stack" for="folder" style="gap:4px"><span class="small muted">📁 תיקייה</span><input type="text" id="folder" list="folderlist" value="${esc(w.folder)}" placeholder="למשל: אנגלית" dir="auto"><datalist id="folderlist">${[...new Set([...SUBJECTS, ...sets.map(x => x.folder).filter(Boolean)])].map(f => `<option value="${esc(f)}">`).join('')}</datalist></label>
        <div class="swatches" role="group" aria-label="צבע">${[0,1,2,3,4,5].map(c => `<button type="button" data-c="${c}" data-color="${c}" aria-pressed="${w.color === c}" aria-label="צבע ${c + 1}"></button>`).join('')}</div>
      </section>
      <section class="panel stack">
        <h3>מילים</h3>
        <div class="list">${w.cards.map(c => `<div class="li"><input type="text" id="t_${c.id}" value="${esc(c.t)}" dir="auto" aria-label="מילה"><input type="text" id="d_${c.id}" value="${esc(c.d)}" dir="auto" aria-label="פירוש"><button class="x" type="button" data-del="${c.id}" aria-label="מחק">×</button></div>`).join('')}
          <div class="li"><input type="text" id="t_new" placeholder="מילה חדשה" dir="auto" aria-label="מילה חדשה"><input type="text" id="d_new" placeholder="פירוש" dir="auto" aria-label="פירוש חדש"><button class="x add" type="button" data-a="addrow" aria-label="הוסף">+</button></div></div>
        ${w.mcq.length ? `<h3>שאלות</h3><div class="list">${w.mcq.map(m => `<div class="qitem"><div dir="auto">${esc(m.q)}<br><span class="small muted" dir="auto">תשובה: ${esc(m.o[m.a])}</span></div><button class="x" type="button" data-delq="${m.id}" aria-label="מחק שאלה">×</button></div>`).join('')}</div>` : ''}
      </section>
      <button class="btn wide" data-a="add">${I.plus} הוסף עוד דפים או נושא</button>
      <div class="row">${knownCount(s) ? '<button class="btn ghost" data-a="reset">אפס התקדמות</button>' : ''}<span class="grow"></span><button class="btn ghost danger" data-a="del">מחק את הסט</button></div>`;
  }
  draw();
  app.onclick = e => {
    const col = e.target.closest('[data-color]');
    if (col) { w.color = +col.dataset.color; tint(w.color); app.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b === col))); return; }
    const d = e.target.closest('[data-del]'); if (d) { pull(); w.cards = w.cards.filter(c => c.id !== d.dataset.del); return draw(); }
    const dq = e.target.closest('[data-delq]'); if (dq) { pull(); w.mcq = w.mcq.filter(q => q.id !== dq.dataset.delq); return draw(); }
    const a = e.target.closest('[data-a]'); if (!a) return;
    switch (a.dataset.a) {
      case 'back': return viewSet(s);
      case 'addrow': pull(); draw(); { const t = document.getElementById('t_new'); if (t) t.focus(); } return;
      case 'save': {
        pull();
        const gone = new Set(s.cards.map(c => c.id).filter(id => !w.cards.some(c => c.id === id)));
        gone.forEach(id => delete s.known[id]);
        Object.assign(s, { title: w.title, folder: w.folder, color: w.color, cards: w.cards, mcq: w.mcq });
        saveSet(s); toast('נשמר'); return viewSet(s);
      }
      case 'add': createTarget = s.id; pages = []; createTab = 'photo'; return viewCreate();
      case 'reset': s.known = {}; s.srs = {}; saveSet(s); toast('ההתקדמות אופסה'); return draw();
      case 'del':
        if (Date.now() - delArm < 3500) { removeSet(s); toast('הסט נמחק'); return viewHome(); }
        delArm = Date.now(); a.textContent = 'בטוח? לחץ שוב'; setTimeout(() => { if (a.isConnected) a.textContent = 'מחק את הסט'; }, 3500); return;
    }
  };
}

function challengeHtml(s){
  const c = s.challenge; if (!c) return '';
  const parts = [c.t != null ? 'מבחן ' + c.t + '%' : '', c.m ? 'התאמת זוגות ' + c.m + '″' : ''].filter(Boolean).join(' · ');
  return `<div class="challenge">🏁 <strong>${esc(c.n || 'חבר')}</strong> מאתגר אותך: ${esc(parts)}</div>`;
}
function viewImport(s){
  leave(); curView = 'import'; tint(s.color);
  app.innerHTML = `
    <header class="hero"><span class="eyebrow">שיתפו איתך סט</span><h2 dir="auto" style="color:var(--k)">${esc(s.title)}</h2><p class="muted">${esc(setStats(s))}</p></header>
    ${challengeHtml(s)}
    <div class="panel stack">
      <p>הסט יישמר במכשיר שלך ותוכל לתרגל אותו גם בלי אינטרנט.</p>
      <button class="btn primary wide" data-a="add">שמור אצלי והתחל לתרגל</button>
      <button class="btn ghost" data-a="skip">לא עכשיו</button>
    </div>`;
  app.onclick = e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    history.replaceState(null, '', location.pathname);
    if (a.dataset.a === 'add') { saveSet(s); return viewSet(s); }
    viewHome();
  };
}

/* ---------------- practice ---------------- */
function topbar(title, count){
  return `<div class="topbar"><button class="iconbtn" data-a="quit" aria-label="סיום">${I.close}</button><div class="grow">${esc(title)}</div><span class="count" id="cnt">${count || ''}</span></div>`;
}
function resultView(s, title, big, line, again, extra){
  const b = String(big), m1 = b.match(/^(\d+)%$/), m2 = b.match(/^(\d+)\/(\d+)$/);
  const pct = m1 ? +m1[1] : m2 && +m2[2] ? Math.round(+m2[1] / +m2[2] * 100) : null;
  const stars = pct == null ? 3 : pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
  const cheer = pct == null ? 'כל הכבוד!' : pct === 100 ? 'מושלם!' : pct >= 90 ? 'מצוין!' : pct >= 60 ? 'יפה מאוד!' : 'עוד קצת אימון ותצליח!';
  app.innerHTML = `${topbar(title)}<div class="panel result">
    ${mascot(pct != null && pct < 60 ? '' : 'happy')}
    <div class="stars" aria-label="${stars} כוכבים">${[1, 2, 3].map(k => `<span class="${k <= stars ? 'on' : ''}" style="animation-delay:${k * .12}s">★</span>`).join('')}</div>
    <h2>${cheer}</h2>
    <div class="score">${b}</div><p class="muted">${line.replace('מושלם! 🎉', '').trim() || '&nbsp;'}</p>
    <button class="btn primary wide big" data-r="quit">המשך</button>
    <div class="row center">${extra || ''}<button class="btn ghost" data-r="again">🔁 שוב</button></div></div>`;
  if (pct === 100) confetti();
  app.onclick = e => {
    const r = e.target.closest('[data-r]'), q = e.target.closest('[data-a="quit"]');
    if (q || (r && r.dataset.r === 'quit')) return s ? viewSet(s) : viewHome();
    if (r && r.dataset.r === 'again') return again();
    if (r && r.dataset.r === 'extra') return again(true);
  };
}
function startMode(s, mode){
  leave(); curView = 'practice';
  if (!['vs', 'videos', 'lesson'].includes(mode)) { s.last = mode; saveSoon(s); }
  if (mode === 'go') return dueIds(s).length ? modeReview(s) : modeTest(s);
  ({ flash: modeFlash, mcq: modeMcq,
     match: () => modeMatch(s, s.cards.map(c => [c.t, c.d]), 'התאמת זוגות', 'match'),
     case: () => { const ci = caseInfo(s); return modeMatch(s, ci.pairs, ci.name, 'case'); },
     scr: modeScr, write: modeWrite, balloon: modeBalloon, sentence: modeSentence, catch: modeCatch, lesson: modeLesson, videos: modeVideos, read: modeReadPick, vs: s => vsHome({ set: s }), review: modeReview, test: modeTest, dict: modeDict })[mode](s);
}

function modeFlash(s, onlyUnknown, reverse){
  leave();
  let deck = shuffle(onlyUnknown ? s.cards.filter(c => !s.known[c.id]) : s.cards);
  if (!deck.length) deck = shuffle(s.cards);
  let i = 0, flipped = false, right = 0; const missed = [];
  function draw(){
    const c = deck[i]; if (deck[i + 1]) prefetchSay(deck[i + 1].t, s.termLang);
    const front = reverse ? c.d : c.t, back = reverse ? c.t : c.d;
    const fl = reverse ? s.defLang : s.termLang, bl = reverse ? s.termLang : s.defLang;
    app.innerHTML = `${topbar('כרטיסיות', (i + 1) + '/' + deck.length)}
      <div class="bar"><i style="width:${i / deck.length * 100}%"></i></div>
      <div class="flip ${flipped ? 'flipped' : ''}" id="flip"><div class="flip-in" role="button" tabindex="0" aria-label="הפוך כרטיס">
        <div class="face">${sayBtn(front, fl)}<div class="big" dir="auto">${esc(front)}</div><span class="hint">הקש כדי להפוך</span></div>
        <div class="face back">${sayBtn(back, bl)}<div class="big" dir="auto">${esc(back)}</div></div>
      </div></div>
      <div class="row"><button class="btn grow big no" data-f="no">עוד לא</button><button class="btn grow big yes" data-f="yes">יודע ✓</button></div>
      <div class="row center"><button class="btn ghost small" data-f="rev">הפוך צדדים</button></div>`;
  }
  function next(knew){
    const c = deck[i];
    if (knew) { s.known[c.id] = true; right++; } else { delete s.known[c.id]; missed.push(c); }
    srsMark(s, c.id, knew); award(knew);
    saveSoon(s); i++; flipped = false;
    if (i >= deck.length) return resultView(s, 'כרטיסיות', `${right}/${deck.length}`, right === deck.length ? 'ידעת הכול!' : `נשארו ${missed.length} לתרגל`,
      only => modeFlash(s, !!only, reverse), missed.length ? '<button class="btn" data-r="extra">רק מה שלא ידעתי</button>' : '');
    draw();
  }
  draw();
  const onKey = e => { if ((e.key === ' ' || e.key === 'Enter') && document.activeElement && document.activeElement.closest('#flip')) { e.preventDefault(); flipped = !flipped; document.getElementById('flip').classList.toggle('flipped', flipped); } };
  document.addEventListener('keydown', onKey); cleanup = () => document.removeEventListener('keydown', onKey);
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const f = e.target.closest('[data-f]');
    if (f) { if (f.dataset.f === 'rev') { reverse = !reverse; flipped = false; return draw(); } return next(f.dataset.f === 'yes'); }
    if (e.target.closest('#flip')) { flipped = !flipped; document.getElementById('flip').classList.toggle('flipped', flipped); }
  };
}

function modeMcq(s){
  leave();
  const qs = shuffle(mcqPool(s)).slice(0, 10), base = qs.length;
  let i = 0, right = 0, answered = false;
  function draw(){
    const q = qs[i];
    app.innerHTML = `${topbar('אמריקאיות', (i + 1) + '/' + qs.length)}
      <div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
      <div class="panel stack">${q.again ? '<span class="eyebrow">🔁 עוד הזדמנות לשאלה שטעית בה</span>' : ''}<div class="row" style="align-items:flex-start"><p class="q grow" dir="auto">${esc(q.q)}</p>${q.say ? sayBtn(q.q, s.termLang) : ''}</div></div>
      <div class="opts">${q.o.map((o, j) => `<button class="opt" data-c="${j % 6}" data-o="${j}"><span class="k">${'אבגדהו'[j]}</span><span dir="auto">${esc(o)}</span></button>`).join('')}</div>
      <div id="after"></div>`;
    answered = false;
  }
  draw();
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const why = e.target.closest('[data-why]');
    if (why) { why.disabled = true; why.textContent = 'חושב…'; explainWhy(qs[i], +why.dataset.why).then(t => why.replaceWith(Object.assign(document.createElement('p'), { className: 'explain', dir: 'auto', textContent: t }))); return; }
    if (e.target.closest('[data-n]')) {
      i++;
      if (i >= qs.length) {
        const pct = Math.round(right / base * 100);
        if (!s.best.mcq || pct > s.best.mcq) { s.best.mcq = pct; saveSoon(s); }
        return resultView(s, 'אמריקאיות', pct + '%', `${right} נכונות בניסיון הראשון מתוך ${base}`, () => modeMcq(s));
      }
      return draw();
    }
    const o = e.target.closest('[data-o]'); if (!o || answered) return;
    answered = true;
    const q = qs[i], pick = +o.dataset.o;
    app.querySelectorAll('.opt').forEach((b, j) => { if (j === q.a) b.classList.add('right'); else if (j === pick) b.classList.add('wrong'); b.disabled = true; });
    if (pick === q.a && !q.again) right++;
    if (pick !== q.a && !q.again) qs.push({ ...q, again: true }); // asked once more at the end of the round
    srsMark(s, q.id, pick === q.a); award(pick === q.a); saveSoon(s);
    document.getElementById('after').innerHTML = `<div class="stack">${q.x ? `<p class="explain" dir="auto">${esc(q.x)}</p>` : ''}${pick !== q.a ? `<button class="btn ghost" type="button" data-why="${pick}">🤔 למה זו התשובה?</button>` : ''}<button class="btn primary wide" data-n="1">${i + 1 < qs.length ? 'הבא' : 'לתוצאה'}</button></div>`;
  };
}

function modeMatch(s, allPairs, title, key){
  leave();
  const pairs = shuffle(allPairs.filter(p => p[0] && p[1] && p[0] !== p[1])).slice(0, 6);
  const tiles = shuffle(pairs.flatMap((p, k) => [{ k, txt: p[0], side: 0 }, { k, txt: p[1], side: 1 }]));
  let sel = null, done = 0, errs = 0; const t0 = Date.now();
  app.innerHTML = `${topbar(title, '0.0')}<p class="muted small">הקש על שני כרטיסים שמתאימים זה לזה.</p>
    <div class="tiles">${tiles.map((t, i) => `<button class="tile" data-c="${i % 6}" data-t="${i}" dir="auto">${esc(t.txt.length > 70 ? t.txt.slice(0, 68) + '…' : t.txt)}</button>`).join('')}</div>`;
  const cnt = document.getElementById('cnt');
  const iv = setInterval(() => { cnt.textContent = ((Date.now() - t0) / 1000).toFixed(1); }, 100);
  cleanup = () => clearInterval(iv);
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const b = e.target.closest('[data-t]'); if (!b || b.classList.contains('gone')) return;
    const i = +b.dataset.t, els = app.querySelectorAll('.tile');
    if (sel === null) { sel = i; b.classList.add('sel'); return; }
    if (sel === i) { b.classList.remove('sel'); sel = null; return; }
    const a = tiles[sel], c = tiles[i], ea = els[sel];
    if (a.k === c.k && a.side !== c.side) {
      ea.classList.add('gone'); b.classList.add('gone'); ea.classList.remove('sel'); done++; award(true);
      if (done === pairs.length) {
        clearInterval(iv); cleanup = null;
        const sec = (Date.now() - t0) / 1000, bk = key + 'Time', best = s.best[bk];
        const isBest = !best || sec < best; if (isBest) { s.best[bk] = Math.round(sec * 10) / 10; saveSoon(s); }
        if (key === 'match' && s.challenge && s.challenge.m && sec < s.challenge.m && !s.challenge.wonM) { s.challenge.wonM = 1; saveSoon(s); bump({ wins: 1 }); setTimeout(() => toast('🥇 ניצחת את ' + (s.challenge.n || 'החבר') + ' בהתאמת זוגות!'), 500); }
        setTimeout(() => resultView(s, title, sec.toFixed(1) + '″', (isBest ? 'שיא חדש! ' : `השיא שלך ${best}″. `) + (errs ? `${errs} טעויות` : 'בלי טעויות'), () => modeMatch(s, allPairs, title, key)), 350);
      }
    } else {
      errs++; ea.classList.remove('sel');
      [ea, b].forEach(x => { x.classList.add('no', 'shake'); setTimeout(() => x.classList.remove('no', 'shake'), 450); });
    }
    sel = null;
  };
}

function modeScr(s){
  leave();
  const items = shuffle(scrItems(s)).slice(0, 10);
  let i = 0, firstTry = 0, tries = 0, letters, placed;
  function setup(){
    const w = items[i].w; let arr, guard = 0;
    do { arr = shuffle(w.split('')); } while (arr.join('') === w && guard++ < 20);
    letters = arr.map(ch => ({ ch, used: false })); placed = []; tries = 0; draw();
  }
  function draw(state){
    const it = items[i], rtl = isRtl(it.w);
    app.innerHTML = `${topbar('סידור אותיות', (i + 1) + '/' + items.length)}
      <div class="bar"><i style="width:${i / items.length * 100}%"></i></div>
      <div class="panel stack" style="text-align:center"><span class="eyebrow">סדר את האותיות למילה</span><p class="q" dir="auto">${esc(it.h || '…')}</p></div>
      <div class="slots ${state || ''}" dir="${rtl ? 'rtl' : 'ltr'}">${it.w.split('').map((_, k) => `<button class="slot" data-s="${k}" aria-label="מקום ${k + 1}">${placed[k] ? esc(placed[k].ch) : ''}</button>`).join('')}</div>
      <div class="letters" dir="${rtl ? 'rtl' : 'ltr'}">${letters.map((l, k) => `<button class="letter ${l.used ? 'used' : ''}" data-l="${k}">${esc(l.ch)}</button>`).join('')}</div>
      <div class="row center">${state === 'no' || tries >= 2 ? '<button class="btn ghost" data-x="show">הצג תשובה</button>' : ''}${sayBtn(it.w, s.termLang, 'btn ghost')}<button class="btn ghost" data-x="skip">דלג</button></div>`;
  }
  function check(){
    const w = items[i].w, got = placed.map(p => p.ch).join('');
    if (got === w) { if (tries === 0) firstTry++; draw('ok'); setTimeout(advance, 800); }
    else { tries++; draw('no'); app.querySelector('.slots').classList.add('shake'); }
  }
  function advance(){
    i++;
    if (i >= items.length) return resultView(s, 'סידור אותיות', `${firstTry}/${items.length}`, 'מילים שסידרת נכון בניסיון הראשון', () => modeScr(s));
    setup();
  }
  setup();
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const l = e.target.closest('[data-l]'), sl = e.target.closest('[data-s]'), x = e.target.closest('[data-x]');
    const len = items[i].w.length;
    if (l) {
      const L = letters[+l.dataset.l]; if (L.used) return;
      const k = [...Array(len).keys()].find(k => !placed[k]); if (k === undefined) return;
      placed[k] = L; L.used = true;
      if (placed.filter(Boolean).length === len) return check();
      return draw();
    }
    if (sl) { const k = +sl.dataset.s; if (placed[k]) { placed[k].used = false; placed[k] = null; draw(); } return; }
    if (x && x.dataset.x === 'skip') return advance();
    if (x && x.dataset.x === 'show') { letters.forEach(L => L.used = true); placed = items[i].w.split('').map(ch => ({ ch })); tries = 9; draw('ok'); setTimeout(advance, 1600); }
  };
}

/* ---------------- learning games ---------------- */
// Save the balloon: spell a word letter by letter from its meaning. Each wrong letter lets some air out.
const ABC_OF = { lat: 'abcdefghijklmnopqrstuvwxyz', heb: 'אבגדהוזחטיכלמנסעפצקרשת', cyr: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя', ara: 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي' };
function balloonWords(s){
  return s.cards.map(c => ({ c, w: String(c.t).trim() })).filter(x => /^[\p{L}' -]{3,14}$/u.test(x.w) && (x.w.match(/\p{L}/gu) || []).length >= 3);
}
function balloonSvg(left, max){
  const k = .55 + .45 * left / max;
  return `<svg class="balloon" viewBox="0 0 120 170" aria-hidden="true">
    <path d="M60 116 C58 130 66 140 58 168" stroke="#8a90a0" stroke-width="2" fill="none"/>
    <g style="transform:scale(${k});transform-origin:60px 116px;transition:transform .35s">
      <ellipse cx="60" cy="62" rx="44" ry="54" fill="var(--k)"/><ellipse cx="44" cy="40" rx="10" ry="16" fill="#fff" opacity=".35"/>
      <path d="M54 114 L66 114 L60 122 Z" fill="var(--k)"/></g></svg>`;
}
function modeBalloon(s){
  leave();
  const items = shuffle(balloonWords(s)).slice(0, 6), MAX = 6;
  let i = 0, saved = 0, guessed, miss;
  function setup(){ guessed = new Set(); miss = 0; draw(); }
  function keys(w){
    const low = w.toLowerCase(), sc = /\p{Script=Hebrew}/u.test(low) ? 'heb' : /\p{Script=Cyrillic}/u.test(low) ? 'cyr' : /\p{Script=Arabic}/u.test(low) ? 'ara' : 'lat';
    const need = [...new Set([...low].filter(ch => /\p{L}/u.test(ch)))];
    const extra = shuffle([...ABC_OF[sc]].filter(ch => !need.includes(ch))).slice(0, Math.max(4, 14 - need.length));
    return shuffle([...need, ...extra]);
  }
  let kb = [];
  function draw(state){
    const it = items[i], w = it.w, low = w.toLowerCase();
    const done = [...low].every(ch => !/\p{L}/u.test(ch) || guessed.has(ch));
    if (!state) kb = kb.length && kb.w === w ? kb : Object.assign(keys(w), { w });
    app.innerHTML = `${topbar('הצל את הבלון', (i + 1) + '/' + items.length)}
      <div class="bar"><i style="width:${i / items.length * 100}%"></i></div>
      <div class="balloonbox" data-c="${i % 6}">${state === 'lost' ? '<div class="pop">💥</div>' : balloonSvg(MAX - miss, MAX)}${mascot(state === 'won' ? 'happy' : state === 'lost' ? '' : 'think')}</div>
      <div class="panel stack center"><span class="eyebrow">איזו מילה זו?</span><p class="q" dir="auto">${esc(it.c.d)}</p></div>
      <div class="slots ${state === 'won' ? 'ok' : state === 'lost' ? 'no' : ''}" dir="auto">${[...w].map(ch => /\p{L}/u.test(ch) ? `<span class="slot">${guessed.has(ch.toLowerCase()) || state === 'lost' ? esc(ch) : ''}</span>` : `<span class="gap">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</div>
      ${state ? `<button class="btn primary wide big" data-x="next">${i + 1 < items.length ? 'למילה הבאה' : 'לתוצאה'}</button>`
        : `<div class="letters" dir="auto">${kb.map(ch => `<button class="letter ${guessed.has(ch) ? (low.includes(ch) ? 'used good' : 'used bad') : ''}" data-l="${esc(ch)}" ${guessed.has(ch) ? 'disabled' : ''}>${esc(ch)}</button>`).join('')}</div>
        <p class="small muted center">נשארו ${MAX - miss} ניסיונות</p>`}`;
    if (!state && done) finish(true);
  }
  function finish(won){
    const it = items[i];
    if (won) saved++;
    srsMark(s, it.c.id, won && miss <= 2); award(won); saveSoon(s);
    if (won) speak(it.w, s.termLang);
    draw(won ? 'won' : 'lost');
  }
  setup();
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    if (e.target.closest('[data-x="next"]')) { i++; if (i >= items.length) return resultView(s, 'הצל את הבלון', `${saved}/${items.length}`, 'בלונים שהצלת', () => modeBalloon(s)); kb = []; return setup(); }
    const l = e.target.closest('[data-l]'); if (!l || l.disabled) return;
    const ch = l.dataset.l; guessed.add(ch);
    if (!items[i].w.toLowerCase().includes(ch)) { miss++; if (miss >= MAX) return finish(false); }
    draw();
  };
}

// Build the sentence: the words of a sentence from the set's stories, mixed up; put them back in order.
function sentencesOf(s){
  const out = [];
  s.reading.forEach(r => String(r.text).replace(/([.!?؟])\s+/g, '$1\u0001').split(/\u0001|\n+/).forEach(t => {
    t = t.trim(); const n = t.split(/\s+/).length;
    if (n >= 4 && n <= 10 && !/[֐-׿]/.test(t)) out.push({ t, lang: r.lang });
  }));
  s.cards.forEach(c => { const n = String(c.t).trim().split(/\s+/).length; if (n >= 4 && n <= 10) out.push({ t: c.t.trim(), lang: s.termLang, hint: c.d }); });
  return out;
}
function modeSentence(s){
  leave();
  const items = shuffle(sentencesOf(s)).slice(0, 6);
  let i = 0, firstTry = 0, tries, pool, line;
  const norm = t => String(t).toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, '').replace(/\s+/g, ' ').trim();
  function setup(){
    const words = items[i].t.split(/\s+/); let mixed, guard = 0;
    do { mixed = shuffle(words.map((w, k) => ({ w, k }))); } while (mixed.map(x => x.k).join() === words.map((_, k) => k).join() && guard++ < 20);
    pool = mixed; line = []; tries = 0; draw();
  }
  function draw(state){
    const it = items[i], rtl = isRtl(it.t);
    app.innerHTML = `${topbar('בנה משפט', (i + 1) + '/' + items.length)}
      <div class="bar"><i style="width:${i / items.length * 100}%"></i></div>
      <div class="panel stack center"><span class="eyebrow">סדר את המילים למשפט</span>${it.hint ? `<p class="q" dir="auto">${esc(it.hint)}</p>` : ''}</div>
      <div class="sline ${state || ''}" dir="${rtl ? 'rtl' : 'ltr'}">${line.length ? line.map((x, k) => `<button class="chip word" data-back="${k}">${esc(x.w)}</button>`).join('') : '<span class="muted small">לחץ על המילים לפי הסדר</span>'}</div>
      <div class="spool" dir="${rtl ? 'rtl' : 'ltr'}">${pool.map((x, k) => `<button class="chip word" data-take="${k}">${esc(x.w)}</button>`).join('')}</div>
      ${state === 'ok' ? `<p class="note good">נכון! 🎉</p>${sayBtn(it.t, it.lang, 'btn ghost')}<button class="btn primary wide big" data-x="next">${i + 1 < items.length ? 'למשפט הבא' : 'לתוצאה'}</button>`
        : state === 'show' ? `<p class="note bad" dir="auto">${esc(it.t)}</p><button class="btn primary wide big" data-x="next">${i + 1 < items.length ? 'למשפט הבא' : 'לתוצאה'}</button>`
        : `<div class="row center">${tries >= 1 ? '<button class="btn ghost" data-x="show">הצג תשובה</button>' : ''}<button class="btn ghost" data-x="clear">התחל מחדש</button></div>`}`;
  }
  function check(){
    const it = items[i];
    if (norm(line.map(x => x.w).join(' ')) === norm(it.t)) { if (!tries) firstTry++; award(true); speak(it.t, it.lang); return draw('ok'); }
    tries++; award(false); draw('no'); app.querySelector('.sline').classList.add('shake');
  }
  setup();
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const tk = e.target.closest('[data-take]'), bk = e.target.closest('[data-back]'), x = e.target.closest('[data-x]');
    if (tk) { line.push(pool.splice(+tk.dataset.take, 1)[0]); return pool.length ? draw() : check(); }
    if (bk) { pool.push(line.splice(+bk.dataset.back, 1)[0]); return draw(); }
    if (!x) return;
    if (x.dataset.x === 'clear') { pool = [...pool, ...line]; line = []; return draw(); }
    if (x.dataset.x === 'show') { tries = 9; return draw('show'); }
    if (x.dataset.x === 'next') { i++; if (i >= items.length) return resultView(s, 'בנה משפט', `${firstTry}/${items.length}`, 'משפטים שסידרת נכון בניסיון הראשון', () => modeSentence(s)); return setup(); }
  };
}

// Catch the right one: the answers fall in three lanes; tap a lane to move the basket under the right answer.
function modeCatch(s){
  leave();
  const qs = shuffle(mcqPool(s)).slice(0, 12).map(m => {
    const others = shuffle(m.o.filter((_, j) => j !== m.a)).slice(0, 2), o = shuffle([m.o[m.a], ...others]);
    return { ...m, o, a: o.indexOf(m.o[m.a]) };
  });
  let i = 0, right = 0, lives = 3, lane = 1, raf = 0, y = 0, speed = 0, last = 0, busy = false;
  app.innerHTML = `${topbar('תפוס את הנכון', '')}
    <div class="catchtop"><span id="hearts"></span><span class="pill">⭐ <b id="cscore">0</b></span></div>
    <div class="panel stack center"><p class="q" dir="auto" id="cq"></p></div>
    <div class="catch" id="field">${[0, 1, 2].map(k => `<div class="lane" data-lane="${k}"></div>`).join('')}
      <div class="drops" id="drops"></div><div class="basket" id="basket">🧺</div></div>
    <p class="small muted center">לחץ על המסלול שבו נופלת התשובה הנכונה</p>`;
  const field = document.getElementById('field'), drops = document.getElementById('drops'), basket = document.getElementById('basket');
  const hearts = () => { document.getElementById('hearts').textContent = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives); };
  const placeBasket = () => { basket.style.insetInlineStart = `calc(${lane * 33.333 + 16.666}% - 28px)`; };
  function round(){
    if (i >= qs.length || lives <= 0) return end();
    const q = qs[i]; busy = false;
    document.getElementById('cq').textContent = q.q; document.getElementById('cnt').textContent = (i + 1) + '/' + qs.length;
    drops.innerHTML = q.o.map((o, k) => `<div class="drop" data-c="${(i + k) % 6}" style="inset-inline-start:${k * 33.333}%"><span dir="auto">${esc(o)}</span></div>`).join('');
    y = 0; speed = 0.018 + i * 0.0016; last = performance.now(); raf = requestAnimationFrame(tick);
  }
  function tick(t){
    const dt = Math.min(50, t - last); last = t; y += speed * dt;
    drops.style.transform = `translateY(${y}%)`;
    if (y >= 78) return land();
    raf = requestAnimationFrame(tick);
  }
  function land(){
    if (busy) return; busy = true; cancelAnimationFrame(raf);
    const q = qs[i], ok = lane === q.a, els = drops.querySelectorAll('.drop');
    els.forEach((el, k) => el.classList.add(k === q.a ? 'right' : k === lane ? 'wrong' : 'fade'));
    if (ok) { right++; document.getElementById('cscore').textContent = right; basket.classList.add('yay'); } else { lives--; hearts(); field.classList.add('shake'); }
    srsMark(s, q.id, ok); award(ok); saveSoon(s);
    setTimeout(() => { basket.classList.remove('yay'); field.classList.remove('shake'); i++; round(); }, ok ? 650 : 1300);
  }
  function end(){ cancelAnimationFrame(raf); resultView(s, 'תפוס את הנכון', `${right}/${qs.length}`, lives > 0 ? 'תשובות שתפסת' : 'נגמרו הלבבות, נסה שוב!', () => modeCatch(s)); }
  cleanup = () => cancelAnimationFrame(raf);
  hearts(); placeBasket(); round();
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const ln = e.target.closest('[data-lane], .drop'); if (!ln || busy) return;
    lane = ln.dataset.lane != null ? +ln.dataset.lane : [...drops.children].indexOf(ln); placeBasket();
  };
}

function modeWrite(s){
  leave();
  const items = shuffle(s.cards).slice(0, 10);
  const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-֑ͯ-ׇ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  let i = 0, right = 0, answered = false;
  function draw(){
    const c = items[i];
    app.innerHTML = `${topbar('כתיבה', (i + 1) + '/' + items.length)}
      <div class="bar"><i style="width:${i / items.length * 100}%"></i></div>
      <div class="panel stack"><span class="eyebrow">כתוב את המילה שמתאימה</span><p class="q" dir="auto">${esc(c.d)}</p></div>
      <form id="wf" class="stack"><input type="text" id="ans" dir="auto" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="התשובה שלך" placeholder="התשובה שלך">
      <button class="btn primary wide" type="submit" id="chk">בדוק</button></form><div id="after"></div>`;
    answered = false; setTimeout(() => { const inp = document.getElementById('ans'); if (inp) inp.focus(); }, 50);
  }
  function go(){ i++; if (i >= items.length) return resultView(s, 'כתיבה', `${right}/${items.length}`, 'תשובות נכונות', () => modeWrite(s)); draw(); }
  draw();
  app.onsubmit = ev => {
    ev.preventDefault();
    if (answered) return go();
    const inp = document.getElementById('ans'), c = items[i], v = inp.value; if (!v.trim()) return;
    answered = true; const res = checkAns(v, c.t), ok = res !== 'no';
    if (ok) { right++; if (res === 'ok') s.known[c.id] = true; saveSoon(s); }
    srsMark(s, c.id, res === 'ok'); award(ok);
    inp.readOnly = true; inp.style.borderColor = res === 'ok' ? 'var(--ok)' : res === 'almost' ? 'var(--warn,#c98a00)' : 'var(--bad)';
    document.getElementById('chk').hidden = true;
    document.getElementById('after').innerHTML = `<div class="stack">${answerNote(res, v, c.t)}
      <button class="btn primary wide" type="button" data-w="next">${i + 1 < items.length ? 'הבא' : 'לתוצאה'}</button></div>`;
  };
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const w = e.target.closest('[data-w]'); if (!w) return;
    if (w.dataset.w === 'mine') { right++; s.known[items[i].id] = true; saveSoon(s); w.remove(); return; }
    if (w.dataset.w === 'next') go();
  };
}

/* lesson: an explanation written from the pages; made on demand for sets that don't have one */
function materialText(s){
  const parts = [];
  s.cards.forEach(c => parts.push(c.t + ' — ' + c.d));
  s.mcq.forEach(m => parts.push('שאלה: ' + m.q + ' | תשובה: ' + m.o[m.a]));
  return parts.join('\n').slice(0, 12000);
}
/* ---------------- getting ready ahead of time ---------------- */
// Slow things (the short lesson, the next story, the voice of the next word) are prepared in the background
// while the student is busy with something else, so they open at once when asked for.
const jobs = new Map();
function job(key, fn){ if (!jobs.has(key)) jobs.set(key, fn().finally(() => jobs.delete(key))); return jobs.get(key); }
function lessonJob(s){
  return job(s.id + ':lesson', async () => {
    const data = await callApi({ mode: 'lesson', title: s.title, material: materialText(s) });
    const p = normalize(data && data.result);
    if (!p.lesson.length) throw { code: 'bad_json' };
    s.lesson = p.lesson;
    const tk = new Set(s.topics.map(t => t.name)); p.topics.forEach(t => { if (!tk.has(t.name)) s.topics.push(t); });
    if (sets.includes(s)) saveSet(s);
  });
}
const storyDefaults = s => ({ genre: '', level: s.level || 'כיתה ז׳', lang: s.learn || 'he', idea: '' });
const sameStory = (a, b) => !!(a && b && a.genre === b.genre && a.level === b.level && a.lang === b.lang && !a.idea && !b.idea);
async function fetchStory(s, o, signal){
  const words = s.cards.map(c => c.t).filter(t => !isRtl(t)).slice(0, 30).join(', ');
  const data = await callApi({ mode: 'story', lang: o.lang, level: o.level, genre: o.genre, idea: o.idea, words, avoid: [...s.reading.map(r => r.title), s.nextStory && s.nextStory.r.title].filter(Boolean) }, signal);
  const r = normalize(data && data.result).reading[0];
  if (!r) throw { code: 'bad_json' };
  r.lang = r.lang || o.lang; r.genre = o.genre; r.id = 'r' + rid();
  return { r, model: data && data.model, nikud: data && data.nikud };
}
function storyJob(s){
  return job(s.id + ':story', async () => { const o = storyDefaults(s); const got = await fetchStory(s, o); s.nextStory = { ...got, o }; if (sets.includes(s)) saveSet(s); });
}
// the prepared story becomes a real one
function useNextStory(s){
  const n = s.nextStory; if (!n) return null;
  delete s.nextStory; s.reading.push(n.r); if (s.reading.length > 40) s.reading.shift();
  saveSet(s); if (n.nikud === false) nikudNote({ nikud: false }); verifySet(s, n.model);
  prepareAhead(s, 6000);
  return n.r;
}
const wantsStories = s => s.reading.length > 0 || learnCode(s) !== 'he';
let aheadT = null;
function prepareAhead(s, delay = 2500){
  clearTimeout(aheadT);
  aheadT = setTimeout(async () => {
    if (!s || !sets.includes(s) || navigator.onLine === false) return;
    for (const r of s.reading) { try { await glossJob(s, r); } catch(e){} }
    try { if (!s.lesson.length && s.cards.length + s.mcq.length) await lessonJob(s); } catch(e){}
    try { if (!s.nextStory && wantsStories(s)) await storyJob(s); } catch(e){}
    try { if (s.nextStory) await glossJob(s, s.nextStory.r); } catch(e){}
  }, delay);
}
// every word of a foreign-language story gets its meaning in one request, before anyone taps it
const wordKey = w => String(w).toLowerCase().replace(/^[’'"“”]+|[’'"“”.,!?;:]+$/g, '');
const isForeign = r => (r.lang || '').slice(0, 2) !== 'he' && !/[֐-׿]/.test(String(r.text).slice(0, 200));
function glossJob(s, r){
  if (!r || r.gloss || !isForeign(r)) return Promise.resolve();
  return job(s.id + ':gloss:' + r.id, async () => {
    const d = await callApi({ mode: 'gloss', text: String(r.text).slice(0, 4000), lang: (r.lang || s.termLang || 'en').slice(0, 2) });
    const w = d && d.result && d.result.w;
    if (!w || typeof w !== 'object') throw { code: 'bad_json' };
    s.wordTr = s.wordTr || {};
    Object.keys(w).forEach(k => { const key = wordKey(k), tr = String(w[k] || '').slice(0, 80); if (key && tr && !s.wordTr[key]) s.wordTr[key] = { tr }; });
    r.gloss = true; if (sets.includes(s)) saveSet(s);
  });
}
let ttsUsed = false;
function prefetchSay(text, lang, force){ if ((ttsUsed || force) && text) ttsBlob(chunksOf(text)[0], guessLang(text, lang)).catch(() => {}); }

async function makeLesson(s){
  leave(); curView = 'lesson-gen'; tint(s.color);
  app.innerHTML = `${topbar('שיעור קצר')}<div class="panel working">
    ${mascot('think')}
    <h2>כותב שיעור על החומר</h2><p class="muted">עוד כמה שניות.</p></div>${gameZone()}`;
  cleanup = startGames();
  app.onclick = e => { if (e.target.closest('[data-a="quit"]')) viewSet(s); };
  try { await lessonJob(s); if (curView === 'lesson-gen') modeLesson(s); }
  catch(e) {
    if (curView !== 'lesson-gen') return;
    if (e && e.code === 'need_code') return viewNeedCode(() => makeLesson(s));
    viewSet(s); toast(errText(e));
  }
}
function modeLesson(s){
  if (!s.lesson.length) return makeLesson(s);
  leave(); curView = 'practice'; tint(s.color);
  app.innerHTML = `${topbar('שיעור קצר')}
    <h2 dir="auto" style="color:var(--k)">${esc(s.title)}</h2>
    <div class="lesson">${s.lesson.map((x, i) => `<section data-c="${i % 6}"><h3 dir="auto">${esc(x.h)}</h3>${x.b.split(/\n+/).filter(Boolean).map(p => `<p dir="auto">${esc(p)}</p>`).join('')}</section>`).join('')}</div>
    <div class="row"><button class="btn colored grow" data-c="1" data-a="videos">${I.play} סרטונים על הנושא</button><button class="btn grow" data-a="quit2">לתרגול</button></div>`;
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]') || e.target.closest('[data-a="quit2"]')) return viewSet(s);
    if (e.target.closest('[data-a="videos"]')) return modeVideos(s);
  };
}
function modeReadPick(s){
  if (!s.reading.length && s.nextStory) return modeRead(s, useNextStory(s));
  if (!s.reading.length) return modeStoryNew(s);
  if (s.reading.length === 1) return modeRead(s, s.reading[0]);
  leave(); curView = 'practice'; tint(s.color);
  app.innerHTML = `${topbar('קטעי קריאה')}<button class="btn primary wide" data-a="newstory">📖 סיפור חדש</button>
    <div class="stack">${s.reading.map((r, i) => `<button class="vid" data-c="${i % 6}" data-r="${i}"><span class="play">${I.book}</span><span class="grow"><strong dir="auto">${esc(r.title || 'קטע ' + (i + 1))}</strong><span class="small muted">${r.q.length} שאלות${r.genre ? ' · ' + esc((GENRES.find(g => g[0] === r.genre) || ['', ''])[1]) : ''}</span></span></button>`).reverse().join('')}</div>`;
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    if (e.target.closest('[data-a="newstory"]')) return modeStoryNew(s);
    const b = e.target.closest('[data-r]'); if (b) modeRead(s, s.reading[+b.dataset.r]);
  };
}
const GENRES = [['', '🎲 הפתע אותי'], ['adventure', '🗺️ הרפתקה'], ['funny', '😂 מצחיק'], ['animals', '🐾 חיות'], ['sport', '⚽ ספורט'], ['science', '🔬 מדע וטבע'], ['mystery', '🕵️ מסתורין'], ['daily', '🏠 יום-יום'], ['fantasy', '🐉 פנטזיה']];
const SCRIPT_LANG = { lat: 'en', cyr: 'ru', ara: 'ar', kana: 'ja', han: 'zh', eth: 'am' };
// the language the student is learning; Hebrew only when the set has no foreign language at all
function learnCode(s){
  if (s.learn) return s.learn;
  const code = [...s.reading.map(r => r.lang), s.termLang, s.defLang].map(x => String(x || '').slice(0, 2).toLowerCase()).find(x => x && x !== 'he' && LANGS.some(l => l[0] === x));
  if (code) return code;
  const txt = s.cards.map(c => c.t + ' ' + c.d).join(' ').replace(/\p{Script=Hebrew}/gu, '');
  for (const k of ['cyr', 'ara', 'kana', 'han', 'eth', 'lat']) if ((txt.match(new RegExp(SCRIPTS[k].source, 'gu')) || []).length >= 6) return SCRIPT_LANG[k];
  return 'he';
}
function modeStoryNew(s){
  leave(); curView = 'practice'; tint(s.color);
  let genre = '';
  const lang = 'he', level = s.level || 'כיתה ז׳'; // Hebrew unless the student picks another language
  app.innerHTML = `${topbar('סיפור חדש')}
    <section class="panel stack">
      <span class="small muted">איזה סיפור?</span>
      <div class="chips wrap" role="group" aria-label="סוג הסיפור">${GENRES.map(g => `<button type="button" class="chip" data-g="${g[0]}" aria-pressed="${g[0] === genre}">${g[1]}</button>`).join('')}</div>
      <div class="pickrow two">
        <label for="slvl"><span class="small muted">רמה</span><select id="slvl">${LEVELS.map(x => `<option ${x === level ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label for="slng"><span class="small muted">שפה</span><select id="slng">${LANGS.map(([v, n]) => `<option value="${v}" ${v === lang ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>
      <label class="stack" for="sidea" style="gap:6px"><span class="small muted">רעיון משלך (לא חובה)</span><input type="text" id="sidea" maxlength="150" placeholder="למשל: ילד שמוצא חתול בגשם" dir="auto"></label>
      <button class="btn primary wide" type="button" data-a="mkstory">📖 צור סיפור</button>
      ${s.reading.length ? `<button class="btn wide" type="button" data-a="list">לסיפורים הקודמים (${s.reading.length})</button>` : ''}
    </section>`;
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    if (e.target.closest('[data-a="list"]')) return s.reading.length === 1 ? modeRead(s, s.reading[0]) : modeReadPick(s);
    const g = e.target.closest('[data-g]');
    if (g) { genre = g.dataset.g; app.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', String(b === g))); return; }
    if (e.target.closest('[data-a="mkstory"]')) {
      const lv = document.getElementById('slvl').value, lg = document.getElementById('slng').value;
      s.level = lv; if (lg !== 'he') s.learn = lg; saveSoon(s);
      makeStory(s, { genre, level: lv, lang: lg, idea: document.getElementById('sidea').value.trim() });
    }
  };
}
// the server leaves a text without nikud rather than with nikud it could not get from the vocalizer
const nikudNote = d => { if (d && d.nikud === false) setTimeout(() => toast('הניקוד לא היה זמין הפעם, אז הטקסט בלי ניקוד. נסה סיפור חדש בעוד רגע.'), 400); };
async function makeStory(s, o){
  leave(); curView = 'story-gen'; tint(s.color);
  app.innerHTML = `${topbar('סיפור חדש')}<div class="panel working">
    ${mascot('think')}
    <h2>כותב לך סיפור</h2><p class="muted">${esc((GENRES.find(g => g[0] === o.genre) || GENRES[0])[1])} · ${esc(o.level)}</p></div>${gameZone()}`;
  cleanup = startGames();
  const ctl = new AbortController();
  app.onclick = e => { if (e.target.closest('[data-a="quit"]')) { ctl.abort(); modeStoryNew(s); } };
  try {
    // the story prepared in the background fits this choice: use it (or wait for it if it is still being written)
    if (!(s.nextStory && sameStory(s.nextStory.o, o)) && jobs.has(s.id + ':story') && sameStory(storyDefaults(s), o)) { try { await jobs.get(s.id + ':story'); } catch(e){} }
    if (curView !== 'story-gen') return;
    if (s.nextStory && sameStory(s.nextStory.o, o)) { const r = useNextStory(s); return modeRead(s, r); }
    const got = await fetchStory(s, o, ctl.signal), r = got.r;
    s.reading.push(r); if (s.reading.length > 40) s.reading.shift();
    saveSet(s); if (curView === 'story-gen') modeRead(s, r); nikudNote(got); verifySet(s, got.model);
  } catch(e) {
    if (e && e.name === 'AbortError') return;
    if (e && e.code === 'need_code') return viewNeedCode(() => makeStory(s, o));
    modeStoryNew(s); toast(errText(e));
  }
}
// "Question? (תרגום)" → question on one line, Hebrew translation under it
function bi(t){
  const m = String(t).match(/^([\s\S]*?)\s*\(([^()]*[\u0590-\u05FF][^()]*)\)\s*\.?$/);
  if (!m || !m[1].trim() || isRtl(m[1])) return `<span dir="auto">${esc(t)}</span>`;
  return `<span dir="auto">${esc(m[1])}</span><span class="tr" dir="rtl">${esc(m[2])}</span>`;
}
// every word of a foreign-language passage can be tapped for its meaning
function tapWords(p){
  return esc(p).replace(/(\p{L}[\p{L}\p{M}'’]*)/gu, w => /[\u0590-\u05FF]/.test(w) ? w : `<span class="tw" role="button" tabindex="0">${w}</span>`);
}
async function wordSheet(s, r, el){
  const word = el.textContent.replace(/[’']+$/, ''), key = word.toLowerCase(), para = el.closest('p'), lang = (r.lang || s.termLang || 'en').slice(0, 2);
  app.querySelectorAll('.tw.on').forEach(x => x.classList.remove('on')); el.classList.add('on');
  let sh = document.getElementById('wsheet');
  if (!sh) { sh = document.createElement('div'); sh.id = 'wsheet'; sh.className = 'wsheet'; app.appendChild(sh); }
  const draw = tr => { sh.innerHTML = `<strong dir="auto" class="ww">${esc(word)}</strong><p class="wtr" dir="auto">${tr ? esc(tr) : '<span class="muted">מתרגם…</span>'}</p>`; };
  s.wordTr = s.wordTr || {};
  const k2 = wordKey(word), find = () => s.wordTr[key] || s.wordTr[k2];
  let hit = find();
  draw(hit && hit.tr); sh.hidden = false;
  sh.onclick = () => { sh.hidden = true; el.classList.remove('on'); };
  if (hit) return;
  const pending = jobs.get(s.id + ':gloss:' + r.id);
  if (pending) { try { await pending; } catch(e){} hit = find(); if (hit) { if (!sh.hidden && el.classList.contains('on')) draw(hit.tr); return; } }
  try {
    const sentence = (para ? para.textContent : '').replace(/([.!?])\s+/g, '$1\u0001').split('\u0001').find(x => x.includes(word)) || (para ? para.textContent.slice(0, 300) : '');
    const d = await callApi({ mode: 'word', word, sentence, lang });
    const res = d && d.result || {};
    if (!res.tr) throw 0;
    s.wordTr[key] = { tr: String(res.tr).slice(0, 80), base: String(res.base || '').slice(0, 60) }; saveSoon(s);
    if (!sh.hidden && el.classList.contains('on')) draw(s.wordTr[key].tr);
  } catch(e) { if (!sh.hidden) sh.querySelector('.wtr').textContent = 'לא הצלחתי לתרגם עכשיו'; }
}
function modeRead(s, r){
  leave(); curView = 'practice'; tint(s.color);
  let right = 0, done = 0;
  const foreign = isForeign(r);
  if (foreign && !r.gloss) glossJob(s, r).catch(() => {});
  app.innerHTML = `${topbar('קטע קריאה', r.q.length ? '0/' + r.q.length : '')}
    <article class="panel stack reading" lang="${esc(r.lang || '')}">
      <div class="row between" style="align-items:flex-start"><h2 class="grow" dir="auto">${esc(r.title)}</h2>${sayBtn(r.text, r.lang)}</div>
      ${r.instr ? `<p class="explain bi">${bi(r.instr)}</p>` : ''}
      ${foreign ? '<p class="small muted">💡 לא מבין מילה? לחץ עליה</p>' : ''}
      ${r.text.split(/\n+/).filter(Boolean).map((p, pi) => `<p dir="auto" data-pi="${pi}">${foreign ? tapWords(p) : esc(p)}</p>`).join('')}
    </article>
    ${r.q.length ? `<h3>שאלות הבנה</h3>` : ''}
    <div class="stack">${r.q.map((m, i) => `<div class="panel stack" data-qi="${i}"><p class="q bi">${bi(m.q)}</p>
      <div class="opts">${m.o.map((o, j) => `<button class="opt" data-c="${j % 6}" data-o="${j}"><span class="k">${'אבגדהו'[j]}</span><span dir="auto">${esc(o)}</span></button>`).join('')}</div>
      <div class="after"></div></div>`).join('')}</div>
    <div id="rres"></div>
    <div class="row"><button class="btn colored grow" data-c="5" data-a="newstory">📖 סיפור חדש</button>${s.reading.length > 1 ? `<button class="btn grow" data-a="allst">כל הסיפורים (${s.reading.length})</button>` : ''}</div>`;
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    const tw = e.target.closest('.tw'); if (tw) return wordSheet(s, r, tw);
    const open = document.getElementById('wsheet'); if (open && !open.hidden && !e.target.closest('#wsheet')) { open.hidden = true; app.querySelectorAll('.tw.on').forEach(x => x.classList.remove('on')); }
    if (e.target.closest('[data-a="newstory"]')) return modeStoryNew(s);
    if (e.target.closest('[data-a="allst"]')) return modeReadPick(s);
    if (e.target.closest('[data-r2]')) return modeRead(s, r);
    if (e.target.closest('[data-back]')) return viewSet(s);
    const o = e.target.closest('[data-o]'); if (!o) return;
    const box = o.closest('[data-qi]'); if (!box || box.dataset.done) return;
    box.dataset.done = '1';
    const m = r.q[+box.dataset.qi], pick = +o.dataset.o;
    box.querySelectorAll('.opt').forEach((b, j) => { if (j === m.a) b.classList.add('right'); else if (j === pick) b.classList.add('wrong'); b.disabled = true; });
    if (pick === m.a) right++;
    done++;
    if (m.x) box.querySelector('.after').innerHTML = `<p class="explain" dir="auto">${esc(m.x)}</p>`;
    document.getElementById('cnt').textContent = done + '/' + r.q.length;
    if (done === r.q.length) document.getElementById('rres').innerHTML = `<div class="panel result"><div class="score">${right}/${r.q.length}</div><p>תשובות נכונות</p><div class="row center"><button class="btn primary" data-r2="1">שוב</button><button class="btn" data-back="1">חזרה לסט</button></div></div>`;
  };
}

function modeVideos(s){
  leave(); curView = 'practice'; tint(s.color);
  const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  const topics = s.topics.length ? s.topics : [{ name: s.title, q: s.title + ' הסבר' }];
  app.innerHTML = `${topbar('סרטונים')}
    <p class="muted">לכל נושא בסט יש חיפוש מוכן ביוטיוב. הסרטונים נפתחים ביוטיוב.</p>
    <div class="stack">${topics.map((t, i) => `<a class="vid" data-c="${i % 6}" href="${yt(t.q)}" target="_blank" rel="noopener"><span class="play">${I.play}</span><span class="grow"><strong dir="auto">${esc(t.name)}</strong><span class="small muted" dir="auto">${esc(t.q)}</span></span></a>`).join('')}</div>
    ${!s.topics.length && (s.cards.length || s.mcq.length) ? '<button class="btn wide" data-a="mk">מצא נושאים מדויקים מתוך החומר</button>' : ''}`;
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
    if (e.target.closest('[data-a="mk"]')) { s.lesson = []; return makeLesson(s); }
  };
}

/* ---------------- example ---------------- */
function exampleSet(){
  const s = fixSet({ title: 'דוגמה: חיות באנגלית', termLang: 'en', defLang: 'he', example: true, color: 2 });
  mergeInto(s, {
    cards: [['dog','כלב'],['cat','חתול'],['horse','סוס'],['rabbit','ארנב'],['turtle','צב'],['eagle','נשר'],['whale','לווייתן'],['monkey','קוף'],['lion','אריה'],['sheep','כבשה']].map(([t, d]) => ({ t, d })),
    mcq: [
      { q: 'What is the plural of "sheep"?', o: ['sheep','sheeps','sheepes','shoop'], a: 0, x: 'המילה sheep נשארת אותו דבר ברבים.' },
      { q: 'Which animal can fly?', o: ['whale','turtle','eagle','horse'], a: 2, x: 'eagle הוא נשר, והוא עוף.' },
      { q: 'A baby cat is called a…', o: ['puppy','kitten','calf','cub'], a: 1, x: 'kitten הוא גור חתולים.' },
      { q: 'Which word has 6 letters?', o: ['lion','horse','monkey','dog'], a: 2, x: 'monkey: m-o-n-k-e-y, שש אותיות.' }
    ],
    topics: [{ name: 'חיות באנגלית לילדים', q: 'animals in English for kids' }, { name: 'רבים חריגים באנגלית', q: 'irregular plurals english sheep mice' }],
    lesson: [
      { h: 'שמות של חיות', b: 'באנגלית לכל חיה יש מילה משלה: dog הוא כלב, cat הוא חתול, horse הוא סוס.\nכדאי לומר את המילה בקול כשמתרגלים, כך קל יותר לזכור איך היא נשמעת.' },
      { h: 'רבים רגילים וחריגים', b: 'ברוב המילים מוסיפים s ברבים: dog → dogs, cat → cats.\nיש מילים חריגות: sheep נשאר sheep, ו-mouse הופך ל-mice.' }
    ]
  });
  return s;
}

/* ---------------- one on one between two phones ---------------- */
// Both phones get the same questions; each one answers at its own pace with a timer,
// and every second they read each other's score from /api/room.
const VS_SEC = 20, VS_N = 10;
async function roomApi(payload){
  let r;
  try { r = await fetch('/api/room', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); }
  catch(e) { const err = new Error('net'); err.code = navigator.onLine === false ? 'offline' : 'no_server'; throw err; }
  let d = null; try { d = await r.json(); } catch(e){}
  if (!r.ok) { const err = new Error('room'); err.code = (d && d.code) || (r.status === 404 ? 'no_server' : 'server'); throw err; }
  return d;
}
const VS_ERR = {
  no_db: 'המשחק מול חבר עוד לא הופעל בשרת (חסר מסד נתונים ב-Vercel).',
  not_found: 'לא מצאתי משחק עם הקוד הזה. בדוק את הקוד, או בקש מהחבר ליצור משחק חדש.',
  full: 'במשחק הזה כבר יש שני שחקנים.',
  few_questions: 'צריך לפחות 4 שאלות בסט כדי לשחק.'
};
const vsErr = e => VS_ERR[e && e.code] || errText(e);
function vsQuestions(s){
  return shuffle(mcqPool(s)).slice(0, VS_N).map(m => {
    const o = shuffle(m.o.map((t, i) => ({ t, ok: i === m.a })));
    return { q: m.q, o: o.map(x => x.t), a: o.findIndex(x => x.ok), x: m.x || '' };
  });
}
function vsPoll(g, onData, ms){
  let stop = false, t, fails = 0;
  const tick = async () => {
    if (stop) return;
    try { const d = await roomApi({ action: 'poll', code: g.code }); fails = 0; g.offset = d.now - Date.now(); if (!stop) onData(d); }
    catch(e) {
      if (stop) return;
      if (e.code === 'not_found') { stop = true; toast('המשחק כבר נסגר'); return viewHome(); }
      if (++fails === 4) toast('החיבור חלש, ממשיך לנסות…');
    }
    if (!stop) t = setTimeout(tick, ms);
  };
  tick();
  return () => { stop = true; clearTimeout(t); };
}
const vsOther = (g, d) => (d && d[g.role === 'h' ? 'g' : 'h']) || null;

function vsHome(opt){
  opt = opt || {};
  leave(); curView = 'vs'; tint(opt.set ? opt.set.color : 4);
  const playable = sets.filter(s => mcqPool(s).length >= 4);
  app.innerHTML = `${topbar('⚔️ אחד על אחד')}
    <p class="muted">משחק מול חבר, כל אחד בטלפון שלו. שניכם מקבלים את אותן ${VS_N} שאלות, ומי שעונה נכון ומהר יותר מנצח.</p>
    <label class="stack panel" for="vsname" style="gap:6px"><span class="small muted">השם שלך במשחק</span>
      <input type="text" id="vsname" maxlength="20" value="${esc(lget('lomdim_name') || '')}" placeholder="למשל: נועה" dir="auto"></label>
    <section class="panel stack">
      <h3>הצטרפות למשחק של חבר</h3>
      <div class="row"><input type="text" id="vscode" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="קוד בן 4 ספרות" value="${esc(opt.code || '')}" class="grow vsin" aria-label="קוד המשחק">
      <button class="btn primary" type="button" data-a="join">הצטרף</button></div>
    </section>
    <section class="panel stack">
      <h3>יצירת משחק חדש</h3>
      ${opt.set ? `<button class="btn colored wide" data-c="${opt.set.color}" data-vs="${esc(opt.set.id)}">צור משחק על: ${esc(opt.set.title)}</button>
        <p class="small muted">או בחר סט אחר:</p>` : '<p class="small muted">בחר על איזה סט לשחק:</p>'}
      ${playable.length ? `<div class="stack">${playable.filter(s => s !== opt.set).map(s => `<button class="vid" data-c="${s.color}" data-vs="${esc(s.id)}"><span class="play">⚔️</span><span class="grow"><strong dir="auto">${esc(s.title)}</strong><span class="small muted">${esc(setStats(s))}</span></span></button>`).join('')}</div>`
        : '<p class="small muted">עוד אין לך סט עם מספיק שאלות. צור סט חדש, ואז חזור לכאן.</p>'}
    </section>`;
  const nameOk = () => {
    const n = document.getElementById('vsname').value.trim();
    if (!n) { toast('כתוב קודם את השם שלך'); document.getElementById('vsname').focus(); return null; }
    lset('lomdim_name', n.slice(0, 20)); return n.slice(0, 20);
  };
  app.onclick = async e => {
    if (e.target.closest('[data-a="quit"]')) return opt.set ? viewSet(opt.set) : viewHome();
    const c = e.target.closest('[data-vs]');
    if (c) { const name = nameOk(); if (!name) return; return vsCreate(getSet(c.dataset.vs), name); }
    if (e.target.closest('[data-a="join"]')) {
      const name = nameOk(); if (!name) return;
      const code = document.getElementById('vscode').value.replace(/\D/g, '');
      if (code.length !== 4) return toast('הקוד הוא 4 ספרות');
      return vsJoin(code, name);
    }
  };
}
function vsBusy(text){ app.innerHTML = `${topbar('⚔️ אחד על אחד')}<div class="panel working"><h2>${esc(text)}</h2></div>`; app.onclick = e => { if (e.target.closest('[data-a="quit"]')) viewHome(); }; }
async function vsCreate(s, name){
  leave(); curView = 'vs'; tint(s.color); vsBusy('פותח משחק…');
  const questions = vsQuestions(s);
  try {
    const d = await roomApi({ action: 'create', questions, title: s.title, name, sec: VS_SEC });
    if (curView === 'vs') vsLobby({ code: d.code, role: 'h', name, title: s.title, questions, set: s, sec: VS_SEC, offset: d.now - Date.now() });
    return d.code;
  } catch(e) { vsHome({ set: s }); toast(vsErr(e)); }
}
async function vsJoin(code, name){
  leave(); curView = 'vs'; vsBusy('מצטרף למשחק…');
  try {
    const d = await roomApi({ action: 'join', code, name });
    if (curView === 'vs') vsLobby({ code, role: 'g', name, title: d.state.title, questions: d.questions, sec: d.state.sec || VS_SEC, offset: d.now - Date.now() });
  } catch(e) { vsHome({ code }); toast(vsErr(e)); }
}
function vsLobby(g){
  leave(); curView = 'vs'; tint(g.set ? g.set.color : 4);
  const host = g.role === 'h', link = location.origin + '/#vs=' + g.code;
  app.innerHTML = `${topbar('⚔️ אחד על אחד')}
    <div class="panel stack center vslobby">
      <span class="eyebrow" dir="auto">${esc(g.title)} · ${g.questions.length} שאלות</span>
      ${host ? `<p class="muted">הקוד של המשחק:</p><div class="vscode" dir="ltr">${g.code}</div>
        <button class="btn primary wide" data-a="send">שלח לחבר</button>
        <p class="small muted">החבר פותח את הקישור, או נכנס לאפליקציה ← ⚔️ אחד על אחד ← מקליד את הקוד.</p>` : ''}
      <div id="opp" class="vsopp"></div>
      ${host ? '<button class="btn colored wide" data-c="2" data-a="start" disabled>התחל משחק</button>' : ''}
    </div>`;
  const oppEl = document.getElementById('opp'), startBtn = app.querySelector('[data-a="start"]');
  cleanup = vsPoll(g, d => {
    const o = vsOther(g, d);
    if (host) {
      oppEl.innerHTML = o ? `<strong>✅ ${esc(o.name)} הצטרף!</strong>` : '<span class="muted">⏳ מחכה שהחבר יצטרף…</span>';
      startBtn.disabled = !o;
    } else oppEl.innerHTML = `<strong>✅ נכנסת למשחק של ${esc(o ? o.name : 'החבר')}</strong><span class="muted">⏳ מחכה שיתחיל…</span>`;
    if (d.state.st === 'play' && d.state.start) vsPlay(g, d.state.start, o ? o.name : 'החבר');
  }, 1200);
  app.onclick = async e => {
    if (e.target.closest('[data-a="quit"]')) return viewHome();
    if (e.target.closest('[data-a="send"]')) {
      const text = `בוא נשחק אחד על אחד ב"לומדים מהדף": ${g.title}. הקוד: ${g.code}`;
      if (navigator.share) { try { await navigator.share({ title: 'אחד על אחד', text, url: link }); return; } catch(err) { if (err && err.name === 'AbortError') return; } }
      try { await navigator.clipboard.writeText(text + '\n' + link); toast('הקישור הועתק, הדבק אותו לחבר'); } catch(err) { prompt('העתק ושלח לחבר:', link); }
    }
    if (e.target.closest('[data-a="start"]') && !startBtn.disabled) {
      startBtn.disabled = true;
      try { const d = await roomApi({ action: 'start', code: g.code }); vsPlay(g, d.state.start, (oppEl.textContent.match(/✅ (.+) הצטרף/) || [, 'החבר'])[1]); }
      catch(err) { startBtn.disabled = false; toast(vsErr(err)); }
    }
  };
}
function vsPlay(g, start, oppName){
  leave(); curView = 'vs-play'; tint(g.set ? g.set.color : 4);
  const n = g.questions.length, sec = g.sec || VS_SEC;
  const me = { name: g.name, idx: 0, score: 0, right: 0, done: false };
  let opp = { name: oppName, idx: 0, score: 0, done: false, t: Date.now() }, tq = null, locked = false, qStart = 0, ended = false;
  app.innerHTML = `${topbar('⚔️ אחד על אחד')}
    <div class="vsbar">
      <div class="vsp me"><span dir="auto">${esc(me.name)}</span><b id="mys">0</b><div class="dots" id="myd"></div></div>
      <span class="vsx">VS</span>
      <div class="vsp"><span dir="auto" id="opn">${esc(opp.name)}</span><b id="ops">0</b><div class="dots" id="opd"></div></div>
    </div>
    <div id="vsmain"></div>`;
  const main = document.getElementById('vsmain');
  const dots = (k, done) => Array.from({ length: n }, (_, i) => `<i class="${i < k ? 'on' : ''}"></i>`).join('');
  const drawBar = () => {
    document.getElementById('mys').textContent = me.score; document.getElementById('ops').textContent = opp.score;
    document.getElementById('myd').innerHTML = dots(me.idx); document.getElementById('opd').innerHTML = dots(opp.idx);
    document.getElementById('opn').textContent = opp.name + (opp.done ? ' ✓' : '');
  };
  drawBar();
  const send = () => roomApi({ action: 'me', code: g.code, role: g.role, ...me }).catch(() => {});
  const stopPoll = vsPoll(g, d => {
    const o = vsOther(g, d); if (o) { opp = o; drawBar(); }
    if (me.done && !ended && (opp.done || Date.now() + (g.offset || 0) - (opp.t || 0) > 45000)) finish(!opp.done);
  }, 1000);
  cleanup = () => { stopPoll(); clearTimeout(tq); clearInterval(cd); };
  // countdown to the shared start time
  let cd = setInterval(() => {
    const left = Math.ceil((start - (g.offset || 0) - Date.now()) / 1000);
    if (left > 0) { main.innerHTML = `<div class="panel center vsgo"><p class="muted">מתחילים בעוד</p><div class="score">${left}</div></div>`; return; }
    clearInterval(cd); showQ();
  }, 200);
  function showQ(){
    const q = g.questions[me.idx]; locked = false; qStart = Date.now();
    main.innerHTML = `<div class="tbar"><i style="--d:${sec}s"></i></div>
      <div class="panel stack"><span class="eyebrow">שאלה ${me.idx + 1} מתוך ${n}</span><p class="q" dir="auto">${esc(q.q)}</p></div>
      <div class="opts">${q.o.map((o, j) => `<button class="opt" data-c="${j % 6}" data-o="${j}"><span class="k">${'אבגדהו'[j]}</span><span dir="auto">${esc(o)}</span></button>`).join('')}</div>
      <div id="vsfb"></div>`;
    tq = setTimeout(() => answer(-1), sec * 1000);
  }
  function answer(pick){
    if (locked) return; locked = true; clearTimeout(tq);
    const q = g.questions[me.idx], ok = pick === q.a, ms = Date.now() - qStart;
    const gain = ok ? 100 + Math.round(100 * Math.max(0, sec * 1000 - ms) / (sec * 1000)) : 0;
    me.score += gain; if (ok) me.right++; me.idx++; me.done = me.idx >= n;
    award(ok); send(); drawBar();
    main.querySelectorAll('.opt').forEach((b, j) => { if (j === q.a) b.classList.add('right'); else if (j === pick) b.classList.add('wrong'); b.disabled = true; });
    const tb = main.querySelector('.tbar i'); if (tb) tb.style.animationPlayState = 'paused';
    document.getElementById('vsfb').innerHTML = `<p class="explain" dir="auto">${ok ? '✅ +' + gain : pick < 0 ? '⏰ נגמר הזמן' : '❌ לא נכון'}${!ok && q.x ? ' · ' + esc(q.x) : ''}</p>`;
    setTimeout(() => {
      if (curView !== 'vs-play') return;
      if (!me.done) return showQ();
      main.innerHTML = `<div class="panel center vsgo"><h2>סיימת! 🎉</h2><p class="muted" dir="auto">מחכה ש-${esc(opp.name)} יסיים…</p></div>`;
      if (opp.done) finish(false);
    }, ok ? 900 : 1600);
  }
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) { if (confirm('לצאת מהמשחק?')) viewHome(); return; }
    const o = e.target.closest('[data-o]'); if (o && !locked) answer(+o.dataset.o);
  };
  function finish(left){ if (ended) return; ended = true; vsResult(g, me, opp, left); }
}
function vsResult(g, me, opp, left){
  leave(); curView = 'vs-end';
  const win = me.score > opp.score, tie = me.score === opp.score;
  if (win) bump({ wins: 1 });
  app.innerHTML = `${topbar('⚔️ אחד על אחד')}
    <div class="panel result">
      <div class="score">${win ? '🏆' : tie ? '🤝' : '💪'}</div>
      <h2 dir="auto">${win ? 'ניצחת!' : tie ? 'תיקו!' : esc(opp.name) + ' ניצח הפעם'}</h2>
      ${left ? `<p class="small muted" dir="auto">${esc(opp.name)} יצא מהמשחק באמצע.</p>` : ''}
      <div class="vsfinal">
        <div><span dir="auto">${esc(me.name)}</span><b>${me.score}</b><small>${me.right}/${g.questions.length} נכונות</small></div>
        <div><span dir="auto">${esc(opp.name)}</span><b>${opp.score}</b><small>${opp.right || 0}/${g.questions.length} נכונות</small></div>
      </div>
      <div class="row center">${g.role === 'h' && g.set ? '<button class="btn primary" data-a="again">משחק חוזר</button>' : '<span class="small muted" id="wait">אם ' + esc(opp.name) + ' יפתח משחק חוזר, תיכנס אליו לבד.</span>'}
        <button class="btn" data-a="home">יציאה</button></div>
    </div>`;
  if (g.role === 'g') cleanup = vsPoll(g, d => { if (d.state.next) vsJoin(d.state.next, g.name); }, 1500);
  app.onclick = async e => {
    if (e.target.closest('[data-a="quit"]') || e.target.closest('[data-a="home"]')) return viewHome();
    if (e.target.closest('[data-a="again"]')) {
      const old = g.code, next = await vsCreate(g.set, g.name);
      if (next) roomApi({ action: 'next', code: old, next }).catch(() => {});
    }
  };
}

async function openShortLink(code){
  leave(); curView = 'import'; app.innerHTML = '<div class="panel working"><h2>פותח את הסט ששלחו לך…</h2></div>';
  try {
    const r = await fetch('/api/room', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'get', code }) });
    const d = await r.json(); if (!r.ok || !d.data) throw 0;
    return viewImport(await decodeSet(d.data));
  } catch(e) { history.replaceState(null, '', location.pathname); viewHome(); toast('לא מצאתי את הסט מהקישור. בקש מהחבר לשלוח אותו שוב.'); }
}
/* ---------------- boot ---------------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
(async function boot(){
  const h = location.hash;
  if (/^#k=[a-z0-9]{6}$/.test(h)) return openShortLink(h.slice(3));
  if (/^#vs=\d{4}$/.test(h)) { history.replaceState(null, '', location.pathname); return vsHome({ code: h.slice(4) }); }
  if (h.startsWith('#s=')) {
    try { return viewImport(await decodeSet(h.slice(3))); }
    catch(e) { history.replaceState(null, '', location.pathname); toast('הקישור לסט לא תקין'); }
  }
  viewHome();
})();
window.addEventListener('hashchange', async () => {
  if (/^#k=[a-z0-9]{6}$/.test(location.hash)) return openShortLink(location.hash.slice(3));
  if (/^#vs=\d{4}$/.test(location.hash)) { const c = location.hash.slice(4); history.replaceState(null, '', location.pathname); return vsHome({ code: c }); }
  if (location.hash.startsWith('#s=')) { try { viewImport(await decodeSet(location.hash.slice(3))); } catch(e){ toast('הקישור לסט לא תקין'); } }
});
})();
