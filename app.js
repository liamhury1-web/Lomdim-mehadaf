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
  try { speechSynthesis.cancel(); } catch(e){}
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

/* ---------------- speech ---------------- */
const canSpeak = (() => { try { return 'speechSynthesis' in window; } catch(e){ return false; } })();
function guessLang(text, hint){ if (hint) return hint; if (isRtl(text)) return /[؀-ۿ]/.test(text) ? 'ar' : 'he'; return 'en'; }
function speak(text, lang){
  if (!canSpeak) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = guessLang(text, lang); u.rate = .9; speechSynthesis.speak(u); } catch(e){}
}
const sayBtn = (text, lang, cls = 'iconbtn') => canSpeak ? `<button class="${cls} say" type="button" data-say="${esc(text)}" data-lang="${esc(lang || '')}" aria-label="השמע">${I.say}</button>` : '';
document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { e.stopPropagation(); speak(b.dataset.say, b.dataset.lang); } }, true);

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
    srs: s.srs && typeof s.srs === 'object' ? s.srs : {}, folder: typeof s.folder === 'string' ? s.folder.slice(0, 40) : '', vok: s.vok && typeof s.vok === 'object' ? s.vok : {}, level: typeof s.level === 'string' ? s.level.slice(0, 30) : '', learn: typeof s.learn === 'string' ? s.learn.slice(0, 5) : '', challenge: s.challenge && typeof s.challenge === 'object' ? s.challenge : null };
}

