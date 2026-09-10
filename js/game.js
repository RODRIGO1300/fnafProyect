/* ================================================================
   Five Nights at Freddy's - clon
   Orquestador: escenas + bucle de noche + oficina + cámaras.

   El elenco está desactivado (ver js/characters.js / js/ai.js), así que
   la única forma de perder ahora mismo es quedarse sin energía.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = window.FNAF;
  var C = FNAF.chars;
  var Sound = FNAF.Sound;

  /* ---------------------------------------------------------------
     Escenas
     --------------------------------------------------------------- */
  var scenes = {
    menu: document.getElementById("scene-menu"),
    roster: document.getElementById("scene-roster"),
    custom: document.getElementById("scene-custom"),
    news: document.getElementById("scene-news"),
    nightintro: document.getElementById("scene-nightintro"),
    office: document.getElementById("scene-office"),
    gameover: document.getElementById("scene-gameover"),
    sixam: document.getElementById("scene-6am"),
  };
  function showScene(name) {
    Object.keys(scenes).forEach(function (k) {
      scenes[k].classList.toggle("active", k === name);
    });
  }
  var $ = function (id) {
    return document.getElementById(id);
  };

  /* ---------------------------------------------------------------
     Progreso persistente
     --------------------------------------------------------------- */
  function getMaxNight() {
    var v = parseInt(localStorage.getItem("fnaf.maxNight") || "1", 10);
    return isNaN(v) ? 1 : Math.min(Math.max(v, 1), 7);
  }
  function setMaxNight(v) {
    try {
      localStorage.setItem("fnaf.maxNight", String(Math.min(Math.max(v, 1), 7)));
    } catch (e) {}
  }
  function starsEarned() {
    return Math.min(getMaxNight() - 1, 6);
  }

  /* ---------------------------------------------------------------
     Sonido on/off
     --------------------------------------------------------------- */
  var soundOn = localStorage.getItem("fnaf.sound") !== "off";
  function applySound() {
    Sound.setEnabled(soundOn);
    var t = $("sound-toggle");
    t.classList.toggle("off", !soundOn);
    t.innerHTML = soundOn ? "&#128266;" : "&#128263;";
  }
  $("sound-toggle").addEventListener("click", function () {
    soundOn = !soundOn;
    try {
      localStorage.setItem("fnaf.sound", soundOn ? "on" : "off");
    } catch (e) {}
    if (soundOn) Sound.resume();
    applySound();
  });

  /* ---------------------------------------------------------------
     Estado
     --------------------------------------------------------------- */
  var HOUR_MS = 45000;
  var DRAIN_PER_BAR = 0.09;

  var state = {
    night: 1,
    custom: false,
    customLevels: {},
    hour: 0,
    hourAcc: 0,
    power: 100,
    doorLeft: false,
    doorRight: false,
    lightLeft: false,
    lightRight: false,
    camOpen: false,
    currentCam: "1A",
    running: false,
  };
  C.CUSTOM_ROSTER.forEach(function (id) {
    var a = C.ANIMATRONICS[id];
    state.customLevels[id] = a && typeof a.customDefault === "number" ? a.customDefault : 0;
  });

  var ai = null;
  var lastTs = 0;
  var camDownSince = 0;

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
      return state.camOpen ? 0 : performance.now() - camDownSince;
    },
    addPowerDrain: function (pct) {
      state.power = Math.max(0, state.power - pct);
      updateHud();
    },
    onBlackoutOver: function () {
      gameOver("Se acabó la energía.");
    },
    jumpscare: function (id) {
      // reservado para cuando vuelva el elenco
      gameOver("Te atrapó " + (C.ANIMATRONICS[id] ? C.ANIMATRONICS[id].name : "algo") + ".", id);
    },
  };

  /* ---------------------------------------------------------------
     MENÚ
     --------------------------------------------------------------- */
  var menuItems = [].slice.call(document.querySelectorAll("#menu-list .menu-item"));
  var menuIndex = 0;

  function itemByAction(a) {
    return menuItems.filter(function (e) {
      return e.dataset.action === a;
    })[0];
  }
  function refreshMenu() {
    var max = getMaxNight();
    itemByAction("continue").disabled = max <= 1;
    itemByAction("night6").disabled = max < 6;
    if (menuItems[menuIndex].disabled) menuIndex = 0;
    menuItems.forEach(function (el, i) {
      el.classList.toggle("selected", i === menuIndex);
    });
    renderStars($("menu-stars"), starsEarned());
  }
  function renderStars(el, n) {
    var s = "";
    for (var i = 0; i < 6; i++) s += i < n ? "★" : '<span class="dim">☆</span>';
    el.innerHTML = s;
  }
  function moveMenu(dir) {
    var n = menuItems.length;
    for (var s = 0; s < n; s++) {
      menuIndex = (menuIndex + dir + n) % n;
      if (!menuItems[menuIndex].disabled) break;
    }
    refreshMenu();
  }
  function activateMenu() {
    var item = menuItems[menuIndex];
    if (!item || item.disabled) return;
    Sound.resume();
    var a = item.dataset.action;
    if (a === "new") startNewGame(1);
    else if (a === "continue") startNewGame(Math.min(getMaxNight(), 6));
    else if (a === "night6") startNewGame(6);
    else if (a === "custom") openCustom();
    else if (a === "roster") openRoster();
  }
  menuItems.forEach(function (el, i) {
    el.addEventListener("mouseenter", function () {
      if (el.disabled) return;
      menuIndex = i;
      refreshMenu();
    });
    el.addEventListener("click", function () {
      if (el.disabled) return;
      menuIndex = i;
      activateMenu();
    });
  });
  document.addEventListener("keydown", function (e) {
    if (!scenes.menu.classList.contains("active")) return;
    if (e.key === "ArrowDown") moveMenu(1);
    else if (e.key === "ArrowUp") moveMenu(-1);
    else if (e.key === "Enter") activateMenu();
  });

  /* ---------------------------------------------------------------
     ELENCO
     --------------------------------------------------------------- */
  function openRoster() {
    var grid = $("roster-grid");
    if (!grid.childNodes.length) {
      Object.keys(C.ANIMATRONICS).forEach(function (id) {
        var a = C.ANIMATRONICS[id];
        var card = document.createElement("div");
        card.className = "roster-card";
        card.innerHTML =
          '<div class="art">' +
          C.spriteFor(id, "normal") +
          "</div>" +
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
    showScene("roster");
  }
  $("btn-roster-back").addEventListener("click", function () {
    showScene("menu");
    refreshMenu();
  });

  /* ---------------------------------------------------------------
     NOCHE PERSONALIZADA  (interfaz completa, inicio deshabilitado)
     --------------------------------------------------------------- */
  function buildCustom() {
    var list = $("custom-list");
    list.innerHTML = "";
    C.CUSTOM_ROSTER.forEach(function (id) {
      var a = C.ANIMATRONICS[id];
      var row = document.createElement("div");
      row.className = "custom-row";
      row.innerHTML =
        '<span class="cface">' + C.spriteFor(id, "normal") + "</span>" +
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
    showScene("custom");
  }
  [].forEach.call(document.querySelectorAll("#custom-presets .chip"), function (chip) {
    chip.addEventListener("click", function () {
      var v = parseInt(chip.dataset.preset, 10) || 0;
      C.CUSTOM_ROSTER.forEach(function (id) {
        state.customLevels[id] = v;
      });
      buildCustom();
    });
  });
  $("btn-custom-back").addEventListener("click", function () {
    showScene("menu");
    refreshMenu();
  });
  // El botón "Empezar" está deshabilitado a propósito: la noche
  // personalizada todavía no se puede iniciar.
  $("btn-custom-start").addEventListener("click", function () {
    /* pendiente */
  });

  /* ---------------------------------------------------------------
     FLUJO DE PARTIDA
     --------------------------------------------------------------- */
  function startNewGame(night) {
    state.custom = false;
    state.night = night;
    showScene("news");
  }
  function enterNightIntro() {
    showScene("nightintro");
    $("night-label").textContent = "Noche " + state.night;
    $("night-clock").textContent = "12:00 AM";
    // reinicia la animación
    var el = document.querySelector(".night-intro");
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    setTimeout(function () {
      startNight(state.night);
    }, 3000);
  }
  document
    .querySelector("#scene-news .newspaper")
    .addEventListener("click", enterNightIntro);

  function startNight(night) {
    state.night = night;
    state.custom = false;
    state.hour = 0;
    state.hourAcc = 0;
    state.power = 100;
    state.doorLeft = state.doorRight = false;
    state.lightLeft = state.lightRight = false;
    state.camOpen = false;
    state.currentCam = "1A";
    state.running = true;
    camDownSince = performance.now();

    ai = FNAF.AI.create(hooks);
    ai.setNight(night);
    ai.reset({ levels: C.aiForNight(night, null) });

    $("hud-night").textContent = "Noche " + night;
    buildCamMap();
    syncDoors();
    updateHud();
    $("cam-panel").classList.remove("open");
    $("jumpscare").classList.remove("show");
    scenes.office.classList.remove("blackout");
    selectCam("1A");
    showScene("office");

    Sound.startAmbience();
    lastTs = 0;
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------------
     BUCLE
     --------------------------------------------------------------- */
  function loop(ts) {
    if (!state.running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min(120, ts - lastTs);
    lastTs = ts;

    // reloj
    state.hourAcc += dt;
    if (state.hourAcc >= HOUR_MS) {
      state.hourAcc -= HOUR_MS;
      state.hour++;
      updateHud(true);
      if (state.hour >= 6) {
        winNight();
        return;
      }
    }

    // energía
    var bars = usageBars();
    if (state.power > 0) {
      state.power = Math.max(0, state.power - bars * DRAIN_PER_BAR * (dt / 1000));
      if (state.power === 0) enterBlackout();
    }

    ai.update(dt);
    if (ai.isOver()) return;

    updateHud();
    requestAnimationFrame(loop);
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
     HUD
     --------------------------------------------------------------- */
  function fmtHour() {
    return (state.hour === 0 ? 12 : state.hour) + " AM";
  }
  function updateHud(tick) {
    var t = $("hud-time");
    t.textContent = fmtHour();
    if (tick) {
      t.classList.remove("tick");
      void t.offsetWidth;
      t.classList.add("tick");
    }
    $("cam-clock").textContent = fmtHour();
    $("power-value").textContent = Math.ceil(state.power);
    var bars = usageBars();
    var u = $("power-usage");
    u.textContent = new Array(bars + 1).join("■");
    u.style.color = bars <= 2 ? "#35d635" : bars <= 4 ? "#e8e800" : "#ff4040";
  }

  /* ---------------------------------------------------------------
     PUERTAS Y LUCES
     --------------------------------------------------------------- */
  function syncDoors() {
    var dl = $("door-left"), dr = $("door-right");
    dl.classList.toggle("closed", state.doorLeft);
    dr.classList.toggle("closed", state.doorRight);
    dl.classList.toggle("lit", state.lightLeft && !state.doorLeft);
    dr.classList.toggle("lit", state.lightRight && !state.doorRight);
    $("hall-left").classList.toggle("on", state.lightLeft && !state.doorLeft);
    $("hall-right").classList.toggle("on", state.lightRight && !state.doorRight);
    $("btn-left-door").classList.toggle("active", state.doorLeft);
    $("btn-right-door").classList.toggle("active", state.doorRight);
    $("btn-left-light").classList.toggle("active", state.lightLeft);
    $("btn-right-light").classList.toggle("active", state.lightRight);
  }
  function canAct() {
    return state.running && state.power > 0 && !ai.isBlackout();
  }

  $("btn-left-door").addEventListener("click", function () {
    if (!canAct()) return;
    state.doorLeft = !state.doorLeft;
    Sound.doorSlam();
    syncDoors();
  });
  $("btn-right-door").addEventListener("click", function () {
    if (!canAct()) return;
    state.doorRight = !state.doorRight;
    Sound.doorSlam();
    syncDoors();
  });
  bindHold("btn-left-light", "lightLeft");
  bindHold("btn-right-light", "lightRight");
  function bindHold(btnId, prop) {
    var btn = $(btnId);
    var on = function (e) {
      if (e) e.preventDefault();
      if (!canAct()) return;
      state[prop] = true;
      syncDoors();
    };
    var off = function () {
      state[prop] = false;
      syncDoors();
    };
    btn.addEventListener("mousedown", on);
    btn.addEventListener("mouseup", off);
    btn.addEventListener("mouseleave", off);
    btn.addEventListener("touchstart", on);
    btn.addEventListener("touchend", off);
  }

  /* ---------------------------------------------------------------
     CÁMARAS
     --------------------------------------------------------------- */
  function buildCamMap() {
    var map = $("cam-map");
    [].forEach.call(map.querySelectorAll(".cam-btn"), function (b) {
      b.remove();
    });
    C.CAMS.forEach(function (cam) {
      var b = document.createElement("button");
      b.className = "cam-btn";
      b.dataset.id = cam.id;
      b.textContent = cam.id;
      b.title = cam.name;
      b.style.left = cam.x + "%";
      b.style.top = cam.y + "%";
      b.addEventListener("click", function () {
        if (cam.id !== state.currentCam) glitchBurst();
        selectCam(cam.id);
      });
      map.appendChild(b);
    });
  }
  function glitchBurst() {
    var g = $("cam-glitch");
    g.classList.remove("burst");
    void g.offsetWidth;
    g.classList.add("burst");
    Sound.camStatic();
  }
  function selectCam(id) {
    state.currentCam = id;
    var cam = C.CAMS.filter(function (c) {
      return c.id === id;
    })[0];
    $("cam-name").textContent = "CÁM " + id + " — " + (cam ? cam.name : "");
    $("cam-disabled").classList.toggle("show", !!(cam && cam.audioOnly));
    [].forEach.call(document.querySelectorAll("#cam-map .cam-btn"), function (b) {
      b.classList.toggle("active", b.dataset.id === id);
    });
  }
  function setCamOpen(open) {
    if (!state.running || state.power <= 0 || ai.isBlackout()) open = false;
    var was = state.camOpen;
    state.camOpen = open;
    $("cam-panel").classList.toggle("open", open);
    if (!open) camDownSince = performance.now();
    if (was !== open) {
      Sound.camToggle(open);
      if (open) glitchBurst();
    }
    updateHud();
  }
  $("cam-tab").addEventListener("click", function () {
    setCamOpen(!state.camOpen);
  });
  document.addEventListener("keydown", function (e) {
    if (!scenes.office.classList.contains("active")) return;
    if (e.code === "Space") {
      e.preventDefault();
      setCamOpen(!state.camOpen);
    }
  });

  /* ---------------------------------------------------------------
     APAGÓN
     --------------------------------------------------------------- */
  function enterBlackout() {
    if (ai.isBlackout()) return;
    state.doorLeft = state.doorRight = false;
    state.lightLeft = state.lightRight = false;
    state.camOpen = false;
    $("cam-panel").classList.remove("open");
    syncDoors();
    updateHud();
    scenes.office.classList.add("blackout");
    ai.beginBlackout();
    Sound.stopAmbience();
    Sound.powerOut();
    setTimeout(function () {
      if (state.running && ai.isBlackout()) Sound.startJingle();
    }, 1600);
  }

  /* ---------------------------------------------------------------
     FIN
     --------------------------------------------------------------- */
  function gameOver(reason, charId) {
    if (!state.running) return;
    state.running = false;
    Sound.stopJingle();
    Sound.stopAmbience();

    if (charId) {
      Sound.jumpscare();
      $("js-sprite").innerHTML = C.spriteFor(charId, "jumpscare");
      $("jumpscare").classList.add("show");
      setTimeout(function () {
        $("jumpscare").classList.remove("show");
        showGameOver(reason);
      }, 1100);
    } else {
      showGameOver(reason);
    }
  }
  function showGameOver(reason) {
    $("go-sub").textContent = reason || "";
    showScene("gameover");
  }

  function winNight() {
    state.running = false;
    Sound.stopJingle();
    Sound.stopAmbience();
    Sound.chime6am();
    scenes.office.classList.remove("blackout");
    $("cam-panel").classList.remove("open");

    setMaxNight(Math.max(getMaxNight(), Math.min(state.night + 1, 7)));
    $("am-sub").textContent = "Has sobrevivido la Noche " + state.night;
    renderStars($("am-stars"), starsEarned());
    showScene("sixam");
  }

  $("btn-gameover-continue").addEventListener("click", backToMenu);
  $("btn-6am-continue").addEventListener("click", function () {
    if (state.night < 6) {
      state.night += 1;
      enterNightIntro();
    } else {
      backToMenu();
    }
  });
  function backToMenu() {
    showScene("menu");
    refreshMenu();
  }

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  document.addEventListener(
    "click",
    function once() {
      if (soundOn) Sound.resume();
      document.removeEventListener("click", once);
    }
  );
  applySound();
  refreshMenu();
  showScene("menu");
})();
