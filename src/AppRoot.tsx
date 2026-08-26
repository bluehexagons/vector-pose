import {vec2} from 'gl-matrix';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import './AppRoot.css';
import {MenuAction} from './components/ContextMenu';
import {Viewport} from './components/EditorCanvas';
import {EditorPane} from './components/EditorPane';
import {FileExplorerPane} from './components/FileExplorerPane';
import {HeaderPane} from './components/HeaderPane';
import {LayersPane} from './components/LayersPane';
import {Resizer} from './components/Resizer';
import {TabPane} from './components/TabPane';
import {useHistory} from './hooks/useHistory';
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';
import {useTabs} from './hooks/useTabs';
import {
  createImageNode,
  findExistingTab,
  loadFabContent,
} from './services/contentService';
import {
  loadDirectoryFiles,
  exportFabFile,
  isBrowserWorkspace,
  saveFabFile,
  selectDirectory,
  selectFiles,
  showSaveDialog,
} from './services/fileService';
import {FabData, FileEntry, TabData, UiNode} from './shared/types';
import {toDegrees, toRadians} from './utils/Equa';
import type {ImagePropsRef} from './utils/Renderer';
import {SkeleNode} from './utils/SkeleNode';
import {getNodeActions} from './utils/nodeActions';

const INITIAL_SIZE = 1;
const INITIAL_ROTATION = 0;
const INITIAL_OBJECT_POSITION = vec2.fromValues(0, 0);
const INITIAL_VIEW_ROTATION = 270;

const deduper = (props: ImagePropsRef) => props;

const createDefaultSkele = () =>
  SkeleNode.fromData({angle: 0, mag: 1, children: [{angle: 0, mag: 0}]});

const preventDefault = (e: React.SyntheticEvent) => e.preventDefault();

let dragCounter = 0;

const serializeFabData = (tab: TabData): FabData => {
  const skele = tab.skele.toData();

  // The root transform is the editor's camera orientation, not part of the
  // saved pose.
  skele.angle = 0;
  skele.mag = 1;

  return {
    name: tab.name,
    description: tab.description,
    drawings: tab.fabData?.drawings,
    skele,
  };
};

