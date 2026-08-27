export interface BundledFileRecord {
  bundledUrl?: string;
}

export function shouldRefreshBundledFile(
  currentFile: BundledFileRecord | undefined,
  assetUrl: string
): boolean {
  if (!currentFile) return true;
  if (!currentFile.bundledUrl) return false;
  return currentFile.bundledUrl !== assetUrl;
}
