import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {'localhost': 'https://lodgeback-cbc389a0f95e.herokuapp.com'}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', {
      getAppVersion: () => ipcRenderer.invoke('get-app-version'),
      getRoomsOffline: () => ipcRenderer.invoke('get-rooms-offline'),
      saveRoomsOffline: (rooms) => ipcRenderer.invoke('save-rooms-offline', rooms),
      getReservationsOffline: () => ipcRenderer.invoke('get-reservations-offline'),
      saveReservationsOffline: (reservations) => ipcRenderer.invoke('save-reservations-offline', reservations),
      getPaymentsOffline: () => ipcRenderer.invoke('get-payments-offline'),
      savePaymentsOffline: (payments) => ipcRenderer.invoke('save-payments-offline', payments),
      sendInvoiceEmail: (emailData) => ipcRenderer.invoke('send-invoice-email', emailData),
  });
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
