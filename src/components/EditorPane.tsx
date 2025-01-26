import {vec2} from 'gl-matrix';
import {fromSpriteUri} from '../shared/types';
import {RenderInfo, SkeleNode} from '../utils/SkeleNode';
import {EditorCanvas} from './EditorCanvas';
import './EditorPane.css';
import {GameImage} from './GameImage';

interface EditorPaneProps {
  renderedInfo: RenderInfo[];
  renderedNodes: any[];
  activeNode?: any;
  gameDirectory: string;
  onMouseDown: (e: React.MouseEvent) => void;
  spriteHolderRef: React.RefObject<HTMLDivElement>;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  renderedInfo,
  renderedNodes,
  activeNode,
  gameDirectory,
  onMouseDown,
  spriteHolderRef,
}) => {
  return (
    <div className="editor-pane">
      <EditorCanvas>
        {({scale, offset}) => (
          <div className="editor-content">
            <div
              className="sprite-holder"
              ref={spriteHolderRef}
              onMouseDown={onMouseDown}
            >
              {renderedInfo.map(node => (
                <div
                  key={node.node.id}
                  className={node.node === activeNode?.node ? 'active' : ''}
                  style={{
                    position: 'absolute',
                    // Apply scale to positions and sizes
                    left: `${node.center[0] * scale}px`,
                    top: `${node.center[1] * scale}px`,
                    width: `${node.transform[0] * scale}px`,
                    height: `${node.transform[1] * scale}px`,
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
                    left: `${node.state.mid.transform[0] * scale}px`,
                    top: `${node.state.mid.transform[1] * scale}px`,
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
