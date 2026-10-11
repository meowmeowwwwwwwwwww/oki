'use strict';
// Oki — motion. Screens slide like on iPhone, tabs page under the finger, a sheet drags down to close.
// Chosen by Даша 2026-10-11. 2026-10-12: moves land on springs like in Telegram; a task is held, not swiped, for its menu.

const RM = matchMedia('(prefers-reduced-motion: reduce)');
const EASE = 'cubic-bezier(.32,.72,0,1)'; // iOS-like: quick start, long soft landing
const TABS = ['home', 'work', 'study', 'personal', 'cal'];
const PH = { home: 'Напишите задачу…', work: AREAS.work.ph, study: AREAS.study.ph, personal: AREAS.personal.ph, cal: 'Встреча, событие или задача…' };
const isTab = n => TABS.includes(n);
const view = $('#view');
const W = () => view.clientWidth;
const BG = '<div class="pbg"><i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i></div>';

// cur: the screen on show; stack: route keys of pushed screens (mirrors browser history)
// quiet: the address a swipe has already switched to, its own hashchange has nothing left to do
const Nav = { cur: null, stack: [], intent: null, adopt: null, jobs: [], busy: false, quiet: null };

/* ---------- dock: one input + tabs under all tab screens ---------- */
const dockEl = document.createElement('div');
dockEl.id = 'dock'; dockEl.className = 'dock';
dockEl.innerHTML = dock('home', PH.home);
view.append(dockEl);
const tabBtns = () => dockEl.querySelectorAll('.tabs [data-go]');
function syncDock(name, animate = true) {
  dockEl.inert = !isTab(name);
  if (!isTab(name)) return;
  dockEl.querySelector('input').placeholder = PH[name];
  tabBtns().forEach(b => b.classList.toggle('on', b.dataset.go === name));
  placeInd(TABS.indexOf(name), animate);
}
// the white pill behind the active tab; pos is fractional while a finger pages between tabs.
// Tab places are read once: reading them while a finger moves the screen would stall every frame.
let TP = null;
function placeInd(pos, animate) {
  TP ||= [...tabBtns()].map(b => [b.offsetLeft, b.offsetWidth]);
  const n = TP.length - 1, i = Math.max(0, Math.min(n, Math.floor(pos))), f = Math.max(0, Math.min(1, pos - i)), j = Math.min(i + 1, n);
  const ind = dockEl.querySelector('.ind');
  ind.style.transition = animate ? '' : 'none';
  ind.style.width = TP[i][1] + (TP[j][1] - TP[i][1]) * f + 'px';
  ind.style.transform = `translateX(${TP[i][0] + (TP[j][0] - TP[i][0]) * f}px)`;
}
new ResizeObserver(() => { TP = null; view.style.setProperty('--dockh', dockEl.offsetHeight + 'px'); if (Nav.cur) syncDock(Nav.cur.r.name, false); }).observe(dockEl);
document.fonts?.ready.then(() => { TP = null; if (Nav.cur) syncDock(Nav.cur.r.name, false); });

