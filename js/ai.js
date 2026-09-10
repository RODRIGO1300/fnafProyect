/* ================================================================
   Five Nights at Freddy's - clon
   MOTOR DE IA DE LOS ANIMATRÓNICOS

   Dogo recorre el ala este con un patrón inspirado en el oso del juego
   clásico: avanza por una ruta fija y se asoma a la puerta derecha.
   POR AHORA NO HAY JUMPSCARE: si llega a la puerta y la dejas abierta,
   tras un rato se retira solo. Cerrar la puerta también lo hace volver.

   ----------------------------------------------------------------
   DISEÑO PREVISTO PARA CUANDO VUELVA EL ELENCO
   ----------------------------------------------------------------
   Cada animatrónico tiene un nivel 0-20. Cada `moveInterval` ms se
   tira un d20; si el resultado es <= nivel, el personaje "avanza"
   (una sala de su ruta, una fase, etc.). Nivel 0 = nunca se mueve.
   A las 4 a.m. (noche >= 3) todos suben +1.

   Para activar un personaje:
     1. En js/characters.js:  implemented: true  + entrada en NIGHT_AI.
     2. Aquí:  añadir su función de comportamiento en `behave()`.
     3. Exponerlo en presenceInCam / atDoor / inOffice para el render.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = (window.FNAF = window.FNAF || {});
  var C = FNAF.chars;

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

      // Sólo se instancian los personajes marcados como implementados.
      C.ROSTER.forEach(function (id) {
        var def = C.ANIMATRONICS[id];
        if (!def || def.implemented === false) return;
        actors[id] = {
          id: id,
          def: def,
          room: def.start,
          timer: 0,
          attackTimer: 0,
        };
      });
    }

    function setNight(n) {
      night = n;
    }

    function effLevel(id) {
      var lv = levels[id] || 0;
      if (
        hooks.hour() >= C.LATE_NIGHT_BOOST_HOUR &&
        night >= C.LATE_NIGHT_BOOST_FROM_NIGHT
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

      for (var id in actors) behave(actors[id], dt);
    }

    // Tiempo que Dogo aguanta en la puerta antes de retirarse solo.
    var DOOR_LINGER_MS = 6000;

    function behave(a, dt) {
      if (a.room === "DOOR_RIGHT") {
        // Sin jumpscare: al cerrar la puerta o tras un rato, se retira.
        a.attackTimer += dt;
        if (hooks.doorClosed("right") || a.attackTimer >= DOOR_LINGER_MS) {
          a.room = "1B";
          a.timer = 0;
          a.attackTimer = 0;
        }
        return;
      }

      a.timer += dt;
      if (a.timer < a.def.moveInterval) return;
      a.timer = 0;
      if (!rollUnder(effLevel(a.id))) return;

      // Como Freddy, Dogo no avanza mientras el jugador observa
      // directamente la cámara en la que se encuentra.
      if (hooks.cameraUp() && hooks.viewedCam() === a.room) return;

      var index = a.def.path.indexOf(a.room);
      if (index < 0) index = 0;
      if (index < a.def.path.length - 1) {
        a.room = a.def.path[index + 1];
      } else if (hooks.doorClosed(a.def.door)) {
        // La puerta derecha cerrada lo hace retroceder hacia el comedor.
        a.room = "1B";
      } else {
        a.room = "DOOR_RIGHT";
        a.attackTimer = 0;
      }
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
        var found = [];
        for (var id in actors) {
          if (side === "right" && actors[id].room === "DOOR_RIGHT") found.push(id);
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
