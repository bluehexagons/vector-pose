import {vec2} from 'gl-matrix';
import {createSignal, For} from 'solid-js';
import './App.css';
import logo from './assets/logo.svg';
import {toDegrees, toRadians} from './utils/Equa';
import {RenderInfo, SkeleNode} from './utils/SkeleNode';

const preventDefault = (e: Event) => {
  // e.preventDefault();
};

// temp
function App() {
  // const [greetMsg, setGreetMsg] = createSignal('');
  // const [name, setName] = createSignal('');

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  //   setGreetMsg(await invoke("greet", { name: name() }));
  // }

  const [skele, setSkele] = createSignal<SkeleNode>(new SkeleNode());

  const [size, setSize] = createSignal(100);
  const [rotation, setRotation] = createSignal(270);

  const [cameraPosition, setCameraPosition] = createSignal(
    vec2.fromValues(300, 500)
  );

  const [renderedNodes, setRenderedNodes] = createSignal<SkeleNode[]>([]);
  const [renderedInfo, setRenderedInfo] = createSignal<RenderInfo[]>([]);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(cameraPosition()[0], cameraPosition()[1], size(), rotation());

    setSkele(base);
    setRenderedInfo(skele().renderAll(1, props => props));
    setRenderedNodes(Array.from(base.walk()).slice(1));

    console.log('ticked skele', skele());
  };

  const [currentFiles, setCurrentFiles] = createSignal([] as string[]);

  const pushCurrentFiles = () => {
    const base = skele().clone();
    const spriteRoot = base.children[0];
    for (const f of currentFiles()) {
      spriteRoot.add(
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
    updateSkele(
      await renderUris(
        SkeleNode.fromData({
          angle: 0,
          mag: 1,
          children: [
            {
              angle: 0,
              mag: 0.3,
              uri: 'sprite:strawberry/Still/Bottom/BB',
              props: {
                hueRot: 0,
              },
              id: 'BB',
            },
            {
              angle: 0,
              mag: 0.2,
              children: [
                {
                  angle: 0,
                  mag: 0.25,
                  uri: 'sprite:strawberry/Still/Middle/MM',
                  props: {
                    hueRot: 0,
                  },
                  id: 'MM',
                },
              ],
            },
            {
              angle: 0,
              mag: 0.48,
              children: [
                {
                  angle: 0,
                  mag: 0.05,
                  uri: 'sprite:strawberry/Still/Bottom/BT',
                  id: 'BT',
                  sort: -1,
                },
                {
                  angle: 0,
                  mag: 0.07,
                  children: [
                    {
                      angle: 0,
                      mag: 0.05,
                      uri: 'sprite:strawberry/Still/Middle/MT',
                      id: 'MT',
                    },
                  ],
                },
              ],
            },
            {
              angle: 180,
              mag: 0.4,
              children: [
                {
                  angle: 180,
                  mag: 0.5,
                  uri: 'sprite:strawberry/Still/Middle/MB',
                  props: {
                    hueRot: 0,
                  },
                  id: 'MB',
                },
              ],
            },
          ],
        })
      )
    );
  })();

  const dragStartNode = (e: DragEvent) => {
    console.log('node', e);
  };

  const dragStartSprite = (e: DragEvent) => {
    console.log('sprite', e);
  };

  const makeBlobUrl = async (file: File) => {
    const blob = new Blob([await file.arrayBuffer()], {
      type: file.type,
    });
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  };

  return (
    <div
      class="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
    >
      <h1 class="page-title">vector-pose</h1>

      <div class="editor-pane">
        <div class="editor-window">
          <div class="sprite-holder">
            <For each={renderedInfo()} fallback={<div>...</div>}>
              {node => (
                <div
                  draggable={true}
                  onDragStart={dragStartSprite}
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
                  draggable={true}
                  onDragStart={dragStartNode}
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
              <div draggable={true} onDragStart={dragStartNode}>
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
