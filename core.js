// Lógica sin interfaz: fechas, planes, clases según el calendario académico y entregas.

const DEFAULT_TIME = '09:00'; // hora usada para avisar de lo que no tiene hora
const SETTINGS_KEY = 'mi-calendario-ajustes';

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const WEEKDAYS_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

// Tipos de plan personal.
const CATEGORIES = {
  general: { label: 'General', color: '#5f6368' },
  estudios: { label: 'Estudios', color: '#4a5d7e' },
  amigos: { label: 'Amigos', color: '#43a047' },
  gym: { label: 'Gym', color: '#fb8c00' },
  pareja: { label: 'Pareja', color: '#7e57c2' },
};

// Tipos de entrega de una asignatura.
const TASK_TYPES = {
  examen: { label: 'Examen', plural: 'Exámenes', timed: true },
  trabajo: { label: 'Trabajo', plural: 'Trabajos' },
  entregable: { label: 'Entregable', plural: 'Entregables' },
  ejercicios: { label: 'Ejercicios', plural: 'Ejercicios' },
  practica: { label: 'Práctica', plural: 'Prácticas' },
  presentacion: { label: 'Presentación', plural: 'Presentaciones', timed: true },
  otro: { label: 'Otro', plural: 'Otras entregas' },
};

const HOLIDAY_NAMES = {
  '2026-10-12': 'Fiesta Nacional',
  '2026-11-02': 'Todos los Santos',
  '2026-11-09': 'La Almudena',
  '2026-12-07': 'Día de la Constitución',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Navidad',
  '2027-01-01': 'Año Nuevo',
  '2027-01-06': 'Reyes',
  '2027-01-28': 'Santo Tomás de Aquino',
  '2027-03-25': 'Jueves Santo',
  '2027-03-26': 'Viernes Santo',
  '2027-05-03': 'Día de la Comunidad de Madrid',
};

const state = {
  events: [],
  subjects: [],
  tasks: [],
  settings: null,
  screen: 'calendar',
  view: 'week',
  date: null,           // día de referencia de la vista del calendario
  subjectId: null,      // asignatura abierta en su ficha
  taskFilter: { status: 'pending', subject: 'all' },
  highlightFilter: 'all',
};

// ---------- Fechas ----------

function toISODate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayISO() {
  return toISODate(new Date());
}

