/* ================================================================
   Efecto de estatica de television dibujado en canvas.
   Se ejecuta de forma continua a baja opacidad sobre toda la escena.
   ================================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("static");
  var ctx = canvas.getContext("2d");
  var W = 320;
  var H = 240;

  canvas.width = W;
  canvas.height = H;

  var image = ctx.createImageData(W, H);
  var buffer = new Uint32Array(image.data.buffer);
  var frame = 0;

  function render() {
    // Regenerar el ruido cada 2 frames para un parpadeo mas suave
    if (frame % 2 === 0) {
      for (var i = 0; i < buffer.length; i++) {
        var v = (Math.random() * 255) | 0;
        // 0xAABBGGRR (little-endian)
        buffer[i] = (255 << 24) | (v << 16) | (v << 8) | v;
      }
      ctx.putImageData(image, 0, 0);
    }
    frame++;
    requestAnimationFrame(render);
  }

  render();
})();
