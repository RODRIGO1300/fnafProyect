/* ================================================================
   Five Nights at Freddy's - clon
   Maquina de estados: menu -> periodico -> intro noche -> oficina -> 6 a.m.

   NOTA: todavia no hay animatronicos ni IA. La oficina es funcional
   (puertas, luces, camaras, reloj y consumo de energia) pero esta vacia.
   ================================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     Utilidades de escena
     --------------------------------------------------------------- */
  var scenes = {
    menu: document.getElementById("scene-menu"),
    news: document.getElementById("scene-news"),
    nightintro: document.getElementById("scene-nightintro"),
    office: document.getElementById("scene-office"),
    sixam: document.getElementById("scene-6am"),
    poweroff: document.getElementById("scene-poweroff"),
  };

  function showScene(name) {
    Object.keys(scenes).forEach(function (key) {
      scenes[key].classList.toggle("active", key === name);
    });
  }

  /* ---------------------------------------------------------------
     Estado de la partida
     --------------------------------------------------------------- */
  var state = {
    night: 1,
    hour: 0, // 0 = 12 a.m. ... 6 = 6 a.m.
    power: 100,
    doorLeft: false,
    doorRight: false,
    lightLeft: false,
    lightRight: false,
    camOpen: false,
    currentCam: "1A",
    running: false,
  };

  // Duracion de una hora de juego en ms (6 horas -> ~4 min de noche)
  var HOUR_MS = 40000;
  var POWER_TICK_MS = 1000;

  var hourTimer = null;
  var powerTimer = null;

  /* ---------------------------------------------------------------
     Camaras (solo nombres; sin contenido todavia)
     --------------------------------------------------------------- */
  var CAMS = [
    { id: "1A", name: "Escenario principal", x: 44, y: 6 },
    { id: "1B", name: "Comedor", x: 44, y: 24 },
    { id: "1C", name: "Zona de juegos", x: 12, y: 40 },
    { id: "5", name: "Trastienda", x: 6, y: 8 },
    { id: "7", name: "Baños", x: 78, y: 40 },
    { id: "3", name: "Almacén", x: 20, y: 70 },
    { id: "4A", name: "Pasillo E", x: 62, y: 70 },
    { id: "4B", name: "Pasillo E (esq.)", x: 62, y: 86 },
    { id: "2A", name: "Pasillo O", x: 34, y: 70 },
    { id: "2B", name: "Pasillo O (esq.)", x: 34, y: 86 },
    { id: "6", name: "Cocina (audio)", x: 80, y: 66 },
  ];

  /* ---------------------------------------------------------------
     MENU
     --------------------------------------------------------------- */
  var menuItems = Array.prototype.slice.call(
    document.querySelectorAll("#menu-list .menu-item")
  );
  var menuIndex = 0;

  function refreshMenuSelection() {
    menuItems.forEach(function (el, i) {
      el.classList.toggle("selected", i === menuIndex);
    });
  }

  function moveMenu(dir) {
    var n = menuItems.length;
    for (var step = 0; step < n; step++) {
      menuIndex = (menuIndex + dir + n) % n;
      if (!menuItems[menuIndex].disabled) break;
    }
    refreshMenuSelection();
  }

  function activateMenu() {
    var item = menuItems[menuIndex];
    if (!item || item.disabled) return;
    if (item.dataset.action === "new") startNewGame();
  }

  menuItems.forEach(function (el, i) {
    el.addEventListener("mouseenter", function () {
      if (el.disabled) return;
      menuIndex = i;
      refreshMenuSelection();
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

  refreshMenuSelection();

  /* ---------------------------------------------------------------
     FLUJO: nueva partida
     --------------------------------------------------------------- */
  function startNewGame() {
    state.night = 1;
    showScene("news");
  }

  scenes.news.querySelector(".newspaper").addEventListener("click", function () {
    showScene("nightintro");
    document.getElementById("night-label").textContent = "Noche " + state.night;
    setTimeout(beginNight, 3000);
  });

  /* ---------------------------------------------------------------
     NOCHE / OFICINA
     --------------------------------------------------------------- */
  function beginNight() {
    state.hour = 0;
    state.power = 100;
    state.doorLeft = state.doorRight = false;
    state.lightLeft = state.lightRight = false;
    state.camOpen = false;
    state.currentCam = "1A";
    state.running = true;

    document.getElementById("hud-night").textContent = "Noche " + state.night;
    buildCamMap();
    syncOfficeUI();
    updateHud();
    showScene("office");

    clearInterval(hourTimer);
    clearInterval(powerTimer);
    hourTimer = setInterval(advanceHour, HOUR_MS);
    powerTimer = setInterval(drainPower, POWER_TICK_MS);
  }

  function advanceHour() {
    state.hour++;
    updateHud();
    if (state.hour >= 6) endNightWin();
  }

  function powerUsageBars() {
    // 1 barra base + 1 por cada puerta/luz/camara activa
    var bars = 1;
    if (state.doorLeft) bars++;
    if (state.doorRight) bars++;
    if (state.lightLeft) bars++;
    if (state.lightRight) bars++;
    if (state.camOpen) bars++;
    return bars;
  }

  function drainPower() {
    if (!state.running) return;
    var bars = powerUsageBars();
    // consumo por segundo escalado para que la noche sea jugable
    state.power -= bars * 0.18;
    if (state.power <= 0) {
      state.power = 0;
      updateHud();
      endNightPowerOff();
      return;
    }
    updateHud();
  }

  function updateHud() {
    var label = state.hour === 0 ? "12" : String(state.hour);
    document.getElementById("hud-time").innerHTML = label + "&nbsp;a.m.";
    document.getElementById("power-value").textContent =
      Math.ceil(state.power);

    var bars = powerUsageBars();
    var usage = document.getElementById("power-usage");
    usage.textContent = new Array(bars + 1).join("■");
    usage.style.color =
      bars <= 1 ? "#35d635" : bars <= 3 ? "#e8e800" : "#ff4040";
  }

  /* ---------- Puertas y luces ---------- */
  function syncOfficeUI() {
    var dl = document.getElementById("door-left");
    var dr = document.getElementById("door-right");
    dl.classList.toggle("closed", state.doorLeft);
    dr.classList.toggle("closed", state.doorRight);
    dl.classList.toggle("lit", state.lightLeft && !state.doorLeft);
    dr.classList.toggle("lit", state.lightRight && !state.doorRight);

    document
      .getElementById("btn-left-door")
      .classList.toggle("active", state.doorLeft);
    document
      .getElementById("btn-right-door")
      .classList.toggle("active", state.doorRight);
    document
      .getElementById("btn-left-light")
      .classList.toggle("active", state.lightLeft);
    document
      .getElementById("btn-right-light")
      .classList.toggle("active", state.lightRight);
  }

  function toggle(prop) {
    if (!state.running || state.power <= 0) return;
    state[prop] = !state[prop];
    syncOfficeUI();
    updateHud();
  }

  document
    .getElementById("btn-left-door")
    .addEventListener("click", function () {
      toggle("doorLeft");
    });
  document
    .getElementById("btn-right-door")
    .addEventListener("click", function () {
      toggle("doorRight");
    });

  // Las luces solo consumen mientras se mantiene pulsado
  bindHold("btn-left-light", "lightLeft");
  bindHold("btn-right-light", "lightRight");

  function bindHold(btnId, prop) {
    var btn = document.getElementById(btnId);
    var on = function () {
      if (!state.running || state.power <= 0) return;
      state[prop] = true;
      syncOfficeUI();
      updateHud();
    };
    var off = function () {
      state[prop] = false;
      syncOfficeUI();
      updateHud();
    };
    btn.addEventListener("mousedown", on);
    btn.addEventListener("mouseup", off);
    btn.addEventListener("mouseleave", off);
    btn.addEventListener("touchstart", function (e) {
      e.preventDefault();
      on();
    });
    btn.addEventListener("touchend", off);
  }

  /* ---------- Camaras ---------- */
  function buildCamMap() {
    var map = document.getElementById("cam-map");
    map.innerHTML = "";
    CAMS.forEach(function (cam) {
      var b = document.createElement("button");
      b.className = "cam-btn";
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
    var cam = CAMS.filter(function (c) {
      return c.id === id;
    })[0];
    document.getElementById("cam-name").textContent =
      "CÁM " + id + " — " + (cam ? cam.name : "");
    Array.prototype.forEach.call(
      document.querySelectorAll("#cam-map .cam-btn"),
      function (b) {
        b.classList.toggle("active", b.textContent === "CÁM " + id);
      }
    );
  }

  function setCamOpen(open) {
    if (!state.running || state.power <= 0) {
      open = false;
    }
    state.camOpen = open;
    document.getElementById("cam-panel").classList.toggle("open", open);
    if (open) selectCam(state.currentCam);
    updateHud();
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
     FIN DE NOCHE
     --------------------------------------------------------------- */
  function stopNight() {
    state.running = false;
    clearInterval(hourTimer);
    clearInterval(powerTimer);
    setCamOpen(false);
  }

  function endNightWin() {
    stopNight();
    showScene("sixam");
  }

  function endNightPowerOff() {
    stopNight();
    showScene("poweroff");
  }

  document
    .getElementById("btn-6am-continue")
    .addEventListener("click", function () {
      showScene("menu");
      refreshMenuSelection();
    });

  document
    .getElementById("btn-poweroff-continue")
    .addEventListener("click", function () {
      showScene("menu");
      refreshMenuSelection();
    });

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  showScene("menu");
})();
