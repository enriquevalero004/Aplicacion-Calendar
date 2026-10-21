// Mi Calendario: interfaz al estilo Google Calendar con clases, entregas y planes personales.

const $ = (sel) => document.querySelector(sel);
const HOUR = 48; // alto en píxeles de una hora en las vistas por horas (igual que --hour)
const TIME_VIEWS = ['day', '3day', 'week'];

const SUBJECT_COLORS = [
  '#d50000', '#e67c73', '#f4511e', '#ef8f00', '#f6bf26', '#e4c441', '#c0ca33', '#9e9d24',
  '#7cb342', '#33b679', '#0b8043', '#009688', '#039be5', '#4285f4', '#3f51b5', '#7986cb',
  '#b39ddb', '#9e69af', '#8e24aa', '#ad1457', '#d81b60', '#795548', '#616161', '#a79b8e',
];

const ICONS = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
  left: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  right: 'M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  filter: 'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
};

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name]);
  path.setAttribute('fill', 'currentColor');
  svg.append(path);
  return svg;
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'style') {
      for (const [prop, value] of Object.entries(v)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, value);
        else node.style[prop] = value;
      }
    } else node[k] = v;
  }
  for (const c of [].concat(children)) {
    if (c != null && c !== false) node.append(c);
  }
  return node;
}

function colored(color) {
  return { background: color, color: textOn(color) };
}

function newId(prefix) {
  return prefix + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

function toast(msg, action) {
  const t = $('#toast');
  t.replaceChildren(msg);
  if (action) {
    const btn = el('button', { type: 'button', className: 'toast-action', textContent: action.label });
    btn.addEventListener('click', () => { t.hidden = true; action.run(); });
    t.append(btn);
  }
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, action ? 5000 : 2600);
}

function remindText(mins) {
  if (mins == null || mins < 0) return 'Sin aviso';
  if (mins === 0) return 'Aviso a la hora';
  if (mins >= 10080) return 'Aviso 1 semana antes';
  if (mins >= 1440) return `Aviso ${mins === 1440 ? '1 día' : `${mins / 1440} días`} antes`;
  if (mins >= 60) return `Aviso ${mins / 60} h antes`;
  return `Aviso ${mins} min antes`;
}

function scheduleText(subject) {
  return (subject.schedule || [])
    .map((s) => `${capitalize(WEEKDAYS_SHORT[s.day])} ${s.start}–${s.end}`)
    .join(', ');
}

// ---------- Navegación ----------

function viewDays() {
  if (state.view === 'day') return [state.date];
  if (state.view === '3day') return [0, 1, 2].map((n) => addDays(state.date, n));
  const start = startOfWeek(state.date);
  return [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(start, n));
}

function step(dir) {
  if (state.view === 'month') state.date = addMonths(state.date, dir);
  else state.date = addDays(state.date, dir * { day: 1, '3day': 3, week: 7, agenda: 7 }[state.view]);
  renderCalendarScreen();
}

function goToday() {
  state.date = todayISO();
  state.tgScroll = null;
  renderCalendarScreen();
}

function setView(view, date) {
  state.view = view;
  if (date) state.date = date;
  state.settings.view = view;
  saveSettings();
  if (state.screen !== 'calendar') showScreen('calendar');
  else renderCalendarScreen();
  closeDrawer();
}

function calendarTitle() {
  const compact = window.innerWidth < 600;
  const short = (iso) => fmtMonthShort.format(iso).replace('.', '');
  // En el móvil: "Noviembre" si es de este año; si no, "Ene 2027".
  const month = (iso) => !compact ? fmtMonthYear.format(iso)
    : iso.slice(0, 4) === todayISO().slice(0, 4) ? fmtMonth.format(iso) : `${short(iso)} ${iso.slice(0, 4)}`;
  if (!TIME_VIEWS.includes(state.view) || state.view === 'day') return month(state.date);
  const days = viewDays();
  const first = days[0];
  const last = days.at(-1);
  if (first.slice(0, 7) === last.slice(0, 7)) return month(first);
  return `${short(first)} – ${short(last)}${compact && last.slice(0, 4) === todayISO().slice(0, 4) ? '' : ` ${last.slice(0, 4)}`}`;
}

const SCREEN_TITLES = {
  tasks: 'Entregas y exámenes',
  subjects: 'Asignaturas',
  highlights: 'Destacados',
  settings: 'Ajustes',
};

function updateAppbar() {
  const onCal = state.screen === 'calendar';
  $('#cal-actions').hidden = !onCal;
  $('#btn-back').hidden = state.screen !== 'subject';
  $('#btn-menu').hidden = state.screen === 'subject';
  let title = SCREEN_TITLES[state.screen] || '';
  if (onCal) title = calendarTitle();
  if (state.screen === 'subject') title = state.subjects.find((s) => s.id === state.subjectId)?.name || '';
  $('#appbar-title').textContent = title;
  $('#btn-today').textContent = String(new Date().getDate());
  $('#view-select').value = state.view;

  document.querySelectorAll('.nav-item').forEach((b) => {
    const active = b.dataset.view
      ? onCal && b.dataset.view === state.view
      : b.dataset.screen === state.screen || (b.dataset.screen === 'subjects' && state.screen === 'subject');
    b.classList.toggle('active', active);
  });

  $('#btn-filter').classList.toggle('active', !!filterActive());

  const notifOn = 'Notification' in window && Notification.permission === 'granted';
  $('#btn-notif').classList.toggle('off', !notifOn);
  $('#btn-notif').title = notifOn ? 'Avisos activados' : 'Activar avisos';

  $('#fab').hidden = !['calendar', 'tasks', 'subject', 'highlights'].includes(state.screen);
  $('#fab-menu').hidden = true;
}

function showScreen(name, { push = true } = {}) {
  const prev = state.screen;
  state.screen = name;
  document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== `screen-${name}`; });
  if (push && prev !== name) history.pushState({ screen: name, subjectId: state.subjectId }, '');
  closeDrawer();
  renderScreen();
}

function renderScreen() {
  updateAppbar();
  renderBadge();
  renderMini();
  if (state.screen === 'calendar') renderCalendar();
  if (state.screen === 'tasks') renderTasks();
  if (state.screen === 'subjects') renderSubjects();
  if (state.screen === 'subject') renderSubjectDetail();
  if (state.screen === 'highlights') renderHighlights();
}

function renderCalendarScreen() {
  updateAppbar();
  renderMini();
  renderCalendar();
}

// ---------- Filtros ----------

function toggleHidden(list, key) {
  const hide = state.settings.hide;
  hide[list] = hide[list].includes(key) ? hide[list].filter((k) => k !== key) : [...hide[list], key];
  filterChanged();
}

function filterChanged() {
  saveSettings();
  if ($('#dlg-filter').open) renderFilterUI();
  renderDrawerPresets();
  if (state.screen === 'calendar') renderCalendarScreen();
}

function presetChip(name, small) {
  const b = el('button', { type: 'button', className: 'chip' + (currentPreset() === name ? ' on' : ''), textContent: FILTER_PRESETS[name] });
  b.addEventListener('click', () => {
    applyPreset(name);
    filterChanged();
    if (small) setView(state.view);
  });
  return b;
}

// Chip que se tacha cuando eso está oculto.
function toggleChip(label, hidden, onClick, color) {
  const b = el('button', { type: 'button', className: 'chip toggle' + (hidden ? ' off' : ''), ariaPressed: String(!hidden) }, [
    color ? el('span', { className: 'dot', style: { background: color } }) : null,
    label,
  ]);
  b.addEventListener('click', onClick);
  return b;
}