/* An option like "five (חמש)" gives the answer away: drop a bracketed part written in another script than the option itself. */
// function declarations, not consts: fixSet() uses these while saved sets load at startup
function scriptOf(t){ return /[\u0590-\u05FF]/.test(t) ? 'he' : /[\u0600-\u06FF]/.test(t) ? 'ar' : /\p{L}/u.test(t) ? 'x' : ''; }
function cleanOpt(o){
  const m = String(o).match(/^(.*?\S)\s*[(（]([^()（）]+)[)）]\s*$/);
  if (!m) return o;
  const a = scriptOf(m[1]), b = scriptOf(m[2]);
  return a && b && a !== b ? m[1] : o;
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
  let url;
  try { url = location.origin + '/#s=' + await encodeSet(s); } catch(e) { return toast('לא הצלחתי ליצור קישור'); }
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
  function record(q, ok){
    if (answered) return; answered = true;
    if (ok) right++; else wrong.push(q);
    srsMark(q.s, q.id, ok);
    if (q.kind === 'card') { if (ok) q.s.known[q.id] = true; else delete q.s.known[q.id]; }
    award(ok); saveSoon(q.s);
  }
  function nextBtn(){ return `<button class="btn primary wide" type="button" data-n="1">${i + 1 < qs.length ? 'הבא' : 'לתוצאה'}</button>`; }
  function draw(){
    const q = qs[i], s = q.s; answered = false; tint(s.color);
    let body = '';
    if (q.type === 'mcq') body = `<div class="panel stack"><div class="row" style="align-items:flex-start"><p class="q grow" dir="auto">${esc(q.q)}</p>${q.say ? sayBtn(q.q, s.termLang) : ''}</div></div>
      <div class="opts">${q.o.map((o, j) => `<button class="opt" data-c="${j % 6}" data-o="${j}"><span class="k">${'אבגדהו'[j]}</span><span dir="auto">${esc(o)}</span></button>`).join('')}</div>`;
    else if (q.type === 'flash') body = `<div class="panel stack qflash"><span class="eyebrow">אתה יודע מה זה?</span><p class="q" dir="auto">${esc(q.c.t)}</p>${sayBtn(q.c.t, s.termLang)}
      <div id="rev" hidden><p class="explain" dir="auto">${esc(q.c.d)}</p></div>
      <button class="btn wide" type="button" data-show="1">הצג תשובה</button></div>
      <div class="row" id="fl" hidden><button class="btn grow big no" data-f="no">לא ידעתי</button><button class="btn grow big yes" data-f="yes">ידעתי ✓</button></div>`;
    else body = `<div class="panel stack">${q.type === 'dict'
        ? `<span class="eyebrow">הקשב וכתוב</span><button class="btn colored wide dictbtn" type="button" data-say="${esc(q.c.t)}" data-lang="${esc(s.termLang || '')}">${I.say} השמע שוב</button><p class="small muted" dir="auto">רמז: ${esc(q.c.d)}</p>`
        : `<span class="eyebrow">כתוב את המילה שמתאימה</span><p class="q" dir="auto">${esc(q.c.d)}</p>`}</div>
      <form id="qf" class="stack"><input type="text" id="ans" dir="auto" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="התשובה שלך" placeholder="התשובה שלך">
      <button class="btn primary wide" type="submit" id="chk">בדוק</button></form>`;
    app.innerHTML = `${topbar(title, (i + 1) + '/' + qs.length)}<div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>${body}<div id="after"></div>`;
    if (q.type === 'dict') setTimeout(() => speak(q.c.t, s.termLang), 250);
    if (q.type === 'write' || q.type === 'dict') setTimeout(() => { const inp = document.getElementById('ans'); if (inp) inp.focus(); }, 60);
  }
  function finish(){
    const pct = Math.round(right / qs.length * 100);
    if (opts.onDone) opts.onDone(pct, right);
    const extra = wrong.length ? '<button class="btn" data-r="extra">חזרה על הטעויות</button>' : '';
    resultView(opts.home ? null : qs[0].s, title, opts.test ? pct + '%' : `${right}/${qs.length}`, pct === 100 ? 'מושלם! 🎉' : `${right} נכונות מתוך ${qs.length}`,
      only => only ? runQuiz(title, shuffle(wrong).map(q => shapeQ(q, q.type)), back, { home: opts.home }) : (opts.again ? opts.again() : back()), extra);
  }
  draw();
  app.onsubmit = ev => {
    ev.preventDefault();
    const q = qs[i], inp = document.getElementById('ans'); if (answered || !inp || !inp.value.trim()) return;
    const ok = normAns(inp.value) === normAns(q.c.t); record(q, ok);
    inp.readOnly = true; inp.style.borderColor = ok ? 'var(--ok)' : 'var(--bad)'; document.getElementById('chk').hidden = true;
    document.getElementById('after').innerHTML = `<div class="stack">${ok ? '<p class="note good">נכון!</p>'
      : `<p class="note bad">התשובה: <strong dir="auto">${esc(q.c.t)}</strong></p><button class="btn ghost" type="button" data-mine="1">צדקתי, זו רק שגיאת הקלדה</button>`}${nextBtn()}</div>`;
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
      <h1><span>לומדים</span> מהדף</h1>
      ${sets.length ? '' : '<p class="muted">מצלמים דף או כותבים נושא, והאפליקציה בונה לך תרגול.</p>'}
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
        return `<button class="setcard" data-c="${s.color}" data-open="${esc(s.id)}">
          <div class="row between" style="width:100%"><h3 dir="auto">${esc(s.title)}</h3>${d ? `<span class="tag">🔁 ${d}</span>` : s.example ? '<span class="tag">דוגמה</span>' : ''}</div>
          <span class="muted small">${esc(setStats(s))}</span>
          ${n ? `<div class="row" style="width:100%"><div class="meter grow"><i style="width:${Math.round(k / n * 100)}%"></i></div><span class="small count">${k}/${n}</span></div>` : ''}
        </button>`; }).join('')}</div>
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
      <div class="pages" id="pages"></div>
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
    pagesEl.innerHTML = pages.map((p, i) => `<div class="thumb"><img src="${p.url}" alt="דף ${i + 1}"><b>${i + 1}</b><button type="button" data-rm="${i}" aria-label="הסר דף ${i + 1}">×</button></div>`).join('')
      + (pages.length && pages.length < maxPages ? `<button class="addtile" type="button" data-a="gal">${I.plus}<span>עוד דף</span></button>` : '');
    pagesEl.hidden = !pages.length;
    pc.textContent = pages.length ? (pages.length === 1 ? 'מדף אחד' : 'מ-' + pages.length + ' דפים') : '';
    go.disabled = !pages.length;
  }
  drawPages();
  onPicked = files => {
    for (const f of files) {
      if (pages.length >= maxPages) { toast('אפשר עד ' + maxPages + ' דפים בבת אחת'); break; }
      if (!f.type || f.type.startsWith('image/')) pages.push({ file: f, url: URL.createObjectURL(f) });
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
      <svg class="pen" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 22c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 36c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 50c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/></svg>
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
      <svg class="pen" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 22c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 36c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 50c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/></svg>
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
  const out = s.mcq.map(m => ({ id: m.id, q: m.q, o: m.o, a: m.a, x: m.x }));
  if (s.cards.length >= 4) s.cards.forEach(c => {
    const others = shuffle(s.cards.filter(o => o !== c && o.d !== c.d)).slice(0, 3).map(o => o.d);
    if (others.length < 2) return;
    const o = shuffle([c.d, ...others]);
    out.push({ id: c.id, q: c.t, o, a: o.indexOf(c.d), x: '', say: true });
  });
  return out;
}

function viewSet(s){
  leave(); curView = 'set';
  if (!s) return viewHome();
  tint(s.color);
  let editing = false;
  function draw(){
    const n = s.cards.length, k = knownCount(s), scr = scrItems(s), ci = caseInfo(s), cp = ci.pairs, mp = mcqPool(s);
    const due = dueIds(s).length, speakable = canSpeak && n > 0, any = n + s.mcq.length > 0;
    // the main ways to practise; the rest waits under "more"
    const main = [
      { id:'flash', c:0, ic:I.cards, name:'כרטיסיות', sub:'הופכים ובודקים', ok: n > 0 },
      { id:'mcq', c:1, ic:I.abc, name:'אמריקאיות', sub: mp.length + ' שאלות', ok: mp.length > 0 },
      { id:'match', c:2, ic:I.match, name:'התאמת זוגות', sub:'משחק על זמן', ok: n >= 3 },
      { id:'write', c:5, ic:I.pen, name:'כתיבה', sub:'כותבים את המילה', ok: n > 0 },
      { id:'read', c:3, ic:I.book, name:'קטע קריאה', sub: s.reading.length ? s.reading.length + ' סיפורים עם שאלות' : 'סיפור עם שאלות', ok: true },
      { id:'lesson', c:4, ic:I.book, name:'שיעור קצר', sub:'הסבר על החומר', ok: any }
    ].filter(m => m.ok);
    const more = [
      { id:'scr', c:3, ic:I.scr, name:'סידור אותיות', ok: scr.length > 0 },
      { id:'dict', c:0, ic:I.say, name:'הכתבה', ok: speakable },
      { id:'case', c:4, ic:I.Aa, name: ci.name, ok: cp.length >= 3 && !ci.hide },
      { id:'test', c:2, ic:I.abc, name: 'מבחן מסכם' + (s.best.test != null ? ' · ' + s.best.test + '%' : ''), ok: any },
      { id:'videos', c:1, ic:I.play, name:'סרטונים', ok: true }
    ].filter(m => m.ok);
    const tile = m => `<button class="mode" data-c="${m.c}" data-mode="${m.id}">${m.ic}<strong>${m.name}</strong>${m.sub ? `<span>${esc(m.sub)}</span>` : ''}</button>`;
    const listHtml = () => {
      if (!s.cards.length && !s.mcq.length && !editing) return '<p class="muted small">אין עדיין פריטים בסט.</p>';
      const cards = `<div class="list">${s.cards.map(c => editing
        ? `<div class="li"><input type="text" id="t_${c.id}" value="${esc(c.t)}" dir="auto" aria-label="מילה"><input type="text" id="d_${c.id}" value="${esc(c.d)}" dir="auto" aria-label="פירוש"><button class="x" type="button" data-del="${c.id}" aria-label="מחק">×</button></div>`
        : `<div class="li"><span class="t" dir="auto">${esc(c.t)}</span><span dir="auto">${esc(c.d)}</span><span class="known ${s.known[c.id] ? 'on' : ''}" title="${s.known[c.id] ? 'יודע' : 'עוד לא'}"></span></div>`).join('')}
        ${editing ? `<div class="li"><input type="text" id="t_new" placeholder="מילה חדשה" dir="auto" aria-label="מילה חדשה"><input type="text" id="d_new" placeholder="פירוש" dir="auto" aria-label="פירוש חדש"><span></span></div>` : ''}</div>`;
      const qs = s.mcq.length ? `<h3>שאלות</h3><div class="list">${s.mcq.map(m => `<div class="qitem"><div dir="auto">${esc(m.q)}<br><span class="small muted" dir="auto">תשובה: ${esc(m.o[m.a])}</span></div>${editing ? `<button class="x" type="button" data-delq="${m.id}" aria-label="מחק שאלה">×</button>` : ''}</div>`).join('')}</div>` : '';
      return (s.cards.length || editing ? cards : '') + qs;
    };
    app.innerHTML = `
      <div class="topbar"><button class="iconbtn" data-a="home" aria-label="לכל הסטים">${I.back}</button><div class="grow"></div>
        <button class="iconbtn" data-a="share" aria-label="שתף סט">${I.share}</button></div>
      <div class="stack" style="gap:6px">
        <h1 class="settitle" dir="auto">${esc(s.title)}</h1>
        <span class="muted small">${esc(setStats(s))}${n ? ` · יודע <strong>${k}</strong> מתוך ${n}` : ''}</span>
        ${n ? `<div class="meter"><i style="width:${Math.round(k / n * 100)}%"></i></div>` : ''}
        ${challengeHtml(s)}
      </div>
      ${any ? `<button class="btn colored wide big" data-c="2" data-a="go">▶ התחל לתרגל <small>${due ? due + ' פריטים לחזרה היום' : 'שאלות מעורבות מכל הסוגים'}</small></button>` : ''}
      <h3>או בחר איך לתרגל</h3>
      <div class="modes">${main.map(tile).join('')}</div>
      ${more.length ? `<details class="more"><summary>עוד משחקים ותרגולים</summary><div class="modes small">${more.map(tile).join('')}</div></details>` : ''}
      ${mp.length >= 4 ? `<button class="btn wide" data-mode="vs">⚔️ שחק על הסט הזה מול חבר</button>` : ''}
      <details class="more" ${editing ? 'open' : ''}><summary>📋 מה יש בסט</summary>
        <div class="row end">${editing ? `<button class="btn ghost" data-a="cancel">ביטול</button><button class="btn primary" data-a="saveedit">שמור</button>` : `<button class="btn ghost" data-a="edit">✏️ ערוך מילים</button>`}</div>
        <div class="stack">${listHtml()}</div>
      </details>
      <details class="more"><summary>⚙️ הגדרות הסט</summary>
        <label class="stack" for="title" style="gap:4px"><span class="small muted">שם הסט</span><input id="title" type="text" value="${esc(s.title)}" dir="auto"></label>
        <label class="stack" for="folder" style="gap:4px"><span class="small muted">📁 תיקייה</span><input type="text" id="folder" list="folderlist" value="${esc(s.folder || '')}" placeholder="למשל: אנגלית" dir="auto"><datalist id="folderlist">${[...new Set([...SUBJECTS, ...sets.map(x => x.folder).filter(Boolean)])].map(f => `<option value="${esc(f)}">`).join('')}</datalist></label>
        <span class="small muted">צבע</span>
        <div class="swatches" role="group" aria-label="צבע הסט">${[0,1,2,3,4,5].map(c => `<button type="button" data-c="${c}" data-color="${c}" aria-pressed="${s.color === c}" aria-label="צבע ${c + 1}"></button>`).join('')}</div>
        <button class="btn wide" data-a="add">${I.plus} הוסף עוד דפים או נושא</button>
        <div class="row">${k ? '<button class="btn ghost" data-a="reset">אפס התקדמות</button>' : ''}<span class="grow"></span><button class="btn ghost danger" data-a="del">מחק סט</button></div>
      </details>`;
  }
  draw();
  app.onchange = e => { if (e.target.id === 'folder') { s.folder = e.target.value.trim().slice(0, 40); saveSet(s); toast(s.folder ? 'הועבר לתיקייה ' + s.folder : 'הוצא מהתיקייה'); return; }
    if (e.target.id === 'title') { const v = e.target.value.trim(); if (v && v !== s.title) { s.title = v.slice(0, 60); saveSet(s); toast('השם נשמר'); const h = app.querySelector('.settitle'); if (h) h.textContent = s.title; } } };
  let delArm = 0;
  app.onclick = e => {
    const col = e.target.closest('[data-color]');
    if (col) { s.color = +col.dataset.color; tint(s.color); saveSet(s); app.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b === col))); return; }
    const m = e.target.closest('[data-mode]');
    if (m && !m.disabled) return startMode(s, m.dataset.mode);
    const d = e.target.closest('[data-del]');
    if (d) { s.cards = s.cards.filter(c => c.id !== d.dataset.del); delete s.known[d.dataset.del]; return draw(); }
    const dq = e.target.closest('[data-delq]');
    if (dq) { s.mcq = s.mcq.filter(q => q.id !== dq.dataset.delq); return draw(); }
    const a = e.target.closest('[data-a]'); if (!a) return;
    switch (a.dataset.a) {
      case 'home': return viewHome();
      case 'share': return shareSet(s);
      case 'go': return dueIds(s).length ? modeReview(s) : modeTest(s);
      case 'add': createTarget = s.id; pages = []; createTab = 'photo'; return viewCreate();
      case 'edit': editing = true; return draw();
      case 'cancel': { editing = false; try { const fresh = (JSON.parse(lget(LKEY) || '[]') || []).find(x => x.id === s.id); if (fresh) Object.assign(s, fixSet(fresh)); } catch(err){} return draw(); }
      case 'saveedit': {
        s.cards.forEach(c => { const t = document.getElementById('t_' + c.id), dd = document.getElementById('d_' + c.id); if (t) c.t = t.value.trim() || c.t; if (dd) c.d = dd.value.trim() || c.d; });
        const nt = document.getElementById('t_new'), nd = document.getElementById('d_new');
        if (nt && nd && nt.value.trim() && nd.value.trim()) s.cards.push({ id: 'c' + rid(), t: nt.value.trim(), d: nd.value.trim() });
        editing = false; saveSet(s); toast('נשמר'); return draw();
      }
      case 'reset': s.known = {}; saveSet(s); return draw();
      case 'del':
        if (Date.now() - delArm < 3500) { removeSet(s); toast('הסט נמחק'); return viewHome(); }
        delArm = Date.now(); a.textContent = 'למחוק? לחץ שוב'; setTimeout(() => { if (a.isConnected) a.textContent = 'מחק סט'; }, 3500); return;
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
  app.innerHTML = `${topbar(title)}<div class="panel result"><div class="score">${big}</div><p>${line}</p>
    <div class="row center">${extra || ''}<button class="btn primary" data-r="again">שוב</button><button class="btn" data-r="quit">חזרה לסט</button></div></div>`;
  app.onclick = e => {
    const r = e.target.closest('[data-r]'), q = e.target.closest('[data-a="quit"]');
    if (q || (r && r.dataset.r === 'quit')) return s ? viewSet(s) : viewHome();
    if (r && r.dataset.r === 'again') return again();
    if (r && r.dataset.r === 'extra') return again(true);
  };
}
function startMode(s, mode){
  leave(); curView = 'practice';
  ({ flash: modeFlash, mcq: modeMcq,
     match: () => modeMatch(s, s.cards.map(c => [c.t, c.d]), 'התאמת זוגות', 'match'),
     case: () => { const ci = caseInfo(s); return modeMatch(s, ci.pairs, ci.name, 'case'); },
     scr: modeScr, write: modeWrite, lesson: modeLesson, videos: modeVideos, read: modeReadPick, vs: s => vsHome({ set: s }), review: modeReview, test: modeTest, dict: modeDict })[mode](s);
}

