// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from 'electron';

import type {dialog} from 'electron';

const exposedContext: {
  showOpenDialog: typeof dialog.showOpenDialog;
} = {
  showOpenDialog: config =>
    ipcRenderer.invoke('dialog', 'showOpenDialog', config),
};

contextBridge.exposeInMainWorld('native', exposedContext);
