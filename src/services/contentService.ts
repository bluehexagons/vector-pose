import {FabData, FileEntry, TabData, toSpriteUri} from '../shared/types';
import {SkeleNode} from '../utils/SkeleNode';
import {loadFabFile} from './fileService';

let loadAtom = 0;

export async function loadFabContent(
  file: FileEntry,
  initialRotation: number
): Promise<{skele: SkeleNode; fabData: FabData} | null> {
  const fabData = await loadFabFile(file.path);
  if (!fabData?.skele) return null;

  const newSkele = SkeleNode.fromData(fabData.skele);
  newSkele.rotation = initialRotation;
  newSkele.mag = 1;
  newSkele.id = `#FAB_ROOT_${++loadAtom}`;
  return {skele: newSkele, fabData};
}

export function createImageNode(file: FileEntry, size = 0.25) {
  const spriteUri = toSpriteUri(file.path);
  if (!spriteUri) return null;

  return SkeleNode.fromData({
    angle: 0,
    mag: size,
    uri: spriteUri,
  });
}

export function findExistingTab(tabs: TabData[], filePath: string) {
  return tabs.find(tab => tab.filePath === filePath);
}
