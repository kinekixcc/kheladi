const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Navigation handler
  onNavigate: (callback) => {
    ipcRenderer.on('navigate-to', (event, path) => callback(path));
  },
  
  // Remove listener
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Expose app info
contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
  isElectron: true,
  version: process.env.npm_package_version || '1.0.0'
});