function renderFilterUI() {
  const hide = state.settings.hide;
  $('#filter-presets').replaceChildren(...Object.keys(FILTER_PRESETS).map((n) => presetChip(n)));
  $('#filter-uni').replaceChildren(
    toggleChip('Clases', hide.classes, () => { hide.classes = !hide.classes; filterChanged(); }),
    ...Object.entries(TASK_TYPES).map(([k, t]) => toggleChip(t.plural, hide.taskTypes.includes(k), () => toggleHidden('taskTypes', k))),
  );
  const groups = [];
  for (const sem of [1, 2]) {
    const subs = state.subjects.filter((s) => s.semester === sem).sort((a, b) => a.name.localeCompare(b.name));
    if (!subs.length) continue;
    groups.push(
      el('div', { className: 'filter-sem', textContent: `${sem}.º cuatrimestre` }),
      el('div', { className: 'chips' }, subs.map((s) => toggleChip(s.short || s.name, hide.subjects.includes(s.id), () => toggleHidden('subjects', s.id), s.color))),
    );
  }
  groups.push(el('div', { className: 'chips', style: { marginTop: '6px' } }, [
    toggleChip('Sin asignatura', hide.subjects.includes('none'), () => toggleHidden('subjects', 'none')),
  ]));
  $('#filter-subjects').replaceChildren(...groups);
  $('#filter-categories').replaceChildren(...Object.entries(CATEGORIES).map(([k, c]) => toggleChip(c.label, hide.categories.includes(k), () => toggleHidden('categories', k), c.color)));
  $('#filter-other').replaceChildren(toggleChip('Festivos y calendario académico', hide.academic, () => { hide.academic = !hide.academic; filterChanged(); }));
}

function openFilter() {
  closeDrawer();
  renderFilterUI();
  $('#dlg-filter').showModal();
}

function renderDrawerPresets() {
  $('#drawer-presets').replaceChildren(...Object.keys(FILTER_PRESETS).map((n) => presetChip(n, true)));
}

function renderFilterBar() {
  const active = !!filterActive();
  $('#filter-bar').hidden = !active;
  if (active) $('#filter-text').textContent = `Viendo: ${filterSummary()}`;
}

// Ver en el calendario solo lo de una asignatura.
function showOnlySubject(subject) {
  state.settings.hide = {
    classes: false,
    academic: false,
    taskTypes: [],
    categories: Object.keys(CATEGORIES),
    subjects: [...state.subjects.filter((s) => s.id !== subject.id).map((s) => s.id), 'none'],
  };
  saveSettings();
  renderDrawerPresets();
  setView(state.view === 'agenda' ? 'agenda' : 'month');
}

function openDrawer() {
  state.miniMonth = null;
  renderMini();
  $('#drawer').classList.add('open');
  $('#scrim').hidden = false;
}

function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#scrim').hidden = true;
}

function renderBadge() {
  const limit = addDays(todayISO(), 7);
  const n = state.tasks.filter((t) => !t.done && t.date <= limit).length;
  $('#badge-tasks').hidden = !n;
  $('#badge-tasks').textContent = n;
}

// ---------- Mini calendario del menú ----------

function renderMini() {
  const month = state.miniMonth || startOfMonth(state.date);
  const start = startOfWeek(month);
  const visible = state.screen === 'calendar' && TIME_VIEWS.includes(state.view) ? viewDays() : [state.date];
  const today = todayISO();

  const prev = el('button', { type: 'button', className: 'icon-btn', ariaLabel: 'Mes anterior' }, icon('left'));
  const next = el('button', { type: 'button', className: 'icon-btn', ariaLabel: 'Mes siguiente' }, icon('right'));
  prev.addEventListener('click', () => { state.miniMonth = addMonths(month, -1); renderMini(); });
  next.addEventListener('click', () => { state.miniMonth = addMonths(month, 1); renderMini(); });

  const grid = el('div', { className: 'mini-grid' }, ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => el('span', { className: 'wd', textContent: d })));
  for (let i = 0; i < 42; i++) {
    const iso = addDays(start, i);
    const b = el('button', { type: 'button', textContent: Number(iso.slice(8)) });
    if (iso.slice(0, 7) !== month.slice(0, 7)) b.classList.add('other');
    if (visible.includes(iso)) b.classList.add('in-range');
    if (iso === today) b.classList.add('today');
    b.addEventListener('click', () => {
      state.miniMonth = null;
      setView(TIME_VIEWS.includes(state.view) ? state.view : 'day', iso);
    });
    grid.append(b);
  }
  $('#mini-cal').replaceChildren(
    el('div', { className: 'mini-head' }, [el('span', { textContent: fmtMonthYear.format(month) }), el('span', { className: 'mini-nav' }, [prev, next])]),
    grid,
  );
}

// ---------- Vistas del calendario ----------

function renderCalendar() {
  renderFilterBar();
  if (TIME_VIEWS.includes(state.view)) renderTimeGrid(viewDays());
  else if (state.view === 'month') renderMonth();
  else renderAgenda();
}

// Lo hecho se pinta en blanco con el borde del color, para que siga leyéndose bien.
function itemStyle(item) {
  if (item.kind === 'academic') return {};
  return item.done ? { '--c': item.color } : colored(item.color);
}

function itemTitle(item, text) {
  return item.done ? `✓ ${text}` : text;
}

function chip(item, { withTime = true } = {}) {
  const time = item.start != null ? timeText(item.start) : item.kind === 'task' ? item.ref.time : '';
  const b = el('button', {
    type: 'button',
    className: `chip-item ${item.kind}${item.done ? ' done' : ''}`,
    textContent: itemTitle(item, (withTime && time ? `${time} ` : '') + (item.short || item.title)),
    title: item.title,
    style: itemStyle(item),
  });
  b.addEventListener('click', (e) => { e.stopPropagation(); openItem(item); });
  return b;
}

function renderTimeGrid(days) {
  const today = todayISO();
  const narrow = days.length >= 5 && window.innerWidth < 760;
  const root = el('div', { className: 'tg' + (narrow ? ' narrow' : ''), style: { '--days': days.length } });

  // Cabecera con los días
  const head = el('div', { className: 'tg-row tg-head' }, [el('span')]);
  for (const iso of days) {
    const h = el('button', { type: 'button', className: 'tg-dayhead' + (iso === today ? ' today' : '') }, [
      el('div', { className: 'wd', textContent: WEEKDAYS_SHORT[weekdayOf(iso)] }),
      el('div', { className: 'num', textContent: Number(iso.slice(8)) }),
    ]);
    h.addEventListener('click', () => setView('day', iso));
    head.append(h);
  }

  // Fila de "todo el día": entregas, festivos y planes sin hora
  const perDay = days.map((iso) => itemsOn(iso));
  const allday = el('div', { className: 'tg-row tg-allday' }, [el('span')]);
  for (const items of perDay) {
    allday.append(el('div', { className: 'cell' }, items.filter((it) => it.start == null).map((it) => chip(it, { withTime: !narrow }))));
  }

  // Rejilla de horas
  const hours = el('div', { className: 'tg-hours' });
  for (let h = 1; h < 24; h++) hours.append(el('span', { textContent: `${String(h).padStart(2, '0')}:00`, style: { top: `${h * HOUR}px` } }));
  const grid = el('div', { className: 'tg-row tg-grid' }, [hours]);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  days.forEach((iso, i) => {
    const col = el('div', { className: 'tg-col' + (iso === today ? ' today' : '') });
    for (const it of layoutTimed(perDay[i].filter((x) => x.start != null))) {
      const height = Math.max(18, ((it.end - it.start) / 60) * HOUR - 2);
      const small = height < 40;
      const block = el('div', {
        className: `block ${it.kind}${it.done ? ' done' : ''}${small ? ' short' : ''}`,
        title: it.title,
        style: {
          ...itemStyle(it),
          top: `${(it.start / 60) * HOUR}px`,
          height: `${height}px`,
          left: `calc(${(it.col / it.cols) * 100}% + 1px)`,
          width: `calc(${100 / it.cols}% - 3px)`,
        },
      }, [
        el('div', { className: 't', textContent: itemTitle(it, narrow ? it.short : it.title) }),
        small ? null : el('div', { className: 's', textContent: `${timeText(it.start)} – ${timeText(it.end)}` }),
        small || !it.sub ? null : el('div', { className: 's room', textContent: it.sub }),
      ]);
      block.addEventListener('click', (e) => { e.stopPropagation(); openItem(it); });
      col.append(block);
    }
    if (iso === today) col.append(el('div', { className: 'now-line', style: { top: `${(nowMin / 60) * HOUR}px` } }));
    // Tocar un hueco crea un evento a esa hora
    col.addEventListener('click', (e) => {
      if (e.target !== col) return;
      const mins = Math.min(Math.floor((e.offsetY / HOUR) * 2) * 30, 23 * 60);
      openEventForm(null, { date: iso, time: timeText(mins), end: timeText(Math.min(mins + 60, 23 * 60 + 59)) });
    });
    grid.append(col);
  });

  const body = el('div', { className: 'tg-body' }, [grid]);
  body.addEventListener('scroll', () => { state.tgScroll = body.scrollTop; }, { passive: true });
  root.append(head, allday, body);
  $('#cal').replaceChildren(root);

  if (state.tgScroll == null) {
    const target = days.includes(today) ? Math.max(0, nowMin - 90) : 7.5 * 60;
    state.tgScroll = (target / 60) * HOUR;
  }
  body.scrollTop = state.tgScroll;
}

