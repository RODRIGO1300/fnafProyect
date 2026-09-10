/* ================================================================
   Five Nights at Freddy's - clon
   Orquestador: escenas + bucle de noche + integración con la IA.
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

  /* ---------------------------------------------------------------
     Estado
     --------------------------------------------------------------- */
  var HOUR_MS = 45000; // ~4,5 min por noche
  var DRAIN_PER_BAR = 0.09; // % por segundo y "barra" de consumo

  var state = {
    night: 1,
    custom: false,
    customLevels: { bruno: 10, vega: 10, pola: 10, rufo: 10 },
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

  var ai = null;
  var lastTs = 0;
  var camDownSince = 0; // performance.now() cuando se bajó el monitor
  var golden = null; // { timer }

  /* ---------------------------------------------------------------
     HOOKS para el motor de IA
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
    jumpscare: function (id) {
      triggerJumpscare(id);
    },
    onMove: function (id) {
      if (id === "bruno") Sound.laugh();
      else Sound.step();
    },
    onFoxyRun: function () {
      Sound.foxyRun();
    },
    onFoxyBlocked: function () {
      Sound.foxyBang();
    },
  };

  /* ---------------------------------------------------------------
     MENÚ
     --------------------------------------------------------------- */
  var menuItems = [].slice.call(document.querySelectorAll("#menu-list .menu-item"));
  var menuIndex = 0;

  function refreshMenu() {
    var max = getMaxNight();
    setItemEnabled("continue", max > 1);
    setItemEnabled("night6", max >= 6);
    setItemEnabled("custom", max >= 7);
    // primer elemento habilitado seleccionado
    if (menuItems[menuIndex].disabled) menuIndex = 0;
    menuItems.forEach(function (el, i) {
      el.classList.toggle("selected", i === menuIndex);
    });
  }
  function setItemEnabled(action, on) {
    var el = menuItems.filter(function (e) {
      return e.dataset.action === action;
    })[0];
    if (el) el.disabled = !on;
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
    var grid = document.getElementById("roster-grid");
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
          "<h3>" +
          a.name +
          "</h3>" +
          '<div class="role">' +
          a.role +
          "</div>" +
          "<p>" +
          a.bio +
          "</p>" +
          '<p class="counter">' +
          a.counter +
          "</p>" +
          "</div>";
        grid.appendChild(card);
      });
    }
    showScene("roster");
  }
  document.getElementById("btn-roster-back").addEventListener("click", function () {
    showScene("menu");
    refreshMenu();
  });

  /* ---------------------------------------------------------------
     NOCHE PERSONALIZADA
     --------------------------------------------------------------- */
  function openCustom() {
    var box = document.getElementById("custom-sliders");
    if (!box.childNodes.length) {
      C.ROSTER.forEach(function (id) {
        var a = C.ANIMATRONICS[id];
        var row = document.createElement("div");
        row.className = "custom-row";
        row.innerHTML =
          '<span class="cname">' +
          a.name +
          "</span>" +
          '<input type="range" min="0" max="20" value="' +
          state.customLevels[id] +
          '" data-id="' +
          id +
          '">' +
          '<span class="cval">' +
          state.customLevels[id] +
          "</span>";
        var input = row.querySelector("input");
        input.addEventListener("input", function () {
          state.customLevels[id] = parseInt(input.value, 10);
          row.querySelector(".cval").textContent = input.value;
        });
        box.appendChild(row);
      });
    }
    showScene("custom");
  }
  document.getElementById("btn-custom-back").addEventListener("click", function () {
    showScene("menu");
    refreshMenu();
  });
  document.getElementById("btn-custom-start").addEventListener("click", function () {
    Sound.resume();
    state.custom = true;
    startNight(7);
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
    document.getElementById("night-label").textContent =
      state.custom ? "Noche 7" : "Noche " + state.night;
    setTimeout(function () {
      startNight(state.night);
    }, 3000);
  }
  document
    .querySelector("#scene-news .newspaper")
    .addEventListener("click", enterNightIntro);

  function startNight(night) {
    state.night = night;
    state.custom = night >= 7;
    state.hour = 0;
    state.hourAcc = 0;
    state.power = 100;
    state.doorLeft = state.doorRight = false;
    state.lightLeft = state.lightRight = false;
    state.camOpen = false;
    state.currentCam = "1A";
    state.running = true;
    golden = null;
    camDownSince = performance.now();

    ai = FNAF.AI.create(hooks);
    ai.setNight(night);
    ai.reset({
      levels: C.aiForNight(night, state.custom ? state.customLevels : null),
    });

    document.getElementById("hud-night").textContent =
      state.custom ? "Noche 7" : "Noche " + night;
    buildCamMap();
    syncDoors();
    updateHud();
    setCamOpen(false, true);
    hideJumpscare();
    scenes.office.classList.remove("blackout");
    showScene("office");

    Sound.startAmbience();
    lastTs = 0;
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------------
     BUCLE PRINCIPAL
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
      updateHud();
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

    // IA
    ai.update(dt);
    if (ai.isOver()) return;

    // alucinación de Áureo
    updateGolden(dt);

    updateHud();
    render();
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
  function updateHud() {
    var label = state.hour === 0 ? "12" : String(state.hour);
    document.getElementById("hud-time").innerHTML = label + "&nbsp;a.m.";
    document.getElementById("power-value").textContent = Math.ceil(state.power);
    var bars = usageBars();
    var u = document.getElementById("power-usage");
    u.textContent = new Array(bars + 1).join("■");
    u.style.color = bars <= 2 ? "#35d635" : bars <= 4 ? "#e8e800" : "#ff4040";
  }

  /* ---------------------------------------------------------------
     PUERTAS Y LUCES
     --------------------------------------------------------------- */
  function syncDoors() {
    var dl = document.getElementById("door-left");
    var dr = document.getElementById("door-right");
    dl.classList.toggle("closed", state.doorLeft);
    dr.classList.toggle("closed", state.doorRight);
    dl.classList.toggle("lit", state.lightLeft && !state.doorLeft);
    dr.classList.toggle("lit", state.lightRight && !state.doorRight);
    document.getElementById("btn-left-door").classList.toggle("active", state.doorLeft);
    document.getElementById("btn-right-door").classList.toggle("active", state.doorRight);
    document.getElementById("btn-left-light").classList.toggle("active", state.lightLeft);
    document.getElementById("btn-right-light").classList.toggle("active", state.lightRight);
  }

  function canAct() {
    return state.running && state.power > 0 && !ai.isBlackout();
  }

  document.getElementById("btn-left-door").addEventListener("click", function () {
    if (!canAct()) return;
    state.doorLeft = !state.doorLeft;
    Sound.doorSlam();
    syncDoors();
    render();
  });
  document.getElementById("btn-right-door").addEventListener("click", function () {
    if (!canAct()) return;
    state.doorRight = !state.doorRight;
    Sound.doorSlam();
    syncDoors();
    render();
  });
  bindHold("btn-left-light", "lightLeft");
  bindHold("btn-right-light", "lightRight");

  function bindHold(btnId, prop) {
    var btn = document.getElementById(btnId);
    var on = function (e) {
      if (e) e.preventDefault();
      if (!canAct()) return;
      state[prop] = true;
      syncDoors();
      render();
    };
    var off = function () {
      state[prop] = false;
      syncDoors();
      render();
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
    var map = document.getElementById("cam-map");
    map.innerHTML = "";
    C.CAMS.forEach(function (cam) {
      var b = document.createElement("button");
      b.className = "cam-btn";
      b.dataset.id = cam.id;
      b.textContent = "CÁM " + cam.id;
      b.style.left = cam.x + "%";
      b.style.top = cam.y + "%";
      b.addEventListener("click", function () {
        selectCam(cam.id);
      });
      map.appendChild(b);
    });
  }

  function selectCam(id) {
    state.currentCam = id;
    var cam = C.CAMS.filter(function (c) {
      return c.id === id;
    })[0];
    document.getElementById("cam-name").textContent =
      "CÁM " + id + " — " + (cam ? cam.name : "");
    [].forEach.call(document.querySelectorAll("#cam-map .cam-btn"), function (b) {
      b.classList.toggle("active", b.dataset.id === id);
    });
    render();
  }

  function setCamOpen(open, silent) {
    if (!state.running || state.power <= 0 || ai.isBlackout()) open = false;
    var was = state.camOpen;
    state.camOpen = open;
    document.getElementById("cam-panel").classList.toggle("open", open);
    if (!open) camDownSince = performance.now();
    if (open && !was) selectCam(state.currentCam);
    if (!silent && was !== open) Sound.camToggle(open);
    // bajar el monitor disuelve a Áureo
    if (open && golden) clearGolden();
    updateHud();
    render();
  }
  document.getElementById("cam-tab").addEventListener("click", function () {
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
     RENDER (cada frame y en cada acción)
     --------------------------------------------------------------- */
  function render() {
    if (!ai) return;
    var blackout = ai.isBlackout();

    // --- puerta izquierda / derecha: animatrónico visible con la luz ---
    var left = document.getElementById("anim-left");
    var right = document.getElementById("anim-right");
    var atL = ai.atDoor("left");
    var atR = ai.atDoor("right");
    paintDoorway(left, state.lightLeft && !state.doorLeft && atL.length ? atL[0] : null);
    paintDoorway(right, state.lightRight && !state.doorRight && atR.length ? atR[0] : null);

    // --- alguien dentro de la oficina ---
    var inOff = ai.inOffice();
    var oa = document.getElementById("office-anim");
    if (inOff.length && !blackout) {
      var who = inOff.indexOf("bruno") >= 0 ? "bruno" : inOff[0];
      if (oa.dataset.who !== who) oa.innerHTML = C.spriteFor(who, "normal");
      oa.dataset.who = who;
      oa.classList.add("show");
    } else {
      oa.classList.remove("show");
      oa.dataset.who = "";
    }

    // --- cara de Bruno en el apagón ---
    var bf = document.getElementById("blackout-face");
    if (blackout) {
      if (bf.dataset.on !== "1") bf.innerHTML = C.spriteFor("bruno", "normal");
      bf.dataset.on = "1";
      bf.classList.add("show");
      scenes.office.classList.add("blackout");
    } else {
      bf.classList.remove("show");
      bf.dataset.on = "";
    }

    // --- póster / Áureo ---
    var poster = document.getElementById("office-poster");
    if (golden && golden.phase === "poster") {
      if (!poster.classList.contains("golden")) {
        poster.classList.add("golden");
        poster.innerHTML = C.spriteFor("aureo", "normal");
      }
    } else if (!golden && poster.classList.contains("golden")) {
      poster.classList.remove("golden");
      poster.textContent = "¡Celebra!";
    }
    if (golden && golden.phase === "office") {
      if (oa.dataset.who !== "aureo") oa.innerHTML = C.spriteFor("aureo", "normal");
      oa.dataset.who = "aureo";
      oa.classList.add("show");
    }

    // --- panel de cámaras ---
    if (state.camOpen) renderCamPanel();

    // --- alertas en el mapa ---
    [].forEach.call(document.querySelectorAll("#cam-map .cam-btn"), function (b) {
      var p = ai.presenceInCam(b.dataset.id);
      var hot = p.some(function (e) {
        return e.running || e.id !== "rufo" || e.stage >= 2;
      });
      b.classList.toggle("alert", p.length > 0 && hot);
    });
  }

  function paintDoorway(el, id) {
    if (!id) {
      el.classList.remove("show");
      el.dataset.who = "";
      return;
    }
    if (el.dataset.who !== id) el.innerHTML = C.spriteFor(id, "normal");
    el.dataset.who = id;
    el.classList.add("show");
  }

  function renderCamPanel() {
    var cam = C.CAMS.filter(function (c) {
      return c.id === state.currentCam;
    })[0];
    var disabled = document.getElementById("cam-disabled");
    var cove = document.getElementById("cove-stage");
    var feed = document.getElementById("cam-anim");

    disabled.classList.toggle("show", !!(cam && cam.audioOnly));

    var pres = ai.presenceInCam(state.currentCam);

    // La Cala: mostrar la fase de Rufo
    if (state.currentCam === "1C") {
      var rufo = ai.actors().rufo;
      cove.classList.add("show");
      cove.textContent =
        C.ANIMATRONICS.rufo.stages[Math.min(rufo.stage, 3)];
    } else {
      cove.classList.remove("show");
    }

    if (cam && cam.audioOnly) {
      feed.innerHTML = "";
      return;
    }

    var html = "";
    var running = false;
    pres.forEach(function (e) {
      if (e.id === "rufo" && e.running) running = true;
      if (e.id === "rufo" && !e.running && state.currentCam === "1C" && e.stage === 0) {
        return; // cortina cerrada: no se ve
      }
      html += C.spriteFor(e.id, "normal");
    });
    feed.classList.toggle("running", running);
    if (feed.dataset.sig !== state.currentCam + "|" + html.length + "|" + running) {
      feed.innerHTML = html;
      feed.dataset.sig = state.currentCam + "|" + html.length + "|" + running;
    }
  }

  /* ---------------------------------------------------------------
     ÁUREO (alucinación rara)
     --------------------------------------------------------------- */
  function updateGolden(dt) {
    if (golden) {
      golden.timer -= dt;
      if (golden.phase === "poster" && golden.timer <= 0) {
        // si no subiste el monitor, se materializa
        golden.phase = "office";
        golden.timer = 1800;
        Sound.goldenHum();
      } else if (golden.phase === "office" && golden.timer <= 0) {
        triggerJumpscare("aureo");
      }
      return;
    }
    if (state.night < 2 || state.camOpen || ai.isBlackout()) return;
    if (ai.inOffice().length) return;
    if (Math.random() < 0.0016) {
      golden = { phase: "poster", timer: 1400 };
      Sound.goldenHum();
      render();
    }
  }
  function clearGolden() {
    golden = null;
    var poster = document.getElementById("office-poster");
    poster.classList.remove("golden");
    poster.textContent = "¡Celebra!";
    var oa = document.getElementById("office-anim");
    if (oa.dataset.who === "aureo") {
      oa.classList.remove("show");
      oa.dataset.who = "";
    }
  }

  /* ---------------------------------------------------------------
     APAGÓN
     --------------------------------------------------------------- */
  function enterBlackout() {
    if (ai.isBlackout()) return;
    state.doorLeft = state.doorRight = false;
    state.lightLeft = state.lightRight = false;
    state.camOpen = false;
    document.getElementById("cam-panel").classList.remove("open");
    syncDoors();
    updateHud();
    scenes.office.classList.add("blackout");
    ai.beginBlackout();
    Sound.stopAmbience();
    Sound.powerOut();
    setTimeout(function () {
      if (state.running && ai.isBlackout()) Sound.startJingle();
    }, 1600);
    render();
  }

  /* ---------------------------------------------------------------
     JUMPSCARE / FIN
     --------------------------------------------------------------- */
  function triggerJumpscare(id) {
    if (!state.running) return;
    state.running = false;
    Sound.stopJingle();
    Sound.stopAmbience();
    Sound.jumpscare();

    var js = document.getElementById("jumpscare");
    document.getElementById("js-sprite").innerHTML = C.spriteFor(id, "jumpscare");
    js.classList.add("show");

    setTimeout(function () {
      js.classList.remove("show");
      document.getElementById("go-sub").textContent =
        "Te atrapó " + C.ANIMATRONICS[id].name + ".";
      showScene("gameover");
    }, 1100);
  }
  function hideJumpscare() {
    document.getElementById("jumpscare").classList.remove("show");
  }

  function winNight() {
    state.running = false;
    Sound.stopJingle();
    Sound.stopAmbience();
    Sound.chime6am();
    scenes.office.classList.remove("blackout");
    document.getElementById("cam-panel").classList.remove("open");

    if (!state.custom) {
      setMaxNight(Math.max(getMaxNight(), Math.min(state.night + 1, 7)));
    }
    document.getElementById("am-sub").textContent = state.custom
      ? "Has superado la noche personalizada"
      : "Has sobrevivido la Noche " + state.night;
    showScene("sixam");
  }

  document
    .getElementById("btn-gameover-continue")
    .addEventListener("click", backToMenu);
  document.getElementById("btn-6am-continue").addEventListener("click", function () {
    if (!state.custom && state.night < 6) {
      // encadena directamente a la siguiente noche
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
  document.addEventListener("click", function once() {
    Sound.resume();
    document.removeEventListener("click", once);
  });
  refreshMenu();
  showScene("menu");
})();
