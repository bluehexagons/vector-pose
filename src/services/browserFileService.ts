import type {FabData, FileEntry} from '../shared/types';
import {FAB_EXTENSIONS, IMAGE_EXTENSIONS} from '../shared/types';
import {shouldRefreshBundledFile} from '../utils/bundledFileSync';

const DATABASE_NAME = 'vector-pose-workspace';
const DATABASE_VERSION = 3;
const FILE_STORE = 'files';
const BROWSER_FAB_DIRECTORY = './data/fabs/browser';
const BROWSER_SPRITE_DIRECTORY = './gfx/sprite/browser';

const OBSOLETE_BUNDLED_PATHS = [
  './data/fabs/strawberry/test.fab.json',
  './gfx/sprite/strawberry/strawberry-mascot.png',
];

interface StoredWorkspaceFile {
  path: string;
  blob: Blob;
  updatedAt: number;
  bundledUrl?: string;
}

const exampleAssetUrls = import.meta.glob<string>(
  '../../example/**/*.{json,png,jpg,jpeg,webp}',
  {eager: true, query: '?url', import: 'default'}
);

let databasePromise: Promise<IDBDatabase> | undefined;
let examplesPromise: Promise<void> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener('upgradeneeded', event => {
      if (!request.result.objectStoreNames.contains(FILE_STORE)) {
        request.result.createObjectStore(FILE_STORE, {keyPath: 'path'});
      } else if (event.oldVersion < 3) {
        const fileStore = request.transaction?.objectStore(FILE_STORE);
        const bundledPaths = Object.keys(exampleAssetUrls).map(examplePath);
        [...bundledPaths, ...OBSOLETE_BUNDLED_PATHS].forEach(path =>
          fileStore?.delete(path)
        );
      }
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });

  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('abort', () => reject(transaction.error));
    transaction.addEventListener('error', () => reject(transaction.error));
  });
}

function normalizeWorkspacePath(path: string): string {
  const parts = path
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .split('/')
    .filter(part => part && part !== '.');

  if (parts.some(part => part === '..')) {
    throw new Error('Workspace paths cannot leave browser storage');
  }

  return `./${parts.join('/')}`;
}

async function getStoredFile(
  path: string
): Promise<StoredWorkspaceFile | undefined> {
  const database = await openDatabase();
  const transaction = database.transaction(FILE_STORE, 'readonly');
  return requestResult<StoredWorkspaceFile | undefined>(
    transaction.objectStore(FILE_STORE).get(normalizeWorkspacePath(path))
  );
}

async function putStoredFile(
  path: string,
  blob: Blob,
  bundledUrl?: string
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(FILE_STORE, 'readwrite');
  transaction.objectStore(FILE_STORE).put({
    path: normalizeWorkspacePath(path),
    blob,
    updatedAt: Date.now(),
    bundledUrl,
  } satisfies StoredWorkspaceFile);
  await transactionDone(transaction);
}

async function getAllStoredFiles(): Promise<StoredWorkspaceFile[]> {
  const database = await openDatabase();
  const transaction = database.transaction(FILE_STORE, 'readonly');
  return requestResult<StoredWorkspaceFile[]>(
    transaction.objectStore(FILE_STORE).getAll()
  );
}

function examplePath(modulePath: string): string {
  return normalizeWorkspacePath(modulePath.replace('../../example/', ''));
}

async function seedExamples(): Promise<void> {
  const currentFiles = new Map(
    (await getAllStoredFiles()).map(file => [file.path, file])
  );
  await Promise.all(
    Object.entries(exampleAssetUrls).map(async ([modulePath, assetUrl]) => {
      const path = examplePath(modulePath);
      const currentFile = currentFiles.get(path);
      if (!shouldRefreshBundledFile(currentFile, assetUrl)) return;

      const response = await fetch(assetUrl);
      if (!response.ok) {
        throw new Error(`Failed to load bundled example ${path}`);
      }
      await putStoredFile(path, await response.blob(), assetUrl);
    })
  );
}

async function ensureExamples(): Promise<void> {
  examplesPromise ??= seedExamples().catch(error => {
    examplesPromise = undefined;
    throw error;
  });
  return examplesPromise;
}