function renderMonth() {
  const first = startOfMonth(state.date);
  const start = startOfWeek(first);
  const daysInMonth = new Date(Number(first.slice(0, 4)), Number(first.slice(5, 7)), 0).getDate();
  const rows = Math.ceil((weekdayOf(first) + daysInMonth) / 7);
  const today = todayISO();
  const cellHeight = ($('#cal').clientHeight - 28) / rows;
  const maxChips = Math.max(1, Math.floor((cellHeight - 28) / 17));

  const grid = el('div', { className: 'mv-grid', style: { gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` } });
  for (let i = 0; i < rows * 7; i++) {
    const iso = addDays(start, i);
    const items = itemsOn(iso);
    const shown = items.length > maxChips ? items.slice(0, maxChips - 1) : items;
    const cell = el('div', {
      className: 'mv-cell' + (iso.slice(0, 7) !== first.slice(0, 7) ? ' other' : '') + (iso === today ? ' today' : ''),
    }, [
      el('span', { className: 'num', textContent: Number(iso.slice(8)) }),
      ...shown.map((it) => chip(it, { withTime: window.innerWidth >= 760 })),
      items.length > shown.length ? el('span', { className: 'more', textContent: `${items.length - shown.length} más` }) : null,
    ]);
    cell.addEventListener('click', () => setView('day', iso));
    grid.append(cell);
  }
  $('#cal').replaceChildren(el('div', { className: 'mv' }, [
    el('div', { className: 'mv-head' }, WEEKDAYS_SHORT.map((d) => el('span', { textContent: d }))),
    grid,
  ]));
}

function agendaItem(item) {
  let time = item.start == null ? 'Todo el día' : `${timeText(item.start)} – ${timeText(item.end)}`;
  let sub = item.sub;
  if (item.kind === 'task' && item.start == null) {
    time = item.ref.time ? `Entrega antes de las ${item.ref.time}` : 'Entrega';
    sub = subjectOf(item.ref)?.name || '';
  }
  const b = el('button', {
    type: 'button',
    className: `agenda-item ${item.kind}${item.done ? ' done' : ''}`,
    style: itemStyle(item),
  }, [
    el('div', { className: 't', textContent: itemTitle(item, item.title) }),
    item.kind === 'academic' ? null : el('div', { className: 's', textContent: [time, sub].filter(Boolean).join(' · ') }),
  ]);
  b.addEventListener('click', () => openItem(item));
  return b;
}

function renderAgenda() {
  const today = todayISO();
  const span = state.agendaDays || 60;
  const list = el('div', { className: 'agenda' });
  let month = '';
  for (let i = 0; i < span; i++) {
    const iso = addDays(state.date, i);
    const items = itemsOn(iso);
    if (!items.length && iso !== today) continue;
    if (iso.slice(0, 7) !== month) {
      month = iso.slice(0, 7);
      list.append(el('div', { className: 'agenda-month', textContent: fmtMonthYear.format(iso) }));
    }
    const date = el('div', { className: 'agenda-date' }, [
      el('div', { className: 'wd', textContent: WEEKDAYS_SHORT[weekdayOf(iso)] }),
      el('div', { className: 'num', textContent: Number(iso.slice(8)) }),
    ]);
    date.addEventListener('click', () => setView('day', iso));
    list.append(el('div', { className: 'agenda-day' + (iso === today ? ' today' : '') }, [
      date,
      el('div', { className: 'agenda-items' }, items.length
        ? items.map(agendaItem)
        : [el('div', { className: 'agenda-empty', textContent: 'Nada planeado' })]),
    ]));
  }
  const more = el('button', { type: 'button', className: 'btn agenda-more', textContent: 'Mostrar más' });
  more.addEventListener('click', () => {
    const top = list.scrollTop;
    state.agendaDays = span + 60;
    renderAgenda();
    $('.agenda').scrollTop = top;
  });
  list.append(more);
  $('#cal').replaceChildren(list);
}

// ---------- Fichas de detalle ----------

function showSheet({ color, title, lines = [], badges = [], text, gallery, actions = [] }) {
  $('#sheet-body').replaceChildren(...[
    el('div', { className: 'sheet-head' }, [
      el('span', { className: 'sq', style: { background: color || 'var(--academic-bg)' } }),
      el('h3', { textContent: title }),
    ]),
    el('div', { className: 'sheet-lines' }, [
      ...lines.filter(Boolean).map((l) => el('div', { textContent: l })),
      badges.length ? el('div', { className: 'badges' }, badges.map((b) => el('span', { className: 'type-tag', textContent: b }))) : null,
    ]),
    text ? el('p', { className: 'sheet-text', textContent: text }) : null,
    gallery?.length ? el('div', { className: 'gallery' }, gallery.map((src) => el('img', { src, alt: '' }))) : null,
  ].filter(Boolean));

  const buttons = actions.map((a) => {
    const b = el('button', { type: 'button', className: 'btn' + (a.danger ? ' danger' : ''), textContent: a.label });
    b.addEventListener('click', () => { $('#dlg-sheet').close(); a.run(); });
    return b;
  });
  const close = el('button', { type: 'button', className: 'btn primary', textContent: 'Cerrar' });
  close.addEventListener('click', () => $('#dlg-sheet').close());
  $('#sheet-actions').replaceChildren(...buttons, el('span', { className: 'spacer' }), close);
  $('#dlg-sheet').showModal();
}

function openItem(item) {
  if (item.kind === 'event') openEventSheet(item.ref);
  else if (item.kind === 'class') openClassSheet(item.ref);
  else if (item.kind === 'task') openTaskSheet(item.ref);
  else toast(item.title);
}

function openEventSheet(ev) {
  const cat = categoryOf(ev);
  const time = ev.time ? `${ev.time}${ev.end ? ` – ${ev.end}` : ''}` : 'Todo el día';
  showSheet({
    color: CATEGORIES[cat].color,
    title: ev.title,
    lines: [`${fmtDayFull.format(ev.date)} · ${time}`, describeRepeat(ev), ev.place, remindText(ev.remind)],
    badges: [cat !== 'general' ? CATEGORIES[cat].label : null, isHighlighted(ev) ? 'Destacado' : null].filter(Boolean),
    text: ev.description,
    gallery: ev.photos,
    actions: [
      { label: 'Editar', run: () => openEventForm(seriesOf(ev)) },
      ev.repeat ? { label: 'Saltar este día', run: () => skipOccurrence(ev) } : null,
      { label: 'Al calendario del móvil', run: () => downloadICS(eventToICS(seriesOf(ev))) },
    ].filter(Boolean),
  });
}

async function skipOccurrence(ev) {
  const series = seriesOf(ev);
  series.skip = [...new Set([...(series.skip || []), ev.date])];
  await DB.events.put(series);
  renderScreen();
  toast(`Quitado solo el ${fmtDayMonth.format(parseISODate(ev.date))}`, {
    label: 'Deshacer',
    run: async () => {
      series.skip = series.skip.filter((d) => d !== ev.date);
      await DB.events.put(series);
      renderScreen();
    },
  });
}

function openClassSheet(c) {
  const { subject, slot, date } = c;
  const swap = ACADEMIC.swaps[date];
  const room = slot.room || subject.room;
  showSheet({
    color: subject.color,
    title: subject.name,
    lines: [
      `${fmtDayFull.format(date)} · ${slot.start} – ${slot.end}`,
      swap != null ? `Este día se sigue el horario del ${WEEKDAYS[swap]}` : '',
      roomText(room),
      `Clase · ${subject.semester}.º cuatrimestre`,
      subject.teachers?.length ? subject.teachers.join(' · ') : '',
    ],
    actions: [
      { label: 'Ver asignatura', run: () => openSubject(subject.id) },
      { label: 'Añadir entrega', run: () => openTaskForm(null, { subjectId: subject.id }) },
      { label: 'No hay clase este día', danger: true, run: () => cancelClass(subject, date) },
    ],
  });
}

async function cancelClass(subject, date) {
  subject.cancelled = [...new Set([...(subject.cancelled || []), date])];
  await DB.subjects.put(subject);
  renderScreen();
  toast('Clase quitada de ese día', {
    label: 'Deshacer',
    run: async () => {
      subject.cancelled = subject.cancelled.filter((d) => d !== date);
      await DB.subjects.put(subject);
      renderScreen();
    },
  });
}

function taskWhen(t) {
  const timed = TASK_TYPES[t.type]?.timed;
  const time = t.time ? (timed ? ` · ${t.time}${t.end ? ` – ${t.end}` : ''}` : ` · antes de las ${t.time}`) : '';
  return `${fmtDayFull.format(t.date)}${time}`;
}

function openTaskSheet(t) {
  const subject = subjectOf(t);
  showSheet({
    color: taskColor(t),
    title: taskLabel(t),
    lines: [
      [TASK_TYPES[t.type]?.label, subject?.name].filter(Boolean).join(' · '),
      `${taskWhen(t)} · ${t.done ? 'Hecha' : relativeDay(t.date)}`,
      t.place ? `Lugar: ${t.place}` : '',
      t.done ? '' : remindText(t.remind),
      t.grade ? `Nota: ${t.grade}` : '',
    ],
    text: t.notes,
    actions: [
      { label: t.done ? 'Marcar pendiente' : 'Marcar como hecha', run: () => toggleTask(t) },
      { label: 'Editar', run: () => openTaskForm(t) },
      { label: 'Al calendario del móvil', run: () => downloadICS(taskToICS(t)) },
    ],
  });
}

async function toggleTask(t) {
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  await DB.tasks.put(t);
  renderScreen();
  toast(t.done ? 'Marcada como hecha' : 'Marcada como pendiente', { label: 'Deshacer', run: () => toggleTask(t) });
}

// ---------- Entregas y exámenes ----------

function taskRow(t, { showSubject = true } = {}) {
  const subject = subjectOf(t);
  const diff = daysBetween(todayISO(), t.date);
  const check = el('button', { type: 'button', className: 'task-check', ariaLabel: t.done ? 'Marcar pendiente' : 'Marcar como hecha' }, icon('check'));
  check.addEventListener('click', (e) => { e.stopPropagation(); toggleTask(t); });
  const row = el('div', { className: 'task-row' + (t.done ? ' done' : ''), style: { '--c': taskColor(t) } }, [
    check,
    el('div', { className: 'task-info' }, [
      el('div', { className: 'task-title', textContent: t.title || subject?.name || TASK_TYPES[t.type]?.label || '' }),
      el('div', { className: 'task-sub' }, [
        el('span', { className: `type-tag ${t.type}`, textContent: TASK_TYPES[t.type]?.label || 'Entrega' }),
        showSubject && subject ? el('span', { className: 'dot', style: { background: subject.color } }) : null,
        [showSubject ? subject?.name : null, t.grade ? `Nota: ${t.grade}` : null].filter(Boolean).join(' · '),
      ]),
    ]),
    el('div', { className: 'task-when' + (!t.done && diff < 0 ? ' overdue' : !t.done && diff <= 2 ? ' soon' : '') }, [
      el('b', { textContent: t.done ? fmtDayShort.format(t.date) : relativeDay(t.date) }),
      t.done ? null : el('span', { className: 'muted', textContent: `${fmtDayShort.format(t.date)}${t.time ? ` · ${t.time}` : ''}` }),
    ]),
  ]);
  row.addEventListener('click', () => openTaskSheet(t));
  return row;
}

function subjectOptions(select, { all = false, none = false, selected = '' } = {}) {
  const opts = [];
  if (all) opts.push(el('option', { value: 'all', textContent: 'Todas las asignaturas' }));
  if (none) opts.push(el('option', { value: '', textContent: 'Sin asignatura' }));
  for (const sem of [1, 2]) {
    const subs = state.subjects.filter((s) => s.semester === sem).sort((a, b) => a.name.localeCompare(b.name));
    if (subs.length) opts.push(el('optgroup', { label: `${sem}.º cuatrimestre` }, subs.map((s) => el('option', { value: s.id, textContent: s.name }))));
  }
  select.replaceChildren(...opts);
  select.value = selected;
}

function renderTasks() {
  const f = state.taskFilter;
  document.querySelectorAll('[data-status]').forEach((b) => b.classList.toggle('on', b.dataset.status === f.status));
  subjectOptions($('#task-subject-filter'), { all: true, selected: f.subject });

  const today = todayISO();
  const list = state.tasks.filter((t) => f.subject === 'all' || t.subjectId === f.subject).sort(taskSort);
  const pending = list.filter((t) => !t.done);
  const done = list.filter((t) => t.done).reverse();
  const out = [];
  const group = (title, items) => {
    if (!items.length) return;
    out.push(el('div', { className: 'section-title', textContent: `${title} (${items.length})` }), ...items.map((t) => taskRow(t)));
  };

  if (f.status !== 'done') {
    group('Atrasadas', pending.filter((t) => t.date < today));
    group('Próximos 7 días', pending.filter((t) => t.date >= today && daysBetween(today, t.date) <= 7));
    group('Este mes', pending.filter((t) => daysBetween(today, t.date) > 7 && daysBetween(today, t.date) <= 31));
    group('Más adelante', pending.filter((t) => daysBetween(today, t.date) > 31));
  }
  if (f.status !== 'pending') group('Hechas', done);
  if (!out.length) {
    out.push(el('div', {
      className: 'empty',
      textContent: f.status === 'done' ? 'Todavía no has marcado nada como hecho.' : 'No tienes nada pendiente. Pulsa + para añadir un examen o una entrega.',
    }));
  }
  $('#task-list').replaceChildren(...out);
}

// ---------- Asignaturas ----------

function currentSemester() {
  const today = todayISO();
  return semesterOn(today) || (today < ACADEMIC.semesters['2'].start ? 1 : 2);
}

function renderSubjects() {
  const current = currentSemester();
  const out = [];
  for (const sem of [1, 2]) {
    const subs = state.subjects
      .filter((s) => s.semester === sem)
      .sort((a, b) => (a.schedule?.[0]?.day ?? 9) - (b.schedule?.[0]?.day ?? 9) || (a.schedule?.[0]?.start || '').localeCompare(b.schedule?.[0]?.start || ''));
    if (!subs.length) continue;
    out.push(el('div', { className: 'section-title' }, [`${sem}.º cuatrimestre`, sem === current ? el('span', { className: 'now-tag', textContent: 'Ahora' }) : null]));
    for (const s of subs) {
      const pending = state.tasks.filter((t) => t.subjectId === s.id && !t.done).sort(taskSort);
      const card = el('div', { className: 'subject-card' }, [
        el('span', { className: 'bar', style: { background: s.color } }),
        el('div', { className: 'info' }, [
          el('div', { className: 'name', textContent: s.name }),
          el('div', { className: 'meta', textContent: [scheduleText(s), roomText(s.room)].filter(Boolean).join(' · ') || 'Sin horario' }),
          el('div', { className: 'pending' }, pending.length
            ? [el('b', { textContent: `${pending.length} pendiente${pending.length > 1 ? 's' : ''}` }), ` · próxima: ${taskLabel(pending[0])}, ${fmtDayShort.format(pending[0].date)}`]
            : [el('span', { className: 'muted', textContent: 'Nada pendiente' })]),
        ]),
      ]);
      card.addEventListener('click', () => openSubject(s.id));
      out.push(card);
    }
  }
  $('#subject-list').replaceChildren(...out);
}

function openSubject(id) {
  state.subjectId = id;
  showScreen('subject');
}

function infoCard(rows) {
  return el('div', { className: 'card' }, [el('ul', { className: 'info-list' }, rows)]);
}

function renderSubjectDetail() {
  const s = state.subjects.find((x) => x.id === state.subjectId);
  if (!s) { showScreen('subjects', { push: false }); return; }
  const tasks = state.tasks.filter((t) => t.subjectId === s.id).sort(taskSort);
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const addBtn = el('button', { type: 'button', className: 'btn', textContent: 'Añadir entrega o examen' });
  addBtn.addEventListener('click', () => openTaskForm(null, { subjectId: s.id }));
  const editBtn = el('button', { type: 'button', className: 'btn', textContent: 'Editar' });
  editBtn.addEventListener('click', () => openSubjectForm(s));
  const calBtn = el('button', { type: 'button', className: 'btn', textContent: 'Ver en el calendario' });
  calBtn.addEventListener('click', () => showOnlySubject(s));
  const row = (a, b) => el('li', {}, [el('span', { textContent: a }), el('span', { className: 'muted', textContent: b })]);

  const next = nextClasses(s, 3);
  $('#subject-detail').replaceChildren(...[
    el('div', { className: 'subject-hero', style: colored(s.color) }, [
      el('h2', { textContent: s.name }),
      el('div', { className: 'meta', textContent: [s.code, `${s.semester}.º cuatrimestre`, roomText(s.room)].filter(Boolean).join(' · ') }),
      el('div', { className: 'actions' }, [addBtn, calBtn, editBtn]),
    ]),
    el('div', { className: 'section-title', textContent: `Pendientes (${pending.length})` }),
    ...(pending.length
      ? pending.map((t) => taskRow(t, { showSubject: false }))
      : [el('div', { className: 'empty', textContent: 'Nada pendiente. Añade aquí exámenes, trabajos, entregables o prácticas.' })]),
    el('div', { className: 'section-title', textContent: 'Próximas clases' }),
    infoCard(next.length
      ? next.map((c) => row(fmtDayLong.format(c.date), `${c.slot.start} – ${c.slot.end}`))
      : [el('li', { className: 'muted', textContent: 'No quedan clases este curso.' })]),
    el('div', { className: 'section-title', textContent: 'Horario semanal' }),
    infoCard((s.schedule || []).length
      ? s.schedule.map((sl) => row(capitalize(WEEKDAYS[sl.day]), `${sl.start} – ${sl.end}`))
      : [el('li', { className: 'muted', textContent: 'Sin horario. Edita la asignatura para añadirlo.' })]),
    s.teachers?.length ? el('div', { className: 'section-title', textContent: 'Profesores' }) : null,
    s.teachers?.length ? infoCard(s.teachers.map((t) => el('li', { textContent: t }))) : null,
    done.length ? el('details', { className: 'done-list' }, [el('summary', { textContent: `Hechas (${done.length})` }), ...done.map((t) => taskRow(t, { showSubject: false }))]) : null,
  ].filter(Boolean));
}

// ---------- Destacados ----------

function renderHighlights() {
  const options = [['all', 'Todos'], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.label])];
  $('#highlight-filters').replaceChildren(...options.map(([key, label]) => {
    const b = el('button', { type: 'button', className: 'chip' + (state.highlightFilter === key ? ' on' : ''), textContent: label });
    b.addEventListener('click', () => { state.highlightFilter = key; renderHighlights(); });
    return b;
  }));
  const plans = state.events
    .filter((e) => isHighlighted(e) && (state.highlightFilter === 'all' || categoryOf(e) === state.highlightFilter))
    .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  if (!plans.length) {
    $('#highlight-list').replaceChildren(el('div', {
      className: 'empty',
      textContent: state.highlightFilter === 'all'
        ? 'Aún no hay planes destacados. Al crear o editar un evento, activa “Destacar este plan”.'
        : 'No hay planes destacados de este tipo.',
    }));
    return;
  }
  $('#highlight-list').replaceChildren(...plans.map((ev) => {
    const cat = categoryOf(ev);
    const card = el('article', { className: 'highlight', style: { '--c': CATEGORIES[cat].color } }, [
      ev.photos?.length ? el('img', { className: 'cover', src: ev.photos[0], alt: '' }) : null,
      el('div', { className: 'body' }, [
        el('div', { className: 'date', textContent: [fmtDayFull.format(ev.date) + (ev.time ? ` · ${ev.time}` : ''), cat !== 'general' ? CATEGORIES[cat].label : ''].filter(Boolean).join(' · ') }),
        el('h4', { textContent: ev.title }),
        ev.description ? el('p', { textContent: ev.description }) : null,
        ev.photos?.length > 1 ? el('p', { textContent: `${ev.photos.length} fotos` }) : null,
      ]),
    ]);
    card.addEventListener('click', () => openEventSheet(ev));
    return card;
  }));
}

// ---------- Formulario de evento ----------

let draftPhotos = [];
let editingEvent = null;

function openEventForm(ev = null, preset = {}) {
  editingEvent = ev;
  const f = $('#form-event');
  f.reset();
  $('#event-form-title').textContent = ev ? 'Editar evento' : 'Nuevo evento';
  f.title.value = ev?.title || '';
  f.date.value = ev?.date || preset.date || (state.screen === 'calendar' ? state.date : todayISO());
  f.time.value = ev?.time ?? preset.time ?? '';
  f.end.value = ev?.end ?? preset.end ?? '';
  f.place.value = ev?.place || '';
  f.remind.value = String(ev?.remind ?? 30);
  f.description.value = ev?.description || '';
  f.category.value = ev ? categoryOf(ev) : preset.category || 'general';
  f.highlight.checked = ev ? isHighlighted(ev) : !!preset.highlight;
  const days = ev?.repeat?.days || [weekdayOf(f.date.value)];
  f.repeat.value = !ev?.repeat ? 'none' : days.length === 7 ? 'daily' : 'weekly';
  for (const box of f.days) box.checked = days.includes(Number(box.value));
  f.until.value = ev?.repeat?.until || '';
  updateRepeatUI();
  draftPhotos = [...(ev?.photos || [])];
  renderDraftPhotos();
  $('#btn-delete-event').hidden = !ev;
  $('#dlg-event').returnValue = '';
  $('#dlg-event').showModal();
}

function updateRepeatUI() {
  const f = $('#form-event');
  $('#repeat-block').hidden = f.repeat.value === 'none';
  $('#weekday-picker').hidden = f.repeat.value !== 'weekly';
}

function readRepeat(f) {
  if (f.repeat.value === 'none') return null;
  let days = f.repeat.value === 'daily'
    ? [0, 1, 2, 3, 4, 5, 6]
    : [...f.days].filter((b) => b.checked).map((b) => Number(b.value));
  if (!days.length) days = [weekdayOf(f.date.value)];
  const until = f.until.value && f.until.value >= f.date.value ? f.until.value : '';
  return { days, until };
}

function renderDraftPhotos() {
  $('#photo-preview').replaceChildren(...draftPhotos.map((src, i) => {
    const rm = el('button', { type: 'button', className: 'rm', textContent: '×', ariaLabel: 'Quitar foto' });
    rm.addEventListener('click', () => { draftPhotos.splice(i, 1); renderDraftPhotos(); });
    return el('div', { className: 'ph' }, [el('img', { src, alt: '' }), rm]);
  }));
}

// Reduce la foto para que no ocupe demasiado en el dispositivo.
function resizeImage(file, max = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

async function saveEvent() {
  const f = $('#form-event');
  const prev = editingEvent;
  const time = f.time.value;
  const ev = {
    ...(prev || {}),
    id: prev?.id || newId('e-'),
    title: f.title.value.trim(),
    date: f.date.value,
    time,
    end: time && f.end.value > time ? f.end.value : '',
    place: f.place.value.trim(),
    remind: Number(f.remind.value),
    description: f.description.value.trim(),
    category: f.category.value,
    highlight: f.highlight.checked,
    photos: draftPhotos,
    repeat: readRepeat(f),
    createdAt: prev?.createdAt || Date.now(),
  };
  delete ev.couple;
  ev.skip = ev.repeat && prev?.repeat ? prev.skip || [] : [];
  // Si cambia la hora o el aviso, se vuelve a avisar.
  const sameReminder = prev && prev.date === ev.date && prev.time === ev.time && prev.remind === ev.remind && !!prev.repeat === !!ev.repeat;
  ev.notified = sameReminder ? !!prev.notified : false;
  ev.notifiedDates = sameReminder ? prev.notifiedDates || [] : [];

  await DB.events.put(ev);
  state.events = state.events.filter((e) => e.id !== ev.id).concat(ev);
  renderScreen();
  toast(prev ? 'Evento actualizado' : 'Evento guardado');
  checkReminders();
}

// ---------- Formulario de entrega ----------

let editingTask = null;
let remindTouched = false;

function updateTaskTypeUI() {
  const f = $('#form-task');
  const timed = TASK_TYPES[f.type.value]?.timed;
  $('#task-end-wrap').hidden = !timed;
  $('#task-place-wrap').hidden = !timed;
  $('#task-time-label').textContent = timed ? 'Hora' : 'Hora límite';
  if (!editingTask && !remindTouched) f.remind.value = timed ? '2880' : '1440';
}

function openTaskForm(task = null, preset = {}) {
  editingTask = task;
  remindTouched = false;
  const f = $('#form-task');
  f.reset();
  $('#task-form-title').textContent = task ? 'Editar entrega' : 'Nueva entrega o examen';
  subjectOptions(f.subject, { none: true, selected: task?.subjectId ?? preset.subjectId ?? (state.screen === 'subject' ? state.subjectId : '') });
  f.type.value = task?.type || preset.type || 'trabajo';
  f.title.value = task?.title || '';
  f.date.value = task?.date || preset.date || (state.screen === 'calendar' ? state.date : todayISO());
  f.time.value = task?.time || '';
  f.end.value = task?.end || '';
  f.place.value = task?.place || '';
  f.notes.value = task?.notes || '';
  f.done.checked = !!task?.done;
  f.grade.value = task?.grade || '';
  updateTaskTypeUI();
  if (task) f.remind.value = String(task.remind ?? 1440);
  $('#task-done-wrap').hidden = !task;
  $('#btn-delete-task').hidden = !task;
  $('#dlg-task').returnValue = '';
  $('#dlg-task').showModal();
}

async function saveTask() {
  const f = $('#form-task');
  const prev = editingTask;
  const timed = TASK_TYPES[f.type.value]?.timed;
  const t = {
    ...(prev || {}),
    id: prev?.id || newId('t-'),
    subjectId: f.subject.value,
    type: f.type.value,
    title: f.title.value.trim(),
    date: f.date.value,
    time: f.time.value,
    end: timed && f.time.value && f.end.value > f.time.value ? f.end.value : '',
    place: timed ? f.place.value.trim() : '',
    remind: Number(f.remind.value),
    notes: f.notes.value.trim(),
    done: prev ? f.done.checked : false,
    grade: prev ? f.grade.value.trim() : '',
    createdAt: prev?.createdAt || Date.now(),
  };
  const sameReminder = prev && prev.date === t.date && prev.time === t.time && prev.remind === t.remind;
  t.notified = sameReminder ? !!prev.notified : false;

  await DB.tasks.put(t);
  state.tasks = state.tasks.filter((x) => x.id !== t.id).concat(t);
  renderScreen();
  toast(prev ? 'Entrega actualizada' : 'Entrega guardada');
  checkReminders();
}

// ---------- Formulario de asignatura ----------

let editingSubject = null;
let draftColor = SUBJECT_COLORS[0];

function renderSwatches() {
  $('#subject-colors').replaceChildren(...SUBJECT_COLORS.map((c) => {
    const b = el('button', { type: 'button', className: c === draftColor ? 'on' : '', style: { background: c }, ariaLabel: `Color ${c}` });
    b.addEventListener('click', () => { draftColor = c; renderSwatches(); });
    return b;
  }));
}

function slotRow(slot = { day: 0, start: '09:00', end: '11:00' }) {
  const day = el('select', { ariaLabel: 'Día' }, WEEKDAYS.map((d, i) => el('option', { value: i, textContent: capitalize(d) })));
  day.value = String(slot.day);
  const start = el('input', { type: 'time', value: slot.start, ariaLabel: 'Empieza' });
  const end = el('input', { type: 'time', value: slot.end, ariaLabel: 'Termina' });
  const rm = el('button', { type: 'button', className: 'icon-btn', ariaLabel: 'Quitar clase' }, icon('close'));
  const row = el('div', { className: 'slot-row' }, [day, start, end, rm]);
  rm.addEventListener('click', () => row.remove());
  return row;
}

function openSubjectForm(subject = null) {
  editingSubject = subject;
  const f = $('#form-subject');
  f.reset();
  $('#subject-form-title').textContent = subject ? 'Editar asignatura' : 'Nueva asignatura';
  f.name.value = subject?.name || '';
  f.short.value = subject?.short || '';
  f.code.value = subject?.code || '';
  f.semester.value = String(subject?.semester || currentSemester());
  f.room.value = subject?.room || '';
  f.teachers.value = (subject?.teachers || []).join('\n');
  const used = new Set(state.subjects.map((s) => s.color));
  draftColor = subject?.color || SUBJECT_COLORS.find((c) => !used.has(c)) || SUBJECT_COLORS[0];
  renderSwatches();
  $('#schedule-rows').replaceChildren(...(subject?.schedule || []).map(slotRow));
  $('#btn-delete-subject').hidden = !subject;
  $('#dlg-subject').returnValue = '';
  $('#dlg-subject').showModal();
}

async function saveSubject() {
  const f = $('#form-subject');
  const prev = editingSubject;
  const schedule = [...$('#schedule-rows').children].map((row) => {
    const [day, start, end] = row.querySelectorAll('select, input');
    return { day: Number(day.value), start: start.value, end: end.value };
  }).filter((s) => s.start && s.end && s.end > s.start).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  const s = {
    ...(prev || {}),
    id: prev?.id || newId('s-'),
    name: f.name.value.trim(),
    short: f.short.value.trim() || f.name.value.trim(),
    code: f.code.value.trim(),
    semester: Number(f.semester.value),
    room: f.room.value.trim(),
    color: draftColor,
    teachers: f.teachers.value.split('\n').map((x) => x.trim()).filter(Boolean),
    schedule,
  };
  await DB.subjects.put(s);
  state.subjects = state.subjects.filter((x) => x.id !== s.id).concat(s);
  renderScreen();
  toast(prev ? 'Asignatura actualizada' : 'Asignatura creada');
}

// ---------- Notificaciones ----------

let swReg = null;

async function notify(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const options = { body, tag, icon: 'icon.svg', badge: 'icon.svg' };
  try {
    if (swReg) await swReg.showNotification(title, options);
    else new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

async function requestNotifications() {
  if (!('Notification' in window)) {
    toast('Este navegador no permite avisos. En iPhone, instala la app en la pantalla de inicio.');
    return;
  }
  if (Notification.permission === 'denied') {
    toast('Los avisos están bloqueados. Actívalos en los ajustes del navegador.');
    return;
  }
  const res = await Notification.requestPermission();
  updateAppbar();
  if (res === 'granted') {
    toast('Avisos activados');
    checkReminders();
  }
}

function describeWhen(start, hasTime, now) {
  const days = daysBetween(toISODate(now), toISODate(start));
  const hhmm = timeText(start.getHours() * 60 + start.getMinutes());
  if (!hasTime) return days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`;
  const mins = Math.round((start - now) / 60000);
  if (mins < -1) return `Empezó a las ${hhmm}`;
  if (mins <= 0) return `Ahora (${hhmm})`;
  if (mins < 60) return `En ${mins} min (${hhmm})`;
  if (days === 0) return `Hoy a las ${hhmm}`;
  if (days === 1) return `Mañana a las ${hhmm}`;
  return `El ${WEEKDAYS[weekdayOf(toISODate(start))]} ${start.getDate()} a las ${hhmm}`;
}

// 'wait' si aún no toca avisar, 'now' si toca y 'late' si ya pasó hace rato.
function due(start, remind, now) {
  if (now < start.getTime() - remind * 60000) return 'wait';
  return now - start > 60 * 60000 ? 'late' : 'now';
}

async function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const today = toISODate(now);

  // Planes personales
  for (const series of state.events) {
    if (series.remind < 0) continue;
    const dates = series.repeat
      ? [addDays(today, -1), today, addDays(today, 1)].filter((d) => occursOn(series, d))
      : [series.date];
    for (const date of dates) {
      const done = series.repeat ? (series.notifiedDates || []).includes(date) : series.notified;
      if (done) continue;
      const start = dateAt(date, series.time);
      const status = due(start, series.remind, now);
      if (status === 'wait') continue;
      const cat = categoryOf(series);
      const sent = status === 'now' && await notify(
        series.title,
        [cat !== 'general' ? CATEGORIES[cat].label : '', describeWhen(start, !!series.time, now), series.place].filter(Boolean).join(' · '),
        `${series.id}-${date}`,
      );
      if (sent || status === 'late') {
        if (series.repeat) series.notifiedDates = [...(series.notifiedDates || []), date].slice(-10);
        else series.notified = true;
        await DB.events.put(series);
      }
    }
  }

  // Entregas y exámenes
  for (const t of state.tasks) {
    if (t.done || t.notified || t.remind < 0) continue;
    const start = dateAt(t.date, t.time);
    const status = due(start, t.remind, now);
    if (status === 'wait') continue;
    const title = taskFullTitle(t);
    const subject = subjectOf(t)?.name;
    const when = describeWhen(start, !!t.time, now);
    const sent = status === 'now' && await notify(
      title,
      [title.includes(subject) ? '' : subject, TASK_TYPES[t.type]?.timed ? when : `Se entrega: ${when.toLowerCase()}`].filter(Boolean).join(' · '),
      t.id,
    );
    if (sent || status === 'late') {
      t.notified = true;
      await DB.tasks.put(t);
    }
  }

  // Clases de hoy
  const before = Number(state.settings.classRemind);
  if (before >= 0) {
    const sentKey = 'mi-calendario-clases-avisadas';
    let sent = [];
    try { sent = JSON.parse(localStorage.getItem(sentKey) || '[]'); } catch { /* vacío */ }
    for (const c of classesOn(today)) {
      const key = `${c.subject.id}|${today}|${c.slot.start}`;
      if (sent.includes(key)) continue;
      const start = dateAt(today, c.slot.start);
      if (now < start.getTime() - before * 60000 || now - start > 10 * 60000) continue;
      const room = c.slot.room || c.subject.room;
      if (await notify(c.subject.name, [`Clase a las ${c.slot.start}`, roomText(room)].filter(Boolean).join(' · '), key)) sent.push(key);
    }
    try { localStorage.setItem(sentKey, JSON.stringify(sent.slice(-40))); } catch { /* sin almacenamiento */ }
  }
}

async function dailySummary() {
  const today = todayISO();
  if (!state.settings.summary || state.settings.lastSummary === today) return;
  const items = itemsOn(today).filter((it) => it.kind !== 'academic' && !it.done);
  if (!items.length) return;
  const lines = items.map((it) => {
    if (it.kind === 'task' && it.start == null) return `Entrega: ${it.short}${it.ref.time ? ` (antes de las ${it.ref.time})` : ''}`;
    return `${it.start == null ? 'Todo el día' : timeText(it.start)} · ${it.title}`;
  });
  const classes = items.filter((it) => it.kind === 'class').length;
  const others = items.length - classes;
  const parts = [classes ? `${classes} clase${classes > 1 ? 's' : ''}` : '', others ? `${others} cosa${others > 1 ? 's' : ''} más` : ''].filter(Boolean);
  if (await notify(`Hoy: ${parts.join(' y ')}`, lines.join('\n'), `resumen-${today}`)) {
    state.settings.lastSummary = today;
    saveSettings();
  }
}

// ---------- Exportar al calendario del móvil (.ics) ----------

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

function icsStamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

const ICS_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function eventToICS(series) {
  // En un plan repetido, el primer día tiene que caer en uno de los días elegidos.
  let date = series.date;
  if (series.repeat) while (!series.repeat.days.includes(weekdayOf(date))) date = addDays(date, 1);
  return {
    uid: series.id, title: series.title, date, time: series.time, end: series.end,
    description: series.description, place: series.place, remind: series.remind,
    repeat: series.repeat, skip: series.skip,
  };
}

function taskToICS(t) {
  const subject = subjectOf(t);
  return {
    uid: t.id,
    title: taskFullTitle(t),
    date: t.date,
    time: t.time,
    end: TASK_TYPES[t.type]?.timed ? t.end : '',
    description: [subject?.name, t.notes].filter(Boolean).join('\n'),
    place: t.place,
    remind: t.remind,
  };
}

function downloadICS(item) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mi Calendario//ES', 'BEGIN:VEVENT',
    `UID:${item.uid}@mi-calendario`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
  ];
  if (item.time) {
    const start = dateAt(item.date, item.time);
    const end = item.end ? dateAt(item.date, item.end) : new Date(start.getTime() + 3600000);
    lines.push(`DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${item.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(item.date, 1).replace(/-/g, '')}`);
  }
  lines.push(`SUMMARY:${icsEscape(item.title)}`);
  if (item.description) lines.push(`DESCRIPTION:${icsEscape(item.description)}`);
  if (item.place) lines.push(`LOCATION:${icsEscape(item.place)}`);
  if (item.repeat) {
    const until = item.repeat.until ? `;UNTIL=${item.repeat.until.replace(/-/g, '')}T235959` : '';
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${item.repeat.days.map((d) => ICS_DAYS[d]).join(',')}${until}`);
    for (const day of item.skip || []) {
      lines.push(item.time ? `EXDATE:${icsStamp(dateAt(day, item.time))}` : `EXDATE;VALUE=DATE:${day.replace(/-/g, '')}`);
    }
  }
  if (item.remind >= 0) {
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(item.title)}`, `TRIGGER:-PT${item.remind}M`, 'END:VALARM');
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  download(`${item.title.replace(/[^\w\- ]+/g, '').trim() || 'evento'}.ics`, lines.join('\r\n'), 'text/calendar');
}

