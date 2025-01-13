import React from 'react';
import {toDegrees, toRadians} from '../utils/Equa';
import {SkeleNode} from '../utils/SkeleNode';
import {AngleInput} from './AngleInput';
import './LayersPane.css';

interface LayersPaneProps {
  renderedNodes: SkeleNode[];
  activeNode?: {node: SkeleNode};
  onNodeUpdate: (skele: SkeleNode) => void;
  skele: SkeleNode;
  onPushCurrentFiles: () => void;
}

const NodeItem: React.FC<{
  node: SkeleNode;
  index: number;
  depth?: number;
  isActive: boolean;
  onNodeUpdate: (skele: SkeleNode) => void;
  skele: SkeleNode;
}> = ({node, index, depth = 0, isActive, onNodeUpdate, skele}) => {
  return (
    <div className="node-wrapper" style={{marginLeft: `${depth * 16}px`}}>
      <div className={`node-item ${isActive ? 'active' : ''}`}>
        <div className="node-header">
          <span className="node-title">Node #{index + 1}</span>
          {node.id && <span className="node-id">({node.id})</span>}
        </div>
        <div className="node-content">
          <div className="input-group">
            <label>Angle:</label>
            <AngleInput
              value={toDegrees(node.rotation)}
              onChange={v => {
                node.rotation = toRadians(v);
                node.updateTransform();
                onNodeUpdate(skele.clone());
              }}
            />
          </div>
          <div className="input-group">
            <label>Magnitude:</label>
            <input
              type="number"
              className="number-input"
              value={node.mag}
              onChange={evt => {
                node.mag = parseFloat(evt.target.value) || 0;
                node.updateTransform();
                onNodeUpdate(skele.clone());
              }}
            />
          </div>
          <div className="input-group">
            <label>URI:</label>
            <input
              type="text"
              className="text-input"
              value={node.uri || ''}
              onChange={evt => {
                node.uri = evt.target.value || null;
                onNodeUpdate(skele.clone());
              }}
            />
          </div>
        </div>
      </div>
      {node.children.map((child, childIndex) => (
        <NodeItem
          key={childIndex}
          node={child}
          index={childIndex}
          depth={depth + 1}
          isActive={false}
          onNodeUpdate={onNodeUpdate}
          skele={skele}
        />
      ))}
    </div>
  );
};

export const LayersPane: React.FC<LayersPaneProps> = ({
  renderedNodes,
  activeNode,
  onNodeUpdate,
  skele,
  onPushCurrentFiles,
}) => (
  <div className="layers-pane">
    <div className="nodes-container">
      <div className="pane-header">
        <h2>Nodes</h2>
        <button
          className="add-node"
          onClick={onPushCurrentFiles}
          title="Add Node"
        >
          +
        </button>
      </div>
      <div className="node-tree">
        {renderedNodes.map((node, index) => (
          <NodeItem
            key={index}
            node={node}
            index={index}
            isActive={node === activeNode?.node}
            onNodeUpdate={onNodeUpdate}
            skele={skele}
          />
        ))}
      </div>
    </div>
  </div>
);
