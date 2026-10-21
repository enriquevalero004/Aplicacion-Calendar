// Mi Calendario: planes del día, avisos y recuerdos de planes en pareja.

const $ = (sel) => document.querySelector(sel);
const DEFAULT_TIME = '09:00'; // hora usada para avisar de planes sin hora
const SETTINGS_KEY = 'mi-calendario-ajustes';

const CATEGORIES = {
  general: { emoji: '📅', label: 'General' },
  estudios: { emoji: '📚', label: 'Carrera y estudios' },
  amigos: { emoji: '🎉', label: 'Amigos' },
  gym: { emoji: '💪', label: 'Gym' },
  pareja: { emoji: '💖', label: 'Plan con mi novia' },
};

// Los planes antiguos solo tenían la marca "couple".
function categoryOf(ev) {
  return CATEGORIES[ev.category] ? ev.category : ev.couple ? 'pareja' : 'general';
}

// Emoji delante del título (los planes generales van sin emoji).
function prefix(ev) {
  const cat = categoryOf(ev);
  return cat === 'general' ? '' : CATEGORIES[cat].emoji + ' ';
}

const state = {
  events: [],
  month: startOfMonth(new Date()),
  selected: toISODate(new Date()),
  editing: null,      // evento que se está editando (o null si es nuevo)
  viewing: null,      // evento abierto en el visor
  draftPhotos: [],    // fotos del formulario abierto
};

// ---------- Utilidades de fechas ----------

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function eventStart(ev) {
  const [h, min] = (ev.time || DEFAULT_TIME).split(':').map(Number);
  const d = parseISODate(ev.date);
  d.setHours(h, min, 0, 0);
  return d;
}

// Formateadores con la primera letra en mayúscula ("Miércoles, 21 de octubre").
function formatter(options) {
  const f = new Intl.DateTimeFormat('es-ES', options);
  return { format: (d) => { const s = f.format(d); return s.charAt(0).toUpperCase() + s.slice(1); } };
}
const fmtMonth = formatter({ month: 'long', year: 'numeric' });
const fmtDayLong = formatter({ weekday: 'long', day: 'numeric', month: 'long' });
const fmtDayFull = formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function sortEvents(list) {
  return [...list].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}

function eventsOn(date) {
  return sortEvents(state.events.filter((e) => e.date === date));
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const c of [].concat(children)) {
    if (c != null) node.append(c);
  }
  return node;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---------- Ajustes ----------

function loadSettings() {
  try {
    return { summary: true, lastSummary: '', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { summary: true, lastSummary: '' };
  }
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
}

// ---------- Render ----------

function renderCalendar() {
  $('#month-label').textContent = fmtMonth.format(state.month);
  const grid = $('#grid');
  grid.replaceChildren();

  const first = state.month;
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  const today = toISODate(new Date());

  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISODate(d);
    const dayEvents = state.events.filter((e) => e.date === iso);
    const cats = new Set(dayEvents.map(categoryOf));
    const special = Object.keys(CATEGORIES).filter((c) => c !== 'general' && cats.has(c));

    const marks = el('span', { className: 'marks' });
    // Un emoji por tipo de plan del día (máx. 3); los generales se ven como un punto.
    for (const c of special.slice(0, 3)) marks.append(CATEGORIES[c].emoji);
    if (cats.has('general') && special.length < 3) marks.append(el('span', { className: 'dot' }));

    const btn = el('button', { type: 'button', className: 'day' }, [
      el('span', { className: 'num', textContent: d.getDate() }),
      marks,
    ]);
    if (d.getMonth() !== first.getMonth()) btn.classList.add('other');
    if (iso === today) btn.classList.add('today');
    if (iso === state.selected) btn.classList.add('selected');
    btn.setAttribute('aria-label', `${fmtDayLong.format(d)}, ${dayEvents.length} planes`);
    btn.addEventListener('click', () => {
      state.selected = iso;
      if (d.getMonth() !== first.getMonth()) state.month = startOfMonth(d);
      renderCalendar();
    });
    grid.append(btn);
  }
  renderDay();
}