function modeFlash(s, onlyUnknown, reverse){
  leave();
  let deck = shuffle(onlyUnknown ? s.cards.filter(c => !s.known[c.id]) : s.cards);
  if (!deck.length) deck = shuffle(s.cards);
  let i = 0, flipped = false, right = 0; const missed = [];
  function draw(){
    const c = deck[i];
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
  const qs = shuffle(mcqPool(s)).slice(0, 10);
  let i = 0, right = 0, answered = false;
  function draw(){
    const q = qs[i];
    app.innerHTML = `${topbar('אמריקאיות', (i + 1) + '/' + qs.length)}
      <div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
      <div class="panel stack"><div class="row" style="align-items:flex-start"><p class="q grow" dir="auto">${esc(q.q)}</p>${q.say ? sayBtn(q.q, s.termLang) : ''}</div></div>
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
        const pct = Math.round(right / qs.length * 100);
        if (!s.best.mcq || pct > s.best.mcq) { s.best.mcq = pct; saveSoon(s); }
        return resultView(s, 'אמריקאיות', pct + '%', `${right} נכונות מתוך ${qs.length}`, () => modeMcq(s));
      }
      return draw();
    }
    const o = e.target.closest('[data-o]'); if (!o || answered) return;
    answered = true;
    const q = qs[i], pick = +o.dataset.o;
    app.querySelectorAll('.opt').forEach((b, j) => { if (j === q.a) b.classList.add('right'); else if (j === pick) b.classList.add('wrong'); b.disabled = true; });
    if (pick === q.a) right++;
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
    <div class="tiles">${tiles.map((t, i) => `<button class="tile" data-t="${i}" dir="auto">${esc(t.txt.length > 70 ? t.txt.slice(0, 68) + '…' : t.txt)}</button>`).join('')}</div>`;
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
    answered = true; const ok = norm(v) === norm(c.t);
    if (ok) { right++; s.known[c.id] = true; saveSoon(s); }
    srsMark(s, c.id, ok); award(ok);
    inp.readOnly = true; inp.style.borderColor = ok ? 'var(--ok)' : 'var(--bad)';
    document.getElementById('chk').hidden = true;
    document.getElementById('after').innerHTML = `<div class="stack">${ok ? '<p class="note good">נכון!</p>'
      : `<p class="note bad">התשובה: <strong dir="auto">${esc(c.t)}</strong></p><button class="btn ghost" type="button" data-w="mine">צדקתי, זו רק שגיאת הקלדה</button>`}
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
async function makeLesson(s){
  leave(); curView = 'lesson-gen'; tint(s.color);
  app.innerHTML = `${topbar('שיעור קצר')}<div class="panel working">
    <svg class="pen" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 22c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 36c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 50c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/></svg>
    <h2>כותב שיעור על החומר</h2><p class="muted">בערך חצי דקה.</p></div>${gameZone()}`;
  cleanup = startGames();
  const ctl = new AbortController();
  app.onclick = e => { if (e.target.closest('[data-a="quit"]')) { ctl.abort(); viewSet(s); } };
  try {
    const data = await callApi({ mode: 'lesson', title: s.title, material: materialText(s) }, ctl.signal);
    const p = normalize(data && data.result);
    if (!p.lesson.length) throw { code: 'bad_json' };
    s.lesson = p.lesson;
    const tk = new Set(s.topics.map(t => t.name)); p.topics.forEach(t => { if (!tk.has(t.name)) s.topics.push(t); });
    saveSet(s); if (curView === 'lesson-gen') modeLesson(s);
  } catch(e) {
    if (e && e.name === 'AbortError') return;
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
    <svg class="pen" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 22c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 36c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 50c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/></svg>
    <h2>כותב לך סיפור</h2><p class="muted">${esc((GENRES.find(g => g[0] === o.genre) || GENRES[0])[1])} · ${esc(o.level)}</p></div>${gameZone()}`;
  cleanup = startGames();
  const ctl = new AbortController();
  app.onclick = e => { if (e.target.closest('[data-a="quit"]')) { ctl.abort(); modeStoryNew(s); } };
  try {
    const words = s.cards.map(c => c.t).filter(t => !isRtl(t)).slice(0, 30).join(', ');
    const data = await callApi({ mode: 'story', lang: o.lang, level: o.level, genre: o.genre, idea: o.idea, words, avoid: s.reading.map(r => r.title) }, ctl.signal);
    const r = normalize(data && data.result).reading[0];
    if (!r) throw { code: 'bad_json' };
    r.lang = r.lang || o.lang; r.genre = o.genre; r.id = 'r' + rid();
    s.reading.push(r); if (s.reading.length > 40) s.reading.shift();
    saveSet(s); if (curView === 'story-gen') modeRead(s, r); nikudNote(data); verifySet(s, data && data.model);
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
function modeRead(s, r){
  leave(); curView = 'practice'; tint(s.color);
  let right = 0, done = 0;
  app.innerHTML = `${topbar('קטע קריאה', r.q.length ? '0/' + r.q.length : '')}
    <article class="panel stack reading" lang="${esc(r.lang || '')}">
      <div class="row between" style="align-items:flex-start"><h2 class="grow" dir="auto">${esc(r.title)}</h2>${sayBtn(r.text, r.lang)}</div>
      ${r.instr ? `<p class="explain bi">${bi(r.instr)}</p>` : ''}
      ${r.text.split(/\n+/).filter(Boolean).map(p => `<p dir="auto">${esc(p)}</p>`).join('')}
    </article>
    ${r.q.length ? `<h3>שאלות הבנה</h3>` : ''}
    <div class="stack">${r.q.map((m, i) => `<div class="panel stack" data-qi="${i}"><p class="q bi">${bi(m.q)}</p>
      <div class="opts">${m.o.map((o, j) => `<button class="opt" data-c="${j % 6}" data-o="${j}"><span class="k">${'אבגדהו'[j]}</span><span dir="auto">${esc(o)}</span></button>`).join('')}</div>
      <div class="after"></div></div>`).join('')}</div>
    <div id="rres"></div>
    <div class="row"><button class="btn colored grow" data-c="5" data-a="newstory">📖 סיפור חדש</button>${s.reading.length > 1 ? `<button class="btn grow" data-a="allst">כל הסיפורים (${s.reading.length})</button>` : ''}</div>`;
  app.onclick = e => {
    if (e.target.closest('[data-a="quit"]')) return viewSet(s);
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

/* ---------------- boot ---------------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
(async function boot(){
  const h = location.hash;
  if (/^#vs=\d{4}$/.test(h)) { history.replaceState(null, '', location.pathname); return vsHome({ code: h.slice(4) }); }
  if (h.startsWith('#s=')) {
    try { return viewImport(await decodeSet(h.slice(3))); }
    catch(e) { history.replaceState(null, '', location.pathname); toast('הקישור לסט לא תקין'); }
  }
  viewHome();
})();
window.addEventListener('hashchange', async () => {
  if (/^#vs=\d{4}$/.test(location.hash)) { const c = location.hash.slice(4); history.replaceState(null, '', location.pathname); return vsHome({ code: c }); }
  if (location.hash.startsWith('#s=')) { try { viewImport(await decodeSet(location.hash.slice(3))); } catch(e){ toast('הקישור לסט לא תקין'); } }
});
})();