function download(name, content, type) {
  const a = el('a', { href: URL.createObjectURL(new Blob([content], { type })), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ---------- Copia de seguridad ----------

function exportBackup() {
  const data = { version: 2, events: state.events, subjects: state.subjects, tasks: state.tasks };
  download(`mi-calendario-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json');
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.events)) throw new Error();
    const valid = (x) => x && typeof x.id === 'string';
    const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    let count = 0;
    for (const ev of data.events) if (valid(ev) && isDate(ev.date)) { await DB.events.put(ev); count++; }
    for (const s of data.subjects || []) if (valid(s) && s.name) { await DB.subjects.put(s); count++; }
    for (const t of data.tasks || []) if (valid(t) && isDate(t.date)) { await DB.tasks.put(t); count++; }
    await loadData();
    renderScreen();
    toast(`Importados ${count} elementos`);
  } catch {
    toast('Ese archivo no es una copia válida');
  }
}

// ---------- Datos ----------

async function loadData() {
  [state.events, state.subjects, state.tasks] = await Promise.all([DB.events.all(), DB.subjects.all(), DB.tasks.all()]);
}

// Añade las asignaturas y entregas iniciales que aún no estén (y no se hayan borrado a propósito).
async function seed() {
  const s = state.settings;
  for (const subject of SEED_SUBJECTS) {
    if (s.seededSubjects.includes(subject.id)) continue;
    if (!state.subjects.some((x) => x.id === subject.id)) {
      const copy = structuredClone(subject);
      await DB.subjects.put(copy);
      state.subjects.push(copy);
    }
    s.seededSubjects.push(subject.id);
  }
  for (const task of SEED_TASKS) {
    if (s.seededTasks.includes(task.id)) continue;
    if (!state.tasks.some((x) => x.id === task.id)) {
      const copy = { ...structuredClone(task), done: false, notified: false, createdAt: Date.now() };
      await DB.tasks.put(copy);
      state.tasks.push(copy);
    }
    s.seededTasks.push(task.id);
  }
  saveSettings();
}

// ---------- Interfaz ----------

function buildChoiceChips(container, name, entries, withDot) {
  container.replaceChildren(...entries.map(([value, label, color]) => el('label', { className: 'chip' }, [
    el('input', { type: 'radio', name, value }),
    withDot ? el('span', { className: 'dot', style: { background: color } }) : null,
    label,
  ])));
}

function bindUI() {
  $('#btn-menu').append(icon('menu'));
  $('#btn-back').append(icon('back'));
  $('#btn-prev').append(icon('left'));
  $('#btn-next').append(icon('right'));
  $('#btn-notif').append(icon('bell'));
  $('#fab').append(icon('plus'));

  buildChoiceChips($('#event-categories'), 'category', Object.entries(CATEGORIES).map(([k, c]) => [k, c.label, c.color]), true);
  buildChoiceChips($('#task-types'), 'type', Object.entries(TASK_TYPES).map(([k, t]) => [k, t.label]));

  // Menú y navegación
  $('#btn-menu').addEventListener('click', openDrawer);
  $('#scrim').addEventListener('click', closeDrawer);
  $('#btn-back').addEventListener('click', () => history.back());
  document.querySelectorAll('.nav-item[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  document.querySelectorAll('.nav-item[data-screen]').forEach((b) => b.addEventListener('click', () => showScreen(b.dataset.screen)));
  window.addEventListener('popstate', (e) => {
    if (e.state?.subjectId) state.subjectId = e.state.subjectId;
    showScreen(e.state?.screen || 'calendar', { push: false });
  });

  // Filtros
  $('#btn-filter').append(icon('filter'));
  $('#btn-filter').addEventListener('click', openFilter);
  $('#btn-drawer-filter').addEventListener('click', openFilter);
  $('#btn-filter-done').addEventListener('click', () => $('#dlg-filter').close());
  $('#btn-filter-clear').addEventListener('click', () => { applyPreset('all'); filterChanged(); });
  $('#btn-subjects-all').addEventListener('click', () => { state.settings.hide.subjects = []; filterChanged(); });
  $('#btn-subjects-none').addEventListener('click', () => {
    state.settings.hide.subjects = [...state.subjects.map((s) => s.id), 'none'];
    filterChanged();
  });
  renderDrawerPresets();

  // Calendario
  $('#btn-prev').addEventListener('click', () => step(-1));
  $('#btn-next').addEventListener('click', () => step(1));
  $('#btn-today').addEventListener('click', goToday);
  $('#view-select').addEventListener('change', (e) => setView(e.target.value));
  $('#btn-notif').addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'granted') showScreen('settings');
    else requestNotifications();
  });

  // Deslizar para cambiar de días / mes
  let touch = null;
  $('#cal').addEventListener('touchstart', (e) => {
    if (state.view === 'agenda' || e.touches.length > 1) return;
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  $('#cal').addEventListener('touchend', (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Botón de crear
  $('#fab').addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.screen === 'tasks' || state.screen === 'subject') openTaskForm();
    else if (state.screen === 'highlights') openEventForm(null, { highlight: true });
    else $('#fab-menu').hidden = !$('#fab-menu').hidden;
  });
  document.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', () => {
    $('#fab-menu').hidden = true;
    if (b.dataset.new === 'task') openTaskForm();
    else openEventForm();
  }));
  document.addEventListener('click', (e) => {
    if (!$('#fab-menu').hidden && !e.target.closest('#fab-menu')) $('#fab-menu').hidden = true;
  });

  // Entregas y asignaturas
  document.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => {
    state.taskFilter.status = b.dataset.status;
    renderTasks();
  }));
  $('#task-subject-filter').addEventListener('change', (e) => {
    state.taskFilter.subject = e.target.value;
    renderTasks();
  });
  $('#btn-new-subject').addEventListener('click', () => openSubjectForm());

  // Formulario de evento
  const fe = $('#form-event');
  fe.repeat.addEventListener('change', updateRepeatUI);
  fe.time.addEventListener('change', () => {
    if (fe.time.value && (!fe.end.value || fe.end.value <= fe.time.value)) {
      fe.end.value = timeText(Math.min(minutes(fe.time.value) + 60, 23 * 60 + 59));
    }
  });
  $('#inp-photos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const file of files) {
      try { draftPhotos.push(await resizeImage(file)); } catch { toast('No se pudo añadir una de las fotos'); }
    }
    renderDraftPhotos();
  });
  $('#dlg-event').addEventListener('close', () => { if ($('#dlg-event').returnValue === 'save') saveEvent(); });
  $('#btn-delete-event').addEventListener('click', async () => {
    const ev = editingEvent;
    if (!ev || !confirm(ev.repeat ? `¿Borrar “${ev.title}” de todos los días?` : `¿Borrar “${ev.title}”?`)) return;
    await DB.events.remove(ev.id);
    state.events = state.events.filter((e) => e.id !== ev.id);
    $('#dlg-event').close('deleted');
    renderScreen();
    toast('Evento borrado');
  });

  // Formulario de entrega
  $('#task-types').addEventListener('change', updateTaskTypeUI);
  $('#form-task').remind.addEventListener('change', () => { remindTouched = true; });
  $('#dlg-task').addEventListener('close', () => { if ($('#dlg-task').returnValue === 'save') saveTask(); });
  $('#btn-delete-task').addEventListener('click', async () => {
    const t = editingTask;
    if (!t || !confirm(`¿Borrar “${taskLabel(t)}”?`)) return;
    await DB.tasks.remove(t.id);
    state.tasks = state.tasks.filter((x) => x.id !== t.id);
    $('#dlg-task').close('deleted');
    renderScreen();
    toast('Entrega borrada');
  });

  // Formulario de asignatura
  $('#btn-add-slot').addEventListener('click', () => $('#schedule-rows').append(slotRow()));
  $('#dlg-subject').addEventListener('close', () => { if ($('#dlg-subject').returnValue === 'save') saveSubject(); });
  $('#btn-delete-subject').addEventListener('click', async () => {
    const s = editingSubject;
    if (!s) return;
    const tasks = state.tasks.filter((t) => t.subjectId === s.id);
    const extra = tasks.length ? ` También se borrarán sus ${tasks.length} entregas.` : '';
    if (!confirm(`¿Borrar la asignatura “${s.name}”?${extra}`)) return;
    await DB.subjects.remove(s.id);
    for (const t of tasks) await DB.tasks.remove(t.id);
    state.subjects = state.subjects.filter((x) => x.id !== s.id);
    state.tasks = state.tasks.filter((t) => t.subjectId !== s.id);
    $('#dlg-subject').close('deleted');
    if (state.screen === 'subject') history.back();
    else renderScreen();
    toast('Asignatura borrada');
  });

  // Cerrar diálogos tocando fuera
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close('cancel'); });
  }

  // Ajustes
  $('#set-summary').checked = state.settings.summary;
  $('#set-summary').addEventListener('change', (e) => { state.settings.summary = e.target.checked; saveSettings(); });
  $('#set-class-remind').value = String(state.settings.classRemind);
  $('#set-class-remind').addEventListener('change', (e) => { state.settings.classRemind = Number(e.target.value); saveSettings(); });
  $('#set-pec').checked = state.settings.classesInPec;
  $('#set-pec').addEventListener('change', (e) => { state.settings.classesInPec = e.target.checked; saveSettings(); });
  $('#btn-enable-notif').addEventListener('click', requestNotifications);
  $('#btn-test-notif').addEventListener('click', async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') await requestNotifications();
    if (!(await notify('Mi Calendario', 'Así te llegarán los avisos.', 'prueba'))) toast('Primero activa los avisos');
  });
  $('#btn-export').addEventListener('click', exportBackup);
  $('#inp-import').addEventListener('change', (e) => {
    if (e.target.files[0]) importBackup(e.target.files[0]);
    e.target.value = '';
  });

  // Al volver a la app: refrescar y revisar avisos
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    renderScreen();
    checkReminders();
    dailySummary();
  });
  window.addEventListener('resize', () => {
    if (state.screen === 'calendar') renderCalendarScreen();
  });
}

async function init() {
  state.settings = loadSettings();
  state.view = state.settings.view || (window.innerWidth >= 900 ? 'week' : '3day');
  state.date = todayISO();
  history.replaceState({ screen: 'calendar' }, '');
  bindUI();
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
      swReg = await navigator.serviceWorker.ready;
    } catch { /* p. ej. abierto como archivo local */ }
  }
  await loadData();
  await seed();
  renderScreen();
  await checkReminders();
  await dailySummary();

  // Cada minuto: avisos y la línea de la hora actual
  setInterval(() => {
    checkReminders();
    if (state.screen === 'calendar' && TIME_VIEWS.includes(state.view)) renderCalendar();
  }, 60000);
}

init();
