import type {SidebarPane} from './RightSidebar';
import {DialogFocus} from './DialogFocus';
import './SettingsScreen.css';

export type NodeLabelMode = 'selected' | 'markers' | 'all';
export type ImageRenderingMode = 'smooth' | 'pixelated';

const zoomOptions = [0.5, 0.75, 0.9, 1, 1.25, 1.5];

export const SettingsScreen = ({
  browserWorkspace,
  showOnStartup,
  defaultCanvasZoom,
  showCanvasGrid,
  showCanvasNavigationHint,
  nodeLabelMode,
  imageRenderingMode,
  inspectorPane,
  gameDirectory,
  reopenLastWorkspace,
  warnBeforeClosing,
  onShowOnStartupChange,
  onDefaultCanvasZoomChange,
  onShowCanvasGridChange,
  onShowCanvasNavigationHintChange,
  onNodeLabelModeChange,
  onImageRenderingModeChange,
  onInspectorPaneChange,
  onReopenLastWorkspaceChange,
  onWarnBeforeClosingChange,
  onChooseWorkspace,
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
  imageRenderingMode: ImageRenderingMode;
  inspectorPane: SidebarPane;
  gameDirectory: string;
  reopenLastWorkspace: boolean;
  warnBeforeClosing: boolean;
  onShowOnStartupChange: (show: boolean) => void;
  onDefaultCanvasZoomChange: (zoom: number) => void;
  onShowCanvasGridChange: (show: boolean) => void;
  onShowCanvasNavigationHintChange: (show: boolean) => void;
  onNodeLabelModeChange: (mode: NodeLabelMode) => void;
  onImageRenderingModeChange: (mode: ImageRenderingMode) => void;
  onInspectorPaneChange: (pane: SidebarPane) => void;
  onReopenLastWorkspaceChange: (reopen: boolean) => void;
  onWarnBeforeClosingChange: (warn: boolean) => void;
  onChooseWorkspace: () => void;
  onResetInterface: () => void;
  onClearBrowserData: () => void;
  onClose: () => void;
}) => (
  <div className="settings-backdrop" role="presentation">
    <DialogFocus className="settings-screen" labelledBy="settings-title">
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
          data-dialog-autofocus
        >
          ×
        </button>
      </header>

      <div
        className={`settings-content ${
          browserWorkspace ? 'browser-settings' : 'desktop-settings'
        }`}
      >
        <section
          className="settings-section settings-general-section"
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

        <section
          className="settings-section settings-canvas-section"
          aria-labelledby="canvas-settings"
        >
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

          <label className="settings-row">
            <span className="settings-copy">
              <strong>Image scaling</strong>
              <small>Choose smooth artwork or crisp pixel-art edges.</small>
            </span>
            <select
              value={imageRenderingMode}
              onChange={event =>
                onImageRenderingModeChange(
                  event.target.value as ImageRenderingMode
                )
              }
            >
              <option value="smooth">Smooth</option>
              <option value="pixelated">Pixelated</option>
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

        {!browserWorkspace && (
          <section
            className="settings-section settings-desktop-section"
            aria-labelledby="desktop-settings"
          >
            <div className="settings-section-heading">
              <span aria-hidden="true">▣</span>
              <div>
                <h2 id="desktop-settings">Desktop app</h2>
                <p>Control local-project behavior in Electron.</p>
              </div>
            </div>

            <div className="settings-action-row">
              <span className="settings-copy settings-path-copy">
                <strong>Game workspace</strong>
                <small title={gameDirectory}>
                  {gameDirectory || 'No workspace selected'}
                </small>
              </span>
              <button type="button" onClick={onChooseWorkspace}>
                Choose…
              </button>
            </div>

            <label className="settings-row settings-toggle-row">
              <span className="settings-copy">
                <strong>Reopen last workspace</strong>
                <small>Load the selected game directory on next launch.</small>
              </span>
              <input
                type="checkbox"
                checked={reopenLastWorkspace}
                onChange={event =>
                  onReopenLastWorkspaceChange(event.target.checked)
                }
              />
            </label>

            <label className="settings-row settings-toggle-row">
              <span className="settings-copy">
                <strong>Warn before closing</strong>
                <small>Protect unsaved changes when exiting the app.</small>
              </span>
              <input
                type="checkbox"
                checked={warnBeforeClosing}
                onChange={event =>
                  onWarnBeforeClosingChange(event.target.checked)
                }
              />
            </label>
          </section>
        )}

        <section
          className="settings-section settings-workspace-section"
          aria-labelledby="workspace-settings"
        >
          <div className="settings-section-heading">
            <span aria-hidden="true">⌑</span>
            <div>
              <h2 id="workspace-settings">Workspace</h2>
              <p>Restore all preferences or manage browser storage.</p>
            </div>
          </div>

          <div className="settings-action-row">
            <span className="settings-copy">
              <strong>Restore defaults</strong>
              <small>
                Reset preferences and panel widths to their original values.
              </small>
            </span>
            <button type="button" onClick={onResetInterface}>
              Restore defaults
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
    </DialogFocus>
  </div>
);
