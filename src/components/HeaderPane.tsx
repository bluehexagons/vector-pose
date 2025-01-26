import {TabData} from '../shared/types';
import './HeaderPane.css';

export const HeaderPane = ({
  activeTab,
  onSave,
  onSaveAs,
}: {
  activeTab?: TabData;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
}) => {
  return (
    <div className="header-pane">
      <h1 className="header-title">
        {activeTab?.name ?? 'vector-pose'}
        {activeTab?.isModified && '*'}
      </h1>
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
