import type {SkeleNode} from '../utils/SkeleNode';
import type {UiNode} from '../shared/types';
import type {Viewport} from './EditorCanvas';

interface NodeGraphLayerProps {
  renderedNodes: SkeleNode[];
  activeNode?: UiNode;
  lastActiveNode?: UiNode;
  viewport: Viewport;
}

export const NodeGraphLayer: React.FC<NodeGraphLayerProps> = ({
  renderedNodes,
  activeNode,
  lastActiveNode,
  viewport,
}) => {
  return (
    <div className="node-graph">
      {renderedNodes.map((node, index) => (
        <div
          key={node.id || index}
          className={`node-label ${
            node.id === activeNode?.node.id
              ? 'active'
              : node.id === lastActiveNode?.node.id
              ? 'last-active'
              : ''
          }`}
          style={{
            position: 'absolute',
            left: `${
              (node.uri ? node.parent : node).state.mid.transform[0] *
              viewport.scale
            }px`,
            top: `${
              (node.uri ? node.parent : node).state.mid.transform[1] *
              viewport.scale
            }px`,
            marginTop: node.uri ? '2em' : '0',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {node.id ? node.id : `node #${index + 1}`}
        </div>
      ))}
    </div>
  );
};
