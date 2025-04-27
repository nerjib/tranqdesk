"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = { "localhost": "https://lodgeback-cbc389a0f95e.herokuapp.com" };
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("electronAPI", {
      getAppVersion: () => electron.ipcRenderer.invoke("get-app-version"),
      getRoomsOffline: () => electron.ipcRenderer.invoke("get-rooms-offline"),
      saveRoomsOffline: (rooms) => electron.ipcRenderer.invoke("save-rooms-offline", rooms),
      getReservationsOffline: () => electron.ipcRenderer.invoke("get-reservations-offline"),
      saveReservationsOffline: (reservations) => electron.ipcRenderer.invoke("save-reservations-offline", reservations),
      getPaymentsOffline: () => electron.ipcRenderer.invoke("get-payments-offline"),
      savePaymentsOffline: (payments) => electron.ipcRenderer.invoke("save-payments-offline", payments),
      sendInvoiceEmail: (emailData) => electron.ipcRenderer.invoke("send-invoice-email", emailData)
    });
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
