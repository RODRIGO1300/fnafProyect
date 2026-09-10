/* ================================================================
   Five Nights at Freddy's - clon
   FX: estática de televisión dibujada en canvas, a baja opacidad
   sobre toda la escena.
   ================================================================ */
(function () {
  "use strict";

  if (window.__BLOCKED__) return;

  var FNAF = window.FNAF;
  var cfg = FNAF.config;

  var canvas = FNAF.$("static");
  var ctx = canvas.getContext("2d");
  var W = cfg.staticSize[0];
  var H = cfg.staticSize[1];
  canvas.width = W;
  canvas.height = H;

  var image = ctx.createImageData(W, H);
  var buffer = new Uint32Array(image.data.buffer);
  var frame = 0;
  var running = true;

  function render() {
    if (running && frame % cfg.staticEveryNFrames === 0) {
      for (var i = 0; i < buffer.length; i++) {
        var v = (Math.random() * 255) | 0;
        buffer[i] = (255 << 24) | (v << 16) | (v << 8) | v; // 0xAABBGGRR
      }
      ctx.putImageData(image, 0, 0);
    }
    frame++;
    requestAnimationFrame(render);
  }

  // Pausa el ruido cuando la pestaña no está visible (ahorra CPU).
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
  });

  FNAF.fx = FNAF.fx || {};
  FNAF.fx.staticPause = function (v) {
    running = !v;
  };

  render();
})();