/* ---------- panes ---------- */
function route(h = location.hash) {
  const [name, id] = (h.replace(/^#\/?/, '') || 'home').split('/');
  return { name: SCREENS[name] ? name : 'home', id: id && decodeURIComponent(id), key: h && h !== '#/' ? h : '#/home' };
}
const wanted = () => S().onboarded ? route() : { name: 'onboard', key: 'onboard' };
function makePane(r) {
  const html = SCREENS[r.name](r);
  if (html == null) return null;
  const el = document.createElement('div'), full = !isTab(r.name);
  el.className = 'pane' + (full ? ' full' : '');
  el.innerHTML = (full ? BG : '') + `<div class="pc">${html}</div>`;
  // a pushed screen carries its own mist; keep its blobs in step with the shared ones
  if (full) {
    const src = document.querySelectorAll('#bg .blob');
    el.querySelectorAll('.pbg .blob').forEach((b, i) => {
      const a = src[i]?.getAnimations?.()[0];
      if (a && a.currentTime != null) b.style.animationDelay = `${-(a.currentTime - a.effect.getTiming().delay)}ms`;
    });
  }
  return el;
}
// quiet: a screen made ahead, not on show yet (the rabbit hops when it is)
function settle(el, r, quiet) {
  const m = el.querySelector('.main');
  if (m) {
    m.scrollTop = ui.scroll[r.key] || 0;
    if (r.name === 'cal') { m.addEventListener('scroll', calScroll, { passive: true }); calScroll.call(m); }
  }
  if (!quiet) hop(el);
}
function calScroll() {
  const cal = this.querySelector('.cal'), wk = this.querySelector('.wkwrap');
  if (cal && wk) wk.classList.toggle('show', cal.getBoundingClientRect().bottom < this.getBoundingClientRect().top + parseFloat(getComputedStyle(this).paddingTop) + 88);
}
function hop(el) {
  if (!ui.hop || Date.now() - ui.hop > 4000) return;
  const svg = el.querySelector('.stage svg, .hd .bun');
  if (svg) { ui.hop = 0; svg.classList.add('hop'); }
}
const saveScroll = c => { const m = c?.el.querySelector('.main'); if (m) ui.scroll[c.r.key] = m.scrollTop; };

/* ---------- navigation ---------- */
function go(p) {
  const to = route('#/' + p), cur = Nav.cur?.r;
  // the tab you are on, tapped again: back to the top of its list
  if (cur && to.key === cur.key) { Nav.cur.el.querySelector('.main')?.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }); return; }
  if (isTab(to.name)) { Nav.intent = { anim: !cur || isTab(cur.name) ? 'tab' : 'pop', stack: 'reset' }; location.replace(to.key); }
  else { Nav.intent = { anim: 'push', stack: 'push' }; location.hash = to.key; }
}
function back(to) {
  if (Nav.stack.length > 1) { Nav.intent = { anim: 'pop', stack: 'pop' }; history.back(); }
  else { const r = route('#/' + to); Nav.intent = { anim: 'pop', stack: 'reset' }; location.replace(r.key); }
}
function apply(to) {
  const r = to || wanted();
  if (!to && Nav.quiet) { const q = Nav.quiet; Nav.quiet = null; if (q === r.key && !Nav.intent) return; }
  let it = Nav.intent; Nav.intent = null;
  if (Nav.cur && r.key === Nav.cur.r.key) return repaint();
  // browser back/forward: no animation of our own
  if (!it) it = r.key === Nav.stack.at(-2) ? { anim: 'none', stack: 'pop' } : { anim: 'none', stack: Nav.cur ? 'push' : 'reset' };
  if (it.stack === 'push') Nav.stack.push(r.key);
  else if (it.stack === 'pop' && Nav.stack.at(-2) === r.key) Nav.stack.pop();
  else Nav.stack = [r.key];
  show(r, it.anim);
}
// Store changes and the minute timer: redraw the screen in place
function render() { if (!Nav.busy) apply(); }

function show(r, how) {
  finishJobs();
  const old = Nav.cur;
  saveScroll(old);
  const el = how === 'adopt' ? Nav.adopt : makePane(r);
  dropPre(el);
  Nav.adopt = null;
  if (!el) { Nav.intent = { anim: 'none', stack: 'reset' }; location.replace('#/home'); return; }
  document.body.className = 'r-' + r.name;
  Nav.cur = { r, el };
  syncDock(r.name, how !== 'none');
  prebuild();
  if (how === 'adopt') { el.style.transform = ''; el.style.visibility = ''; dockEl.style.transform = ''; old?.el.remove(); hop(el); return; }
  if (how === 'pop' && old) old.el.before(el); else view.append(el);
  settle(el, r);
  if (!old || how === 'none' || RM.matches) { old?.el.remove(); return; }
  const w = W(), done = () => old.el.remove();
  const under = (pane, tab) => tab ? [pane, dockEl] : [pane];
  const X = x => ({ transform: `translateX(${x}px)` });
  if (how === 'push') run([[el, [X(w), X(0)]], ...under(old.el, isTab(old.r.name)).map(u => [u, [X(0), X(-w * .3)]])], 420, EASE, done);
  else if (how === 'pop') run([[old.el, [X(0), X(w)]], ...under(el, isTab(r.name)).map(u => [u, [X(-w * .3), X(0)]])], 420, EASE, done);
  else if (how === 'tab') {
    const d = Math.sign(TABS.indexOf(r.name) - TABS.indexOf(old.r.name)) || 1;
    run([[el, [{ transform: `translateX(${d * w * .22}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }]],
      [old.el, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-d * w * .22}px)`, opacity: 0 }]]], 320, 'cubic-bezier(.2,.8,.2,1)', done);
  } else run([[el, [{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'none' }]], [old.el, [{ opacity: 1 }, { opacity: 0 }]]], 520, 'ease', done);
}
function run(list, dur, easing, done) {
  const job = { anims: list.map(([el, kf]) => el.animate(kf, { duration: dur, easing })), over: false };
  job.end = () => { if (job.over) return; job.over = true; Nav.jobs = Nav.jobs.filter(j => j !== job); done?.(); };
  Nav.jobs.push(job);
  Promise.all(job.anims.map(a => a.finished)).then(job.end, job.end);
}
function finishJobs() { Nav.jobs.slice().forEach(j => { j.anims.forEach(a => a.finish()); j.end(); }); }

