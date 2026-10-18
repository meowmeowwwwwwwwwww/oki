'use strict';
// Oki's reminders (TZ §3 «Уведомления», Даша 2026-10-18). One list of what to show and when,
// worked out from the tasks: the iPhone shell (ios/Oki/Notify.swift) puts it on the phone like alarms,
// because an app from SideStore gets no push from a server.
// Used twice, so it needs nothing from app.js: by the app itself (the newest state, every change)
// and by the collector through node (program/notify.py), for tasks it found while the app was closed.
const Notify = (() => {
  const DAYS = 8, MAX = 60; // iOS keeps at most 64 waiting notifications
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const pd = s => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
  const at = (day, hm) => `${day}T${hm}`;
  const shift = (stamp, min) => { // 'YYYY-MM-DDTHH:MM' ± minutes, local time
    const [d, t] = stamp.split('T'), [h, m] = t.split(':').map(Number), x = pd(d);
    x.setHours(h, m + min); return `${iso(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
  };
  const plural = (n, f) => f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];
  const N = (n, f) => `${n} ${plural(n, f)}`;
  const WDF = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
  const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const PTS = ['пункт', 'пункта', 'пунктов'];

  const opts = s => {
    const n = (s && s.notify) || {};
    return { morning: n.morning || '08:30', quiet: n.quiet || ['23:00', '08:00'] };
  };
  // quiet hours (Даша: «прислать беззвучно»): it still comes on time, only without sound and without lighting the screen
  const isQuiet = (stamp, q) => { const t = stamp.slice(11, 16); return q[0] > q[1] ? t >= q[0] || t < q[1] : t >= q[0] && t < q[1]; };

  const open = t => !t.notTask && !t.done && !t.daily;
  const left = t => { const n = (t.items || []).length, k = (t.items || []).filter(i => i.done).length; return { n, k }; };
  const items = t => { const { n, k } = left(t); return !n || k === n ? '' : k ? ` Осталось ${N(n - k, PTS)} из ${n}.` : ` В ней ${N(n, PTS)}.`; };
  const where = k => k === 'telegram' ? 'Telegram' : k;
  const dueWord = (t, day) => {
    if (!t.due) return '';
    if (t.due === day) return t.time ? ` — до ${t.time}` : ' — сегодня';
    if (t.due === addDays(day, 1)) return t.time ? ` — завтра до ${t.time}` : ' — завтра';
    const d = pd(t.due); return ` — до ${d.getDate()} ${MON[d.getMonth()]}`;
  };

  // reminders of one task: a day and an hour before, three days before a big one
  function forTask(t, o, out) {
    if (!open(t) || !t.due) return;
    const go = `#/task/${encodeURIComponent(t.id)}`;
    if (t.time) {
      const due = at(t.due, t.time);
      out.push({ id: `h:${t.id}`, at: shift(due, -60), title: `${t.title} — через час`, body: `Срок в ${t.time}.${items(t)}`, go });
      out.push({ id: `d:${t.id}`, at: shift(due, -1440), title: `${t.title} — завтра`, body: `Срок завтра в ${t.time}.${items(t)}`, go });
    } else {
      // only a date: no «через час», and «завтра» comes in the morning
      out.push({ id: `d:${t.id}`, at: at(addDays(t.due, -1), o.morning), title: `${t.title} — завтра`, body: `Срок завтра.${items(t)}`, go });
    }
    if (t.big) {
      const { n, k } = left(t), d = pd(t.due);
      out.push({ id: `b:${t.id}`, at: at(addDays(t.due, -3), o.morning), title: `${t.title} — через 3 дня`,
        body: `Срок в ${WDF[d.getDay()]}, ${d.getDate()} ${MONG[d.getMonth()]}.${n ? ` Готово ${k} из ${N(n, PTS)}.` : ''}`, go });
    }
  }

  function plan(data, now = new Date()) {
    const o = opts(data.settings), out = [];
    const day0 = iso(now), nowS = `${day0}T${pad(now.getHours())}:${pad(now.getMinutes())}`, end = addDays(day0, DAYS);
    const tasks = data.tasks || [], events = data.events || [];
    tasks.forEach(t => forTask(t, o, out));
    events.forEach(e => {
      if (!e.date || !e.start) return;
      const s = at(e.date, e.start), when = e.end ? `${e.start}–${e.end}` : e.start;
      out.push({ id: `eh:${e.id}`, at: shift(s, -60), title: `${e.title} — через час`, body: `В ${when}.`, go: '#/cal' });
      out.push({ id: `ed:${e.id}`, at: shift(s, -1440), title: `${e.title} — завтра`, body: `Завтра в ${when}.`, go: '#/cal' });
    });
    // «каждый день» at its time, if not done yet that day
    tasks.filter(t => t.daily && !t.notTask && t.time).forEach(t => {
      const done = d => (t.days || []).includes(d);
      for (let d = day0 > (t.start || '') ? day0 : t.start; d < end; d = addDays(d, 1)) {
        if (done(d)) continue;
        const y = addDays(d, -1), missed = d === day0 && (t.start || '') <= y && !done(y);
        out.push({ id: `r:${t.id}:${d}`, at: at(d, t.time), title: t.title, body: missed ? 'Вчера пропущено.' : `Каждый день в ${t.time}.`, go: '#/home' });
      }
    });
    // the morning plan from the rabbit
    for (let d = day0; d < end; d = addDays(d, 1)) {
      const list = tasks.filter(t => open(t) && t.due === d), ev = events.filter(e => e.date === d);
      const main = list.find(t => t.big) || list.filter(t => t.time).sort((a, b) => a.time.localeCompare(b.time))[0] || list[0];
      const what = [list.length ? N(list.length, ['задача', 'задачи', 'задач']) : '', ev.length ? N(ev.length, ['мероприятие', 'мероприятия', 'мероприятий']) : ''].filter(Boolean);
      const body = !what.length ? 'Сегодня задач со сроком нет.'
        : `Сегодня ${what.join(' и ')}.${main ? ` Главная — «${main.title}»${main.time ? ` до ${main.time}` : ''}.` : ''}`;
      out.push({ id: `m:${d}`, at: at(d, o.morning), title: 'Доброе утро', body, go: '#/home' });
    }
    return out.filter(n => n.at > nowS && n.at < end)
      .sort((a, b) => a.at.localeCompare(b.at)).slice(0, MAX)
      .map(n => Object.assign(n, { quiet: isQuiet(n.at, o.quiet) }));
  }

  // «Новая задача» (Даша: каждая отдельно): tasks the collector found in mail, Telegram or notes during the last day
  const FRESH_H = 24;
  function fresh(data, now = new Date()) {
    const since = new Date(now - FRESH_H * 36e5), s = `${iso(since)}T${pad(since.getHours())}:${pad(since.getMinutes())}`, day0 = iso(now);
    return (data.tasks || []).filter(t => t.id && !t.notTask && !t.done && t.created && t.created >= s && (t.source || {}).kind && t.source.kind !== 'вручную')
      .map(t => ({ id: t.id, created: t.created, title: 'Новая задача',
        body: `${t.title}${t.daily ? '' : dueWord(t, day0)}` + ([t.from, where(t.source.kind)].filter(Boolean).length ? `\n${[t.from, where(t.source.kind)].filter(Boolean).join(', ')}` : ''),
        go: `#/task/${encodeURIComponent(t.id)}` }));
  }
  // what the collector leaves for the shell: each new task with its own reminders
  const forShell = (data, now = new Date()) => fresh(data, now).map(f => {
    const t = data.tasks.find(x => x.id === f.id), one = plan({ tasks: [t], events: [], settings: data.settings }, now).filter(n => n.id.endsWith(':' + t.id));
    return Object.assign(f, { items: one });
  });

  return { plan, fresh, forShell, opts };
})();
if (typeof module !== 'undefined') module.exports = Notify;