function eventItem(ev) {
  const li = el('li', { className: `event cat-${categoryOf(ev)}` }, [
    el('span', { className: 'time', textContent: ev.time || 'Todo el día' }),
    el('div', { className: 'info' }, [
      el('div', { className: 'title', textContent: prefix(ev) + ev.title }),
      ev.description ? el('div', { className: 'desc', textContent: ev.description }) : null,
    ]),
    ev.photos?.length ? el('img', { src: ev.photos[0], alt: '' }) : null,
  ]);
  li.addEventListener('click', () => openViewer(ev));
  return li;
}

function renderDay() {
  $('#day-label').textContent = fmtDayLong.format(parseISODate(state.selected));
  const list = $('#day-events');
  const items = eventsOn(state.selected);
  list.replaceChildren(
    ...(items.length
      ? items.map(eventItem)
      : [el('li', { className: 'empty', textContent: 'Nada planeado. Pulsa ＋ para añadir algo.' })])
  );
}

function renderCouple() {
  const box = $('#couple-list');
  const plans = sortEvents(state.events.filter((e) => categoryOf(e) === 'pareja')).reverse();
  if (!plans.length) {
    box.replaceChildren(el('div', {
      className: 'empty',
      textContent: 'Todavía no hay planes en pareja. Al crear un plan, elige “💖 Con mi novia”.',
    }));
    return;
  }
  box.replaceChildren(...plans.map((ev) => {
    const cover = ev.photos?.length
      ? el('img', { className: 'cover', src: ev.photos[0], alt: '' })
      : el('div', { className: 'cover placeholder', textContent: '💖' });
    const card = el('article', { className: 'memory' }, [
      cover,
      el('div', { className: 'body' }, [
        el('div', { className: 'date', textContent: fmtDayFull.format(parseISODate(ev.date)) + (ev.time ? ` · ${ev.time}` : '') }),
        el('h4', { textContent: ev.title }),
        ev.description ? el('p', { textContent: ev.description }) : null,
        ev.photos?.length > 1 ? el('p', { textContent: `📷 ${ev.photos.length} fotos` }) : null,
      ]),
    ]);
    card.addEventListener('click', () => openViewer(ev));
    return card;
  }));
}

function renderAll() {
  renderCalendar();
  renderCouple();
}

// ---------- Visor ----------

function openViewer(ev) {
  state.viewing = ev;
  const remindText = ev.remind < 0 ? 'Sin aviso'
    : ev.remind === 0 ? 'Aviso a la hora'
    : ev.remind >= 1440 ? 'Aviso 1 día antes'
    : ev.remind >= 60 ? `Aviso ${ev.remind / 60} h antes`
    : `Aviso ${ev.remind} min antes`;

  $('#viewer-body').replaceChildren(
    el('h3', { textContent: ev.title }),
    el('div', { className: 'meta', textContent: `${fmtDayFull.format(parseISODate(ev.date))} · ${ev.time || 'todo el día'} · ${remindText}` }),
    categoryOf(ev) !== 'general'
      ? el('span', { className: 'badge', textContent: `${CATEGORIES[categoryOf(ev)].emoji} ${CATEGORIES[categoryOf(ev)].label}` })
      : null,
    ev.description ? el('p', { className: 'text', textContent: ev.description }) : null,
    ev.photos?.length
      ? el('div', { className: 'gallery' }, ev.photos.map((src) => el('img', { src, alt: '' })))
      : null,
  );
  $('#dlg-view').showModal();
}

// ---------- Formulario ----------

function openForm(ev = null) {
  state.editing = ev;
  const f = $('#form-event');
  f.reset();
  $('#form-title').textContent = ev ? 'Editar plan' : 'Nuevo plan';
  f.title.value = ev?.title || '';
  f.date.value = ev?.date || state.selected;
  f.time.value = ev?.time || '';
  f.remind.value = String(ev?.remind ?? 30);
  f.description.value = ev?.description || '';
  f.category.value = ev ? categoryOf(ev) : 'general';
  state.draftPhotos = [...(ev?.photos || [])];
  $('#btn-delete').hidden = !ev;
  renderDraftPhotos();
  $('#dlg-event').returnValue = '';
  $('#dlg-event').showModal();
}

