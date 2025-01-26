import {TabData} from '../shared/types';
import './HeaderPane.css';

export const HeaderPane = ({
  activeTab,
  onSave,
  onSaveAs,
  onNameChange,
}: {
  activeTab?: TabData;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  onNameChange: (name: string) => void;
}) => {
  return (
    <div className="header-pane">
      <div className="header-left">
        <h1 className="header-title">vector-pose</h1>
        {activeTab && (
          <input
            type="text"
            className="tab-name-input"
            value={activeTab.name}
            onChange={e => onNameChange(e.target.value)}
          />
        )}
        {activeTab?.isModified && <span className="modified-indicator">*</span>}
      </div>
      <ul className="header-menu">
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
