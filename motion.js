'use strict';
// Oki — motion. Screens slide like on iPhone, tabs page under the finger,
// a task swipes right for «Сделано» and left for actions, a sheet drags down to close.
// Chosen by Даша 2026-10-11.

const RM = matchMedia('(prefers-reduced-motion: reduce)');
const EASE = 'cubic-bezier(.32,.72,0,1)'; // iOS-like: quick start, long soft landing
const TABS = ['home', 'work', 'study', 'personal', 'cal'];
const PH = { home: 'Напишите задачу…', work: AREAS.work.ph, study: AREAS.study.ph, personal: AREAS.personal.ph, cal: 'Встреча, событие или задача…' };
const isTab = n => TABS.includes(n);
const view = $('#view');
const W = () => view.clientWidth;
const BG = '<div class="pbg"><i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i></div>';

// cur: the screen on show; stack: route keys of pushed screens (mirrors browser history)
const Nav = { cur: null, stack: [], intent: null, adopt: null, jobs: [], busy: false };

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
// the dot under the active tab; pos is fractional while a finger pages between tabs
function placeInd(pos, animate) {
  const b = tabBtns(), at = i => [b[i].offsetLeft + b[i].offsetWidth / 2 - 2, b[i].offsetTop + b[i].offsetHeight + 2];
  const i = Math.max(0, Math.min(TABS.length - 1, Math.floor(pos))), f = Math.max(0, Math.min(1, pos - i));
  const p = at(i), q = f ? at(Math.min(i + 1, TABS.length - 1)) : p;
  const ind = dockEl.querySelector('.ind');
  ind.style.transition = animate ? '' : 'none';
  ind.style.transform = `translate(${p[0] + (q[0] - p[0]) * f}px,${p[1]}px)`;
}
new ResizeObserver(() => { view.style.setProperty('--dockh', dockEl.offsetHeight + 'px'); if (Nav.cur) syncDock(Nav.cur.r.name, false); }).observe(dockEl);
document.fonts?.ready.then(() => Nav.cur && syncDock(Nav.cur.r.name, false));

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
function settle(el, r) {
  const m = el.querySelector('.main');
  if (m) {
    m.scrollTop = ui.scroll[r.key] || 0;
    if (r.name === 'cal') { m.addEventListener('scroll', calScroll, { passive: true }); calScroll.call(m); }
  }
  hop(el);
}
function calScroll() {
  const cal = this.querySelector('.cal'), wk = this.querySelector('.wkwrap');
  if (cal && wk) wk.classList.toggle('show', cal.getBoundingClientRect().bottom < this.getBoundingClientRect().top + 90);
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
  if (cur && to.key === cur.key) return;
  if (isTab(to.name)) { Nav.intent = { anim: !cur || isTab(cur.name) ? 'tab' : 'pop', stack: 'reset' }; location.replace(to.key); }
  else { Nav.intent = { anim: 'push', stack: 'push' }; location.hash = to.key; }
}
function back(to) {
  if (Nav.stack.length > 1) { Nav.intent = { anim: 'pop', stack: 'pop' }; history.back(); }
  else { const r = route('#/' + to); Nav.intent = { anim: 'pop', stack: 'reset' }; location.replace(r.key); }
}
function apply() {
  const r = wanted();
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
  Nav.adopt = null;
  if (!el) { Nav.intent = { anim: 'none', stack: 'reset' }; location.replace('#/home'); return; }
  document.body.className = 'r-' + r.name;
  Nav.cur = { r, el };
  syncDock(r.name, how !== 'none');
  if (how === 'adopt') { el.style.transform = ''; dockEl.style.transform = ''; old?.el.remove(); return; }
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
  Swipe.open = null;
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

/* ---------- small tween for finger-driven moves ---------- */
function tween(from, to, dur, fn, done) {
  // hidden page: frames don't come, so land at once instead of hanging mid-move
  if (RM.matches || document.hidden) { fn(to); done?.(); return; }
  const t0 = performance.now(), ease = p => 1 - Math.pow(1 - p, 3);
  const step = now => {
    const p = dur ? Math.min(1, (now - t0) / dur) : 1;
    fn(from + (to - from) * ease(p));
    if (p < 1) requestAnimationFrame(step); else done?.();
  };
  requestAnimationFrame(step);
}
const durFor = (dist, v) => Math.max(180, Math.min(380, Math.abs(dist) / Math.max(Math.abs(v), 1.1)));

/* ---------- task row swipe ---------- */
const Swipe = { open: null };
const ACTW = 3 * 86;
const rowOf = id => Nav.cur?.el.querySelector(`.task[data-tid="${id}"],.dl[data-tid="${id}"]`);
function rowBg(row) {
  const card = row.parentElement, t = Store.task(row.dataset.tid);
  let bg = card.querySelector(':scope>.swbg');
  if (bg && bg.dataset.id === t.id) return bg;
  bg?.remove();
  bg = document.createElement('div');
  bg.className = 'swbg'; bg.dataset.id = t.id;
  bg.style.top = row.offsetTop + 'px'; bg.style.height = row.offsetHeight + 'px';
  const manual = t.source?.kind === 'вручную';
  bg.innerHTML = `<div class="sd"><span><i></i>${t.done ? 'Вернуть' : 'Сделано'}</span></div>
    <div class="sa"><button data-act="sw" data-v="tomorrow" data-id="${t.id}">Завтра</button><button data-act="sw" data-v="move" data-id="${t.id}">Перенести</button>${manual
      ? `<button data-act="sw" data-v="del" data-id="${t.id}">Удалить</button>` : `<button data-act="sw" data-v="not" data-id="${t.id}">Не задача</button>`}</div>`;
  card.prepend(bg);
  return bg;
}
function setRow(row, bg, x) {
  row.style.transform = x ? `translateX(${x}px)` : '';
  bg.firstElementChild.style.width = Math.max(0, x) + 'px';
  bg.lastElementChild.style.width = Math.max(0, -x) + 'px';
}
const rowX = row => new DOMMatrix(getComputedStyle(row).transform).m41 || 0;
function closeRow(then) {
  const o = Swipe.open; Swipe.open = null;
  if (!o) return then?.();
  tween(rowX(o.row), 0, 240, x => setRow(o.row, o.bg, x), () => { o.row.classList.remove('swiping'); o.bg.remove(); then?.(); });
}
function collapseRow(row) {
  Swipe.open = null;
  if (!row) return Promise.resolve();
  const h = row.offsetHeight, bg = row.parentElement.querySelector(':scope>.swbg');
  bg?.remove();
  if (RM.matches) return Promise.resolve();
  const x = rowX(row);
  row.style.transform = '';
  return row.animate([{ height: h + 'px', opacity: 1, transform: `translateX(${x}px)` }, { height: '0px', paddingTop: 0, paddingBottom: 0, opacity: 0, borderWidth: 0, transform: `translateX(${x < 0 ? -W() : x}px)` }],
    { duration: 280, easing: EASE, fill: 'forwards' }).finished;
}
const armAt = () => Math.min(W() * .32, 130);
const SW = {
  row: {
    begin(s) {
      if (Swipe.open && Swipe.open.row !== s.row) closeRow();
      s.base = Swipe.open?.row === s.row ? -ACTW : 0;
      Swipe.open = null;
      s.bg = rowBg(s.row); s.row.classList.add('swiping');
    },
    drag(s, dx) {
      let x = s.base + dx;
      if (x < -ACTW) x = -ACTW + (x + ACTW) * .25;
      setRow(s.row, s.bg, x);
      const armed = x > armAt();
      if (armed !== s.bg.classList.contains('armed')) { s.bg.classList.toggle('armed', armed); if (armed) navigator.vibrate?.(8); }
      s.off = x;
    },
    end(s, v) {
      const { row, bg } = s, x = s.off || 0;
      const reset = then => tween(x, 0, durFor(x, v), y => setRow(row, bg, y), () => { row.classList.remove('swiping'); bg.remove(); then?.(); });
      if (x > 0) return reset(x > armAt() || (v > .6 && x > 40) ? () => toggleDone(row.dataset.tid) : null);
      if (x < -ACTW / 2 || (v < -.4 && x < -30)) { Swipe.open = { row, bg }; tween(x, -ACTW, durFor(x + ACTW, v), y => setRow(row, bg, y)); }
      else reset();
    },
  },
  // page between tabs: the neighbour tab slides in next to the current one
  page: {
    begin(s) { s.i = TABS.indexOf(Nav.cur.r.name); s.nb = {}; },
    drag(s, dx) {
      const w = W(), dir = dx < 0 ? 1 : -1, j = s.i + dir;
      let x = dx;
      if (j < 0 || j >= TABS.length) x = dx * .25;
      else if (!s.nb[dir]) { const r = route('#/' + TABS[j]), el = makePane(r); view.append(el); settle(el, r); s.nb[dir] = { el, r }; }
      const other = s.nb[-dir]; if (other) other.el.style.visibility = 'hidden';
      const n = s.nb[dir]; if (n) { n.el.style.visibility = ''; n.el.style.transform = `translateX(${x + dir * w}px)`; }
      Nav.cur.el.style.transform = `translateX(${x}px)`;
      placeInd(s.i - x / w, false);
      s.off = x; s.dir = dir;
    },
    end(s, v) {
      const w = W(), x = s.off || 0, n = s.nb[s.dir], cur = Nav.cur;
      const go = n && (Math.abs(x) > w * .28 || (Math.abs(v) > .35 && Math.sign(v) === Math.sign(x)));
      const to = go ? -s.dir * w : 0;
      const move = y => { cur.el.style.transform = `translateX(${y}px)`; if (n) n.el.style.transform = `translateX(${y + s.dir * w}px)`; placeInd(s.i - y / w, false); };
      if (go) document.body.className = 'r-' + n.r.name;
      Nav.busy = true;
      tween(x, to, durFor(to - x, v), move, () => {
        Nav.busy = false;
        Object.values(s.nb).forEach(o => { if (!go || o !== n) o.el.remove(); });
        if (!go) { cur.el.style.transform = ''; return; }
        saveScroll(cur);
        Nav.adopt = n.el; Nav.intent = { anim: 'adopt', stack: 'reset' };
        location.replace(n.r.key);
      });
    },
  },
  // swipe right on a pushed screen: go back, the previous screen follows the finger
  back: {
    begin(s) {
      const key = Nav.stack.length > 1 ? Nav.stack.at(-2) : '#/' + Nav.cur.el.querySelector('.back[data-to]').dataset.to;
      const r = route(key), el = makePane(r);
      Nav.cur.el.before(el); settle(el, r);
      s.under = { el, r, tab: isTab(r.name) };
      if (s.under.tab) syncDock(r.name, false);
    },
    drag(s, dx) {
      const w = W(), x = Math.max(0, dx), u = `translateX(${-w * .3 * (1 - x / w)}px)`;
      Nav.cur.el.style.transform = `translateX(${x}px)`;
      s.under.el.style.transform = u;
      if (s.under.tab) dockEl.style.transform = u;
      s.off = x;
    },
    end(s, v) {
      const w = W(), x = s.off || 0, cur = Nav.cur, u = s.under;
      const go = x > w * .35 || (v > .4 && x > 30);
      const move = y => {
        cur.el.style.transform = `translateX(${y}px)`;
        const t = `translateX(${-w * .3 * (1 - y / w)}px)`;
        u.el.style.transform = t; if (u.tab) dockEl.style.transform = t;
      };
      if (go) document.body.className = 'r-' + u.r.name;
      Nav.busy = true;
      tween(x, go ? w : 0, durFor((go ? w : 0) - x, v), move, () => {
        Nav.busy = false;
        if (!go) { u.el.remove(); cur.el.style.transform = ''; dockEl.style.transform = ''; syncDock(cur.r.name, false); return; }
        Nav.adopt = u.el;
        if (Nav.stack.length > 1) { Nav.intent = { anim: 'adopt', stack: 'pop' }; history.back(); }
        else { Nav.intent = { anim: 'adopt', stack: 'reset' }; location.replace(u.r.key); }
      });
    },
  },
};

/* ---------- pointer tracking ---------- */
let G = null, eatClick = false;
view.addEventListener('pointerdown', e => {
  eatClick = false;
  G = null; // a lost release must never block the next touch
  if (e.button > 0 || !e.isPrimary || Nav.busy) return;
  const t = e.target;
  if (t.closest('.swbg')) return;
  // a tap anywhere closes an open row, like on iPhone
  if (Swipe.open) { closeRow(); eatClick = true; return; }
  if (t.closest('input,textarea,select,.chips,.mic')) return;
  if (!Nav.cur || !(Nav.cur.el.contains(t) || dockEl.contains(t))) return;
  finishJobs();
  G = { x: e.clientX, y: e.clientY, id: e.pointerId, row: t.closest('.task[data-tid],.dl[data-tid]'), mode: null, pts: [] };
});
window.addEventListener('pointermove', e => {
  const s = G; if (!s || e.pointerId !== s.id) return;
  const dx = e.clientX - s.x, dy = e.clientY - s.y;
  s.pts.push([e.timeStamp, e.clientX]); if (s.pts.length > 6) s.pts.shift();
  if (!s.mode) {
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.2) { G = null; return; }
    const full = !isTab(Nav.cur.r.name);
    if (full) {
      const canBack = Nav.stack.length > 1 || Nav.cur.el.querySelector('.back[data-to]');
      if (dx < 0 || !canBack) { G = null; return; }
      s.mode = 'back';
    } else s.mode = s.row && Nav.cur.el.contains(s.row) ? 'row' : 'page';
    s.x += Math.sign(dx) * 10; // start from the finger, without a jump
    eatClick = true;
    SW[s.mode].begin(s);
  }
  SW[s.mode].drag(s, e.clientX - s.x);
}, { passive: true });
function release(e, cancel) {
  const s = G; if (!s || e.pointerId !== s.id) return;
  G = null;
  if (!s.mode) return;
  const p = s.pts, a = p[0], b = p.at(-1);
  const v = !cancel && p.length > 1 && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
  SW[s.mode].end(s, v);
}
window.addEventListener('pointerup', e => release(e, false));
window.addEventListener('pointercancel', e => release(e, true));
document.addEventListener('click', e => { if (eatClick) { eatClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
// iOS shows :active press states only when the page listens to touches
document.addEventListener('touchstart', () => {}, { passive: true });

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

/* ---------- start ---------- */
window.addEventListener('hashchange', apply);
Store.on(render);
Store.load();
apply();
// minutes and day change: refresh «через 40 мин», greetings, «сегодня»
const idle = () => !document.hidden && !layer().classList.contains('on') && !G && !Swipe.open && !Nav.busy && !Nav.jobs.length;
setInterval(() => { if (idle() && !document.activeElement?.matches('input,textarea')) render(); }, 60000);
document.addEventListener('visibilitychange', () => { if (idle()) render(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
