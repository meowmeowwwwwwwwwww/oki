// Примерные данные из утверждённого макета. Даты считаются от сегодняшнего дня,
// чтобы приложение всегда выглядело «живым». Стираются в Настройках.
function Sample(now) {
  const pad = n => String(n).padStart(2, '0');
  const D = n => { const d = new Date(now); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const AT = (n, hm = '12:00') => `${D(n)}T${hm}:00`;
  const it = s => s.split('|').map(x => ({ t: x.slice(1), done: x[0] === '+' }));
  let n = 0;
  const T = o => Object.assign({ id: 's' + (++n), items: [], done: false, created: AT(-3) }, o);
  const src = (kind, day, quote) => ({ kind, date: D(day), quote });

  const tasks = [
    // Работа
    T({ area: 'work', group: 'Лето', title: 'Каталог коллекции «Лето»', big: true, due: D(12), from: 'Аня',
      source: src('почта', -3, 'Нужен каталог на 24 полосы к 23-му. Сетку берём из весеннего, фото пришлю до пятницы.'),
      items: it('+Сетка из весеннего каталога|+Обложка и разворот 1–2|+Развороты 3–4|+Финальные цвета|-Развороты 5–6|-Подписи к фото|-Развороты 7–12|-Вычитка|-Отправить в типографию') }),
    T({ area: 'work', group: 'Лето', title: 'Сдать обложку', due: D(0), time: '18:00', from: 'Аня',
      source: src('почта', -2, 'Обложку жду сегодня до шести, в PDF, с вылетами.'),
      items: it('+Финальные цвета|+Шрифт заголовка|+Экспорт в PDF|-Проверить вылеты|-Отправить Ане') }),
    T({ area: 'work', group: 'Лето', title: 'Согласовать шрифты с типографией', due: D(5), from: 'Марк',
      source: src('telegram', -1, 'Даш, глянь до пятницы, какие шрифты у них есть в наличии, и согласуй с ними'),
      items: it('+Запросить список шрифтов|-Сверить с макетом|-Ответить Марку') }),
    T({ area: 'work', group: 'Лето', title: 'Отправить правки по каталогу', due: D(-1), from: 'Аня',
      source: src('почта', -4, 'Пришли, пожалуйста, правки к развороту 3–4 до среды.') }),
    T({ area: 'work', group: 'Сайт студии', title: 'Собрать референсы для главной', due: D(0), source: src('заметки', -1) }),
    T({ area: 'work', group: 'Сайт студии', title: 'Поправить шапку на мобильной версии', due: D(4), from: 'Илья',
      source: src('telegram', 0, 'Шапка на телефоне наезжает на меню, поправишь к пятнице?') }),
    T({ area: 'work', group: 'Счета и документы', title: 'Отправить счёт за сентябрь', due: D(1), from: 'Бухгалтер', source: src('почта', -2) }),
    T({ area: 'work', group: 'Счета и документы', title: 'Подписать акт для студии', source: src('почта', -1) }),
    T({ area: 'work', group: 'Конференции', title: 'Купить билеты на конференцию', from: 'Аня', check: true,
      checkWhy: 'Сомневаюсь, что это задача: в письме было «может, сходим?».',
      source: src('почта', -1, 'Видела конференцию по шрифтам в ноябре, может, сходим? Посмотри билеты') }),
    // Учёба
    T({ area: 'study', group: 'Социология', title: 'Прочитать главу 4', due: D(0), source: src('заметки', -2) }),
    T({ area: 'study', group: 'Социология', title: 'Эссе о городских сообществах', due: D(4), from: 'Ирина Павловна',
      source: src('почта', -5, 'Эссе 5–7 страниц, тема на выбор из списка, сдать до четверга.'),
      items: it('-Выбрать тему|-Найти 5 источников|-Написать черновик') }),
    T({ area: 'study', group: 'Английский', title: 'Unit 6, упражнения 3–5', due: D(1), from: 'Том', source: src('telegram', -1) }),
    T({ area: 'study', group: 'Английский', title: 'Слова к тесту', due: D(-1), done: true, doneAt: AT(-1, '21:10'), source: src('заметки', -4) }),
    T({ area: 'study', group: 'История дизайна', title: 'Презентация про Баухаус', due: D(8), source: src('почта', -2) }),
    // Личное
    T({ area: 'personal', title: 'Купить молоко', due: D(0), from: 'Мама', source: src('telegram', 0, 'Купи молока по дороге, пожалуйста') }),
    T({ area: 'personal', title: 'Забрать посылку', due: D(0), time: '20:00', source: src('заметки', -1) }),
    T({ area: 'personal', title: 'Записаться к стоматологу', due: D(3), source: src('заметки', -3) }),
    T({ area: 'personal', title: 'Подарок Лене', due: D(6), source: src('заметки', -2), items: it('-Книга|-Свеча') }),
    T({ area: 'personal', title: 'Разобрать зимние вещи', source: src('заметки', -6) }),
    // Каждый день — живут на Главной; таблетки вчера не отмечены
    T({ area: 'personal', title: 'Выпить таблетки', daily: true, start: D(-6), time: '09:00', days: [D(-6), D(-5), D(-4), D(-3), D(-2)], source: { kind: 'вручную', date: D(-6) } }),
    T({ area: 'personal', title: 'Полить цветы', daily: true, start: D(-6), days: [D(-4), D(-2), D(-1)], source: { kind: 'вручную', date: D(-6) } }),
    // Сделано — для архива и отчёта
    T({ area: 'work', group: 'Лето', title: 'Обложка и разворот 1–2', due: D(-3), done: true, doneAt: AT(-3, '17:40'), from: 'Аня', source: src('почта', -8) }),
    T({ area: 'work', group: 'Лето', title: 'Финальные цвета обложки', due: D(-2), done: true, doneAt: AT(-2, '15:05'), from: 'Аня', source: src('почта', -6) }),
    T({ area: 'work', group: 'Лето', title: 'Шрифт для обложки', due: D(-5), done: true, doneAt: AT(-5, '11:20'), from: 'Марк', source: src('telegram', -7) }),
    T({ area: 'work', group: 'Сайт студии', title: 'Референсы для главной — первая подборка', due: D(-1), done: true, doneAt: AT(-1, '19:00'), source: src('заметки', -4) }),
    T({ area: 'work', group: 'Сайт студии', title: 'Правки по шапке', due: D(-5), done: true, doneAt: AT(-4, '10:30'), from: 'Илья', source: src('telegram', -6) }),
    T({ area: 'work', group: 'Счета и документы', title: 'Счёт за август', due: D(-6), done: true, doneAt: AT(-6, '12:00'), from: 'Бухгалтер', source: src('почта', -9) }),
    T({ area: 'work', group: 'Счета и документы', title: 'Акт за август', due: D(-5), done: true, doneAt: AT(-5, '16:45'), source: src('почта', -9) }),
    T({ area: 'work', group: 'Лето', title: 'Обложка весеннего каталога — правки', due: D(-17), done: true, doneAt: AT(-17, '14:00'), from: 'Аня', source: src('почта', -19) }),
  ];

  let e = 0;
  const E = o => Object.assign({ id: 'e' + (++e) }, o);
  const events = [
    E({ kind: 'meeting', title: 'Созвон с Аней', date: D(0), start: '14:00', end: '14:30', area: 'work', group: 'Лето', with: 'Аня' }),
    E({ kind: 'meeting', title: 'Типография: забрать пробы', date: D(0), start: '14:00', end: '15:00', area: 'work', group: 'Лето' }),
    E({ kind: 'event', title: 'Открытие выставки', date: D(0), start: '19:00', end: '21:00', area: 'personal', with: 'Лена' }),
    E({ kind: 'meeting', title: 'Созвон по правкам', date: D(2), start: '11:00', end: '11:45', area: 'work', group: 'Сайт студии', with: 'Илья' }),
    E({ kind: 'meeting', title: 'Встреча с Марком', date: D(5), start: '10:00', end: '11:00', area: 'work', group: 'Лето', with: 'Марк' }),
    E({ kind: 'event', title: 'Лекция о плакате', date: D(3), start: '18:30', end: '20:00', area: 'study' }),
    E({ kind: 'event', title: 'День рождения Лены', date: D(6), start: '17:00', end: '22:00', area: 'personal', with: 'Лена' }),
    E({ kind: 'meeting', title: 'Консультация по эссе', date: D(-2), start: '16:00', end: '16:30', area: 'study', with: 'Ирина Павловна' }),
  ];

  const waiting = [
    { id: 'w1', who: 'Аня', what: 'Фото для каталога', asked: D(-3) },
    { id: 'w2', who: 'Марк', what: 'Список шрифтов в наличии', asked: D(-1) },
    { id: 'w3', who: 'Ирина Павловна', what: 'Тема эссе — подтвердить', asked: D(-5) },
  ];

  const journal = [
    { id: 'j1', src: 'почта · Маркет', at: AT(0, '12:02'), title: 'Скидки до 50% на технику', why: 'рассылка' },
    { id: 'j2', src: 'telegram · Аня', at: AT(0, '11:40'), title: '«Спасибо, получила!»', why: 'просто ответ, без просьбы' },
    { id: 'j3', src: 'telegram · Лена', at: AT(0, '09:30'), title: 'Ссылка на смешное видео', why: 'личная переписка без просьбы' },
  ];

  const P = (id, name, role, area) => ({ id, name, role, area });
  const people = [
    P('p1', 'Аня', 'руководитель', 'work'), P('p2', 'Марк', 'типография', 'work'), P('p3', 'Илья', 'Сайт студии', 'work'),
    P('p4', 'Бухгалтер', 'счета', 'work'), P('p5', 'Ирина Павловна', 'социология', 'study'), P('p6', 'Том', 'английский', 'study'),
    P('p7', 'Мама', 'семья', 'personal'), P('p8', 'Лена', 'подруга', 'personal'),
  ];

  return { tasks, events, waiting, journal, people };
}
