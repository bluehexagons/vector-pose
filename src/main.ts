import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import squirrelStarted from 'electron-squirrel-startup';
import fs from 'fs/promises';
import path from 'path';
import 'update-electron-app';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelStarted) {
  app.quit();
}

ipcMain.handle('dialog:showOpen', async (_event, params) => {
  return await dialog.showOpenDialog(params);
});

ipcMain.handle('dialog:showSave', async (_event, params) => {
  return await dialog.showSaveDialog(params);
});

ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
  try {
    const entries = await fs.readdir(dirPath, {withFileTypes: true});
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name),
      relativePath: path.relative(dirPath, path.join(dirPath, entry.name)),
    }));
  } catch (err) {
    console.error('Failed to read directory:', err);
    throw err;
  }
});

ipcMain.handle(
  'fs:readFile',
  async (
    _event,
    filePath: string,
    encoding?: BufferEncoding
  ): Promise<string | Buffer> => {
    try {
      if (encoding) {
        return await fs.readFile(filePath, {encoding});
      }
      return await fs.readFile(filePath);
    } catch (err) {
      console.error('Failed to read file:', err);
      throw err;
    }
  }
);

ipcMain.handle(
  'fs:writeFile',
  async (
    _event,
    filePath: string,
    data: string | Buffer,
    encoding?: BufferEncoding
  ): Promise<void> => {
    try {
      await fs.writeFile(filePath, data, encoding);
    } catch (err) {
      console.error('Failed to write file:', err);
      throw err;
    }
  }
);

ipcMain.handle('path:extname', (_event, filePath: string) => {
  return path.extname(filePath).toLowerCase();
});

ipcMain.handle('path:basename', (_event, filePath: string, ext?: string) => {
  return path.basename(filePath, ext);
});

ipcMain.handle('path:join', (_event, ...paths: string[]) => {
  return path.join(...paths);
});

ipcMain.handle('path:relative', (_event, from: string, to: string) => {
  return path.relative(from, to);
});

ipcMain.handle(
  'fs:resolveGamePath',
  (_event, gameDir: string, relativePath: string) => {
    return path.resolve(gameDir, relativePath);
  }
);

const init = async () => {
  const createWindow = async () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
      },
      show: false,
      autoHideMenuBar: true,
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      await mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }

    // Open the DevTools.
    mainWindow.show();
    // mainWindow.webContents.openDevTools();
  };

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  await app.whenReady();
  await createWindow();

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.
};

init();