function addDays(iso, n) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function addMonths(iso, n) {
  const d = parseISODate(iso);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

function daysBetween(a, b) {
  return Math.round((parseISODate(b) - parseISODate(a)) / 86400000);
}

// Lunes = 0 … domingo = 6.
function weekdayOf(iso) {
  return (parseISODate(iso).getDay() + 6) % 7;
}

function startOfWeek(iso) {
  return addDays(iso, -weekdayOf(iso));
}

function startOfMonth(iso) {
  return iso.slice(0, 8) + '01';
}

function minutes(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function timeText(mins) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(mins / 60) % 24)}:${p(mins % 60)}`;
}

function dateAt(iso, time) {
  const d = parseISODate(iso);
  const m = minutes(time || DEFAULT_TIME);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatter(options) {
  const f = new Intl.DateTimeFormat('es-ES', options);
  return { format: (d) => capitalize(f.format(typeof d === 'string' ? parseISODate(d) : d)) };
}

const fmtMonthYear = formatter({ month: 'long', year: 'numeric' });
const fmtMonth = formatter({ month: 'long' });
const fmtMonthShort = formatter({ month: 'short' });
const fmtDayLong = formatter({ weekday: 'long', day: 'numeric', month: 'long' });
const fmtDayFull = formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtDayShort = formatter({ weekday: 'short', day: 'numeric', month: 'short' });
const fmtDayMonth = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });

// "Hoy", "Mañana", "En 3 días", "Hace 2 días"…
function relativeDay(iso) {
  const n = daysBetween(todayISO(), iso);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  if (n > 1) return `En ${n} días`;
  return `Hace ${-n} días`;
}

// Color de texto legible sobre un fondo.
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#1f1f1f' : '#ffffff';
}

// ---------- Ajustes ----------

function defaultSettings() {
  return {
    summary: true,
    lastSummary: '',
    classRemind: -1,
    classesInPec: true,
    view: '',
    // Lo que se oculta en el calendario (vacío = se ve todo).
    hide: { classes: false, academic: false, taskTypes: [], categories: [], subjects: [] },
    seededSubjects: [],
    seededTasks: [],
  };
}

function loadSettings() {
  const base = defaultSettings();
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const settings = { ...base, ...saved, hide: { ...base.hide, ...saved.hide } };
    delete settings.show; // casillas de una versión anterior: se empieza viendo todo
    return settings;
  } catch {
    return base;
  }
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch { /* sin almacenamiento */ }
}

// ---------- Planes personales ----------
// Un plan repetido guarda repeat = { days: [0..6] (lunes = 0), until: 'AAAA-MM-DD' | '' }
// y skip = días sueltos que se han quitado.

// Los planes antiguos solo tenían la marca "couple".
function categoryOf(ev) {
  return CATEGORIES[ev.category] ? ev.category : ev.couple ? 'pareja' : 'general';
}

// Los planes de pareja de versiones anteriores se conservan como destacados.
function isHighlighted(ev) {
  return ev.highlight ?? !!ev.couple;
}

function occursOn(ev, iso) {
  if (!ev.repeat) return ev.date === iso;
  return iso >= ev.date
    && (!ev.repeat.until || iso <= ev.repeat.until)
    && ev.repeat.days.includes(weekdayOf(iso))
    && !(ev.skip || []).includes(iso);
}

function describeRepeat(ev) {
  if (!ev.repeat) return '';
  const { days, until } = ev.repeat;
  let text;
  if (days.length === 7) text = 'Todos los días';
  else if (days.join() === '0,1,2,3,4') text = 'De lunes a viernes';
  else {
    const names = days.map((d) => WEEKDAYS[d]);
    text = 'Cada ' + (names.length > 1 ? names.slice(0, -1).join(', ') + ' y ' + names.at(-1) : names[0]);
  }
  return until ? `${text} hasta el ${fmtDayMonth.format(parseISODate(until))}` : text;
}

// Copia del plan para un día concreto (el original se busca por id).
function instanceOn(ev, iso) {
  return ev.repeat ? { ...ev, date: iso } : ev;
}

function seriesOf(ev) {
  return state.events.find((e) => e.id === ev.id) || ev;
}

function eventsOn(iso) {
  return state.events.filter((e) => occursOn(e, iso)).map((e) => instanceOn(e, iso));
}

// ---------- Calendario académico ----------

const academicDays = (() => {
  const map = new Map();
  const mark = (start, end, info) => {
    for (let d = start; d <= end; d = addDays(d, 1)) if (!map.has(d)) map.set(d, info);
  };
  for (const d of ACADEMIC.holidays) map.set(d, { kind: 'festivo', name: HOLIDAY_NAMES[d] || 'Festivo', blocks: true });
  for (const v of ACADEMIC.vacations) mark(v.start, v.end, { kind: 'vacaciones', name: `Vacaciones de ${v.name}`, blocks: true });
  for (const v of ACADEMIC.noTeaching) mark(v.start, v.end, { kind: 'sin-docencia', name: `Sin clases · ${v.name}`, blocks: true });
  return map;
})();

const pecDays = (() => {
  const set = new Set();
  for (const p of ACADEMIC.pec) for (let d = p.start; d <= p.end; d = addDays(d, 1)) set.add(d);
  return set;
})();

function semesterOn(iso) {
  for (const [key, s] of Object.entries(ACADEMIC.semesters)) {
    if (iso >= s.start && iso <= s.end) return Number(key);
  }
  return null;
}

// Avisos del calendario académico para un día (festivos, inicio de exámenes…).
function academicOn(iso) {
  const out = [];
  const info = academicDays.get(iso);
  if (info && weekdayOf(iso) < 5) out.push(info.name);
  if (ACADEMIC.swaps[iso] != null && semesterOn(iso)) out.push(`Horario de ${WEEKDAYS[ACADEMIC.swaps[iso]]}`);
  for (const [key, s] of Object.entries(ACADEMIC.semesters)) {
    if (s.start === iso) out.push(`Empiezan las clases del ${key}.º cuatrimestre`);
    if (s.end === iso) out.push(`Último día de clases del ${key}.º cuatrimestre`);
  }
  for (const p of ACADEMIC.examPeriods) {
    if (p.start === iso) out.push(`${p.name} (hasta el ${fmtDayMonth.format(parseISODate(p.end))})`);
  }
  return out;
}

// Clases de un día según el horario de cada asignatura y el calendario académico.
function classesOn(iso) {
  const semester = semesterOn(iso);
  if (!semester) return [];
  if (academicDays.get(iso)?.blocks) return [];
  if (pecDays.has(iso) && !state.settings.classesInPec) return [];
  const weekday = ACADEMIC.swaps[iso] ?? weekdayOf(iso);
  const out = [];
  for (const subject of state.subjects) {
    if (subject.semester !== semester || (subject.cancelled || []).includes(iso)) continue;
    for (const slot of subject.schedule || []) {
      if (slot.day === weekday) out.push({ subject, slot, date: iso });
    }
  }
  return out;
}

function nextClasses(subject, count = 3) {
  const out = [];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let d = todayISO(), i = 0; i < 400 && out.length < count; d = addDays(d, 1), i++) {
    for (const c of classesOn(d)) {
      if (c.subject.id !== subject.id) continue;
      if (d === todayISO() && minutes(c.slot.end) < nowMin) continue;
      out.push(c);
    }
  }
  return out.slice(0, count);
}

// "13" → "Aula 13"; los nombres de aula ("Fdez. del Amo") se dejan tal cual.
function roomText(room) {
  if (!room) return '';
  return /^\d/.test(room) ? `Aula ${room}` : room;
}

// ---------- Entregas y exámenes ----------

function subjectOf(task) {
  return state.subjects.find((s) => s.id === task.subjectId) || null;
}

function taskColor(task) {
  return subjectOf(task)?.color || '#5f6368';
}

function taskLabel(task) {
  return task.title || TASK_TYPES[task.type]?.label || 'Entrega';
}

// "Examen: Parcial 1", o "Trabajo · Tecnología de Radiaciones" si no tiene título propio.
function taskFullTitle(task) {
  const type = TASK_TYPES[task.type]?.label || 'Entrega';
  if (task.title && task.title.toLowerCase() !== type.toLowerCase()) return `${type}: ${task.title}`;
  return `${type} · ${subjectOf(task)?.name || 'Sin asignatura'}`;
}

function taskSort(a, b) {
  return (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'));
}

function pendingTasks() {
  return state.tasks.filter((t) => !t.done).sort(taskSort);
}

// ---------- Todo lo de un día, listo para pintar ----------
// Cada elemento: { key, kind, date, start, end (minutos o null si es de todo el día),
//                  title, short, sub, color, ref, done }

// ---------- Filtros del calendario ----------

const FILTER_PRESETS = {
  all: 'Todo',
  uni: 'Universidad',
  classes: 'Clases',
  exams: 'Exámenes',
  deliveries: 'Entregas',
  personal: 'Planes',
};

// Los atajos mantienen las asignaturas elegidas, salvo "Todo", que lo enseña todo.
function applyPreset(name) {
  const allTypes = Object.keys(TASK_TYPES);
  const allCats = Object.keys(CATEGORIES);
  const subjects = name === 'all' ? [] : state.settings.hide.subjects;
  const hide = { classes: false, academic: false, taskTypes: [], categories: [], subjects };
  if (name === 'uni') hide.categories = allCats;
  if (name === 'classes') Object.assign(hide, { taskTypes: allTypes, categories: allCats });
  if (name === 'exams') Object.assign(hide, { classes: true, taskTypes: allTypes.filter((t) => t !== 'examen'), categories: allCats });
  if (name === 'deliveries') Object.assign(hide, { classes: true, taskTypes: ['examen'], categories: allCats });
  if (name === 'personal') Object.assign(hide, { classes: true, taskTypes: allTypes });
  state.settings.hide = hide;
}

// Atajo que coincide con el filtro actual, sin contar las asignaturas.
function currentPreset() {
  const saved = state.settings.hide;
  const key = (h) => JSON.stringify({ ...h, subjects: [] });
  const current = key(saved);
  for (const name of Object.keys(FILTER_PRESETS)) {
    applyPreset(name);
    const match = key(state.settings.hide) === current;
    state.settings.hide = saved;
    if (match) return name;
  }
  return null;
}

function filterActive() {
  const h = state.settings.hide;
  return h.classes || h.academic || h.taskTypes.length || h.categories.length || h.subjects.length;
}

// Texto corto del filtro activo, p. ej. "Exámenes · Física Nuclear".
function filterSummary() {
  const h = state.settings.hide;
  const preset = currentPreset();
  const parts = [];
  if (preset && preset !== 'all') parts.push(FILTER_PRESETS[preset]);
  else if (!preset) {
    const shown = [];
    if (!h.classes) shown.push('Clases');
    const types = Object.entries(TASK_TYPES).filter(([k]) => !h.taskTypes.includes(k)).map(([, t]) => t.plural);
    if (types.length === Object.keys(TASK_TYPES).length) shown.push('Entregas');
    else shown.push(...types);
    const cats = Object.entries(CATEGORIES).filter(([k]) => !h.categories.includes(k)).map(([, c]) => c.label);
    if (cats.length === Object.keys(CATEGORIES).length) shown.push('Planes');
    else shown.push(...cats);
    parts.push(shown.join(', ') || 'Nada');
  }
  if (h.subjects.length) {
    const visible = state.subjects.filter((s) => !h.subjects.includes(s.id));
    parts.push(visible.length <= 2 ? visible.map((s) => s.short || s.name).join(', ') || 'Ninguna asignatura' : `${visible.length} asignaturas`);
  }
  return parts.join(' · ');
}

function itemsOn(iso) {
  const hide = state.settings.hide;
  const items = [];

  if (!hide.academic) {
    academicOn(iso).forEach((name, i) => items.push({
      key: `a-${iso}-${i}`, kind: 'academic', date: iso, start: null, end: null,
      title: name, short: name, sub: 'Calendario académico', color: null,
    }));
  }

  for (const t of state.tasks) {
    if (t.date !== iso || hide.taskTypes.includes(t.type)) continue;
    if (hide.subjects.includes(t.subjectId || 'none')) continue;
    const subject = subjectOf(t);
    const type = TASK_TYPES[t.type]?.label || 'Entrega';
    // Exámenes y presentaciones con hora ocupan su franja; el resto son fechas límite.
    const timed = TASK_TYPES[t.type]?.timed && t.time;
    const start = timed ? minutes(t.time) : null;
    items.push({
      key: `t-${t.id}`, kind: 'task', date: iso, ref: t, done: !!t.done,
      start, end: timed ? (minutes(t.end) || start + 120) : null,
      title: taskFullTitle(t),
      short: t.title && t.title.toLowerCase() !== type.toLowerCase() ? t.title : `${type} ${subject?.short || ''}`,
      sub: [subject?.name, t.time && !timed ? `Entrega a las ${t.time}` : '', t.place].filter(Boolean).join(' · '),
      color: taskColor(t),
    });
  }

  if (!hide.classes) {
    for (const c of classesOn(iso)) {
      if (hide.subjects.includes(c.subject.id)) continue;
      items.push({
        key: `c-${c.subject.id}-${iso}-${c.slot.start}`, kind: 'class', date: iso, ref: c,
        start: minutes(c.slot.start), end: minutes(c.slot.end),
        title: c.subject.name, short: c.subject.short || c.subject.name,
        sub: roomText(c.slot.room || c.subject.room),
        color: c.subject.color,
      });
    }
  }

  for (const ev of eventsOn(iso)) {
    if (hide.categories.includes(categoryOf(ev))) continue;
    const start = minutes(ev.time);
    items.push({
      key: `e-${ev.id}-${iso}`, kind: 'event', date: iso, ref: ev,
      start, end: start == null ? null : (minutes(ev.end) > start ? minutes(ev.end) : start + 60),
      title: ev.title, short: ev.title,
      sub: [ev.place, categoryOf(ev) !== 'general' ? CATEGORIES[categoryOf(ev)].label : ''].filter(Boolean).join(' · '),
      color: CATEGORIES[categoryOf(ev)].color,
    });
  }

  const order = { academic: 0, task: 1, class: 2, event: 2 };
  return items.sort((a, b) => (a.start ?? -1) - (b.start ?? -1) || order[a.kind] - order[b.kind]);
}

// Reparte en columnas los elementos que se solapan (como Google Calendar).
function layoutTimed(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = [];
    for (const it of cluster) {
      let col = cols.findIndex((end) => end <= it.start);
      if (col < 0) { col = cols.length; cols.push(0); }
      cols[col] = it.end;
      it.col = col;
    }
    for (const it of cluster) { it.cols = cols.length; out.push(it); }
    cluster = [];
  };
  for (const it of sorted) {
    if (it.start >= clusterEnd && cluster.length) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.end);
  }
  if (cluster.length) flush();
  return out;
}
