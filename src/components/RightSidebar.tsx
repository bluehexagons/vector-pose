import type {VectorDrawing} from '../shared/types';
import {DrawingsPane} from './DrawingsPane';
import {LayersPane, type LayersPaneProps} from './LayersPane';
import './RightSidebar.css';

interface RightSidebarProps extends LayersPaneProps {
  drawings: VectorDrawing[];
  onDrawingsChange: (drawings: VectorDrawing[]) => void;
  activePane: SidebarPane;
  onActivePaneChange: (pane: SidebarPane) => void;
}

export type SidebarPane = 'nodes' | 'drawings';

export const RightSidebar: React.FC<RightSidebarProps> = ({
  drawings,
  onDrawingsChange,
  skele,
  activePane,
  onActivePaneChange,
  ...layersPaneProps
}) => {
  return (
    <div className="right-sidebar">
      <div className="right-sidebar-tabs" role="tablist" aria-label="Editors">
        <button
          type="button"
          role="tab"
          aria-selected={activePane === 'nodes'}
          className={activePane === 'nodes' ? 'active' : ''}
          onClick={() => onActivePaneChange('nodes')}
        >
          Nodes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activePane === 'drawings'}
          className={activePane === 'drawings' ? 'active' : ''}
          onClick={() => onActivePaneChange('drawings')}
        >
          Drawings <span className="sidebar-count">{drawings.length}</span>
        </button>
      </div>
      <div className="right-sidebar-content">
        {activePane === 'nodes' ? (
          <LayersPane skele={skele} {...layersPaneProps} />
        ) : (
          <DrawingsPane
            drawings={drawings}
            skele={skele}
            onChange={onDrawingsChange}
          />
        )}
      </div>
    </div>
  );
};