function classifyFile(path: string): FileEntry['type'] | undefined {
  const lowerPath = path.toLowerCase();
  if (FAB_EXTENSIONS.some(extension => lowerPath.endsWith(extension))) {
    return 'fab';
  }
  if (IMAGE_EXTENSIONS.some(extension => lowerPath.endsWith(extension))) {
    return 'image';
  }
  return undefined;
}

export async function loadBrowserFiles(): Promise<FileEntry[]> {
  await ensureExamples();
  return (await getAllStoredFiles())
    .map(file => {
      const type = classifyFile(file.path);
      return type
        ? {path: file.path, relativePath: file.path, type}
        : undefined;
    })
    .filter((file): file is FileEntry => Boolean(file));
}

export async function resetBrowserWorkspace(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(FILE_STORE, 'readwrite');
  transaction.objectStore(FILE_STORE).clear();
  await transactionDone(transaction);

  examplesPromise = undefined;
  await ensureExamples();
}

export async function readBrowserFile(path: string): Promise<Blob> {
  await ensureExamples();
  const file = await getStoredFile(path);
  if (!file) throw new Error(`File not found in browser storage: ${path}`);
  return file.blob;
}

export async function writeBrowserFab(
  path: string,
  fabData: FabData
): Promise<void> {
  await putStoredFile(
    path,
    new Blob([JSON.stringify(fabData, null, 2)], {type: 'application/json'})
  );
}

function safeFileName(value: string): string {
  const sanitized = value
    .trim()
    .replaceAll('\\', '_')
    .replaceAll('/', '_')
    .replace(/[<>:"|?*]/g, '_');
  return Array.from(sanitized, character =>
    character.charCodeAt(0) < 32 ? '_' : character
  ).join('');
}

function withFabExtension(fileName: string): string {
  return fileName.toLowerCase().endsWith('.fab.json')
    ? fileName
    : `${fileName.replace(/\.json$/i, '')}.fab.json`;
}

export async function chooseBrowserFabPath(
  defaultName: string
): Promise<string | undefined> {
  const proposedName = window.prompt(
    'Save to this browser as:',
    withFabExtension(defaultName)
  );
  if (proposedName === null) return undefined;

  const fileName = withFabExtension(safeFileName(proposedName));
  if (fileName === '.fab.json') return undefined;

  const path = `${BROWSER_FAB_DIRECTORY}/${fileName}`;
  if ((await getStoredFile(path)) && !window.confirm(`Replace ${fileName}?`)) {
    return undefined;
  }
  return path;
}

function chooseFiles(): Promise<File[]> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.fab.json,.png,.jpg,.jpeg,.webp';
    input.addEventListener(
      'change',
      () => resolve(Array.from(input.files ?? [])),
      {
        once: true,
      }
    );
    input.addEventListener('cancel', () => resolve([]), {once: true});
    input.click();
  });
}

async function uniqueImportPath(directory: string, fileName: string) {
  const extensionIndex = fileName.toLowerCase().endsWith('.fab.json')
    ? fileName.length - '.fab.json'.length
    : fileName.lastIndexOf('.');
  const stem =
    extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : '';

  let attempt = `${directory}/${fileName}`;
  let counter = 2;
  while (await getStoredFile(attempt)) {
    attempt = `${directory}/${stem}_${counter++}${extension}`;
  }
  return attempt;
}

export async function importBrowserFiles(): Promise<FileEntry[]> {
  const selectedFiles = await chooseFiles();
  return Promise.all(
    selectedFiles.map(async file => {
      const type = classifyFile(file.name) ?? 'image';
      const directory =
        type === 'fab' ? BROWSER_FAB_DIRECTORY : BROWSER_SPRITE_DIRECTORY;
      const path = await uniqueImportPath(directory, safeFileName(file.name));
      await putStoredFile(path, file);
      return {path, relativePath: path, type};
    })
  );
}

export function downloadBrowserFab(fileName: string, fabData: FabData): void {
  const blobUrl = URL.createObjectURL(
    new Blob([JSON.stringify(fabData, null, 2)], {type: 'application/json'})
  );
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = withFabExtension(safeFileName(fileName));
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}
