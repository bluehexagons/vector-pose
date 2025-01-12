import type {dialog} from 'electron';

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

export const SPRITE_PREFIX = 'sprite:';

export function toSpriteUri(fullPath: string): string | null {
  const match = fullPath.match(/[/\\]gfx[/\\]([^/\\]+)\.[^.]+$/i);
  return match ? `${SPRITE_PREFIX}${match[1]}` : null;
}

export function fromSpriteUri(uri: string): string {
  if (!uri.startsWith(SPRITE_PREFIX)) return uri;
  const spriteName = uri.slice(SPRITE_PREFIX.length);
  return `./src/renderer/gfx/${spriteName}.png`;
}

export interface ImageCache {
  [key: string]: string; // Maps sprite URI to blob URL
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
