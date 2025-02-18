import {lerp} from '@bluehexagons/easing';
import {vec2} from 'gl-matrix';
import {lerpAngleRad, toDegrees, toRadians} from './Equa';
import type {ImagePropsRef} from './Renderer';

export interface SkeleData {
  /** Degrees */
  angle: number;
  children?: SkeleData[];
  id?: string;
  mag: number;

  uri?: string;
  props?: ImagePropsRef;
  sort?: number;
  hidden?: boolean;
}

export interface RenderInfo {
  uri: string | null;
  center: vec2;
  transform: vec2;
  direction: number;
  props: ImagePropsRef;
  sort: number;
  node: SkeleNode;
}

const sortRenderInfo = (a: RenderInfo, b: RenderInfo) => a.sort - b.sort;

export class SkeleNode {
  id: string = SkeleNode.randomLetters(); // Always initialize with an ID
  parent: SkeleNode | null = null;
  root: SkeleNode = this;
  children: SkeleNode[] = [];
  uri: string | null = null;
  props: ImagePropsRef | null = null;
  transform: vec2 = vec2.create();
  sort = 0;
  /** Radians! */
  rotation = 0;
  mag = 0;
  initialized = false;
  hidden = false;

  /** state holds mutable state data */
  state = {
    /** Radians! */
    rotation: 0,
    scale: 0,
    transform: vec2.create(),

    /** Radians! */
    lastRotation: 0,
    lastScale: 0,
    lastTransform: vec2.create(),

    mid: {
      rotation: 0,
      scale: 0,
      transform: vec2.create(),
    },
  };

  private nodeCache = new Map<string, SkeleNode>();
  private nodeCacheGeneration = 0;

  add(node: SkeleNode) {
    if (node === this) {
      throw new Error('Cannot add node to itself');
    }

    if (node.includes(this)) {
      throw new Error('Cannot add parent node to child node');
    }

    node.remove();

    node.parent = this;
    node.root = this.root;

    if (!node.id) {
      node.id = node.generateId();
    }

    this.children.push(node);

    // Update all children's root references
    for (const child of node.walk()) {
      child.root = this.root;
    }

    this.clearNodeCache();
  }

  remove() {
    if (!this.parent) return;

    const idx = this.parent.children.indexOf(this);
    if (idx !== -1) {
      this.parent.children.splice(idx, 1);
    }

    // Update root references for this node and all its children
    this.root = this;
    for (const child of this.walk()) {
      child.root = this;
    }

    this.parent.clearNodeCache();
    this.parent = null;
    this.clearNodeCache();
  }

  clearNodeCache() {
    this.nodeCache.clear();
    this.nodeCacheGeneration++;
  }

  includes(node: SkeleNode) {
    if (this === node) return true;

    for (const child of this.walk()) {
      if (child === node) {
        return true;
      }
    }
  }

  stateAt(pct: number) {
    const mid = this.state.mid;
    mid.rotation = lerpAngleRad(
      pct,
      this.state.lastRotation,
      this.state.rotation
    );
    mid.scale = lerp(pct, this.state.lastScale, this.state.scale);
    vec2.lerp(
      mid.transform,
      this.state.lastTransform,
      this.state.transform,
      pct
    );
    return mid;
  }

  static fromData(data: SkeleData): SkeleNode {
    const rads = toRadians(data.angle ?? 0);
    const mag = data.mag ?? 1;

    const skele = new SkeleNode();
    // Use provided ID or keep the auto-generated one
    if (data.id) skele.id = data.id;

    skele.uri = data.uri ?? null;
    skele.rotation = rads;
    skele.mag = mag;
    skele.props = data.props ?? null;
    skele.sort = data.sort ?? 0;
    skele.hidden = data.hidden ?? false;

    vec2.set(skele.transform, mag * Math.cos(rads), mag * Math.sin(rads));

    for (const node of data.children ?? []) {
      skele.add(SkeleNode.fromData(node));
    }

    return skele;
  }

  static randomLetters() {
    return Math.random().toString(36).slice(2, 9);
  }

  generateId() {
    let id: string;
    do {
      id = SkeleNode.randomLetters();
    } while (this.findIdFromRoot(id));
    return id;
  }

  updateTransform() {
    vec2.set(
      this.transform,
      this.mag * Math.cos(this.rotation),
      this.mag * Math.sin(this.rotation)
    );
  }

  tickMove(x: number, y: number, size: number, direction: number) {
    vec2.copy(this.state.lastTransform, this.state.transform);
    this.state.lastRotation = this.state.rotation;
    this.state.lastScale = this.state.scale;

    vec2.set(this.transform, x, y);
    this.mag = size * 2;
    this.rotation = toRadians(direction);

    this.tick();
  }

