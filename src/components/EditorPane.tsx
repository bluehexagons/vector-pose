import {fromSpriteUri} from '../shared/types';
import {RenderInfo, SkeleNode} from '../utils/SkeleNode';
import {EditorCanvas, Viewport} from './EditorCanvas';
import {NodeGraphLayer} from './NodeGraphLayer';
import {SpriteLayer} from './SpriteLayer';
import './EditorPane.css';
import {GameImage} from './GameImage';

interface EditorPaneProps {
  renderedInfo: RenderInfo[];
  renderedNodes: SkeleNode[];
  activeNode?: {node: SkeleNode};
  lastActiveNode?: {node: SkeleNode};
  gameDirectory: string;
  onMouseDown: (e: React.MouseEvent, viewport: Viewport) => void;
  spriteHolderRef: React.RefObject<HTMLDivElement>;
  onMouseMove?: (e: React.MouseEvent, viewport: Viewport) => void;
  onMouseUp?: (e: React.MouseEvent, viewport: Viewport) => void;
  rotation: number;
  onTransformStart?: (nodeId: string, type: 'rotate' | 'scale') => void;
  onTransformChange?: (delta: number) => void;
  onTransformEnd?: () => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  renderedInfo,
  renderedNodes,
  activeNode,
  lastActiveNode,
  gameDirectory,
  onMouseDown,
  spriteHolderRef,
  onMouseMove,
  onMouseUp,
  rotation,
  onTransformStart,
  onTransformChange,
  onTransformEnd,
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
              renderedInfo={renderedInfo}
              activeNode={activeNode}
              lastActiveNode={lastActiveNode}
              gameDirectory={gameDirectory}
              viewport={viewport}
              spriteHolderRef={spriteHolderRef}
              onTransformStart={onTransformStart}
              onTransformChange={onTransformChange}
              onTransformEnd={onTransformEnd}
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
