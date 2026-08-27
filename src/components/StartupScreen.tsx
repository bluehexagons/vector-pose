import {DialogFocus} from './DialogFocus';
import './StartupScreen.css';

export type StarterExampleId =
  | 'shape-studies'
  | 'gesture-figure'
  | 'robot-puppet'
  | 'winding-rules'
  | 'nested-motion';

interface StarterExample {
  id: StarterExampleId;
  title: string;
  description: string;
  preview: React.ReactNode;
}

const examples: StarterExample[] = [
  {
    id: 'shape-studies',
    title: 'Shape studies',
    description: 'Lines, curves, a star, a soft blob, and layered geometry.',
    preview: (
      <svg viewBox="0 0 180 96" aria-hidden="true">
        <rect x="0" y="0" width="180" height="96" fill="#1f2b3f" />
        <path d="M25 69 38 25l13 44Z" fill="#5fd1c8" />
        <path
          d="m89 20 8 18 20 2-15 13 5 20-18-10-18 10 5-20-15-13 20-2Z"
          fill="#ffc857"
        />
        <path
          d="M136 28c19-11 32 4 23 17 13 11 2 29-14 21-11 15-30 2-21-13-14-11-1-31 12-25Z"
          fill="#ef6f91"
        />
        <path
          d="M137 44v3m12-3v3m-13 6q7 7 14 0"
          fill="none"
          stroke="#6b2640"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </svg>
    ),
  },
  {
    id: 'gesture-figure',
    title: 'Gesture figure',
    description: 'A clean character skeleton for learning joints and posing.',
    preview: (
      <svg viewBox="0 0 180 96" aria-hidden="true">
        <rect width="180" height="96" fill="#24283a" />
        <g fill="none" stroke="#a7b7ff" strokeLinecap="round" strokeWidth="5">
          <circle cx="90" cy="20" r="11" fill="#ffcf70" stroke="none" />
          <path d="M90 32v29M90 40 67 53 52 41M90 40l24 13 15-13M90 60 74 81M90 60l17 21" />
        </g>
        <path
          d="M86 18v2m8-2v2m-8 4q4 4 8 0"
          fill="none"
          stroke="#785123"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
        <g fill="#fff" opacity=".75">
          <circle cx="90" cy="40" r="3" />
          <circle cx="67" cy="53" r="3" />
          <circle cx="114" cy="53" r="3" />
          <circle cx="90" cy="60" r="3" />
        </g>
      </svg>
    ),
  },
  {
    id: 'robot-puppet',
    title: 'Robot puppet',
    description: 'A layered character built from vector parts and a pose rig.',
    preview: (
      <svg viewBox="0 0 180 96" aria-hidden="true">
        <rect width="180" height="96" fill="#172f35" />
        <g stroke="#183d47" strokeWidth="3">
          <path d="M90 15V7m-5 0h10" fill="none" />
          <rect x="73" y="15" width="34" height="25" rx="8" fill="#76d4c6" />
          <path d="M67 42h46l-5 32H72Z" fill="#4ca8b8" />
          <path d="m68 48-20 16 8 8 16-12M112 48l20 16-8 8-16-12" fill="none" />
          <path d="m82 73-7 18M99 73l7 18" />
          <path d="m48 64-6-4m6 4-6 4m90-4 6-4m-6 4 6 4" fill="none" />
        </g>
        <circle cx="83" cy="27" r="3" fill="#15343a" />
        <circle cx="97" cy="27" r="3" fill="#15343a" />
      </svg>
    ),
  },
  {
    id: 'winding-rules',
    title: 'Winding lab',
    description:
      'Compare contour direction, nonzero, even-odd, caps, and joins.',
    preview: (
      <svg viewBox="0 0 180 96" aria-hidden="true">
        <rect width="180" height="96" fill="#302a3d" />
        <path
          d="M18 20h58v58H18Zm17 17v24h24V37Z"
          fill="#55d39c"
          fillRule="evenodd"
        />
        <path
          d="M104 20h58v58h-58Zm17 17h24v24h-24Z"
          fill="#9b7cff"
          fillRule="nonzero"
        />
        <path d="M87 20v58" stroke="#ffcb69" strokeDasharray="5 5" />
      </svg>
    ),
  },
  {
    id: 'nested-motion',
    title: 'Nested motion',
    description: 'Explore a plant rig with joint-owned Bézier controls.',
    preview: (
      <svg viewBox="0 0 180 96" aria-hidden="true">
        <rect width="180" height="96" fill="#213127" />
        <path
          d="M76 91C72 67 89 60 88 39c-1-11 7-18 17-25"
          fill="none"
          stroke="#55b56e"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path d="M84 58c15-16 30-11 32 5-12 7-24 5-32-5Z" fill="#76d88a" />
        <path
          d="m106 8 7 9 11-2-2 11 8 7-10 5-1 11-10-5-10 5-1-11-10-5 8-7-2-11 11 2Z"
          fill="#ffc857"
        />
      </svg>
    ),
  },
];

