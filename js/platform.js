/* ================================================================
   Five Nights at Freddy's - clon
   GUARDA DE PLATAFORMA

   El juego sólo se ejecuta dentro del ejecutable de escritorio
   (Electron, que define window.desktop). Si se abre index.html en un
   navegador, se muestra un aviso y no arranca (main.js comprueba
   window.__BLOCKED__).
   ================================================================ */
(function () {
  "use strict";

  if (window.desktop && window.desktop.isDesktop) return;

  window.__BLOCKED__ = true;

  function showNotice() {
    var box = document.createElement("div");
    box.id = "browser-block";
    box.setAttribute(
      "style",
      "position:fixed;inset:0;z-index:99999;background:#050505;color:#c9c9c9;" +
        "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
        "text-align:center;padding:8vw;font-family:Consolas,\"Courier New\",monospace;"
    );
    box.innerHTML =
      '<div style="font-size:2.4vw;font-weight:700;letter-spacing:2px;color:#e6e6e6;">' +
      "Five Nights at Freddy&#39;s &mdash; clon</div>" +
      '<div style="font-size:1.3vw;margin-top:2vw;line-height:1.7;max-width:40em;">' +
      "Este juego es una aplicaci&oacute;n de escritorio.<br>" +
      "Ejec&uacute;talo desde <b>&laquo;FNAF Clon.exe&raquo;</b>." +
      "</div>" +
      '<div style="font-size:1vw;margin-top:3vw;color:#6a6a6a;">' +
      "Desarrollo:&nbsp; <code>npm&nbsp;install</code> &nbsp;&rarr;&nbsp; " +
      "<code>npm&nbsp;start</code> &nbsp;(o&nbsp; <code>npm&nbsp;run&nbsp;pack</code> &nbsp;para el&nbsp;.exe)" +
      "</div>";

    document.body.appendChild(box);
    // detiene la estática y cualquier animación de fondo
    try {
      if (window.FNAF && window.FNAF.fx && window.FNAF.fx.staticPause) {
        window.FNAF.fx.staticPause(true);
      }
    } catch (e) {}
  }

  if (document.body) showNotice();
  else document.addEventListener("DOMContentLoaded", showNotice);
})();
