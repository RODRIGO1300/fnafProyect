# Arquitectura

El juego es una sola página (HTML/CSS/JS vanilla, sin build) que se
**empaqueta como ejecutable de escritorio con Electron**. Sólo se
ejecuta dentro de Electron: `js/platform.js` detecta `window.desktop`
(que define `desktop/preload.js`) y, si falta, muestra un aviso y no
arranca. Cada módulo comprueba `window.__BLOCKED__`.

Como se carga con `file://`, **no** se usan ES modules: cada archivo es
un `<script>` clásico que cuelga de `window.FNAF`.

## Capa de escritorio (`desktop/`)

| Archivo | Qué hace |
|---|---|
| `desktop/main.js` | Proceso principal de Electron: crea la `BrowserWindow` (4:3, sin menú, `backgroundThrottling:false`), carga `index.html`, F11 pantalla completa, instancia única, abre enlaces externos en el navegador del sistema. |
| `desktop/preload.js` | Puente con `contextIsolation`: expone `window.desktop` (`isDesktop`, `quit()`, `toggleFullscreen()`). El juego sólo lo usa para mostrar el botón **Salir** del menú. |

El código del juego (`js/*.js`) no sabe si corre en Electron o en un
navegador; sólo comprueba `window.desktop`.

## Construir el ejecutable

```
npm install
npm run pack     # -> dist/FNAF Clon-win32-x64/FNAF Clon.exe  (carpeta portable)
npm start        # ejecuta sin empaquetar (modo desarrollo, con DevTools)
```

`npm run pack` usa **@electron/packager** y no necesita permisos
especiales. Para un **instalador NSIS + .exe portable único** hay
`npm run dist` (electron-builder), pero en Windows requiere *Modo
desarrollador* activado o terminal como administrador (electron-builder
extrae symlinks para firmar en su caché).

## Flujo de carga (orden en `index.html`)

```
platform → core → assets → audio → static → world → ai
         → scenes → night → office → cameras → menu → main
```

Cada módulo se registra en el bus de eventos al cargarse; `main.js`
sólo precarga recursos, arranca el audio y muestra el menú.

## Módulos (`js/`)

| Archivo | Responsabilidad | Expone |
|---|---|---|
| `platform.js` | Guarda: si no se corre dentro de Electron (`window.desktop`), inyecta un aviso y marca `window.__BLOCKED__`; el resto de módulos se auto-desactivan. | `window.__BLOCKED__` |
| `core.js` | Espacio de nombres, helpers (`$`, `qs`, `qsa`, `clamp`…), **config** (todos los números ajustables), **storage** (progreso + sonido), **bus** de eventos, `state` compartido. | `FNAF.config`, `FNAF.state`, `FNAF.bus`, `FNAF.storage`, helpers |
| `assets.js` | Manifiesto único de rutas de escenario/oficina + precargador. | `FNAF.assets` |
| `audio.js` | Sonido 100 % procedural (WebAudio). | `FNAF.Sound` |
| `static.js` | Estática de TV en canvas (se pausa con la pestaña oculta). | `FNAF.fx` |
| `world.js` | Datos del mundo: salas/cámaras, elenco (`ANIMATRONICS`), rutas, `NIGHT_AI`, sprites SVG de respaldo. | `FNAF.world` |
| `ai.js` | Motor de IA: sistema d20, rutas, apagón. Emite `ai:moved`. | `FNAF.AI.create(hooks)` |
| `scenes.js` | Muestra una `<section id="scene-*">` a la vez. Emite `scene`. | `FNAF.scenes` |
| `night.js` | Ciclo del turno, bucle rAF, reloj, energía, apagón, HUD, finales. Emite `render`, `night:start`, `stars`, `menu:refresh`. | `FNAF.night` |
| `office.js` | Puertas/luces (estado + entrada) y pintado por capas de la oficina. | `FNAF.office` |
| `cameras.js` | Monitor, mapa, selección, fondo y sprite del personaje por cámara. | `FNAF.cameras` |
| `menu.js` | Menú principal, Elenco, Noche Personalizada, interruptor de sonido, estrellas. | `FNAF.menu` |
| `main.js` | Arranque. | — |

## Eventos del bus

| Evento | Lo emite | Lo escucha |
|---|---|---|
| `render` | `night.js` (cada frame), `office.js`, `cameras.js` | `office.js`, `cameras.js` (repintan **sólo si su firma cambió**) |
| `night:start` | `night.js` | `office.js`, `cameras.js` (reinician su estado visual) |
| `ai:moved` | `ai.js` | — (informativo) |
| `stars` | `night.js` | `menu.js` (pinta las estrellas en el elemento recibido) |
| `menu:refresh` | `night.js` | `menu.js` |
| `scene` | `scenes.js` | — |

## Optimización

- **Imágenes en WebP** (`assets/**/*.webp`): ~50 MB → ~4 MB. Convierte
  con `tools/optimize-assets.py`.
- **Pintado con memoria de firma**: `office.js` y `cameras.js` calculan
  una cadena con su estado relevante y sólo tocan el DOM si cambió, aun
  cuando el bucle emite `render` a 60 fps.
- **HUD memoizado**: `night.js` sólo reescribe hora/energía/uso cuando el
  valor mostrado cambia.
- **Estática**: canvas de 320×240, ruido cada 2 frames, en pausa si la
  pestaña no está visible.

## Cómo crecer

- **Ajustar dificultad / tiempos**: `js/core.js` (`config`) y
  `js/world.js` (`NIGHT_AI`, `moveInterval`, `path`).
- **Añadir un animatrónico**: ficha en `world.js` con `implemented:true`,
  entrada en `NIGHT_AI`, sus sprites, y su rama en `ai.js` → `behave()`.
  `office.js` / `cameras.js` ya pintan lo que el motor reporte.
- **Nueva pantalla**: añade `<section id="scene-x">`, métela en la lista
  de `scenes.js` y su módulo de UI.
- **Nuevos recursos de escenario**: `.webp` en `assets/` + ruta en
  `js/assets.js`.
