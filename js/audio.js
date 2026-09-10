/* ================================================================
   Five Nights at Freddy's - clon
   Sonido 100% procedural (WebAudio). No usa archivos de audio.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = (window.FNAF = window.FNAF || {});

  var ctx = null;
  var master = null;
  var ambienceNode = null;
  var jingleTimer = null;
  var enabled = true;

  function ensure() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      enabled = false;
      return;
    }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }

  function resume() {
    ensure();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function now() {
    return ctx.currentTime;
  }

  /* ---------- generadores base ---------- */
  function noiseBuffer(seconds) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function tone(freq, t0, dur, type, gain, glideTo) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function burst(t0, dur, filterType, freq, gain) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur + 0.05);
    var f = ctx.createBiquadFilter();
    f.type = filterType || "bandpass";
    f.frequency.value = freq || 800;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain || 0.4, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  /* ---------- API pública ---------- */
  var Sound = {
    setEnabled: function (v) {
      enabled = v;
      if (!v) this.stopAmbience(), this.stopJingle();
    },

    // paso lento de un animatrónico
    step: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      burst(t, 0.14, "lowpass", 220, 0.35);
      tone(70, t, 0.16, "sine", 0.25, 45);
    },

    // risa grave de Bruno al cambiar de sala
    laugh: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      var base = 180;
      for (var i = 0; i < 5; i++) {
        var tt = t + i * 0.13;
        tone(base - i * 12, tt, 0.11, "sawtooth", 0.12, base - i * 12 - 30);
      }
      burst(t, 0.6, "bandpass", 300, 0.05);
    },

    // portazo de puerta
    doorSlam: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      burst(t, 0.25, "lowpass", 400, 0.6);
      tone(120, t, 0.3, "square", 0.4, 40);
    },

    // golpe fuerte de Rufo en la puerta
    foxyBang: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      for (var i = 0; i < 3; i++) {
        burst(t + i * 0.09, 0.12, "lowpass", 300, 0.7);
        tone(90, t + i * 0.09, 0.14, "square", 0.5, 50);
      }
    },

    // esprint de Rufo por el pasillo
    foxyRun: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      for (var i = 0; i < 10; i++) burst(t + i * 0.07, 0.06, "bandpass", 500 + i * 40, 0.3);
    },

    // cámara arriba/abajo
    camToggle: function (up) {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      burst(t, 0.18, "highpass", up ? 1200 : 600, 0.25);
      tone(up ? 240 : 160, t, 0.12, "square", 0.12);
    },

    // corte de energía
    powerOut: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      tone(200, t, 1.4, "sawtooth", 0.3, 30);
      burst(t, 1.2, "lowpass", 300, 0.2);
    },

    // melodía de caja de música durante el apagón (original, en bucle)
    startJingle: function () {
      if (!enabled) return;
      resume();
      if (!ctx || jingleTimer) return;
      var melody = [523, 494, 440, 494, 523, 587, 523, 440]; // do-si-la...
      var step = 0;
      var play = function () {
        if (!ctx) return;
        var t = now();
        tone(melody[step % melody.length], t, 0.42, "triangle", 0.18);
        tone(melody[step % melody.length] / 2, t, 0.42, "sine", 0.06);
        step++;
      };
      play();
      jingleTimer = setInterval(play, 460);
    },
    stopJingle: function () {
      if (jingleTimer) clearInterval(jingleTimer), (jingleTimer = null);
    },

    // grito del jumpscare
    jumpscare: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      burst(t, 0.9, "highpass", 2000, 0.9);
      burst(t, 0.9, "bandpass", 900, 0.7);
      for (var i = 0; i < 6; i++)
        tone(1400 + Math.random() * 1600, t, 0.5 + Math.random() * 0.4, "sawtooth", 0.25);
      tone(120, t, 1.0, "square", 0.4, 60);
    },

    // campanadas de las 6 a.m. + jaleo
    chime6am: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      for (var i = 0; i < 6; i++) {
        var tt = t + i * 0.5;
        tone(660, tt, 0.45, "triangle", 0.25);
        tone(990, tt, 0.45, "sine", 0.12);
      }
      burst(t + 3, 2.5, "bandpass", 1200, 0.12); // "niños/vitoreo"
    },

    // zumbido de Áureo
    goldenHum: function () {
      if (!enabled) return;
      resume();
      if (!ctx) return;
      var t = now();
      tone(3000, t, 1.6, "sine", 0.05);
      tone(60, t, 1.6, "sawtooth", 0.12);
    },

    // ambiente continuo del ventilador de la oficina
    startAmbience: function () {
      if (!enabled) return;
      resume();
      if (!ctx || ambienceNode) return;
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(2);
      src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 340;
      var g = ctx.createGain();
      g.gain.value = 0.06;
      // leve wobble del ventilador
      var lfo = ctx.createOscillator();
      var lg = ctx.createGain();
      lfo.frequency.value = 8;
      lg.gain.value = 0.015;
      lfo.connect(lg);
      lg.connect(g.gain);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start();
      lfo.start();
      ambienceNode = { src: src, lfo: lfo };
    },
    stopAmbience: function () {
      if (!ambienceNode) return;
      try {
        ambienceNode.src.stop();
        ambienceNode.lfo.stop();
      } catch (e) {}
      ambienceNode = null;
    },

    resume: resume,
  };

  FNAF.Sound = Sound;
})();
