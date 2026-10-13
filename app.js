'use strict';
// Oki — screens. Built 1:1 from design/04-style/final.html (approved 2026-10-11).

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = () => Store.s;

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
const diff = (a, b) => Math.round((pd(a) - pd(b)) / 864e5);
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const mins = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const WDF = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONN = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const plural = (n, f) => f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];
const N = (n, f) => `${n} ${plural(n, f)}`;
const short = s => { const d = pd(s); return `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`; };
const dayMon = s => { const d = pd(s); return `${d.getDate()} ${MON[d.getMonth()]}`; };
const long = s => { const d = pd(s); return `${WDF[d.getDay()]}, ${d.getDate()} ${MONG[d.getMonth()]}`; };
function dayWord(s) {
  const n = diff(s, today());
  if (n === 0) return 'сегодня'; if (n === 1) return 'завтра'; if (n === -1) return 'вчера'; if (n === 2) return 'послезавтра';
  return short(s);
}
const dueText = t => t.due ? dayWord(t.due) + (t.time ? `, ${t.time}` : '') : 'без срока';
function inDays(s) {
  const n = diff(s, today());
  if (n === 0) return 'сегодня'; if (n === 1) return 'завтра';
  if (n > 0) return `через ${N(n, ['день', 'дня', 'дней'])}`;
  return n === -1 ? 'срок был вчера' : `срок был ${N(-n, ['день', 'дня', 'дней'])} назад`;
}
function weekStart(s) { const d = pd(s); return addDays(s, -((d.getDay() + 6) % 7)); }

/* ---------- words ---------- */
const AREAS = {
  work: { name: 'Работа', low: 'работа', by: 'по работе', ph: 'Задача в «Работу»…', grp: 'Группа' },
  study: { name: 'Учёба', low: 'учёба', by: 'по учёбе', ph: 'Задача в «Учёбу»…', grp: 'Предмет' },
  personal: { name: 'Личное', low: 'личное', by: 'по личным делам', ph: 'Задача в «Личное»…' },
};
const KIN = ['мама', 'папа', 'бабушка', 'дедушка', 'брат', 'сестра', 'бухгалтер'];
// «от Ани», «от Марка», «от мамы» — simple genitive for names and roles
function gen(name) {
  return String(name).split(' ').map(w => {
    let r = w;
    if (/[гкхжшщч]а$/i.test(w)) r = w.slice(0, -1) + 'и';
    else if (/а$/i.test(w)) r = w.slice(0, -1) + 'ы';
    else if (/я$/i.test(w)) r = w.slice(0, -1) + 'и';
    else if (/[йь]$/i.test(w)) r = w.slice(0, -1) + 'я';
    else if (/[бвгджзклмнпрстфхцчшщ]$/i.test(w)) r = w + 'а';
    return KIN.includes(w.toLowerCase()) ? r.toLowerCase() : r;
  }).join(' ');
}
const srcWord = k => k === 'заметки' ? 'из заметок' : k === 'вручную' ? '' : k;
const srcAll = t => [t.source, ...(t.sources || [])].filter(Boolean);
const srcWords = t => [...new Set(srcAll(t).map(s => srcWord(s.kind)).filter(Boolean))].join(' · ');

/* ---------- rabbit (moods: ears + eyes + glow together) ---------- */
const MOOD = {
  happy: { l: 10, r: -12, fill: 'aFillWarm', aura: '#D2A6F0', ao: 1 },
  calm: { l: 0, r: 0, fill: 'aFill', aura: '#A9AEF0', ao: .85 },
  sad: { l: -88, r: 88, fill: 'aFillGrey', aura: '#B4B8C4', ao: .45 },
};
function RABBIT(mood = 'calm', cls = '', float = false) {
  const m = MOOD[mood];
  const shapes = `<g transform="rotate(${m.l} 84 116)"><ellipse cx="74" cy="66" rx="17" ry="56" transform="rotate(-14 74 66)"/></g>
    <g transform="rotate(${m.r} 120 118)"><ellipse cx="128" cy="70" rx="17" ry="54" transform="rotate(18 128 70)"/></g>
    <ellipse cx="100" cy="140" rx="56" ry="46"/><ellipse cx="100" cy="206" rx="46" ry="40"/>`;
  const eyes = mood === 'happy'
    ? `<g fill="none" stroke="#111317" stroke-width="4.5" stroke-linecap="round"><path d="M72 146 Q80 133 88 146"/><path d="M112 146 Q120 133 128 146"/></g>`
    : mood === 'sad'
      ? `<g class="eyes" fill="#111317"><ellipse cx="81" cy="149" rx="5" ry="7"/><ellipse cx="119" cy="149" rx="5" ry="7"/></g>`
      : `<g class="eyes" fill="#111317"><ellipse cx="80" cy="140" rx="5.5" ry="9"/><ellipse cx="120" cy="140" rx="5.5" ry="9"/></g>`;
  const body = `<g class="au" fill="${m.aura}" filter="url(#aura)" opacity="${m.ao}">${shapes}</g><g fill="url(#${m.fill})" filter="url(#soft)">${shapes}</g>${eyes}`;
  return `<svg class="${cls}" viewBox="-30 -10 260 290" aria-hidden="true">${float ? `<g class="float">${body}</g>` : body}</svg>`;
}

/* ---------- icons ---------- */
const MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>';
const COPY = '<svg class="copy" viewBox="0 0 16 16"><rect x="5" y="5" width="9" height="9" rx="2"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>';
const DOC = '<svg viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13M6.5 8.5h4M6.5 11h4"/></svg>';
const DOTS = '<svg class="dt" viewBox="0 0 18 4"><circle cx="2" cy="2" r="1.7"/><circle cx="9" cy="2" r="1.7"/><circle cx="16" cy="2" r="1.7"/></svg>';
const LOUPE = '<svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="6"/><path d="M13.5 13.5 18 18"/></svg>';
const BELL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
function RING(p) {
  const r = 12, L = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 28 28"><circle cx="14" cy="14" r="${r}" stroke="rgba(17,19,23,.14)"/><circle cx="14" cy="14" r="${r}" stroke="#111317" stroke-dasharray="${(L * p).toFixed(1)} ${L.toFixed(1)}" stroke-linecap="round" transform="rotate(-90 14 14)"/></svg>`;
}

/* ---------- selectors ---------- */
// «каждый день» tasks live only on Главная: lists, calendar and reports don't see them
const live = () => S().tasks.filter(t => !t.notTask && !t.daily);
const dailyList = () => S().tasks.filter(t => t.daily && !t.notTask && (t.start || '') <= today())
  .sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.title.localeCompare(b.title, 'ru'));
const doneOn = (t, d) => (t.days || []).includes(d);
const isDone = t => t.daily ? doneOn(t, today()) : !!t.done;
// yesterday was a «каждый день» day, it was not ticked, and today isn't ticked yet
const missed = t => t.daily && (t.start || '') < today() && !doneOn(t, addDays(today(), -1)) && !doneOn(t, today());
const open = () => live().filter(t => !t.done);
const overdue = t => !t.done && t.due && t.due < today();
const dueToday = t => !t.done && t.due && t.due <= today();
// done tasks stay in lists until the end of the next day, then live in the archive
const shown = t => !t.notTask && !t.daily && (!t.done || (t.doneAt && diff(today(), t.doneAt) <= 1));
const doneToday = () => live().filter(t => t.done && t.doneAt && t.doneAt.slice(0, 10) === today()).length;
function mood(list, sadAt) {
  const late = list.filter(overdue).length;
  if (late >= sadAt) return 'sad';
  if (doneToday() >= 3) return 'happy';
  return 'calm';
}
const dayEvents = d => S().events.filter(e => e.date === d).sort((a, b) => a.start.localeCompare(b.start));
function clashes(list) {
  const c = new Set();
  list.forEach(a => list.forEach(b => { if (a !== b && a.start < b.end && b.start < a.end) { c.add(a.id); c.add(b.id); } }));
  return c;
}

/* ---------- ui state ---------- */
const ui = { chip: { work: 'all', study: 'all' }, open: {}, cal: today(), month: today().slice(0, 7), q: '', arch: 'all', per: 'week', scroll: {} };

/* ---------- pieces ---------- */
const grp = (n, c, cls = '') => `<div class="grp ${cls}">${esc(n)}<span>${c}</span></div>`;
// tab icons (variant 2, Даша 2026-10-12): rabbit, briefcase, book, heart, calendar in a floating glass capsule
const TABI = {
  home: '<ellipse cx="9" cy="7" rx="2.2" ry="5" transform="rotate(-12 9 7)"/><ellipse cx="15" cy="7" rx="2.2" ry="5" transform="rotate(12 15 7)"/><circle cx="12" cy="15.5" r="5.5"/>',
  work: '<rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3 12.5h18"/>',
  study: '<path d="M12 6.8C10 5.3 7 4.8 3.5 5.3v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5v-13c-3.5-.5-6.5 0-8.5 1.5zM12 6.8v13"/>',
  personal: '<path d="M12 19.5s-7.5-4.4-7.5-9.8A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.3c0 5.4-7.5 9.8-7.5 9.8z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
};
const tabs = cur => `<nav class="tabs glass"><i class="ind"></i>${[['home', 'Главная'], ['work', 'Работа'], ['study', 'Учёба'], ['personal', 'Личное'], ['cal', 'Календарь']]
  .map(([k, n]) => `<button type="button" data-go="${k}" class="${k === cur ? 'on' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true">${TABI[k]}</svg>${n}</button>`).join('')}</nav>`;
const dock = (cur, ph) => `<div class="dock"><form class="inp" data-submit="quick">
  <label class="field glass"><input name="q" placeholder="${ph}" autocomplete="off" enterkeyhint="done"></label>
  <button type="button" class="mic" data-act="mic" aria-label="Голосом">${MIC}</button></form>${tabs(cur)}</div>`;

function meta(t, o = {}) {
  const p = [];
  if (t.check) p.push(`<span class="q">${t.checkKind === 'done' ? (t.checkHow === 'cancel' ? 'уже не нужно?' : 'уже сделано?') : 'проверьте'}</span>`);
  if (t.done) p.push(t.doneAt ? `сделано ${dayWord(t.doneAt)}` : 'сделано');
  else if (overdue(t)) p.push(`<span class="ov">срок был ${dayWord(t.due)}</span>`);
  else if (t.due === today()) p.push(`<span class="now">${dueText(t)}</span>`);
  else p.push(dueText(t));
  if (o.group && t.group) p.push(esc(t.group));
  if (o.area) p.push(AREAS[t.area].low);
  if (t.from) p.push('от ' + esc(gen(t.from)));
  const s = srcWords(t); if (s && !o.noSrc) p.push(s);
  // status (glowing «сегодня», «срок был…») stands alone, the rest reads «от Ани · почта»
  const lead = p.filter(x => x.startsWith('<')), rest = p.filter(x => !x.startsWith('<'));
  return lead.join('') + (rest.length ? `<span>${rest.join(' · ')}</span>` : '');
}
function subLine(t) {
  const n = t.items.length; if (!n) return '';
  const k = t.items.filter(i => i.done).length;
  if (!ui.open[t.id]) return `<div class="sub" data-act="fold" data-id="${t.id}">${k} из ${n} ${n % 10 === 1 && n % 100 !== 11 ? 'пункта' : 'пунктов'}</div>`;
  return `<div class="subs"><div class="cnt" data-act="fold" data-id="${t.id}">${k} из ${n}</div>${t.items.map((it, i) =>
    `<div class="si${it.done ? ' ok' : ''}" data-act="item" data-id="${t.id}" data-i="${i}"><i></i>${esc(it.t)}</div>`).join('')}</div>`;
}
const taskRow = (t, o) => `<div class="task${t.done ? ' done' : ''}" data-go="task/${t.id}" data-tid="${t.id}"><span class="ck" data-act="done" data-id="${t.id}" role="checkbox" aria-checked="${!!t.done}"></span>
  <div class="body"><div class="t">${esc(t.title)}</div><div class="m">${meta(t, o)}</div>${subLine(t)}</div></div>`;
function bigCard(t) {
  const n = t.items.length || 1, k = t.items.filter(i => i.done).length, next = t.items.find(i => !i.done);
  const m = [t.due ? (overdue(t) ? `<span class="ov">срок был ${dayWord(t.due)}</span>` : `<span>${short(t.due)} · ${inDays(t.due)}</span>`) : '<span>без срока</span>'];
  if (t.from) m.push(`<span>от ${esc(gen(t.from))}</span>`);
  return `<div class="big glass" data-go="task/${t.id}" data-bid="${t.id}"><div class="r1">${RING(k / n)}<div><div class="t">${esc(t.title)}</div><div class="m">${m.join('')}</div></div></div>
    <div class="ft"><span>${next ? `Дальше: <b>${esc(next.t)}</b>` : t.done ? 'Сделано' : 'Все пункты готовы'}</span><span>${k} из ${t.items.length}</span></div></div>`;
}
const sortTasks = l => l.slice().sort((a, b) => (a.done - b.done) || ((a.due || '9') + (a.time || '99')).localeCompare((b.due || '9') + (b.time || '99')));
function groupBlock(name, list, o = {}) {
  const bigs = list.filter(t => t.big && !t.done), rest = sortTasks(list.filter(t => !(t.big && !t.done)));
  return grp(name, list.filter(t => !t.done).length || '', o.cls) + bigs.map(bigCard).join('<div class="gap"></div>')
    + (bigs.length && rest.length ? '<div class="gap"></div>' : '') + (rest.length ? `<div class="card glass">${rest.map(t => taskRow(t, o)).join('')}</div>` : '');
}

