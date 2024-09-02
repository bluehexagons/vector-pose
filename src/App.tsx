import {createEffect, createSignal, For} from 'solid-js';
import logo from './assets/logo.svg';
import {invoke} from '@tauri-apps/api/tauri';
import './App.css';
import {SkeleNode} from './utils/SkeleNode';

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

  const renderSkele = () =>
    skele()
      .tickMove(0, 0, 100, 0)
      .render(0, props => props);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(0, 0, 100, 0);
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

  // insert some test data
  updateSkele(
    SkeleNode.fromData({
      mag: 1,
      angle: 0,
      children: [
        {
          mag: 0,
          angle: 0,
          children: [
            {
              mag: 1,
              angle: 0,
              uri: './tauri.svg',
            },
          ],
        },
      ],
    })
  );

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
                    transform: `translate(-50%, -50%) rotate(${node.direction}deg)`,
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
                const blob = new Blob([await file.arrayBuffer()], {
                  type: file.type,
                });
                const imageUrl = URL.createObjectURL(blob);

                imageUris.push(imageUrl);
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