function repaint() {
  const { r, el } = Nav.cur;
  const html = SCREENS[r.name](r);
  if (html == null) return; // e.g. the task was just deleted and the screen is leaving
  const pc = el.querySelector('.pc'), st = pc.querySelector('.main')?.scrollTop;
  const before = spots(pc);
  dropPre(); prebuild();
  pc.innerHTML = html;
  const m = pc.querySelector('.main');
  if (m) { m.scrollTop = st || 0; if (r.name === 'cal') { m.addEventListener('scroll', calScroll, { passive: true }); calScroll.call(m); } }
  flip(pc, before);
  hop(el);
  syncDock(r.name, false);
}
// tasks glide to their new place instead of jumping (done ones sink to the bottom)
function spots(root) { const m = new Map(); root.querySelectorAll('[data-tid],[data-bid]').forEach(e => m.set(e.dataset.tid || 'b' + e.dataset.bid, e.getBoundingClientRect().top)); return m; }
function flip(root, before) {
  if (RM.matches) return;
  root.querySelectorAll('[data-tid],[data-bid]').forEach(e => {
    const y = before.get(e.dataset.tid || 'b' + e.dataset.bid);
    if (y == null) { if (before.size) e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }); return; }
    const d = y - e.getBoundingClientRect().top;
    if (Math.abs(d) > 1) e.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 420, easing: EASE });
  });
}

