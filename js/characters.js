/* ================================================================
   Five Nights at Freddy's - clon
   PERSONAJES

   El elenco anterior se ha retirado. De momento sólo existe un
   marcador de posición llamado "Dogo": aparece en la ficha de Elenco
   y en la Noche Personalizada, pero todavía NO se mueve durante la
   noche. Su arte definitivo y su comportamiento (en js/ai.js) se
   añadirán más adelante.

   Todo es data-driven: para reactivar un personaje basta con darle
   `implemented: true`, una entrada en NIGHT_AI y su lógica en el motor.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = (window.FNAF = window.FNAF || {});

  /* ---------------------------------------------------------------
     SALAS Y CÁMARAS
     --------------------------------------------------------------- */
  var CAMS = [
    { id: "1A", name: "Escenario principal", x: 46, y: 10 },
    { id: "1B", name: "Comedor", x: 46, y: 34 },
    { id: "1C", name: "La Cala", x: 13, y: 44 },
    { id: "5", name: "Trastienda", x: 10, y: 12 },
    { id: "7", name: "Aseos", x: 82, y: 40 },
    { id: "3", name: "Almacén", x: 22, y: 70 },
    { id: "2A", name: "Pasillo Oeste", x: 36, y: 62 },
    { id: "2B", name: "Pasillo Oeste (esq.)", x: 36, y: 84 },
    { id: "4A", name: "Pasillo Este", x: 60, y: 62 },
    { id: "4B", name: "Pasillo Este (esq.)", x: 60, y: 84 },
    { id: "6", name: "Cocina", x: 84, y: 66, audioOnly: true },
  ];

  var DOOR_CAM = { left: "2B", right: "4B" };

  /* ---------------------------------------------------------------
     PERSONAJE(S)
     --------------------------------------------------------------- */
  var ANIMATRONICS = {
    dogo: {
      id: "dogo",
      name: "Dogo",
      role: "En desarrollo",
      species: "perro",
      color: "#9aa0aa",
      accent: "#5f6570",
      belly: "#d2d6dd",
      implemented: false, // <- todavía no participa en la noche
      customDefault: 0,
      bio:
        "Marcador de posición. El arte definitivo y el comportamiento de " +
        "este animatrónico se implementarán en una actualización posterior, " +
        "con su propia carpeta de recursos.",
      counter: "Aún no aparece durante la noche.",
    },
  };

  // Personajes que pueden moverse durante la noche (ninguno por ahora).
  var ROSTER = [];

  // Personajes ajustables en la pantalla de Noche Personalizada.
  var CUSTOM_ROSTER = ["dogo"];

  /* ---------------------------------------------------------------
     NIVELES DE IA POR NOCHE  (escala 0-20; d20 <= nivel -> avanza)
     Reservado para cuando el elenco vuelva a estar activo.
     --------------------------------------------------------------- */
  var NIGHT_AI = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
  var LATE_NIGHT_BOOST_HOUR = 4;
  var LATE_NIGHT_BOOST_FROM_NIGHT = 3;

  /* ---------------------------------------------------------------
     SPRITES SVG  (dibujo propio)
     --------------------------------------------------------------- */
  function svg(inner, cls) {
    return (
      '<svg class="anim-svg ' +
      (cls || "") +
      '" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">' +
      inner +
      "</svg>"
    );
  }
  function circle(cx, cy, r, f) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"/>';
  }
  function ellipse(cx, cy, rx, ry, f) {
    return (
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + f + '"/>'
    );
  }
  function rect(x, y, w, h, f, rx) {
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (rx || 0) + '" fill="' + f + '"/>'
    );
  }
  function path(d, f) {
    return '<path d="' + d + '" fill="' + f + '"/>';
  }

  var SPRITES = {
    perro: function (a) {
      return svg(
        // orejas caídas
        ellipse(58, 88, 16, 34, a.accent) +
          ellipse(142, 88, 16, 34, a.accent) +
          // torso
          ellipse(100, 192, 56, 58, a.color) +
          ellipse(100, 200, 36, 40, a.belly) +
          // patas delanteras
          ellipse(74, 236, 16, 18, a.color) +
          ellipse(126, 236, 16, 18, a.color) +
          // cabeza
          ellipse(100, 100, 48, 46, a.color) +
          // hocico
          ellipse(100, 120, 24, 18, a.belly) +
          ellipse(100, 112, 8, 6, "#20242b") +
          // ojos
          circle(84, 92, 7, "#fff") +
          circle(116, 92, 7, "#fff") +
          circle(84, 93, 3.4, "#15181d") +
          circle(116, 93, 3.4, "#15181d") +
          // collar y chapa
          rect(66, 138, 68, 10, "#8a1f1f", 3) +
          circle(100, 150, 6, "#e8c23c") +
          // marca de agua "?"
          '<text x="100" y="205" font-size="26" font-family="Consolas,monospace" fill="' +
          a.accent +
          '" text-anchor="middle">?</text>'
      );
    },
  };

  function jumpscareFace(a) {
    var maw = path(
      "M40 150 Q100 120 160 150 Q150 250 100 258 Q50 250 40 150 Z",
      "#0a0a0a"
    );
    var teeth = "";
    for (var i = 0; i < 7; i++) {
      var x = 48 + i * 16;
      teeth += path("M" + x + " 150 l8 26 l8 -26 Z", "#e8e8e8");
      teeth += path("M" + (x + 4) + " 252 l8 -24 l8 24 Z", "#d8d8d8");
    }
    return svg(
      ellipse(100, 110, 92, 96, a.color) +
        ellipse(30, 40, 26, 26, a.color) +
        ellipse(170, 40, 26, 26, a.color) +
        circle(66, 92, 26, "#000") +
        circle(134, 92, 26, "#000") +
        circle(66, 92, 6, "#fff") +
        circle(134, 92, 6, "#fff") +
        rect(40, 60, 40, 10, a.accent, 4) +
        rect(120, 60, 40, 10, a.accent, 4) +
        maw +
        teeth,
      "js-face"
    );
  }

  function spriteFor(id, mode) {
    var a = ANIMATRONICS[id];
    if (!a) return "";
    if (mode === "jumpscare") return jumpscareFace(a);
    return (SPRITES[a.species] || SPRITES.perro)(a);
  }

  /* ---------------------------------------------------------------
     Niveles de IA de una noche
     --------------------------------------------------------------- */
  function aiForNight(night, customLevels) {
    if (night >= 7 && customLevels) {
      var out = {};
      Object.keys(customLevels).forEach(function (k) {
        var v = customLevels[k] | 0;
        out[k] = v < 0 ? 0 : v > 20 ? 20 : v;
      });
      return out;
    }
    return Object.assign({}, NIGHT_AI[night] || NIGHT_AI[6] || {});
  }

  FNAF.chars = {
    CAMS: CAMS,
    DOOR_CAM: DOOR_CAM,
    ANIMATRONICS: ANIMATRONICS,
    ROSTER: ROSTER,
    CUSTOM_ROSTER: CUSTOM_ROSTER,
    NIGHT_AI: NIGHT_AI,
    LATE_NIGHT_BOOST_HOUR: LATE_NIGHT_BOOST_HOUR,
    LATE_NIGHT_BOOST_FROM_NIGHT: LATE_NIGHT_BOOST_FROM_NIGHT,
    spriteFor: spriteFor,
    aiForNight: aiForNight,
  };
})();
