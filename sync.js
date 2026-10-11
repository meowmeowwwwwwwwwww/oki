'use strict';
// Oki ↔ Даша's private repo on GitHub (TZ §4, §7.5).
// The repo holds a snapshot (data/state.oki) and one file per action (actions/<id>.oki), all encrypted.
// The phone uploads its actions, reads everything back, and now and then folds actions into the snapshot.
// Token and encryption key live only in this phone's storage, never in actions or in the repo.
const Sync = (() => {
  const CFG = 'oki.gh', CACHE = 'oki.ghc';
  const API = 'https://api.github.com';
  const SNAP = 'data/state.oki', DIR = 'actions';
  const FOLD_AT = 20, FOLD_AGE = 864e5; // fold when this many action files, or the oldest is a day old

  let cfg = read(CFG) || null;
  let cache = read(CACHE) || {}; // action file name → decrypted action (files never change)
  let ck = null, running = null, again = false, timer = 0;
  const st = { status: cfg ? 'idle' : 'off', told: '' };
  const subs = [];

  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function write(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  const fail = code => Object.assign(new Error(code), { code });
  const tell = () => subs.forEach(f => f());

  /* ---------- encryption key: 25 random bytes, shown as OKI-XXXX-… (Crockford base32) ---------- */
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function keyText(bytes) {
    let bits = '', out = '';
    bytes.forEach(b => { bits += b.toString(2).padStart(8, '0'); });
    for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
    return 'OKI-' + out.match(/.{1,4}/g).join('-');
  }
  function keyBytes(text) {
    let s = String(text || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (s.startsWith('OKI')) s = s.slice(3);
    s = s.replace(/O/g, '0').replace(/[IL]/g, '1');
    if (s.length !== 40 || /[^0-9A-HJKMNP-TV-Z]/.test(s)) return null;
    const bits = [...s].map(c => B32.indexOf(c).toString(2).padStart(5, '0')).join('');
    return new Uint8Array(25).map((_, i) => parseInt(bits.slice(i * 8, i * 8 + 8), 2));
  }
  const newKey = () => keyText(crypto.getRandomValues(new Uint8Array(25)));
  const tidyKey = text => { const b = keyBytes(text); return b && keyText(b); };
  async function cryptoKey(text) {
    const h = await crypto.subtle.digest('SHA-256', keyBytes(text));
    return crypto.subtle.importKey('raw', h, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }

  /* ---------- sealed files: "OKI1" + iv + AES-GCM(json), as base64 ---------- */
  const MAGIC = [79, 75, 73, 49];
  const b64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0));
  async function seal(obj, key = ck) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj))));
    const out = new Uint8Array(4 + 12 + ct.length);
    out.set(MAGIC); out.set(iv, 4); out.set(ct, 16);
    return b64(out);
  }
  async function unseal(s, key = ck) {
    const u = unb64(s);
    if (MAGIC.some((m, i) => u[i] !== m)) throw fail('badkey');
    try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(4, 16) }, key, u.subarray(16)))); }
    catch (e) { throw fail('badkey'); }
  }

  /* ---------- GitHub API ---------- */
  async function gh(path, o = {}, c = cfg) {
    let r;
    try {
      r = await fetch(API + path, {
        method: o.method || 'GET', cache: 'no-store',
        headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
        body: o.body ? JSON.stringify(o.body) : undefined,
      });
    } catch (e) { throw fail('offline'); }
    const exp = r.headers.get('github-authentication-token-expiration');
    if (exp && c === cfg && cfg) cfg.exp = exp.slice(0, 10);
    if (r.status === 401) throw fail('auth');
    if (r.status === 403 || r.status === 429) throw fail(r.headers.get('x-ratelimit-remaining') === '0' ? 'busy' : 'perm');
    if (r.status >= 500) throw fail('offline');
    return r;
  }
  const repo = (c = cfg) => `/repos/${c.owner}/${c.repo}/contents/`;
  async function getFile(path, c = cfg) {
    const r = await gh(repo(c) + path, {}, c);
    if (r.status === 404) return null;
    if (!r.ok) throw fail('offline');
    const j = await r.json();
    return { sha: j.sha, content: j.content };
  }
  async function putFile(path, content, sha, c = cfg) {
    const r = await gh(repo(c) + path, { method: 'PUT', body: { message: 'oki', content, ...(sha ? { sha } : {}) } }, c);
    if (r.status === 409 || r.status === 422) return null; // someone wrote first (or file exists)
    if (r.status === 404) throw fail('norepo');
    if (!r.ok) throw fail('offline');
    return (await r.json()).content.sha;
  }
  async function listActions() {
    const r = await gh(repo() + DIR);
    if (r.status === 404) return [];
    if (!r.ok) throw fail('offline');
    return (await r.json()).filter(f => f.type === 'file' && f.name.endsWith('.oki')).map(f => ({ name: f.name, sha: f.sha }));
  }

  /* ---------- one sync round ---------- */
  async function round() {
    if (!ck) ck = await cryptoKey(cfg.key);
    // 1. send what Даша did (one file per action, in order)
    const sent = [];
    try {
      for (const a of Store.s.pending.slice()) {
        await putFile(`${DIR}/${a.id}.oki`, await seal(a)); // null = already there, also fine
        sent.push(a.id); cache[a.id + '.oki'] = a;
      }
    } finally { if (sent.length) { Store.sent(sent); write(CACHE, cache); } }
    // 2. read everything back
    const snapF = await getFile(SNAP);
    if (!snapF) throw fail('empty');
    const snap = await unseal(snapF.content);
    const applied = new Set(snap.applied || []);
    const files = (await listActions()).filter(f => !applied.has(f.name));
    for (const f of files) if (!cache[f.name]) cache[f.name] = await unseal((await getFile(`${DIR}/${f.name}`)).content);
    const names = new Set(files.map(f => f.name));
    Object.keys(cache).forEach(n => { if (!names.has(n)) delete cache[n]; });
    write(CACHE, cache);
    const acts = files.map(f => cache[f.name]).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
    Store.rebuild(snap.data, acts);
    // 3. fold old actions into the snapshot; if anyone else wrote it meanwhile, try next time
    if (acts.length >= FOLD_AT || (acts.length && Date.now() - new Date(acts[0].at) > FOLD_AGE)) {
      const all = new Set((await listActions()).map(f => f.name));
      const keep = [...applied].filter(n => all.has(n));
      const next = { v: 1, at: new Date().toISOString(), data: Store.fold(snap.data, acts), applied: [...keep, ...files.map(f => f.name)] };
      if (await putFile(SNAP, await seal(next), snapF.sha)) {
        for (const f of files) try { await gh(repo() + `${DIR}/${f.name}`, { method: 'DELETE', body: { message: 'oki', sha: f.sha } }); } catch (e) { break; }
      }
    }
  }

  async function run() {
    if (!cfg) return;
    if (running) { again = true; return running; }
    st.status = 'busy'; tell();
    running = (async () => {
      try {
        do { again = false; await round(); } while (again);
        cfg.last = new Date().toISOString(); cfg.err = null; st.status = 'ok';
      } catch (e) {
        const code = e.code || 'offline';
        cfg.err = code; st.status = code;
        if (code === 'badkey') ck = null;
      }
      write(CFG, cfg); running = null; tell();
    })();
    return running;
  }
  function soon(ms = 1500) { clearTimeout(timer); timer = setTimeout(run, ms); }

  /* ---------- connecting (the «Хранилище» screens) ---------- */
  // checks the GitHub key and finds the private repo; tells whether it already holds Oki data
  async function probe(token) {
    const c = { token: token.trim() };
    const u = await gh('/user', {}, c);
    if (!u.ok) throw fail('auth');
    c.owner = (await u.json()).login;
    let r = await gh(`/repos/${c.owner}/oki-data`, {}, c);
    if (r.status === 404) {
      const l = await gh('/user/repos?per_page=100&affiliation=owner&visibility=private', {}, c);
      const mine = l.ok ? (await l.json()).filter(x => x.private) : [];
      if (mine.length !== 1) throw fail('norepo');
      c.repo = mine[0].name;
    } else if (r.ok) c.repo = 'oki-data';
    else throw fail('norepo');
    c.exp = (u.headers.get('github-authentication-token-expiration') || '').slice(0, 10) || null;
    const f = await getFile(SNAP, c);
    return { c, has: !!f, snap: f };
  }
  // a new phone: the key must open the snapshot that is already there
  async function join(p, keyText) {
    const k = tidyKey(keyText); if (!k) throw fail('badkey');
    await unseal(p.snap.content, await cryptoKey(k));
    if (Store.s.demo) Store.s.pending = [];
    cfg = Object.assign(p.c, { key: k, last: null, err: null }); cache = {}; ck = null;
    write(CFG, cfg); write(CACHE, cache);
    await run();
  }
  // the first phone: write the first snapshot with what is on this phone (or a clean sheet instead of the sample)
  async function start(p, keyText) {
    const k = tidyKey(keyText), key = await cryptoKey(k);
    const data = Store.s.demo ? Store.fold(null, [{ type: 'settings', settings: Store.s.settings }]) : Store.data();
    const ok = await putFile(SNAP, await seal({ v: 1, at: new Date().toISOString(), data, applied: [] }, key), null, p.c);
    if (!ok) throw fail('perm');
    Store.s.pending = [];
    cfg = Object.assign(p.c, { key: k, last: null, err: null }); cache = {}; ck = null;
    write(CFG, cfg); write(CACHE, cache);
    await run();
  }
  // forget the repo on this phone; tasks stay here
  function forget() { cfg = null; cache = {}; ck = null; write(CFG, null); write(CACHE, null); st.status = 'off'; tell(); }

  // keep in step: after changes, on return to the app, and every few minutes while open
  Store.on(() => { if (cfg && Store.s.pending.length) soon(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
  window.addEventListener('online', () => run());
  setInterval(() => { if (!document.hidden) run(); }, 5 * 60e3);
  setTimeout(run, 400);

  return {
    st, run, probe, join, start, forget, newKey, tidyKey,
    get on() { return !!cfg; },
    get cfg() { return cfg; },
    sub: f => subs.push(f),
  };
})();
