// Automatic check of the whole app in a phone-sized browser.
// Run: BASE=https://lomdim-mehadaf.vercel.app node tests/smoke.mjs
// Paid AI calls are blocked during the test (answered with "busy"), so it costs nothing.
const PWM = await import(process.env.PW || 'playwright'); const chromium = PWM.chromium || PWM.default.chromium;
const BASE = (process.env.BASE || 'http://localhost:8768').replace(/\/$/, '');
const LIVE = !/localhost|127\.0\.0\.1/.test(BASE);

const fails = [], passes = [];
const check = (ok, name, extra) => { (ok ? passes : fails).push(name + (extra ? ' — ' + extra : '')); console.log((ok ? '✅ ' : '❌ ') + name + (extra ? ' — ' + extra : '')); };
async function step(name, fn){ try { await fn(); check(true, name); } catch (e) { check(false, name, String(e && e.message || e).split('\n')[0]); } }

const cards = [['dog','כלב'],['cat','חתול'],['horse','סוס'],['rabbit','ארנב'],['turtle','צב'],['lion','אריה']];
const SET = { id: 't1', title: 'בדיקה', termLang: 'en', defLang: 'he', cards: cards.map(([t, d], i) => ({ id: 'c' + i, t, d })),
  mcq: [{ id: 'q1', q: 'Where do they walk?', o: ['To the park', 'To school', 'Home'], a: 0, x: '' }],
  reading: [{ id: 'r1', title: 'Dan', lang: 'en', text: 'Dan has a small brown dog. Every morning they walk to the park. The dog likes to run after birds.', q: [] }] };

// 1. server parts
await step('שרת: מסד הנתונים מחובר (1 על 1, קישורים)', async () => {
  const r = await fetch(BASE + '/api/room?check=1'); const d = await r.json();
  if (LIVE && !d.ok) throw new Error(JSON.stringify(d));
});
await step('שרת: הקבצים הראשיים נטענים', async () => {
  for (const f of ['/', '/app.js', '/style.css', '/sw.js', '/manifest.webmanifest', '/robots.txt', '/sitemap.xml', '/og.jpg']) { const r = await fetch(BASE + f); if (!r.ok) throw new Error(f + ' ' + r.status); }
});

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL', serviceWorkers: 'block' });
const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e)));
const TRIVIA = { title: 'חלל', mcq: Array.from({ length: 12 }, (_, i) => ({ q: 'שאלה ' + (i + 1) + ' על החלל?', options: ['נכון', 'לא א', 'לא ב', 'לא ג'], answer: 0, explain: '' })) };
await pg.route('**/api/generate', r => { let b = {}; try { b = JSON.parse(r.request().postData() || '{}'); } catch {}
  if (b.mode === 'trivia') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: TRIVIA }) });
  return r.fulfill({ status: 503, contentType: 'application/json', body: '{"code":"busy"}' }); });
await pg.route('**/api/tts', r => r.fulfill({ status: 503, body: '{}' }));
await pg.route('https://fonts.googleapis.com/**', r => r.abort());
pg.setDefaultTimeout(8000);

// 2. first visit
await pg.goto(BASE + '/'); await pg.evaluate(() => localStorage.clear()); await pg.reload();
await step('מסך פתיחה: שתי אפשרויות וקופסת קוד', async () => {
  await pg.waitForSelector('.pick[data-a=photo]'); await pg.waitForSelector('.pick[data-a=topic]'); await pg.waitForSelector('#anycode');
  if (await pg.locator('[data-a=example]').count()) throw new Error('סט לדוגמה עדיין מופיע');
});
await step('יצירה: מסך צילום ומסך נושא נפתחים', async () => {
  await pg.click('.pick[data-a=photo]'); await pg.waitForSelector('.seg'); await pg.click('[data-tab=topic]'); await pg.waitForSelector('textarea, input[type=text]');
  await pg.click('[data-a=back]'); await pg.waitForSelector('.pick');
});
await step('קוד שגוי מציג הסבר ולא נתקע', async () => {
  await pg.fill('#anycode', 'abc'); await pg.click('[data-a=opencode]'); await pg.waitForSelector('#toast:not([hidden])');
});

// 3. with a set
await pg.evaluate(s => localStorage.setItem('lomdim_sets_v1', s), JSON.stringify([SET])); await pg.reload();
await step('מסך הבית עם סט', async () => { await pg.waitForSelector('[data-open="t1"]'); });
await step('מחיקה וביטול מחזירים את הסט', async () => {
  await pg.click('[data-a=manage]'); await pg.click('[data-delset="t1"]'); await pg.click('[data-delset="t1"]');
  await pg.waitForSelector('#toast .undo'); await pg.click('#toast .undo'); await pg.waitForSelector('[data-open="t1"]');
  const n = await pg.evaluate(() => JSON.parse(localStorage.getItem('lomdim_sets_v1')).length); if (n !== 1) throw new Error('נשמרו ' + n);
  if (await pg.locator('[data-a=manage]').count()) await pg.click('[data-a=manage]').catch(() => {});
});
await step('העברה לטלפון אחר יוצרת קוד שעובד', async () => {
  await pg.goto(BASE + '/'); await pg.waitForSelector('[data-open="t1"]');
  await pg.click('summary:has-text("העברת")'); await pg.click('[data-a=transfer]'); await pg.waitForSelector('.xcode', { timeout: 12000 });
  const code = (await pg.innerText('.xcode')).trim();
  const p2 = await ctx.newPage(); await p2.route('**/api/generate', r => r.fulfill({ status: 503, body: '{}' }));
  await p2.goto(BASE + '/'); await p2.evaluate(() => localStorage.clear()); await p2.reload();
  await p2.fill('#anycode', code); await p2.click('[data-a=opencode]'); await p2.waitForSelector('[data-open="t1"]', { timeout: 12000 }); await p2.close();
});

