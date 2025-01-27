import {vec2} from 'gl-matrix';
import {useEffect, useRef, useState} from 'react';
import './AppRoot.css';
import {Viewport} from './components/EditorCanvas';
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
  SEARCH_DIRS,
  TabData,
  toSpriteUri,
  UiNode,
} from './shared/types';
import {toDegrees, toRadians} from './utils/Equa';
import type {ImagePropsRef} from './utils/Renderer';
import {RenderInfo, SkeleNode} from './utils/SkeleNode';
import {useTabs} from './hooks/useTabs';

const INITIAL_SIZE = 1;
const INITIAL_ROTATION = 0;
const INITIAL_OBJECT_POSITION = vec2.fromValues(0, 0);
const INITIAL_VIEW_ROTATION = 270;

const deduper = (props: ImagePropsRef) => props;

const createDefaultSkele = () =>
  SkeleNode.fromData({angle: 0, mag: 1, children: [{angle: 0, mag: 0}]});

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    updateTab,
    addNewTab,
    closeTab,
    selectTab,
    setTabs,
  } = useTabs();

  const spriteHolderRef = useRef<HTMLDivElement>(null);

  const [gameDirectory, setGameDirectory] = useState(
    () => localStorage.getItem('gameDirectory') || './'
  );

  const [dragStart, setDragStart] = useState<vec2>();

  const [time, setTime] = useState(1);

  const skele = activeTab.skele;

  const [viewRotation, setRawViewRotation] = useState(INITIAL_VIEW_ROTATION);

  const setViewRotation = (degrees: number) => {
    const clone = skele.clone();
    clone.rotation = toRadians(degrees);
    updateSkele(clone);

    setRawViewRotation(degrees);
  };

  const handleRotateView = (degrees: number) => {
    // Allow any angle, just normalize display to 0-360
    const normalized = ((degrees % 360) + 360) % 360;
    setViewRotation(normalized);
  };

  useEffect(() => {
    if (skele && !skele.initialized) {
      updateSkele(skele.clone());
    }
  }, [skele]);

  const findClosestNode = (
    worldX: number,
    worldY: number,
    targetSize: number
  ): SkeleNode | undefined => {
    if (!activeTab?.renderedNodes) return undefined;

    return activeTab.renderedNodes.reduce((closest, node) => {
      if (node.hidden) return closest;
      const center = !node.uri
        ? node.state.transform
        : node.parent.state.transform;
      const dist = vec2.dist(center, [worldX, worldY]);

      const nodeSize = !node.uri
        ? targetSize
        : Math.sqrt(vec2.dot(node.transform, node.transform)) +
          targetSize * 0.5;

      const distBound = Math.min(nodeSize, closest?.distance ?? Infinity);

      if (Math.abs(dist - distBound) < 0.01 && node.uri) {
        return closest;
      }

      if (dist <= distBound) {
        return {node, distance: dist};
      }

      return closest;
    }, undefined as {node: SkeleNode; distance: number} | undefined)?.node;
  };

  const tickSkele = (base: SkeleNode) => {
    base.tickMove(
      INITIAL_OBJECT_POSITION[0],
      INITIAL_OBJECT_POSITION[1],
      INITIAL_SIZE,
      toDegrees(base.rotation + INITIAL_ROTATION)
    );
    base.render(time, deduper);
  };

  const updateSkele = (base: SkeleNode) => {
    const clone = base.clone(null);
    tickSkele(clone);
    updateTab(clone, activeTab?.filePath);
  };

  // Replace handleNewTab, handleCloseTab, handleSelectTab with hook methods
  const handleNewTab = addNewTab;
  const handleCloseTab = closeTab;
  const handleSelectTab = selectTab;

  const [availableFiles, setAvailableFiles] = useState<FileEntry[]>([]);

  const [lastActiveNode, setLastActiveNode] = useState<UiNode | undefined>(
    undefined
  );

  const [activeNode, setActiveNode] = useState<UiNode | undefined>(undefined);

  const appendNewNode = () => {
    const base = skele.clone();
    const newNode = lastActiveNode ? base.findId(lastActiveNode.node.id) : base;
    if (newNode) {
      newNode.add(
        SkeleNode.fromData({
          angle: 0,
          mag: 0,
        })
      );
    }

    updateSkele(base);
  };

  const handleEditorMouseUp = () => {
    if (!dragStart || !activeNode) {
      setActiveNode(undefined);
      return;
    }

    const newSkele = skele.clone();
    const newNode = newSkele.findId(activeNode.node.id);

    if (newNode) {
      updateSkele(newSkele);
      setLastActiveNode({node: newNode});
    }

    setActiveNode(undefined);
  };

  const handleNodeSelection = (
    node: UiNode,
    e: React.MouseEvent,
    worldPos: vec2
  ) => {
    setActiveNode({node: node.node});
    setDragStart(worldPos);
    e.preventDefault();
  };

  const handleEditorMouseDown = (e: React.MouseEvent, viewport: Viewport) => {
    if (e.button !== 0) return;

    const worldPos = viewport.pageToWorld(e.pageX, e.pageY);
    const closestNode = findClosestNode(
      worldPos[0],
      worldPos[1],
      0.02 * vec2.len(viewport.pageToWorld(0, 1))
    );
    if (closestNode) {
      handleNodeSelection({node: closestNode}, e, worldPos);
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent, viewport: Viewport) => {
    if (!activeNode || !dragStart) return;

    e.preventDefault();

    const worldPos = viewport.pageToWorld(e.pageX, e.pageY);
    const newSkele = skele.clone();
    const newNode = newSkele.findId(activeNode.node.id);

    tickSkele(newSkele);

    if (newNode) {
      if (newNode.uri) {
        return; // disable for testing
        newNode.updateFromChildTarget(worldPos[0], worldPos[1]);
      } else {
        newNode.updateFromWorldPosition(worldPos[0], worldPos[1]);
      }
      setDragStart(worldPos);
    }

    updateSkele(newSkele);
  };

  const loadDirectoryFiles = async (directory: string) => {
    const entries: FileEntry[] = [];

    for (const searchDir of SEARCH_DIRS) {
      entries.push(...(await scanDirectory(directory, searchDir)));
    }

    setAvailableFiles(entries);
  };

  const handleDirectorySelect = async () => {
    try {
      const response = await window.native.dialog.showOpenDialog({
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

  const loadFabFile = async (file: FileEntry) => {
    try {
      const str = (await window.native.fs.readFile(
        file.path,
        'utf-8'
      )) as string;
      const fabData = JSON.parse(str);

      if (fabData.skele) {
        const newSkele = SkeleNode.fromData(fabData.skele);
        tickSkele(newSkele);
        updateTab(newSkele, file.path);
        return true;
      }
    } catch (err) {
      console.error('Failed to load fab file:', err);
    }
    return false;
  };

  const handleFileClick = async (file: FileEntry) => {
    if (file.type === 'image') {
      const spriteUri = toSpriteUri(file.path);
      if (!spriteUri) return;
      const newSkele = skele.clone();
      // Add new sprites at a reasonable size
      newSkele.add(SkeleNode.fromData({angle: 0, mag: 0.25, uri: spriteUri}));
      updateSkele(newSkele);
    } else if (file.type === 'fab') {
      // Check if file is already open in a tab
      const existingTab = tabs.find(tab => tab.filePath === file.path);
      if (existingTab) {
        setActiveTabId(existingTab.skele.id);
        return;
      }

      await loadFabFile(file);
    }
  };

  const handleFileSelect = async () => {
    const response = await window.native.dialog.showOpenDialog({
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

  const handleSave = async () => {
    if (!activeTab) return;

    try {
      if (!activeTab.filePath) {
        return handleSaveAs();
      }

      const fabData = {
        name: activeTab.name,
        skele: activeTab.skele.toData(), // Use toData() explicitly
      };

      // overwrite camera-modified values to their originals
      fabData.skele.angle = 0;
      fabData.skele.mag = 1;

      await window.native.fs.writeFile(
        activeTab.filePath,
        JSON.stringify(fabData, null, 2)
      );

      setTabs(current =>
        current.map(tab =>
          tab.skele.id === activeTabId ? {...tab, isModified: false} : tab
        )
      );
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleSaveAs = async () => {
    if (!activeTab) return;

    try {
      // Convert tab name to filename format
      const defaultName = activeTab.name.toLowerCase().replace(/\s+/g, '_');

      const response = await window.native.dialog.showSaveDialog({
        title: 'Save As',
        buttonLabel: 'Save',
        defaultPath: defaultName + '.fab.json',
        filters: [{name: 'Prefab Files', extensions: ['fab.json']}],
        properties: ['showOverwriteConfirmation', 'createDirectory'],
      });

      if (response.canceled || !response.filePath) return;

      const filePath = response.filePath;

      setTabs(current =>
        current.map(tab =>
          tab.skele.id === activeTabId
            ? {...tab, filePath, isModified: false}
            : tab
        )
      );

      const fabData = {
        name: activeTab.name,
        description: activeTab.description,
        skele: activeTab.skele.toData(),
      };

      // overwrite camera-modified values to their originals
      fabData.skele.angle = 0;
      fabData.skele.mag = 1;

      await window.native.fs.writeFile(
        filePath,
        JSON.stringify(fabData, null, 2)
      );
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleNameChange = (name: string) => {
    setTabs(current =>
      current.map(tab =>
        tab.skele.id === activeTabId ? {...tab, name, isModified: true} : tab
      )
    );
  };

  return (
    <div
      className="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
    >
      <HeaderPane
        activeTab={activeTab}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNameChange={handleNameChange}
        onRotateView={handleRotateView}
        viewRotation={viewRotation}
      />
      <TabPane
        tabs={tabs}
        activeTabId={activeTabId}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onSelectTab={handleSelectTab}
      />

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
            renderedInfo={activeTab?.renderedInfo ?? []}
            renderedNodes={activeTab?.renderedNodes ?? []}
            activeNode={activeNode}
            lastActiveNode={lastActiveNode}
            gameDirectory={gameDirectory}
            onMouseDown={handleEditorMouseDown}
            onMouseMove={handleEditorMouseMove}
            onMouseUp={handleEditorMouseUp}
            spriteHolderRef={spriteHolderRef}
            rotation={viewRotation}
          />
        </div>

        <Resizer
          onResize={delta => setRightWidth(w => Math.max(100, w - delta))}
        />

        <div className="pane right-pane" style={{width: rightWidth}}>
          <LayersPane
            renderedNodes={activeTab?.skele.children ?? []}
            activeNode={activeNode}
            lastActiveNode={lastActiveNode}
            onNodeUpdate={updateSkele}
            skele={activeTab?.skele ?? new SkeleNode()}
            onAddNode={appendNewNode}
          />
        </div>
      </div>

      <footer className="footer">foot</footer>
    </div>
  );
};
