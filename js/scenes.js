/* ================================================================
   Five Nights at Freddy's - clon
   GESTOR DE ESCENAS: muestra una <section id="scene-*"> a la vez y
   avisa por el bus ("scene").
   ================================================================ */
(function () {
  "use strict";

  var FNAF = window.FNAF;

  var NAMES = [
    "menu",
    "roster",
    "custom",
    "news",
    "nightintro",
    "office",
    "gameover",
    "sixam",
  ];

  var els = {};
  NAMES.forEach(function (n) {
    els[n] = FNAF.$("scene-" + n);
  });

  var current = "menu";

  FNAF.scenes = {
    names: NAMES,
    show: function (name) {
      current = name;
      NAMES.forEach(function (n) {
        els[n].classList.toggle("active", n === name);
      });
      FNAF.bus.emit("scene", name);
    },
    current: function () {
      return current;
    },
    is: function (name) {
      return current === name;
    },
    el: function (name) {
      return els[name];
    },
  };
})();
