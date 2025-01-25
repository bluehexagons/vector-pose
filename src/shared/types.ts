import type {dialog} from 'electron';
import type {SkeleNode} from 'src/utils/SkeleNode';

export interface UiNode {
  node: SkeleNode;
}

export interface FileSystemEntry {
  name: string;
  isDirectory: boolean;
  path: string;
  relativePath: string;
}

export interface FileEntry {
  path: string;
  relativePath: string;
  type: 'fab' | 'image';
}

export const SEARCH_DIRS = ['./data/fabs', './src/renderer/gfx'] as const;
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;
export const FAB_EXTENSIONS = ['.fab.json'] as const;

export const GFX_PREFIX = 'gfx:';
export const SPRITE_PREFIX = 'sprite:';

export function toSpriteUri(fullPath: string): string | null {
  let match = fullPath.match(
    /[/\\]gfx[/\\]sprite[/\\](([^/\\]*[/\\])*[^/\\]+)\.[^.]+$/i
  );
  console.log('match', match);
  if (match?.[1]) return `${SPRITE_PREFIX}${match[1]}`;

  match = fullPath.match(/[/\\]gfx[/\\](([^/\\]*[/\\])*[^/\\]+)\.[^.]+$/i);
  console.log('match2', match);
  if (match?.[1]) return `${GFX_PREFIX}${match[1]}`;

  return null;
}

export function fromSpriteUri(uri: string): string {
  if (uri.startsWith(SPRITE_PREFIX)) {
    const spriteName = uri.slice(SPRITE_PREFIX.length);
    return `./src/renderer/gfx/sprite/${spriteName}.png`;
  }
  if (uri.startsWith(GFX_PREFIX)) {
    const spriteName = uri.slice(GFX_PREFIX.length);
    return `./src/renderer/gfx/${spriteName}.png`;
  }
  return uri;
}

export interface ImageCache {
  [key: string]: string; // Maps sprite URI to blob URL
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'directory' | 'fab' | 'image';
  children: FileTreeNode[];
}

interface TreeNodeMap {
  [key: string]: Pick<FileTreeNode, 'name' | 'path' | 'type'> & {
    children: TreeNodeMap;
  };
}

export function createFileTree(files: FileEntry[]): FileTreeNode[] {
  const root: TreeNodeMap = {};

  for (const file of files) {
    // Split path and remove empty segments
    const parts = file.relativePath.split(/[/\\]/).filter(Boolean);
    let current = root;
    let currentPath = '';

    // Create directory nodes for each part of the path
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: 'directory',
          children: {},
        };
      }
      current = current[part].children;
    }

    // Add file node at the final level
    const fileName = parts[parts.length - 1];
    if (fileName) {
      current[fileName] = {
        name: fileName,
        path: file.path,
        type: file.type,
        children: {},
      };
    }
  }

  // Helper to sort nodes: directories first, then alphabetically
  function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
    return nodes.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Convert nested objects to arrays recursively
  function objectToArray(obj: TreeNodeMap): FileTreeNode[] {
    return sortNodes(
      Object.values(obj).map(node => ({
        ...node,
        children: objectToArray(node.children),
      }))
    );
  }
  console.log('root', root);
  console.log(objectToArray(root));

  return objectToArray(root);
}

export function fileEntryToTreeNode(file: FileEntry): FileTreeNode {
  return {
    name: file.relativePath.split(/[/\\]/).pop() || '',
    path: file.path,
    type: file.type,
    children: [],
  };
}

declare global {
  interface Window {
    native: {
      showOpenDialog: typeof dialog.showOpenDialog;
      fs: {
        readdir: (path: string) => Promise<FileSystemEntry[]>;
        readFile: (path: string) => Promise<Buffer>;
        resolveGamePath: (
          relativePath: string,
          gameDir: string
        ) => Promise<string>;
      };
      path: {
        extname: (path: string) => Promise<string>;
        basename: (path: string) => Promise<string>;
        join: (...paths: string[]) => Promise<string>;
        relative: (from: string, to: string) => Promise<string>;
      };
    };
  }
}
