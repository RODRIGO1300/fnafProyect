/* ================================================================
   Five Nights at Freddy's - clon
   OFICINA: puertas y luces (estado + entrada) y pintado de la vista
   por capas (base + puertas cerradas + luces) más el sprite del
   personaje asomado a la puerta.
   ================================================================ */
(function () {
  "use strict";

  if (window.__BLOCKED__) return;

  var FNAF = window.FNAF;
  var state = FNAF.state;
  var Sound = FNAF.Sound;
  var $ = FNAF.$;

  var lastSig = "";

  /* ---------------- Entrada: puertas y luces ---------------- */
  $("btn-left-door").addEventListener("click", function () {
    toggleDoor("doorLeft");
  });
  $("btn-right-door").addEventListener("click", function () {
    toggleDoor("doorRight");
  });
  holdButton("btn-left-light", "lightLeft");
  holdButton("btn-right-light", "lightRight");

  function toggleDoor(prop) {
    if (!FNAF.night.canAct()) return;
    state[prop] = !state[prop];
    Sound.doorSlam();
    render(true);
  }

  function holdButton(btnId, prop) {
    var btn = $(btnId);
    var on = function (e) {
      if (e) e.preventDefault();
      if (!FNAF.night.canAct()) return;
      state[prop] = true;
      render(true);
    };
    var off = function () {
      state[prop] = false;
      render(true);
    };
    btn.addEventListener("mousedown", on);
    btn.addEventListener("mouseup", off);
    btn.addEventListener("mouseleave", off);
    btn.addEventListener("touchstart", on);
    btn.addEventListener("touchend", off);
  }

  /* ---------------- Pintado ---------------- */
  function render(force) {
    var ai = FNAF.night.ai();
    var blackout = FNAF.night.isBlackout();
    var atRight =
      !!ai && ai.atDoor("right").indexOf("dogo") >= 0;

    var showDogoDoor =
      atRight && state.lightRight && !state.doorRight && !state.camOpen && !blackout;

    var sig = [
      state.doorLeft,
      state.doorRight,
      state.lightLeft,
      state.lightRight,
      blackout,
      showDogoDoor,
    ].join("|");
    if (!force && sig === lastSig) return;
    lastSig = sig;

    $("ofc-door-left").classList.toggle("on", state.doorLeft);
    $("ofc-door-right").classList.toggle("on", state.doorRight);
    $("ofc-light-left").classList.toggle("on", state.lightLeft && !state.doorLeft);
    $("ofc-light-right").classList.toggle("on", state.lightRight && !state.doorRight);

    $("btn-left-door").classList.toggle("active", state.doorLeft);
    $("btn-right-door").classList.toggle("active", state.doorRight);
    $("btn-left-light").classList.toggle("active", state.lightLeft);
    $("btn-right-light").classList.toggle("active", state.lightRight);

    $("dogo-door-right").classList.toggle("show", showDogoDoor);
  }

  FNAF.bus.on("render", function () {
    render(false);
  });
  FNAF.bus.on("night:start", function () {
    lastSig = "";
    render(true);
  });

  FNAF.office = { render: render };
})();
