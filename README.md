# Mi Calendario

Calendario personal al estilo Google Calendar, instalable en el móvil (PWA), con las clases,
entregas y exámenes del Máster en Ciencia y Tecnología Nuclear (UPM, curso 2026-27).

**App:** <https://enriquevalero004.github.io/Aplicacion-Calendar/>

## Qué hace

- **Vistas** de agenda, día, 3 días, semana y mes. Se desliza para cambiar de semana o mes y,
  tocando un hueco, se crea un evento a esa hora.
- **Clases automáticas** de las 16 asignaturas (cada una con su color), según el calendario académico:
  sin clases en festivos, vacaciones y días sin docencia, y con los cambios de horario
  (días que se sigue el horario del lunes). Se puede quitar una clase suelta.
- **Asignaturas**: ficha con horario, próximas clases, profesores y sus entregas.
  Se pueden editar, cambiar de color o añadir nuevas.
- **Entregas y exámenes**: exámenes, trabajos, entregables, ejercicios, prácticas y presentaciones,
  con fecha, aviso y nota. Se marcan como hechas.
- **Filtros**: ver solo universidad, clases, exámenes, entregas o planes, por asignatura o por tipo.
- **Planes personales** (General, Estudios, Amigos, Gym, Pareja), con repetición semanal
  y **Destacados** con fotos y descripción.
- **Avisos**: antes de cada plan o entrega, antes de cada clase (opcional) y resumen del día.
- **Añadir al calendario del móvil**: descarga un `.ics` para que el calendario del teléfono
  avise aunque la app esté cerrada.
- Todo se guarda en el dispositivo. Desde **Ajustes** se puede exportar/importar una copia.

## Datos del curso

Los datos de partida están en `datos/` (asignaturas de cada cuatrimestre, calendario académico y
entregas conocidas). Tras modificarlos, se regenera `data.js` con:

```sh
python3 datos/generar.py
```

La app añade las asignaturas y entregas nuevas sin duplicar las que ya tiene ni recuperar las que
se hayan borrado a propósito.

## Probarla en el ordenador

```sh
python3 -m http.server 8000
```

y abre <http://localhost:8000>.

## Sobre los avisos

Es una app web sin servidor: los avisos salen mientras la app está abierta o en segundo plano.
Para lo importante, usa **Añadir al calendario del móvil**. En iPhone, los avisos solo funcionan
con la app instalada en la pantalla de inicio.
