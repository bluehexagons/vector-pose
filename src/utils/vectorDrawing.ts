import type {VectorDrawing, VectorPathCommand} from '../shared/types';
import type {SkeleNode} from './SkeleNode';

function commandPointIds(command: VectorPathCommand): string[] {
  switch (command.type) {
    case 'move':
    case 'line':
      return [command.point];
    case 'quadratic':
      return [command.control, command.point];
    case 'cubic':
      return [command.control1, command.control2, command.point];
    case 'close':
      return [];
  }
}

/**
 * Builds SVG path data in skeletal world units. A missing node invalidates the
 * whole drawing so a typo cannot silently connect unrelated points.
 */
export function buildVectorPath(
  drawing: VectorDrawing,
  skele: SkeleNode
): string | null {
  const pointPositions = new Map<string, readonly [number, number]>();

  for (const command of drawing.commands) {
    for (const pointId of commandPointIds(command)) {
      if (pointPositions.has(pointId)) continue;

      const node = skele.findId(pointId);
      if (!node) return null;
      pointPositions.set(pointId, [
        node.state.mid.transform[0],
        node.state.mid.transform[1],
      ]);
    }
  }

  const point = (id: string) => pointPositions.get(id)!.join(' ');

  return drawing.commands
    .map(command => {
      switch (command.type) {
        case 'move':
          return `M ${point(command.point)}`;
        case 'line':
          return `L ${point(command.point)}`;
        case 'quadratic':
          return `Q ${point(command.control)} ${point(command.point)}`;
        case 'cubic':
          return `C ${point(command.control1)} ${point(
            command.control2
          )} ${point(command.point)}`;
        case 'close':
          return 'Z';
      }
    })
    .join(' ');
}
