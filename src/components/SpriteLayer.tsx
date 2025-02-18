import type {UiNode} from '../shared/types';
import {fromSpriteUri} from '../shared/types';
import type {RenderInfo} from '../utils/SkeleNode';
import type {Viewport} from './EditorCanvas';
import {GameImage} from './GameImage';
import './SpriteLayer.css';

export interface SpriteLayerProps {
  renderedInfo: RenderInfo[];
  activeNode?: UiNode;
  lastActiveNode?: UiNode;
  gameDirectory: string;
  viewport: Viewport;
  spriteHolderRef: React.RefObject<HTMLDivElement>;
  onTransformStart?: (
    nodeId: string,
    type: 'rotate' | 'scale',
    e: React.MouseEvent,
    viewport: Viewport // Add viewport parameter
  ) => void;
}

export const SpriteLayer: React.FC<SpriteLayerProps> = ({
  renderedInfo,
  activeNode,
  lastActiveNode,
  gameDirectory,
  viewport,
  spriteHolderRef,
  onTransformStart,
}) => {
  return (
    <div className="sprite-holder" ref={spriteHolderRef}>
      {renderedInfo.map(node => {
        const isActive =
          node.node.id === lastActiveNode?.node.id &&
          node.node.id !== activeNode?.node.id;

        return (
          <div
            key={node.node.id}
            className={`${node.uri ? 'sprite-node' : 'vector-node'} ${
              node.node.id === lastActiveNode?.node.id ? 'last-active' : ''
            } ${node.node.id === activeNode?.node.id ? 'active' : ''}`}
            style={{
              position: 'absolute',
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
              <>
                <GameImage
                  uri={fromSpriteUri(node.uri)}
                  gameDirectory={gameDirectory}
                  className="sprite-image"
                  style={{
                    opacity: node.node.hidden ? 0.5 : 1,
                  }}
                />
                {isActive && (
                  <div className="transform-controls">
                    <div
                      className="rotate-handle"
                      onMouseDown={e => {
                        e.stopPropagation();
                        onTransformStart?.(node.node.id, 'rotate', e, viewport);
                      }}
                    />
                    <div
                      className="scale-handle"
                      onMouseDown={e => {
                        e.stopPropagation();
                        onTransformStart?.(node.node.id, 'scale', e, viewport);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
