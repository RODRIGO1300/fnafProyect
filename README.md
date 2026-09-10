# FNAF - clon (proyecto de práctica)

Clon del primer *Five Nights at Freddy's* con arte y código originales.
El **turno de noche completo** funciona (oficina por capas, cámaras con
foto de cada sala, energía, reloj, apagón, 6 a.m.). **Dogo** ya recorre las
cámaras del ala este; el resto del elenco (Caty, Roy, Remy) está reservado.

## Cómo jugar

Es una **aplicación de escritorio** (Electron). Para generar el
ejecutable:

```
npm install
npm run pack
```

Se crea `dist/FNAF Clon-win32-x64/FNAF Clon.exe` (carpeta portable, se
puede mover o comprimir entera). `npm start` lo lanza sin empaquetar.

Para un instalador único: `npm run dist` (necesita *Modo desarrollador*
de Windows o terminal como administrador). Detalles en
[`ARCHITECTURE.md`](ARCHITECTURE.md).

> El mismo `index.html` también abre en un navegador para desarrollo
> rápido, pero el producto es el `.exe`.

## Controles

| Acción | Cómo |
|--------|------|
| Cerrar / abrir puerta | Clic en "Puerta" de cada lado |
| Luz de pasillo | Mantener pulsado "Luz" |
| Abrir / cerrar cámaras | Pestaña "CÁMARAS" / barra "BAJAR MONITOR" / espacio |
| Cambiar de cámara | Clic en el mapa |

Aguanta de las 12 a.m. a las 6 a.m. sin quedarte sin energía. El consumo
sube con cada puerta, luz o cámara que uses; si llega a 0, apagón y
*Game Over*. Dogo **todavía no puede atraparte**: si llega a la puerta
derecha y la dejas abierta, se retira solo tras unos segundos.

## Estructura

Código modular sin build (se abre con `file://`, sin ES modules). Cada
`js/*.js` cuelga de `window.FNAF` y se cablea por un bus de eventos.

```
package.json          Electron + scripts de empaquetado
desktop/
  main.js             proceso principal de Electron (ventana)
  preload.js          puente seguro (window.desktop)
build/icon.ico        icono de la app
index.html            escenas + orden de carga
css/
  base.css            reset, marco 4:3, escenas, responsive
  menu.css            menú, elenco, noche personalizada
  intro.css           periódico + intro de noche
  office.css          oficina por capas, HUD, controles
  cameras.css         monitor, feed, mapa, sprite
  endings.css         jumpscare, game over, 6 a.m.
js/
  core.js             namespace, helpers, config, storage, bus, state
  assets.js           manifiesto de rutas + precarga
  audio.js            sonido procedural (WebAudio)
  static.js           estática de TV (canvas)
  world.js            salas/cámaras + elenco + NIGHT_AI + sprites SVG
  ai.js               motor de IA (sistema d20, rutas, apagón)
  scenes.js           gestor de escenas
  night.js            ciclo del turno, bucle, reloj, energía, HUD, finales
  office.js           puertas/luces + pintado de la oficina
  cameras.js          monitor, mapa, fondos y sprite por cámara
  menu.js             menú, elenco, noche personalizada, sonido
  main.js             arranque
tools/
  optimize-assets.py  convierte los PNG de assets/ a WebP
```

Detalle en [`ARCHITECTURE.md`](ARCHITECTURE.md). Elenco en
[`CHARACTERS.md`](CHARACTERS.md).

## Ajustar

- **Dificultad y tiempos**: `js/core.js` (`FNAF.config`) y `js/world.js`
  (`NIGHT_AI`, `moveInterval`, `path`).
- **Recursos**: imágenes en WebP (`python tools/optimize-assets.py`);
  rutas de escenario en `js/assets.js`, de personaje en su ficha de
  `js/world.js`.

---

Proyecto de fans sin ánimo de lucro. Arte y código originales.
No afiliado con Scott Cawthon / Scott Games.
