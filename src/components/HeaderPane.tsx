import {TabData} from '../shared/types';
import {HistoryEntry} from '../utils/HistoryManager';
import {SkeleNode} from '../utils/SkeleNode';
import './HeaderPane.css';
import {HistoryDropdown} from './HistoryDropdown';

export const HeaderPane = ({
  activeTab,
  onSave,
  onSaveAs,
  onExport,
  onNameChange,
  onRotateView,
  viewRotation,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  historyEntries,
  currentHistoryIndex,
  onHistorySelect,
  onShowWelcome,
  onShowSettings,
}: {
  activeTab?: TabData;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  onExport?: () => void;
  onNameChange: (name: string) => void;
  onRotateView: (degrees: number) => void;
  viewRotation: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyEntries: HistoryEntry<SkeleNode>[];
  currentHistoryIndex: number;
  onHistorySelect: (index: number) => void;
  onShowWelcome: () => void;
  onShowSettings: () => void;
}) => {
  return (
    <div className="header-pane">
      <div className="header-left">
        <label className="header-title">
          <span>Project</span>
          {activeTab && (
            <input
              type="text"
              className="tab-name-input"
              value={activeTab.name}
              onChange={e => onNameChange(e.target.value)}
              aria-label="Project name"
              title="Rename this project"
            />
          )}
        </label>
        {activeTab?.isModified && (
          <span
            className="modified-indicator"
            title="This project has unsaved changes"
          >
            Unsaved
          </span>
        )}
      </div>
      <ul className="header-menu">
        <li className="header-menu-item">
          <button onClick={onShowWelcome} title="Open the welcome screen">
            Welcome
          </button>
        </li>
        <li className="header-menu-item">
          <button onClick={onShowSettings} title="Open editor settings">
            Settings
          </button>
        </li>
        <li className="header-menu-item">
          <HistoryDropdown
            entries={historyEntries}
            currentIndex={currentHistoryIndex}
            onSelect={onHistorySelect}
          />
        </li>
        <li className="header-menu-item">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last action (ctrl+z)"
          >
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo action (ctrl+shift+z)"
          >
            Redo
          </button>
        </li>
        <li className="header-menu-item">
          <div className="view-controls">
            <button
              title="Rotate counter-clockwise 45 degrees"
              onClick={() => onRotateView(viewRotation - 45)}
            >
              ⟲
            </button>
            <input
              type="number"
              className="rotation-input"
              title="Set rotation in degrees"
              value={viewRotation}
              onChange={e => onRotateView(Number(e.target.value) || 0)}
              step={15}
            />
            <span>°</span>
            <button
              title="Rotate clockwise 45 degrees"
              onClick={() => onRotateView(viewRotation + 45)}
            >
              ⟳
            </button>
          </div>
        </li>
        <li className="header-menu-item">
          <button
            className={
              activeTab?.isModified ? 'save-button modified' : 'save-button'
            }
            onClick={onSave}
            title={
              activeTab?.filePath
                ? `Save over file ${activeTab?.filePath}`
                : 'Save as a new file'
            }
          >
            Save
          </button>
        </li>
        <li className="header-menu-item">
          <button
            onClick={onSaveAs}
            title={
              activeTab?.filePath
                ? `Save as a new file (${activeTab?.filePath})`
                : 'Save as a new file'
            }
          >
            Save As...
          </button>
        </li>
        {onExport && (
          <li className="header-menu-item">
            <button onClick={onExport} title="Download this prefab as a file">
              Download...
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};
