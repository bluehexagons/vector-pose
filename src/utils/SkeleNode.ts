import {vec2} from 'gl-matrix';
import {lerpAngleRad, toDegrees, toRadians} from './Equa';
import {lerp} from '@bluehexagons/easing';
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
}

export interface RenderInfo {
  uri: string;
  center: vec2;
  transform: vec2;
  direction: number;
  props: ImagePropsRef;
  sort: number;
  node: SkeleNode;
}

const sortRenderInfo = (a: RenderInfo, b: RenderInfo) => a.sort - b.sort;

export class SkeleNode {
  id: string | null = null;
  parent: SkeleNode | null = null;
  root: SkeleNode = this;
  children: SkeleNode[] = [];
  uri: string | null = null;
  props: ImagePropsRef | null = null;
  transform: vec2 = vec2.create();
  sort = 0;
  /** Radians! */
  rotation = 0;
  mag = 1;

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

  add(node: SkeleNode) {
    if (node === this) {
      throw new Error('Cannot add node to itself');
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
    this.root.nodeLookupCache.clear();
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

    skele.uri = data.uri ?? null;
    skele.rotation = rads;
    skele.mag = mag;
    skele.id = data.id ?? null;
    skele.props = data.props ?? null;
    skele.sort = data.sort ?? 0;

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

  findId(nodeId: string): SkeleNode {
    if (this.nodeLookupCache.has(nodeId)) {
      return this.nodeLookupCache.get(nodeId)!;
    }
    for (const node of this.walk()) {
      if (node.id !== nodeId) {
        continue;
      }
      this.nodeLookupCache.set(nodeId, node);
      return node;
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
    for (const node of this.walk()) {
      if (!node.uri) continue;

      const state = node.stateAt(time);
      const size = node.mag * state.scale;

      views.push({
        uri: node.uri,
        props: propObjectDeduper(node.props),
        center: node.parent!.stateAt(time).transform,
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
  clone(parent = this.parent): SkeleNode {
    const node = new SkeleNode();

    // Copy basic properties
    node.id = this.id;
    node.uri = this.uri;
    node.mag = this.mag;
    node.rotation = this.rotation;
    node.props = this.props;
    node.sort = this.sort;
    vec2.copy(node.transform, this.transform);

    // Set up parent relationship
    node.parent = parent;
    node.root = parent?.root ?? node;

    // Clone each child with this node as parent
    for (const child of this.children) {
      const clonedChild = child.clone(node);
      node.children.push(clonedChild);
    }

    parent?.clearNodeCache();

    return node;
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
}

console.log('-- testing skelenode --');
console.log('result:', SkeleNode.test());
