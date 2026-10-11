'use strict';
// Telegram login on the phone (TZ §5, §11.4). The phone signs in as a separate device «Oki»,
// hands the session to the private repo's Secrets (for the collector on GitHub) and forgets it.
// Only the list of chats stays here, for Даша to tick the groups she wants read.
const Tg = (() => {
  const LOGIN = 'oki.tgl'; // a login in progress: survives a trip to Telegram for the code, gone when done
  let c = null, st = read() || null;
  function read() { try { return JSON.parse(localStorage.getItem(LOGIN)); } catch (e) { return null; } }
  function keep() { try { st ? localStorage.setItem(LOGIN, JSON.stringify(st)) : localStorage.removeItem(LOGIN); } catch (e) {} }
  const fail = code => Object.assign(new Error(code), { code });
  const load = src => new Promise((ok, no) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(fail('offline')); document.head.append(s);
  });
  // Telegram's error words → what the screens say
  const CODE = {
    API_ID_INVALID: 'keys', API_ID_PUBLISHED_FLOOD: 'keys',
    PHONE_NUMBER_INVALID: 'phone', PHONE_NUMBER_BANNED: 'banned', PHONE_NUMBER_FLOOD: 'flood',
    PHONE_CODE_INVALID: 'code', PHONE_CODE_EMPTY: 'code', PHONE_CODE_EXPIRED: 'expired', PHONE_CODE_HASH_EMPTY: 'expired',
    PASSWORD_HASH_INVALID: 'pass', SESSION_PASSWORD_NEEDED: 'needpass',
  };
  function why(e) {
    if (typeof e.code === 'string') return e; // ours; Telegram's errors carry a number there
    const m = e.errorMessage || '';
    if (/^FLOOD_WAIT/.test(m) || e.seconds) return fail('flood');
    return fail(CODE[m] || (m ? 'tg' : 'offline'));
  }
  async function client() {
    if (c?.connected) return c;
    if (c) { try { await c.connect(); return c; } catch (e) { c = null; } } // the phone dropped the line while Даша was in Telegram for the code
    await load('lib/tg.min.js');
    c = new TG.TelegramClient(new TG.StringSession(st.s || ''), +st.id, st.hash, {
      connectionRetries: 3, useWSS: true, deviceModel: 'Oki', systemVersion: 'iPhone', appVersion: '1.0', langCode: 'ru', systemLangCode: 'ru',
    });
    c.setLogLevel('none');
    try { await c.connect(); } catch (e) { c = null; throw fail('offline'); }
    return c;
  }
  const save = () => { st.s = c.session.save(); keep(); };

  // step 1: api_id and api_hash from my.telegram.org
  function keys(id, hash) {
    id = String(id).replace(/\D/g, ''); hash = String(hash).trim().toLowerCase();
    if (!id || !/^[0-9a-f]{32}$/.test(hash)) throw fail('keys');
    if (c) { c.disconnect().catch(() => {}); c = null; }
    st = { id, hash }; keep();
  }
  // step 2: Telegram sends a code into the Telegram app
  async function phone(num) {
    num = String(num).replace(/[^\d+]/g, '');
    if (/^8\d{10}$/.test(num)) num = '+7' + num.slice(1);
    if (!num.startsWith('+')) num = '+' + num;
    if (num.length < 9) throw fail('phone');
    try {
      await client();
      const r = await c.sendCode({ apiId: +st.id, apiHash: st.hash }, num);
      st.phone = num; st.codeHash = r.phoneCodeHash; save();
    } catch (e) { throw why(e); }
  }
  // step 3: the code; 'pass' = a cloud password is set, one more step
  async function code(v) {
    if (st.in) return 'ok'; // signed in already, only saving was left
    v = String(v).replace(/\D/g, '');
    if (!v) throw fail('code');
    try {
      await client();
      const r = await c.invoke(new TG.Api.auth.SignIn({ phoneNumber: st.phone, phoneCodeHash: st.codeHash, phoneCode: v }));
      if (r instanceof TG.Api.auth.AuthorizationSignUpRequired) throw fail('nouser');
      st.in = true; save(); return 'ok';
    } catch (e) {
      e = why(e);
      if (e.code === 'needpass') { save(); return 'pass'; }
      throw e;
    }
  }
  // step 4 (only with a cloud password)
  async function password(pw) {
    if (st.in) return;
    if (!pw) throw fail('pass');
    try {
      await client();
      const p = await c.invoke(new TG.Api.account.GetPassword());
      await c.invoke(new TG.Api.auth.CheckPassword({ password: await TG.computeCheck(p, pw) }));
      st.in = true; save();
    } catch (e) { throw why(e); }
  }
  // her chats, like the collector sees them: «Избранное», personal chats, groups (no channels, no bots)
  async function chats() {
    await client();
    const me = await c.getMe(), out = [];
    for (const d of await c.getDialogs({ limit: 300 })) {
      const e = d.entity; if (!e) continue;
      let kind = null;
      if (e.className === 'User') kind = String(e.id) === String(me.id) ? 'saved' : (e.bot || e.deleted || e.support || String(e.id) === '777000') ? null : 'user';
      else if (e.className === 'Chat') kind = e.deactivated ? null : 'group';
      else if (e.className === 'Channel') kind = e.megagroup || e.gigagroup ? 'group' : null;
      if (!kind) continue;
      const title = kind === 'saved' ? 'Избранное' : e.className === 'User' ? [e.firstName, e.lastName].filter(Boolean).join(' ') || e.username || 'без имени' : e.title || 'без названия';
      const at = d.date ? new Date(d.date * 1000) : null;
      out.push({ id: String(d.id), kind, title, at: at ? `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}T${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}` : null, ...(e.participantsCount ? { n: e.participantsCount } : {}) });
    }
    return out;
  }
  // the session goes to Secrets, then this phone forgets it (TZ §11.4)
  async function finish() {
    const s = c.session.save();
    await Sync.secret('TG_API', JSON.stringify({ id: +st.id, hash: st.hash }));
    await Sync.secret('TG_SESSION', s);
    drop();
  }
  // a started login is thrown away (back to the start, or done)
  function drop() { if (c) { c.disconnect().catch(() => {}); c = null; } st = null; keep(); }

  return { keys, phone, code, password, chats, finish, drop, get st() { return st; } };
})();
