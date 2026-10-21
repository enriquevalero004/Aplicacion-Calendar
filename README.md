# Mi Calendario

App sencilla para organizar los días, instalable en el móvil (PWA).

- **Calendario mensual** con los planes de cada día.
- **Avisos**: notificación antes de cada plan (a la hora, 10 min, 30 min, 1 h, 2 h o 1 día antes)
  y un resumen de los planes del día al abrir la app.
- **Tipos de plan**: General, Estudios, Amigos, Gym y Pareja, cada uno con su color.
- **Planes que se repiten**: cada semana en los días que elijas (p. ej. gym L-X-V) o todos los días,
  con fecha de fin opcional. Puedes saltarte un día suelto sin borrar el resto.
- **Destacados**: marca cualquier plan como destacado, añade fotos y una descripción, y aparecerá
  en la pestaña **Destacados** (con filtro por tipo).
- **Añadir al calendario del móvil**: descarga el plan como `.ics` para guardarlo en el calendario
  del móvil con su alarma (avisa aunque la app esté cerrada).
- Todo se guarda en el propio dispositivo. Desde **Ajustes** puedes exportar/importar una copia.

## Cómo usarla en el móvil

1. En GitHub: **Settings → Pages → Build and deployment**, elige *Deploy from a branch*,
   rama `main` y carpeta `/ (root)`. En un par de minutos estará en
   `https://<tu-usuario>.github.io/aplicacion-calendar/`.
2. Abre esa dirección en el móvil:
   - **Android (Chrome)**: menú ⋮ → *Añadir a pantalla de inicio* / *Instalar app*.
   - **iPhone (Safari)**: botón Compartir → *Añadir a pantalla de inicio*.
     (En iPhone las notificaciones solo funcionan con la app instalada así.)
3. Abre la app desde el icono y pulsa **🔔 Activar avisos**.

## Probarla en el ordenador

```sh
python3 -m http.server 8000
```

y abre <http://localhost:8000>.

## Sobre los avisos

Es una app web sin servidor, así que los avisos salen mientras la app está abierta o en
segundo plano. Si el sistema la cierra del todo, usa **Añadir al calendario del móvil** en los planes
importantes para que el calendario del móvil te avise sí o sí.
