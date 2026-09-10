/* ================================================================
   Five Nights at Freddy's - clon
   MENÚ y pantallas de front-end: menú principal, Elenco, Noche
   Personalizada y el interruptor de sonido.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = window.FNAF;
  var W = FNAF.world;
  var state = FNAF.state;
  var Sound = FNAF.Sound;
  var scenes = FNAF.scenes;
  var $ = FNAF.$;

  // Nivel por defecto de cada personaje ajustable.
  W.CUSTOM_ROSTER.forEach(function (id) {
    var a = W.ANIMATRONICS[id];
    state.customLevels[id] = a && typeof a.customDefault === "number" ? a.customDefault : 0;
  });

  /* ---------------- Sonido ---------------- */
  var soundOn = FNAF.storage.isSoundOn();
  function applySound() {
    Sound.setEnabled(soundOn);
    var t = $("sound-toggle");
    t.classList.toggle("off", !soundOn);
    t.innerHTML = soundOn ? "&#128266;" : "&#128263;";
  }
  $("sound-toggle").addEventListener("click", function () {
    soundOn = !soundOn;
    FNAF.storage.setSoundOn(soundOn);
    if (soundOn) Sound.resume();
    applySound();
  });

  /* ---------------- Estrellas de progreso ---------------- */
  function starsEarned() {
    return Math.min(FNAF.storage.getMaxNight() - 1, FNAF.config.starsCap);
  }
  function renderStars(el, n) {
    var s = "";
    for (var i = 0; i < FNAF.config.starsCap; i++) {
      s += i < n ? "★" : '<span class="dim">☆</span>';
    }
    el.innerHTML = s;
  }
  FNAF.bus.on("stars", function (el) {
    renderStars(el, starsEarned());
  });

  /* ---------------- Menú principal ---------------- */
  var items = FNAF.qsa("#menu-list .menu-item");
  var index = 0;

  function itemByAction(a) {
    return items.filter(function (e) {
      return e.dataset.action === a;
    })[0];
  }
  function refresh() {
    var max = FNAF.storage.getMaxNight();
    itemByAction("continue").disabled = max <= 1;
    itemByAction("night6").disabled = max < 6;
    if (items[index].disabled) index = 0;
    items.forEach(function (el, i) {
      el.classList.toggle("selected", i === index);
    });
    renderStars($("menu-stars"), starsEarned());
  }
  function move(dir) {
    var n = items.length;
    for (var s = 0; s < n; s++) {
      index = (index + dir + n) % n;
      if (!items[index].disabled) break;
    }
    refresh();
  }
  function activate() {
    var item = items[index];
    if (!item || item.disabled) return;
    Sound.resume();
    switch (item.dataset.action) {
      case "new":
        FNAF.night.startFromMenu(1);
        break;
      case "continue":
        FNAF.night.startFromMenu(Math.min(FNAF.storage.getMaxNight(), FNAF.config.maxNight));
        break;
      case "night6":
        FNAF.night.startFromMenu(6);
        break;
      case "custom":
        openCustom();
        break;
      case "roster":
        openRoster();
        break;
    }
  }

  items.forEach(function (el, i) {
    el.addEventListener("mouseenter", function () {
      if (el.disabled) return;
      index = i;
      refresh();
    });
    el.addEventListener("click", function () {
      if (el.disabled) return;
      index = i;
      activate();
    });
  });
  document.addEventListener("keydown", function (e) {
    if (!scenes.is("menu")) return;
    if (e.key === "ArrowDown") move(1);
    else if (e.key === "ArrowUp") move(-1);
    else if (e.key === "Enter") activate();
  });
  FNAF.bus.on("menu:refresh", refresh);

  /* ---------------- Elenco ---------------- */
  function openRoster() {
    var grid = $("roster-grid");
    if (!grid.childNodes.length) {
      Object.keys(W.ANIMATRONICS).forEach(function (id) {
        var a = W.ANIMATRONICS[id];
        var art = a.rosterImage
          ? '<img src="' + a.rosterImage + '" alt="Retrato de ' + a.name + '">'
          : W.spriteFor(id, "normal");
        var card = document.createElement("div");
        card.className = "roster-card";
        card.innerHTML =
          '<div class="art">' + art + "</div>" +
          '<div class="info">' +
          "<h3>" + a.name + "</h3>" +
          '<div class="role">' + a.role + "</div>" +
          "<p>" + a.bio + "</p>" +
          '<span class="badge">' +
          (a.implemented === false ? "PENDIENTE" : "ACTIVO") +
          "</span>" +
          "</div>";
        grid.appendChild(card);
      });
    }
    scenes.show("roster");
  }
  $("btn-roster-back").addEventListener("click", function () {
    scenes.show("menu");
    refresh();
  });

  /* ---------------- Noche personalizada (inicio deshabilitado) ---------------- */
  function buildCustom() {
    var list = $("custom-list");
    list.innerHTML = "";
    if (!W.CUSTOM_ROSTER.length) {
      list.innerHTML =
        '<p class="panel-note">Todavía no hay animatrónicos disponibles.</p>';
      return;
    }
    W.CUSTOM_ROSTER.forEach(function (id) {
      var a = W.ANIMATRONICS[id];
      var row = document.createElement("div");
      row.className = "custom-row";
      row.innerHTML =
        '<span class="cface">' + W.spriteFor(id, "normal") + "</span>" +
        '<span class="cname">' + a.name + "</span>" +
        '<input type="range" min="0" max="20" value="' +
        state.customLevels[id] + '" data-id="' + id + '">' +
        '<span class="cval">' + state.customLevels[id] + "</span>";
      var input = row.querySelector("input");
      input.addEventListener("input", function () {
        state.customLevels[id] = parseInt(input.value, 10) || 0;
        row.querySelector(".cval").textContent = input.value;
      });
      list.appendChild(row);
    });
  }
  function openCustom() {
    buildCustom();
    scenes.show("custom");
  }
  FNAF.qsa("#custom-presets .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var v = parseInt(chip.dataset.preset, 10) || 0;
      W.CUSTOM_ROSTER.forEach(function (id) {
        state.customLevels[id] = v;
      });
      buildCustom();
    });
  });
  $("btn-custom-back").addEventListener("click", function () {
    scenes.show("menu");
    refresh();
  });
  // "Empezar" está deshabilitado a propósito: aún no se puede iniciar.
  $("btn-custom-start").addEventListener("click", function () {
    /* pendiente */
  });

  FNAF.menu = { refresh: refresh, applySound: applySound };
})();
