/* ================================================================
   Five Nights at Freddy's - clon
   NOCHE: ciclo de vida del turno (periódico → intro → oficina → fin),
   bucle principal, reloj, energía, apagón, HUD y pantallas de final.

   El bucle emite "render" cada frame; office.js y cameras.js pintan
   sólo si su firma cambió.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = window.FNAF;
  var cfg = FNAF.config;
  var state = FNAF.state;
  var Sound = FNAF.Sound;
  var scenes = FNAF.scenes;
  var $ = FNAF.$;

  var ai = null;
  var lastTs = 0;
  var rafId = 0;

  /* ---------------------------------------------------------------
     Hooks del motor de IA
     --------------------------------------------------------------- */
  var hooks = {
    cameraUp: function () {
      return state.camOpen;
    },
    viewedCam: function () {
      return state.camOpen ? state.currentCam : null;
    },
    doorClosed: function (side) {
      return side === "left" ? state.doorLeft : state.doorRight;
    },
    hour: function () {
      return state.hour;
    },
    power: function () {
      return state.power;
    },
    camDownMs: function () {
      return FNAF.cameras ? FNAF.cameras.downMs() : 0;
    },
    addPowerDrain: function (pct) {
      state.power = Math.max(0, state.power - pct);
    },
    onBlackoutOver: function () {
      gameOver("Se acabó la energía.");
    },
    jumpscare: function (id) {
      var a = FNAF.world.ANIMATRONICS[id];
      gameOver("Te atrapó " + (a ? a.name : "algo") + ".", id);
    },
  };

  /* ---------------------------------------------------------------
     Flujo: menú → periódico → intro → noche
     --------------------------------------------------------------- */
  function startFromMenu(night) {
    state.night = night;
    state.custom = false;
    scenes.show("news");
  }

  function enterNightIntro() {
    scenes.show("nightintro");
    $("night-label").textContent = state.custom ? "Noche 7" : "Noche " + state.night;
    $("night-clock").textContent = "12:00 AM";
    FNAF.restartAnim(FNAF.qs(".night-intro"));
    setTimeout(function () {
      startNight(state.night);
    }, cfg.nightIntroMs);
  }

  function startNight(night) {
    FNAF.resetState(night);

    ai = FNAF.AI.create(hooks);
    ai.setNight(night);
    ai.reset({
      levels: FNAF.world.aiForNight(night, state.custom ? state.customLevels : null),
    });

    $("hud-night").textContent = state.custom ? "Noche 7" : "Noche " + night;
    $("jumpscare").classList.remove("show");
    scenes.el("office").classList.remove("blackout");

    FNAF.bus.emit("night:start");
    resetHudMemo();
    updateHud();
    scenes.show("office");

    Sound.startAmbience();
    lastTs = 0;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------------
     Bucle principal
     --------------------------------------------------------------- */
  function loop(ts) {
    if (!state.running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min(cfg.maxFrameMs, ts - lastTs);
    lastTs = ts;

    // reloj
    state.hourAcc += dt;
    if (state.hourAcc >= cfg.hourMs) {
      state.hourAcc -= cfg.hourMs;
      state.hour++;
      updateHud(true);
      if (state.hour >= 6) return winNight();
    }

    // energía
    if (state.power > 0) {
      state.power = Math.max(
        0,
        state.power - usageBars() * cfg.drainPerBar * (dt / 1000)
      );
      if (state.power === 0) enterBlackout();
    }

    ai.update(dt);
    if (ai.isOver()) return;

    FNAF.bus.emit("render");
    updateHud();
    rafId = requestAnimationFrame(loop);
  }

  function usageBars() {
    var b = 1;
    if (state.doorLeft) b++;
    if (state.doorRight) b++;
    if (state.lightLeft) b++;
    if (state.lightRight) b++;
    if (state.camOpen) b++;
    return b;
  }

  /* ---------------------------------------------------------------
     HUD (memoizado: sólo toca el DOM si cambió el valor)
     --------------------------------------------------------------- */
  var hudMemo = {};
  function resetHudMemo() {
    hudMemo = {};
  }
  function fmtHour() {
    return (state.hour === 0 ? 12 : state.hour) + " AM";
  }
  function updateHud(tick) {
    var hh = fmtHour();
    if (hudMemo.hour !== hh || tick) {
      var t = $("hud-time");
      t.textContent = hh;
      $("cam-clock").textContent = hh;
      if (tick) {
        t.classList.remove("tick");
        void t.offsetWidth;
        t.classList.add("tick");
      }
      hudMemo.hour = hh;
    }
    var pw = Math.ceil(state.power);
    if (hudMemo.power !== pw) {
      $("power-value").textContent = pw;
      hudMemo.power = pw;
    }
    var bars = usageBars();
    if (hudMemo.bars !== bars) {
      var u = $("power-usage");
      u.textContent = new Array(bars + 1).join("■");
      u.style.color = bars <= 2 ? "#35d635" : bars <= 4 ? "#e8e800" : "#ff4040";
      hudMemo.bars = bars;
    }
  }

  /* ---------------------------------------------------------------
     Apagón
     --------------------------------------------------------------- */
  function enterBlackout() {
    if (ai.isBlackout()) return;
    state.doorLeft = state.doorRight = false;
    state.lightLeft = state.lightRight = false;
    if (FNAF.cameras) FNAF.cameras.setOpen(false);
    scenes.el("office").classList.add("blackout");
    ai.beginBlackout();
    Sound.stopAmbience();
    Sound.powerOut();
    FNAF.bus.emit("render");
    setTimeout(function () {
      if (state.running && ai.isBlackout()) Sound.startJingle();
    }, cfg.jingleDelayMs);
  }

  /* ---------------------------------------------------------------
     Finales
     --------------------------------------------------------------- */
  function stopLoop() {
    state.running = false;
    cancelAnimationFrame(rafId);
    Sound.stopJingle();
    Sound.stopAmbience();
  }

  function gameOver(reason, charId) {
    if (!state.running) return;
    stopLoop();
    FNAF.bus.emit("render");

    if (charId) {
      Sound.jumpscare();
      $("js-sprite").innerHTML = FNAF.world.spriteFor(charId, "jumpscare");
      $("jumpscare").classList.add("show");
      setTimeout(function () {
        $("jumpscare").classList.remove("show");
        showGameOver(reason);
      }, cfg.jumpscareMs);
    } else {
      showGameOver(reason);
    }
  }
  function showGameOver(reason) {
    $("go-sub").textContent = reason || "";
    scenes.show("gameover");
  }

  function winNight() {
    stopLoop();
    Sound.chime6am();
    scenes.el("office").classList.remove("blackout");

    if (!state.custom) {
      FNAF.storage.setMaxNight(
        Math.max(FNAF.storage.getMaxNight(), Math.min(state.night + 1, 7))
      );
    }
    $("am-sub").textContent = state.custom
      ? "Has superado la noche personalizada"
      : "Has sobrevivido la Noche " + state.night;
    FNAF.bus.emit("stars", $("am-stars"));
    scenes.show("sixam");
  }

  function backToMenu() {
    scenes.show("menu");
    FNAF.bus.emit("menu:refresh");
  }

  /* ---------------------------------------------------------------
     Wiring de botones del flujo
     --------------------------------------------------------------- */
  FNAF.qs("#scene-news .newspaper").addEventListener("click", enterNightIntro);
  $("btn-gameover-continue").addEventListener("click", backToMenu);
  $("btn-6am-continue").addEventListener("click", function () {
    if (!state.custom && state.night < cfg.maxNight) {
      state.night += 1;
      enterNightIntro();
    } else {
      backToMenu();
    }
  });

  /* ---------------------------------------------------------------
     API pública
     --------------------------------------------------------------- */
  FNAF.night = {
    startFromMenu: startFromMenu,
    gameOver: gameOver,
    ai: function () {
      return ai;
    },
    isBlackout: function () {
      return !!ai && ai.isBlackout();
    },
    canAct: function () {
      return state.running && state.power > 0 && !!ai && !ai.isBlackout();
    },
  };
})();
