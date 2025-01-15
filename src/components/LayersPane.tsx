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
    const sourceNode = skele.findIdFromRoot(data.nodeId);

    if (!sourceNode || sourceNode === node || node.id === sourceNode.id) {
      return;
    }

    try {
      const newSkele = skele.clone();
      const newSourceNode = newSkele.findIdFromRoot(data.nodeId);
      const newTargetNode = newSkele.findIdFromRoot(node.id);

      if (!newSourceNode || !newTargetNode) return;
      const dropTarget = e.target as HTMLElement;

      newSourceNode.remove();

      if (dropTarget.closest('.node-content')) {
        // Add as child at beginning
        newTargetNode.add(newSourceNode);
        // re-order after adding
        newTargetNode.children.unshift(newTargetNode.children.pop());
      } else {
        // Add as sibling
        if (newTargetNode.parent) {
          const idx = newTargetNode.parent.children.indexOf(newTargetNode);
          newTargetNode.parent.add(newSourceNode);
          // Reorder after adding
          const newIdx = newTargetNode.parent.children.indexOf(newSourceNode);
          if (newIdx !== -1) {
            newTargetNode.parent.children.splice(newIdx, 1);
            newTargetNode.parent.children.splice(
              dropTarget.closest('.node-header') ? idx : idx + 1,
              0,
              newSourceNode
            );
          }
        }
      }

      onNodeUpdate(newSkele);
    } catch (err) {
      console.error('Drop operation failed:', err);
    }
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
    const sourceNode = skele.findIdFromRoot(data.nodeId);

    if (!sourceNode || sourceNode === skele) return;

    try {
      sourceNode.remove();
      skele.add(sourceNode);
      onNodeUpdate(skele.clone());
    } catch (err) {
      console.error('Root drop operation failed:', err);
    }
  };

  console.log('current state (skele)', skele);
  console.log('current state (rendered)', renderedNodes);

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
