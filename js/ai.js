/* ================================================================
   Five Nights at Freddy's - clon
   MOTOR DE IA DE LOS ANIMATRÓNICOS  (andamiaje)

   El elenco está desactivado por ahora, así que el motor no mueve a
   nadie: sólo gestiona el apagón (cuenta atrás hasta el fin de la
   noche). Toda la API que usa game.js sigue en su sitio para poder
   reconectar personajes sin tocar el orquestador.

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

      // Sin personajes activos: nada que simular.
      for (var id in actors) behave(actors[id], dt);
    }

    // Punto de extensión: aquí irá la lógica de cada especie.
    function behave(a, dt) {
      a.timer += dt;
      if (a.timer < a.def.moveInterval) return;
      a.timer = 0;
      if (!rollUnder(effLevel(a.id))) return;
      // TODO: mover a `a` según su ruta / fase y avisar a los hooks.
    }

    return {
      reset: reset,
      setNight: setNight,
      update: update,
      beginBlackout: beginBlackout,
      isBlackout: isBlackout,
      presenceInCam: function () {
        return [];
      },
      atDoor: function () {
        return [];
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
