import type {FabData, FileEntry} from '../shared/types';
import {FAB_EXTENSIONS, IMAGE_EXTENSIONS, SEARCH_DIRS} from '../shared/types';
import {validate as validateFab} from '../validation/fabSchema';
import {
  chooseBrowserFabPath,
  downloadBrowserFab,
  importBrowserFiles,
  loadBrowserFiles,
  readBrowserFile,
  writeBrowserFab,
} from './browserFileService';

export const isBrowserWorkspace = () => !window.native;

const getNative = () => {
  if (!window.native) throw new Error('Electron APIs are unavailable');
  return window.native;
};

export async function scanDirectory(
  baseDir: string,
  subDir: string
): Promise<FileEntry[]> {
  const native = getNative();
  const fullPath = await native.path.join(baseDir, subDir);
  const entries: FileEntry[] = [];

  try {
    const files = await native.fs.readdir(fullPath);

    for (const file of files) {
      const relativePath = await native.path.join(subDir, file.relativePath);

      if (file.isDirectory) {
        entries.push(...(await scanDirectory(baseDir, relativePath)));
      } else {
        const ext = await native.path.extname(file.name);
        if (
          IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number])
        ) {
          entries.push({path: file.path, relativePath, type: 'image'});
        } else if (
          FAB_EXTENSIONS.some(fabExt =>
            file.name.toLowerCase().endsWith(fabExt)
          )
        ) {
          entries.push({path: file.path, relativePath, type: 'fab'});
        }
      }
    }
  } catch (err) {
    console.error(`Failed to scan directory ${fullPath}:`, err);
  }

  return entries;
}

export async function loadDirectoryFiles(
  directory: string
): Promise<FileEntry[]> {
  if (isBrowserWorkspace()) return loadBrowserFiles();

  const entries: FileEntry[] = [];
  for (const searchDir of SEARCH_DIRS) {
    entries.push(...(await scanDirectory(directory, searchDir)));
  }
  return entries;
}

export async function selectDirectory() {
  const response = await getNative().dialog.showOpenDialog({
    properties: ['openDirectory', 'treatPackageAsDirectory'],
    title: 'Select Game Directory',
    buttonLabel: 'Open',
  });

  if (!response.canceled && response.filePaths.length > 0) {
    return response.filePaths[0];
  }
  return null;
}

export async function loadFabFile(filePath: string) {
  try {
    const str = isBrowserWorkspace()
      ? await (await readBrowserFile(filePath)).text()
      : await getNative().fs.readFile(filePath, 'utf-8');
    const validationResult = validateFab(JSON.parse(str));
    if (!validationResult.success) {
      console.error('Invalid FAB data:', validationResult.error.format());
      return null;
    }
    return validationResult.data;
  } catch (err) {
    console.error('Failed to load fab file:', err);
    return null;
  }
}

export async function saveFabFile(filePath: string, fabData: FabData) {
  try {
    const validationResult = validateFab(fabData);
    if (!validationResult.success) {
      console.error('Invalid FAB data:', validationResult.error.format());
      return false;
    }

    if (isBrowserWorkspace()) {
      await writeBrowserFab(filePath, validationResult.data);
    } else {
      await getNative().fs.writeFile(
        filePath,
        JSON.stringify(validationResult.data, null, 2),
        'utf8'
      );
    }
    return true;
  } catch (err) {
    console.error('Failed to save FAB file:', err);
    return false;
  }
}

export async function showSaveDialog(defaultName: string) {
  if (isBrowserWorkspace()) {
    const filePath = await chooseBrowserFabPath(defaultName);
    return {canceled: !filePath, filePath};
  }

  return getNative().dialog.showSaveDialog({
    title: 'Save As',
    buttonLabel: 'Save',
    defaultPath: defaultName + '.fab.json',
    filters: [{name: 'Prefab Files', extensions: ['fab.json']}],
    properties: ['showOverwriteConfirmation', 'createDirectory'],
  });
}

export async function selectFiles() {
  if (isBrowserWorkspace()) return importBrowserFiles();

  const native = getNative();
  const response = await native.dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections', 'treatPackageAsDirectory'],
    title: 'Add image layers',
    buttonLabel: 'Add',
    filters: [
      {
        name: 'Supported Files',
        extensions: ['fab.json', 'jpg', 'jpeg', 'png', 'webp'],
      },
      {name: 'Prefab Files', extensions: ['fab.json']},
      {name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp']},
    ],
  });

  if (!response || response.canceled) return [];

  return Promise.all(
    response.filePaths.map(
      async filePath =>
        ({
          path: filePath,
          relativePath: await native.path.basename(filePath),
          type: filePath.toLowerCase().endsWith('.fab.json') ? 'fab' : 'image',
        }) as FileEntry
    )
  );
}

export async function loadImageFile(
  gameDirectory: string,
  relativePath: string
): Promise<Blob> {
  if (isBrowserWorkspace()) return readBrowserFile(relativePath);

  const native = getNative();
  const fullPath = await native.fs.resolveGamePath(gameDirectory, relativePath);
  const data = await native.fs.readFile(fullPath);
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const extension = relativePath
    .toLowerCase()
    .match(/\.(png|jpe?g|webp)$/)?.[1];
  const mimeType =
    extension === 'jpg' || extension === 'jpeg'
      ? 'image/jpeg'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/png';
  return new Blob([bytes.buffer], {type: mimeType});
}

export function exportFabFile(fileName: string, fabData: FabData): void {
  downloadBrowserFab(fileName, fabData);
}
