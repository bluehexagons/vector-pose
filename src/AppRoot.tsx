import {vec2} from 'gl-matrix';
import './App.css';
import {toDegrees, toRadians} from './utils/Equa';
import {RenderInfo, SkeleNode} from './utils/SkeleNode';
import {useEffect, useRef, useState} from 'react';
import {AngleInput} from './components/AngleInput';

import type {dialog} from 'electron';

declare global {
  interface Window {
    native: {
      showOpenDialog: typeof dialog.showOpenDialog;
    };
  }
}

const preventDefault = (e: {preventDefault(): void}) => {
  e.preventDefault();
};

interface UiNode {
  node: RenderInfo;
}

// const home = await readTextFile(resPath);

// temp
export const AppRoot = () => {
  // const [greetMsg, setGreetMsg] = createSignal('');
  // const [name, setName] = createSignal('');

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  //   setGreetMsg(await invoke("greet", { name: name() }));
  // }

  const spriteHolder = useRef<HTMLDivElement | undefined>(undefined);

  const [skele, setSkele] = useState<SkeleNode>(new SkeleNode());

  const [size, setSize] = useState(100);
  const [rotation, setRotation] = useState(270);

  const time = 1;

  const [dragStart, setDragStart] = useState<vec2>();

  const [cameraPosition, setCameraPosition] = useState(
    vec2.fromValues(300, 500)
  );

  const [renderedNodes, setRenderedNodes] = useState<SkeleNode[]>([]);
  const [renderedInfo, setRenderedInfo] = useState<RenderInfo[]>([]);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(cameraPosition[0], cameraPosition[1], size, rotation);

    base.updateState(time);
    setRenderedInfo(base.render(1, props => props));
    setRenderedNodes(Array.from(base.walk()).slice(1));

    setSkele(base);
    console.log('ticked skele', base);
  };

  const [currentFiles, setCurrentFiles] = useState([] as string[]);

  const pushCurrentFiles = () => {
    const base = skele.clone();
    for (const f of currentFiles) {
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
        node.uri = `./data/gfx/sprite/${node.uri
          .slice(7)
          .replace('Still', 'Strawberry-001a_Still')}.PNG`;
      }
    }
    return skele;
  };

  // insert some test data
  useEffect(() => {
    (async () => {
      updateSkele(await renderUris(SkeleNode.fromData({angle: 0, mag: 1})));
    })();
  }, []);

  const [lastActiveNode, setLastActiveNode] = useState<RenderInfo | undefined>(
    undefined
  );

  const [activeNode, setActiveNode] = useState<RenderInfo | undefined>(
    undefined
  );

  const dragOverSprite = (e: React.MouseEvent) => {
    const node = activeNode;
    // console.log('sprite over', e);
    if (!node) {
      return;
    }

    e.preventDefault;
    // const originalNode = node.node;
  };

  const dropSprite = (e: React.MouseEvent) => {
    const {pageX, pageY} = e;

    const node = activeNode;
    const startPos = dragStart;

    console.log('sprite drop', node);

    if (startPos && node) {
      console.log(vec2.sub(vec2.create(), [pageX, pageY], startPos));

      const newSkele = skele;

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

  const handleMouseDown = (e: React.MouseEvent) => {
    let closestNode: RenderInfo | undefined = undefined;
    let closestDistance = Infinity;
    const {pageX, pageY} = e;

    for (const node of renderedInfo) {
      const dist = vec2.dist(
        vec2.add(vec2.create(), node.center, [
          spriteHolder.current?.offsetLeft || 0,
          spriteHolder.current?.offsetTop || 0,
        ]),
        [pageX, pageY]
      );
      if (
        dist < closestDistance &&
        dist < Math.sqrt(vec2.dot(node.transform, node.transform))
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
      e.preventDefault();
    }
  };

  return (
    <div
      className="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
      onMouseUp={dropSprite}
      onMouseMove={dragOverSprite}
    >
      <h1 className="page-title">vector-pose</h1>

      <div className="editor-pane">
        <div className="editor-window" onMouseDown={handleMouseDown}>
          <div className="sprite-holder" ref={spriteHolder}>
            {renderedInfo.map(node => (
              <div
                className={node.node === activeNode?.node ? 'active' : ''}
                style={{
                  left: `${node.center[0]}px`,
                  top: `${node.center[1]}px`,
                  width: `${node.transform[0] * 2}px`,
                  height: `${node.transform[1] * 2}px`,
                  transform: `translate(-50%, -50%) rotate(${
                    node.direction + 90
                  }deg)`,
                }}
              >
                <img src={node.uri} />
              </div>
            ))}
          </div>
          <div className="node-graph">
            {renderedNodes.map((node, index) => (
              <div
                className={node === activeNode?.node ? 'active' : ''}
                style={{
                  left: `${node.state.mid.transform[0]}px`,
                  top: `${node.state.mid.transform[1]}px`,
                }}
              >
                {node.id ? node.id : `node #${index + 1}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="layers-pane">
        <h2 className="title">nodes</h2>
        <ol className="node-tree">
          {renderedNodes.map((node, index) => (
            <div className={node === activeNode?.node ? 'active' : ''}>
              <div>
                node #{index + 1}
                {node.id ? ` (${node.id})` : ''}
              </div>
              <div>
                angle=
                <AngleInput
                  value={node.rotation}
                  onChange={v => {
                    console.log('angle', toDegrees(v));
                    node.rotation = v;
                    node.updateTransform();
                    updateSkele(skele.clone());
                  }}
                />
                &nbsp; mag=
                <input
                  value={node.mag}
                  onChange={evt => {
                    console.log('mag', evt.target.value);
                    node.mag = parseFloat(evt.target.value) || 0;
                    node.updateTransform();
                    updateSkele(skele.clone());
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
                    updateSkele(skele.clone());
                  }}
                />
              </div>
            </div>
          ))}
        </ol>
        <div className="row">
          <button
            onClick={async () => {
              const files = await window.native.showOpenDialog({
                properties: [
                  'openFile',
                  'multiSelections',
                  'treatPackageAsDirectory',
                  'promptToCreate',
                ],
                filters: [
                  {
                    name: 'Supported Files',
                    extensions: ['fab.json', 'jpg', 'jpeg', 'png', 'webp'],
                  },
                  {name: 'Prefab Files', extensions: ['fab.json']},
                  {
                    name: 'Image Files',
                    extensions: ['jpg', 'jpeg', 'png', 'webp'],
                  },
                  {name: 'All Files', extensions: ['*']},
                ],
              });
              console.log('got back');
              console.log(files);
              if (!files || files.canceled) return;

              const imageUris: string[] = [];

              for (const file of files.filePaths) {
                console.log(file);
                // const blobUrl = await makeBlobUrl(file);
                // imageUris.push(blobUrl);
              }

              setCurrentFiles(imageUris);
              pushCurrentFiles();
            }}
          >
            Open File(s)
          </button>
          <button onClick={pushCurrentFiles}>+</button>
        </div>
      </div>

      <footer className="footer">foot</footer>
    </div>
  );
};
