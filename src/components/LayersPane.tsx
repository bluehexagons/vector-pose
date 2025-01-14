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

    console.log('Drop operation:', {
      sourceNodeId: sourceNode?.id,
      targetNodeId: node.id,
      sourceParentId: sourceNode?.parent?.id,
      targetParentId: node.parent?.id,
    });

    if (!sourceNode || sourceNode === node || node.id === sourceNode.id) {
      console.log('Invalid drop operation');
      return;
    }

    const dropTarget = e.target as HTMLElement;
    const isHeader = dropTarget.closest('.node-header');
    const isContent = dropTarget.closest('.node-content');

    try {
      // Create new clone to avoid reference issues
      const newSkele = skele.clone();
      const newSourceNode = newSkele.findIdOfRoot(data.nodeId);
      const newTargetNode = newSkele.findIdOfRoot(node.id);

      if (!newSourceNode || !newTargetNode) {
        console.error('Failed to find nodes in cloned tree');
        return;
      }

      if (isContent) {
        newSourceNode.remove();
        newTargetNode.add(newSourceNode);
      } else {
        newSourceNode.remove();
        if (newTargetNode.parent) {
          const idx = newTargetNode.parent.children.indexOf(newTargetNode);
          newSourceNode.parent = newTargetNode.parent;
          newTargetNode.parent.children.splice(
            isHeader ? idx : idx + 1,
            0,
            newSourceNode
          );
        }
      }

      console.log('Tree state after operation:', newSkele);
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
    const sourceNode = skele.findIdOfRoot(data.nodeId);

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