export const AppRoot = () => {
  const browserWorkspace = isBrowserWorkspace();
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
    setRotation,
    setActiveNode,
    setLastActiveNode,
  } = useTabs();

  const {activeNode, lastActiveNode} = activeTab;

  const spriteHolderRef = useRef<HTMLDivElement>(null);

  const [gameDirectory, setGameDirectory] = useState(() =>
    browserWorkspace
      ? 'Browser workspace'
      : localStorage.getItem('gameDirectory') || './'
  );

  // Add clickOffset to dragStart state
  const [dragStart, setDragStart] = useState<{
    worldPos: vec2;
    clickOffset: vec2;
  }>();

  const time = 1;

  const skele = activeTab.skele;
  const history = useHistory(skele, skele.id);

  const tickSkele = useCallback(
    (base: SkeleNode) => {
      base.tickMove(
        INITIAL_OBJECT_POSITION[0],
        INITIAL_OBJECT_POSITION[1],
        INITIAL_SIZE,
        toDegrees(base.rotation + INITIAL_ROTATION)
      );
      base.render(time, deduper);
    },
    [time]
  );

  const updateSkele = useCallback(
    (
      base: SkeleNode,
      description?: string,
      continuityKey?: string,
      markModified = true
    ) => {
      if (!activeTab) return base;

      const clone = base.clone(null);
      tickSkele(clone);
      updateTab(clone, activeTab.filePath, undefined, markModified);

      if (description) {
        history.pushState(clone, description, continuityKey);
      }

      return clone;
    },
    [activeTab, history, tickSkele, updateTab]
  );

  const handleRotateView = useCallback(
    (degrees: number) => {
      // Allow any angle, just normalize display to 0-360
      const normalized = ((degrees % 360) + 360) % 360;

      setRotation(activeTabId, normalized);

      // Apply rotation to skele
      const clone = skele.clone();
      clone.rotation = toRadians(normalized);
      updateSkele(clone, undefined, undefined, false);
    },
    [activeTabId, setRotation, skele, updateSkele]
  );

  useEffect(() => {
    if (skele && !skele.initialized) {
      updateSkele(skele.clone(), undefined, undefined, false);
    }
  }, [skele, updateSkele]);

  const findClosestNode = useCallback(
    (worldX: number, worldY: number, targetSize: number) => {
      if (!activeTab?.skele) return undefined;
      const closest = activeTab.skele.findClosestNode(
        worldX,
        worldY,
        targetSize
      );
      const priorityNode =
        lastActiveNode && activeTab.skele.findId(lastActiveNode.node.id);
      if (
        priorityNode &&
        closest &&
        vec2.dist(
          closest.getMovableNode().state.transform,
          priorityNode.state.transform
        ) < 0.01
      ) {
        return priorityNode;
      }
      return closest;
    },
    [activeTab.skele, lastActiveNode]
  );

  const handleNewTab = useCallback(() => {
    const skele = createDefaultSkele();
    skele.rotation = toRadians(INITIAL_VIEW_ROTATION);
    tickSkele(skele);
    addNewTab(skele);
  }, [addNewTab, tickSkele]);

  const [availableFiles, setAvailableFiles] = useState<FileEntry[]>([]);

  const focusNode = useCallback(
    (node?: UiNode) => {
      setLastActiveNode(activeTabId, node);
      setActiveNode(activeTabId, undefined);
    },
    [activeTabId, setActiveNode, setLastActiveNode]
  );

  const appendNewNode = useCallback(() => {
    const base = skele.clone();
    const newParent = lastActiveNode
      ? base.findId(lastActiveNode.node.id)
      : base;
    if (newParent) {
      const newNode = SkeleNode.fromData({
        angle: 0,
        mag: 0,
      });
      newParent.getMovableNode().add(newNode);

      updateSkele(base, `Added node ${newNode.id} to ${base.id}`);
    }
  }, [lastActiveNode, skele, updateSkele]);

  // Modify handleEditorMouseUp to match new dragStart type
  const handleEditorMouseUp = useCallback(() => {
    if (!dragStart || !activeTab.activeNode) {
      return;
    }

    setLastActiveNode(activeTabId, activeTab.activeNode);
    setActiveNode(activeTabId, undefined);
    setDragStart(undefined);
  }, [
    activeTab.activeNode,
    activeTabId,
    dragStart,
    setActiveNode,
    setLastActiveNode,
  ]);

  const handleNodeSelection = useCallback(
    (node: UiNode, e: React.MouseEvent, worldPos: vec2) => {
      const nodePos = node.node.getMovableNode().state.transform;
      // Calculate offset from node center to click position
      const clickOffset = vec2.fromValues(
        worldPos[0] - nodePos[0],
        worldPos[1] - nodePos[1]
      );

      setDragStart({worldPos, clickOffset});
      setActiveNode(activeTabId, {node: node.node});
      setLastActiveNode(activeTabId, undefined);
      e.preventDefault();
    },
    [activeTabId, setActiveNode, setLastActiveNode]
  );

  const handleEditorMouseDown = useCallback(
    (e: React.MouseEvent, viewport: Viewport) => {
      if (e.button !== 0) return;

      const worldPos = viewport.pageToWorld(e.pageX, e.pageY);
      const closestNode = findClosestNode(
        worldPos[0],
        worldPos[1],
        0.02 * vec2.len(viewport.pageToWorld(0, 1))
      );
      if (closestNode) {
        dragCounter++;
        handleNodeSelection({node: closestNode}, e, worldPos);
      } else {
        focusNode(undefined);
      }
    },
    [findClosestNode, focusNode, handleNodeSelection]
  );

  const handleEditorMouseMove = useCallback(
    (e: React.MouseEvent, viewport: Viewport) => {
      if (!activeNode || !dragStart) return;
      e.preventDefault();

      const worldPos = viewport.pageToWorld(e.pageX, e.pageY);
      const newSkele = skele.clone();
      const newNode = newSkele.findId(activeNode.node.id);

      if (newNode) {
        if (newNode === newSkele.root) {
          return;
        }

        tickSkele(newSkele);
        let targetNode = newNode.getMovableNode();

        if (targetNode === newSkele) {
          targetNode = new SkeleNode();
          newNode.remove();
          newSkele.add(targetNode);
          targetNode.add(newNode);
        }

        // Subtract click offset to maintain relative position
        const targetPos = vec2.fromValues(
          worldPos[0] - dragStart.clickOffset[0],
          worldPos[1] - dragStart.clickOffset[1]
        );

        targetNode.updateFromWorldPosition(targetPos[0], targetPos[1]);
        setDragStart({...dragStart, worldPos});
        updateSkele(
          newSkele,
          `Moved node ${activeNode.node.id} to (${targetPos[0].toFixed(
            2
          )}, ${targetPos[1].toFixed(2)})`,
          `drag_${activeNode.node.id}_${dragCounter}`
        );
      }
    },
    [activeNode, dragStart, skele, tickSkele, updateSkele]
  );

  const loadDirectoryContent = useCallback(async (directory: string) => {
    const files = await loadDirectoryFiles(directory);
    setAvailableFiles(files);
  }, []);

  const handleDirectorySelect = useCallback(async () => {
    if (browserWorkspace) return;
    const newDir = await selectDirectory();
    if (newDir) {
      setGameDirectory(newDir);
      localStorage.setItem('gameDirectory', newDir);
      await loadDirectoryContent(newDir);
    }
  }, [browserWorkspace, loadDirectoryContent]);

  const handleFileClick = useCallback(
    async (file: FileEntry) => {
      if (file.type === 'image') {
        const imageNode = createImageNode(file);
        if (imageNode) {
          const newSkele = skele.clone();

          const newParent = lastActiveNode
            ? newSkele.findId(lastActiveNode.node.id)
            : newSkele;
          if (newParent) {
            const base = newParent.getMovableNode();
            base.add(imageNode);
            updateSkele(
              newSkele,
              `Added image ${imageNode.uri} (${imageNode.id}) to ${base.id}`
            );
          }
        }
      } else if (file.type === 'fab') {
        const existingTab = findExistingTab(tabs, file.path);
        if (existingTab) {
          setActiveTabId(existingTab.skele.id);
          return;
        }

        const result = await loadFabContent(
          file,
          toRadians(INITIAL_VIEW_ROTATION)
        );
        if (result) {
          const {skele: newSkele, fabData} = result;
          tickSkele(newSkele);
          updateTab(newSkele, file.path, fabData);
        }
      }
    },
    [
      lastActiveNode,
      setActiveTabId,
      skele,
      tabs,
      tickSkele,
      updateSkele,
      updateTab,
    ]
  );

  const handleFileSelect = useCallback(async () => {
    const newFiles = await selectFiles();
    setAvailableFiles(prev => [...prev, ...newFiles]);
  }, []);

  useEffect(() => {
    if (gameDirectory) {
      // oxlint-disable-next-line react/set-state-in-effect -- Loading a directory asynchronously updates the file list.
      void loadDirectoryContent(gameDirectory);
    }
  }, [gameDirectory, loadDirectoryContent]);

  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(300);

  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;

    const defaultName = activeTab.name.toLowerCase().replace(/\s+/g, '_');
    const response = await showSaveDialog(defaultName);

    if (response.canceled || !response.filePath) return;

    const filePath = response.filePath;
    const fabData = serializeFabData(activeTab);

    const success = await saveFabFile(filePath, fabData);
    if (success) {
      void loadDirectoryContent(gameDirectory);
      setTabs(current =>
        current.map(tab =>
          tab.skele.id === activeTabId
            ? {...tab, filePath, fabData, isModified: false}
            : tab
        )
      );
    }
  }, [activeTab, activeTabId, gameDirectory, loadDirectoryContent, setTabs]);

  const handleSave = useCallback(async () => {
    if (!activeTab) return;

    if (!activeTab.filePath) {
      return handleSaveAs();
    }

    const fabData = serializeFabData(activeTab);

    const success = await saveFabFile(activeTab.filePath, fabData);
    if (success) {
      setTabs(current =>
        current.map(tab =>
          tab.skele.id === activeTabId
            ? {...tab, fabData, isModified: false}
            : tab
        )
      );
    }
  }, [activeTab, activeTabId, handleSaveAs, setTabs]);

  const handleExport = useCallback(() => {
    if (!activeTab) return;
    const defaultName = activeTab.name.toLowerCase().replace(/\s+/g, '_');
    exportFabFile(defaultName, serializeFabData(activeTab));
  }, [activeTab]);

  const handleNameChange = useCallback(
    (name: string) => {
      setTabs(current =>
        current.map(tab =>
          tab.skele.id === activeTabId ? {...tab, name, isModified: true} : tab
        )
      );
    },
    [activeTabId, setTabs]
  );

  // Replace transforming state with ref
  const transformingRef = useRef<{
    nodeId: string;
    type: 'rotate' | 'scale';
    startPos: vec2;
    center: vec2;
    skele: SkeleNode;
    viewport: {scale: number; rotation: number; rect: DOMRect};
  }>(undefined);

  const handleTransformStart = useCallback(
    (
      nodeId: string,
      type: 'rotate' | 'scale',
      e: React.MouseEvent,
      viewport: Viewport // Add viewport parameter
    ) => {
      const canvasRect = e.currentTarget
        .closest('.editor-canvas')
        ?.getBoundingClientRect();
      if (!canvasRect) return;

      const node = skele.findId(nodeId);
      if (!node?.parent) return;

      // Get world coordinates of the sprite's center
      const worldCenter = node.getWorldCenter();
      // Convert to screen space through viewport
      const screenCenter = viewport.worldToPage(worldCenter[0], worldCenter[1]);
      // Make coordinates relative to canvas
      const center = vec2.fromValues(
        screenCenter[0] - canvasRect.left,
        screenCenter[1] - canvasRect.top
      );

      transformingRef.current = {
        nodeId,
        type,
        startPos: vec2.fromValues(
          e.clientX - canvasRect.left,
          e.clientY - canvasRect.top
        ),
        center,
        skele,
        viewport: {
          rect: canvasRect,
          scale: viewport.scale,
          rotation: activeTab.rotation,
        },
      };

      // Use transform type and node ID as continuity key
      history.pushState(
        skele,
        `${type === 'rotate' ? 'Rotating' : 'Scaling'} node ${nodeId}`,
        `${type}_${nodeId}`
      );

      const handleTransformMove = (e: MouseEvent) => {
        const transforming = transformingRef.current;
        if (!transforming || !transforming.skele) return;

        const {skele, center, startPos, viewport} = transforming;
        const currentPos = vec2.fromValues(
          e.clientX - viewport.rect.left,
          e.clientY - viewport.rect.top
        );

        const newSkele = skele.clone();
        const newNode = newSkele.findId(transforming.nodeId);
        if (!newNode) return;

        let newVal = newNode.mag;

        if (transforming.type === 'rotate') {
          // Calculate relative vectors from center to points
          const startVec = vec2.sub(vec2.create(), startPos, center);
          const currentVec = vec2.sub(vec2.create(), currentPos, center);

          // Calculate angle between vectors
          const deltaAngle = Math.atan2(
            startVec[0] * currentVec[1] - startVec[1] * currentVec[0],
            startVec[0] * currentVec[0] + startVec[1] * currentVec[1]
          );

          newNode.rotateSprite(deltaAngle);
          newVal = newNode.rotation;
          transforming.startPos = currentPos;
        } else {
          // Calculate distances from center
          const startDist = vec2.len(vec2.sub(vec2.create(), startPos, center));
          const currentDist = vec2.len(
            vec2.sub(vec2.create(), currentPos, center)
          );

          if (startDist > 0) {
            const scaleFactor = currentDist / startDist;
            newNode.scaleSprite(scaleFactor);
            newVal = newNode.mag;
          }

          transforming.startPos = currentPos;
        }

        transforming.skele = updateSkele(
          newSkele,
          `${transforming.type === 'rotate' ? 'Rotated' : 'Scaled'} node ${
            transforming.nodeId
          } to ${newVal.toFixed(4)}`,
          `${transforming.type}_${transforming.nodeId}`
        );
      };

      const handleTransformEnd = () => {
        window.removeEventListener('mousemove', handleTransformMove);
        window.removeEventListener('mouseup', handleTransformEnd);
        transformingRef.current = undefined;
      };

      window.addEventListener('mousemove', handleTransformMove);
      window.addEventListener('mouseup', handleTransformEnd);
    },
    [activeTab.rotation, history, skele, updateSkele]
  );

  const handleEditorContextMenu = useCallback(
    (node: SkeleNode | null): MenuAction[] => {
      if (!node) return [];
      return getNodeActions({
        node,
        updateNode: updateSkele,
      });
    },
    [updateSkele]
  );

  const restoreHistoryState = useCallback(
    (state: SkeleNode, filePath?: string) => {
      const clone = state.clone();
      tickSkele(clone);
      updateTab(clone, filePath);
    },
    [tickSkele, updateTab]
  );

  useKeyboardShortcuts({
    activeTab,
    updateSkele,
    restoreState: restoreHistoryState,
    history,
  });

  const onUndo = useCallback(() => {
    const undoState = history.undo();
    if (undoState?.state) {
      restoreHistoryState(undoState.state, activeTab.filePath);
    }
  }, [activeTab.filePath, history, restoreHistoryState]);

  const onRedo = useCallback(() => {
    const redoState = history.redo();
    if (redoState?.state) {
      restoreHistoryState(redoState.state, activeTab.filePath);
    }
  }, [activeTab.filePath, history, restoreHistoryState]);

  const onHistorySelect = useCallback(
    (index: number) => {
      const entry = history.jumpToState(index);
      if (entry?.state) {
        restoreHistoryState(entry.state, activeTab.filePath);
      }
    },
    [activeTab.filePath, history, restoreHistoryState]
  );

  const onResizeLeft = useCallback(
    (delta: number) => setLeftWidth(w => Math.max(100, w + delta)),
    []
  );
  const onResizeRight = useCallback(
    (delta: number) => setRightWidth(w => Math.max(100, w - delta)),
    []
  );

  const leftPanelStyle = useMemo(() => ({width: leftWidth}), [leftWidth]);
  const rightPanelStyle = useMemo(() => ({width: rightWidth}), [rightWidth]);

  return (
    <div
      className="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
    >
      <div className="tab-container">
        <TabPane
          tabs={tabs}
          activeTabId={activeTabId}
          onNewTab={handleNewTab}
          onCloseTab={closeTab}
          onSelectTab={selectTab}
        />
      </div>
      <div className="page-header">
        <HeaderPane
          activeTab={activeTab}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onExport={browserWorkspace ? handleExport : undefined}
          onNameChange={handleNameChange}
          onRotateView={handleRotateView}
          viewRotation={activeTab?.rotation ?? 0}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          historyEntries={history.getHistoryEntries()}
          currentHistoryIndex={history.getCurrentIndex()}
          onHistorySelect={onHistorySelect}
        />
      </div>

      <div className="panes-container">
        <div className="pane left-pane" style={leftPanelStyle}>
          <FileExplorerPane
            availableFiles={availableFiles}
            activeFile={activeTab.filePath}
            gameDirectory={gameDirectory}
            onFileClick={handleFileClick}
            onFileSelect={handleFileSelect}
            onDirectorySelect={handleDirectorySelect}
            browserWorkspace={browserWorkspace}
          />
        </div>

        <Resizer onResize={onResizeLeft} />

        <div className="pane middle-pane">
          <EditorPane
            renderedInfo={activeTab.renderedInfo}
            renderedNodes={activeTab.renderedNodes}
            drawings={activeTab.fabData?.drawings}
            skele={activeTab.skele}
            activeNode={activeTab.activeNode}
            lastActiveNode={activeTab.lastActiveNode}
            focusNode={focusNode}
            gameDirectory={gameDirectory}
            onMouseDown={handleEditorMouseDown}
            onMouseMove={handleEditorMouseMove}
            onMouseUp={handleEditorMouseUp}
            spriteHolderRef={spriteHolderRef}
            rotation={activeTab.rotation}
            onTransformStart={handleTransformStart}
            onContextMenu={handleEditorContextMenu}
          />
        </div>

        <Resizer onResize={onResizeRight} />

        <div className="pane right-pane" style={rightPanelStyle}>
          <LayersPane
            renderedNodes={activeTab.skele.children}
            activeNode={activeTab.activeNode}
            lastActiveNode={activeTab.lastActiveNode}
            focusNode={focusNode}
            onNodeUpdate={updateSkele}
            skele={activeTab.skele}
            onAddNode={appendNewNode}
          />
        </div>
      </div>

      <footer className="footer">
        <div>{activeTab?.filePath ? activeTab.filePath : 'No file open'}</div>

        <div>{history?.description}</div>
      </footer>
    </div>
  );
};
