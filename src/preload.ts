// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from 'electron';
import type {dialog} from 'electron';
import type {FileSystemEntry} from './shared/types';

const exposedContext = {
  showOpenDialog: (config: Parameters<typeof dialog.showOpenDialog>[0]) =>
    ipcRenderer.invoke('dialog', 'showOpenDialog', config),

  fs: {
    readdir: (path: string): Promise<FileSystemEntry[]> =>
      ipcRenderer.invoke('fs:readdir', path),

    readFile: (path: string): Promise<Buffer> =>
      ipcRenderer.invoke('fs:readFile', path),

    resolveGamePath: (gameDir: string, relativePath: string): Promise<Buffer> =>
      ipcRenderer.invoke('fs:resolveGamePath', gameDir, relativePath),
  },

  path: {
    extname: (path: string): Promise<string> =>
      ipcRenderer.invoke('path:extname', path),

    basename: (path: string): Promise<string> =>
      ipcRenderer.invoke('path:basename', path),

    join: (...paths: string[]): Promise<string> =>
      ipcRenderer.invoke('path:join', ...paths),

    relative: (from: string, to: string): Promise<string> =>
      ipcRenderer.invoke('path:relative', from, to),
  },
};

contextBridge.exposeInMainWorld('native', exposedContext);
