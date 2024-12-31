import {vec2} from 'gl-matrix';
import {createSignal, For, Ref} from 'solid-js';
import './App.css';
import logo from './assets/logo.svg';
import {toDegrees, toRadians} from './utils/Equa';
import {RenderInfo, SkeleNode} from './utils/SkeleNode';
import {resolveResource} from '@tauri-apps/api/path';
import {exists, BaseDirectory} from '@tauri-apps/plugin-fs';

const preventDefault = (e: Event) => {
  // e.preventDefault();
};

interface UiNode {
  node: RenderInfo;
}

resolveResource('test').then(async resPath => {
  console.log(resPath);
  console.log(await exists(resPath));
});
// const home = await readTextFile(resPath);

// temp
function App() {
  // const [greetMsg, setGreetMsg] = createSignal('');
  // const [name, setName] = createSignal('');

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  //   setGreetMsg(await invoke("greet", { name: name() }));
  // }

  let spriteHolder: HTMLDivElement | undefined;

  const [skele, setSkele] = createSignal<SkeleNode>(new SkeleNode());

  const [size, setSize] = createSignal(100);
  const [rotation, setRotation] = createSignal(270);

  const time = 1;

  const [dragStart, setDragStart] = createSignal<vec2>();

  const [cameraPosition, setCameraPosition] = createSignal(
    vec2.fromValues(300, 500)
  );

  const [renderedNodes, setRenderedNodes] = createSignal<SkeleNode[]>([]);
  const [renderedInfo, setRenderedInfo] = createSignal<RenderInfo[]>([]);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(cameraPosition()[0], cameraPosition()[1], size(), rotation());

    setSkele(base);
    skele().updateState(time);
    setRenderedInfo(skele().render(1, props => props));
    setRenderedNodes(Array.from(base.walk()).slice(1));

    console.log('ticked skele', skele());
  };

  const [currentFiles, setCurrentFiles] = createSignal([] as string[]);

  const pushCurrentFiles = () => {
    const base = skele().clone();
    for (const f of currentFiles()) {
      base.add(
        SkeleNode.fromData({
          angle: 0,
          mag: 1,
          uri: f,
        })
      );
    }

    updateSkele(base);
  };

  const renderUris = async (skele: SkeleNode) => {
    for (const node of skele.walk()) {
      if (node.uri?.startsWith('sprite:')) {
        node.uri = `./data/gfx/sprite/${node.uri.slice(7).replace('Still', 'Strawberry-001a_Still')}.PNG`;
      }
    }
    return skele;
  };

  // insert some test data
  (async () => {
    updateSkele(await renderUris(SkeleNode.fromData({angle: 0, mag: 1})));
  })();

  const [lastActiveNode, setLastActiveNode] = createSignal<
    RenderInfo | undefined
  >(undefined);

  const [activeNode, setActiveNode] = createSignal<RenderInfo | undefined>(
    undefined
  );

  const dragOverSprite = (e: MouseEvent) => {
    const node = activeNode();
    // console.log('sprite over', e);
    if (!node) {
      return;
    }

    e.preventDefault();
    // const originalNode = node.node;
  };

  const dropSprite = (e: MouseEvent) => {
    const {pageX, pageY} = e;

    const node = activeNode();
    const startPos = dragStart();

    console.log('sprite drop', node);

    if (startPos && node) {
      console.log(vec2.sub(vec2.create(), [pageX, pageY], startPos));

      const newSkele = skele();

      node.node.mag *= 1.5;

      updateSkele(newSkele.clone());

      // setLastActiveNode(newSkele.find[]);
    } else {
      setLastActiveNode(undefined);
    }

    setActiveNode(undefined);
  };

  const makeBlobUrl = async (file: File) => {
    const blob = new Blob([await file.arrayBuffer()], {
      type: file.type,
    });
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  };

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();

    let closestNode: RenderInfo | undefined = undefined;
    let closestDistance = Infinity;
    const {pageX, pageY} = e;

    for (const node of renderedInfo()) {
      const dist = vec2.dist(
        vec2.add(vec2.create(), node.center, [
          spriteHolder?.offsetLeft || 0,
          spriteHolder?.offsetTop || 0,
        ]),
        [pageX, pageY]
      );
      if (
        dist < Math.sqrt(vec2.dot(node.transform, node.transform)) &&
        dist < closestDistance
      ) {
        closestNode = node;
        closestDistance = dist;
      }
    }

    if (closestNode) {
      const node = closestNode;
      console.log(node);
      setActiveNode(node);
      setDragStart(vec2.fromValues(pageX, pageY));
    }
  };

  return (
    <div
      class="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
      onMouseUp={dropSprite}
      onMouseMove={dragOverSprite}
      onMouseDown={handleMouseDown}
    >
      <h1 class="page-title">vector-pose</h1>

      <div class="editor-pane">
        <div class="editor-window">
          <div class="sprite-holder" ref={spriteHolder}>
            <For each={renderedInfo()} fallback={<div>...</div>}>
              {node => (
                <div
                  classList={{
                    active: node.node === activeNode()?.node,
                  }}
                  style={{
                    left: `${node.center[0]}px`,
                    top: `${node.center[1]}px`,
                    width: `${node.transform[0] * 2}px`,
                    height: `${node.transform[1] * 2}px`,
                    transform: `translate(-50%, -50%) rotate(${node.direction + 90}deg)`,
                  }}
                >
                  <img src={node.uri} />
                </div>
              )}
            </For>
          </div>
          <div class="node-graph">
            <For each={renderedNodes()}>
              {(node, index) => (
                <div
                  classList={{
                    active: node === activeNode()?.node,
                  }}
                  style={{
                    left: `${node.state.mid.transform[0]}px`,
                    top: `${node.state.mid.transform[1]}px`,
                  }}
                >
                  {node.id ? node.id : `node #${index() + 1}`}
                </div>
              )}
            </For>
          </div>
        </div>
      </div>

      <div class="layers-pane">
        <h2 class="title">nodes</h2>
        <ol class="node-tree">
          <For each={renderedNodes()}>
            {(node, index) => (
              <div
                classList={{
                  active: node === activeNode()?.node,
                }}
              >
                <div>
                  node #{index() + 1}
                  {node.id ? ` (${node.id})` : ''}
                </div>
                <div>
                  angle=
                  <input
                    value={toDegrees(node.rotation)}
                    onChange={evt => {
                      console.log('angle', evt.target.value);
                      node.rotation = toRadians(
                        parseFloat(evt.target.value) || 0
                      );
                      node.updateTransform();
                      updateSkele(skele().clone());
                    }}
                  />
                  &nbsp; mag=
                  <input
                    value={node.mag}
                    onChange={evt => {
                      console.log('mag', evt.target.value);
                      node.mag = parseFloat(evt.target.value) || 0;
                      node.updateTransform();
                      updateSkele(skele().clone());
                    }}
                  />
                </div>
                <div>
                  uri=
                  <input
                    value={node.uri || ''}
                    onChange={evt => {
                      console.log('uri', evt.target.value);
                      node.uri = evt.target.value || null;
                      updateSkele(skele().clone());
                    }}
                  />
                </div>
              </div>
            )}
          </For>
        </ol>
        <div class="row">
          <input
            type="file"
            onChange={async e => {
              console.log(e);
              if (!e.target.files) return;

              const imageUris: string[] = [];

              for (const file of e.target.files) {
                const blobUrl = await makeBlobUrl(file);
                imageUris.push(blobUrl);
              }

              setCurrentFiles(imageUris);
              pushCurrentFiles();
            }}
            multiple
          />
          <button onClick={pushCurrentFiles}>+</button>
        </div>
      </div>

      <footer class="footer">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" class="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" class="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://solidjs.com" target="_blank">
          <img src={logo} class="logo solid" alt="Solid logo" />
        </a>
      </footer>
    </div>
  );
}

export default App;
