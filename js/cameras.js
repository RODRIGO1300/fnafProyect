/* ================================================================
   Five Nights at Freddy's - clon
   CÁMARAS: monitor (abrir/cerrar), mapa, selección de sala, fondo de
   cada cámara y sprite del personaje colocado según su cameraLayout.
   ================================================================ */
(function () {
  "use strict";

  var FNAF = window.FNAF;
  var W = FNAF.world;
  var state = FNAF.state;
  var Sound = FNAF.Sound;
  var scenes = FNAF.scenes;
  var $ = FNAF.$;

  var camDownSince = 0; // performance.now() al bajar el monitor
  var lastSig = "";

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

  /* ---------------- Selección de cámara ---------------- */
  function selectCam(id) {
    state.currentCam = id;
    var cam = camById(id);
    $("cam-name").textContent = "CÁM " + id + " — " + (cam ? cam.name : "");
    $("cam-disabled").classList.toggle("show", !!(cam && cam.audioOnly));
    $("cam-feed").style.backgroundImage =
      cam && cam.background
        ? 'linear-gradient(rgba(0,8,4,0.16), rgba(0,0,0,0.34)), url("' +
          cam.background +
          '")'
        : "linear-gradient(#15130f, #000)";
    FNAF.qsa("#cam-map .cam-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.id === id);
    });
    render(true);
  }
  function camById(id) {
    for (var i = 0; i < W.CAMS.length; i++) if (W.CAMS[i].id === id) return W.CAMS[i];
    return null;
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

  /* ---------------- Pintado del personaje en la cámara ---------------- */
  function render(force) {
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
