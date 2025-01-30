import React from 'react';
import {SkeleNode} from '../utils/SkeleNode';
import './LayersPane.css';
import {NodeItem} from './NodeItem';
import {UiNode} from '../shared/types';

interface LayersPaneProps {
  renderedNodes: SkeleNode[];
  activeNode?: {node: SkeleNode};
  lastActiveNode?: {node: SkeleNode};
  onNodeUpdate: (
    skele: SkeleNode,
    description?: string,
    continuityKey?: string
  ) => void;
  skele: SkeleNode;
  onAddNode: () => void;
  focusNode: (node: UiNode) => void;
}

export const LayersPane: React.FC<LayersPaneProps> = ({
  renderedNodes,
  activeNode,
  lastActiveNode,
  onNodeUpdate,
  skele,
  onAddNode,
  focusNode,
}) => {
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!data.nodeId) return;

    const original = skele.findIdFromRoot(data.nodeId);
    if (!original || original === skele) return;

    const clone = skele.clone();
    const sourceNode = clone.findIdFromRoot(data.nodeId);

    try {
      sourceNode.remove();
      clone.add(sourceNode);
      onNodeUpdate(
        clone,
        `Dragged node ${sourceNode.id} to #ROOT (${clone.id})`
      );
    } catch (err) {
      console.warn('Root drop operation failed:', err);
    }
  };

  return (
    <div className="layers-pane">
      <div className="nodes-container">
        <div className="pane-header title">
          <h2>Nodes</h2>
          <button className="add-node" onClick={onAddNode} title="Add Node">
            +
          </button>
        </div>
        <div
          className="node-tree"
          onDragOver={handleRootDragOver}
          onDragLeave={handleRootDragLeave}
          onDrop={handleRootDrop}
        >
          {renderedNodes.map((node, index) => (
            <NodeItem
              key={index}
              node={node}
              index={index}
              onNodeUpdate={onNodeUpdate}
              activeNode={activeNode?.node}
              lastActiveNode={lastActiveNode?.node}
              focusNode={focusNode}
              skele={skele}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
