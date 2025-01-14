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
  onAddNode: () => void;
}

const NodeItem: React.FC<{
  node: SkeleNode;
  index: number;
  depth?: number;
  isActive: boolean;
  onNodeUpdate: (skele: SkeleNode) => void;
  skele: SkeleNode;
}> = ({node, index, depth = 0, isActive, onNodeUpdate, skele}) => {
  const handleDragStart = (e: React.DragEvent) => {
    console.log(e);
    if (e.currentTarget.tagName === 'INPUT') return;

    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        nodeId: node.id,
        parentId: node.parent?.id,
        index,
      })
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dropTarget = e.target as HTMLElement;
    const isHeader = dropTarget.closest('.node-header');
    const isContent = dropTarget.closest('.node-content');

    e.currentTarget.classList.add(
      'drag-over',
      isHeader
        ? 'drag-over-above'
        : isContent
        ? 'drag-over-content'
        : 'drag-over-below'
    );
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(
      'drag-over',
      'drag-over-above',
      'drag-over-content',
      'drag-over-below'
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    handleDragLeave(e);

    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const sourceNode = skele.findIdOfRoot(data.nodeId);

    if (sourceNode === node) return;

    sourceNode.remove();

    const dropTarget = e.target as HTMLElement;
    const isHeader = dropTarget.closest('.node-header');
    const isContent = dropTarget.closest('.node-content');

    console.log('drop thing');

    // Add to new parent
    if (isContent) {
      // Drop as child
      node.add(sourceNode); // Add to children
      node.children.unshift(node.children.pop());
    } else {
      // Drop as sibling
      node.parent.add(sourceNode);
      node.parent.children.pop();
      const idx = node.parent.children.indexOf(node);
      node.parent.children.splice(isHeader ? idx : idx + 1, 0, sourceNode);
    }

    onNodeUpdate(skele.clone());
  };

  return (
    <div
      className="node-wrapper"
      style={{marginLeft: `${depth * 16}px`}}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`node-item ${isActive ? 'active' : ''}`}>
        <div className="node-header">
          <span className="node-title">
            {node.id ? node.id : `node #${index + 1}`}
          </span>
        </div>
        <div
          className="node-content"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="input-group">
            <label>Angle:</label>
            <AngleInput
              value={toDegrees(node.rotation)}
              draggable={false}
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
              draggable={false}
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
              draggable={false}
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
  onAddNode,
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
    const sourceNode = skele.findIdOfRoot(data.nodeId);

    console.log('root drop');

    sourceNode.remove();

    skele.add(sourceNode);
    onNodeUpdate(skele.clone());
  };

  console.log('current state', skele);
  console.log('current state', renderedNodes);

  return (
    <div className="layers-pane">
      <div className="nodes-container">
        <div className="pane-header">
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
              isActive={node === activeNode?.node}
              onNodeUpdate={onNodeUpdate}
              skele={skele}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
