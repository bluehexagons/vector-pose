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
  TabData,
} from './shared/types';
import {RenderInfo, SkeleNode} from './utils/SkeleNode';
import {BASE_SCALE, Viewport} from './components/EditorCanvas';

const INITIAL_SIZE = 1;
const INITIAL_ROTATION = 270;
const INITIAL_OBJECT_POSITION = vec2.fromValues(0, 0);

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

const createEmptyTab = () => ({
  id: crypto.randomUUID(),
  name: 'Untitled',
  description: '',
  skele: createDefaultSkele(),
  renderedInfo: [] as RenderInfo[],
  renderedNodes: [] as SkeleNode[],
});

const preventDefault = (e: React.SyntheticEvent) => e.preventDefault();

export const AppRoot = () => {
  const spriteHolderRef = useRef<HTMLDivElement>(null);

  const [gameDirectory, setGameDirectory] = useState(
    () => localStorage.getItem('gameDirectory') || './'
  );

  const [dragStart, setDragStart] = useState<vec2>();

  const size = INITIAL_SIZE;
  const rotation = INITIAL_ROTATION;
  const objectPosition = INITIAL_OBJECT_POSITION;
  const [time, setTime] = useState(1);

  const [tabs, setTabs] = useState<TabData[]>(() => [createEmptyTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const skele = activeTab?.skele;

  const [viewRotation, setViewRotation] = useState(INITIAL_ROTATION);

  const handleRotateView = (degrees: number) => {
    // Allow any angle, just normalize display to 0-360
    const normalized = ((degrees % 360) + 360) % 360;
    setViewRotation(normalized);
  };

  useEffect(() => {
    if (skele) {
      updateSkele(skele.clone());
    }
  }, [viewRotation]);

  const updateSkele = (base: SkeleNode) => {
    base.tickMove(objectPosition[0], objectPosition[1], size, viewRotation);
    base.updateState(time);

    const newRenderedInfo = base.render(1, props => props);
    const newRenderedNodes = Array.from(base.walk()).slice(1);

    setTabs(current =>
      current.map(tab =>
        tab.id === activeTabId
          ? {
              ...tab,
              skele: base,
              isModified: true,
              renderedInfo: newRenderedInfo,
              renderedNodes: newRenderedNodes,
            }
          : tab
      )
    );
  };

  const handleNewTab = () => {
    const newTab: TabData = createEmptyTab();
    setTabs(current => [...current, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(current => current.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(tabs[0]?.id);
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const [availableFiles, setAvailableFiles] = useState<FileEntry[]>([]);

  const appendNewNode = () => {
    const base = skele.clone();
    base.add(
      SkeleNode.fromData({
        angle: 0,
        mag: 0,
      })
    );

    updateSkele(base);
  };

  // pre-populate a good default palette
  useEffect(() => {
    updateSkele(createDefaultSkele());
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
      updateSkele(newSkele);
      setLastActiveNode({node: newNode});
    }

    setActiveNode(undefined);
  };

  const handleNodeSelection = (
    node: RenderInfo,
    e: React.MouseEvent,
    worldPos: vec2
  ) => {
    setActiveNode({node: node.node});
    setDragStart(worldPos);
    e.preventDefault();
  };

  const findClosestNode = (
    worldX: number,
    worldY: number,
    scale: number
  ): RenderInfo | undefined => {
    if (!activeTab?.renderedInfo) return undefined;

    return activeTab.renderedInfo.reduce((closest, node) => {
      const dist = vec2.dist(node.center, [worldX, worldY]);
      const nodeSize = Math.sqrt(vec2.dot(node.transform, node.transform));

      if (dist < (closest?.distance ?? Infinity) && dist < nodeSize) {
        return {node, distance: dist};
      }
      return closest;
    }, undefined as {node: RenderInfo; distance: number} | undefined)?.node;
  };

  const handleMouseDown = (e: React.MouseEvent, viewport: Viewport) => {
    if (e.button !== 0) return;

    const worldPos = viewport.pageToWorld(e.pageX, e.pageY);
    const closestNode = findClosestNode(
      worldPos[0],
      worldPos[1],
      viewport.scale
    );
    if (closestNode) {
      handleNodeSelection(closestNode, e, worldPos);
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

  const dragOverSprite = (e: React.MouseEvent, viewport: Viewport) => {
    if (!activeNode || !dragStart) return;

    e.preventDefault();

    const worldPos = viewport.pageToWorld(e.pageX, e.pageY);
    const newSkele = skele.clone();
    const newNode = newSkele.findId(activeNode.node.id);

    if (newNode?.parent) {
      newNode.updateFromWorldPosition(worldPos[0], worldPos[1]);
      setDragStart(worldPos);
      updateSkele(newSkele);
    }
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
        setActiveTabId(existingTab.id);
        return;
      }

      try {
        const str = (await window.native.fs.readFile(
          file.path,
          'utf-8'
        )) as unknown as string;
        const fabData = JSON.parse(str);

        if (fabData.skele) {
          const newSkele = SkeleNode.fromData(fabData.skele);
          newSkele.tickMove(
            objectPosition[0],
            objectPosition[1],
            size,
            rotation
          );
          newSkele.updateState(time);

          const newTab: TabData = {
            id: crypto.randomUUID(),
            name: fabData.name ?? file.relativePath,
            description: fabData.name ?? file.relativePath,
            filePath: file.path,
            skele: newSkele,
            renderedInfo: newSkele.render(1, props => props),
            renderedNodes: Array.from(newSkele.walk()).slice(1),
          };
          setTabs(current => [...current, newTab]);
          setActiveTabId(newTab.id);
        } else {
          console.error('No skele data found in fab file');
        }
      } catch (err) {
        console.error('Failed to load fab file:', err);
      }
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
          tab.id === activeTabId ? {...tab, isModified: false} : tab
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
      const fileName = await window.native.path.basename(filePath, '.fab.json');

      setTabs(current =>
        current.map(tab =>
          tab.id === activeTabId ? {...tab, filePath, isModified: false} : tab
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
        tab.id === activeTabId ? {...tab, name, isModified: true} : tab
      )
    );
  };

  return (
    <div
      className="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
      onMouseUp={handleDropSprite}
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
            gameDirectory={gameDirectory}
            onMouseDown={handleMouseDown}
            onMouseMove={dragOverSprite}
            spriteHolderRef={spriteHolderRef}
          />
        </div>

        <Resizer
          onResize={delta => setRightWidth(w => Math.max(100, w - delta))}
        />

        <div className="pane right-pane" style={{width: rightWidth}}>
          <LayersPane
            renderedNodes={activeTab?.skele.children ?? []}
            activeNode={activeNode}
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
