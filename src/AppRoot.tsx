import {vec2} from 'gl-matrix';
import {useEffect, useRef, useState} from 'react';
import './AppRoot.css';
import {EditorPane} from './components/EditorPane';
import {FileExplorerPane} from './components/FileExplorerPane';
import {HeaderPane} from './components/HeaderPane';
import {LayersPane} from './components/LayersPane';
import {Resizer} from './components/Resizer';
import {TabPane} from './components/TabPane';
import {
  FAB_EXTENSIONS,
  FileEntry,
  IMAGE_EXTENSIONS,
  ImageCache,
  SEARCH_DIRS,
  toSpriteUri,
  UiNode,
} from './shared/types';
import {RenderInfo, SkeleNode} from './utils/SkeleNode';

const INITIAL_SIZE = 100;
const INITIAL_ROTATION = 270;
const INITIAL_CAMERA_POSITION = vec2.fromValues(300, 500);

const scanDirectory = async (
  baseDir: string,
  subDir: string
): Promise<FileEntry[]> => {
  const fullPath = await window.native.path.join(baseDir, subDir);
  const entries: FileEntry[] = [];

  try {
    const files = await window.native.fs.readdir(fullPath);

    for (const file of files) {
      // Build the full relative path including subdirectories
      const relativePath = await window.native.path.join(
        subDir,
        file.relativePath
      );

      if (file.isDirectory) {
        entries.push(
          ...(await scanDirectory(
            baseDir,
            relativePath // Pass the full relative path for subdirectories
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
  const [renderedNodes, setRenderedNodes] = useState<SkeleNode[]>([]);
  const [renderedInfo, setRenderedInfo] = useState<RenderInfo[]>([]);

  const [dragStart, setDragStart] = useState<vec2>();

  const [size, setSize] = useState(INITIAL_SIZE);
  const [rotation, setRotation] = useState(INITIAL_ROTATION);
  const [cameraPosition, setCameraPosition] = useState(INITIAL_CAMERA_POSITION);
  const [time, setTime] = useState(1);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(cameraPosition[0], cameraPosition[1], size, rotation);

    base.updateState(time);
    console.log('update?', base);
    setRenderedInfo(base.render(1, props => props));
    setRenderedNodes(Array.from(base.walk()).slice(1));
    setSkele(base);
  };

  const [availableFiles, setAvailableFiles] = useState<FileEntry[]>([]);

  const appendNewNode = () => {
    const base = skele.clone();
    base.add(
      SkeleNode.fromData({
        angle: 0,
        mag: 1,
      })
    );

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

  const handleFileClick = (file: FileEntry) => {
    if (file.type === 'image') {
      const spriteUri = toSpriteUri(file.path);
      if (!spriteUri) return;
      const newSkele = skele.clone();
      newSkele.add(SkeleNode.fromData({angle: 0, mag: 1, uri: spriteUri}));
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

  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(300);

  return (
    <div
      className="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
      onMouseUp={handleDropSprite}
      onMouseMove={dragOverSprite}
    >
      <HeaderPane />
      <TabPane />

      <div className="panes-container">
        <div className="pane left-pane" style={{width: leftWidth}}>
          <FileExplorerPane
            availableFiles={availableFiles}
            activeFile={activeNode?.node.uri}
            gameDirectory={gameDirectory}
            onFileClick={handleFileClick}
            onFileSelect={handleFileSelect}
            onDirectorySelect={handleDirectorySelect}
          />
        </div>

        <Resizer
          onResize={delta => setLeftWidth(w => Math.max(100, w + delta))}
        />

        <div className="pane middle-pane" style={{flex: 1}}>
          <EditorPane
            renderedInfo={renderedInfo}
            renderedNodes={renderedNodes}
            activeNode={activeNode}
            gameDirectory={gameDirectory}
            onMouseDown={handleMouseDown}
            spriteHolderRef={spriteHolderRef}
          />
        </div>

        <Resizer
          onResize={delta => setRightWidth(w => Math.max(100, w - delta))}
        />

        <div className="pane right-pane" style={{width: rightWidth}}>
          <LayersPane
            renderedNodes={skele.children}
            activeNode={activeNode}
            onNodeUpdate={updateSkele}
            skele={skele}
            onAddNode={appendNewNode}
          />
        </div>
      </div>

      <footer className="footer">foot</footer>
    </div>
  );
};
