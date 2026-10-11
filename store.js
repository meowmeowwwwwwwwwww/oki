// Oki data. Every change Даша makes is an action (TZ §4): the app applies it at once,
// keeps it in `pending`, and later the private repo receives it as a separate file.
const Store = (() => {
  const KEY = 'oki.v1';
  let state = null;
  const subs = [];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  // local time, not UTC: dates must match Даша's day even near midnight
  const stamp = () => {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  const empty = () => ({
    tasks: [], events: [], waiting: [], journal: [], people: [],
    settings: { name: 'Даша' },
    pending: [], savedAt: null, demo: false, onboarded: false,
  });

  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state) { state = empty(); fillDemo(); }
  }
  function save() {
    state.savedAt = stamp();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    subs.forEach(f => f());
  }
  function fillDemo() {
    const s = Sample(new Date());
    Object.assign(state, s, { demo: true });
  }

  const task = id => state.tasks.find(t => t.id === id);
  const event = id => state.events.find(e => e.id === id);

  // reducers: one per action type, same names the collector will understand
  const R = {
    task_new(a) { state.tasks.push(Object.assign({ id: a.ref, items: [], done: false, created: a.at, source: { kind: 'вручную', date: a.at.slice(0, 10) } }, a.task)); },
    task_done(a) { const t = task(a.ref); t.done = a.done; t.doneAt = a.done ? a.at : null; if (a.done && t.checkKind === 'done') { t.check = false; t.checkKind = null; } },
    task_due(a) { const t = task(a.ref); t.due = a.due || null; t.time = a.due ? (a.time || null) : null; },
    task_move(a) { const t = task(a.ref); t.area = a.area; t.group = a.group || null; },
    task_title(a) { task(a.ref).title = a.title; },
    task_not(a) { const t = task(a.ref); t.notTask = true; t.notAt = a.at; },
    task_back(a) { const t = task(a.ref); t.notTask = false; t.check = false; },
    task_confirm(a) {
      const t = task(a.ref);
      if (t.checkKind === 'done') { t.keptOpen = a.at; t.closeWhy = t.checkWhy; } // the collector learns from «Ещё нет»
      t.check = false; t.checkKind = null;
    },
    // written by the collector: the same matter came from another letter or chat — one task, both sources
    task_source(a) {
      const t = task(a.ref); (t.sources = t.sources || []).push(a.source);
      (a.items || []).forEach(x => { if (!t.items.some(i => i.t === x)) t.items.push({ t: x, done: false }); });
    },
    // written by the Telegram collector: the chat says it is done or not needed; Даша decides
    task_maybe_done(a) { const t = task(a.ref); if (t.done || t.notTask) return; t.check = true; t.checkKind = 'done'; t.checkHow = a.how; t.checkWhy = a.why; },
    task_delete(a) { state.tasks = state.tasks.filter(t => t.id !== a.ref); },
    item_add(a) { task(a.ref).items.push({ t: a.text, done: false }); },
    item_done(a) { task(a.ref).items[a.i].done = a.done; },
    item_delete(a) { task(a.ref).items.splice(a.i, 1); },
    event_new(a) { state.events.push(Object.assign({ id: a.ref }, a.event)); },
    event_delete(a) { state.events = state.events.filter(e => e.id !== a.ref); },
    wait_got(a) { const w = state.waiting.find(w => w.id === a.ref); if (w) w.got = a.at; },
    journal_new(a) { state.journal.push(Object.assign({ id: a.ref, at: a.at }, a.item)); }, // written by the mail collector
    journal_to_task(a) {
      const j = state.journal.find(j => j.id === a.ref); if (j) j.taken = a.at;
      R.task_new({ ref: a.task_id, at: a.at, task: a.task });
    },
    person_save(a) {
      const p = state.people.find(p => p.id === a.ref);
      if (p) Object.assign(p, a.person); else state.people.push(Object.assign({ id: a.ref }, a.person));
    },
    person_delete(a) { state.people = state.people.filter(p => p.id !== a.ref); },
    settings(a) { Object.assign(state.settings, a.settings); },
  };

  function act(type, data = {}) {
    const a = Object.assign({ id: uid(), type, at: stamp() }, data);
    if (!a.ref) a.ref = uid();
    R[type](a);
    state.pending.push(a);
    save();
    return a;
  }

  // what lives in the private repo; the rest (pending, flags) stays on the phone
  const DATA = ['tasks', 'events', 'waiting', 'journal', 'people', 'settings'];
  const data = () => JSON.parse(JSON.stringify(Object.fromEntries(DATA.map(k => [k, state[k]]))));
  // state = repo snapshot + its action files (+ actions not uploaded yet); a broken action is skipped, not fatal
  function play(base, actions) {
    const keep = { pending: state.pending, savedAt: state.savedAt, onboarded: state.onboarded };
    state = Object.assign(empty(), base ? JSON.parse(JSON.stringify(base)) : {}, keep);
    actions.forEach(a => { try { R[a.type](a); } catch (e) {} });
  }
  // snapshot for the repo: base + actions, without touching what is on screen
  function fold(base, actions) {
    const was = state; play(base, actions); const d = data(); state = was; return d;
  }
  function rebuild(base, actions) {
    const before = JSON.stringify(data());
    play(base, [...actions, ...state.pending]);
    if (JSON.stringify(data()) !== before) save();
    else try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  return {
    get s() { return state; },
    load, act, uid, stamp, task, event, data, fold, rebuild,
    on: f => subs.push(f),
    // local-only flags, not actions
    setFlag(k, v) { state[k] = v; save(); },
    // uploaded actions leave the queue
    sent(ids) { state.pending = state.pending.filter(a => !ids.includes(a.id)); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} },
    clearDemo() { const keep = { settings: state.settings, onboarded: true }; state = Object.assign(empty(), keep); save(); },
    restoreDemo() { const keep = { settings: state.settings, onboarded: true }; state = Object.assign(empty(), keep); fillDemo(); save(); },
  };
})();
