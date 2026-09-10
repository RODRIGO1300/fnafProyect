/* ================================================================
   FNAF Clon - proceso principal de Electron

   Crea la ventana y carga el mismo index.html del juego. El juego
   (js/*.js) no sabe que está en Electron; sólo detecta window.desktop
   para mostrar la opción "Salir".
   ================================================================ */
"use strict";

const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
const ROOT = path.join(__dirname, "..");

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 960, // 4:3
    minWidth: 640,
    minHeight: 480,
    useContentSize: true,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    title: "FNAF Clon",
    icon: path.join(ROOT, "build", "icon.ico"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(ROOT, "index.html"));
  win.once("ready-to-show", function () {
    win.show();
    if (isDev) win.webContents.openDevTools({ mode: "detach" });
  });

  // Atajos: F11 pantalla completa, F12/Ctrl+Shift+I devtools sólo en dev.
  win.webContents.on("before-input-event", function (event, input) {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    } else if (
      isDev &&
      (input.key === "F12" ||
        (input.control && input.shift && input.key.toLowerCase() === "i"))
    ) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Los enlaces externos se abren en el navegador del sistema.
  win.webContents.setWindowOpenHandler(function (details) {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
}

/* ---------------- IPC desde preload.js ---------------- */
ipcMain.on("app:quit", function () {
  app.quit();
});
ipcMain.on("app:toggle-fullscreen", function () {
  if (win) win.setFullScreen(!win.isFullScreen());
});

/* ---------------- Ciclo de vida ---------------- */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", function () {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
  });
}
