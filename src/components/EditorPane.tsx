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
                  className={`${node.uri ? 'sprite-node' : 'vector-node'} ${
                    node.node.id === lastActiveNode?.node.id
                      ? 'last-active'
                      : ''
                  } ${node.node.id === activeNode?.node.id ? 'active' : ''} `}
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
                    node.id === lastActiveNode?.node.id ? 'last-active' : ''
                  } ${node.id === activeNode?.node.id ? 'active' : ''} `}
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
