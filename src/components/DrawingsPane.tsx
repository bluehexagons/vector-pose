import {useState} from 'react';
import type {VectorDrawing, VectorPathCommand} from '../shared/types';
import type {SkeleNode} from '../utils/SkeleNode';
import {
  convertCommand,
  createCommand,
  createDefaultDrawing,
  duplicateDrawing,
  type VectorCommandType,
} from '../utils/drawingEditor';
import {NumberInput} from './NumberInput';
import './DrawingsPane.css';

interface DrawingsPaneProps {
  drawings: VectorDrawing[];
  skele: SkeleNode;
  onChange: (drawings: VectorDrawing[]) => void;
}

interface DrawingEditorProps {
  drawing: VectorDrawing;
  index: number;
  count: number;
  pointIds: string[];
  onChange: (drawing: VectorDrawing) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (offset: -1 | 1) => void;
}

const commandTypes: VectorCommandType[] = [
  'move',
  'line',
  'quadratic',
  'cubic',
  'close',
];

const clamp = (value: number | undefined, min: number, max?: number) =>
  value === undefined
    ? undefined
    : Math.min(max ?? value, Math.max(min, value));

const optionalText = (value: string) => value.trim() || undefined;

const PointInput: React.FC<{
  label: string;
  value: string;
  pointIds: Set<string>;
  onChange: (value: string) => void;
}> = ({label, value, pointIds, onChange}) => (
  <label className="command-point-field">
    <span>{label}</span>
    <input
      type="text"
      list="drawing-point-ids"
      value={value}
      className={pointIds.has(value) ? '' : 'invalid-reference'}
      title={
        pointIds.has(value) ? `Skeletal point ${value}` : 'Point not found'
      }
      onChange={event => onChange(event.target.value)}
    />
  </label>
);