/* ---------- screens ---------- */
const SCREENS = {};

SCREENS.onboard = () => `<div class="onb">
  <span class="logo" style="font-size:34px">Oki</span>
  <div class="rb">${RABBIT('calm', '', true)}</div>
  <h1>Здравствуйте, ${esc(S().settings.name)}.<br>Я Oki.</h1>
  <p>Собираю Ваши задачи из сообщений и записей. Вам останется только отмечать сделанное.</p>
  <div class="bt"><button class="btn-main" data-act="onb-bell">${BELL}Разрешить уведомления</button><button class="btn-ghost" style="margin-top:8px" data-act="onb-later">Позже</button></div>
</div>`;

SCREENS.home = () => {
  const t = today(), o = open();
  const cnt = a => o.filter(x => x.area === a && dueToday(x)).length;
  const c = { work: cnt('work'), study: cnt('study'), personal: cnt('personal') };
  const parts = Object.keys(c).filter(k => c[k]).map(k => [c[k], AREAS[k].by]);
  let line = 'На сегодня задач нет.';
  if (parts.length) {
    const s = parts.map(([n, by], i) => i === 0 ? `${N(n, ['задача', 'задачи', 'задач'])} ${by}` : `${n} ${by}`);
    line = 'У Вас ' + (s.length > 1 ? s.slice(0, -1).join(', ') + ' и ' + s.at(-1) : s[0]) + '.';
  }
  const h = new Date().getHours();
  const hi = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const name = esc(S().settings.name);
  const saved = S().savedAt ? S().savedAt.slice(11, 16) : '';
  if (tgState().bad) return `<div class="top"><div class="hhd"><span class="logo" style="font-size:26px;letter-spacing:-.04em">Oki</span>
      <span class="r"><button class="menu glass" data-go="more" aria-label="Ещё"><i></i></button></span></div></div>
    <div class="home-main"><div class="stage">${RABBIT('sad', '', true)}</div>
      <div class="broke"><h1>Telegram отключился</h1><p>${Sync.tg.status.ok_at ? `С ${hmWhen(Sync.tg.status.ok_at)} я` : 'Я'} не вижу новые сообщения, задачи из чатов не приходят. Почта работает.</p>
      <button class="btn-main" data-go="tg">Войти заново</button></div></div>`;
  return `<div class="top"><div class="hhd"><span class="logo" style="font-size:26px;letter-spacing:-.04em">Oki</span>
      <span class="r">${saved ? `<span class="st"><i></i>сохранено ${saved}</span>` : ''}<button class="menu glass" data-go="more" aria-label="Ещё"><i></i></button></span></div></div>
    <div class="home-main">
      <div class="stage">${RABBIT(mood(live(), 2), '', true)}</div>
      <div class="greet"><h1>${hi},<br><span class="g" data-t="${name}">${name}</span></h1><p>${line}</p></div>
      <div class="hchips">${['work', 'study', 'personal'].map(a => `<div class="chip glass" data-go="${a}">${AREAS[a].low} <span>${c[a] || '—'}</span></div>`).join('')}</div>
      ${dailyCard()}${nearCard()}
    </div>`;
};
// variant В (Даша 2026-10-12): what repeats every day sits on Главная, ticked right here
function dailyCard() {
  const l = dailyList(); if (!l.length) return '';
  const row = t => { const dn = doneOn(t, today()), m = [missed(t) ? '<span class="ov">вчера пропущено</span>' : '', t.time ? `<span>${t.time}</span>` : ''].join('');
    return `<div class="task${dn ? ' done' : ''}" data-go="task/${t.id}" data-tid="${t.id}"><span class="ck" data-act="done" data-id="${t.id}" role="checkbox" aria-checked="${dn}"></span>
      <div class="body"><div class="t">${esc(t.title)}</div>${m ? `<div class="m">${m}</div>` : ''}</div></div>`; };
  return `<div class="daily glass"><div class="r"><span>Каждый день</span><span>${l.filter(t => doneOn(t, today())).length} из ${l.length}</span></div>${l.map(row).join('')}</div>`;
}
function nearCard() {
  const t = today(), now = nowHM();
  const evs = [...dayEvents(t).filter(e => e.end > now), ...dayEvents(addDays(t, 1))];
  const e = evs[0];
  if (e) {
    const sameDay = dayEvents(e.date), cl = sameDay.find(x => x !== e && x.start < e.end && e.start < x.end);
    let when;
    if (e.date !== t) when = 'завтра';
    else if (e.start <= now) when = 'идёт сейчас';
    else { const m = mins(e.start) - mins(now); when = m < 60 ? `через ${m} мин` : `через ${N(Math.round(m / 60), ['час', 'часа', 'часов'])}`; }
    return `<div class="near glass" data-act="near" data-d="${e.date}"><div class="r"><span>Ближайшее</span><span>${when}</span></div>
      <h2>${esc(e.title)}</h2><div class="s">${e.start}–${e.end} · ${esc(e.group || AREAS[e.area]?.low || '')}</div>
      ${cl ? `<div class="warn"><i></i>накладка: в ${cl.start} ещё «${esc(cl.title)}»</div>` : ''}</div>`;
  }
  const d = sortTasks(open().filter(x => x.due && x.due >= t))[0];
  if (!d) return '';
  return `<div class="near glass" data-go="task/${d.id}"><div class="r"><span>Ближайший срок</span><span>${dueText(d)}</span></div>
    <h2>${esc(d.title)}</h2><div class="s">${esc(d.group || AREAS[d.area].low)}</div></div>`;
}

function areaScreen(area) {
  const A = AREAS[area];
  const all = S().tasks.filter(t => t.area === area && shown(t));
  const op = all.filter(t => !t.done);
  const late = op.filter(overdue);
  const tdy = op.filter(t => t.due === today());
  const now = nowHM();
  const hot = tdy.filter(t => t.time && t.time > now && mins(t.time) - mins(now) <= 360).length;
  let say = [];
  if (late.length) say.push(`${late.length} ${plural(late.length, ['просрочена', 'просрочены', 'просрочено'])}`);
  if (tdy.length) say.push(`${tdy.length} сегодня`);
  if (hot) say.push(hot === 1 ? 'одна горит' : `${hot} горят`);
  if (!say.length) { const nx = sortTasks(op.filter(t => t.due))[0]; say.push(nx ? `Ближайший срок — ${dueText(nx)}` : op.length ? 'Сроков нет' : 'Всё сделано'); }
  say = say.join(', ').replace(/^./, c => c.toUpperCase()) + '.';

  let body = '', chips = '';
  if (area === 'personal') {
    const lateL = all.filter(overdue);
    const b = { 'Сегодня': [], 'На неделе': [], 'Позже': [], 'Без срока': [] };
    all.filter(t => !overdue(t)).forEach(t => {
      const d = t.done ? today() : t.due;
      if (!d) b['Без срока'].push(t); else { const n = diff(d, today()); b[n <= 0 ? 'Сегодня' : n <= 7 ? 'На неделе' : 'Позже'].push(t); }
    });
    if (lateL.length) body += groupBlock('Просрочено', lateL, { cls: 'late' });
    Object.entries(b).forEach(([k, l]) => { if (l.length) body += groupBlock(k, l); });
  } else {
    const groups = {};
    all.forEach(t => (groups[t.group || 'Новые'] ||= []).push(t));
    const key = l => l.filter(t => !t.done && t.due).map(t => t.due).sort()[0] || '9';
    const names = Object.keys(groups).sort((a, b) => key(groups[a]).localeCompare(key(groups[b])) || a.localeCompare(b, 'ru'));
    let sel = ui.chip[area]; if (sel !== 'all' && !groups[sel]) sel = ui.chip[area] = 'all';
    chips = `<div class="chips"><div class="chip ${sel === 'all' ? 'on' : 'glass'}" data-act="chip" data-a="${area}" data-v="all">Все <span>${op.length}</span></div>${names.map(n =>
      `<div class="chip ${sel === n ? 'on' : 'glass'}" data-act="chip" data-a="${area}" data-v="${esc(n)}">${esc(n)} <span>${groups[n].filter(t => !t.done).length}</span></div>`).join('')}</div>`;
    const pick = l => sel === 'all' ? l : l.filter(t => (t.group || 'Новые') === sel);
    const lateL = pick(all.filter(overdue));
    if (lateL.length) body += groupBlock('Просрочено', lateL, { cls: 'late', group: true });
    names.filter(n => sel === 'all' || n === sel).forEach(n => {
      const l = groups[n].filter(t => !overdue(t)); if (l.length) body += groupBlock(n, l);
    });
  }
  if (!body) body = `<div class="empty">Здесь пока пусто. Напишите задачу внизу — она появится здесь.</div>`;
  // the header scrolls away with the list (variant Б, Даша 2026-10-12); «Отчёт» is a round icon by the rabbit
  const rep = area === 'work' ? `<button class="repi glass" data-go="report/work" aria-label="Отчёт">${DOC}</button>` : '';
  return `<div class="main lst"><div class="hd"><h1>${A.name}</h1><span class="hdr">${rep}${RABBIT(mood(all, 1), 'bun')}</span></div>
      ${chips}<div class="lgap"></div>${body}</div>`;
}
SCREENS.work = () => areaScreen('work');
SCREENS.study = () => areaScreen('study');
SCREENS.personal = () => areaScreen('personal');

SCREENS.cal = () => {
  const sel = ui.cal, t = today();
  const [y, m] = ui.month.split('-').map(Number);
  const first = new Date(y, m - 1, 1), off = (first.getDay() + 6) % 7, len = new Date(y, m, 0).getDate();
  const has = new Set([...S().events.map(e => e.date), ...open().filter(x => x.due).map(x => x.due)]);
  let g = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(w => `<div class="wd">${w}</div>`).join('');
  for (let i = 0; i < off; i++) g += '<div class="d off">·</div>';
  for (let d = 1; d <= len; d++) {
    const s = `${y}-${pad(m)}-${pad(d)}`, wd = (off + d - 1) % 7;
    const c = ['d']; if (wd >= 5) c.push('we'); if (has.has(s)) c.push('has'); if (s === t) c.push('td'); if (s === sel) c.push('sel');
    g += `<div class="${c.join(' ')}" data-act="day" data-d="${s}">${d}</div>`;
  }
  const ws = weekStart(sel);
  const wk = [0, 1, 2, 3, 4, 5, 6].map(i => { const s = addDays(ws, i), d = pd(s); return `<div class="${s === sel ? 'on' : 'glass'}" data-act="day" data-d="${s}">${d.getDate()}<small>${WD[d.getDay()]}</small></div>`; }).join('');

  const evs = dayEvents(sel), cl = clashes(evs);
  const tasks = sortTasks(live().filter(x => x.due === sel && (!x.done || shown(x))));
  const row = e => `<div class="mt${cl.has(e.id) ? ' clash' : ''}" data-act="event" data-id="${e.id}"><div class="tm">${e.start}<small>до ${e.end}</small></div>
    <div><div class="t">${esc(e.title)}</div><div class="m"><span>${[AREAS[e.area]?.low, e.group, e.with].filter(Boolean).map(esc).join(' · ')}</span></div>${cl.has(e.id) ? '<div class="clashnote">накладка</div>' : ''}</div></div>`;
  const meets = evs.filter(e => e.kind === 'meeting'), events = evs.filter(e => e.kind !== 'meeting');
  let list = '';
  if (meets.length) list += `<div class="agh">Встречи<span>${meets.length}</span></div><div class="card glass">${meets.map(row).join('')}</div>`;
  if (events.length) list += `<div class="agh">Мероприятия<span>${events.length}</span></div><div class="card glass">${events.map(row).join('')}</div>`;
  if (tasks.length) list += `<div class="agh">Задачи<span>${tasks.filter(x => !x.done).length}</span></div><div class="card glass">${tasks.map(x =>
    `<div class="dl${x.done ? ' done' : ''}" data-go="task/${x.id}" data-tid="${x.id}"><span class="ck" data-act="done" data-id="${x.id}"></span><div><div class="t">${esc(x.title)}</div><div class="m">${meta(x, { area: true, noSrc: true })}</div></div></div>`).join('')}</div>`;
  if (!list) list = '<div class="empty">В этот день ничего не запланировано.</div>';

  const n = evs.length + tasks.filter(x => !x.done).length;
  const firstClash = evs.find(e => cl.has(e.id));
  const dayName = sel === t ? 'Сегодня' : sel === addDays(t, 1) ? 'Завтра' : `${pd(sel).getDate()} ${MONG[pd(sel).getMonth()]}`;
  const say = n ? `${dayName} ${N(n, ['дело', 'дела', 'дел'])}.${firstClash ? ` Есть накладка в ${firstClash.start}.` : ''}` : `${dayName} свободно.`;
  return `<div class="main lst" data-cal><div class="hd"><h1>${MONN[m - 1]}</h1>${RABBIT('calm', 'bun')}</div>
      <div class="wkwrap"><div class="wk">${wk}</div></div>
      <div class="cal glass"><div class="mh">${y}<span class="nav"><button data-act="month" data-v="-1" aria-label="Назад">‹</button><button data-act="month" data-v="1" aria-label="Вперёд">›</button></span></div><div class="g">${g}</div></div>
      ${list}
    </div>`;
};

