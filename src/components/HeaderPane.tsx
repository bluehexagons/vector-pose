import {TabData} from '../shared/types';
import {HistoryEntry} from '../utils/HistoryManager';
import {SkeleNode} from '../utils/SkeleNode';
import './HeaderPane.css';
import {HistoryDropdown} from './HistoryDropdown';

export const HeaderPane = ({
  activeTab,
  onSave,
  onSaveAs,
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
}: {
  activeTab?: TabData;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
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
}) => {
  return (
    <div className="header-pane">
      <div className="header-left">
        <h1 className="header-title">
          Name:
          {activeTab && (
            <input
              type="text"
              className="tab-name-input"
              style={{marginLeft: 'var(--spacing-xs)'}}
              value={activeTab.name}
              onChange={e => onNameChange(e.target.value)}
              title="Set name of file"
            />
          )}
          {activeTab?.isModified && (
            <span
              style={{
                paddingLeft: 'var(--spacing-xs)',
                display: 'inline-block',
                width: '42px',
                textAlign: 'left',
                cursor: 'default',
                fontStyle: 'italic',
                color: 'var(--text-muted)',
              }}
              title="This object has been modified."
            >
              (modified)
            </span>
          )}
        </h1>
      </div>
      <ul className="header-menu">
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
      </ul>
    </div>
  );
};
