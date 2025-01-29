import {vec2} from 'gl-matrix';
import {SkeleNode} from './SkeleNode';
import {Viewport} from '../components/EditorCanvas';

export function isPointNearNode(
  point: vec2,
  node: SkeleNode,
  viewport: Viewport
): boolean {
  const worldCenter = node.getWorldCenter();
  const dist = vec2.distance(point, worldCenter);
  return dist < 0.02 * vec2.len(viewport.pageToWorld(0, 1));
}

export function findClosestNode(
  worldPos: vec2,
  nodes: SkeleNode[],
  viewport: Viewport
): SkeleNode | null {
  if (!nodes.length) return null;

  const threshold = 0.02 * vec2.len(viewport.pageToWorld(0, 1));
  let closest: SkeleNode | null = null;
  let minDist = Infinity;

  for (const node of nodes) {
    const worldCenter = node.getWorldCenter();
    const dist = vec2.distance(worldPos, worldCenter);
    if (dist < threshold && dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }

  return closest;
}
