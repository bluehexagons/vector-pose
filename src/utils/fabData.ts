import type {FabData, TabData} from '../shared/types';

type SerializableTab = Pick<
  TabData,
  'name' | 'description' | 'drawings' | 'skele'
>;

export function serializeFabData(tab: SerializableTab): FabData {
  const skele = tab.skele.toData();

  // The root transform is the editor's camera orientation, not part of the
  // saved pose.
  skele.angle = 0;
  skele.mag = 1;

  return {
    name: tab.name,
    description: tab.description,
    drawings: tab.drawings.length > 0 ? tab.drawings : undefined,
    skele,
  };
}
