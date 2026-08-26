import {vec2} from 'gl-matrix';
import {useState} from 'react';
import {UiNode} from '../shared/types';
import {findClosestNode} from '../utils/nodeHitDetection';
import {SkeleNode} from '../utils/SkeleNode';
import {ContextMenu, MenuAction} from './ContextMenu';
import {EditorCanvas, Viewport} from './EditorCanvas';
import './EditorPane.css';
import {NodeGraphLayer} from './NodeGraphLayer';
import type {NodeLabelMode} from './SettingsScreen';
import {SpriteLayer, SpriteLayerProps} from './SpriteLayer';

interface EditorPaneProps extends Pick<
  SpriteLayerProps,
  | 'renderedInfo'
  | 'gameDirectory'
  | 'spriteHolderRef'
  | 'onTransformStart'
  | 'drawings'
  | 'skele'
> {
  renderedNodes: SkeleNode[];
  activeNode?: {node: SkeleNode};
  lastActiveNode?: {node: SkeleNode};
  onMouseDown: (e: React.MouseEvent, viewport: Viewport) => void;
  spriteHolderRef: React.RefObject<HTMLDivElement | null>;
  onMouseMove?: (e: React.MouseEvent, viewport: Viewport) => void;
  onMouseUp?: (e: React.MouseEvent, viewport: Viewport) => void;
  rotation: number;
  onContextMenu?: (
    node: SkeleNode | null,
    e: React.MouseEvent,
    viewport: Viewport
  ) => MenuAction[];
  focusNode: (node?: UiNode) => void;
  onAddNode: () => void;
  onShowDrawings: () => void;
  onShowWelcome: () => void;
  defaultCanvasZoom: number;
  showCanvasGrid: boolean;
  showCanvasNavigationHint: boolean;
  nodeLabelMode: NodeLabelMode;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  renderedNodes,
  activeNode,
  lastActiveNode,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  rotation,
  onTransformStart,
  onContextMenu,
  focusNode,
  onAddNode,
  onShowDrawings,
  onShowWelcome,
  defaultCanvasZoom,
  showCanvasGrid,
  showCanvasNavigationHint,
  nodeLabelMode,
  ...spriteLayerProps
}) => {
  const [contextMenu, setContextMenu] = useState<{
    actions: MenuAction[];
    position: {x: number; y: number};
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, viewport: Viewport) => {
    e.preventDefault();
    if (!onContextMenu) return;

    const worldPos = viewport.pageToWorld(e.pageX, e.pageY);
    // Use the more accurate findClosestNode utility
    let targetNode = findClosestNode(worldPos, renderedNodes, viewport);

    const priorityNode = lastActiveNode;
    if (
      priorityNode &&
      targetNode &&
      vec2.dist(
        targetNode.getMovableNode().state.transform,
        priorityNode.node.state.transform
      ) < 0.01
    ) {
      targetNode = priorityNode.node;
    }

    if (targetNode) {
      const actions = onContextMenu(targetNode, e, viewport);
      if (actions.length > 0) {
        setContextMenu({
          actions,
          position: {
            x: e.clientX,
            y: e.clientY,
          },
        });
        focusNode({node: targetNode});
      }
    }
  };

  const isBlankProject =
    (spriteLayerProps.drawings?.length ?? 0) === 0 &&
    !spriteLayerProps.renderedInfo.some(info => info.uri) &&
    renderedNodes.length <= 1;

  return (
    <div className="editor-pane">
      <EditorCanvas
        key={defaultCanvasZoom}
        onCanvasMouseDown={onMouseDown}
        onCanvasMouseMove={onMouseMove}
        onCanvasMouseUp={onMouseUp}
        rotation={rotation}
        onContextMenu={handleContextMenu}
        defaultScale={defaultCanvasZoom}
        showGrid={showCanvasGrid}
        showNavigationHint={showCanvasNavigationHint}
      >
        {viewport => (
          <>
            <div className="editor-content">
              <SpriteLayer
                activeNode={activeNode}
                lastActiveNode={lastActiveNode}
                viewport={viewport}
                onTransformStart={(nodeId, type, e) =>
                  onTransformStart?.(nodeId, type, e, viewport)
                }
                {...spriteLayerProps}
              />
              <NodeGraphLayer
                renderedNodes={renderedNodes}
                activeNode={activeNode}
                lastActiveNode={lastActiveNode}
                viewport={viewport}
                labelMode={nodeLabelMode}
              />
            </div>
            {contextMenu && (
              <ContextMenu
                actions={contextMenu.actions}
                position={contextMenu.position}
                onClose={() => setContextMenu(null)}
              />
            )}
          </>
        )}
      </EditorCanvas>
      {isBlankProject && (
        <div className="editor-empty-state">
          <div className="editor-empty-graphic" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>Build your first pose</h2>
          <p>
            Add joints to form a rig, then connect vector paths to those points.
          </p>
          <div className="editor-empty-actions">
            <button type="button" onClick={onAddNode}>
              + Add joint
            </button>
            <button type="button" onClick={onShowDrawings}>
              Create drawing
            </button>
          </div>
          <button
            type="button"
            className="editor-empty-examples"
            onClick={onShowWelcome}
          >
            Or explore an example →
          </button>
        </div>
      )}
    </div>
  );
};
