/* ================================================================
   Five Nights at Freddy's - clon
   NÚCLEO: espacio de nombres, helpers, configuración, almacenamiento
   y un bus de eventos mínimo.

   Todos los módulos cuelgan de window.FNAF y se cargan como <script>
   clásicos (el juego se abre con file://, sin build ni ES modules).
   ================================================================ */
(function () {
  "use strict";

  var FNAF = (window.FNAF = window.FNAF || {});

  /* ---------------- Helpers DOM / util ---------------- */
  FNAF.$ = function (id) {
    return document.getElementById(id);
  };
  FNAF.qs = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  FNAF.qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  FNAF.clamp = function (v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  };
  FNAF.rand = function (a, b) {
    return a + Math.random() * (b - a);
  };
  // reinicia una animación CSS de un elemento
  FNAF.restartAnim = function (el) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  };

  /* ---------------- Bus de eventos ---------------- */
  var handlers = {};
  FNAF.bus = {
    on: function (ev, fn) {
      (handlers[ev] = handlers[ev] || []).push(fn);
      return fn;
    },
    off: function (ev, fn) {
      var list = handlers[ev];
      if (!list) return;
      var i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    },
    emit: function (ev, data) {
      var list = handlers[ev];
      if (!list) return;
      for (var i = 0; i < list.length; i++) list[i](data);
    },
  };

  /* ---------------- Configuración (todo lo ajustable) ---------------- */
  FNAF.config = {
    hourMs: 45000, // duración de una "hora" de juego (6 h ≈ 4,5 min)
    drainPerBar: 0.09, // % de energía por segundo y barra de consumo
    maxFrameMs: 120, // límite de dt para pestañas en segundo plano
    nightIntroMs: 3000,
    jumpscareMs: 1100,
    jingleDelayMs: 1600,
    maxNight: 6, // última noche del modo historia
    starsCap: 6,
    // efecto de estática
    staticSize: [320, 240],
    staticEveryNFrames: 2,
  };

  /* ---------------- Almacenamiento persistente ---------------- */
  var LS = (function () {
    try {
      var t = "__fnaf__";
      window.localStorage.setItem(t, t);
      window.localStorage.removeItem(t);
      return window.localStorage;
    } catch (e) {
      return null;
    }
  })();

  FNAF.storage = {
    getMaxNight: function () {
      var v = parseInt((LS && LS.getItem("fnaf.maxNight")) || "1", 10);
      return isNaN(v) ? 1 : FNAF.clamp(v, 1, 7);
    },
    setMaxNight: function (v) {
      if (LS) LS.setItem("fnaf.maxNight", String(FNAF.clamp(v, 1, 7)));
    },
    isSoundOn: function () {
      return !LS || LS.getItem("fnaf.sound") !== "off";
    },
    setSoundOn: function (on) {
      if (LS) LS.setItem("fnaf.sound", on ? "on" : "off");
    },
  };

  /* ---------------- Estado compartido de la partida ---------------- */
  FNAF.state = {
    night: 1,
    custom: false,
    customLevels: {},
    hour: 0,
    hourAcc: 0,
    power: 100,
    doorLeft: false,
    doorRight: false,
    lightLeft: false,
    lightRight: false,
    camOpen: false,
    currentCam: "1A",
    running: false,
  };

  FNAF.resetState = function (night) {
    var s = FNAF.state;
    s.night = night;
    s.custom = night >= 7;
    s.hour = 0;
    s.hourAcc = 0;
    s.power = 100;
    s.doorLeft = s.doorRight = false;
    s.lightLeft = s.lightRight = false;
    s.camOpen = false;
    s.currentCam = "1A";
    s.running = true;
  };
})();