SCREENS.task = r => {
  const t = Store.task(r.id);
  if (!t) return null;
  const A = AREAS[t.area];
  const n = t.items.length, k = t.items.filter(i => i.done).length, next = t.items.find(i => !i.done);
  // variant Б (Даша 2026-10-12): the round check sits by the title, rare actions live in «…»
  const dn = isDone(t);
  const lbl = t.daily ? ['Каждый день', missed(t) ? 'вчера пропущено' : ''].filter(Boolean).join(' · ')
    : [t.group || A.name, t.done && t.doneAt ? `сделано ${dayWord(t.doneAt)}` : ''].filter(Boolean).map(esc).join(' · ');
  const ring = t.big ? `<div class="rg"><span>${RING(n ? k / n : 0)}${next ? 'Дальше: ' + esc(next.t) : 'Все пункты готовы'}</span><span>${k} из ${n}</span></div>` : '';
  const check = !t.check ? '' : t.checkKind === 'done' ? `<div class="check"><b>${t.checkHow === 'cancel' ? 'Похоже, уже не нужно' : 'Похоже, уже сделано'}</b><p>${esc((t.checkWhy || '').replace(/^Похоже[^:]*:\s*/, 'В переписке: '))}</p>
    <div class="acts"><button class="pill w" data-act="shut" data-id="${t.id}">Закрыть задачу</button><button class="pill" data-act="confirm" data-id="${t.id}">Ещё нет</button></div></div><div class="gap"></div><div class="gap"></div>`
    : `<div class="check"><b>Проверьте</b><p>${esc(t.checkWhy || 'Сомневаюсь, что это задача.')}</p>
    <div class="acts"><button class="pill w" data-act="confirm" data-id="${t.id}">Да, задача</button><button class="pill" data-act="not" data-id="${t.id}">Не задача</button></div></div><div class="gap"></div><div class="gap"></div>`;
  const src = t.source || {};
  const when = t.daily ? `<div class="row2"><span>Повторяется</span><span class="v">каждый день${t.start > today() ? ', с ' + dayMon(t.start) : ''}</span></div>
    <div class="row2 chev"><span>Время</span><span class="v">${t.time || 'не указано'}</span><input class="over" type="time" value="${t.time || ''}" data-change="time" data-id="${t.id}" aria-label="Время"></div>`
    : `<div class="row2 chev"><span>Срок</span><span class="v">${t.due ? short(t.due) + (t.done ? '' : ' · ' + inDays(t.due)) : '<span class="pill dark">Поставить срок</span>'}</span>
      <input class="over" type="date" value="${t.due || ''}" data-change="due" data-id="${t.id}" aria-label="Срок"></div>
    ${t.due ? `<div class="row2 chev"><span>Время</span><span class="v">${t.time || 'не указано'}</span><input class="over" type="time" value="${t.time || ''}" data-change="time" data-id="${t.id}" aria-label="Время"></div>` : ''}`;
  const info = `<div class="card glass">${when}
    ${t.from ? `<div class="row2"><span>От кого</span><span class="v">${esc(t.from)}</span></div>` : ''}
    ${srcAll(t).map((src, i) => `<div class="row2"${src.quote ? ' style="border:0"' : ''}><span>${i ? '' : 'Откуда'}</span><span class="v">${src.kind === 'вручную' ? 'добавлено вручную' : esc(src.kind)}${src.chat && src.chat !== 'Избранное' ? ' · ' + esc(src.chat) : src.chat ? ', «Избранное»' : ''}${src.date ? ', ' + dayMon(src.date) : ''}</span></div>
    ${src.quote ? `<div class="quote">«${esc(src.quote)}»</div>` : ''}`).join('')}</div>`;
  const nudge = !t.due && !t.done && !t.daily ? '<div class="ws" style="padding:8px 4px 0">Срока нет — без него напоминаний не будет.</div>' : '';
  const chk = `<div class="chk glass"><div class="subs">${n ? `<div class="cnt">${k} из ${n}</div>` : ''}${t.items.map((it, i) =>
    `<div class="si${it.done ? ' ok' : ''}" data-act="item" data-id="${t.id}" data-i="${i}"><i></i>${esc(it.t)}</div>`).join('')}
    <form class="add" data-submit="item" data-id="${t.id}"><i></i><input name="v" placeholder="Добавить пункт" autocomplete="off" enterkeyhint="done"></form></div></div>`;
  const to = t.daily ? 'home' : t.area;
  return `<div class="top"><div class="nv"><button class="back" data-act="back" data-to="${to}">‹ ${t.daily ? 'Главная' : A.name}</button>
      <span class="nvr"><button class="ed" data-act="edit" data-id="${t.id}">Изменить</button><button class="dots glass" data-act="more" data-id="${t.id}" aria-label="Ещё">${DOTS}</button></span></div></div>
    <div class="main">
      <div class="tt tk${dn ? ' done' : ''}"><div class="lbl">${lbl}</div><div class="tr"><span class="tck" data-act="done" data-id="${t.id}" role="checkbox" aria-checked="${dn}" aria-label="Сделано"></span><h1>${esc(t.title)}</h1></div>${ring}</div><div class="gap"></div><div class="gap"></div>
      ${check}${info}${nudge}<div class="gap"></div><div class="gap"></div>${chk}
    </div>`;
};

SCREENS.report = r => {
  const area = r.id || 'work', t = today(), week = ui.per === 'week';
  const from = week ? weekStart(t) : t.slice(0, 8) + '01';
  const to = week ? addDays(from, 6) : iso(new Date(pd(from).getFullYear(), pd(from).getMonth() + 1, 0));
  const done = live().filter(x => x.done && x.doneAt && (area === 'all' || x.area === area) && x.doneAt.slice(0, 10) >= from && x.doneAt.slice(0, 10) <= to)
    .sort((a, b) => b.doneAt.localeCompare(a.doneAt));
  const late = done.filter(x => x.due && x.doneAt.slice(0, 10) > x.due);
  const fd = pd(from), td = pd(to);
  const per = week ? (fd.getMonth() === td.getMonth() ? `${fd.getDate()}–${td.getDate()} ${MONG[td.getMonth()]}` : `${dayMon(from)} – ${dayMon(to)}`) : `${MONN[fd.getMonth()]} ${fd.getFullYear()}`;
  let bars;
  if (week) bars = [0, 1, 2, 3, 4, 5, 6].map(i => { const s = addDays(from, i); return [done.filter(x => x.doneAt.startsWith(s)).length, WD[pd(s).getDay()]]; });
  else { bars = []; for (let a = 1; a <= td.getDate(); a += 7) { const b = Math.min(a + 6, td.getDate()); bars.push([done.filter(x => { const d = +x.doneAt.slice(8, 10); return d >= a && d <= b; }).length, `${a}–${b}`]); } }
  const max = Math.max(1, ...bars.map(b => b[0]));
  const gname = x => area === 'all' ? AREAS[x.area].name + (x.group ? ' · ' + x.group : '') : (x.group || AREAS[x.area].name);
  const groups = {}; done.forEach(x => (groups[gname(x)] ||= []).push(x));
  const lateTxt = x => { const n = diff(x.doneAt, x.due); return n === 1 ? 'на день позже' : `на ${N(n, ['день', 'дня', 'дней'])} позже`; };
  const list = Object.entries(groups).map(([g, l]) => grp(g, l.length) + `<div class="card glass">${l.map(x =>
    `<div class="dn${late.includes(x) ? ' late' : ''}" data-go="task/${x.id}"><span class="ck"></span><span class="t">${esc(x.title)}</span><span class="d">${dayMon(x.doneAt)}${late.includes(x) ? ', ' + lateTxt(x) : ''}</span></div>`).join('')}</div>`).join('');
  ui.reportText = `Отчёт${area === 'all' ? '' : ' — ' + AREAS[area].low}, ${per}. Сделано: ${done.length}.\n` + Object.entries(groups).map(([g, l]) => `\n${g}\n` + l.map(x => `— ${x.title} (${dayMon(x.doneAt)})`).join('\n')).join('\n');
  return `<div class="top"><div class="nv"><button class="back" data-act="back" data-to="${area === 'all' ? 'archive' : area}">‹ ${area === 'all' ? 'Архив' : AREAS[area].name}</button></div></div>
    <div class="main">
      <div class="tt"><h1>Отчёт</h1><p>${per}${area === 'all' ? '' : ' · ' + AREAS[area].low}</p></div>
      <div class="seg glass"><div class="${week ? 'on' : ''}" data-act="per" data-v="week">Неделя</div><div class="${week ? '' : 'on'}" data-act="per" data-v="month">Месяц</div></div>
      <div class="stats"><div class="st glass"><b>${done.length}</b><span>сделано</span></div><div class="st glass"><b>${done.length - late.length}</b><span>вовремя</span></div><div class="st glass"><b>${late.length}</b><span>позже срока</span></div></div>
      <div class="days glass">${bars.map(([v, l]) => `<div><i class="${v ? '' : 'z'}" style="${v ? `height:${Math.max(8, Math.round(v / max * 52))}px` : ''}"></i>${l}</div>`).join('')}</div>
      ${list || '<div class="empty">За этот период пока ничего не сделано.</div>'}
      <div style="height:28px"></div>
      ${done.length ? `<button class="btn-main" data-act="copyrep">${COPY}Скопировать отчёт</button><p class="note">Списком по группам — можно сразу отправить</p>` : ''}
    </div>`;
};

const inner = (back, to, title, p, body, right = '') => `<div class="top"><div class="nv"><button class="back" data-act="back" data-to="${to}">‹ ${back}</button>${right}</div></div>
  <div class="main"><div class="tt"><h1>${title}</h1>${p ? `<p>${p}</p>` : ''}</div><div class="gap"></div>${body}</div>`;
const row2 = (t, v, o = {}) => `<div class="row2${o.chev ? ' chev' : ''}"${o.go ? ` data-go="${o.go}"` : ''}${o.act ? ` data-act="${o.act}"` : ''}><div class="t">${t}</div><div class="v">${v}</div></div>`;

SCREENS.more = () => {
  const w = S().waiting.filter(x => !x.got).length;
  const j = S().journal.filter(x => !x.taken).length + S().tasks.filter(x => x.notTask).length;
  return inner('Главная', 'home', 'Ещё', '', `<div class="card glass">
    ${row2('Жду от других', w || '', { chev: 1, go: 'waiting' })}
    ${row2('Архив и отчёт', '', { chev: 1, go: 'archive' })}
    ${row2('Не стало задачами<small>то, что ИИ отбросил</small>', j || '', { chev: 1, go: 'journal' })}
    ${row2('Настройки', '', { chev: 1, go: 'settings' })}</div>`);
};

SCREENS.waiting = () => {
  const l = S().waiting.filter(x => !x.got), by = {};
  l.forEach(x => (by[x.who] ||= []).push(x));
  const body = Object.entries(by).map(([who, xs]) => grp(who, xs.length) + `<div class="card glass">${xs.map(x => {
    const n = diff(today(), x.asked);
    const ws = n === 0 ? 'просили сегодня' : n === 1 ? 'просили вчера' : `просили ${dayMon(x.asked)} · ${n >= 3 ? `<b>ответа нет ${N(n, ['день', 'дня', 'дней'])}</b>` : `ответа нет ${N(n, ['день', 'дня', 'дней'])}`}`;
    return `<div class="it2"><div class="t">${esc(x.what)}</div><div class="ws">${ws}</div><div class="ft2"><button class="pill" data-act="got" data-id="${x.id}">Получила</button></div></div>`;
  }).join('')}</div>`).join('');
  return inner('Ещё', 'more', 'Жду от других', 'Вы просили — ответа пока нет.', body || '<div class="empty">Сейчас Вы ни от кого ничего не ждёте.</div>');
};

SCREENS.journal = () => {
  const ai = S().journal.filter(x => !x.taken).map(x => `<div class="it2"><div class="src">${esc(x.src)} · ${x.at.slice(11, 16)}</div><div class="t">${esc(x.title)}</div><div class="why">${esc(x.why)}</div>
    <div class="ft2"><button class="pill" data-act="j2task" data-id="${x.id}">Сделать задачей</button></div></div>`);
  const mine = S().tasks.filter(x => x.notTask).map(x => `<div class="it2"><div class="src">${AREAS[x.area].low}${x.group ? ' · ' + esc(x.group) : ''} · Вы отметили «не задача»</div><div class="t">${esc(x.title)}</div>
    <div class="ft2"><button class="pill" data-act="back2task" data-id="${x.id}">Вернуть в задачи</button></div></div>`);
  const all = [...mine, ...ai];
  return inner('Ещё', 'more', 'Не стало задачами', 'Мне показалось, что это не задачи. Проверьте — вдруг это ошибка.', all.length ? `<div class="card glass">${all.join('')}</div>` : '<div class="empty">Здесь пусто.</div>');
};

