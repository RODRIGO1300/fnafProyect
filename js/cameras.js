/* ================================================================
   Five Nights at Freddy's - clon
   CÁMARAS: monitor (abrir/cerrar), mapa, selección de sala, fondo de
   cada cámara y sprite del personaje colocado según su cameraLayout.

   Escenario (1A): el fondo cambia según si Dogo sigue ahí (foto con
   el trío) o ya se marchó (foto sin él). En el resto de salas se
   superpone su sprite recortado.
   ================================================================ */
(function () {
  "use strict";

  if (window.__BLOCKED__) return;

  var FNAF = window.FNAF;
  var W = FNAF.world;
  var state = FNAF.state;
  var Sound = FNAF.Sound;
  var scenes = FNAF.scenes;
  var $ = FNAF.$;

  var camDownSince = 0; // performance.now() al bajar el monitor
  var lastSig = "";
  var lastBg = "";

  /* ---------------- Mapa ---------------- */
  function buildMap() {
    var map = $("cam-map");
    FNAF.qsa(".cam-btn", map).forEach(function (b) {
      b.remove();
    });
    W.CAMS.forEach(function (cam) {
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

  function camById(id) {
    for (var i = 0; i < W.CAMS.length; i++) if (W.CAMS[i].id === id) return W.CAMS[i];
    return null;
  }

  /* ---------------- Fondo del feed (dinámico en el escenario) --------- */
  // Devuelve la URL de fondo para una cámara. Si es el escenario de un
  // personaje, elige la versión con/sin él según siga o no en la sala.
  function backgroundFor(camId) {
    var cam = camById(camId);
    var base = (cam && cam.background) || "";

    var ai = FNAF.night.ai();
    for (var i = 0; i < W.ROSTER.length; i++) {
      var def = W.ANIMATRONICS[W.ROSTER[i]];
      if (!def || def.stage !== camId || !def.stageBackgrounds) continue;
      var here =
        !!ai &&
        ai.presenceInCam(camId).some(function (e) {
          return e.id === def.id;
        });
      var sb = def.stageBackgrounds;
      return here ? sb.present : sb.absent || base;
    }
    return base;
  }

  function applyFeedBackground(force) {
    var url = backgroundFor(state.currentCam);
    if (!force && url === lastBg) return;
    lastBg = url;
    $("cam-feed").style.backgroundImage = url
      ? 'linear-gradient(rgba(0,8,4,0.16), rgba(0,0,0,0.34)), url("' + url + '")'
      : "linear-gradient(#15130f, #000)";
  }

  /* ---------------- Selección de cámara ---------------- */
  function selectCam(id) {
    state.currentCam = id;
    var cam = camById(id);
    $("cam-name").textContent = "CÁM " + id + " — " + (cam ? cam.name : "");
    $("cam-disabled").classList.toggle("show", !!(cam && cam.audioOnly));
    FNAF.qsa("#cam-map .cam-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.id === id);
    });
    applyFeedBackground(true);
    render(true);
  }

  /* ---------------- Abrir / cerrar monitor ---------------- */
  function setOpen(open) {
    if (!FNAF.night.canAct()) open = false;
    var was = state.camOpen;
    state.camOpen = open;
    $("cam-panel").classList.toggle("open", open);
    scenes.el("office").classList.toggle("cams-open", open);
    if (!open) camDownSince = performance.now();
    if (was !== open) {
      Sound.camToggle(open);
      if (open) glitchBurst();
    }
    FNAF.bus.emit("render");
  }

  $("cam-tab").addEventListener("click", function () {
    setOpen(!state.camOpen);
  });
  $("cam-close").addEventListener("click", function () {
    setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (!scenes.is("office")) return;
    if (e.code === "Space") {
      e.preventDefault();
      setOpen(!state.camOpen);
    }
  });

  /* ---------------- Pintado ---------------- */
  function render(force) {
    // el fondo se revisa siempre (barato: comparación de cadena)
    applyFeedBackground(force);

    var ai = FNAF.night.ai();
    var def = W.ANIMATRONICS.dogo;
    var present =
      state.camOpen &&
      !!ai &&
      ai.presenceInCam(state.currentCam).some(function (e) {
        return e.id === "dogo";
      });
    var src = def.cameraSprites && def.cameraSprites[state.currentCam];
    var show = present && !!src;

    var sig = [state.camOpen, state.currentCam, show].join("|");
    if (!force && sig === lastSig) return;
    lastSig = sig;

    var sprite = $("cam-character");
    if (show) {
      if (sprite.getAttribute("src") !== src) sprite.setAttribute("src", src);
      var lo = (def.cameraLayout && def.cameraLayout[state.currentCam]) || {};
      sprite.style.width = (lo.width || 46) + "%";
      sprite.style.left = (lo.left || 50) + "%";
      sprite.style.bottom = (lo.bottom || 6) + "%";
      sprite.style.mixBlendMode = lo.blend || "normal";
      sprite.alt = "Dogo en CÁM " + state.currentCam;
      sprite.classList.add("show");
    } else {
      sprite.classList.remove("show");
      sprite.alt = "";
    }
  }

  FNAF.bus.on("render", function () {
    render(false);
  });
  FNAF.bus.on("night:start", function () {
    camDownSince = performance.now();
    lastSig = "";
    lastBg = "";
    $("cam-panel").classList.remove("open");
    scenes.el("office").classList.remove("cams-open");
    buildMap();
    selectCam("1A");
  });

  FNAF.cameras = {
    downMs: function () {
      return state.camOpen ? 0 : performance.now() - camDownSince;
    },
    setOpen: setOpen,
    buildMap: buildMap,
  };
})();
