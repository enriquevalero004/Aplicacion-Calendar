"""Genera data.js a partir de los archivos JSON de esta carpeta.

Uso: python3 datos/generar.py
"""
import hashlib
import json
from pathlib import Path

DIR = Path(__file__).parent
ROOT = DIR.parent

# Color y nombre corto de cada asignatura: mismo tono que el horario de la UPM,
# sin repetir colores entre cuatrimestres.
EXTRA = {
    '53001586': ('#d50000', 'Física Nuclear'),
    '53001592': ('#f6bf26', 'Termohidráulica'),
    '53001593': ('#33b679', 'Métodos Numéricos'),
    '53001594-S1': ('#039be5', 'Materiales Irrad.'),
    '53001596': ('#7986cb', 'Transporte'),
    '53001598': ('#d81b60', 'Nanosistemas'),
    '53001606': ('#f4511e', 'Tec. Radiaciones'),
    '53001587': ('#e67c73', 'Reactores Avanz.'),
    '53001588': ('#c0ca33', 'Seg. Energética'),
    '53001589': ('#0b8043', 'Fusión'),
    '53001590': ('#009688', 'Neutrónica'),
    '53001591': ('#3f51b5', 'Transmutación'),
    '53001595': ('#8e24aa', 'Diseño Reactores'),
    '53001599': ('#ef8f00', 'Fiabilidad'),
    '53001600': ('#ad1457', 'Seg. Nuclear'),
    '53001601': ('#9e9d24', 'Gestión Residuos'),
}
DAYS = {'lunes': 0, 'martes': 1, 'miércoles': 2, 'jueves': 3, 'viernes': 4, 'sábado': 5, 'domingo': 6}


def subject_id(code):
    return 's-' + code.lower()


def load(name):
    return json.loads((DIR / name).read_text(encoding='utf-8'))


subjects = []
for sem in (1, 2):
    for a in load(f'cuatrimestre-{sem}.json')['asignaturas']:
        color, short = EXTRA[a['codigo']]
        subjects.append({
            'id': subject_id(a['codigo']),
            'code': a['codigo'], 'name': a['nombre'], 'short': short, 'color': color,
            'semester': sem, 'room': a['aula'] or '', 'teachers': a['profesores'],
            'schedule': [{'day': DAYS[c['dia']], 'start': c['inicio'], 'end': c['fin']} for c in a['clases']],
        })

tasks = []
for t in load('tareas.json'):
    # Id estable: si se vuelve a generar, la app no duplica la tarea.
    key = f"{t['asignatura']}|{t['titulo']}|{t['fecha']}"
    tasks.append({
        'id': 't-' + hashlib.sha1(key.encode()).hexdigest()[:12],
        'subjectId': subject_id(t['asignatura']), 'type': t['tipo'], 'title': t['titulo'],
        'date': t['fecha'], 'time': t.get('hora') or '', 'end': t.get('fin') or '',
        'place': t.get('lugar') or '', 'notes': t.get('notas') or '',
        'remind': 2880 if t['tipo'] in ('examen', 'presentacion') else 1440,
    })

cal = load('calendario-academico-2026-27.json')
academic = {
    'year': cal['curso'],
    'semesters': {k: {'start': v['inicioClases'], 'end': v['finClases']}
                  for k, v in cal['cuatrimestres'].items() if k in ('1', '2')},
    'holidays': cal['festivos'],
    'vacations': [{'start': v['inicio'], 'end': v['fin'], 'name': v['nombre']} for v in cal['vacaciones']],
    'noTeaching': [{'start': v['inicio'], 'end': v['fin'], 'name': v['nombre']} for v in cal['sinDocencia']],
    'examPeriods': [{'start': v['inicio'], 'end': v['fin'], 'name': v['nombre']} for v in cal['periodosExamenes']],
    'pec': [{'start': v['inicio'], 'end': v['fin']} for v in cal['pecsGrado']],
    'swaps': {c['fecha']: DAYS[c['horarioDe']] for c in cal['cambioDocencia']},
}

dump = lambda x: json.dumps(x, ensure_ascii=False, indent=2)
(ROOT / 'data.js').write_text('\n'.join([
    '// Datos iniciales: asignaturas del máster, entregas conocidas y calendario académico 2026-27 (UPM).',
    '// Archivo generado con datos/generar.py a partir de los JSON de la carpeta datos/. No editar a mano.',
    '',
    f'const SEED_SUBJECTS = {dump(subjects)};',
    '',
    f'const SEED_TASKS = {dump(tasks)};',
    '',
    f'const ACADEMIC = {dump(academic)};',
    '',
]), encoding='utf-8')
print(f'data.js: {len(subjects)} asignaturas, {len(tasks)} entregas')
