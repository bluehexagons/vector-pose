// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from 'electron';
import type {dialog} from 'electron';
import type {FileSystemEntry} from './shared/types';

const exposedContext = {
  dialog: {
    showOpenDialog: (config: Parameters<typeof dialog.showOpenDialog>[0]) =>
      ipcRenderer.invoke('dialog:showOpen', config),
    showSaveDialog: (config: Parameters<typeof dialog.showSaveDialog>[0]) =>
      ipcRenderer.invoke('dialog:showSave', config),
  },

  fs: {
    readdir: (path: string): Promise<FileSystemEntry[]> =>
      ipcRenderer.invoke('fs:readdir', path),

    readFile: (path: string, encoding?: string): Promise<Buffer> =>
      ipcRenderer.invoke('fs:readFile', path, encoding),

    resolveGamePath: (gameDir: string, relativePath: string): Promise<Buffer> =>
      ipcRenderer.invoke('fs:resolveGamePath', gameDir, relativePath),

    writeFile: (
      path: string,
      data: string,
      encoding?: BufferEncoding
    ): Promise<boolean> =>
      ipcRenderer.invoke('fs:writeFile', path, data, encoding),
  },

  path: {
    extname: (path: string): Promise<string> =>
      ipcRenderer.invoke('path:extname', path),

    basename: (path: string, ext?: string): Promise<string> =>
      ipcRenderer.invoke('path:basename', path, ext),

    join: (...paths: string[]): Promise<string> =>
      ipcRenderer.invoke('path:join', ...paths),

    relative: (from: string, to: string): Promise<string> =>
      ipcRenderer.invoke('path:relative', from, to),
  },
};

contextBridge.exposeInMainWorld('native', exposedContext);
