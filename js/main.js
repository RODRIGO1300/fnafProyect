/* ================================================================
   Five Nights at Freddy's - clon
   ARRANQUE: precarga de recursos, reanudar audio al primer clic y
   mostrar el menú. El resto se auto-cablea vía el bus de eventos.

   Orden de carga (index.html):
     core → assets → audio → static → world → ai → scenes
     → night → office → cameras → menu → main
   ================================================================ */
(function () {
  "use strict";

  // Abierto fuera del ejecutable: js/platform.js ya mostró el aviso.
  if (window.__BLOCKED__) return;

  var FNAF = window.FNAF;

  FNAF.assets.preloadAll();

  // El audio de WebAudio necesita un gesto del usuario para sonar.
  document.addEventListener(
    "click",
    function once() {
      if (FNAF.storage.isSoundOn()) FNAF.Sound.resume();
      document.removeEventListener("click", once);
    },
    { once: true }
  );

  FNAF.menu.applySound();
  FNAF.menu.refresh();
  FNAF.scenes.show("menu");
})();
