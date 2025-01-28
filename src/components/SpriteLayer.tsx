import type {RenderInfo} from '../utils/SkeleNode';
import type {UiNode} from '../shared/types';
import type {Viewport} from './EditorCanvas';
import {GameImage} from './GameImage';
import {fromSpriteUri} from '../shared/types';
import './SpriteLayer.css';

interface SpriteLayerProps {
  renderedInfo: RenderInfo[];
  activeNode?: UiNode;
  lastActiveNode?: UiNode;
  gameDirectory: string;
  viewport: Viewport;
  spriteHolderRef: React.RefObject<HTMLDivElement>;
  onTransformStart?: (nodeId: string, type: 'rotate' | 'scale') => void;
  onTransformChange?: (delta: number) => void;
  onTransformEnd?: () => void;
}

export const SpriteLayer: React.FC<SpriteLayerProps> = ({
  renderedInfo,
  activeNode,
  lastActiveNode,
  gameDirectory,
  viewport,
  spriteHolderRef,
  onTransformStart,
  onTransformChange,
  onTransformEnd,
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
            } ${isActive ? 'active' : ''}`}
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
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: node.node.hidden ? 0.5 : 1,
                  }}
                />
                {isActive && (
                  <div className="transform-controls">
                    <div
                      className="rotate-handle"
                      onMouseDown={e => {
                        e.stopPropagation();
                        onTransformStart?.(node.node.id, 'rotate');
                      }}
                    />
                    <div
                      className="scale-handle"
                      onMouseDown={e => {
                        e.stopPropagation();
                        onTransformStart?.(node.node.id, 'scale');
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
