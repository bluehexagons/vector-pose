import {vec2} from 'gl-matrix';
import {useEffect, useRef, useState} from 'react';
import './AppRoot.css';
import {AngleInput} from './components/AngleInput';
import {toDegrees} from './utils/Equa';
import {RenderInfo, SkeleNode} from './utils/SkeleNode';
import {
  SEARCH_DIRS,
  IMAGE_EXTENSIONS,
  FAB_EXTENSIONS,
  FileEntry,
  toSpriteUri,
  fromSpriteUri,
  ImageCache,
} from './shared/types';
import {GameImage} from './components/GameImage';

const INITIAL_SIZE = 100;
const INITIAL_ROTATION = 270;
const INITIAL_CAMERA_POSITION = vec2.fromValues(300, 500);

interface UiNode {
  node: SkeleNode;
}

const scanDirectory = async (
  baseDir: string,
  subDir: string
): Promise<FileEntry[]> => {
  const fullPath = await window.native.path.join(baseDir, subDir);
  const entries: FileEntry[] = [];

  try {
    const files = await window.native.fs.readdir(fullPath);

    for (const file of files) {
      const relativePath = file.relativePath;

      if (file.isDirectory) {
        entries.push(
          ...(await scanDirectory(
            baseDir,
            await window.native.path.join(subDir, file.name)
          ))
        );
      } else {
        const ext = await window.native.path.extname(file.name);
        if (IMAGE_EXTENSIONS.includes(ext as any)) {
          entries.push({path: file.path, relativePath, type: 'image'});
        } else if (FAB_EXTENSIONS.some(fabExt => file.name.endsWith(fabExt))) {
          entries.push({path: file.path, relativePath, type: 'fab'});
        }
      }
    }
  } catch (err) {
    console.error(`Failed to scan directory ${fullPath}:`, err);
  }

  return entries;
};

const preventDefault = (e: React.SyntheticEvent) => e.preventDefault();

