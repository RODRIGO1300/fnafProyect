/* ================================================================
   Five Nights at Freddy's - clon
   MOTOR DE IA DE LOS ANIMATRÓNICOS

   Sistema clásico: cada personaje tiene un nivel 0-20. Cada
   `moveInterval` ms se tira un d20; si sale <= nivel, "avanza" (una
   sala de su ruta, una fase, etc.). Nivel 0 = nunca se mueve.
   A las 4 a.m. (noche >= 3) todos suben +1.

   Estado actual del elenco:
     - Dogo: recorre el ala este y se asoma a la puerta derecha.
       SIN JUMPSCARE todavía: si la dejas abierta, se retira solo tras
       `doorLingerMs`; cerrarla también lo hace volver.
     - Caty / Roy / Remy: reservados (implemented:false), no se instancian.

   Para añadir un personaje: `implemented:true` + entrada en NIGHT_AI en
   js/world.js y su rama de comportamiento en behave().
   ================================================================ */
(function () {
  "use strict";

  var FNAF = window.FNAF;
  var W = FNAF.world;

  function rollUnder(level) {
    return Math.floor(Math.random() * 20) + 1 <= level;
  }

  function create(hooks) {
    var night = 1;
    var levels = {};
    var actors = {};
    var blackout = null;
    var over = false;
    var elapsed = 0;

    function reset(cfg) {
      levels = (cfg && cfg.levels) || {};
      actors = {};
      blackout = null;
      over = false;
      elapsed = 0;

      W.ROSTER.forEach(function (id) {
        var def = W.ANIMATRONICS[id];
        if (!def || def.implemented === false) return;
        actors[id] = { id: id, def: def, room: def.start, timer: 0, attackTimer: 0 };
      });
    }

    function setNight(n) {
      night = n;
    }

    function effLevel(id) {
      var lv = levels[id] || 0;
      if (
        hooks.hour() >= W.LATE_NIGHT_BOOST_HOUR &&
        night >= W.LATE_NIGHT_BOOST_FROM_NIGHT
      ) {
        lv += 1;
      }
      return lv;
    }

    /* ---------- Apagón ---------- */
    function beginBlackout() {
      if (blackout) return;
      var t = 6000 + Math.random() * 9000 - night * 600;
      blackout = { timer: Math.max(4000, t) };
    }
    function isBlackout() {
      return !!blackout;
    }

    /* ---------- Update ---------- */
    function update(dt) {
      if (over) return;
      elapsed += dt;

      if (blackout) {
        blackout.timer -= dt;
        if (blackout.timer <= 0) {
          over = true;
          if (hooks.onBlackoutOver) hooks.onBlackoutOver();
        }
        return;
      }

      var moved = false;
      for (var id in actors) {
        if (behave(actors[id], dt)) moved = true;
      }
      if (moved) FNAF.bus.emit("ai:moved");
    }

    // Devuelve true si el actor cambió de sala en este tick.
    function behave(a, dt) {
      var before = a.room;

      if (a.room === "DOOR_RIGHT") {
        a.attackTimer += dt;
        var linger = a.def.doorLingerMs || 6000;
        if (hooks.doorClosed("right") || a.attackTimer >= linger) {
          a.room = "1B";
          a.timer = 0;
          a.attackTimer = 0;
        }
        return a.room !== before;
      }

      a.timer += dt;
      if (a.timer < a.def.moveInterval) return false;
      a.timer = 0;
      if (!rollUnder(effLevel(a.id))) return false;

      // Como Freddy: no avanza mientras lo miras directamente en cámara.
      if (hooks.cameraUp() && hooks.viewedCam() === a.room) return false;

      var idx = a.def.path.indexOf(a.room);
      if (idx < 0) idx = 0;

      if (idx < a.def.path.length - 1) {
        a.room = a.def.path[idx + 1];
      } else if (hooks.doorClosed(a.def.door)) {
        a.room = "1B"; // puerta cerrada: retrocede
      } else {
        a.room = a.def.door === "right" ? "DOOR_RIGHT" : "DOOR_LEFT";
        a.attackTimer = 0;
      }
      return a.room !== before;
    }

    return {
      reset: reset,
      setNight: setNight,
      update: update,
      beginBlackout: beginBlackout,
      isBlackout: isBlackout,
      presenceInCam: function (camId) {
        var found = [];
        for (var id in actors) {
          if (actors[id].room === camId) found.push({ id: id });
        }
        return found;
      },
      atDoor: function (side) {
        var key = side === "right" ? "DOOR_RIGHT" : "DOOR_LEFT";
        var found = [];
        for (var id in actors) {
          if (actors[id].room === key) found.push(id);
        }
        return found;
      },
      inOffice: function () {
        return [];
      },
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