function renderDraftPhotos() {
  $('#photo-preview').replaceChildren(...state.draftPhotos.map((src, i) => {
    const rm = el('button', { type: 'button', className: 'rm', textContent: '×', ariaLabel: 'Quitar foto' });
    rm.addEventListener('click', () => {
      state.draftPhotos.splice(i, 1);
      renderDraftPhotos();
    });
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

async function saveForm() {
  const f = $('#form-event');
  const prev = state.editing;
  const ev = {
    id: prev?.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
    title: f.title.value.trim(),
    date: f.date.value,
    time: f.time.value,
    remind: Number(f.remind.value),
    description: f.description.value.trim(),
    category: f.category.value,
    couple: f.category.value === 'pareja',
    photos: state.draftPhotos,
    createdAt: prev?.createdAt || Date.now(),
  };
  // Si cambia la hora o el aviso, se vuelve a avisar.
  const sameReminder = prev && prev.date === ev.date && prev.time === ev.time && prev.remind === ev.remind;
  ev.notified = sameReminder ? !!prev.notified : false;

  await DB.put(ev);
  state.events = state.events.filter((e) => e.id !== ev.id).concat(ev);
  state.selected = ev.date;
  state.month = startOfMonth(parseISODate(ev.date));
  renderAll();
  toast(prev ? 'Plan actualizado' : 'Plan guardado');
  checkReminders();
}

// ---------- Notificaciones ----------

let swReg = null;

async function notify(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const options = { body, tag, icon: 'icon.svg', badge: 'icon.svg' };
  try {
    if (swReg) {
      await swReg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    return true;
  } catch {
    return false;
  }
}

function updateNotifButton() {
  const btn = $('#btn-notif');
  if (!('Notification' in window)) {
    btn.textContent = '🔕 Sin avisos';
    btn.disabled = true;
    return;
  }
  const on = Notification.permission === 'granted';
  btn.textContent = on ? '🔔 Avisos activados' : Notification.permission === 'denied' ? '🔕 Avisos bloqueados' : '🔔 Activar avisos';
  btn.classList.toggle('on', on);
}

async function requestNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') {
    toast('Los avisos están bloqueados. Actívalos en los ajustes del navegador.');
    return;
  }
  const res = await Notification.requestPermission();
  updateNotifButton();
  if (res === 'granted') {
    toast('¡Avisos activados!');
    checkReminders();
  }
}

function describeWhen(ev, now) {
  const mins = Math.round((eventStart(ev) - now) / 60000);
  if (!ev.time) return 'Hoy';
  if (mins <= 0) return `Ahora (${ev.time})`;
  if (mins < 60) return `En ${mins} min (${ev.time})`;
  if (mins < 1440) return `A las ${ev.time}`;
  return `Mañana a las ${ev.time}`;
}

async function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  for (const ev of state.events) {
    if (ev.remind < 0 || ev.notified) continue;
    const start = eventStart(ev);
    const fireAt = new Date(start.getTime() - ev.remind * 60000);
    if (now < fireAt) continue;
    // Si el plan ya pasó hace rato, no molestamos con un aviso viejo.
    const tooLate = now - start > 60 * 60000;
    const sent = !tooLate && await notify(
      CATEGORIES[categoryOf(ev)].emoji + ' ' + ev.title,
      describeWhen(ev, now) + (ev.description ? ` · ${ev.description}` : ''),
      ev.id,
    );
    if (sent || tooLate) {
      ev.notified = true;
      await DB.put(ev);
    }
  }
}

async function dailySummary() {
  const settings = loadSettings();
  const today = toISODate(new Date());
  if (!settings.summary || settings.lastSummary === today) return;
  const items = eventsOn(today);
  if (!items.length) return;
  const body = items.map((e) => `${e.time || '·'} ${prefix(e)}${e.title}`).join('\n');
  const title = items.length === 1 ? 'Hoy tienes 1 plan' : `Hoy tienes ${items.length} planes`;
  if (await notify(title, body, 'resumen-' + today)) {
    settings.lastSummary = today;
    saveSettings(settings);
  }
}

// ---------- Exportar a calendario (.ics) ----------

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

function icsDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function downloadICS(ev) {
  const start = eventStart(ev);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mi Calendario//ES', 'BEGIN:VEVENT',
    `UID:${ev.id}@mi-calendario`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
  ];
  if (ev.time) {
    lines.push(`DTSTART:${icsDate(start)}`, `DTEND:${icsDate(new Date(start.getTime() + 3600000))}`);
  } else {
    const next = parseISODate(ev.date);
    next.setDate(next.getDate() + 1);
    lines.push(`DTSTART;VALUE=DATE:${ev.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${toISODate(next).replace(/-/g, '')}`);
  }
  lines.push(`SUMMARY:${icsEscape(prefix(ev) + ev.title)}`);
  if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
  if (ev.remind >= 0) {
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(ev.title)}`, `TRIGGER:-PT${ev.remind}M`, 'END:VALARM');
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `${ev.title.replace(/[^\w\- ]+/g, '').trim() || 'plan'}.ics` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ---------- Copia de seguridad ----------

function exportBackup() {
  const blob = new Blob([JSON.stringify({ version: 1, events: state.events }, null, 2)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `mi-calendario-${toISODate(new Date())}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.events)) throw new Error();
    let count = 0;
    for (const ev of data.events) {
      if (!ev.id || !ev.title || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) continue;
      await DB.put(ev);
      count++;
    }
    state.events = await DB.all();
    renderAll();
    toast(`Importados ${count} planes`);
  } catch {
    toast('Ese archivo no es una copia válida');
  }
}