export const AppRoot = () => {
  const spriteHolderRef = useRef<HTMLDivElement>(null);

  const [gameDirectory, setGameDirectory] = useState(
    () => localStorage.getItem('gameDirectory') || './'
  );

  const [skele, setSkele] = useState(() => new SkeleNode());
  const [size, setSize] = useState(INITIAL_SIZE);
  const [rotation, setRotation] = useState(INITIAL_ROTATION);
  const [dragStart, setDragStart] = useState<vec2>();
  const [cameraPosition, setCameraPosition] = useState(INITIAL_CAMERA_POSITION);

  const [time, setTime] = useState(1);

  const [renderedNodes, setRenderedNodes] = useState<SkeleNode[]>([]);
  const [renderedInfo, setRenderedInfo] = useState<RenderInfo[]>([]);

  const [imageCache, setImageCache] = useState<ImageCache>({});

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(imageCache).forEach(URL.revokeObjectURL);
    };
  }, []);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(cameraPosition[0], cameraPosition[1], size, rotation);

    base.updateState(time);
    setRenderedInfo(base.render(1, props => props));
    setRenderedNodes(Array.from(base.walk()).slice(1));

    setSkele(base);
    console.log('ticked skele', base);
  };

  const [availableFiles, setAvailableFiles] = useState<FileEntry[]>([]);

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

  // insert some test data
  useEffect(() => {
    updateSkele(SkeleNode.fromData({angle: 0, mag: 1}));
  }, []);

  const [lastActiveNode, setLastActiveNode] = useState<UiNode | undefined>(
    undefined
  );

  const [activeNode, setActiveNode] = useState<UiNode | undefined>(undefined);

  const handleDropSprite = (e: React.MouseEvent) => {
    if (!dragStart || !activeNode) {
      setLastActiveNode(undefined);
      setActiveNode(undefined);
      return;
    }

    const delta = vec2.sub(vec2.create(), [e.pageX, e.pageY], dragStart);

    const newSkele = skele.clone();
    const newNode = newSkele.findId(activeNode.node.id);

    if (newNode) {
      newNode.mag *= 1.5;
      updateSkele(newSkele);
      setLastActiveNode({node: newNode});
    }

    setActiveNode(undefined);
  };

  const handleNodeSelection = (node: RenderInfo, e: React.MouseEvent) => {
    setActiveNode({node: node.node});
    setDragStart(vec2.fromValues(e.pageX, e.pageY));
    e.preventDefault();
  };

  const findClosestNode = (x: number, y: number): RenderInfo | undefined => {
    if (!spriteHolderRef.current) return undefined;

    return renderedInfo.reduce((closest, node) => {
      const nodePos = vec2.add(vec2.create(), node.center, [
        spriteHolderRef.current?.offsetLeft || 0,
        spriteHolderRef.current?.offsetTop || 0,
      ]);

      const dist = vec2.dist(nodePos, [x, y]);
      const nodeSize = Math.sqrt(vec2.dot(node.transform, node.transform));

      if (dist < (closest?.distance ?? Infinity) && dist < nodeSize) {
        return {node, distance: dist};
      }
      return closest;
    }, undefined as {node: RenderInfo; distance: number} | undefined)?.node;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const closestNode = findClosestNode(e.pageX, e.pageY);
    if (closestNode) {
      handleNodeSelection(closestNode, e);
    }
  };

  const loadDirectoryFiles = async (directory: string) => {
    const entries: FileEntry[] = [];

    for (const searchDir of SEARCH_DIRS) {
      entries.push(...(await scanDirectory(directory, searchDir)));
    }

    setAvailableFiles(entries);
    console.log('Loaded files:', entries);
  };

  const handleDirectorySelect = async () => {
    try {
      const response = await window.native.showOpenDialog({
        properties: ['openDirectory', 'treatPackageAsDirectory'],
        title: 'Select Game Directory',
        buttonLabel: 'Open',
      });

      if (!response.canceled && response.filePaths.length > 0) {
        const newDir = response.filePaths[0];
        setGameDirectory(newDir);
        localStorage.setItem('gameDirectory', newDir);
        await loadDirectoryFiles(newDir);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const makeBlobUrl = async (filePath: string) => {
    try {
      const buffer = await window.native.fs.readFile(filePath);
      const blob = new Blob([buffer]);
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Failed to create blob URL:', err);
      return null;
    }
  };

  const dragOverSprite = (e: React.MouseEvent) => {
    if (!activeNode || !dragStart) {
      return;
    }

    e.preventDefault();

    const delta = vec2.sub(vec2.create(), [e.pageX, e.pageY], dragStart);

    const newSkele = skele.clone();
    const newNode = newSkele.findId(activeNode.node.id);

    if (newNode) {
      // Update node position based on drag delta
      newNode.state.mid.transform[0] += delta[0] * 0.1;
      newNode.state.mid.transform[1] += delta[1] * 0.1;

      // Update the drag start for continuous movement
      setDragStart([e.pageX, e.pageY]);

      // Apply changes
      updateSkele(newSkele);
    }
  };

  const handleFileSelect = async () => {
    const response = await window.native.showOpenDialog({
      properties: ['openFile', 'multiSelections', 'treatPackageAsDirectory'],
      title: 'Add image layers',
      buttonLabel: 'Add',
      filters: [
        {
          name: 'Supported Files',
          extensions: ['fab.json', 'jpg', 'jpeg', 'png', 'webp'],
        },
        {name: 'Prefab Files', extensions: ['fab.json']},
        {name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp']},
      ],
    });

    if (!response || response.canceled) return;

    const newFiles = await Promise.all(
      response.filePaths.map(
        async filePath =>
          ({
            path: filePath,
            relativePath: await window.native.path.basename(filePath),
            type:
              (await window.native.path.extname(filePath)) === '.json'
                ? 'fab'
                : 'image',
          } as FileEntry)
      )
    );

    setAvailableFiles(prev => [...prev, ...newFiles]);
  };

  useEffect(() => {
    if (gameDirectory) {
      loadDirectoryFiles(gameDirectory);
    }
  }, [gameDirectory]);

  return (
    <div
      className="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
      onMouseUp={handleDropSprite}
      onMouseMove={dragOverSprite}
    >
      <div className="top-header">
        <h1 style={{margin: 0}}>vector-pose</h1>
      </div>

      <div className="page-title">tabs</div>

      <div className="file-explorer-pane">
        <h2 className="title">Files</h2>

        <h3>Image Files</h3>
        <ul className="file-list">
          {availableFiles
            .filter(file => file.type === 'image')
            .map(file => (
              <li
                key={file.path}
                className={`file-list-item ${
                  activeNode?.node.uri === file.path ? 'selected' : ''
                }`}
                onClick={() => {
                  const spriteUri = toSpriteUri(file.path);
                  console.log('trying to load', file.path, spriteUri);
                  if (!spriteUri) return;

                  const newSkele = skele.clone();
                  newSkele.add(
                    SkeleNode.fromData({
                      angle: 0,
                      mag: 1,
                      uri: spriteUri,
                    })
                  );
                  console.log(newSkele);
                  updateSkele(newSkele);
                }}
              >
                <span className="file-type-image">{file.relativePath}</span>
              </li>
            ))}
        </ul>

        <h3>Prefab Files</h3>
        <ul className="file-list">
          {availableFiles
            .filter(file => file.type === 'fab')
            .map(file => (
              <li
                key={file.path}
                className={`file-list-item ${
                  activeNode?.node.uri === file.path ? 'selected' : ''
                }`}
                onClick={() => {
                  // TODO: Load fab file
                  console.log('Loading fab:', file.path);
                }}
              >
                <span className="file-type-fab">{file.relativePath}</span>
              </li>
            ))}
        </ul>

        <div className="row">
          <button onClick={handleFileSelect}>Add Files</button>
        </div>

        <button onClick={handleDirectorySelect}>
          Change Directory (currently: {gameDirectory})
        </button>
      </div>

      <div className="editor-pane">
        <div className="editor-window" onMouseDown={handleMouseDown}>
          <div className="sprite-holder" ref={spriteHolderRef}>
            {renderedInfo.map(node => (
              <div
                key={node.node.id}
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
                {node.uri && (
                  <GameImage
                    uri={fromSpriteUri(node.uri)}
                    gameDirectory={gameDirectory}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                )}
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
          <button onClick={pushCurrentFiles}>+</button>
        </div>
      </div>

      <footer className="footer">foot</footer>
    </div>
  );
};
