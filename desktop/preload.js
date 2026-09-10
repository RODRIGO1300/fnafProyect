/* ================================================================
   FNAF Clon - puente seguro entre la ventana y el proceso principal.
   Sólo expone lo mínimo: bandera de escritorio y control de ventana.
   ================================================================ */
"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  isDesktop: true,
  quit: function () {
    ipcRenderer.send("app:quit");
  },
  toggleFullscreen: function () {
    ipcRenderer.send("app:toggle-fullscreen");
  },
});
