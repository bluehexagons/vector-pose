import type {VectorDrawing, VectorPathCommand} from '../shared/types';

export type VectorCommandType = VectorPathCommand['type'];

function uniqueId(base: string, drawings: VectorDrawing[]): string {
  const used = new Set(drawings.map(drawing => drawing.id).filter(Boolean));
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}_${suffix}`)) suffix++;
  return `${base}_${suffix}`;
}

export function createDefaultDrawing(
  drawings: VectorDrawing[],
  pointIds: string[]
): VectorDrawing {
  const fallback = pointIds[0] ?? '';
  const commands: VectorPathCommand[] = [{type: 'move', point: fallback}];

  if (pointIds[1]) commands.push({type: 'line', point: pointIds[1]});
  if (pointIds[2]) {
    commands.push({type: 'line', point: pointIds[2]}, {type: 'close'});
  }

  return {
    id: uniqueId('drawing', drawings),
    fill: '#7c6cff',
    stroke: '#29224f',
    strokeWidth: 0.025,
    commands,
  };
}

export function duplicateDrawing(
  drawing: VectorDrawing,
  drawings: VectorDrawing[]
): VectorDrawing {
  return {
    ...drawing,
    id: uniqueId(`${drawing.id || 'drawing'}_copy`, drawings),
    commands: drawing.commands.map(command => ({...command})),
  };
}

export function convertCommand(
  command: VectorPathCommand,
  type: VectorCommandType,
  fallbackPoint: string
): VectorPathCommand {
  if (command.type === type) return command;

  const point = 'point' in command ? command.point : fallbackPoint;
  const firstControl =
    command.type === 'quadratic'
      ? command.control
      : command.type === 'cubic'
        ? command.control1
        : fallbackPoint;

  switch (type) {
    case 'move':
    case 'line':
      return {type, point};
    case 'quadratic':
      return {type, control: firstControl, point};
    case 'cubic':
      return {
        type,
        control1: firstControl,
        control2: command.type === 'cubic' ? command.control2 : fallbackPoint,
        point,
      };
    case 'close':
      return {type};
  }
}

export function createCommand(
  type: VectorCommandType,
  fallbackPoint: string
): VectorPathCommand {
  return convertCommand(
    {type: 'move', point: fallbackPoint},
    type,
    fallbackPoint
  );
}
