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
import {useTabs} from './hooks/useTabs';
import {useHistory} from './hooks/useHistory';
import {
  createImageNode,
  findExistingTab,
  loadFabContent,
} from './services/contentService';
import {
  loadDirectoryFiles,
  saveFabFile,
  selectDirectory,
  selectFiles,
  showSaveDialog,
} from './services/fileService';
import {FileEntry, UiNode} from './shared/types';
import {toDegrees, toRadians} from './utils/Equa';
import type {ImagePropsRef} from './utils/Renderer';
import {SkeleNode} from './utils/SkeleNode';
import {getNodeActions} from './utils/nodeActions';
import {MenuAction} from './components/ContextMenu';

const INITIAL_SIZE = 1;
const INITIAL_ROTATION = 0;
const INITIAL_OBJECT_POSITION = vec2.fromValues(0, 0);
const INITIAL_VIEW_ROTATION = 270;

const deduper = (props: ImagePropsRef) => props;

const createDefaultSkele = () =>
  SkeleNode.fromData({angle: 0, mag: 1, children: [{angle: 0, mag: 0}]});

const preventDefault = (e: React.SyntheticEvent) => e.preventDefault();

let atomicCounter = 0;

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
    setRotation,
  } = useTabs();

  const spriteHolderRef = useRef<HTMLDivElement>(null);

  const [gameDirectory, setGameDirectory] = useState(
    () => localStorage.getItem('gameDirectory') || './'
  );

  // Add clickOffset to dragStart state
  const [dragStart, setDragStart] = useState<{
    worldPos: vec2;
    clickOffset: vec2;
  }>();

  const [time, setTime] = useState(1);

  const skele = activeTab.skele;
  const history = useHistory(skele, activeTabId);

  const handleRotateView = (degrees: number) => {
    // Allow any angle, just normalize display to 0-360
    const normalized = ((degrees % 360) + 360) % 360;

    setRotation(activeTabId, normalized);

    // Apply rotation to skele
    const clone = skele.clone();
    clone.rotation = toRadians(normalized);
    updateSkele(clone);
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
  ) => {
    if (!activeTab?.skele) return undefined;
    const closest = activeTab.skele.findClosestNode(worldX, worldY, targetSize);
    const priorityNode = lastActiveNode;
    if (
      priorityNode &&
      closest &&
      vec2.dist(
        closest.getMovableNode().state.transform,
        priorityNode.node.state.transform
      ) < 0.01
    ) {
      return priorityNode.node;
    }
    return closest;
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

  const updateSkele = (
    base: SkeleNode,
    description?: string,
    continuityKey?: string
  ) => {
    if (!activeTab) return base;

    const clone = base.clone(null);
    tickSkele(clone);
    updateTab(clone, activeTab.filePath);

    if (description) {
      history.pushState(clone, description, continuityKey);
    }

    return clone;
  };

  // Replace handleNewTab, handleCloseTab, handleSelectTab with hook methods
  const handleNewTab = () => {
    const skele = createDefaultSkele();
    skele.rotation = toRadians(INITIAL_VIEW_ROTATION);
    tickSkele(skele);
    addNewTab(skele);
  };
  const handleCloseTab = (tabId: string) => {
    history.clearHistory();
    closeTab(tabId);
  };
  const handleSelectTab = selectTab;

  const [availableFiles, setAvailableFiles] = useState<FileEntry[]>([]);

  const [lastActiveNode, setLastActiveNode] = useState<UiNode | undefined>(
    undefined
  );

  const [activeNode, setActiveNode] = useState<UiNode | undefined>(undefined);

  const focusNode = (node: UiNode) => {
    console.trace('changing focused node');
    setLastActiveNode(node);
    setActiveNode(undefined);
  };

  const appendNewNode = () => {
    const base = skele.clone();
    const newParent = lastActiveNode
      ? base.findId(lastActiveNode.node.id)
      : base;
    if (newParent) {
      newParent.getMovableNode().add(
        SkeleNode.fromData({
          angle: 0,
          mag: 0,
        })
      );
    }

    updateSkele(base);
  };

  // Modify handleEditorMouseUp to match new dragStart type
  const handleEditorMouseUp = () => {
    if (!dragStart || !activeNode) {
      return;
    }

    setLastActiveNode(activeNode);
    setActiveNode(undefined);
  };

  const handleNodeSelection = (
    node: UiNode,
    e: React.MouseEvent,
    worldPos: vec2
  ) => {
    const nodePos = node.node.getMovableNode().state.transform;
    // Calculate offset from node center to click position
    const clickOffset = vec2.fromValues(
      worldPos[0] - nodePos[0],
      worldPos[1] - nodePos[1]
    );

    setDragStart({worldPos, clickOffset});
    setActiveNode({node: node.node});
    setLastActiveNode(undefined);
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
      atomicCounter++;
      handleNodeSelection({node: closestNode}, e, worldPos);
    } else {
      focusNode(undefined);
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent, viewport: Viewport) => {
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
        `drag_${activeNode.node.id}_${atomicCounter}`
      );
    }
  };

  const loadDirectoryContent = async (directory: string) => {
    const files = await loadDirectoryFiles(directory);
    setAvailableFiles(files);
  };

  const handleDirectorySelect = async () => {
    const newDir = await selectDirectory();
    if (newDir) {
      setGameDirectory(newDir);
      localStorage.setItem('gameDirectory', newDir);
      await loadDirectoryContent(newDir);
    }
  };

  const handleFileClick = async (file: FileEntry) => {
    if (file.type === 'image') {
      const imageNode = createImageNode(file);
      if (imageNode) {
        const newSkele = skele.clone();

        const newParent = lastActiveNode
          ? newSkele.findId(lastActiveNode.node.id)
          : newSkele;
        if (newParent) {
          newParent.getMovableNode().add(imageNode);
        }
        updateSkele(newSkele);
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
  };

  const handleFileSelect = async () => {
    const newFiles = await selectFiles();
    setAvailableFiles(prev => [...prev, ...newFiles]);
  };

  useEffect(() => {
    if (gameDirectory) {
      loadDirectoryContent(gameDirectory);
    }
  }, [gameDirectory]);

  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(300);

  const handleSave = async () => {
    if (!activeTab) return;

    if (!activeTab.filePath) {
      return handleSaveAs();
    }

    const fabData = {
      name: activeTab.name,
      skele: activeTab.skele.toData(),
    };

    // overwrite camera-modified values to their originals
    fabData.skele.angle = 0;
    fabData.skele.mag = 1;

    const success = await saveFabFile(activeTab.filePath, fabData);
    if (success) {
      setTabs(current =>
        current.map(tab =>
          tab.skele.id === activeTabId ? {...tab, isModified: false} : tab
        )
      );
    }
  };

  const handleSaveAs = async () => {
    if (!activeTab) return;

    const defaultName = activeTab.name.toLowerCase().replace(/\s+/g, '_');
    const response = await showSaveDialog(defaultName);

    if (response.canceled || !response.filePath) return;

    const filePath = response.filePath;
    const fabData = {
      name: activeTab.name,
      description: activeTab.description,
      skele: activeTab.skele.toData(),
    };

    // overwrite camera-modified values to their originals
    fabData.skele.angle = 0;
    fabData.skele.mag = 1;

    const success = await saveFabFile(filePath, fabData);
    if (success) {
      setTabs(current =>
        current.map(tab =>
          tab.skele.id === activeTabId
            ? {...tab, filePath, isModified: false}
            : tab
        )
      );
    }
  };

  const handleNameChange = (name: string) => {
    setTabs(current =>
      current.map(tab =>
        tab.skele.id === activeTabId ? {...tab, name, isModified: true} : tab
      )
    );
  };

  // Replace transforming state with ref
  const transformingRef = useRef<{
    nodeId: string;
    type: 'rotate' | 'scale';
    startPos: vec2;
    center: vec2;
    skele: SkeleNode;
    viewport: {scale: number; rotation: number; rect: DOMRect};
  }>(undefined);

  const handleTransformStart = (
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
        }

        transforming.startPos = currentPos;
      }

      transforming.skele = updateSkele(
        newSkele,
        `${transforming.type === 'rotate' ? 'Rotated' : 'Scaled'} node ${
          transforming.nodeId
        }`,
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
  };

  const handleEditorContextMenu = (
    node: SkeleNode | null,
    e: React.MouseEvent,
    viewport: Viewport
  ): MenuAction[] => {
    if (!node) return [];
    return getNodeActions({
      node,
      updateNode: updateSkele,
    });
  };

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!activeTab) return;

      const keyName = e.key.toLocaleLowerCase();

      if (e.ctrlKey || e.metaKey) {
        if (keyName === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            const redoState = history.redo();
            if (redoState) {
              updateTab(redoState, activeTab.filePath);
            }
          } else {
            const undoState = history.undo();
            if (undoState) {
              updateTab(undoState, activeTab.filePath);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [activeTab, history]);

  return (
    <div
      className="container"
      onContextMenu={preventDefault}
      onSelect={preventDefault}
    >
      <div className="page-header">
        <HeaderPane
          activeTab={activeTab}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onNameChange={handleNameChange}
          onRotateView={handleRotateView}
          viewRotation={activeTab?.rotation ?? 0}
          onUndo={() => {
            const undoState = history.undo();
            if (undoState) {
              updateTab(undoState, activeTab.filePath);
            }
          }}
          onRedo={() => {
            const redoState = history.redo();
            if (redoState) {
              updateTab(redoState, activeTab.filePath);
            }
          }}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          historyEntries={history.getHistoryEntries()}
          currentHistoryIndex={history.getCurrentIndex()}
          onHistorySelect={index => {
            const entries = history.getHistoryEntries();
            if (index < entries.length) {
              const targetState = entries[index].state;
              updateTab(targetState, activeTab.filePath);
              // Optionally update history state here if needed
            }
          }}
        />
      </div>

      <div className="tab-container">
        <TabPane
          tabs={tabs}
          activeTabId={activeTabId}
          onNewTab={handleNewTab}
          onCloseTab={handleCloseTab}
          onSelectTab={handleSelectTab}
        />
      </div>

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

        <Resizer
          onResize={delta => setRightWidth(w => Math.max(100, w - delta))}
        />

        <div className="pane right-pane" style={{width: rightWidth}}>
          <LayersPane
            renderedNodes={activeTab?.skele.children ?? []}
            activeNode={activeNode}
            lastActiveNode={lastActiveNode}
            focusNode={focusNode}
            onNodeUpdate={updateSkele}
            skele={activeTab?.skele ?? new SkeleNode()}
            onAddNode={appendNewNode}
          />
        </div>
      </div>

      <footer className="footer">
        {activeTab?.filePath ? activeTab.filePath : 'No file open'}
      </footer>
    </div>
  );
};
