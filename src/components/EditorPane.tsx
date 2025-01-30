import {useState} from 'react';
import {UiNode} from '../shared/types';
import {findClosestNode} from '../utils/nodeHitDetection';
import {SkeleNode} from '../utils/SkeleNode';
import {ContextMenu, MenuAction} from './ContextMenu';
import {EditorCanvas, Viewport} from './EditorCanvas';
import './EditorPane.css';
import {NodeGraphLayer} from './NodeGraphLayer';
import {SpriteLayer, SpriteLayerProps} from './SpriteLayer';
import {vec2} from 'gl-matrix';

interface EditorPaneProps
  extends Pick<
    SpriteLayerProps,
    'renderedInfo' | 'gameDirectory' | 'spriteHolderRef' | 'onTransformStart'
  > {
  renderedNodes: SkeleNode[];
  activeNode?: {node: SkeleNode};
  lastActiveNode?: {node: SkeleNode};
  onMouseDown: (e: React.MouseEvent, viewport: Viewport) => void;
  spriteHolderRef: React.RefObject<HTMLDivElement>;
  onMouseMove?: (e: React.MouseEvent, viewport: Viewport) => void;
  onMouseUp?: (e: React.MouseEvent, viewport: Viewport) => void;
  rotation: number;
  onContextMenu?: (
    node: SkeleNode | null,
    e: React.MouseEvent,
    viewport: Viewport
  ) => MenuAction[];
  focusNode: (node: UiNode) => void;
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

  return (
    <div className="editor-pane">
      <EditorCanvas
        onCanvasMouseDown={onMouseDown}
        onCanvasMouseMove={onMouseMove}
        onCanvasMouseUp={onMouseUp}
        rotation={rotation}
        onContextMenu={handleContextMenu}
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
    </div>
  );
};