export const StartupScreen = ({
  browserWorkspace,
  showOnStartup,
  onShowOnStartupChange,
  onNewProject,
  onOpenFiles,
  onChooseWorkspace,
  onOpenExample,
  onClose,
}: {
  browserWorkspace: boolean;
  showOnStartup: boolean;
  onShowOnStartupChange: (show: boolean) => void;
  onNewProject: () => void;
  onOpenFiles: () => void;
  onChooseWorkspace: () => void;
  onOpenExample: (id: StarterExampleId) => void;
  onClose: () => void;
}) => (
  <div className="startup-backdrop" role="presentation">
    <DialogFocus className="startup-screen" labelledBy="startup-title">
      <header className="startup-hero">
        <div className="startup-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="startup-eyebrow">VECTOR-BASED CHARACTER RIGGING</p>
          <h1 id="startup-title">Welcome to vector-pose</h1>
          <p>
            Build drawings from skeletal points, then pose the rig to reshape
            the artwork.
          </p>
        </div>
        <button
          className="startup-close"
          onClick={onClose}
          aria-label="Close welcome screen"
          title="Close welcome screen"
        >
          ×
        </button>
      </header>

      <div className="startup-body">
        <section className="startup-actions" aria-labelledby="start-heading">
          <h2 id="start-heading">Start</h2>
          <button
            className="startup-primary-action"
            onClick={onNewProject}
            data-dialog-autofocus
          >
            <span className="startup-action-icon">＋</span>
            <span>
              <strong>New project</strong>
              <small>Begin with a root and one movable point</small>
            </span>
            <kbd>Ctrl N</kbd>
          </button>
          <button className="startup-action" onClick={onOpenFiles}>
            <span className="startup-action-icon">↗</span>
            <span>
              <strong>
                {browserWorkspace ? 'Import files' : 'Open files'}
              </strong>
              <small>Open a .fab.json project or add artwork</small>
            </span>
          </button>
          {!browserWorkspace && (
            <button className="startup-action" onClick={onChooseWorkspace}>
              <span className="startup-action-icon">⌑</span>
              <span>
                <strong>Choose workspace</strong>
                <small>Load a game folder with data/fabs and gfx</small>
              </span>
            </button>
          )}

          <div className="startup-quick-guide">
            <h2>First steps</h2>
            <ol>
              <li>
                <span>1</span>
                <p>
                  <strong>Add points</strong> with C or the + button.
                </p>
              </li>
              <li>
                <span>2</span>
                <p>
                  <strong>Connect a drawing</strong> in the Drawings tab.
                </p>
              </li>
              <li>
                <span>3</span>
                <p>
                  <strong>Drag joints</strong> on the canvas to pose it.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section
          className="startup-examples"
          aria-labelledby="examples-heading"
        >
          <div className="startup-section-heading">
            <div>
              <h2 id="examples-heading">Explore examples</h2>
              <p>Open a project, select its joints, and see how it is built.</p>
            </div>
          </div>
          <div className="startup-example-grid">
            {examples.map(example => (
              <button
                key={example.id}
                className="startup-example-card"
                onClick={() => onOpenExample(example.id)}
              >
                <span className="startup-example-preview">
                  {example.preview}
                </span>
                <span className="startup-example-copy">
                  <strong>{example.title}</strong>
                  <small>{example.description}</small>
                </span>
                <span className="startup-open-label">Open →</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="startup-footer">
        <label>
          <input
            type="checkbox"
            checked={showOnStartup}
            onChange={event => onShowOnStartupChange(event.target.checked)}
          />
          Show this screen on startup
        </label>
        <span>Tip: reopen it any time with the Welcome button.</span>
      </footer>
    </DialogFocus>
  </div>
);
