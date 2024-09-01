import {createEffect, createSignal, For} from 'solid-js';
import logo from './assets/logo.svg';
import {invoke} from '@tauri-apps/api/tauri';
import './App.css';

const preventDefault = (e: MouseEvent) => {
  // e.preventDefault();
};

function App() {
  // const [greetMsg, setGreetMsg] = createSignal('');
  // const [name, setName] = createSignal('');

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  //   setGreetMsg(await invoke("greet", { name: name() }));
  // }

  const [skele, setSkele] = createSignal([
    {
      uri: '/tauri.svg',
    },
  ]);

  const [currentFiles, setCurrentFiles] = createSignal([] as string[]);

  return (
    <div class="container" onContextMenu={preventDefault}>
      <h1 class="page-title">vector-pose</h1>

      <div class="editor-pane">
        <h2 class="title">editor</h2>
        <div class="editor-window">
          <div class="sprite-holder">
            <For each={skele()} fallback={<div>...</div>}>
              {node => (
                <div>
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

              const uris: string[] = [];

              for (const file of e.target.files) {
                const blob = new Blob([await file.arrayBuffer()], {
                  type: 'image/jpeg',
                });
                const imageUrl = URL.createObjectURL(blob);

                uris.push(imageUrl);
                setSkele([
                  ...skele(),
                  {
                    uri: imageUrl,
                  },
                ]);
              }

              setCurrentFiles(uris);
            }}
            multiple
          />
          <button>+</button>
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