  tick() {
    if (this.parent) {
      vec2.copy(this.state.lastTransform, this.state.transform);
      this.state.lastRotation = this.state.rotation;
      this.state.lastScale = this.state.scale;

      this.state.rotation = this.parent.state.rotation + this.rotation;
      this.state.scale = this.parent.state.scale;

      vec2.set(
        this.state.transform,
        this.mag * this.state.scale * Math.cos(this.state.rotation) +
          this.parent.state.transform[0],
        this.mag * this.state.scale * Math.sin(this.state.rotation) +
          this.parent.state.transform[1]
      );
    } else {
      this.state.scale = this.mag;

      vec2.set(this.state.transform, this.transform[0], this.transform[1]);
      this.state.rotation = this.rotation;
    }

    for (const child of this.children) child.tick();
  }

  nodeLookupCache = new Map<string, SkeleNode>();

  findIdFromRoot(nodeId: string): SkeleNode {
    return this.root.findId(nodeId);
  }

  findId(nodeId: string, generation?: number): SkeleNode {
    if (generation === this.nodeCacheGeneration && this.nodeCache.has(nodeId)) {
      return this.nodeCache.get(nodeId)!;
    }

    for (const node of this.walk()) {
      if (node.id === nodeId) {
        this.nodeCache.set(nodeId, node);
        return node;
      }
    }

    return null as never;
  }

  // simple recursive walk with no guaranteed order
  *walk(): Generator<SkeleNode> {
    yield this;
    for (const node of this.children) {
      yield* node.walk();
    }
  }

  render(
    time: number,
    propObjectDeduper: (props: ImagePropsRef) => ImagePropsRef
  ): RenderInfo[] {
    const views: RenderInfo[] = [];
    this.initialized = true;
    for (const node of this.walk()) {
      const state = node.stateAt(time);
      const size = node.mag * state.scale;

      views.push({
        uri: node.uri,
        props: propObjectDeduper(node.props),
        center: node.parent?.stateAt(time).transform ?? vec2.create(),
        transform: vec2.fromValues(size, size),
        direction: toDegrees(state.rotation),
        sort: node.sort,
        node,
      });
    }
    return views.sort(sortRenderInfo);
  }

  updateState(time: number) {
    for (const node of this.walk()) {
      node.stateAt(time);
    }
  }

  // deeply clones the node recursively
  clone(parent: SkeleNode | null = null): SkeleNode {
    const node = new SkeleNode();

    // Copy basic properties
    node.id = this.id ?? SkeleNode.randomLetters();
    node.uri = this.uri;
    node.mag = this.mag;
    node.rotation = this.rotation;
    node.props = this.props;
    node.sort = this.sort;
    node.hidden = this.hidden;
    vec2.copy(node.transform, this.transform);

    // Set up parent relationship
    node.parent = parent;
    node.root = parent?.root ?? node;

    // Clone each child with this node as parent
    for (const child of this.children) {
      const clonedChild = child.clone(node);
      node.children.push(clonedChild);
    }

    return node;
  }

  /**
   * Creates a shallow clone for performance-critical operations
   * Only copies essential properties needed for state updates
   */
  shallowClone(parent: SkeleNode | null = null): SkeleNode {
    const node = new SkeleNode();
    node.id = this.id;
    node.rotation = this.rotation;
    node.mag = this.mag;
    node.parent = parent;
    node.root = parent?.root ?? node;
    // Don't clone children or other properties
    return node;
  }

  /**
   * Creates a partial clone that only includes nodes along a specified path
   * Useful for operations that only affect a small part of the tree
   */
  partialClone(targetId: string, parent: SkeleNode | null = null): SkeleNode {
    const node = new SkeleNode();
    // Copy basic properties
    node.id = this.id;
    node.uri = this.uri;
    node.mag = this.mag;
    node.rotation = this.rotation;
    node.props = this.props;
    node.sort = this.sort;
    node.hidden = this.hidden;
    vec2.copy(node.transform, this.transform);

    node.parent = parent;
    node.root = parent?.root ?? node;

    // Only clone children that are in path to target
    if (this.id === targetId) {
      // Clone all children if this is the target
      for (const child of this.children) {
        const clonedChild = child.clone(node);
        node.children.push(clonedChild);
      }
    } else {
      // Otherwise only clone children that contain the target
      for (const child of this.children) {
        if (child.findId(targetId)) {
          const clonedChild = child.partialClone(targetId, node);
          node.children.push(clonedChild);
          break;
        }
      }
    }

    return node;
  }

