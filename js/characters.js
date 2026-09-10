/* ================================================================
   Five Nights at Freddy's - clon
   ELENCO DE PERSONAJES (original, mismos roles de juego que el clásico)

   Bruno  (oso)      -> presentador. Se mueve en la oscuridad, ataca en apagón.
   Vega   (conejo)   -> guitarrista. Puerta OESTE (izquierda).
   Pola   (gallina)  -> cocinas / servicio. Puerta ESTE (derecha).
   Rufo   (zorro)    -> pirata de "La Cala". Corre por el pasillo OESTE.
   Áureo  (oso dorado) -> alucinación rara. Aparece en la oficina.

   Todo es data-driven: cambia nombres, colores, rutas o niveles de IA
   aquí sin tocar el motor.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = (window.FNAF = window.FNAF || {});

  /* ---------------------------------------------------------------
     SALAS Y CÁMARAS
     --------------------------------------------------------------- */
  var CAMS = [
    { id: "1A", name: "Escenario principal", x: 45, y: 8 },
    { id: "1B", name: "Comedor", x: 45, y: 27 },
    { id: "1C", name: "La Cala", x: 12, y: 40 },
    { id: "5", name: "Trastienda", x: 7, y: 10 },
    { id: "7", name: "Aseos", x: 80, y: 42 },
    { id: "3", name: "Almacén", x: 22, y: 70 },
    { id: "2A", name: "Pasillo Oeste", x: 35, y: 66 },
    { id: "2B", name: "Pasillo Oeste (esq.)", x: 35, y: 86 },
    { id: "4A", name: "Pasillo Este", x: 60, y: 66 },
    { id: "4B", name: "Pasillo Este (esq.)", x: 60, y: 86 },
    { id: "6", name: "Cocina", x: 82, y: 66, audioOnly: true },
  ];

  // Puertas: qué cámara vigila cada puerta de la oficina
  var DOOR_CAM = { left: "2B", right: "4B" };

  /* ---------------------------------------------------------------
     NIVELES DE IA POR NOCHE  (escala 0-20 como el original)
     roll(1..20) <= nivel  ->  el animatrónico avanza
     --------------------------------------------------------------- */
  var NIGHT_AI = {
    1: { bruno: 0, vega: 2, pola: 1, rufo: 1 },
    2: { bruno: 0, vega: 4, pola: 3, rufo: 3 },
    3: { bruno: 1, vega: 6, pola: 5, rufo: 5 },
    4: { bruno: 2, vega: 9, pola: 8, rufo: 8 },
    5: { bruno: 3, vega: 12, pola: 11, rufo: 12 },
    6: { bruno: 4, vega: 16, pola: 16, rufo: 16 },
    // La noche 7 (personalizada) toma sus valores del menú.
  };

  // A las 4 a.m. (noche >= 3) todos suben +1, como en el original.
  var LATE_NIGHT_BOOST_HOUR = 4;
  var LATE_NIGHT_BOOST_FROM_NIGHT = 3;

  /* ---------------------------------------------------------------
     DEFINICIÓN DE CADA PERSONAJE
     --------------------------------------------------------------- */
  var ANIMATRONICS = {
    /* ---- BRUNO · el oso ---- */
    bruno: {
      id: "bruno",
      name: "Bruno",
      role: "El oso presentador",
      species: "oso",
      color: "#7a4a24",
      accent: "#3f2513",
      belly: "#c79a5f",
      moveInterval: 3020,
      start: "1A",
      // Ruta hacia la puerta ESTE (derecha). "office" = dentro de la oficina.
      path: ["1A", "1B", "7", "6", "4A", "4B", "office"],
      door: "right",
      bio:
        "La cara del local. Educado y encantador en el escenario; en la " +
        "oscuridad no se mueve si lo estás mirando por cámara. Sólo se " +
        "activa cuando Vega y Pola ya han dejado el escenario, y se vuelve " +
        "mucho más agresivo cuando la energía baja.",
      tells: [
        "Una risa grave y metálica suena cada vez que cambia de sala.",
        "Nunca aparece en el pasillo oeste.",
        "En un apagón se planta en la puerta izquierda con la cara iluminada.",
      ],
      counter:
        "Vigílalo por cámara para congelarlo. Si llega al Pasillo Este " +
        "(esq.), cierra la puerta derecha en cuanto flashees la luz.",
    },

    /* ---- VEGA · el conejo ---- */
    vega: {
      id: "vega",
      name: "Vega",
      role: "El conejo guitarrista",
      species: "conejo",
      color: "#3b4c9e",
      accent: "#26326b",
      belly: "#9aa6d6",
      moveInterval: 4970,
      start: "1A",
      // Ruta hacia la puerta OESTE (izquierda).
      path: ["1A", "1B", "5", "3", "2A", "2B", "office"],
      // Ramas alternativas para que no sea lineal.
      branches: { "1B": ["5", "3"], "5": ["1B", "2A"], "3": ["2A"] },
      door: "left",
      bio:
        "El más rápido y el que más presiona en las primeras noches. Va " +
        "siempre por el lado oeste: Trastienda, Almacén, Pasillo Oeste y, " +
        "por último, tu puerta izquierda. No hace ningún ruido al moverse.",
      tells: [
        "Silencio absoluto: sólo lo detectas con la luz de la puerta izquierda.",
        "Si está en la puerta y subes el monitor, puede colarse.",
      ],
      counter:
        "Luz izquierda cada pocos segundos. Si ves su cara, cierra la " +
        "puerta hasta que se vaya (baja el monitor y vuelve a mirar).",
    },

    /* ---- POLA · la gallina ---- */
    pola: {
      id: "pola",
      name: "Pola",
      role: "La gallina del servicio",
      species: "gallina",
      color: "#e8c23c",
      accent: "#b8901f",
      belly: "#f4e0a0",
      moveInterval: 4980,
      start: "1A",
      // Ruta hacia la puerta ESTE (derecha).
      path: ["1A", "1B", "7", "6", "4A", "4B", "office"],
      branches: { "1B": ["7", "6"], "7": ["6", "4A"] },
      door: "right",
      bio:
        "Lleva un babero que pone \"A COMER\" y arrastra un cupcake con " +
        "ojos. Va por el lado este y pasa largos ratos en la Cocina, la " +
        "única cámara sin vídeo: sólo oirás cacharros moverse.",
      tells: [
        "Ruido de cacerolas en la cámara de Cocina (sólo audio).",
        "Aparece en el Pasillo Este antes de llegar a tu puerta derecha.",
      ],
      counter:
        "Luz derecha con frecuencia. Misma regla que Vega: si la ves, " +
        "puerta derecha cerrada hasta que se marche.",
    },

    /* ---- RUFO · el zorro ---- */
    rufo: {
      id: "rufo",
      name: "Rufo",
      role: "El zorro pirata",
      species: "zorro",
      color: "#b5322a",
      accent: "#7a1f1a",
      belly: "#d98a6a",
      moveInterval: 5010,
      start: "1C",
      // Rufo no recorre salas: progresa por fases dentro de La Cala (1C).
      cove: true,
      stages: [
        "Cortina cerrada",
        "Asomando tras la cortina",
        "Fuera, mirando a la cámara",
        "¡Corriendo por el pasillo oeste!",
      ],
      door: "left",
      bio:
        "Vive tras la cortina de La Cala. Cuanto menos miras las cámaras, " +
        "más avanza. Cuando sale del todo, esprinta por el pasillo oeste y " +
        "aporrea tu puerta izquierda: si está abierta, es instantáneo.",
      tells: [
        "El cartel de su cámara cambia según su fase.",
        "Un golpe seco y fuerte en la puerta izquierda cuando ataca.",
      ],
      counter:
        "Míralo en la cámara 1C de vez en cuando para hacerle retroceder. " +
        "Si ya corre, cierra la puerta izquierda YA (te cuesta algo de " +
        "energía, pero sobrevives). No dejes las cámaras bajadas mucho rato.",
    },

    /* ---- ÁUREO · el oso dorado (oculto) ---- */
    aureo: {
      id: "aureo",
      name: "Áureo",
      role: "El oso dorado",
      species: "dorado",
      color: "#c9a227",
      accent: "#8a6d15",
      belly: "#e6cf7a",
      hidden: true,
      bio:
        "No está en la plantilla. A veces un póster de la oficina cambia a " +
        "su cara; si bajas el monitor, aparecerá desplomado en el suelo de " +
        "tu oficina. No es un fallo del juego.",
      tells: [
        "Un póster con su cara y la palabra \"HOLA\".",
        "Un zumbido agudo y la imagen tiembla.",
      ],
      counter:
        "Sube el monitor inmediatamente. Cuando lo bajes, se habrá ido. " +
        "Si te quedas mirándolo, cierra los ojos para siempre.",
    },
  };

  var ROSTER = ["bruno", "vega", "pola", "rufo"]; // Áureo es evento aparte

  /* ---------------------------------------------------------------
     SPRITES SVG  (dibujo propio, sin material con copyright)
     Cada builder devuelve markup SVG con viewBox 0 0 200 260.
     --------------------------------------------------------------- */
  function svg(inner, extraClass) {
    return (
      '<svg class="anim-svg ' +
      (extraClass || "") +
      '" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">' +
      inner +
      "</svg>"
    );
  }

  function eyes(cx1, cx2, cy, r, look) {
    look = look || 0;
    return (
      circle(cx1, cy, r, "#fff") +
      circle(cx2, cy, r, "#fff") +
      circle(cx1 + look, cy, r * 0.45, "#101015") +
      circle(cx2 + look, cy, r * 0.45, "#101015")
    );
  }
  function circle(cx, cy, r, fill) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"/>';
  }
  function ellipse(cx, cy, rx, ry, fill) {
    return (
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + fill + '"/>'
    );
  }
  function path(d, fill) {
    return '<path d="' + d + '" fill="' + fill + '"/>';
  }
  function rect(x, y, w, h, fill, rx) {
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (rx || 0) + '" fill="' + fill + '"/>'
    );
  }

  function bearBody(a) {
    return (
      // torso
      ellipse(100, 190, 62, 60, a.color) +
      ellipse(100, 200, 40, 42, a.belly) +
      // brazos
      ellipse(44, 175, 18, 40, a.color) +
      ellipse(156, 175, 18, 40, a.color) +
      // orejas
      circle(58, 62, 22, a.color) +
      circle(142, 62, 22, a.color) +
      circle(58, 62, 12, a.accent) +
      circle(142, 62, 12, a.accent) +
      // cabeza
      ellipse(100, 95, 58, 54, a.color) +
      // hocico
      ellipse(100, 118, 30, 22, a.belly) +
      ellipse(100, 108, 8, 6, "#20140c") +
      // cejas
      rect(64, 70, 26, 7, a.accent, 3) +
      rect(110, 70, 26, 7, a.accent, 3)
    );
  }

  var SPRITES = {
    oso: function (a) {
      return svg(
        bearBody(a) +
          eyes(80, 120, 84, 12) +
          // sombrero de copa
          path("M64 46 H136 V40 H64 Z", "#111") +
          rect(74, 8, 52, 34, "#141414", 2) +
          rect(74, 26, 52, 8, a.color, 1) +
          // pajarita
          path("M84 150 L100 160 L84 170 Z", "#111") +
          path("M116 150 L100 160 L116 170 Z", "#111") +
          circle(100, 160, 5, "#111") +
          // micrófono
          ellipse(40, 120, 9, 9, "#333") +
          rect(37, 128, 6, 34, "#555", 2)
      );
    },

    conejo: function (a) {
      return (
        svg(
          // orejas largas
          rect(72, 2, 18, 78, a.color, 9) +
            rect(110, 2, 18, 78, a.color, 9) +
            rect(76, 10, 10, 58, a.accent, 5) +
            rect(114, 10, 10, 58, a.accent, 5) +
            // torso
            ellipse(100, 192, 58, 58, a.color) +
            ellipse(100, 202, 36, 40, a.belly) +
            ellipse(46, 178, 16, 40, a.color) +
            ellipse(154, 178, 16, 40, a.color) +
            // cabeza
            ellipse(100, 108, 52, 50, a.color) +
            // hocico + dientes
            ellipse(100, 128, 22, 16, a.belly) +
            rect(93, 132, 7, 14, "#f2f2f2", 1) +
            rect(101, 132, 7, 14, "#f2f2f2", 1) +
            eyes(84, 116, 100, 11) +
            // pajarita
            path("M86 158 L100 167 L86 176 Z", "#a11") +
            path("M114 158 L100 167 L114 176 Z", "#a11") +
            // guitarra
            ellipse(150, 205, 20, 26, a.accent) +
            rect(146, 120, 8, 70, "#3a2a1a", 2)
        )
      );
    },

    gallina: function (a) {
      return svg(
        // mechón
        path("M88 40 Q100 8 112 40 Q100 30 88 40 Z", a.accent) +
          // torso
          ellipse(100, 190, 60, 60, a.color) +
          ellipse(100, 198, 40, 44, a.belly) +
          // alas
          ellipse(42, 182, 16, 42, a.color) +
          ellipse(158, 182, 16, 42, a.color) +
          // cabeza
          ellipse(100, 100, 50, 48, a.color) +
          // pico
          path("M78 108 L122 108 L100 122 Z", "#e79a20") +
          path("M80 118 L120 118 L100 130 Z", "#c47f16") +
          eyes(84, 116, 92, 11) +
          // babero
          path("M74 150 Q100 138 126 150 L120 180 Q100 190 80 180 Z", "#fff") +
          '<text x="100" y="170" font-size="13" font-family="Consolas,monospace" fill="#c0392b" text-anchor="middle">A COMER</text>' +
          // cupcake con ojos
          ellipse(40, 226, 13, 11, "#e08fb0") +
          rect(29, 226, 22, 14, "#8a5a3a", 2) +
          circle(36, 222, 2.5, "#111") +
          circle(44, 222, 2.5, "#111")
      );
    },

    zorro: function (a) {
      return svg(
        // orejas puntiagudas
        path("M60 66 L48 20 L86 52 Z", a.color) +
          path("M140 66 L152 20 L114 52 Z", a.color) +
          path("M64 60 L56 34 L80 52 Z", a.accent) +
          path("M136 60 L144 34 L120 52 Z", a.accent) +
          // torso con traje roto (endoesqueleto asomando)
          ellipse(100, 192, 56, 58, a.color) +
          rect(84, 150, 32, 90, "#2a2a2a", 2) +
          circle(100, 175, 4, "#777") +
          circle(100, 195, 4, "#777") +
          circle(100, 215, 4, "#777") +
          // brazos: uno con garfio
          ellipse(48, 180, 15, 40, a.color) +
          ellipse(152, 180, 15, 40, a.color) +
          path("M150 214 q16 6 6 22 q-4 -10 -14 -8 Z", "#cfd3d6") +
          // cabeza + hocico largo
          ellipse(100, 104, 46, 46, a.color) +
          path("M100 108 L150 128 L100 150 Z", a.color) +
          ellipse(150, 128, 6, 5, "#20140c") +
          // parche + ojo amarillo
          rect(70, 84, 20, 16, "#151515", 2) +
          circle(120, 96, 9, "#ffd23f") +
          circle(120, 96, 4, "#101015") +
          // dientes asomando
          path("M112 132 l6 10 l6 -10 Z", "#f2f2f2") +
          path("M124 134 l6 10 l6 -10 Z", "#f2f2f2")
      );
    },

    dorado: function (a) {
      return svg(
        // versión desplomada del oso, ojos negros con punto blanco
        bearBody(a) +
          // ojos negros vacíos con pinchazo blanco
          circle(80, 84, 12, "#000") +
          circle(120, 84, 12, "#000") +
          circle(80, 84, 2.5, "#fff") +
          circle(120, 84, 2.5, "#fff") +
          // sombrero y pajarita en el regazo
          path("M84 150 L100 160 L84 170 Z", "#111") +
          path("M116 150 L100 160 L116 170 Z", "#111") +
          // cables sueltos
          path("M60 230 q20 -20 0 -40", "none") +
          '<path d="M58 232 q22 -18 4 -44" stroke="#555" stroke-width="3" fill="none"/>' +
          '<path d="M142 232 q-22 -18 -4 -44" stroke="#555" stroke-width="3" fill="none"/>'
      );
    },
  };

  // Cara de susto (jumpscare) genérica según especie.
  function jumpscareFace(a) {
    var maw =
      // boca abierta enorme con dos filas de dientes de endoesqueleto
      path("M40 150 Q100 120 160 150 Q150 250 100 258 Q50 250 40 150 Z", "#0a0a0a");
    var topTeeth = "";
    var botTeeth = "";
    for (var i = 0; i < 7; i++) {
      var x = 48 + i * 16;
      topTeeth += path("M" + x + " 150 l8 26 l8 -26 Z", "#e8e8e8");
      botTeeth += path("M" + (x + 4) + " 252 l8 -24 l8 24 Z", "#d8d8d8");
    }
    return svg(
      // cabeza gigante
      ellipse(100, 110, 92, 96, a.color) +
        ellipse(30, 40, 26, 26, a.color) +
        ellipse(170, 40, 26, 26, a.color) +
        // cuencas negras
        circle(66, 92, 26, "#000") +
        circle(134, 92, 26, "#000") +
        circle(66, 92, 6, "#fff") +
        circle(134, 92, 6, "#fff") +
        // ceño
        rect(40, 60, 40, 10, a.accent, 4) +
        rect(120, 60, 40, 10, a.accent, 4) +
        maw +
        topTeeth +
        botTeeth,
      "js-face"
    );
  }

  function spriteFor(id, mode) {
    var a = ANIMATRONICS[id];
    if (mode === "jumpscare") return jumpscareFace(a);
    return SPRITES[a.species](a);
  }

  /* ---------------------------------------------------------------
     Resolver niveles de IA para una noche concreta
     --------------------------------------------------------------- */
  function aiForNight(night, customLevels) {
    if (night >= 7 && customLevels) {
      return {
        bruno: clamp(customLevels.bruno),
        vega: clamp(customLevels.vega),
        pola: clamp(customLevels.pola),
        rufo: clamp(customLevels.rufo),
      };
    }
    var base = NIGHT_AI[night] || NIGHT_AI[6];
    return { bruno: base.bruno, vega: base.vega, pola: base.pola, rufo: base.rufo };
  }
  function clamp(v) {
    v = v | 0;
    return v < 0 ? 0 : v > 20 ? 20 : v;
  }

  /* ---------------------------------------------------------------
     Export
     --------------------------------------------------------------- */
  FNAF.chars = {
    CAMS: CAMS,
    DOOR_CAM: DOOR_CAM,
    ANIMATRONICS: ANIMATRONICS,
    ROSTER: ROSTER,
    NIGHT_AI: NIGHT_AI,
    LATE_NIGHT_BOOST_HOUR: LATE_NIGHT_BOOST_HOUR,
    LATE_NIGHT_BOOST_FROM_NIGHT: LATE_NIGHT_BOOST_FROM_NIGHT,
    spriteFor: spriteFor,
    aiForNight: aiForNight,
  };
})();
