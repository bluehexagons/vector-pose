import {TabData} from '../shared/types';
import './HeaderPane.css';

export const HeaderPane = ({
  activeTab,
  onSave,
  onSaveAs,
  onNameChange,
  onRotateView,
  viewRotation,
}: {
  activeTab?: TabData;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  onNameChange: (name: string) => void;
  onRotateView: (degrees: number) => void;
  viewRotation: number;
}) => {
  return (
    <div className="header-pane">
      <div className="header-left">
        <h1 className="header-title">
          {activeTab && (
            <input
              type="text"
              className="tab-name-input"
              value={activeTab.name}
              onChange={e => onNameChange(e.target.value)}
            />
          )}
          {activeTab?.isModified && '*'}
        </h1>
      </div>
      <ul className="header-menu">
        <li className="header-menu-item">
          <div className="view-controls">
            <button onClick={() => onRotateView(viewRotation - 45)}>⟲</button>
            <input
              type="number"
              className="rotation-input"
              value={viewRotation}
              onChange={e => onRotateView(Number(e.target.value) || 0)}
              step={15}
            />
            <span>°</span>
            <button onClick={() => onRotateView(viewRotation + 45)}>⟳</button>
          </div>
        </li>
        <li className="header-menu-item">
          <button onClick={onSave} disabled={!activeTab}>
            Save
          </button>
        </li>
        <li className="header-menu-item">
          <button onClick={onSaveAs} disabled={!activeTab}>
            Save As...
          </button>
        </li>
      </ul>
    </div>
  );
};
