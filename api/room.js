// One-on-one games between two phones. Rooms live for two hours in a free Upstash Redis database
// connected in Vercel → Storage (it adds KV_REST_API_URL and KV_REST_API_TOKEN by itself).
// Keys per room: r:CODE:s state (only the host writes it), r:CODE:q questions, r:CODE:h host, r:CODE:g guest.
// the database variables may carry a prefix chosen in Vercel (e.g. STORAGE_KV_REST_API_URL), so look for any of them
function envEnd(...ends){ for (const e of ends) { if (process.env[e]) return process.env[e]; const k = Object.keys(process.env).find(n => n.endsWith('_' + e)); if (k) return process.env[k]; } return ''; }
const DB = envEnd('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL');
const TOKEN = envEnd('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN');
const TTL = '7200';

async function redis(...cmds){
  const r = await fetch(DB.replace(/\/$/, '') + '/pipeline', {
    method: 'POST', headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).map(x => x.result);
}
const parse = v => { try { return v ? JSON.parse(v) : null; } catch { return null; } };
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
const num = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

function cleanQuestions(qs){
  if (!Array.isArray(qs)) return null;
  const out = qs.slice(0, 15).map(q => {
    const o = Array.isArray(q && q.o) ? q.o.slice(0, 6).map(x => str(x, 200)) : [];
    const a = Number(q && q.a);
    return { q: str(q && q.q, 500), o, a, x: str(q && q.x, 400) };
  }).filter(q => q.q && q.o.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length);
  return out.length >= 3 ? out : null;
}
function player(name, now){ return { name: str(name, 24) || 'שחקן', idx: 0, score: 0, right: 0, done: false, t: now }; }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // GET /api/room?check=1 shows whether the game database is connected
  if (req.method === 'GET') {
    if (!DB || !TOKEN) return res.status(200).json({ ok: false, why: 'אין מסד נתונים מחובר ב-Vercel (Storage ← Upstash for Redis)', vars: Object.keys(process.env).filter(k => /KV|REDIS|UPSTASH/.test(k)) });
    try { const [pong] = await redis(['PING']); return res.status(200).json({ ok: pong === 'PONG', pong }); }
    catch (e) { return res.status(200).json({ ok: false, why: String(e && e.message || e) }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  if (!DB || !TOKEN) return res.status(503).json({ code: 'no_db' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } b = b || {};
  const now = Date.now(), code = str(b.code, 4);

  // short share links: the whole set is kept under a short code for a year
  if (b.action === 'put') {
    const data = str(b.data, 300000);
    if (!/^[zj][A-Za-z0-9_-]{10,}$/.test(data)) return res.status(400).json({ code: 'bad_request' });
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    for (let i = 0; i < 6; i++) {
      const c = Array.from({ length: 6 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
      const [ok] = await redis(['SET', 'k:' + c, data, 'EX', String(60 * 60 * 24 * 365), 'NX']);
      if (ok === 'OK') return res.status(200).json({ code: c });
    }
    return res.status(503).json({ code: 'busy' });
  }
  if (b.action === 'get') {
    const c = str(b.code, 12);
    if (!/^[a-z0-9]{6}$/.test(c)) return res.status(400).json({ code: 'bad_code' });
    const [data] = await redis(['GET', 'k:' + c]);
    return data ? res.status(200).json({ data }) : res.status(404).json({ code: 'not_found' });
  }

  if (b.action !== 'create' && !/^\d{4}$/.test(code)) return res.status(400).json({ code: 'bad_code' });
  const K = c => ({ s: `r:${c}:s`, q: `r:${c}:q`, h: `r:${c}:h`, g: `r:${c}:g` });

  try {
    if (b.action === 'create') {
      const qs = cleanQuestions(b.questions);
      if (!qs) return res.status(400).json({ code: 'few_questions' });
      for (let i = 0; i < 8; i++) {
        const c = String(1000 + Math.floor(Math.random() * 9000)), k = K(c);
        const [ok] = await redis(['SET', k.s, JSON.stringify({ st: 'wait', title: str(b.title, 60), n: qs.length, sec: num(b.sec, 60) || 20 }), 'EX', TTL, 'NX']);
        if (ok !== 'OK') continue;
        await redis(['SET', k.q, JSON.stringify(qs), 'EX', TTL], ['SET', k.h, JSON.stringify(player(b.name, now)), 'EX', TTL]);
        return res.status(200).json({ code: c, now });
      }
      return res.status(503).json({ code: 'busy' });
    }

    const k = K(code);
    if (b.action === 'join') {
      const [s, q, g] = await redis(['GET', k.s], ['GET', k.q], ['GET', k.g]);
      if (!s || !q) return res.status(404).json({ code: 'not_found' });
      const old = parse(g);
      if (old && old.name !== str(b.name, 24)) return res.status(409).json({ code: 'full' });
      if (!old) {
        const [ok] = await redis(['SET', k.g, JSON.stringify(player(b.name, now)), 'EX', TTL, 'NX']);
        if (ok !== 'OK') return res.status(409).json({ code: 'full' });
      }
      return res.status(200).json({ state: parse(s), questions: parse(q), now });
    }
    if (b.action === 'poll') {
      const [s, h, g] = await redis(['GET', k.s], ['GET', k.h], ['GET', k.g]);
      if (!s) return res.status(404).json({ code: 'not_found' });
      return res.status(200).json({ state: parse(s), h: parse(h), g: parse(g), now });
    }
    if (b.action === 'start' || b.action === 'next') {
      const [s] = await redis(['GET', k.s]); const st = parse(s);
      if (!st) return res.status(404).json({ code: 'not_found' });
      if (b.action === 'start') { st.st = 'play'; st.start = now + 4000; }
      else { if (!/^\d{4}$/.test(str(b.next, 4))) return res.status(400).json({ code: 'bad_code' }); st.next = str(b.next, 4); }
      await redis(['SET', k.s, JSON.stringify(st), 'EX', TTL]);
      return res.status(200).json({ state: st, now });
    }
    if (b.action === 'me') {
      const role = b.role === 'h' ? 'h' : b.role === 'g' ? 'g' : null;
      if (!role) return res.status(400).json({ code: 'bad_role' });
      const me = { name: str(b.name, 24) || 'שחקן', idx: num(b.idx, 15), score: num(b.score, 5000), right: num(b.right, 15), done: !!b.done, t: now };
      await redis(['SET', k[role], JSON.stringify(me), 'EX', TTL]);
      return res.status(200).json({ ok: true, now });
    }
    return res.status(400).json({ code: 'bad_action' });
  } catch (e) {
    console.error('room', e);
    return res.status(503).json({ code: 'busy' });
  }
}
