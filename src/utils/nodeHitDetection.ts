import {vec2} from 'gl-matrix';
import {SkeleNode} from './SkeleNode';
import {Viewport} from '../components/EditorCanvas';

export function findClosestNode(
  worldPos: vec2,
  nodes: SkeleNode[],
  viewport: Viewport
): SkeleNode | null {
  if (!nodes.length) return null;

  // Get a size threshold based on viewport scale
  const threshold = 0.02 * vec2.len(viewport.pageToWorld(0, 1));
  let closest: SkeleNode | null = null;
  let minDist = Infinity;

  // Process nodes in reverse to prioritize top layers
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.hidden) continue;

    // For sprites, use their parent's position as hit target
    const targetNode = node.uri ? node.parent : node;
    if (!targetNode) continue;

    const worldCenter = targetNode.state.transform;
    const dist = vec2.distance(worldPos, worldCenter);

    // For sprites, use their visual size plus padding as hit area
    const hitSize = node.uri
      ? vec2.len(node.transform) + threshold * 0.5
      : threshold;

    if (dist <= hitSize && dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }

  return closest;
}