SCREENS.archive = () => {
  const q = ui.q.trim().toLowerCase();
  const base = live().filter(x => x.done && x.doneAt);
  const cnt = a => base.filter(x => a === 'all' || x.area === a).length;
  const l = base.filter(x => (ui.arch === 'all' || x.area === ui.arch) && (!q || x.title.toLowerCase().includes(q) || (x.group || '').toLowerCase().includes(q) || (x.from || '').toLowerCase().includes(q)))
    .sort((a, b) => b.doneAt.localeCompare(a.doneAt));
  const hl = s => { const e = esc(s); if (!q) return e; const i = s.toLowerCase().indexOf(q); return i < 0 ? e : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)); };
  const by = {}; l.forEach(x => { const d = pd(x.doneAt); (by[`${MONN[d.getMonth()]} ${d.getFullYear()}`] ||= []).push(x); });
  const body = Object.entries(by).map(([m, xs]) => grp(m.replace(` ${new Date().getFullYear()}`, ''), xs.length) + `<div class="card glass">${xs.map(x =>
    `<div class="it2" data-go="task/${x.id}"><div class="t">${hl(x.title)}</div><div class="ws">${dayMon(x.doneAt)} · ${esc(x.group || AREAS[x.area].low)}${x.from ? ' · от ' + esc(gen(x.from)) : ''}${srcWords(x) ? ' · ' + srcWords(x) : ''}</div></div>`).join('')}</div>`).join('');
  const chips = `<div class="chips">${[['all', 'Все'], ['work', 'Работа'], ['study', 'Учёба'], ['personal', 'Личное']].map(([k, n]) =>
    `<div class="chip ${ui.arch === k ? 'on' : 'glass'}" data-act="arch" data-v="${k}">${n} <span>${cnt(k) || ''}</span></div>`).join('')}</div>`;
  return `<div class="top"><div class="nv"><button class="back" data-act="back" data-to="more">‹ Ещё</button><button class="pill" data-go="report/${ui.arch}">Отчёт</button></div>
      <div class="tt"><h1>Архив</h1></div>
      <label class="search glass">${LOUPE}<input type="search" placeholder="Поиск по сделанному" value="${esc(ui.q)}" data-input="q" autocomplete="off" enterkeyhint="search"></label>${chips}</div>
    <div class="main">${body || `<div class="empty">${q ? 'Ничего не нашлось.' : 'Сделанные задачи будут храниться здесь.'}</div>`}</div>`;
};

