import {vec2} from 'gl-matrix';
import {fromSpriteUri} from '../shared/types';
import {RenderInfo, SkeleNode} from '../utils/SkeleNode';
import {EditorCanvas, Viewport} from './EditorCanvas';
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
}) => {
  const screenToWorld = (
    screenX: number,
    screenY: number,
    scale: number,
    offset: vec2
  ): vec2 => {
    // Convert screen coordinates to world coordinates
    return vec2.fromValues(
      (screenX - offset[0]) / scale,
      (screenY - offset[1]) / scale
    );
  };

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
            <div className="sprite-holder" ref={spriteHolderRef}>
              {renderedInfo.map(node => (
                <div
                  key={node.node.id}
                  className={`${
                    node.node.id === activeNode?.node.id ? 'active' : ''
                  } ${
                    node.node.id === lastActiveNode?.node.id
                      ? 'last-active'
                      : ''
                  }`}
                  style={{
                    position: 'absolute',
                    // Apply scale to positions and sizes
                    left: `${node.center[0] * viewport.scale}px`,
                    top: `${node.center[1] * viewport.scale}px`,
                    width: `${node.transform[0] * viewport.scale}px`,
                    height: `${node.transform[1] * viewport.scale}px`,
                    transform: `translate(-50%, -50%) rotate(${
                      node.direction + 90
                    }deg)`,
                    outline: '1px solid rgba(255,255,255,0.1)',
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
                  key={node.id || index}
                  className={`node-label ${
                    node === activeNode?.node ? 'active' : ''
                  }`}
                  style={{
                    position: 'absolute',
                    // Apply scale to positions
                    left: `${node.state.mid.transform[0] * viewport.scale}px`,
                    top: `${node.state.mid.transform[1] * viewport.scale}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {node.id ? node.id : `node #${index + 1}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </EditorCanvas>
    </div>
  );
};
