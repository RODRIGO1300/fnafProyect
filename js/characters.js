/* ================================================================
   Five Nights at Freddy's - clon
   PERSONAJES

   El elenco anterior se ha retirado. De momento sólo existe un
   Dogo está activo durante la noche. Caty, Roy y Remy permanecen sólo
   en la ficha de Elenco hasta que reciban su comportamiento.

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

  var CAM_BACKGROUNDS = {
    "1A": "assets/escenarios/cam-1a-escenario.png",
    "1B": "assets/escenarios/cam-1b-comedor.png",
    "1C": "assets/escenarios/cam-1c-cala.png",
    "5": "assets/escenarios/cam-5-trastienda.png",
    "7": "assets/escenarios/cam-7-aseos.png",
    "3": "assets/escenarios/cam-3-almacen.png",
    "2A": "assets/escenarios/cam-2a-pasillo-oeste.png",
    "2B": "assets/escenarios/cam-2b-esquina-oeste.png",
    "4A": "assets/escenarios/cam-4a-pasillo-este.png",
    "4B": "assets/escenarios/cam-4b-esquina-este.png",
  };
  CAMS.forEach(function (cam) {
    cam.background = CAM_BACKGROUNDS[cam.id] || "";
  });

  var DOOR_CAM = { left: "2B", right: "4B" };

  /* ---------------------------------------------------------------
     PERSONAJE(S)
     --------------------------------------------------------------- */
  var ANIMATRONICS = {
    dogo: {
      id: "dogo",
      name: "Dogo",
      role: "El perro guardián",
      species: "perro",
      color: "#8a4d25",
      accent: "#342016",
      belly: "#c49361",
      rosterImage: "assets/personajes/DOGO/dogo-elenco.png",
      cameraSprites: {
        "1A": "assets/personajes/DOGO/sprites/camaras/cam-1a.png",
        "1B": "assets/personajes/DOGO/sprites/camaras/cam-1b.png",
        "7": "assets/personajes/DOGO/sprites/camaras/cam-7.png",
        "4A": "assets/personajes/DOGO/sprites/camaras/cam-4a.png",
        "4B": "assets/personajes/DOGO/sprites/camaras/cam-4b.png",
      },
      // Colocación del sprite dentro de cada cámara (% del recuadro).
      // left/bottom = centro y separación desde el borde inferior.
      // blend "screen" para los renders que traen fondo oscuro pegado.
      cameraLayout: {
        "1A": { left: 58, bottom: 41, width: 23, blend: "screen" },
        "1B": { left: 61, bottom: 13, width: 30, blend: "screen" },
        "7": { left: 49, bottom: 8, width: 44 },
        "4A": { left: 53, bottom: 25, width: 22 },
        "4B": { left: 45, bottom: 2, width: 58 },
      },
      doorSprite: "assets/personajes/DOGO/sprites/oficina/puerta-derecha.png",
      start: "1A",
      path: ["1A", "1B", "7", "6", "4A", "4B"],
      door: "right",
      moveInterval: 4800,
      implemented: true,
      customDefault: 0,
      bio:
        "Un anfitrión canino de aspecto amable, construido para acompañar " +
        "y vigilar a los visitantes del restaurante. Recorre el ala este: " +
        "escenario, comedor, aseos, cocina y pasillo este.",
      counter:
        "Vigílalo en las cámaras. Si llega a tu puerta derecha, ciérrala " +
        "hasta que se marche. (Todavía no puede atraparte.)",
    },
    caty: {
      id: "caty",
      name: "Caty",
      role: "La gata acompañante",
      species: "gato",
      color: "#d8c5a7",
      accent: "#6d777c",
      belly: "#eee0c4",
      rosterImage: "assets/personajes/CATY/caty-elenco.png",
      implemented: false,
      customDefault: 0,
      bio:
        "La compañera felina de Dogo. Su apariencia tranquila y amistosa " +
        "fue diseñada para acompañar a los visitantes del restaurante.",
      counter: "Aún no aparece durante la noche.",
    },
    roy: {
      id: "roy",
      name: "Roy",
      role: "El mapache anfitrión",
      species: "mapache",
      color: "#74665b",
      accent: "#292528",
      belly: "#b7a58f",
      rosterImage: "assets/personajes/ROY/roy-elenco.png",
      implemented: false,
      customDefault: 0,
      bio:
        "Un mapache animatrónico de chaleco amarillo y expresión curiosa, " +
        "creado para recibir y entretener a los invitados.",
      counter: "Aún no aparece durante la noche.",
    },
    remy: {
      id: "remy",
      name: "Remy",
      role: "El mapache rojo",
      species: "mapache_rojo",
      color: "#a83f20",
      accent: "#401d22",
      belly: "#d6b58b",
      rosterImage: "assets/personajes/REMY/remy-elenco.png",
      implemented: false,
      customDefault: 0,
      bio:
        "Un mapache animatrónico rojo de aspecto inquieto y travieso, " +
        "reconocible por su pañuelo oscuro y su cola anillada.",
      counter: "Aún no aparece durante la noche.",
    },
  };

  // Personajes que pueden moverse durante la noche.
  var ROSTER = ["dogo"];

  // Personajes ajustables en la pantalla de Noche Personalizada.
  var CUSTOM_ROSTER = [];

  /* ---------------------------------------------------------------
     NIVELES DE IA POR NOCHE  (escala 0-20; d20 <= nivel -> avanza)
     Reservado para cuando el elenco vuelva a estar activo.
     --------------------------------------------------------------- */
  // Provisional: Dogo aún no puede atrapar al jugador, así que los
  // niveles son altos para que se le vea recorrer las cámaras.
  var NIGHT_AI = {
    1: { dogo: 5 },
    2: { dogo: 7 },
    3: { dogo: 9 },
    4: { dogo: 12 },
    5: { dogo: 15 },
    6: { dogo: 19 },
  };
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
