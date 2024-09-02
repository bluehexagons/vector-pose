import {createEffect, createSignal, For} from 'solid-js';
import logo from './assets/logo.svg';
import {invoke} from '@tauri-apps/api/tauri';
import './App.css';
import {SkeleNode} from './utils/SkeleNode';
import {vec2} from 'gl-matrix';

const preventDefault = (e: MouseEvent) => {
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
    vec2.fromValues(300, 300)
  );

  const renderSkele = () =>
    skele()
      .tickMove(cameraPosition()[0], cameraPosition()[0], size(), rotation())
      .render(0, props => props);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(cameraPosition()[0], cameraPosition()[0], size(), rotation());
    setSkele(base);

    console.log('ticked skele', skele());
    console.log(renderSkele());
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
              mag: -1,
              children: [
                {
                  angle: 0,
                  mag: 0.2,
                  uri: 'sprite:strawberry/Still/Bottom/BB',
                  props: {
                    hueRot: 0,
                  },
                  id: 'Bottom/BB',
                },
              ],
            },
            {
              angle: 0,
              mag: 0,
              children: [
                {
                  angle: 0,
                  mag: 0.2,
                  uri: 'sprite:strawberry/Still/Middle/MM',
                  props: {
                    hueRot: 0,
                  },
                  id: 'Middle/MM',
                },
              ],
            },
            {
              angle: 0,
              mag: 1,
              children: [
                {
                  angle: 0,
                  mag: 0.2,
                  uri: 'sprite:strawberry/Still/Top/TBLO',
                  props: {
                    hueRot: 0,
                  },
                  id: 'Top/TBLO',
                },
              ],
            },
            // {
            //   angle: 0,
            //   mag: this.scale,
            //   uri: 'sprite:strawberry/Still/Outline',
            //   id: 'Outline',
            // },
            {
              angle: 0,
              mag: 0.7,
              children: [
                {
                  angle: 0,
                  mag: 0,
                  // uri: 'gfx/sphere.png',
                  id: 'FiringPoint',
                },
              ],
            },
          ],
        })
      )
    );
  })();

  const makeBlobUrl = async (file: File) => {
    const blob = new Blob([await file.arrayBuffer()], {
      type: file.type,
    });
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  };

  return (
    <div class="container" onContextMenu={preventDefault}>
      <h1 class="page-title">vector-pose</h1>

      <div class="editor-pane">
        <h2 class="title">editor</h2>
        <div class="editor-window">
          <div class="sprite-holder">
            <For each={renderSkele()} fallback={<div>...</div>}>
              {node => (
                <div
                  style={{
                    left: `${node.center[0]}px`,
                    top: `${node.center[1]}px`,
                    width: `${node.transform[0]}px`,
                    height: `${node.transform[1]}px`,
                    transform: `translate(-50%, -50%) rotate(${node.direction + 90}deg)`,
                  }}
                >
                  <img src={node.uri} />
                </div>
              )}
            </For>
          </div>
        </div>
      </div>

      <div class="layers-pane">
        <h2 class="title">layers</h2>
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
        <h4 class="row">made with...</h4>
        <div class="row">
          <a href="https://vitejs.dev" target="_blank">
            <img src="/vite.svg" class="logo vite" alt="Vite logo" />
          </a>
          <a href="https://tauri.app" target="_blank">
            <img src="/tauri.svg" class="logo tauri" alt="Tauri logo" />
          </a>
          <a href="https://solidjs.com" target="_blank">
            <img src={logo} class="logo solid" alt="Solid logo" />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