async function openSet(){ await pg.goto(BASE + '/'); await pg.click('[data-open="t1"]'); await pg.waitForSelector('.settitle'); }
async function quit(){ const q = pg.locator('[data-a=quit]').first(); if (await q.count()) await q.click(); }
async function game(mode, sel, inGames){
  await step('משחק: ' + mode, async () => {
    await openSet();
    await pg.click(`[data-mode=${mode}]`); await pg.waitForSelector(sel); await pg.waitForTimeout(300); await quit();
  });
}
await game('flash', '.face');
await step('אמריקאיות: עונים עד הסוף', async () => {
  await openSet(); await pg.click('.modes [data-mode=mcq]'); await pg.waitForSelector('.opt');
  for (let i = 0; i < 30 && !(await pg.locator('.result').count()); i++) { await pg.click('[data-o="0"]'); await pg.click('[data-n]'); }
  await pg.waitForSelector('.result');
});
await game('match', '.tile, .mtile, [data-m]');
await game('write', 'input, textarea');
await game('read', 'article.reading, .tw');
await game('balloon', '.letters', true);
await game('sentence', '.spool', true);
await game('catch', '.drop', true);
await step('תפוס את הנכון: נופל לאט מספיק לקריאה', async () => {
  await openSet(); await pg.click('[data-mode=catch]'); await pg.waitForSelector('.drop'); await pg.waitForTimeout(3000);
  const y = await pg.evaluate(() => parseFloat((document.querySelector('.drop').parentElement.style.transform.match(/translateY\(([\d.]+)/) || [0, 0])[1]));
  if (y > 40) throw new Error('אחרי 3 שניות כבר ירד ' + Math.round(y) + '%'); await quit();
});
await step('מסך הסט: לימוד ומשחקים מופרדים, סרטונים בנפרד', async () => {
  await openSet();
  const learn = await pg.locator('.modes:not(.small) [data-mode]').evaluateAll(a => a.map(x => x.dataset.mode));
  const games = await pg.locator('.modes.small [data-mode]').evaluateAll(a => a.map(x => x.dataset.mode));
  if (learn.some(m => ['balloon', 'catch', 'match', 'videos'].includes(m)) || games.some(m => ['flash', 'mcq', 'videos', 'test'].includes(m))) throw new Error(learn + ' | ' + games);
  await pg.waitForSelector('.extras [data-mode=videos]');
});
await step('1 על 1: מסך המשחק נפתח', async () => { await openSet(); await pg.click('[data-mode=vs], [data-a=vs]'); await pg.waitForSelector('#vscode'); });

await step('1 על 1 על נושא אקראי מהמסך הראשי', async () => {
  await pg.goto(BASE + '/'); await pg.evaluate(() => localStorage.clear()); await pg.reload();
  await pg.click('[data-a=vs]'); await pg.fill('#vsname', 'בודק'); await pg.click('[data-a=dice]');
  if (!(await pg.inputValue('#vstopic'))) throw new Error('הקובייה לא בחרה נושא');
  await pg.click('[data-a=topicgo]'); await pg.waitForSelector('.vscode', { timeout: 12000 });
  const code = (await pg.innerText('.vscode')).trim(); if (!/^\d{4}$/.test(code)) throw new Error('קוד: ' + code);
  const p2 = await ctx.newPage(); await p2.goto(BASE + '/'); await p2.fill('#anycode', code); await p2.click('[data-a=opencode]');
  await p2.fill('#vsname', 'חבר'); await p2.click('[data-a=join]'); await p2.waitForSelector('.vslobby', { timeout: 12000 });
  await pg.waitForSelector('[data-a=start]:not([disabled])', { timeout: 12000 }); await pg.click('[data-a=start]');
  await p2.waitForSelector('.opt, [data-o]', { timeout: 15000 }); await p2.close();
  await pg.goto(BASE + '/'); const n = await pg.evaluate(() => (JSON.parse(localStorage.getItem('lomdim_sets_v1') || '[]')).length); if (n) throw new Error('נשמר סט מיותר');
});

check(errs.length === 0, 'אין שגיאות קוד בדף', errs.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${passes.length} עברו, ${fails.length} נכשלו`);
if (fails.length) { console.log('נכשלו:\n- ' + fails.join('\n- ')); process.exit(1); }
