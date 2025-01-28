import {SkeleNode} from '../utils/SkeleNode';
import {EditorCanvas, Viewport} from './EditorCanvas';
import './EditorPane.css';
import {NodeGraphLayer} from './NodeGraphLayer';
import {SpriteLayer, SpriteLayerProps} from './SpriteLayer';

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
  ...spriteLayerProps
}) => {
  return (
    <div className="editor-pane">
      <EditorCanvas
        onCanvasMouseDown={onMouseDown}
        onCanvasMouseMove={onMouseMove}
        onCanvasMouseUp={onMouseUp}
        rotation={rotation}
      >
        {viewport => (
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
        )}
      </EditorCanvas>
    </div>
  );
};