  toData(): SkeleData {
    return {
      angle: toDegrees(this.rotation),
      mag: this.mag,
      id: this.id || undefined,
      uri: this.uri || undefined,
      props: this.props || undefined,
      sort: this.sort || undefined,
      hidden: this.hidden || undefined,
      children:
        this.children.length > 0
          ? this.children.map(child => child.toData())
          : undefined,
    };
  }

  // Add custom JSON serialization
  toJSON() {
    return this.toData();
  }

  updateFromWorldPosition(worldX: number, worldY: number) {
    if (!this.parent) return;

    const parent = this.parent.state;
    const parentX = parent.transform[0];
    const parentY = parent.transform[1];

    // Calculate relative position
    const relX = worldX - parentX;
    const relY = worldY - parentY;

    // Update angle and magnitude
    this.rotation = Math.atan2(relY, relX) - parent.rotation;
    this.mag = Math.sqrt(relX * relX + relY * relY) * 0.5;
    this.updateTransform();
  }

  updateFromChildTarget(childWorldX: number, childWorldY: number) {
    if (!this.parent) return;

    // Get parent's world position
    const parentState = this.parent;
    const parentX = parentState.transform[0];
    const parentY = parentState.transform[1];

    // Calculate relative position from parent to desired child position
    const relX = childWorldX - parentX;
    const relY = childWorldY - parentY;

    // Update parent's angle and magnitude to reach the child position
    this.parent.rotation = Math.atan2(relY, relX);
    this.parent.mag = Math.sqrt(relX * relX + relY * relY) * 0.5;
    this.parent.updateTransform();
  }

  /** Gets the effective node to move - for sprites, returns their parent */
  getMovableNode(): SkeleNode {
    return this.uri ? this.parent : this;
  }

  /**
   * Tests if a world position is within this node's hit area
   * Sprites get a larger hit area based on their transform size
   */
  hitTest(worldX: number, worldY: number, minSize: number): number | null {
    if (this.hidden) return null;

    const pos = this.getMovableNode().state.transform;
    const dist = vec2.dist(pos, [worldX, worldY]);

    // For sprites, use their visual size plus padding
    const hitSize = this.uri
      ? Math.sqrt(vec2.dot(this.transform, this.transform)) + minSize * 0.5
      : minSize;

    // Return distance if within bounds, null if outside
    return dist <= hitSize ? dist : null;
  }

  /**
   * Finds closest node to a world position, prioritizing top layers
   */
  findClosestNode(
    worldX: number,
    worldY: number,
    minSize: number
  ): SkeleNode | null {
    // Walk nodes in reverse for top-to-bottom layer order
    const nodes = Array.from(this.walk()).slice(1).reverse();
    let closest: {node: SkeleNode; distance: number} | null = null;

    for (const node of nodes) {
      const dist = node.hitTest(worldX, worldY, minSize);
      if (dist === null) continue;

      // Update if this is the first hit or closer than previous
      if (!closest || dist < closest.distance) {
        closest = {node, distance: dist};
      }
    }

    return closest?.node ?? null;
  }

  static test() {
    const testData: SkeleData = {
      angle: 45,
      mag: 5,
      children: [
        {
          angle: 45,
          mag: 20,
        },
        {
          angle: -45,
          mag: 10,
          children: [
            {
              angle: 45,
              mag: 10,
              uri: 'gfx/weapon_icons/no_icon.png',
            },
          ],
        },
      ],
    };

    const out = SkeleNode.fromData(testData);
    out.tickMove(100, 100, 10, 0);
    console.log(out);
    console.log(out.render(1, props => props));
    console.log('walking');
    for (const node of out.walk()) {
      console.log(node);
    }
    return out;
  }

  /**
   * Adjusts sprite rotation relative to its parent
   */
  rotateSprite(deltaAngleRad: number) {
    if (!this.parent) return;
    this.rotation += deltaAngleRad;
    this.updateTransform();
  }

  /**
   * Adjusts sprite scale by multiplying current magnitude
   */
  scaleSprite(factor: number) {
    if (!this.parent) return;
    this.mag = Math.max(0.01, this.mag * factor);
    this.updateTransform();
  }

  /**
   * Gets the world-space center position of this node
   */
  getWorldCenter(): vec2 {
    if (!this.parent) return vec2.clone(this.state.transform);
    return vec2.clone(this.parent.state.transform);
  }
}

// console.log('-- testing skelenode --');
// console.log('result:', SkeleNode.test());
