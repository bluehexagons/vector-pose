import type {dialog} from 'electron';
import type {RenderInfo, SkeleNode} from 'src/utils/SkeleNode';

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

type TreeNodeNode = Pick<FileTreeNode, 'name' | 'path' | 'type'> & {
  children: TreeNodeMap;
};

interface TreeNodeMap {
  [key: string]: TreeNodeNode;
}

export function createFileTree(files: FileEntry[]): FileTreeNode[] {
  const root: TreeNodeMap = {};

  // First, create the full tree
  for (const file of files) {
    const parts = file.relativePath.split(/[/\\]/).filter(Boolean);
    let current = root;
    let currentPath = '';

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

  // Helper to collapse single-child directories
  function collapseDirectory(
    node: TreeNodeNode,
    nodePath: string[] = []
  ): FileTreeNode {
    if (node.type !== 'directory') {
      return {...node, children: []};
    }

    const childEntries = Object.entries(node.children);
    const children = childEntries.map(([name, child]) =>
      collapseDirectory(child, [...nodePath, name])
    );

    // If directory has exactly one child and it's a directory, combine them
    if (children.length === 1 && children[0].type === 'directory') {
      return {
        name: `${node.name}/${children[0].name}`,
        path: children[0].path,
        type: 'directory',
        children: children[0].children,
      };
    }

    return {
      ...node,
      children,
    };
  }

  // Convert and sort
  return Object.values(root)
    .map(node => collapseDirectory(node))
    .sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
}

export function fileEntryToTreeNode(file: FileEntry): FileTreeNode {
  return {
    name: file.relativePath.split(/[/\\]/).pop() || '',
    path: file.path,
    type: file.type,
    children: [],
  };
}

export interface TabData {
  name: string;
  description: string;
  filePath?: string;
  skele: SkeleNode;
  isModified?: boolean;
  renderedInfo: RenderInfo[];
  renderedNodes: SkeleNode[];
}

declare global {
  interface Window {
    native: {
      dialog: {
        showOpenDialog: typeof dialog.showOpenDialog;
        showSaveDialog: typeof dialog.showSaveDialog;
      };
      fs: {
        readdir: (path: string) => Promise<FileSystemEntry[]>;
        readFile: {
          (path: string, encoding: BufferEncoding): Promise<string>;
          (path: string): Promise<Buffer>;
        };
        resolveGamePath: (
          relativePath: string,
          gameDir: string
        ) => Promise<string>;
        writeFile: (
          path: string,
          data: string | Buffer,
          encoding?: BufferEncoding
        ) => Promise<void>;
      };
      path: {
        extname: (path: string) => Promise<string>;
        basename: (path: string, ext?: string) => Promise<string>;
        join: (...paths: string[]) => Promise<string>;
        relative: (from: string, to: string) => Promise<string>;
      };
    };
  }
}
