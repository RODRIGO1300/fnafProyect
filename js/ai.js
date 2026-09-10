/* ================================================================
   Five Nights at Freddy's - clon
   MOTOR DE IA DE LOS ANIMATRÓNICOS

   Reproduce el sistema del original: cada animatrónico tiene un nivel
   0-20 y, cada X segundos, "tira" un dado de 20; si el resultado es
   <= su nivel, avanza. Cada personaje tiene además reglas propias.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = (window.FNAF = window.FNAF || {});
  var C = FNAF.chars;

  function roll(level) {
    return Math.floor(Math.random() * 20) + 1 <= level;
  }
  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  /* hooks esperados:
     cameraUp()        -> bool      monitor levantado
     viewedCam()       -> string    cámara que se está viendo
     doorClosed(side)  -> bool      'left' | 'right'
     hour()            -> int       0..6
     power()           -> number    0..100
     camDownMs()       -> number    ms que el monitor lleva bajado (0 si arriba)
     addPowerDrain(p)  -> void      resta p% de energía de golpe
     jumpscare(id)     -> void      muerte
     onMove(id)        -> void      cambió de sala (sonido de risa/pasos)
     onFoxyRun()       -> void
     onFoxyBlocked()   -> void
  */
  function create(hooks) {
    var levels = { bruno: 0, vega: 0, pola: 0, rufo: 0 };
    var actors = {};
    var elapsed = 0;
    var movedOnce = { vega: false, pola: false };
    var blackout = null; // { timer }
    var over = false;

    function reset(cfg) {
      levels = cfg.levels;
      elapsed = 0;
      over = false;
      blackout = null;
      movedOnce = { vega: false, pola: false };
      actors = {
        bruno: mk("bruno", { pathIdx: 0, inOffice: false, wait: 0 }),
        vega: mk("vega", { pathIdx: 0, atDoor: false, inOffice: false, officeTimer: 0 }),
        pola: mk("pola", { pathIdx: 0, atDoor: false, inOffice: false, officeTimer: 0 }),
        rufo: mk("rufo", {
          stage: 0,
          running: false,
          runTimer: 0,
          hits: 0,
          nudged: false,
        }),
      };
    }

    function mk(id, extra) {
      var def = C.ANIMATRONICS[id];
      var base = { id: id, room: def.start, timer: 0, def: def };
      for (var k in extra) base[k] = extra[k];
      return base;
    }

    // Sube +1 a todos a las 4 a.m. en noches avanzadas (como el original).
    function effLevel(id) {
      var lv = levels[id];
      if (
        hooks.hour() >= C.LATE_NIGHT_BOOST_HOUR &&
        currentNight() >= C.LATE_NIGHT_BOOST_FROM_NIGHT
      ) {
        lv += 1;
      }
      // Bruno se envalentona con poca energía.
      if (id === "bruno" && hooks.power() < 30) lv += 2;
      return lv;
    }
    var _night = 1;
    function currentNight() {
      return _night;
    }
    function setNight(n) {
      _night = n;
    }

    /* ---------------------------------------------------------------
       APAGÓN: Bruno en la puerta izquierda + cuenta atrás
       --------------------------------------------------------------- */
    function beginBlackout() {
      if (blackout) return;
      // margen aleatorio; en noches altas es más corto
      var t = randRange(5000, 20000) - currentNight() * 900;
      blackout = { timer: Math.max(3000, t) };
      actors.bruno.room = "blackout-left";
      actors.bruno.inOffice = false;
    }

    function isBlackout() {
      return !!blackout;
    }

    /* ---------------------------------------------------------------
       UPDATE
       --------------------------------------------------------------- */
    function update(dt) {
      if (over) return;
      elapsed += dt;

      if (blackout) {
        blackout.timer -= dt;
        if (blackout.timer <= 0) {
          over = true;
          hooks.jumpscare("bruno");
        }
        return; // durante el apagón nadie más se mueve
      }

      updateDoorActor(actors.vega, dt);
      updateDoorActor(actors.pola, dt);
      updateBruno(dt);
      updateRufo(dt);
    }

    /* ---------- Vega / Pola ---------- */
    function updateDoorActor(a, dt) {
      var side = a.def.door; // 'left' | 'right'

      if (a.inOffice) {
        if (hooks.doorClosed(side)) {
          // atrapado -> se marcha
          a.inOffice = false;
          a.atDoor = false;
          a.pathIdx = 0;
          a.room = a.def.start;
          a.officeTimer = 0;
          return;
        }
        if (!hooks.cameraUp()) {
          a.officeTimer += dt;
          if (a.officeTimer > 1500) {
            over = true;
            hooks.jumpscare(a.id);
          }
        } else {
          a.officeTimer = 0;
        }
        return;
      }

      a.timer += dt;
      if (a.timer < a.def.moveInterval) return;
      a.timer = 0;

      if (a.atDoor) {
        // resolver: entrar o marcharse
        if (hooks.doorClosed(side)) {
          a.atDoor = false;
          a.pathIdx = 0;
          a.room = "1A";
        } else if (roll(effLevel(a.id))) {
          a.inOffice = true;
          a.officeTimer = 0;
        }
        return;
      }

      if (!roll(effLevel(a.id))) return;

      // avanzar por la ruta (con ramas)
      var branches = a.def.branches && a.def.branches[a.room];
      var next;
      if (branches) {
        next = branches[Math.floor(Math.random() * branches.length)];
      } else {
        next = a.def.path[Math.min(a.pathIdx + 1, a.def.path.length - 1)];
      }
      if (next === "office") return;
      a.room = next;
      var idx = a.def.path.indexOf(next);
      a.pathIdx = idx >= 0 ? idx : a.pathIdx + 1;
      movedOnce[a.id] = true;
      hooks.onMove(a.id);

      if (a.room === C.DOOR_CAM[side]) a.atDoor = true;
    }

    /* ---------- Bruno ---------- */
    function updateBruno(dt) {
      var a = actors.bruno;

      if (a.inOffice) {
        if (!hooks.cameraUp()) {
          a.wait += dt;
          if (a.wait > 1000) {
            over = true;
            hooks.jumpscare("bruno");
          }
        } else {
          a.wait = 0;
        }
        return;
      }

      // no se activa hasta que Vega y Pola se hayan movido una vez
      if (!movedOnce.vega || !movedOnce.pola) return;

      a.timer += dt;
      if (a.timer < a.def.moveInterval) return;
      a.timer = 0;

      // congelado si lo estás mirando por cámara
      if (hooks.cameraUp() && hooks.viewedCam() === a.room) return;
      if (!roll(effLevel("bruno"))) return;

      if (a.room === "4B") {
        // en la esquina este: si la puerta derecha está cerrada, retrocede
        if (hooks.doorClosed("right")) {
          a.pathIdx = Math.max(0, a.pathIdx - 1);
          a.room = a.def.path[a.pathIdx];
        } else {
          a.inOffice = true;
          a.wait = 0;
        }
        hooks.onMove("bruno");
        return;
      }

      a.pathIdx = Math.min(a.pathIdx + 1, a.def.path.length - 1);
      a.room = a.def.path[a.pathIdx];
      hooks.onMove("bruno");
    }

    /* ---------- Rufo ---------- */
    function updateRufo(dt) {
      var a = actors.rufo;

      if (a.running) {
        a.runTimer -= dt;
        if (a.runTimer <= 0) {
          if (hooks.doorClosed("left")) {
            var cost = 1 + a.hits * 5;
            a.hits++;
            hooks.addPowerDrain(cost);
            hooks.onFoxyBlocked();
            a.running = false;
            a.stage = 0;
            a.room = "1C";
            a.timer = -2500; // cooldown
          } else {
            over = true;
            hooks.jumpscare("rufo");
          }
        }
        return;
      }

      var watching = hooks.cameraUp() && hooks.viewedCam() === "1C";
      if (watching) {
        // mirarlo lo frena y puede hacerle retroceder una fase (una vez por vistazo)
        a.timer = 0;
        if (!a.nudged && a.stage > 0 && a.stage < 3) {
          if (Math.random() < 0.45) a.stage--;
          a.nudged = true;
        }
        return;
      }
      a.nudged = false;

      // odia que dejes las cámaras bajadas: avanza al doble
      var speed = hooks.camDownMs() > 6000 ? 2 : 1;
      a.timer += dt * speed;
      if (a.timer < a.def.moveInterval) return;
      a.timer = 0;

      if (!roll(effLevel("rufo"))) return;

      a.stage++;
      if (a.stage >= 3) {
        a.stage = 3;
        a.running = true;
        a.room = "2A";
        a.runTimer = hooks.camDownMs() > 6000 ? 900 : 1400;
        hooks.onFoxyRun();
      }
    }

    /* ---------------------------------------------------------------
       Consultas para el render
       --------------------------------------------------------------- */
    function presenceInCam(camId) {
      var list = [];
      C.ROSTER.forEach(function (id) {
        var a = actors[id];
        if (!a) return;
        if (id === "rufo") {
          if (camId === "1C" && !a.running) list.push({ id: "rufo", stage: a.stage });
          if (camId === "2A" && a.running) list.push({ id: "rufo", running: true });
          return;
        }
        if (a.inOffice) return; // ya no se ven en cámara
        if (a.room === camId) list.push({ id: id });
      });
      return list;
    }

    function atDoor(side) {
      // ¿hay alguien plantado en esa puerta ahora mismo? (para la luz)
      var out = [];
      C.ROSTER.forEach(function (id) {
        var a = actors[id];
        if (id === "rufo") return;
        if (a.def.door === side && a.atDoor && !a.inOffice) out.push(id);
      });
      if (side === "right" && actors.bruno.room === "4B" && !actors.bruno.inOffice)
        out.push("bruno");
      return out;
    }

    function inOffice() {
      return C.ROSTER.filter(function (id) {
        return actors[id] && actors[id].inOffice;
      });
    }

    return {
      reset: reset,
      update: update,
      setNight: setNight,
      beginBlackout: beginBlackout,
      isBlackout: isBlackout,
      presenceInCam: presenceInCam,
      atDoor: atDoor,
      inOffice: inOffice,
      actors: function () {
        return actors;
      },
      isOver: function () {
        return over;
      },
    };
  }

  FNAF.AI = { create: create };
})();
