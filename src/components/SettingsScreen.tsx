import type {SidebarPane} from './RightSidebar';
import './SettingsScreen.css';

export type NodeLabelMode = 'selected' | 'markers' | 'all';

const zoomOptions = [0.5, 0.75, 0.9, 1, 1.25, 1.5];

export const SettingsScreen = ({
  browserWorkspace,
  showOnStartup,
  defaultCanvasZoom,
  showCanvasGrid,
  showCanvasNavigationHint,
  nodeLabelMode,
  inspectorPane,
  onShowOnStartupChange,
  onDefaultCanvasZoomChange,
  onShowCanvasGridChange,
  onShowCanvasNavigationHintChange,
  onNodeLabelModeChange,
  onInspectorPaneChange,
  onResetInterface,
  onClearBrowserData,
  onClose,
}: {
  browserWorkspace: boolean;
  showOnStartup: boolean;
  defaultCanvasZoom: number;
  showCanvasGrid: boolean;
  showCanvasNavigationHint: boolean;
  nodeLabelMode: NodeLabelMode;
  inspectorPane: SidebarPane;
  onShowOnStartupChange: (show: boolean) => void;
  onDefaultCanvasZoomChange: (zoom: number) => void;
  onShowCanvasGridChange: (show: boolean) => void;
  onShowCanvasNavigationHintChange: (show: boolean) => void;
  onNodeLabelModeChange: (mode: NodeLabelMode) => void;
  onInspectorPaneChange: (pane: SidebarPane) => void;
  onResetInterface: () => void;
  onClearBrowserData: () => void;
  onClose: () => void;
}) => (
  <div className="settings-backdrop" role="presentation">
    <main
      className="settings-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <header className="settings-header">
        <div>
          <p>VECTOR-POSE</p>
          <h1 id="settings-title">Settings</h1>
          <span>Adjust the editor to fit the way you work.</span>
        </div>
        <button
          type="button"
          className="settings-close"
          onClick={onClose}
          aria-label="Close settings"
          title="Close settings"
        >
          ×
        </button>
      </header>

      <div className="settings-content">
        <section
          className="settings-section"
          aria-labelledby="general-settings"
        >
          <div className="settings-section-heading">
            <span aria-hidden="true">◇</span>
            <div>
              <h2 id="general-settings">General</h2>
              <p>Choose what the editor shows when you begin.</p>
            </div>
          </div>

          <label className="settings-row settings-toggle-row">
            <span className="settings-copy">
              <strong>Welcome screen on startup</strong>
              <small>Show project shortcuts, instructions, and examples.</small>
            </span>
            <input
              type="checkbox"
              checked={showOnStartup}
              onChange={event => onShowOnStartupChange(event.target.checked)}
            />
          </label>

          <label className="settings-row">
            <span className="settings-copy">
              <strong>Inspector panel</strong>
              <small>Choose the editor shown in the right sidebar.</small>
            </span>
            <select
              value={inspectorPane}
              onChange={event =>
                onInspectorPaneChange(event.target.value as SidebarPane)
              }
            >
              <option value="nodes">Nodes</option>
              <option value="drawings">Drawings</option>
            </select>
          </label>
        </section>

        <section className="settings-section" aria-labelledby="canvas-settings">
          <div className="settings-section-heading">
            <span aria-hidden="true">⌗</span>
            <div>
              <h2 id="canvas-settings">Canvas</h2>
              <p>Control framing and visual guidance around your artwork.</p>
            </div>
          </div>

          <label className="settings-row">
            <span className="settings-copy">
              <strong>Default zoom</strong>
              <small>Also used by Reset view and the 0 shortcut.</small>
            </span>
            <select
              value={defaultCanvasZoom}
              onChange={event =>
                onDefaultCanvasZoomChange(Number(event.target.value))
              }
            >
              {zoomOptions.map(zoom => (
                <option key={zoom} value={zoom}>
                  {Math.round(zoom * 100)}%
                </option>
              ))}
            </select>
          </label>

          <label className="settings-row">
            <span className="settings-copy">
              <strong>Node annotations</strong>
              <small>Balance point visibility against canvas clutter.</small>
            </span>
            <select
              value={nodeLabelMode}
              onChange={event =>
                onNodeLabelModeChange(event.target.value as NodeLabelMode)
              }
            >
              <option value="selected">Selected names</option>
              <option value="markers">Markers only</option>
              <option value="all">All names</option>
            </select>
          </label>

          <label className="settings-row settings-toggle-row">
            <span className="settings-copy">
              <strong>Canvas grid</strong>
              <small>Show the background grid while editing.</small>
            </span>
            <input
              type="checkbox"
              checked={showCanvasGrid}
              onChange={event => onShowCanvasGridChange(event.target.checked)}
            />
          </label>

          <label className="settings-row settings-toggle-row">
            <span className="settings-copy">
              <strong>Navigation tip</strong>
              <small>Show wheel-zoom and middle-drag guidance.</small>
            </span>
            <input
              type="checkbox"
              checked={showCanvasNavigationHint}
              onChange={event =>
                onShowCanvasNavigationHintChange(event.target.checked)
              }
            />
          </label>
        </section>

        <section
          className="settings-section"
          aria-labelledby="workspace-settings"
        >
          <div className="settings-section-heading">
            <span aria-hidden="true">⌑</span>
            <div>
              <h2 id="workspace-settings">Workspace</h2>
              <p>Restore interface defaults or manage browser storage.</p>
            </div>
          </div>

          <div className="settings-action-row">
            <span className="settings-copy">
              <strong>Reset interface</strong>
              <small>
                Restore preferences and panel widths to their defaults.
              </small>
            </span>
            <button type="button" onClick={onResetInterface}>
              Reset interface
            </button>
          </div>

          {browserWorkspace && (
            <div className="settings-action-row settings-danger-row">
              <span className="settings-copy">
                <strong>Clear browser data</strong>
                <small>
                  Remove saved and imported files, then restore bundled
                  examples.
                </small>
              </span>
              <button
                type="button"
                className="settings-danger-button"
                onClick={onClearBrowserData}
              >
                Clear data…
              </button>
            </div>
          )}
        </section>
      </div>

      <footer className="settings-footer">
        <span>Changes are saved automatically.</span>
        <button type="button" onClick={onClose}>
          Done
        </button>
      </footer>
    </main>
  </div>
);
