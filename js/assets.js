/* ================================================================
   Five Nights at Freddy's - clon
   MANIFIESTO DE RECURSOS

   Un único sitio para las rutas de escenario/oficina. Los recursos
   propios de cada personaje (sprites de cámara, puerta, retrato) viven
   en su definición dentro de js/world.js.

   Para añadir contenido: suelta el .webp en assets/ y añade su ruta
   aquí (o en la ficha del personaje). Nada más lee rutas "a pelo".
   ================================================================ */
(function () {
  "use strict";

  var FNAF = window.FNAF;
  var ESC = "assets/escenarios/";
  var OFI = ESC + "sala-seguridad/";

  var assets = {
    newspaper: ESC + "periodico-inicio.webp",

    office: {
      base: OFI + "oficina-base.webp",
      doorLeft: OFI + "puerta-izquierda-cerrada.webp",
      doorRight: OFI + "puerta-derecha-cerrada.webp",
      lightLeft: OFI + "luz-izquierda-encendida.webp",
      lightRight: OFI + "luz-derecha-encendida.webp",
    },

    // Fondo de cada cámara (la Cocina es sólo-audio, sin imagen).
    camBackgrounds: {
      "1A": ESC + "cam-1a-escenario.webp",
      "1B": ESC + "cam-1b-comedor.webp",
      "1C": ESC + "cam-1c-cala.webp",
      "5": ESC + "cam-5-trastienda.webp",
      "7": ESC + "cam-7-aseos.webp",
      "3": ESC + "cam-3-almacen.webp",
      "2A": ESC + "cam-2a-pasillo-oeste.webp",
      "2B": ESC + "cam-2b-esquina-oeste.webp",
      "4A": ESC + "cam-4a-pasillo-este.webp",
      "4B": ESC + "cam-4b-esquina-este.webp",
    },
  };

  // Precarga silenciosa (el navegador cachea; si falla, no pasa nada).
  function preload(urls) {
    for (var i = 0; i < urls.length; i++) {
      if (!urls[i]) continue;
      var img = new Image();
      img.src = urls[i];
    }
  }

  // Reúne todas las rutas conocidas (escenario + personajes) y precarga.
  function preloadAll() {
    var urls = [assets.newspaper];
    var k;
    for (k in assets.office) urls.push(assets.office[k]);
    for (k in assets.camBackgrounds) urls.push(assets.camBackgrounds[k]);

    var chars = FNAF.world && FNAF.world.ANIMATRONICS;
    for (var id in chars) {
      var a = chars[id];
      if (a.rosterImage) urls.push(a.rosterImage);
      if (a.doorSprite) urls.push(a.doorSprite);
      if (a.cameraSprites) {
        for (var cam in a.cameraSprites) urls.push(a.cameraSprites[cam]);
      }
    }
    preload(urls);
  }

  FNAF.assets = assets;
  FNAF.assets.preload = preload;
  FNAF.assets.preloadAll = preloadAll;
})();
