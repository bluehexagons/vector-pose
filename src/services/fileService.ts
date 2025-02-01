import type {FabData, FileEntry} from '../shared/types';
import {FAB_EXTENSIONS, IMAGE_EXTENSIONS, SEARCH_DIRS} from '../shared/types';
import {validate as validateFab} from '../validation/fabSchema';

export async function scanDirectory(
  baseDir: string,
  subDir: string
): Promise<FileEntry[]> {
  const fullPath = await window.native.path.join(baseDir, subDir);
  const entries: FileEntry[] = [];

  try {
    const files = await window.native.fs.readdir(fullPath);

    for (const file of files) {
      const relativePath = await window.native.path.join(
        subDir,
        file.relativePath
      );

      if (file.isDirectory) {
        entries.push(...(await scanDirectory(baseDir, relativePath)));
      } else {
        const ext = await window.native.path.extname(file.name);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (IMAGE_EXTENSIONS.includes(ext as any)) {
          entries.push({path: file.path, relativePath, type: 'image'});
        } else if (FAB_EXTENSIONS.some(fabExt => file.name.endsWith(fabExt))) {
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
  const entries: FileEntry[] = [];
  for (const searchDir of SEARCH_DIRS) {
    entries.push(...(await scanDirectory(directory, searchDir)));
  }
  return entries;
}

export async function selectDirectory() {
  const response = await window.native.dialog.showOpenDialog({
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
    const str = (await window.native.fs.readFile(filePath, 'utf-8')) as string;
    return JSON.parse(str);
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

    await window.native.fs.writeFile(
      filePath,
      JSON.stringify(fabData, null, 2),
      'utf8'
    );
    return true;
  } catch (err) {
    console.error('Failed to save FAB file:', err);
    return false;
  }
}

export async function showSaveDialog(defaultName: string) {
  return window.native.dialog.showSaveDialog({
    title: 'Save As',
    buttonLabel: 'Save',
    defaultPath: defaultName + '.fab.json',
    filters: [{name: 'Prefab Files', extensions: ['fab.json']}],
    properties: ['showOverwriteConfirmation', 'createDirectory'],
  });
}

export async function selectFiles() {
  const response = await window.native.dialog.showOpenDialog({
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
          relativePath: await window.native.path.basename(filePath),
          type:
            (await window.native.path.extname(filePath)) === '.json'
              ? 'fab'
              : 'image',
        } as FileEntry)
    )
  );
}
