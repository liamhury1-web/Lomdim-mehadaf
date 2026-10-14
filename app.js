(function(){
'use strict';
const app = document.getElementById('app');

/* ---------------- helpers ---------------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rid = () => Math.random().toString(36).slice(2, 10);
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
sets = (() => { try { return (JSON.parse(lget(LKEY) || '[]') || []).map(fixSet); } catch(e){ return []; } })();
sets.sort((a, b) => (b.updated || 0) - (a.updated || 0));
function persist(){ if (!lset(LKEY, JSON.stringify(sets))) toast('אין מספיק מקום לשמור במכשיר'); }
function saveSet(s){ s.updated = Date.now(); if (!sets.includes(s)) sets.unshift(s); persist(); }
let saveT; function saveSoon(s){ clearTimeout(saveT); saveT = setTimeout(() => saveSet(s), 700); }
function removeSet(s){ sets = sets.filter(x => x !== s); persist(); }
function getSet(id){ return sets.find(s => s.id === id); }
function fixSet(s){
  s = s || {};
  const arr = v => Array.isArray(v) ? v : [];
  return { id: s.id || ('s' + rid()), title: s.title || 'סט ללא שם', created: s.created || Date.now(), updated: s.updated || Date.now(),
    color: Number.isInteger(s.color) ? Math.abs(s.color) % 6 : sets.length % 6,
    termLang: s.termLang || '', defLang: s.defLang || '', alphabet: !!s.alphabet, example: !!s.example,
    cards: arr(s.cards), mcq: arr(s.mcq), scr: arr(s.scr), topics: arr(s.topics), lesson: arr(s.lesson),
    known: s.known && typeof s.known === 'object' ? s.known : {}, best: s.best && typeof s.best === 'object' ? s.best : {} };
}

/* ---------------- shaping the AI answer ---------------- */
function normalize(r){
  const o = r && typeof r === 'object' && !Array.isArray(r) ? r : {};
  const str = v => typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : '');
  const arr = v => Array.isArray(v) ? v : [];
  return {
    title: str(o.title).slice(0, 60),
    termLang: str(o.termLang).slice(0, 12), defLang: str(o.defLang).slice(0, 12), alphabet: o.alphabet === true,
    cards: arr(o.cards).map(c => ({ t: str(c && c.term), d: str(c && c.def) })).filter(c => c.t && c.d),
    mcq: arr(o.mcq).map(m => { const opts = arr(m && m.options).map(str).filter(Boolean); return { q: str(m && m.q), o: opts, a: Number(m && m.answer), x: str(m && m.explain) }; })
      .filter(m => m.q && m.o.length >= 2 && m.o.length <= 6 && Number.isInteger(m.a) && m.a >= 0 && m.a < m.o.length),
    scr: arr(o.scramble).map(s => ({ w: str(s && s.word), h: str(s && s.hint) })).filter(s => lettersOnly.test(s.w)),
    topics: arr(o.topics).map(t => ({ name: str(t && t.name).slice(0, 80), q: str(t && t.query).slice(0, 120) })).filter(t => t.name && t.q),
    lesson: arr(o.lesson).map(x => ({ h: str(x && x.title).slice(0, 100), b: str(x && x.body).slice(0, 3000) })).filter(x => x.h && x.b)
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
    tp: s.topics.map(t => [t.name, t.q]), l: s.lesson.map(x => [x.h, x.b]) };
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
  const s = fixSet({ title: String(o.t || 'סט משותף').slice(0, 60), termLang: o.tl, defLang: o.dl, alphabet: !!o.a, color: Number.isInteger(o.k) ? o.k : 0 });
  mergeInto(s, normalize({
    cards: arr(o.c).map(x => ({ term: x[0], def: x[1] })), mcq: arr(o.q).map(x => ({ q: x[0], options: x[1], answer: x[2], explain: x[3] })),
    scramble: arr(o.w).map(x => ({ word: x[0], hint: x[1] })), topics: arr(o.tp).map(x => ({ name: x[0], query: x[1] })), lesson: arr(o.l).map(x => ({ title: x[0], body: x[1] }))
  }));
  return s;
}
async function shareSet(s){
  let url;
  try { url = location.origin + '/#s=' + await encodeSet(s); } catch(e) { return toast('לא הצלחתי ליצור קישור'); }
  if (navigator.share) { try { await navigator.share({ title: s.title, text: 'סט לתרגול: ' + s.title, url }); return; } catch(e) { if (e && e.name === 'AbortError') return; } }
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
function openPicker(which){ const el = document.getElementById(which === 'cam' ? 'pickCam' : 'pickGal'); el.value = ''; el.click(); }

/* ---------------- views ---------------- */
let curView = '';
let pages = [], createTarget = null;

function setStats(s){
  const p = [];
  if (s.cards.length) p.push(s.cards.length + ' כרטיסיות');
  if (s.mcq.length) p.push(s.mcq.length + ' שאלות');
  if (s.lesson.length) p.push('שיעור');
  return p.join(' · ') || 'ריק';
}
const knownCount = s => s.cards.filter(c => s.known[c.id]).length;

function viewHome(){
  leave(); curView = 'home'; tint(null);
  app.innerHTML = `
    <header class="hero">
      <div class="rainbow" aria-hidden="true">${[0,1,2,3,4,5].map(c => `<i data-c="${c}"></i>`).join('')}</div>
      <h1><span>לומדים</span> מהדף</h1>
      <p class="muted">מצלמים דף עבודה, רשימת מילים או תרגילים, ומקבלים ממנו כרטיסיות, שאלות אמריקאיות, התאמת זוגות, סידור אותיות, שיעור קצר וסרטונים.</p>
    </header>
    ${installHtml()}
    <button class="btn primary wide" data-a="new">${I.cam} סט חדש מצילום</button>
    ${sets.length ? `
      <div class="row between"><h2>הסטים שלי</h2><span class="muted small count">${sets.length}</span></div>
      <div class="sets">${sets.map(s => {
        const k = knownCount(s), n = s.cards.length;
        return `<button class="setcard" data-c="${s.color}" data-open="${esc(s.id)}">
          <div class="row between" style="width:100%"><h3 dir="auto">${esc(s.title)}</h3>${s.example ? '<span class="tag">דוגמה</span>' : ''}</div>
          <span class="muted small">${esc(setStats(s))}</span>
          ${n ? `<div class="row" style="width:100%"><div class="meter grow"><i style="width:${Math.round(k / n * 100)}%"></i></div><span class="small count">${k}/${n}</span></div>` : ''}
        </button>`; }).join('')}</div>`
    : `
      <ol class="steps">
        <li data-c="0">מצלמים דף אחד או כמה דפים</li>
        <li data-c="1">האפליקציה קוראת ובונה תרגול</li>
        <li data-c="3">מתרגלים עד שיודעים הכול</li>
      </ol>
      <div class="panel stack">
        <h3>עוד אין סטים</h3>
        <p class="muted small">לחץ על "סט חדש מצילום" כדי להתחיל, או פתח סט לדוגמה של מילים באנגלית כדי לראות איך זה עובד.</p>
        <button class="btn" data-a="example">פתח סט לדוגמה</button>
      </div>`}
    <p class="muted small">הסטים נשמרים במכשיר הזה. כדי להעביר סט לחבר או למכשיר אחר, לחץ "שתף" בתוך הסט.</p>`;
  app.onclick = async e => {
    const o = e.target.closest('[data-open]'); if (o) return viewSet(getSet(o.dataset.open));
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'new') { createTarget = null; pages = []; return viewCreate(); }
    if (a.dataset.a === 'example') { const s = exampleSet(); saveSet(s); return viewSet(s); }
    if (a.dataset.a === 'install' && installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch(e){} installEvt = null; return viewHome(); }
    if (a.dataset.a === 'hideinstall') { lset('lomdim_install_hide', '1'); return viewHome(); }
  };
}

function viewCreate(errMsg){
  leave(); curView = 'create';
  const target = createTarget ? getSet(createTarget) : null;
  tint(target ? target.color : 0);
  const maxPages = 20;
  app.innerHTML = `
    <div class="topbar"><button class="iconbtn" data-a="back" aria-label="חזרה">${I.back}</button><div class="grow">${target ? 'הוספת דפים' : 'סט חדש'}</div></div>
    ${target ? `<p class="muted">מוסיף ל: <strong dir="auto">${esc(target.title)}</strong></p>` : ''}
    <section class="panel stack">
      <div class="row between"><h3>הדפים</h3><span class="muted small count" id="pc"></span></div>
      <div class="pages" id="pages"></div>
      <div class="row">
        <button class="btn primary grow" type="button" data-a="cam">${I.cam} צלם דף</button>
        <button class="btn grow" type="button" data-a="gal">${I.img} מהגלריה</button>
      </div>
      <label class="stack" for="note" style="gap:6px"><span class="small muted">הערה (לא חובה)</span>
        <textarea id="note" rows="2" placeholder="למשל: רק המילים באנגלית, או: שאלות ברמה של כיתה ח׳"></textarea></label>
      <div id="msg">${errMsg ? `<p class="note bad">${esc(errMsg)}</p>` : ''}</div>
      <button class="btn primary wide" id="go" type="button" data-a="go">צור תרגול</button>
    </section>
    <div class="divider">או הקלדה ידנית</div>
    <section class="panel stack">
      <label class="stack" for="manual" style="gap:6px"><span class="small muted">שורה לכל פריט: מילה - פירוש</span>
        <textarea id="manual" rows="5" placeholder="apple - תפוח&#10;river - נהר&#10;כוח - מסה כפול תאוצה"></textarea></label>
      <button class="btn wide" type="button" data-a="manual">צור מהרשימה</button>
    </section>`;
  const pagesEl = document.getElementById('pages'), pc = document.getElementById('pc'), go = document.getElementById('go');
  function drawPages(){
    pagesEl.innerHTML = pages.map((p, i) => `<div class="thumb"><img src="${p.url}" alt="דף ${i + 1}"><b>${i + 1}</b><button type="button" data-rm="${i}" aria-label="הסר דף ${i + 1}">×</button></div>`).join('')
      + (pages.length < maxPages ? `<button class="addtile" type="button" data-a="gal">${I.plus}<span>הוסף דף</span></button>` : '');
    pc.textContent = pages.length ? pages.length + ' דפים' : '';
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
    const rm = e.target.closest('[data-rm]');
    if (rm) { const i = +rm.dataset.rm; URL.revokeObjectURL(pages[i].url); pages.splice(i, 1); return drawPages(); }
    const a = e.target.closest('[data-a]'); if (!a) return;
    switch (a.dataset.a) {
      case 'back': return target ? viewSet(target) : viewHome();
      case 'cam': return openPicker('cam');
      case 'gal': return openPicker('gal');
      case 'go': return generate(target, document.getElementById('note').value.trim());
      case 'manual': {
        const lines = document.getElementById('manual').value.split('\n').map(l => l.trim()).filter(Boolean);
        const cards = lines.map(l => { const m = l.split(/\s+[-–—:=]\s+|\t|\s*[–—=]\s*/); return m.length >= 2 ? { t: m[0].trim(), d: m.slice(1).join(' - ').trim() } : null; }).filter(c => c && c.t && c.d);
        if (!cards.length) return toast('כתוב כל פריט בשורה: מילה - פירוש');
        const s = target || fixSet({ title: 'רשימה חדשה' });
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

async function generate(target, note){
  if (!pages.length) return;
  leave(); curView = 'working';
  app.innerHTML = `
    <div class="panel working">
      <svg class="pen" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 22c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 36c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/><path d="M6 50c8-12 14-12 18 0s10 12 16 0 10-10 18-3"/></svg>
      <h2>קורא את הדפים</h2>
      <p class="muted" id="st">מכין את התמונות…</p>
      <p class="small muted">זה לוקח בדרך כלל חצי דקה עד דקה לכל כמה דפים.</p>
      <button class="btn" type="button" data-a="stop">עצור</button>
    </div>`;
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
  let ok = 0, lastErr = null, cancelled = false, done = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (ctl.signal.aborted) { cancelled = true; break; }
    const from = done + 1, to = done + chunks[i].length; done = to;
    st.textContent = chunks.length > 1 ? `קורא דפים ${from}–${to} מתוך ${pages.length}` : (pages.length > 1 ? `קורא ${pages.length} דפים` : 'קורא את הדף');
    try {
      const data = await callApi({ mode: 'pages', images: chunks[i], note, from, to, total: pages.length, first: i === 0 }, ctl.signal);
      const part = normalize(data && data.result);
      if (part.cards.length || part.mcq.length || part.scr.length || part.lesson.length) { mergeInto(s, part); ok++; }
      else lastErr = { code: 'empty' };
    } catch(e) {
      if (e && e.name === 'AbortError') { cancelled = true; break; }
      lastErr = e;
      if (e && e.code === 'need_code') return viewNeedCode(() => generate(target, note));
      if (['rate','no_key','offline','no_server'].includes(e && e.code)) break;
    }
  }
  if (ok) {
    if (!s.title || s.title === 'סט ללא שם') s.title = 'סט חדש';
    pages.forEach(p => URL.revokeObjectURL(p.url)); pages = [];
    saveSet(s); viewSet(s);
    if (cancelled) toast('נעצר. מה שכבר נוצר נשמר');
    else if (ok < chunks.length) toast('חלק מהדפים לא נקראו, השאר נשמרו');
  } else {
    viewCreate(cancelled ? '' : (lastErr && lastErr.code === 'empty' ? 'לא מצאתי בדפים חומר לתרגול. נסה צילום חד יותר, מקרוב ובאור טוב.' : errText(lastErr)));
  }
}

/* ---------------- set screen ---------------- */
function scrItems(s){
  const m = new Map();
  s.scr.forEach(x => m.set(x.w.toLowerCase(), { w: x.w, h: x.h }));
  s.cards.forEach(c => { if (lettersOnly.test(c.t) && !m.has(c.t.toLowerCase())) m.set(c.t.toLowerCase(), { w: c.t, h: c.d }); });
  return [...m.values()];
}
function casePool(s){
  const words = [...new Set([...s.cards.map(c => c.t), ...s.scr.map(x => x.w)].filter(w => /^[A-Za-z]{2,10}$/.test(w)).map(w => w.toLowerCase()))];
  let letters = [...new Set(words.join('').toUpperCase().split(''))];
  if (s.alphabet && letters.length < 8) letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return [...letters.map(L => [L, L.toLowerCase()]), ...words.map(w => [w.toUpperCase(), w])];
}
function mcqPool(s){
  const out = s.mcq.map(m => ({ q: m.q, o: m.o, a: m.a, x: m.x }));
  if (s.cards.length >= 4) s.cards.forEach(c => {
    const others = shuffle(s.cards.filter(o => o !== c && o.d !== c.d)).slice(0, 3).map(o => o.d);
    if (others.length < 2) return;
    const o = shuffle([c.d, ...others]);
    out.push({ q: c.t, o, a: o.indexOf(c.d), x: '', say: true });
  });
  return out;
}

function viewSet(s){
  leave(); curView = 'set';
  if (!s) return viewHome();
  tint(s.color);
  const n = s.cards.length;
  let editing = false;
  function draw(){
    const k = knownCount(s), scr = scrItems(s), cp = casePool(s), mp = mcqPool(s);
    const modes = [
      { id:'flash', c:0, ic:I.cards, name:'כרטיסיות', sub:'הופכים ובודקים מה יודעים', ok: s.cards.length > 0 },
      { id:'mcq', c:1, ic:I.abc, name:'אמריקאיות', sub: mp.length + ' שאלות לבחירה', ok: mp.length > 0 },
      { id:'match', c:2, ic:I.match, name:'התאמת זוגות', sub:'מחברים מילה לפירוש', ok: s.cards.length >= 3 },
      { id:'scr', c:3, ic:I.scr, name:'סידור אותיות', sub: scr.length ? scr.length + ' מילים לאיות' : 'אין מילים בודדות בסט', ok: scr.length > 0 },
      { id:'case', c:4, ic:I.Aa, name:'גדולות וקטנות', sub: cp.length >= 3 ? 'A ↔ a ומילים באותיות גדולות' : 'רק לסטים באנגלית', ok: cp.length >= 3 },
      { id:'write', c:5, ic:I.pen, name:'כתיבה', sub:'רואים פירוש, כותבים את המילה', ok: s.cards.length > 0 },
      { id:'lesson', c:3, ic:I.book, name:'שיעור קצר', sub: s.lesson.length ? 'הסבר על החומר' : 'ייווצר בלחיצה', ok: s.lesson.length > 0 || s.cards.length + s.mcq.length > 0 },
      { id:'videos', c:1, ic:I.play, name:'סרטונים', sub: s.topics.length ? s.topics.length + ' נושאים ביוטיוב' : 'חיפוש ביוטיוב', ok: true }
    ];
    const listHtml = () => {
      if (!s.cards.length && !s.mcq.length) return '<p class="muted small">אין עדיין פריטים בסט.</p>';
      const cards = s.cards.length || editing ? `<div class="list">${s.cards.map(c => editing
        ? `<div class="li"><input type="text" id="t_${c.id}" value="${esc(c.t)}" dir="auto" aria-label="מילה"><input type="text" id="d_${c.id}" value="${esc(c.d)}" dir="auto" aria-label="פירוש"><button class="x" type="button" data-del="${c.id}" aria-label="מחק">×</button></div>`
        : `<div class="li"><span class="t" dir="auto">${esc(c.t)}</span><span dir="auto">${esc(c.d)}</span><span class="known ${s.known[c.id] ? 'on' : ''}" title="${s.known[c.id] ? 'יודע' : 'עוד לא'}"></span></div>`).join('')}
        ${editing ? `<div class="li"><input type="text" id="t_new" placeholder="מילה חדשה" dir="auto" aria-label="מילה חדשה"><input type="text" id="d_new" placeholder="פירוש" dir="auto" aria-label="פירוש חדש"><span></span></div>` : ''}</div>` : '';
      const qs = s.mcq.length ? `<h3>שאלות אמריקאיות</h3><div class="list">${s.mcq.map(m => `<div class="qitem"><div dir="auto">${esc(m.q)}<br><span class="small muted" dir="auto">תשובה: ${esc(m.o[m.a])}</span></div>${editing ? `<button class="x" type="button" data-delq="${m.id}" aria-label="מחק שאלה">×</button>` : ''}</div>`).join('')}</div>` : '';
      return cards + qs;
    };
    app.innerHTML = `
      <div class="topbar"><button class="iconbtn" data-a="home" aria-label="לכל הסטים">${I.back}</button><div class="grow"></div>
        <button class="iconbtn" data-a="share" aria-label="שתף סט">${I.share}</button>
        <button class="btn ghost" data-a="add">${I.plus} הוסף דפים</button></div>
      <div class="stack" style="gap:8px">
        <input class="titlein" id="title" type="text" value="${esc(s.title)}" dir="auto" aria-label="שם הסט">
        <span class="muted small">${esc(setStats(s))}${n ? ` · יודע <strong>${k}</strong> מתוך ${s.cards.length}` : ''}</span>
        ${s.cards.length ? `<div class="meter"><i style="width:${Math.round(k / s.cards.length * 100)}%"></i></div>` : ''}
        <div class="swatches" role="group" aria-label="צבע הסט">${[0,1,2,3,4,5].map(c => `<button type="button" data-c="${c}" data-color="${c}" aria-pressed="${s.color === c}" aria-label="צבע ${c + 1}"></button>`).join('')}</div>
      </div>
      <div class="modes">${modes.map(m => `<button class="mode" data-c="${m.c}" data-mode="${m.id}" ${m.ok ? '' : 'disabled'}>${m.ic}<strong>${m.name}</strong><span>${esc(m.sub)}</span></button>`).join('')}</div>
      <div class="row between"><h3>מה יש בסט</h3>
        <div class="row">${editing ? `<button class="btn ghost" data-a="cancel">ביטול</button><button class="btn primary" data-a="saveedit">שמור</button>` : `<button class="btn ghost" data-a="edit">עריכה</button>`}</div></div>
      <div class="stack">${listHtml()}</div>
      <div class="row">${k ? '<button class="btn ghost" data-a="reset">אפס התקדמות</button>' : ''}<span class="grow"></span><button class="btn ghost danger" data-a="del">מחק סט</button></div>`;
  }
  draw();
  app.onchange = e => { if (e.target.id === 'title') { const v = e.target.value.trim(); if (v && v !== s.title) { s.title = v.slice(0, 60); saveSet(s); toast('השם נשמר'); } } };
  let delArm = 0;
  app.onclick = e => {
    const col = e.target.closest('[data-color]');
    if (col) { s.color = +col.dataset.color; tint(s.color); saveSet(s); return draw(); }
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
      case 'add': createTarget = s.id; pages = []; return viewCreate();
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

function viewImport(s){
  leave(); curView = 'import'; tint(s.color);
  app.innerHTML = `
    <header class="hero"><span class="eyebrow">שיתפו איתך סט</span><h2 dir="auto" style="color:var(--k)">${esc(s.title)}</h2><p class="muted">${esc(setStats(s))}</p></header>
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
    if (q || (r && r.dataset.r === 'quit')) return viewSet(s);
    if (r && r.dataset.r === 'again') return again();
    if (r && r.dataset.r === 'extra') return again(true);
  };
}
function startMode(s, mode){
  leave(); curView = 'practice';
  ({ flash: modeFlash, mcq: modeMcq,
     match: () => modeMatch(s, s.cards.map(c => [c.t, c.d]), 'התאמת זוגות', 'match'),
     case: () => modeMatch(s, casePool(s), 'גדולות וקטנות', 'case'),
     scr: modeScr, write: modeWrite, lesson: modeLesson, videos: modeVideos })[mode](s);
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
      <div class="row"><button class="btn grow" data-f="no" style="color:var(--bad)">עוד לא</button><button class="btn grow" data-f="yes" style="color:var(--ok)">יודע ✓</button></div>
      <div class="row center"><button class="btn ghost small" data-f="rev">הפוך צדדים</button></div>`;
  }
  function next(knew){
    const c = deck[i];
    if (knew) { s.known[c.id] = true; right++; } else { delete s.known[c.id]; missed.push(c); }
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
    document.getElementById('after').innerHTML = `<div class="stack">${q.x ? `<p class="explain" dir="auto">${esc(q.x)}</p>` : ''}<button class="btn primary wide" data-n="1">${i + 1 < qs.length ? 'הבא' : 'לתוצאה'}</button></div>`;
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
      ea.classList.add('gone'); b.classList.add('gone'); ea.classList.remove('sel'); done++;
      if (done === pairs.length) {
        clearInterval(iv); cleanup = null;
        const sec = (Date.now() - t0) / 1000, bk = key + 'Time', best = s.best[bk];
        const isBest = !best || sec < best; if (isBest) { s.best[bk] = Math.round(sec * 10) / 10; saveSoon(s); }
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
    <h2>כותב שיעור על החומר</h2><p class="muted">בערך חצי דקה.</p></div>`;
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

/* ---------------- boot ---------------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
(async function boot(){
  const h = location.hash;
  if (h.startsWith('#s=')) {
    try { return viewImport(await decodeSet(h.slice(3))); }
    catch(e) { history.replaceState(null, '', location.pathname); toast('הקישור לסט לא תקין'); }
  }
  viewHome();
})();
window.addEventListener('hashchange', async () => {
  if (location.hash.startsWith('#s=')) { try { viewImport(await decodeSet(location.hash.slice(3))); } catch(e){ toast('הקישור לסט לא תקין'); } }
});
})();
