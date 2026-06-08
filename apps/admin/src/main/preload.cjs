const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
    getDB: () => ipcRenderer.invoke('get-db'),
    updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
    checkPassword: (password) => ipcRenderer.invoke('check-password', password),
    addCircuit: (name) => ipcRenderer.invoke('add-circuit', { name }),
    deleteCircuit: (name) => ipcRenderer.invoke('delete-circuit', { name }),
    uploadTrackImage: (circuitName, filePath, fileName) =>
        ipcRenderer.invoke('upload-track-image', { circuitName, filePath, fileName }),
    addVehicle: (name) => ipcRenderer.invoke('add-vehicle', { name }),
    deleteVehicle: (name) => ipcRenderer.invoke('delete-vehicle', { name }),
    uploadVehicleImage: (vehicleName, filePath, fileName) =>
        ipcRenderer.invoke('upload-vehicle-image', { vehicleName, filePath, fileName }),
    toggleCircuitCategory: (circuitName, cat) =>
        ipcRenderer.invoke('toggle-circuit-category', { circuitName, cat }),
    addEntry: (circuitName, category, entry) =>
        ipcRenderer.invoke('add-entry', { circuitName, category, entry }),
    deleteEntry: (circuitName, category, id) =>
        ipcRenderer.invoke('delete-entry', { circuitName, category, id }),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    getCircuitsDir: () => ipcRenderer.invoke('get-circuits-dir'),
    getLocalIP: () => ipcRenderer.invoke('get-local-ip'),
    getServerPort: () => ipcRenderer.invoke('get-server-port'),
})