/* ---------- springs for finger-driven moves ---------- */
// A screen leaves the finger with the finger's own speed and comes to rest softly, like in Telegram,
// instead of a fixed slide that ignores the flick (Даша 2026-10-12: swipes felt «деревянные»).
// k: stiffness, z: damping (1 = no bounce), v: speed in px per ms along the value.
const Springs = new Set();
function spring(from, to, v, fn, done, { k = 260, z = 1, bounce = false } = {}) {
  const job = { finish() { if (job.off) return; job.off = true; Springs.delete(job); fn(to); done?.(); } };
  // hidden page: frames don't come, so land at once instead of hanging mid-move
  if (RM.matches || document.hidden) { job.finish(); return job; }
  const c = 2 * z * Math.sqrt(k);
  let x = from - to, u = v * 1000, t = performance.now();
  // a fast flick still lands without bumping past the target: the speed is capped to what the spring can take
  if (!bounce && x * u < 0) u = Math.sign(u) * Math.min(Math.abs(u), Math.sqrt(k) * Math.abs(x) * .95);
  Springs.add(job);
  const step = now => {
    if (job.off) return;
    const dt = Math.min(.05, Math.max(0, now - t) / 1000) / 4; t = now;
    for (let i = 0; i < 4; i++) { u += (-k * x - c * u) * dt; x += u * dt; }
    if (Math.abs(x) < .3 && Math.abs(u) < 12) return job.finish();
    fn(to + x); requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return job;
}
const finishSprings = () => [...Springs].forEach(j => j.finish());
// the same spring as a CSS easing, for things that pop open by themselves
function springEase(k, z) {
  const c = 2 * z * Math.sqrt(k), h = 1 / 240, p = [0];
  let x = 1, u = 0;
  for (let f = 0; f < 120; f++) {
    for (let i = 0; i < 4; i++) { u += (-k * x - c * u) * h; x += u * h; }
    p.push(+(1 - x).toFixed(4));
    if (f > 6 && Math.abs(x) < .002 && Math.abs(u) < .05) break;
  }
  p[p.length - 1] = 1;
  return CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? { easing: `linear(${p.join(',')})`, duration: Math.round((p.length - 1) * 1000 / 60) }
    : { easing: 'cubic-bezier(.2,1.2,.3,1)', duration: 420 };
}
// past the last tab the screen goes heavy under the finger instead of stopping dead
const rubber = (x, d) => Math.sign(x) * (1 - 1 / (Math.abs(x) * .55 / d + 1)) * d;
// finger speed over the last tenth of a second; a finger that stopped before lifting has none
function speed(pts, at) {
  const p = pts.filter(q => at - q[0] < 100);
  if (p.length < 2 || at - p.at(-1)[0] > 70) return 0;
  return (p.at(-1)[1] - p[0][1]) / Math.max(8, p.at(-1)[0] - p[0][0]);
}
// an animation that ends even when the page is hidden and frames don't come
const ended = (a, ms) => Promise.race([a.finished.catch(() => {}), new Promise(r => setTimeout(r, ms + 80))]);

/* ---------- the screens next door, made ahead ---------- */
// Making a screen takes a moment. Made while nothing moves, they let a swipe start without a hitch.
const Pre = { m: new Map(), t: 0 };
function backKey() {
  if (Nav.stack.length > 1) return Nav.stack.at(-2);
  const b = Nav.cur?.el.querySelector('.back[data-to]');
  return b ? route('#/' + b.dataset.to).key : null;
}
function nextKeys() {
  const r = Nav.cur?.r; if (!r) return [];
  if (!isTab(r.name)) return [backKey()].filter(Boolean);
  const i = TABS.indexOf(r.name);
  return [TABS[i - 1], TABS[i + 1]].filter(Boolean).map(n => route('#/' + n).key);
}
function takePre(key) {
  if (Pre.m.has(key)) return Pre.m.get(key);
  const r = route(key), el = makePane(r);
  const p = el && { el, r, tab: isTab(r.name) };
  Pre.m.set(key, p);
  if (!p) return null;
  el.style.visibility = 'hidden';
  // the screen to go back to lies under the current one; a neighbour tab lies beside it
  if (isTab(Nav.cur.r.name)) view.append(el); else Nav.cur.el.before(el);
  settle(el, r, true);
  return p;
}
function dropPre(keep) { clearTimeout(Pre.t); Pre.m.forEach(p => { if (p && p.el !== keep) p.el.remove(); }); Pre.m.clear(); }
function prebuild() {
  clearTimeout(Pre.t);
  Pre.t = setTimeout(() => {
    if (G || Nav.busy || Nav.jobs.length || Ctx.box || document.hidden) return prebuild();
    nextKeys().forEach(takePre);
  }, 450);
}
// the screen that slid in becomes the current one at once (the address follows a moment later),
// so the next swipe can start while this one is still landing
function adopt(p, stack) {
  Nav.adopt = p.el; Nav.intent = { anim: 'adopt', stack };
  apply(p.r);
  Nav.quiet = p.r.key;
  if (stack === 'pop') history.back(); else location.replace(p.r.key);
}

/* ---------- swipes ---------- */
const SW = {
  // page between tabs, anywhere on the screen: the neighbour tab slides in next to the current one
  page: {
    begin(s) { s.i = TABS.indexOf(Nav.cur.r.name); s.nb = {}; s.w = W(); },
    drag(s, dx) {
      const w = s.w, dir = dx < 0 ? 1 : -1, j = s.i + dir;
      let x = dx;
      if (j < 0 || j >= TABS.length) x = rubber(dx, w);
      else if (!(dir in s.nb)) s.nb[dir] = takePre(route('#/' + TABS[j]).key);
      for (const d of [1, -1]) if (s.nb[d]) s.nb[d].el.style.visibility = d === dir ? '' : 'hidden';
      const n = s.nb[dir]; if (n) n.el.style.transform = `translateX(${x + dir * w}px)`;
      Nav.cur.el.style.transform = `translateX(${x}px)`;
      placeInd(s.i - x / w, false);
      s.off = x; s.dir = dir;
    },
    end(s, v) {
      const w = s.w, x = s.off || 0, n = s.nb[s.dir], cur = Nav.cur;
      // a flick decides by its direction, a slow drag by how far it went
      const go = !!n && (Math.abs(v) > .25 ? Math.sign(v) === Math.sign(x) : Math.abs(x) > w * .4);
      const to = go ? -s.dir * w : 0;
      const move = y => { cur.el.style.transform = `translateX(${y}px)`; if (n) n.el.style.transform = `translateX(${y + s.dir * w}px)`; placeInd(s.i - y / w, false); };
      if (go) document.body.className = 'r-' + n.r.name;
      Nav.busy = true;
      spring(x, to, v, move, () => {
        Nav.busy = false;
        if (go) { saveScroll(cur); return adopt(n, 'reset'); }
        cur.el.style.transform = '';
        Object.values(s.nb).forEach(o => { if (o) { o.el.style.visibility = 'hidden'; o.el.style.transform = ''; } });
      }, { k: 300 });
    },
  },
  // swipe right on a pushed screen: go back, the previous screen follows the finger
  back: {
    begin(s) {
      const k = backKey(), u = k && takePre(k);
      if (!u) return false;
      s.w = W(); s.under = u;
      u.el.style.visibility = '';
      if (u.tab) syncDock(u.r.name, false);
    },
    drag(s, dx) {
      const w = s.w, x = Math.max(0, dx), t = `translateX(${-w * .3 * (1 - x / w)}px)`;
      Nav.cur.el.style.transform = `translateX(${x}px)`;
      s.under.el.style.transform = t;
      if (s.under.tab) dockEl.style.transform = t;
      s.off = x;
    },
    end(s, v) {
      const w = s.w, x = s.off || 0, cur = Nav.cur, u = s.under;
      const go = Math.abs(v) > .25 ? v > 0 : x > w * .4;
      const move = y => {
        cur.el.style.transform = `translateX(${y}px)`;
        const t = `translateX(${-w * .3 * (1 - y / w)}px)`;
        u.el.style.transform = t; if (u.tab) dockEl.style.transform = t;
      };
      if (go) document.body.className = 'r-' + u.r.name;
      Nav.busy = true;
      spring(x, go ? w : 0, v, move, () => {
        Nav.busy = false;
        if (go) return adopt(u, Nav.stack.length > 1 ? 'pop' : 'reset');
        u.el.style.visibility = 'hidden'; u.el.style.transform = '';
        cur.el.style.transform = ''; dockEl.style.transform = '';
        syncDock(cur.r.name, false);
      }, { k: 280 });
    },
  },
};

/* ---------- pointer tracking ---------- */
let G = null, eatClick = false;
// a new touch anywhere (a toast button, a sheet) starts clean: the click after a swipe is eaten only once
window.addEventListener('pointerdown', () => { eatClick = false; }, true);
view.addEventListener('pointerdown', e => {
  eatClick = false;
  G = null; // a lost release must never block the next touch
  if (e.button > 0 || !e.isPrimary) return;
  let t = e.target;
  // a touch while a screen is still landing: land it now and take this touch as a fresh start
  if (Nav.busy) { finishSprings(); t = document.elementFromPoint(e.clientX, e.clientY) || t; }
  if (Nav.busy || t.closest('input,textarea,select,.chips,.mic')) return;
  if (!Nav.cur || !(Nav.cur.el.contains(t) || dockEl.contains(t))) return;
  finishJobs();
  G = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: null, pts: [] };
  holdStart(t, e);
});
window.addEventListener('pointermove', e => {
  const s = G; if (!s || e.pointerId !== s.id) return;
  const dx = e.clientX - s.x, dy = e.clientY - s.y;
  s.pts.push([e.timeStamp, e.clientX]); if (s.pts.length > 12) s.pts.shift();
  if (!s.mode) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    holdCancel();
    // mostly up or down: that is scrolling, the list takes it
    if (Math.abs(dx) < Math.abs(dy) * 1.3) { G = null; return; }
    if (isTab(Nav.cur.r.name)) s.mode = 'page';
    else if (dx > 0 && backKey()) s.mode = 'back';
    else { G = null; return; }
    s.x += Math.sign(dx) * 8; // start from the finger, without a jump
    eatClick = true;
    if (SW[s.mode].begin(s) === false) { G = null; return; }
  }
  SW[s.mode].drag(s, e.clientX - s.x);
}, { passive: true });
function release(e, cancel) {
  if (e.pointerId === Hold.pid) holdCancel();
  const s = G; if (!s || e.pointerId !== s.id) return;
  G = null;
  if (!s.mode) return;
  SW[s.mode].end(s, cancel ? 0 : speed(s.pts, e.timeStamp));
}
window.addEventListener('pointerup', e => release(e, false));
window.addEventListener('pointercancel', e => release(e, true));
document.addEventListener('click', e => { if (eatClick) { eatClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
// iOS shows :active press states only when the page listens to touches
document.addEventListener('touchstart', () => {}, { passive: true });
// no pinch zoom (Safari ignores user-scalable=no; the iPhone shell respects it)
['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
document.addEventListener('contextmenu', e => { if (e.target.closest('.task,.dl,.big,#ctx')) e.preventDefault(); });

/* ---------- long press on a task: its menu, like in Telegram ---------- */
// Instead of swiping a task (Даша 2026-10-12): hold it, the task lifts above a blurred screen
// with its actions under it. Keep the finger down and slide onto an action to pick it in one move.
const Hold = { t: 0, row: null, pid: null };
function holdStart(t, e) {
  const row = t.closest('.task[data-tid],.dl[data-tid],.big[data-bid]');
  if (!row || !Nav.cur.el.contains(row)) return;
  Hold.row = row; Hold.pid = e.pointerId; Hold.x = e.clientX; Hold.y = e.clientY;
  row.classList.add('press');
  Hold.t = setTimeout(() => {
    const r = Hold.row; Hold.t = 0; Hold.row = null;
    if (!r || G?.mode) return;
    G = null; eatClick = true;
    ctxOpen(r, Hold.pid);
  }, 400);
}
function holdCancel() {
  clearTimeout(Hold.t); Hold.t = 0;
  Hold.row?.classList.remove('press'); Hold.row = null;
}

const Ctx = { box: null };
const rowOf = id => Nav.cur?.el.querySelector(`.task[data-tid="${id}"],.dl[data-tid="${id}"]`);
// a task leaving the list folds away instead of vanishing
function collapseRow(row) {
  if (!row || RM.matches) return Promise.resolve();
  const h = row.offsetHeight;
  return ended(row.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', paddingTop: 0, paddingBottom: 0, opacity: 0, borderWidth: 0 }],
    { duration: 280, easing: EASE, fill: 'forwards' }), 280);
}
const CI = {
  done: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  undo: '<path d="M9 5.5 4.5 10 9 14.5"/><path d="M5 10h9a5 5 0 0 1 0 10h-3"/>',
  edit: '<path d="M4.5 19.5l1-4.5L15.8 4.7a2.1 2.1 0 0 1 3 3L8.5 18z"/><path d="M13.8 6.7l3 3"/>',
  later: '<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  move: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  not: '<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>',
  del: '<path d="M4.5 7h15M10 4h4M6.5 7l1 12.5h9l1-12.5M10.5 11v5M13.5 11v5"/>',
};
function ctxItems(t) {
  const it = (c, label, ico) => `<button type="button" class="ci" data-c="${c}" role="menuitem"><span>${label}</span><svg viewBox="0 0 24 24">${CI[ico]}</svg></button>`;
  const end = t.source?.kind === 'вручную' ? it('del', 'Удалить', 'del') : t.check && t.checkKind !== 'done' ? '' : it('not', 'Не задача', 'not');
  const dn = isDone(t);
  // «каждый день» on Главная: no «На завтра» and no groups, it simply comes back tomorrow
  if (t.daily) return it('done', dn ? 'Не сделано' : 'Сделано', dn ? 'undo' : 'done') + it('edit', 'Изменить', 'edit') + (end ? '<i class="cgap"></i>' + end : '');
  return it('done', t.done ? 'Вернуть в работу' : 'Сделано', t.done ? 'undo' : 'done')
    + it('edit', 'Изменить', 'edit')
    + (t.done ? '' : it('later', t.due === addDays(today(), 1) ? 'На послезавтра' : 'На завтра', 'later'))
    + it('move', `В другую ${t.area === 'study' ? 'тему' : 'группу'}`, 'move')
    + it('prompt', 'Скопировать промпт', 'copy')
    + (end ? '<i class="cgap"></i>' + end : '');
}
function ctxOpen(row, pid) {
  const id = row.dataset.tid || row.dataset.bid, t = Store.task(id);
  row.style.transition = 'none'; row.classList.remove('press');
  if (!t) { row.style.transition = ''; return; }
  const r = row.getBoundingClientRect(), big = row.classList.contains('big');
  row.style.transition = '';
  const box = document.createElement('div');
  box.id = 'ctx';
  box.innerHTML = `<div class="cdim"></div><div class="cprev${big ? '' : ' glass'}"></div><div class="cmenu" role="menu">${ctxItems(t)}</div>`;
  const dim = box.querySelector('.cdim'), prev = box.querySelector('.cprev'), menu = box.querySelector('.cmenu');
  const copy = row.cloneNode(true);
  [copy, ...copy.querySelectorAll('[data-act],[data-go]')].forEach(x => { x.removeAttribute('data-act'); x.removeAttribute('data-go'); });
  copy.classList.remove('pop');
  prev.append(copy);
  Object.assign(prev.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
  document.body.append(box);
  // the task and its menu fit between the clock and the bottom edge; the task moves up when it must
  const ps = getComputedStyle($('#satprobe'));
  const lo = Math.max(parseFloat(ps.paddingTop) || 0, 14) + 8, hi = innerHeight - Math.max(parseFloat(ps.paddingBottom) || 0, 14) - 8, gap = 10;
  const mh = menu.offsetHeight, mw = menu.offsetWidth;
  if (prev.offsetHeight > hi - lo - gap - mh) prev.style.maxHeight = Math.max(60, hi - lo - gap - mh) + 'px';
  const ph = prev.offsetHeight, top = Math.max(lo, Math.min(r.top, hi - ph - gap - mh)), dy = top - r.top;
  const vr = view.getBoundingClientRect(), left = Math.max(vr.left + 12, Math.min(r.left, vr.right - mw - 12));
  Object.assign(menu.style, { left: left + 'px', top: top + ph + gap + 'px', transformOrigin: `${Math.min(mw, r.width) / 2}px 0` });
  row.style.visibility = 'hidden';
  // the list under the finger must not scroll while the finger slides over the menu
  // (held only for this one touch: a standing listener like this would make every scroll wait)
  const main = Nav.cur.el.querySelector('.main'); if (main) main.style.overflowY = 'hidden';
  document.addEventListener('touchmove', noScroll, { passive: false });
  Object.assign(Ctx, { box, dim, prev, menu, row, id, dy, main, pid, slide: true, moved: false, x: Hold.x, y: Hold.y });
  prev.style.transform = `translateY(${dy}px)`;
  const pop = springEase(320, .78), lift = springEase(260, .9);
  dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
  prev.animate([{ transform: 'translateY(0) scale(.97)' }, { transform: `translateY(${dy}px)` }], lift);
  menu.animate([{ transform: 'scale(.25)' }, { transform: 'none' }], pop);
  menu.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'linear' });
}
function ctxClose(then) {
  const c = Ctx.box && { ...Ctx };
  if (!c) return then?.();
  slideEnd(); Ctx.box = null;
  c.box.classList.add('off');
  c.menu.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.5)' }], { duration: 170, easing: 'ease-in', fill: 'forwards' });
  c.dim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease', fill: 'forwards' });
  ended(c.prev.animate([{ transform: `translateY(${c.dy}px)` }, { transform: 'none' }], { duration: 320, easing: EASE, fill: 'forwards' }), 320).then(() => {
    c.row.style.visibility = ''; if (c.main) c.main.style.overflowY = '';
    c.box.remove(); then?.();
  });
}
function ctxPick(c) {
  const t = Store.task(Ctx.id);
  if (!t) return ctxClose();
  // copying needs the finger's own moment: Safari refuses the clipboard a beat later
  if (c === 'prompt') { A.prompt({ dataset: { id: t.id } }); return ctxClose(); }
  ctxClose({
    done: () => { const was = isDone(t); toggleDone(t.id); toast(was ? (t.daily ? 'Отметка снята' : 'Возвращено в работу') : 'Сделано', { label: 'Вернуть', fn: () => toggleDone(t.id) }); },
    edit: () => openEdit(t),
    later: () => { const d = addDays(today(), t.due === addDays(today(), 1) ? 2 : 1); Store.act('task_due', { ref: t.id, due: d, time: t.time }); toast(`Перенесено на ${dayWord(d)}`); },
    move: () => openMove(t),
    not: () => collapseRow(rowOf(t.id)).then(() => { Store.act('task_not', { ref: t.id }); toast('Убрано в «Не стало задачами»'); }),
    del: () => { sh = { del: t.id }; confirmSheet('Удалить задачу?', 'Она исчезнет совсем, в архиве её не будет.', 'Удалить', 'del-ok'); },
  }[c]);
}
document.addEventListener('click', e => {
  if (!Ctx.box || !Ctx.box.contains(e.target)) return;
  const b = e.target.closest('.ci');
  if (b) return ctxPick(b.dataset.c);
  // a tap on the lifted task opens it, a tap anywhere else just closes the menu
  if (e.target.closest('.cprev')) { const id = Ctx.id; return ctxClose(() => go('task/' + id)); }
  ctxClose();
});
// the finger that opened the menu slides over it: the action under it lights up and is picked on release.
// Only after a real slide: the menu may open right under a resting finger, and lifting it must pick nothing.
const noScroll = e => e.preventDefault();
function slideEnd() { Ctx.slide = false; document.removeEventListener('touchmove', noScroll, { passive: false }); }
const ctxAt = e => document.elementFromPoint(e.clientX, e.clientY)?.closest('#ctx .ci');
window.addEventListener('pointermove', e => {
  if (!Ctx.box || !Ctx.slide || e.pointerId !== Ctx.pid) return;
  if (!Ctx.moved && Math.hypot(e.clientX - Ctx.x, e.clientY - Ctx.y) < 10) return;
  Ctx.moved = true;
  const b = ctxAt(e);
  Ctx.menu.querySelectorAll('.ci').forEach(x => x.classList.toggle('hl', x === b));
}, { passive: true });
window.addEventListener('pointerup', e => {
  if (!Ctx.box || !Ctx.slide || e.pointerId !== Ctx.pid) return;
  slideEnd();
  const b = Ctx.moved && ctxAt(e);
  if (b) ctxPick(b.dataset.c);
});
window.addEventListener('pointercancel', e => { if (Ctx.box && e.pointerId === Ctx.pid) { slideEnd(); Ctx.menu.querySelectorAll('.hl').forEach(x => x.classList.remove('hl')); } });

/* ---------- sheet: drag down to close ---------- */
let SG = null;
layer().addEventListener('pointerdown', e => {
  const el = e.target.closest('.sheet');
  if (!el || e.button > 0 || e.target.closest('input,textarea') || el.scrollTop > 0) return;
  SG = { el, y: e.clientY, x: e.clientX, id: e.pointerId, on: false, pts: [] };
});
window.addEventListener('pointermove', e => {
  const s = SG; if (!s || e.pointerId !== s.id) return;
  const dy = e.clientY - s.y, dx = e.clientX - s.x;
  s.pts.push([e.timeStamp, e.clientY]); if (s.pts.length > 6) s.pts.shift();
  if (!s.on) {
    if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
    if (dy <= 0 || Math.abs(dx) > dy) { SG = null; return; }
    s.on = true; eatClick = true; s.y += 8;
    s.el.style.transition = 'none'; layer().querySelector('.dim').style.transition = 'none';
  }
  const y = Math.max(0, e.clientY - s.y);
  s.el.style.transform = `translateY(${y}px)`;
  layer().querySelector('.dim').style.opacity = 1 - Math.min(1, y / s.el.offsetHeight);
  s.dy = y;
}, { passive: true });
function sheetUp(e) {
  const s = SG; if (!s || e.pointerId !== s.id) return;
  SG = null; if (!s.on) return;
  const p = s.pts, v = p.length > 1 ? (p.at(-1)[1] - p[0][1]) / Math.max(1, p.at(-1)[0] - p[0][0]) : 0;
  const dim = layer().querySelector('.dim');
  s.el.style.transition = ''; dim.style.transition = '';
  s.el.style.transform = ''; dim.style.opacity = '';
  if (s.dy > s.el.offsetHeight * .25 || v > .5) closeSheet();
}
window.addEventListener('pointerup', sheetUp);
window.addEventListener('pointercancel', sheetUp);

/* ---------- full screen on iPhone ---------- */
// Home-screen app with the see-through status bar (black-translucent, chosen by Даша 2026-10-11):
// the page starts under the clock, but iPhone ends the window one status bar short of the bottom
// and paints that strip itself (iOS 26). When the missing strip equals the top inset, mark html.short.
function fitScreen() {
  let p = $('#satprobe');
  if (!p) { p = document.createElement('i'); p.id = 'satprobe'; document.body.append(p); }
  const top = parseFloat(getComputedStyle(p).paddingTop) || 0;
  const gap = screen.height - innerHeight;
  const fix = navigator.standalone && top > 0 && Math.abs(gap - top) < 3 ? gap : 0;
  document.documentElement.classList.toggle('short', fix > 0);
}
fitScreen();
addEventListener('resize', fitScreen);

/* ---------- keyboard ---------- */
// iPhone lays the keyboard over the page and slides the page up under the clock. Instead, the screen
// and sheets shrink to the part left above the keyboard: the field and «Добавить» sit right on top of it.
const VV = window.visualViewport;
function fitKeyboard() {
  const open = VV.height < innerHeight - 120 && !!document.activeElement?.matches('input,textarea');
  document.documentElement.classList.toggle('kb', open);
  [view, layer()].forEach(el => {
    el.style.top = open ? VV.offsetTop + 'px' : '';
    el.style.height = open ? VV.height + 'px' : '';
    el.style.bottom = open ? 'auto' : '';
  });
  if (!open && (scrollY || scrollX)) scrollTo(0, 0);
}
if (VV) {
  VV.addEventListener('resize', fitKeyboard);
  VV.addEventListener('scroll', fitKeyboard);
  document.addEventListener('focusout', () => setTimeout(fitKeyboard, 60));
}

/* ---------- start ---------- */
window.addEventListener('hashchange', () => apply());
Store.on(render);
Store.load();
apply();
// minutes and day change: refresh «через 40 мин», greetings, «сегодня»
const idle = () => !document.hidden && !layer().classList.contains('on') && !G && !Ctx.box && !Nav.busy && !Nav.jobs.length;
setInterval(() => { if (idle() && !document.activeElement?.matches('input,textarea')) render(); }, 60000);
document.addEventListener('visibilitychange', () => { if (idle()) render(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