/* ---------- storage: Даша's private repo (sync.js) ---------- */
// GitHub wants a unique token name: a second phone or a reconnect gets «Oki 11.10.2026 14:32»
const GH_NEW = 'https://github.com/settings/personal-access-tokens/new?name=' + encodeURIComponent('Oki ' + new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')) + '&description=' + encodeURIComponent('Oki: задачи в закрытом хранилище')
  + '&expires_in=366&contents=write&actions=write&secrets=write';
const GH_ERR = {
  offline: 'Нет сети. Сохраню, когда появится.',
  busy: 'GitHub просит подождать. Повторю чуть позже.',
  auth: 'Ключ GitHub не работает: истёк или удалён.',
  perm: 'У ключа GitHub нет права записи в хранилище.',
  norepo: 'Не нахожу закрытое хранилище.',
  badkey: 'Ключ шифрования не подходит.',
  empty: 'Хранилище пустое: файл с задачами пропал.',
};
const GH_FIX = { auth: ['Вставить новый ключ', 'gh'], perm: ['Создать ключ заново', 'gh'], norepo: ['Подключить заново', 'gh'], badkey: ['Ввести ключ шифрования', 'gh/key'] };
function whenSaved() {
  const c = Sync.cfg; if (!c?.last) return Sync.st.status === 'busy' ? 'сохраняю…' : 'ещё не было';
  const d = new Date(c.last), day = iso(d);
  return `${day === today() ? 'сегодня' : dayWord(day)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function storageCard() {
  if (!Sync.on) return `<div class="card glass">${row2('<span class="dotok"></span>Где лежат задачи', 'в этом телефоне')}
    <div class="txt" style="padding-top:2px">Подключите Ваше закрытое хранилище на GitHub — тогда задачи не пропадут, даже если сменить телефон.</div>
    ${row2('Подключить хранилище', '', { chev: 1, go: 'gh' })}</div>`;
  const c = Sync.cfg, err = GH_ERR[Sync.st.status], fix = GH_FIX[Sync.st.status];
  const left = c.exp ? diff(c.exp, today()) : null;
  return `<div class="card glass">${row2(`<span class="${err && Sync.st.status !== 'offline' ? 'dotbad' : 'dotok'}"></span>Где лежат задачи`, `в хранилище ${esc(c.repo)}`)}
    ${err ? `<div class="it2"><div class="t">${err}</div>${fix ? `<div class="ft2"><button class="pill dark" data-go="${fix[1]}">${fix[0]}</button></div>` : ''}</div>` : ''}
    ${row2('Последнее сохранение', whenSaved())}
    ${row2('Ключ GitHub', left == null ? 'бессрочный' : left < 0 ? '<b>истёк</b>' : left <= 14 ? `<b>${left ? `истекает ${inDays(c.exp)}` : 'истекает сегодня'}</b>` : `до ${dayMon(c.exp)} ${c.exp.slice(0, 4)}`)}
    ${row2('Ключ шифрования', 'показать', { chev: 1, act: 'ghkey' })}
    ${row2('Отключить на этом телефоне', '', { chev: 1, act: 'ghoff' })}</div>`;
}

// «Сбор задач» (design: final.html settings): what the mail collector on GitHub last reported
const MAIL_BOX = { auth: 'Яндекс не пускает в ящик: пароль приложения удалён или сменился.', nokey: 'Нет пароля от ящика.', offline: 'Не получилось связаться с почтой. Попробую через полчаса.' };
const MAIL_NOTE = { limit: 'Нейросеть исчерпала бесплатный лимит на сегодня. Остальное разберу завтра утром.', ai: 'Нейросеть не ответила. Повторю через полчаса.', more: 'Писем много — разбираю по частям.' };
const hmWhen = s => { const at = new Date(s); return `${iso(at) === today() ? '' : dayWord(iso(at)) + ', '}${pad(at.getHours())}:${pad(at.getMinutes())}`; };
function collectCard() {
  const m = Sync.mail?.status;
  let mailRow, lines = [], fallback = '';
  if (!m) {
    mailRow = row2('<span class="dotok"></span>Почта', 'ещё не проверялась');
    lines.push('Как только программа на GitHub проверит почту, здесь появится время проверки.');
  } else {
    const mins = (Date.now() - new Date(m.at)) / 6e4, h = new Date().getHours();
    const bad = Object.entries(m.boxes || {}).filter(([, v]) => v !== 'ok');
    const stale = mins > 120 && h >= 9 && h < 23; // runs every half hour from 7 to 23:30
    lines = [...bad.map(([a, v]) => `<b>${esc(a)}</b>. ${MAIL_BOX[v] || MAIL_BOX.offline}`),
      ...(MAIL_NOTE[m.note] ? [MAIL_NOTE[m.note]] : []), ...(stale ? ['Почта давно не проверялась: похоже, программа на GitHub остановилась.'] : [])];
    if (!Sync.ai) fallback = m.model && !m.model.startsWith('qwen/') ? row2('Нейросеть', 'запасная') : ''; // before the collector wrote data/ai.oki
    mailRow = row2(`<span class="${bad.length || stale ? 'dotbad' : 'dotok'}"></span>Почта`, `проверено ${hmWhen(m.at)}`);
  }
  const t = tgState(), n = notesState();
  if (t.line) lines.push(t.line);
  if (n.line) lines.push(n.line);
  return `<div class="card glass">${mailRow}${t.row}${n.row}
    ${lines.length ? `<div class="it2"><div class="t">${lines.join('<br>')}</div></div>` : ''}${fallback}
    ${row2('Проверить сейчас', '', { chev: 1, act: 'collect' })}</div>`;
}
// «Нейросеть» (variant Б, Даша 2026-10-14): who reads letters and chats now and how much of today's free limit is left.
// data/ai.oki from the collector: used today (Groq tokens per model, one Cloudflare pool of neurons), until = limit hit.
const AI_NAME = { 'qwen/qwen3.8-27b': 'Qwen 3.8', 'openai/gpt-oss-120b': 'gpt-oss-120b', 'openai/gpt-oss-20b': 'gpt-oss-20b' };
const aiName = m => { const id = m.replace(/^cf:@cf\//, ''); return AI_NAME[id] || id.replace(/^[^/]+\//, ''); };
const aiWhere = m => m.startsWith('cf:') ? 'Cloudflare' : 'Groq';
const thou = n => n >= 1000 ? `${n >= 1e4 ? Math.round(n / 1000) : String(Math.round(n / 100) / 10).replace('.', ',')} тыс.` : String(Math.round(n));
function aiLeft(a, m) {
  const cf = m.startsWith('cf:'), of = cf ? a.cf : a.groq;
  const fresh = a.day === new Date().toISOString().slice(0, 10); // a new UTC day: the counts start again
  const used = fresh ? (cf ? a.used?.cf : a.used?.[m]) || 0 : 0;
  const until = a.until?.[m] && new Date(a.until[m]) > Date.now() ? new Date(a.until[m]) : null;
  return { of, left: until ? 0 : Math.max(0, of - used), until, unit: cf ? 'нейронов' : 'токенов', cf };
}
const atWhen = d => `${iso(d) === today() ? '' : dayWord(iso(d)) + ' '}в ${pad(d.getHours())}:${pad(d.getMinutes())}`;
function aiLine(a, m) {
  const l = aiLeft(a, m);
  if (!l.left) return `на сегодня закончилась${l.until ? `, снова ${atWhen(l.until)}` : ''}`;
  return `осталось ${thou(l.left)} из ${thou(l.of)} ${l.unit}${l.cf ? ' · общие на Cloudflare' : ''}`;
}
const aiBar = (a, m, w) => { const l = aiLeft(a, m); return `<div class="aibar${w ? ' w' : ''}"><i style="width:${Math.round(l.left / l.of * 100)}%"></i></div>`; };
const aiNow = a => (a.models || []).find(m => aiLeft(a, m).left > 0);
function aiCard() {
  const a = Sync.ai;
  if (!a?.models) return '';
  const now = aiNow(a);
  const top = now ? `<div class="k">Сейчас разбирает</div><div class="nm">${esc(aiName(now))}<small>${aiWhere(now)}</small></div>${aiBar(a, now, 1)}<div class="n">${aiLine(a, now)}</div>`
    : (() => { const u = a.models.map(m => aiLeft(a, m).until).filter(Boolean).sort((x, y) => x - y)[0];
      return `<div class="k">Сейчас разбирает</div><div class="nm">Никто</div><div class="n">У всех пяти лимит на сегодня закончился.${u ? ` Разбор продолжится ${atWhen(u)}.` : ''}</div>`; })();
  return `${grp('Нейросеть', '')}<div class="card glass"><div class="aib">${top}</div>
    ${row2('Все нейросети', `${a.models.length} по очереди`, { chev: 1, act: 'ais' })}</div>`;
}
function aiSheet() {
  const a = Sync.ai, now = aiNow(a);
  sheet(`<h3>Нейросети</h3><p class="txt" style="padding:0 4px">Разбирают письма, чаты и заметки по очереди. Когда у одной кончается лимит на сегодня, работу берёт следующая. Остаток примерный: его считает сама программа.</p>
    <div class="card glass aisl">${a.models.map(m => `<div class="air${aiLeft(a, m).left ? '' : ' off'}"><div class="h"><span>${esc(aiName(m))}</span><small>${aiWhere(m)}${m === 'openai/gpt-oss-20b' ? ' · ошибается чаще' : ''}</small>${m === now ? '<span class="now">сейчас</span>' : ''}</div>
      ${aiBar(a, m)}<div class="n">${aiLine(a, m)}</div></div>`).join('')}</div>`);
}

// Telegram's row in «Сбор задач»: not connected / waiting for the first check / checked / signed out
const TG_NOTE = { limit: 'Telegram: нейросеть исчерпала лимит на сегодня, остальное разберу завтра.', ai: 'Telegram: нейросеть не ответила, повторю через полчаса.', more: 'Сообщений много — разбираю Telegram по частям.' };
function tgState() {
  const on = S().settings.tg?.at, s = Sync.tg?.status;
  if (!on) return { row: row2('Telegram', 'подключить', { chev: 1, go: 'tg' }) };
  if (s && s.at >= on && (s.state === 'auth' || s.state === 'nokey')) return { bad: true, row: row2('<span class="dotbad"></span>Telegram', '<span class="pill dark">Войти заново</span>', { go: 'tg' }) };
  if (!s || s.at < on) return { row: row2('<span class="dotok"></span>Telegram', 'проверю через пару минут') };
  const line = s.state === 'offline' || s.state === 'flood' ? 'Telegram не ответил. Попробую через полчаса.' : TG_NOTE[s.note];
  return { row: row2(`<span class="${s.state === 'ok' ? 'dotok' : 'dotbad'}"></span>Telegram`, `проверено ${hmWhen(s.state === 'ok' ? s.at : s.ok_at || s.at)}`), line };
}

// notes from the iPhone: Shortcuts hand them to the Oki shell, the collector reads them (TZ §5)
const NOTES_NOTE = { limit: 'Заметки: нейросеть исчерпала лимит на сегодня, остальное разберу завтра.', ai: 'Заметки: нейросеть не ответила, повторю через полчаса.', more: 'Заметок много — разбираю по частям.' };
function notesState() {
  const on = S().settings.notes?.at, s = Sync.notes?.status;
  if (!on) return { row: row2('Заметки', 'подключить', { chev: 1, go: 'notes' }) };
  if (!s?.got) return { row: row2('<span class="dotok"></span>Заметки', 'жду первую', { chev: 1, go: 'notes' }) };
  return { row: row2('<span class="dotok"></span>Заметки', `получены ${hmWhen(s.got)}`, { chev: 1, go: 'notes' }), line: NOTES_NOTE[s.note] };
}

SCREENS.settings = () => inner('Ещё', 'more', 'Настройки', '', `
  ${grp('Обо мне', '')}<div class="card glass">${row2('Как к Вам обращаться', esc(S().settings.name), { chev: 1, act: 'name' })}</div>
  ${grp(S().settings.tg?.at ? 'Люди и чаты' : 'Люди', '')}<div class="card glass">${row2('Кто есть кто', N(S().people.length, ['человек', 'человека', 'человек']), { chev: 1, go: 'people' })}${S().settings.tg?.at ? row2('Чаты Telegram', chatsWord(), { chev: 1, go: 'chats' }) : ''}</div>
  ${Sync.on ? grp('Сбор задач', '') + collectCard() + aiCard() : ''}
  ${grp('Хранение', '')}${storageCard()}
  ${Sync.on ? '' : `${grp('Примерные задачи', '')}<div class="card glass">${S().demo
    ? row2('Стереть примерные задачи<small>и начать с чистого листа</small>', '', { chev: 1, act: 'cleardemo' })
    : row2('Показать примерные задачи', '', { chev: 1, act: 'demo' })}</div>`}
  ${grp('Подключение', '')}<div class="card glass">${row2('Как всё отключить', '', { chev: 1, go: 'off' })}</div>`);

// connecting, «Oki объясняет» (variant В, chosen by Даша 2026-10-11): one thought and one button per screen
const ghBack = `<button class="back obk" data-act="back" data-to="settings">‹ Настройки</button>`;
const keyField = (name, ph, val = '') => `<div class="kin glass"><input class="in" name="${name}" placeholder="${ph}" value="${esc(val)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
  <button type="button" class="pill" data-act="paste">Вставить</button></div>`;
SCREENS.gh = r => {
  const step = r.id || 'intro', p = ui.ghp;
  if (step === 'key' && !p && Sync.on) return `<form class="onb sm" data-submit="ghrekey">${ghBack}<div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Ключ шифрования</h1><p>Нужен ключ из приложения <b>«Пароли»</b>. Он начинается с <b>OKI-</b>.</p>
    ${keyField('key', 'OKI-…')}
    <div class="bt"><button class="btn-main" type="submit" data-busy="Открываю…">Открыть задачи</button></div></form>`;
    if (step === 'paste' || (step !== 'intro' && step !== 'done' && !p)) return `<form class="onb sm" data-submit="ghtoken">${ghBack}<div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Вставьте ключ</h1><p>Тот, что GitHub показал после <b>Generate token</b>. Он начинается с <b>github_pat_</b>.</p>
    ${keyField('token', 'github_pat_…')}
    <div class="bt"><button class="btn-main" type="submit" data-busy="Проверяю…">Проверить</button><a class="btn-ghost" href="${GH_NEW}" target="_blank" rel="noopener" style="margin-top:8px">Открыть GitHub ещё раз</a></div></form>`;
  if (step === 'key') return `<form class="onb sm" data-submit="ghjoin">${ghBack}<div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Ключ шифрования</h1><p>В хранилище уже есть Ваши задачи. Чтобы открыть их, нужен ключ из приложения <b>«Пароли»</b>. Он начинается с <b>OKI-</b>.</p>
    ${keyField('key', 'OKI-…')}
    <div class="bt"><button class="btn-main" type="submit" data-busy="Открываю…">Открыть задачи</button></div></form>`;
  if (step === 'new') return `<div class="onb sm">${ghBack}<div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Это ключ<br>шифрования</h1><div class="keybox glass">${ui.ghkey.slice(4).split('-').join(' ')}</div>
    <p>Без него Ваши задачи не прочитает никто — даже я. Сохраните его в <b>«Паролях»</b>: он понадобится на новом телефоне.</p>
    <div class="bt"><button class="btn-main" data-act="ghcopy">${COPY}Скопировать</button><button class="btn-ghost" data-act="ghstart" data-busy="Сохраняю…" style="margin-top:8px">Ключ сохранён</button></div></div>`;
  if (step === 'done') return `<div class="onb"><span class="logo" style="font-size:34px">Oki</span><div class="rb">${RABBIT('happy', '', true)}</div>
    <h1>Всё на месте.</h1><p>Задачи теперь хранятся в Вашем закрытом хранилище. Смените телефон — они останутся.${ui.ghwasdemo ? ' Примерные задачи убраны, здесь будут только Ваши.' : ''}</p>
    <div class="bt"><button class="btn-main" data-act="ghdone">Хорошо</button></div></div>`;
  return `<div class="onb">${ghBack}<span class="logo" style="font-size:34px">Oki</span><div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Мне нужен ключ<br>от Вашего хранилища</h1><p>GitHub выдаст его за минуту. Страница откроется уже заполненной: выберите хранилище <b>oki-data</b>, внизу нажмите <b>Generate token</b>, потом <b>Copy</b>.</p>
    <div class="bt"><a class="btn-main" href="${GH_NEW}" target="_blank" rel="noopener" data-act="ghopen">Открыть GitHub</a><button class="btn-ghost" data-go="gh/paste" style="margin-top:8px">Вставить скопированный ключ</button></div></div>`;
};
// busy text and error line are set in place: a redraw would empty the field Даша just filled
async function ghStep(fn, okStep) {
  const pane = Nav.cur.el, btn = pane.querySelector('[type="submit"], [data-act="ghstart"]');
  if (ui.ghbusy) return;
  ui.ghbusy = true;
  const label = btn.innerHTML; btn.textContent = btn.dataset.busy;
  pane.querySelector('.say')?.remove();
  try { await fn(); if (okStep) go(okStep); }
  catch (e) {
    const msg = { auth: 'GitHub не принял ключ. Скопируйте его ещё раз целиком.', norepo: 'Ключ работает, но хранилище oki-data ему не открыто. Создайте ключ заново и выберите oki-data.',
      badkey: 'Ключ не подходит. Проверьте, что вставили его целиком.', perm: 'У ключа нет права записи. Создайте его заново по кнопке «Открыть GitHub».',
      busy: 'GitHub просит подождать минуту.' }[e.code] || 'Нет связи с GitHub. Проверьте интернет и попробуйте ещё раз.';
    pane.querySelector('.onb .bt').insertAdjacentHTML('beforebegin', `<p class="say">${msg}</p>`);
  } finally { ui.ghbusy = false; btn.innerHTML = label; }
}

/* ---------- Telegram (tg.js): same frame as the storage screens, «Oki объясняет» ---------- */
const TG_SITE = 'https://my.telegram.org/auth?to=apps';
const tgBack = `<button class="back obk" data-act="tgback">‹ Настройки</button>`;
const tgField = (name, ph, o = '') => `<div class="kin glass"><input class="in" name="${name}" placeholder="${ph}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ${o}></div>`;
SCREENS.tg = r => {
  const step = r.id || 'intro', l = Tg.st;
  const sm = (h, p, body, btn, busy, extra = '') => `<form class="onb sm" data-submit="tg${step}">${tgBack}<div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>${h}</h1><p>${p}</p>${body}<div class="bt"><button class="btn-main" type="submit" data-busy="${busy}">${btn}</button>${extra}</div></form>`;
  if (step === 'site') return `<div class="onb sm">${tgBack}<div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Сначала — ключи<br>от Telegram</h1><p>Их выдаёт сайт Telegram. Войдите по номеру: код придёт в Telegram. Откройте <b>API development tools</b>, впишите App title <b>Oki Assistant</b>, Short name <b>okiassistant</b>, платформа — любая, и нажмите <b>Create application</b>.</p>
    <div class="bt"><a class="btn-main" href="${TG_SITE}" target="_blank" rel="noopener" data-act="tgopen">Открыть сайт Telegram</a><button class="btn-ghost" data-go="tg/keys" style="margin-top:8px">Ключи уже есть</button></div></div>`;
  if (step === 'keys') return sm('Вставьте два ключа', 'Они на той же странице. <b>App api_id</b> — это число, <b>App api_hash</b> — длинная строка из букв и цифр.',
    keyField('id', 'App api_id') + keyField('hash', 'App api_hash'), 'Дальше', 'Проверяю…');
  if (step === 'phone' && l) return sm('Ваш номер<br>в Telegram', 'Telegram пришлёт код — не по SMS, а в само приложение Telegram.',
    tgField('phone', '+7 900 000-00-00', 'type="tel" inputmode="tel" autocomplete="tel"'), 'Получить код', 'Отправляю…');
  if (step === 'code' && l?.codeHash) return sm('Код из Telegram', 'Он пришёл в Telegram, в чат <b>Telegram</b>. Никому его не пересылайте.',
    tgField('code', 'Код', 'inputmode="numeric" autocomplete="one-time-code"'), 'Войти', 'Вхожу…',
    `<button type="button" class="btn-ghost" data-go="tg/phone" style="margin-top:8px">Код не пришёл</button>`);
  if (step === 'pass' && l?.codeHash) return sm('Облачный пароль', 'У Вас в Telegram стоит облачный пароль. Введите его — тот, что задан в Telegram → Конфиденциальность → Облачный пароль.',
    tgField('pass', 'Пароль', 'type="password" autocomplete="current-password"'), 'Войти', 'Вхожу…');
  if (step === 'groups') return inner('Настройки', 'settings', 'Какие группы читать?', 'Отметьте только нужные. Остальные группы я не открываю. Поменять можно в любой момент в Настройках.',
    groupList(ui.tgpick || []) + `<div class="gap"></div><div class="gap"></div><button class="btn-main" data-act="tgsave">Готово</button><div class="gap"></div>`);
  if (step === 'done') return `<div class="onb"><span class="logo" style="font-size:34px">Oki</span><div class="rb">${RABBIT('happy', '', true)}</div>
    <h1>Telegram подключён.</h1><p>Через пару минут я проверю чаты. Выключить какой-то личный чат или поменять группы можно в Настройках → Чаты Telegram.</p>
    <div class="bt"><button class="btn-main" data-act="tgdone">Хорошо</button></div></div>`;
  if (step !== 'intro') return SCREENS.tg({ id: l?.codeHash ? 'code' : l ? 'phone' : 'intro' }); // came back after a reload
  return `<div class="onb">${tgBack}<span class="logo" style="font-size:34px">Oki</span><div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Подключим Telegram</h1><p>Я буду читать «Избранное» и личные чаты и находить в них задачи. Группы — только те, что Вы сами отметите. Я ничего не пишу и не отмечаю прочитанным.</p>
    <div class="bt"><button class="btn-main" data-go="tg/site">Дальше</button></div></div>`;
};
/* ---------- Notes: «Oki объясняет», one step per screen ---------- */
const shell = () => !!window.webkit?.messageHandlers?.oki; // the Oki app on the iPhone (oki-ios), not Safari
SCREENS.notes = r => {
  const step = r.id || 'intro';
  const one = (h, p, bt, rb = 'calm') => `<div class="onb sm">${tgBack}<div class="rb">${RABBIT(rb, '', true)}</div><h1>${h}</h1><p>${p}</p><div class="bt">${bt}</div></div>`;
  if (!shell() && step !== 'intro') return SCREENS.notes({});
  if (step === 'auto') return one('Шаг 1. Когда', 'В «Командах» откройте <b>Автоматизация</b> и нажмите <b>+</b>. Выберите <b>Приложение</b> → <b>Заметки</b>. Отметьте <b>Закрыто</b>, уберите <b>Открыто</b>, выберите <b>Запускать сразу</b> и нажмите <b>Далее</b>.',
    `<a class="btn-main" href="shortcuts://" data-act="notesopen">Открыть «Команды»</a><button class="btn-ghost" data-go="notes/what" style="margin-top:8px">Сделано</button>`);
  if (step === 'what') return one('Шаг 2. Что делать', 'Нажмите <b>Новая пустая автоматизация</b>. Найдите действие <b>Найти заметки</b> и добавьте его, ничего в нём не меняя. Затем найдите <b>Oki</b> → <b>Отправить заметки в Oki</b>. Нажмите <b>Готово</b>.',
    `<button class="btn-main" data-act="notessave">Сделано</button>`);
  if (step === 'done') return `<div class="onb"><span class="logo" style="font-size:34px">Oki</span><div class="rb">${RABBIT('happy', '', true)}</div>
    <h1>Почти готово.</h1><p>Откройте «Заметки» и сразу закройте: так я запомню, что там уже есть, и задач из старого не будет. Если iPhone спросит, можно ли передать заметки Oki, нажмите <b>Всегда разрешать</b>. Всё, что Вы напишете потом, — моё: задача появится в течение получаса.</p>
    <div class="bt"><button class="btn-main" data-act="tgdone">Хорошо</button></div></div>`;
  if (!shell()) return `<div class="onb">${tgBack}<span class="logo" style="font-size:34px">Oki</span><div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Нужен Oki<br>на iPhone</h1><p>Заметки подключаются только в приложении Oki на iPhone. Обновите его в <b>SideStore</b> и откройте эту страницу там.</p>
    <div class="bt"><button class="btn-main" data-act="tgdone">Хорошо</button></div></div>`;
  return `<div class="onb">${tgBack}<span class="logo" style="font-size:34px">Oki</span><div class="rb">${RABBIT('calm', '', true)}</div>
    <h1>Подключим заметки</h1><p>Пишите в «Заметках», как привыкли. Когда Вы их закрываете, iPhone тихо отдаёт мне новое — зашифрованным. Я нахожу там задачи, а в старой заметке читаю только дописанное.</p>
    <div class="bt"><button class="btn-main" data-go="notes/auto">Дальше</button></div></div>`;
};

// her chats: what the collector last saw, or what the phone saw while logging in
const tgChats = () => Sync.tg?.chats?.length ? Sync.tg.chats : ui.tgchats || [];
function chatsWord() {
  const p = S().settings.tg || {}, g = (p.groups || []).length, o = (p.off || []).length;
  return [g ? N(g, ['группа', 'группы', 'групп']) : 'без групп', o ? `${o} выкл.` : ''].filter(Boolean).join(' · ');
}
const chatSub = c => [c.n ? N(c.n, ['участник', 'участника', 'участников']) : '', c.at ? dayWord(c.at.slice(0, 10)) : ''].filter(Boolean).join(' · ');
const chatRow = (c, on, act) => `<div class="row2 pick" data-act="${act}" data-id="${esc(c.id)}"><span class="ck${on ? ' on' : ''}"></span><div class="t">${esc(c.title)}${chatSub(c) ? `<small>${chatSub(c)}</small>` : ''}</div></div>`;
function groupList(sel) {
  const g = tgChats().filter(c => c.kind === 'group');
  return g.length ? `<div class="card glass">${g.map(c => chatRow(c, sel.includes(c.id), 'tgpick')).join('')}</div>`
    : '<div class="empty">Групп нет — буду читать только личные чаты и «Избранное».</div>';
}
SCREENS.chats = () => {
  const p = S().settings.tg || {}, l = tgChats(), g = p.groups || [], off = p.off || [];
  const groups = l.filter(c => c.kind === 'group'), mine = l.filter(c => c.kind !== 'group');
  const body = !l.length ? '<div class="empty">Список чатов появится после первой проверки Telegram — через пару минут.</div>'
    : grp('Группы', `читаю ${g.filter(id => groups.some(c => c.id === id)).length} из ${groups.length}`) + (groups.length ? `<div class="card glass">${groups.map(c => chatRow(c, g.includes(c.id), 'tggroup')).join('')}</div>` : '<div class="empty">Групп нет.</div>')
      + grp('Личные чаты', off.length ? `выключено ${off.length}` : 'читаю все') + `<div class="card glass">${mine.map(c => chatRow(c, !off.includes(c.id), 'tgoff')).join('')}</div>`;
  return inner('Настройки', 'settings', 'Чаты Telegram', 'Группы читаю только отмеченные. Личные чаты — все, кроме выключенных.', body);
};
// busy text and error line in place, like ghStep
const TG_SAY = {
  keys: 'Telegram не принял ключи. Скопируйте api_id и api_hash ещё раз.', phone: 'Telegram не узнал номер. Проверьте его: +7 и десять цифр.',
  code: 'Код не подошёл. Проверьте цифры.', expired: 'Код устарел. Нажмите «Код не пришёл» и получите новый.', pass: 'Пароль не подошёл.',
  nouser: 'На этот номер нет аккаунта Telegram.', banned: 'Telegram не пускает этот номер.', flood: 'Telegram просит подождать. Попробуйте через несколько минут.',
  perm: 'Ключ GitHub не может сохранить вход. Создайте ключ GitHub заново (Настройки → Хранение) и повторите.', norepo: 'Не нахожу закрытое хранилище.',
  tg: 'Telegram ответил ошибкой. Попробуйте ещё раз.', offline: 'Нет связи с Telegram. Проверьте интернет и попробуйте ещё раз.',
};
async function tgStep(fn) {
  const pane = Nav.cur.el, btn = pane.querySelector('[type="submit"], [data-act="tgsave"]');
  if (ui.tgbusy) return;
  ui.tgbusy = true;
  const label = btn.innerHTML; btn.textContent = btn.dataset.busy || 'Сохраняю…';
  pane.querySelector('.say')?.remove();
  try { await fn(); }
  catch (e) {
    const say = el => (el.querySelector('.onb .bt') || btn).insertAdjacentHTML('beforebegin', `<p class="say">${TG_SAY[e.code] || TG_SAY.tg}</p>`);
    if (e.code === 'keys' && route().id !== 'keys') { go('tg/keys'); setTimeout(() => say(Nav.cur.el), 50); } // wrong keys show up only when Telegram is asked for a code
    else say(pane);
  }
  finally { ui.tgbusy = false; btn.innerHTML = label; }
}
// signed in: take the chat list, hand the session to GitHub, then let Даша tick the groups
async function tgIn() {
  btnSay('Сохраняю вход…');
  ui.tgchats = await Tg.chats();
  await Tg.finish();
  ui.tgpick = S().settings.tg?.groups || [];
  Store.act('settings', { settings: { tg: { ...(S().settings.tg || {}), groups: ui.tgpick, at: Store.stamp() } } }); // signed in = connected, even before the groups
  go('tg/groups');
}
const btnSay = t => { const b = Nav.cur.el.querySelector('[type="submit"]'); if (b) b.textContent = t; };

SCREENS.people = () => {
  const by = { work: [], study: [], personal: [] };
  S().people.forEach(p => (by[p.area] || by.personal).push(p));
  const body = Object.entries(by).filter(([, l]) => l.length).map(([a, l]) => grp(AREAS[a].name, l.length) + `<div class="card glass">${l.map(p =>
    `<div class="row2 chev" data-act="person" data-id="${p.id}"><div class="t">${esc(p.name)}${p.role ? `<span class="role">${esc(p.role)}</span>` : ''}</div><div class="v"></div></div>`).join('')}</div>`).join('');
  return inner('Настройки', 'settings', 'Кто есть кто', 'По этому списку я понимаю, кто что поручает.', body + '<div class="gap"></div><div class="gap"></div><button class="pill" data-act="person">＋ Добавить человека</button>');
};

SCREENS.off = () => inner('Настройки', 'settings', 'Как всё отключить', Sync.on ? 'Пока подключено только хранилище на GitHub. Отключить всё можно так:' : 'Пока ничего не подключено. Когда подключим почту, Telegram и GitHub, отключить их можно так:', `<div class="card glass"><div class="txt">
  <b>Telegram</b> → Настройки → Устройства → завершить сеанс Oki.<br><br>
  <b>Яндекс</b> → Безопасность → Пароли приложений → удалить пароль Oki.<br><br>
  <b>GitHub</b> → Settings → Developer settings → удалить ключ Oki. Или удалить закрытое хранилище целиком.</div></div>`);

/* ---------- sheet + toast ---------- */
const layer = () => $('#layer');
let sh = null;
function sheet(html) {
  const L = layer();
  L.innerHTML = `<div class="dim" data-act="close"></div><div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  // a short sheet belongs to the finger (drag down to close); a long one scrolls
  const el = L.querySelector('.sheet'); el.style.touchAction = el.scrollHeight > el.clientHeight + 1 ? 'pan-y' : 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => L.classList.add('on')));
}
function closeSheet() {
  const L = layer(); L.classList.remove('on'); sh = null;
  document.activeElement?.blur?.();
  setTimeout(() => { if (!L.classList.contains('on')) L.innerHTML = ''; }, 330);
}
let tt;
// toast(msg) or toast(msg, { label, fn }): with a button it stays longer so there is time to press it
function toast(msg, act) {
  const T = $('#toast');
  T.textContent = msg; T.classList.toggle('act', !!act);
  if (act) { const b = document.createElement('button'); b.type = 'button'; b.textContent = act.label; b.onclick = () => { T.classList.remove('on'); act.fn(); }; T.append(b); }
  T.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => T.classList.remove('on'), act ? 4000 : Math.max(2200, msg.length * 60));
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const a = document.createElement('textarea'); a.value = text; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.append(a); a.select();
    const ok = document.execCommand('copy'); a.remove(); return ok;
  }
}
const opts = (k, list, cur) => `<div class="opts" data-k="${k}">${list.map(([v, n]) => `<button type="button" class="chip ${v === cur ? 'on' : ''}" data-act="opt" data-v="${esc(v)}">${esc(n)}</button>`).join('')}</div>`;
const dateRow = (name, val, label, type = 'date') => `<div class="row2 chev"><span>${label}</span><span class="v" data-show="${name}">${fmtField(type, val)}</span>
  <input class="over" type="${type}" name="${name}" value="${val || ''}" data-kind="${type}"></div>`;
const fmtField = (type, v) => !v ? (type === 'date' ? 'без срока' : 'не указано') : type === 'date' ? `${short(v)}${v === today() ? ' · сегодня' : ''}` : v;

/* quick text → date/time («завтра в 15:00», «до пятницы», «12 окт») */
function parseWhen(s) {
  let date = null, time = null, txt = ' ' + s + ' ';
  const cut = re => { const m = txt.match(re); if (m) txt = txt.replace(m[0], ' '); return m; };
  let m;
  if ((m = cut(/\s(?:до|к|в)?\s*(\d{1,2})[:.](\d{2})(?=[\s,.!?])/i))) time = `${pad(+m[1])}:${m[2]}`;
  if (cut(/\sпослезавтра(?=[\s,.!?])/i)) date = addDays(today(), 2);
  else if (cut(/\sзавтра(?=[\s,.!?])/i)) date = addDays(today(), 1);
  else if (cut(/\sсегодня(?=[\s,.!?])/i)) date = today();
  else if ((m = cut(/\s(?:в|во|до|к|на)?\s*(понедельник|вторник|сред[уыа]|четверг|пятниц[уыа]|суббот[уыа]|воскресень[ея])(?=[\s,.!?])/i))) {
    const map = { пон: 1, вто: 2, сре: 3, чет: 4, пят: 5, суб: 6, вос: 0 };
    const w = map[m[1].slice(0, 3).toLowerCase()], d0 = new Date().getDay();
    date = addDays(today(), ((w - d0 + 7) % 7) || 7);
  } else if ((m = cut(/\s(?:до|к|на)?\s*(\d{1,2})\s+(янв|фев|мар|апр|ма[яй]|июн|июл|авг|сен|окт|ноя|дек)[а-я]*(?=[\s,.!?])/i))) {
    const mi = ['янв', 'фев', 'мар', 'апр', 'ма', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'].findIndex(x => m[2].toLowerCase().startsWith(x));
    const y = new Date().getFullYear(); let d = iso(new Date(y, mi, +m[1])); if (d < today()) d = iso(new Date(y + 1, mi, +m[1])); date = d;
  }
  if (time && !date) date = today();
  const title = txt.replace(/\s+/g, ' ').trim().replace(/^./, c => c.toUpperCase());
  return { title: title || s.trim(), date, time };
}

const DAILY_RE = /(^|\s)(каждый день|ежедневно)(?=[\s,.!?]|$)/i;
function openAdd(o) {
  const daily = DAILY_RE.test(o.text || '');
  const p = parseWhen((o.text || '').replace(DAILY_RE, ' '));
  const cal = o.mode === 'cal';
  let kind = o.kind || 'task';
  if (cal && /созвон|встреч|звонок|переговор/i.test(p.title)) kind = 'meeting';
  const area = o.area || (cal ? 'work' : null);
  const date = p.date || (cal ? ui.cal : null);
  let start = p.time;
  if (kind !== 'task' && !start) { const h = Math.min(new Date().getHours() + 1, 22); start = `${pad(h)}:00`; }
  sh = { mode: o.mode, kind, area, group: o.group || null, journal: o.journal || null, fixedArea: !!o.fixedArea, daily };
  sheet(`<form data-submit="add">
    <h3>${cal ? 'Добавить' : 'Новая задача'}</h3>
    <textarea class="in" name="title" rows="2" placeholder="Что нужно сделать" enterkeyhint="done">${esc(p.title)}</textarea>
    ${cal ? `<div class="lab">Что это</div>${opts('kind', [['task', 'Задача'], ['meeting', 'Встреча'], ['event', 'Мероприятие']], kind)}` : ''}
    <div data-slot="area">${areaBlock()}</div>
    <div data-slot="group">${groupBlockSheet()}</div>
    <div class="rows" data-slot="when">${whenBlock(date, start, p.time)}</div>
    <button class="btn-main" type="submit">Добавить</button>
  </form>`);
}
function areaBlock() {
  if (sh.fixedArea) return '';
  return `<div class="lab">Куда</div>${opts('area', [['work', 'Работа'], ['study', 'Учёба'], ['personal', 'Личное']], sh.area)}`;
}
function groupBlockSheet() {
  if (sh.kind !== 'task' || !sh.area || sh.area === 'personal') return '';
  const names = [...new Set(S().tasks.filter(t => t.area === sh.area && t.group && !t.done).map(t => t.group))];
  if (sh.group && !names.includes(sh.group)) names.push(sh.group);
  return `<div class="lab">${AREAS[sh.area].grp}</div>${opts('group', [...names.map(n => [n, n]), ['+', '＋ Новая']], sh.group)}
    <input class="in" name="newgroup" placeholder="Название" style="margin-top:8px;display:${sh.group === '+' ? 'block' : 'none'}" autocomplete="off">`;
}
function whenBlock(date, time, hadTime) {
  if (sh.kind === 'task') return dateRow('date', sh.daily ? date || today() : date, sh.daily ? 'С какого дня' : 'Срок') + dateRow('time', hadTime || '', 'Время', 'time') + dailySwitch(sh.daily);
  const [h, mm] = (time || '10:00').split(':').map(Number);
  const end = `${pad(Math.min(h + 1, 23))}:${pad(mm)}`;
  return dateRow('date', date || ui.cal, 'День') + dateRow('time', time, 'Начало', 'time') + dateRow('end', end, 'Конец', 'time');
}
const dailySwitch = on => `<label class="row2"><span>Каждый день</span><input type="checkbox" class="sw" name="daily"${on ? ' checked' : ''} aria-label="Каждый день"></label>`;
function openMove(t) {
  sh = { mode: 'move', id: t.id, kind: 'task', area: t.area, group: t.group };
  sheet(`<form data-submit="move"><h3>Перенести</h3><div data-slot="area">${areaBlock()}</div><div data-slot="group">${groupBlockSheet()}</div>
    <button class="btn-main" type="submit">Перенести</button></form>`);
}
function openEvent(e) {
  sheet(`<h3>${esc(e.title)}</h3><div class="rows">
    ${row2('День', long(e.date))}${row2('Время', `${e.start}–${e.end}`)}${row2('Где', [AREAS[e.area]?.name, e.group].filter(Boolean).map(esc).join(' · ') || '—')}${e.with ? row2('С кем', esc(e.with)) : ''}</div>
    <button class="del" data-act="delevent" data-id="${e.id}">Удалить</button>`);
}
function openPerson(p) {
  sh = { mode: 'person', id: p?.id || null, area: p?.area || 'work' };
  sheet(`<form data-submit="person"><h3>${p ? esc(p.name) : 'Новый человек'}</h3>
    <div class="lab">Имя</div><input class="in" name="name" value="${esc(p?.name || '')}" placeholder="Как подписан в почте или Telegram" autocomplete="off">
    <div class="lab">Кто это</div><input class="in" name="role" value="${esc(p?.role || '')}" placeholder="например, руководитель" autocomplete="off">
    <div class="lab">Откуда</div>${opts('area', [['work', 'Работа'], ['study', 'Учёба'], ['personal', 'Личное']], sh.area)}
    <button class="btn-main" type="submit">Сохранить</button>${p ? `<button class="del" type="button" data-act="delperson" data-id="${p.id}">Удалить из списка</button>` : ''}</form>`);
}
function confirmSheet(title, text, btn, act) {
  sheet(`<h3>${title}</h3><p class="txt" style="padding:0 4px">${text}</p><button class="btn-main" data-act="${act}">${btn}</button><button class="btn-ghost" data-act="close">Отмена</button>`);
}

/* ---------- actions ---------- */
function toggleDone(id) {
  const t = Store.task(id), done = !isDone(t);
  if (done) ui.hop = Date.now(); // the rabbit hops on the next screen it appears on
  if (t.daily) Store.act('daily_done', { ref: id, day: today(), done });
  else Store.act('task_done', { ref: id, done });
  if (done) (rowOf(id) || Nav.cur?.el.querySelector(`.tck[data-id="${id}"]`))?.classList.add('pop');
}
// task card: «…» menu and «Изменить» sheet
const mrow = (t, act, id) => `<div class="row2" data-act="${act}" data-id="${id}"><div class="t">${t}</div></div>`;
function openMore(t) {
  const tm = addDays(today(), 1), later = t.due === tm;
  const end = t.source?.kind === 'вручную' ? mrow('Удалить', 'del', t.id)
    : t.check && t.checkKind !== 'done' ? '' : mrow('Не задача<small>уберу в «Не стало задачами»</small>', 'mnot', t.id);
  sheet(`<div class="rows" style="margin-top:0">${mrow('Скопировать промпт<small>задача, нюансы и цитата — одним текстом</small>', 'mprompt', t.id)}
    ${t.done || t.daily ? '' : mrow(later ? 'Перенести на послезавтра' : 'Перенести на завтра', 'mlater', t.id)}
    ${mrow(`Перенести в другую ${t.area === 'study' ? 'тему' : 'группу'}`, 'mmove', t.id)}${end}</div>
    <button class="btn-ghost" data-act="close" style="margin-top:6px">Отмена</button>`);
}
function openEdit(t) {
  sh = { mode: 'edit', id: t.id };
  sheet(`<form data-submit="edit"><h3>Изменить</h3>
    <textarea class="in" name="title" rows="2" placeholder="Что нужно сделать" enterkeyhint="done">${esc(t.title)}</textarea>
    <div class="lab">Пункты</div><div class="rows eits">${t.items.map((it, i) => `<div class="eit" data-i="${i}"><input class="ein" value="${esc(it.t)}" autocomplete="off" enterkeyhint="done" aria-label="Пункт"><button type="button" class="x" data-act="edrm" aria-label="Удалить пункт">✕</button></div>`).join('')}
      <div class="eit"><input class="ein" name="newitem" placeholder="＋ Добавить пункт" autocomplete="off" enterkeyhint="done"></div></div>
    <div class="rows">${dailySwitch(t.daily)}</div>
    <button class="btn-main" type="submit">Сохранить</button></form>`);
}
const A = {
  close: closeSheet,
  back: el => back(el.dataset.to),
  mic: () => toast('Запись голосом появится чуть позже'),
  'onb-bell': async () => { try { if ('Notification' in window) await Notification.requestPermission(); } catch (e) {} Nav.intent = { anim: 'fade', stack: 'reset' }; Store.setFlag('onboarded', true); },
  'onb-later': () => { Nav.intent = { anim: 'fade', stack: 'reset' }; Store.setFlag('onboarded', true); },
  near: el => { ui.cal = el.dataset.d; ui.month = ui.cal.slice(0, 7); go('cal'); },
  chip: el => { ui.chip[el.dataset.a] = el.dataset.v; render(); },
  done: (el, e) => { e.stopPropagation(); toggleDone(el.dataset.id); },
  fold: (el, e) => { e.stopPropagation(); ui.open[el.dataset.id] = !ui.open[el.dataset.id]; render(); },
  item: (el, e) => { e.stopPropagation(); const t = Store.task(el.dataset.id), i = +el.dataset.i; Store.act('item_done', { ref: t.id, i, done: !t.items[i].done }); },
  confirm: el => { Store.act('task_confirm', { ref: el.dataset.id }); toast('Оставлено в задачах'); },
  shut: el => { const t = Store.task(el.dataset.id); toggleDone(t.id); toast('Задача закрыта'); back(t.area); },
  not: el => { const t = Store.task(el.dataset.id); Store.act('task_not', { ref: t.id }); toast('Убрано в «Не стало задачами»'); back(t.area); },
  move: el => openMove(Store.task(el.dataset.id)),
  more: el => openMore(Store.task(el.dataset.id)),
  edit: el => openEdit(Store.task(el.dataset.id)),
  edrm: el => el.closest('.eit').remove(),
  mprompt: async el => { closeSheet(); await A.prompt(el); },
  mlater: el => {
    const t = Store.task(el.dataset.id), d = addDays(today(), t.due === addDays(today(), 1) ? 2 : 1);
    closeSheet(); Store.act('task_due', { ref: t.id, due: d, time: t.time }); toast(`Перенесено на ${dayWord(d)}`);
  },
  mmove: el => { const t = Store.task(el.dataset.id); closeSheet(); setTimeout(() => openMove(t), 260); },
  mnot: el => { closeSheet(); A.not(el); },
  del: el => { sh = { del: el.dataset.id }; confirmSheet('Удалить задачу?', 'Она исчезнет совсем, в архиве её не будет.', 'Удалить', 'del-ok'); },
  'del-ok': () => {
    const t = Store.task(sh.del), row = rowOf(t.id); closeSheet();
    const kill = () => { Store.act('task_delete', { ref: t.id }); toast('Удалено'); };
    if (row) collapseRow(row).then(kill); else { kill(); back(t.area); }
  },
  prompt: async el => {
    const t = Store.task(el.dataset.id);
    const lines = ['Помоги мне с задачей.', '', `Задача: ${t.title}`];
    if (t.due) lines.push(`Срок: ${long(t.due)}${t.time ? ', ' + t.time : ''}`);
    if (t.from) lines.push(`Поручение от: ${t.from}`);
    srcAll(t).filter(s => s.kind && s.kind !== 'вручную').forEach(s => {
      lines.push(`Откуда: ${s.kind}${s.date ? ', ' + dayMon(s.date) : ''}`);
      if (s.quote) lines.push(`Цитата из источника: «${s.quote}»`);
    });
    if (t.items.length) lines.push('', 'Что нужно сделать:', ...t.items.map(i => `${i.done ? '[x]' : '[ ]'} ${i.t}`));
    toast(await copy(lines.join('\n')) ? 'Промпт скопирован' : 'Не получилось скопировать');
  },
  copyrep: async () => toast(await copy(ui.reportText) ? 'Отчёт скопирован' : 'Не получилось скопировать'),
  per: el => { ui.per = el.dataset.v; render(); },
  day: el => { ui.cal = el.dataset.d; ui.month = ui.cal.slice(0, 7); render(); },
  month: el => { const [y, m] = ui.month.split('-').map(Number); const d = new Date(y, m - 1 + +el.dataset.v, 1); ui.month = iso(d).slice(0, 7); ui.cal = ui.month === today().slice(0, 7) ? today() : iso(d); render(); },
  event: el => openEvent(Store.event(el.dataset.id)),
  delevent: el => { Store.act('event_delete', { ref: el.dataset.id }); closeSheet(); toast('Удалено'); },
  got: el => { Store.act('wait_got', { ref: el.dataset.id }); toast('Отмечено'); },
  j2task: el => { const j = S().journal.find(x => x.id === el.dataset.id); openAdd({ text: j.title.replace(/[«»]/g, ''), journal: j.id }); },
  back2task: el => { Store.act('task_back', { ref: el.dataset.id }); toast('Возвращено в задачи'); },
  arch: el => { ui.arch = el.dataset.v; render(); },
  name: () => { sh = { mode: 'name' }; sheet(`<form data-submit="name"><h3>Как к Вам обращаться</h3><input class="in" name="name" value="${esc(S().settings.name)}" autocomplete="off"><button class="btn-main" type="submit">Сохранить</button></form>`); },
  person: el => openPerson(el.dataset.id ? S().people.find(p => p.id === el.dataset.id) : null),
  delperson: el => { Store.act('person_delete', { ref: el.dataset.id }); closeSheet(); },
  cleardemo: () => confirmSheet('Стереть примерные задачи?', 'Все выдуманные задачи, встречи и люди исчезнут. Останется чистое приложение для Ваших настоящих задач.', 'Стереть', 'cleardemo-ok'),
  paste: async el => { try { const t = (await navigator.clipboard.readText()).trim(); if (t) el.previousElementSibling.value = t; } catch (e) { el.previousElementSibling.focus(); toast('Нажмите в поле и выберите «Вставить»'); } },
  ghopen: () => setTimeout(() => go('gh/paste'), 600),
  tgopen: () => setTimeout(() => go('tg/keys'), 600),
  tgback: () => { Tg.drop(); ui.scroll = {}; Nav.intent = { anim: 'pop', stack: 'reset' }; location.replace('#/settings'); },
  tgpick: el => { const id = el.dataset.id, l = ui.tgpick ||= []; l.includes(id) ? l.splice(l.indexOf(id), 1) : l.push(id); el.querySelector('.ck').classList.toggle('on', l.includes(id)); },
  tgsave: () => {
    Store.act('settings', { settings: { tg: { ...(S().settings.tg || {}), groups: ui.tgpick || [], at: Store.stamp() } } });
    Sync.collect().catch(() => {}); setTimeout(() => Sync.run(), 150e3);
    go('tg/done');
  },
  notesopen: () => setTimeout(() => go('notes/what'), 600),
  notessave: () => { Store.act('settings', { settings: { notes: { at: Store.stamp() } } }); go('notes/done'); },
  tgdone: () => { ui.tgpick = null; ui.scroll = {}; Nav.intent = { anim: 'pop', stack: 'reset' }; location.replace('#/settings'); },
  tggroup: el => { const p = S().settings.tg, id = el.dataset.id, g = (p.groups || []).filter(x => x !== id); if (g.length === (p.groups || []).length) g.push(id); Store.act('settings', { settings: { tg: { ...p, groups: g } } }); },
  tgoff: el => { const p = S().settings.tg, id = el.dataset.id, o = (p.off || []).filter(x => x !== id); if (o.length === (p.off || []).length) o.push(id); Store.act('settings', { settings: { tg: { ...p, off: o } } }); },
  ais: () => Sync.ai && aiSheet(),
  ghcopy: async () => toast(await copy(ui.ghkey) ? 'Ключ скопирован' : 'Не получилось скопировать'),
  ghstart: () => { ui.ghwasdemo = S().demo; ghStep(() => Sync.start(ui.ghp, ui.ghkey), 'gh/done'); },
  ghdone: () => { ui.ghp = ui.ghkey = null; ui.scroll = {}; Nav.intent = { anim: 'pop', stack: 'reset' }; location.replace('#/settings'); },
  ghkey: async () => sheet(`<h3>Ключ шифрования</h3><p class="txt" style="padding:0 4px">Только им открываются Ваши задачи. Храните его в «Паролях».</p>
    <div class="keybox">${Sync.cfg.key.slice(4).split('-').join(' ')}</div><button class="btn-main" data-act="ghcopykey">${COPY}Скопировать</button>`),
  ghcopykey: async () => { toast(await copy(Sync.cfg.key) ? 'Ключ скопирован' : 'Не получилось скопировать'); closeSheet(); },
  collect: async () => {
    if (ui.collecting) return;
    ui.collecting = true; toast('Запускаю проверку…');
    try { await Sync.collect(); toast(S().settings.tg?.at ? 'Проверяю почту и Telegram. Новые задачи появятся через пару минут.' : 'Проверяю почту. Новые задачи появятся через пару минут.'); setTimeout(() => Sync.run(), 150e3); }
    catch (e) { toast(e.code === 'perm' ? 'У ключа GitHub нет права запускать проверку.' : 'Не получилось — нет связи с GitHub.'); }
    finally { ui.collecting = false; }
  },
  ghoff: () => confirmSheet('Отключить хранилище?', 'Этот телефон перестанет сохранять задачи на GitHub. Задачи останутся и здесь, и в хранилище. Подключить снова можно в любой момент, понадобятся оба ключа.', 'Отключить', 'ghoff-ok'),
  'ghoff-ok': () => { closeSheet(); Sync.forget(); render(); toast('Хранилище отключено'); },
  'cleardemo-ok': () => { closeSheet(); ui.scroll = {}; Store.clearDemo(); go('home'); toast('Готово, чистый лист'); },
  demo: () => confirmSheet('Показать примерные задачи?', 'Ваши задачи, добавленные вручную, будут заменены примерными.', 'Показать', 'demo-ok'),
  'demo-ok': () => { closeSheet(); ui.scroll = {}; Store.restoreDemo(); go('home'); },
  opt: el => {
    const box = el.closest('.opts'), k = box.dataset.k, v = el.dataset.v;
    box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el));
    sh[k] = v;
    const f = el.closest('form') || layer();
    if (k === 'area') { sh.group = null; f.querySelector('[data-slot="group"]').innerHTML = groupBlockSheet(); }
    if (k === 'kind') {
      const d = f.querySelector('[name="date"]')?.value || ui.cal, tm = f.querySelector('[name="time"]')?.value;
      if (!sh.area) { sh.area = 'work'; f.querySelector('[data-slot="area"]').innerHTML = areaBlock(); }
      f.querySelector('[data-slot="group"]').innerHTML = groupBlockSheet();
      f.querySelector('[data-slot="when"]').innerHTML = whenBlock(d, tm || null, tm);
    }
    if (k === 'group') { const ng = f.querySelector('[name="newgroup"]'); if (ng) { ng.style.display = v === '+' ? 'block' : 'none'; if (v === '+') ng.focus(); } }
  },
};

const SUBMIT = {
  tgkeys: f => tgStep(async () => { Tg.keys(f.id.value, f.hash.value); go('tg/phone'); }),
  tgphone: f => tgStep(async () => { await Tg.phone(f.phone.value); go('tg/code'); }),
  tgcode: f => tgStep(async () => { if (await Tg.code(f.code.value) === 'pass') go('tg/pass'); else await tgIn(); }),
  tgpass: f => tgStep(async () => { await Tg.password(f.pass.value); await tgIn(); }),
  ghtoken: f => {
    const v = f.token.value.trim(); if (!v) { f.token.focus(); return; }
    ghStep(async () => {
      ui.ghp = await Sync.probe(v);
      // a new GitHub key for an already connected phone: the encryption key is here already
      if (ui.ghp.has && Sync.cfg?.key) { await Sync.join(ui.ghp, Sync.cfg.key); ui.ghwasdemo = false; go('gh/done'); return; }
      if (!ui.ghp.has) ui.ghkey = Sync.newKey();
      go(ui.ghp.has ? 'gh/key' : 'gh/new');
    });
  },
  ghrekey: f => { const v = f.key.value; ghStep(async () => { await Sync.rekey(v); toast('Ключ подошёл, задачи открыты.'); }, 'settings'); },
  ghjoin: f => { const v = f.key.value; ui.ghwasdemo = S().demo; ghStep(() => Sync.join(ui.ghp, v), 'gh/done'); },
  quick: f => {
    const v = f.q.value.trim(); if (!v) return;
    const r = route().name;
    if (r === 'cal') openAdd({ text: v, mode: 'cal' });
    else if (AREAS[r]) openAdd({ text: v, area: r, fixedArea: true, group: ui.chip[r] && ui.chip[r] !== 'all' ? ui.chip[r] : null });
    else openAdd({ text: v });
    f.q.value = ''; f.q.blur();
  },
  add: f => {
    const title = f.title.value.trim().replace(/\s+/g, ' ');
    if (!title) { f.title.focus(); return; }
    const date = f.date?.value || null, time = f.time?.value || null;
    if (sh.kind === 'task') {
      const daily = !!f.daily?.checked;
      if (!sh.area && daily) sh.area = 'personal'; // it lives on Главная anyway
      if (!sh.area) { toast('Выберите, куда: работа, учёба или личное'); return; }
      let group = sh.group === '+' ? (f.newgroup.value.trim() || null) : sh.group;
      if (sh.area === 'personal') group = null;
      const task = daily ? { area: sh.area, group, title, daily: true, start: date || today(), time, due: null, days: [] }
        : { area: sh.area, group, title, due: date, time: date ? time : null };
      if (sh.journal) Store.act('journal_to_task', { ref: sh.journal, task_id: Store.uid(), task });
      else Store.act('task_new', { task });
      const msg = daily ? 'Добавлено на Главную, каждый день' : `Добавлено в «${AREAS[sh.area].name}»`; // before closeSheet() forgets sh
      closeSheet(); toast(msg);
    } else {
      if (!date || !time) { toast('Укажите день и время'); return; }
      const end = f.end.value && f.end.value > time ? f.end.value : `${pad(Math.min(+time.slice(0, 2) + 1, 23))}:${time.slice(3)}`;
      Store.act('event_new', { event: { kind: sh.kind, title, date, start: time, end, area: sh.area || 'work' } });
      ui.cal = date; ui.month = date.slice(0, 7);
      closeSheet(); toast('Добавлено в календарь');
    }
  },
  edit: f => {
    const t = Store.task(sh.id), title = f.title.value.trim().replace(/\s+/g, ' ');
    if (!title) { f.title.focus(); return; }
    if (title !== t.title) Store.act('task_title', { ref: t.id, title });
    const keep = new Map([...f.querySelectorAll('.eit[data-i]')].map(r => [+r.dataset.i, r.querySelector('input').value.trim().replace(/\s+/g, ' ')]));
    // delete from the end so the other numbers stay put, then rename what is left
    for (let i = t.items.length - 1; i >= 0; i--) if (!keep.get(i)) Store.act('item_delete', { ref: t.id, i });
    [...keep].filter(([, v]) => v).sort((a, b) => a[0] - b[0]).forEach(([, v], j) => { if (t.items[j].t !== v) Store.act('item_text', { ref: t.id, i: j, text: v }); });
    const add = f.newitem.value.trim(); if (add) Store.act('item_add', { ref: t.id, text: add });
    const daily = f.daily.checked;
    if (daily !== !!t.daily) {
      Store.act('task_daily', daily ? { ref: t.id, daily, start: today(), time: t.time } : { ref: t.id, daily, due: today(), time: t.time });
      toast(daily ? 'Теперь на Главной, каждый день' : `Теперь обычная задача в «${AREAS[t.area].name}»`);
    }
    closeSheet();
  },
  move: f => {
    let group = sh.group === '+' ? (f.newgroup.value.trim() || null) : sh.group;
    if (sh.area === 'personal') group = null;
    Store.act('task_move', { ref: sh.id, area: sh.area, group }); closeSheet(); toast('Перенесено');
  },
  item: f => { const v = f.v.value.trim(); if (!v) return; Store.act('item_add', { ref: f.dataset.id, text: v }); setTimeout(() => $('.chk .add input')?.focus(), 30); },
  name: f => { const v = f.name.value.trim(); if (v) Store.act('settings', { settings: { name: v } }); closeSheet(); },
  person: f => {
    const name = f.name.value.trim(); if (!name) { f.name.focus(); return; }
    Store.act('person_save', { ref: sh.id || Store.uid(), person: { name, role: f.role.value.trim(), area: sh.area } }); closeSheet();
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-go]');
  if (!el) return;
  if (el.matches('input.over')) return;
  if (el.dataset.act) { A[el.dataset.act]?.(el, e); return; }
  go(el.dataset.go);
});
document.addEventListener('submit', e => { e.preventDefault(); const f = e.target; SUBMIT[f.dataset.submit]?.(f); });
// Enter in the title textarea adds instead of a new line
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('textarea[name="title"]')) { e.preventDefault(); e.target.form.requestSubmit(); } });
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.change === 'due') Store.act('task_due', { ref: el.dataset.id, due: el.value || null, time: Store.task(el.dataset.id).time });
  if (el.dataset.change === 'time') {
    const t = Store.task(el.dataset.id);
    if (t.daily) Store.act('task_daily', { ref: t.id, daily: true, start: t.start, time: el.value || null });
    else Store.act('task_due', { ref: t.id, due: t.due, time: el.value || null });
  }
  // «Каждый день» in the add sheet: the date becomes the first day
  if (el.name === 'daily' && el.form?.dataset.submit === 'add') {
    sh.daily = el.checked;
    const d = el.form.querySelector('[name="date"]'); if (!d) return;
    d.closest('.row2').querySelector('span').textContent = el.checked ? 'С какого дня' : 'Срок';
    if (el.checked && !d.value) { d.value = today(); d.closest('.row2').querySelector('[data-show]').textContent = fmtField('date', d.value); }
  }
  if (el.dataset.kind) { const v = el.closest('.row2').querySelector('[data-show]'); if (v) v.textContent = fmtField(el.dataset.kind, el.value); }
});
document.addEventListener('input', e => {
  if (e.target.dataset.input === 'q') {
    ui.q = e.target.value;
    const pos = e.target.selectionStart; render();
    const i = $('[data-input="q"]'); i.focus(); i.setSelectionRange(pos, pos);
  }
});
// desktop browsers: open the picker on click (iPhone opens it by itself)
document.addEventListener('click', e => { if (e.target.matches('input.over') && e.target.showPicker && !/iPhone|iPad/.test(navigator.userAgent)) try { e.target.showPicker(); } catch (x) {} }, true);


// storage status lives in Настройки; when saving breaks, say so once (TZ §10: no silent failures)
Sync.sub(() => {
  const k = Sync.st.status;
  if (GH_ERR[k] && k !== 'offline' && k !== 'busy' && Sync.st.told !== k) { Sync.st.told = k; toast(GH_ERR[k] + ' Подробнее — в Настройках.'); }
  if (k === 'ok') Sync.st.told = '';
  if (['settings', 'off', 'chats'].includes(Nav.cur?.r.name)) render();
});