// ---------- Eventos de la interfaz ----------

function showView(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== `view-${name}`; });
  $('#fab').hidden = name === 'settings';
  if (name === 'couple') renderCouple();
}

function bindUI() {
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));

  $('#prev-month').addEventListener('click', () => {
    state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
    renderCalendar();
  });
  $('#next-month').addEventListener('click', () => {
    state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
    renderCalendar();
  });
  $('#btn-today').addEventListener('click', () => {
    state.selected = toISODate(new Date());
    state.month = startOfMonth(new Date());
    renderCalendar();
  });

  $('#fab').addEventListener('click', () => openForm());
  $('#btn-notif').addEventListener('click', requestNotifications);

  $('#inp-photos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const file of files) {
      try {
        state.draftPhotos.push(await resizeImage(file));
      } catch {
        toast('No se pudo añadir una de las fotos');
      }
    }
    renderDraftPhotos();
  });

  $('#dlg-event').addEventListener('close', () => {
    if ($('#dlg-event').returnValue === 'save') saveForm();
  });

  $('#btn-delete').addEventListener('click', async () => {
    const ev = state.editing;
    if (!ev || !confirm(`¿Borrar “${ev.title}”?`)) return;
    await DB.remove(ev.id);
    state.events = state.events.filter((e) => e.id !== ev.id);
    $('#dlg-event').close('deleted');
    renderAll();
    toast('Plan borrado');
  });

  $('#btn-close-view').addEventListener('click', () => $('#dlg-view').close());
  $('#btn-edit').addEventListener('click', () => {
    $('#dlg-view').close();
    openForm(state.viewing);
  });
  $('#btn-ics').addEventListener('click', () => downloadICS(state.viewing));

  // Cerrar diálogos tocando fuera.
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close('cancel'); });
  }

  const settings = loadSettings();
  $('#set-summary').checked = settings.summary;
  $('#set-summary').addEventListener('change', (e) => saveSettings({ ...loadSettings(), summary: e.target.checked }));

  $('#btn-test-notif').addEventListener('click', async () => {
    if (Notification.permission !== 'granted') await requestNotifications();
    if (!(await notify('📅 Mi Calendario', 'Así te llegarán los avisos de tus planes.', 'prueba'))) {
      toast('Primero activa los avisos');
    }
  });

  $('#btn-export').addEventListener('click', exportBackup);
  $('#inp-import').addEventListener('change', (e) => {
    if (e.target.files[0]) importBackup(e.target.files[0]);
    e.target.value = '';
  });

  // Al volver a la app, refrescar "hoy" y revisar avisos pendientes.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderCalendar();
      checkReminders();
      dailySummary();
    }
  });
}

async function init() {
  bindUI();
  updateNotifButton();
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
      swReg = await navigator.serviceWorker.ready;
    } catch { /* p. ej. abierto como archivo local */ }
  }
  state.events = await DB.all();
  renderAll();
  await checkReminders();
  await dailySummary();
  setInterval(checkReminders, 20000);
}

init();