const DashArrayInput: React.FC<{
  value?: number[];
  onChange: (value: number[] | undefined) => void;
}> = ({value, onChange}) => {
  const [displayValue, setDisplayValue] = useState(
    () => value?.join(', ') ?? ''
  );

  const commit = () => {
    if (!displayValue.trim()) {
      onChange(undefined);
      return;
    }

    const values = displayValue.split(/[ ,]+/).map(Number);
    if (
      values.length > 0 &&
      values.every(item => Number.isFinite(item) && item >= 0)
    ) {
      onChange(values);
    } else {
      setDisplayValue(value?.join(', ') ?? '');
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder="0.1, 0.05"
      value={displayValue}
      onChange={event => setDisplayValue(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
};

const CommandEditor: React.FC<{
  command: VectorPathCommand;
  index: number;
  count: number;
  pointIds: string[];
  onChange: (command: VectorPathCommand) => void;
  onDelete: () => void;
  onMove: (offset: -1 | 1) => void;
}> = ({command, index, count, pointIds, onChange, onDelete, onMove}) => {
  const pointIdSet = new Set(pointIds);
  const fallbackPoint = pointIds[0] ?? '';

  const updatePoint = (field: string, value: string) =>
    onChange({...command, [field]: value} as VectorPathCommand);

  return (
    <div className="drawing-command">
      <div className="command-toolbar">
        <span className="command-number">{index + 1}</span>
        <select
          aria-label={`Command ${index + 1} type`}
          value={command.type}
          onChange={event =>
            onChange(
              convertCommand(
                command,
                event.target.value as VectorCommandType,
                fallbackPoint
              )
            )
          }
        >
          {commandTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          type="button"
          title="Move command up"
          aria-label="Move command up"
          disabled={index === 0}
          onClick={() => onMove(-1)}
        >
          ↑
        </button>
        <button
          type="button"
          title="Move command down"
          aria-label="Move command down"
          disabled={index === count - 1}
          onClick={() => onMove(1)}
        >
          ↓
        </button>
        <button
          type="button"
          title="Delete command"
          aria-label="Delete command"
          disabled={count === 1}
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      {command.type !== 'close' && (
        <div className="command-points">
          {command.type === 'quadratic' && (
            <PointInput
              label="Control"
              value={command.control}
              pointIds={pointIdSet}
              onChange={value => updatePoint('control', value)}
            />
          )}
          {command.type === 'cubic' && (
            <>
              <PointInput
                label="Control 1"
                value={command.control1}
                pointIds={pointIdSet}
                onChange={value => updatePoint('control1', value)}
              />
              <PointInput
                label="Control 2"
                value={command.control2}
                pointIds={pointIdSet}
                onChange={value => updatePoint('control2', value)}
              />
            </>
          )}
          <PointInput
            label="Point"
            value={command.point}
            pointIds={pointIdSet}
            onChange={value => updatePoint('point', value)}
          />
        </div>
      )}
    </div>
  );
};

const DrawingEditor: React.FC<DrawingEditorProps> = ({
  drawing,
  index,
  count,
  pointIds,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
}) => {
  const [collapsed, setCollapsed] = useState(index !== 0);
  const [newCommandType, setNewCommandType] =
    useState<VectorCommandType>('line');

  const patch = (values: Partial<VectorDrawing>) =>
    onChange({...drawing, ...values});
  const updateCommands = (commands: VectorPathCommand[]) => patch({commands});
  const moveCommand = (commandIndex: number, offset: -1 | 1) => {
    const commands = [...drawing.commands];
    const destination = commandIndex + offset;
    [commands[commandIndex], commands[destination]] = [
      commands[destination],
      commands[commandIndex],
    ];
    updateCommands(commands);
  };

  return (
    <section className={`drawing-editor ${drawing.hidden ? 'hidden' : ''}`}>
      <div className="drawing-editor-header">
        <button
          type="button"
          className="drawing-collapse"
          aria-label={collapsed ? 'Expand drawing' : 'Collapse drawing'}
          onClick={() => setCollapsed(value => !value)}
        >
          {collapsed ? '►' : '▼'}
        </button>
        <button
          type="button"
          className="drawing-visibility"
          title={drawing.hidden ? 'Show drawing' : 'Hide drawing'}
          aria-label={drawing.hidden ? 'Show drawing' : 'Hide drawing'}
          onClick={() => patch({hidden: drawing.hidden ? undefined : true})}
        >
          {drawing.hidden ? '○' : '●'}
        </button>
        <span
          className="drawing-title"
          title={drawing.id || `Drawing ${index + 1}`}
        >
          {drawing.id || `Drawing ${index + 1}`}
        </span>
        <div className="drawing-header-actions">
          <button
            type="button"
            title="Move drawing up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            title="Move drawing down"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          <button type="button" title="Duplicate drawing" onClick={onDuplicate}>
            ⧉
          </button>
          <button type="button" title="Delete drawing" onClick={onDelete}>
            ×
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="drawing-editor-content">
          <div className="drawing-field">
            <label>ID</label>
            <input
              type="text"
              value={drawing.id ?? ''}
              placeholder={`drawing_${index + 1}`}
              onChange={event => patch({id: optionalText(event.target.value)})}
            />
          </div>
          <div className="drawing-field drawing-field-pair">
            <label>Sort</label>
            <NumberInput
              value={drawing.sort}
              allowUndefined
              onChange={sort => patch({sort})}
            />
            <label>Opacity</label>
            <NumberInput
              value={drawing.opacity}
              allowUndefined
              min={0}
              max={1}
              onChange={opacity => patch({opacity: clamp(opacity, 0, 1)})}
            />
          </div>

          <fieldset>
            <legend>Fill</legend>
            <div className="drawing-field">
              <label>Paint</label>
              <input
                type="text"
                value={drawing.fill ?? ''}
                placeholder="none or #rrggbb"
                onChange={event =>
                  patch({fill: optionalText(event.target.value)})
                }
              />
            </div>
            <div className="drawing-field drawing-field-pair">
              <label>Rule</label>
              <select
                value={drawing.fillRule ?? ''}
                onChange={event =>
                  patch({
                    fillRule:
                      (event.target.value as VectorDrawing['fillRule']) ||
                      undefined,
                  })
                }
              >
                <option value="">nonzero (default)</option>
                <option value="nonzero">nonzero</option>
                <option value="evenodd">evenodd</option>
              </select>
              <label>Opacity</label>
              <NumberInput
                value={drawing.fillOpacity}
                allowUndefined
                min={0}
                max={1}
                onChange={fillOpacity =>
                  patch({fillOpacity: clamp(fillOpacity, 0, 1)})
                }
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Stroke</legend>
            <div className="drawing-field">
              <label>Paint</label>
              <input
                type="text"
                value={drawing.stroke ?? ''}
                placeholder="none or #rrggbb"
                onChange={event =>
                  patch({stroke: optionalText(event.target.value)})
                }
              />
            </div>
            <div className="drawing-field drawing-field-pair">
              <label>Width</label>
              <NumberInput
                value={drawing.strokeWidth}
                allowUndefined
                min={0}
                onChange={strokeWidth =>
                  patch({strokeWidth: clamp(strokeWidth, 0)})
                }
              />
              <label>Opacity</label>
              <NumberInput
                value={drawing.strokeOpacity}
                allowUndefined
                min={0}
                max={1}
                onChange={strokeOpacity =>
                  patch({strokeOpacity: clamp(strokeOpacity, 0, 1)})
                }
              />
            </div>
            <div className="drawing-field drawing-field-pair">
              <label>Cap</label>
              <select
                value={drawing.strokeLinecap ?? ''}
                onChange={event =>
                  patch({
                    strokeLinecap:
                      (event.target.value as VectorDrawing['strokeLinecap']) ||
                      undefined,
                  })
                }
              >
                <option value="">butt (default)</option>
                <option value="butt">butt</option>
                <option value="round">round</option>
                <option value="square">square</option>
              </select>
              <label>Join</label>
              <select
                value={drawing.strokeLinejoin ?? ''}
                onChange={event =>
                  patch({
                    strokeLinejoin:
                      (event.target.value as VectorDrawing['strokeLinejoin']) ||
                      undefined,
                  })
                }
              >
                <option value="">miter (default)</option>
                <option value="miter">miter</option>
                <option value="round">round</option>
                <option value="bevel">bevel</option>
              </select>
            </div>
            <div className="drawing-field drawing-field-pair">
              <label>Miter</label>
              <NumberInput
                value={drawing.strokeMiterlimit}
                allowUndefined
                min={0.001}
                onChange={strokeMiterlimit =>
                  patch({strokeMiterlimit: clamp(strokeMiterlimit, 0.001)})
                }
              />
              <label>Offset</label>
              <NumberInput
                value={drawing.strokeDashoffset}
                allowUndefined
                onChange={strokeDashoffset => patch({strokeDashoffset})}
              />
            </div>
            <div className="drawing-field">
              <label>Dashes</label>
              <DashArrayInput
                key={drawing.strokeDasharray?.join(',') ?? 'empty'}
                value={drawing.strokeDasharray}
                onChange={strokeDasharray => patch({strokeDasharray})}
              />
            </div>
          </fieldset>

          <div className="commands-header">
            <h3>Path commands</h3>
            <span>{drawing.commands.length}</span>
          </div>
          <div className="drawing-commands">
            {drawing.commands.map((command, commandIndex) => (
              <CommandEditor
                key={commandIndex}
                command={command}
                index={commandIndex}
                count={drawing.commands.length}
                pointIds={pointIds}
                onChange={updated => {
                  const commands = [...drawing.commands];
                  commands[commandIndex] = updated;
                  updateCommands(commands);
                }}
                onDelete={() =>
                  updateCommands(
                    drawing.commands.filter((_, item) => item !== commandIndex)
                  )
                }
                onMove={offset => moveCommand(commandIndex, offset)}
              />
            ))}
          </div>
          <div className="add-command-row">
            <select
              aria-label="New command type"
              value={newCommandType}
              onChange={event =>
                setNewCommandType(event.target.value as VectorCommandType)
              }
            >
              {commandTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                updateCommands([
                  ...drawing.commands,
                  createCommand(newCommandType, pointIds[0] ?? ''),
                ])
              }
            >
              Add command
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export const DrawingsPane: React.FC<DrawingsPaneProps> = ({
  drawings,
  skele,
  onChange,
}) => {
  const allPointIds = Array.from(skele.walk()).map(node => node.id);
  const defaultPointIds = allPointIds.slice(1);
  const pointIds = defaultPointIds.length > 0 ? defaultPointIds : allPointIds;

  const updateDrawing = (index: number, drawing: VectorDrawing) =>
    onChange(
      drawings.map((item, itemIndex) => (itemIndex === index ? drawing : item))
    );
  const moveDrawing = (index: number, offset: -1 | 1) => {
    const reordered = [...drawings];
    const destination = index + offset;
    [reordered[index], reordered[destination]] = [
      reordered[destination],
      reordered[index],
    ];
    onChange(reordered);
  };

  return (
    <div className="drawings-pane">
      <datalist id="drawing-point-ids">
        {allPointIds.map(id => (
          <option key={id} value={id} />
        ))}
      </datalist>
      <div className="pane-header title">
        <div>
          <h2>Drawings</h2>
          <p>Paths connected to skeletal points</p>
        </div>
        <button
          type="button"
          className="add-drawing"
          title="Add drawing"
          onClick={() =>
            onChange([...drawings, createDefaultDrawing(drawings, pointIds)])
          }
        >
          +
        </button>
      </div>

      {drawings.length === 0 ? (
        <div className="drawings-empty">
          <p>No vector drawings yet.</p>
          <button
            type="button"
            onClick={() => onChange([createDefaultDrawing(drawings, pointIds)])}
          >
            Create drawing
          </button>
        </div>
      ) : (
        <div className="drawing-list">
          {drawings.map((drawing, index) => (
            <DrawingEditor
              key={index}
              drawing={drawing}
              index={index}
              count={drawings.length}
              pointIds={allPointIds}
              onChange={updated => updateDrawing(index, updated)}
              onDelete={() => {
                if (
                  window.confirm(
                    `Delete ${drawing.id || `drawing ${index + 1}`}?`
                  )
                ) {
                  onChange(drawings.filter((_, item) => item !== index));
                }
              }}
              onDuplicate={() => {
                const copy = duplicateDrawing(drawing, drawings);
                onChange([
                  ...drawings.slice(0, index + 1),
                  copy,
                  ...drawings.slice(index + 1),
                ]);
              }}
              onMove={offset => moveDrawing(index, offset)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
