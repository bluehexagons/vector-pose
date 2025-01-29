import React, {useState} from 'react';
import {UiNode} from '../shared/types';
import {toDegrees, toRadians} from '../utils/Equa';
import {SkeleNode} from '../utils/SkeleNode';
import {AngleInput} from './AngleInput';
import {MenuAction} from './ContextMenu';
import {KebabMenu} from './KebabMenu';
import {NumberInput} from './NumberInput';
import './NodeItem.css';
import {getNodeActions} from '../utils/nodeActions';

interface NodeItemProps {
  node: SkeleNode;
  activeNode: SkeleNode;
  lastActiveNode: SkeleNode;
  focusNode: (node: UiNode) => void;
  index: number;
  depth?: number;
  onNodeUpdate: (skele: SkeleNode) => void;
  skele: SkeleNode;
}

export const NodeItem: React.FC<NodeItemProps> = ({
  activeNode,
  lastActiveNode,
  node,
  index,
  depth = 0,
  onNodeUpdate,
  focusNode,
  skele,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isShrunken, setIsShrunken] = useState(true);

  const handleDragStart = (e: React.DragEvent) => {
    // Prevent dragging from input elements or content area
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.closest('.node-content') ||
      !target.closest('.node-header')
    ) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        nodeId: node.id,
        parentId: node.parent?.id,
        index,
      })
    );

    e.stopPropagation();
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
    const targetNode = node;

    // Add validation for circular references
    if (!sourceNode || !targetNode || sourceNode === targetNode) {
      console.warn('Invalid drop operation');
      return;
    }

    const clone = skele.clone();
    const newSourceNode = clone.findIdFromRoot(data.nodeId);
    const newTargetNode = clone.findIdFromRoot(node.id);

    if (!newSourceNode || !newTargetNode) return;

    try {
      const dropTarget = e.target as HTMLElement;
      newSourceNode.remove();

      if (dropTarget.closest('.node-content')) {
        newTargetNode.add(newSourceNode);
        newTargetNode.children.unshift(newTargetNode.children.pop()!);
      } else {
        const parent = newTargetNode.parent;
        if (!parent) return;

        const idx = parent.children.indexOf(newTargetNode);
        parent.add(newSourceNode);

        // Move to correct position
        const newIdx = parent.children.indexOf(newSourceNode);
        if (newIdx !== -1) {
          parent.children.splice(newIdx, 1);
          parent.children.splice(
            dropTarget.closest('.node-header') ? idx : idx + 1,
            0,
            newSourceNode
          );
        }
      }

      onNodeUpdate(clone);
    } catch (err) {
      console.warn('Drop operation failed:', err);
    }
  };

  const renderActions = () => (
    <div className="node-actions">
      <KebabMenu
        actions={getNodeActions({
          node,
          updateNode: onNodeUpdate,
          isCollapsed,
          isShrunken,
          onToggleCollapse: () => setIsCollapsed(!isCollapsed),
          onToggleShrunken: () => setIsShrunken(!isShrunken),
        })}
      />
    </div>
  );

  return (
    <div
      className={`node-wrapper ${isCollapsed ? 'collapsed' : ''} ${
        isShrunken ? 'shrunken' : ''
      }`}
      style={{marginLeft: `${depth * 16}px`}}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerDown={e => {
        focusNode({node});
        e.stopPropagation();
      }}
    >
      <div
        className={`node-item ${
          node.id === activeNode?.id
            ? 'active'
            : node.id === lastActiveNode?.id
            ? 'last-active'
            : ''
        } ${node.hidden ? 'hidden' : ''}`}
      >
        <div className="node-header" draggable onDragStart={handleDragStart}>
          <span className="node-title">
            <span className="collapse-indicator">
              {node.children.length > 0 ? (isCollapsed ? '►' : '▼') : ''}
            </span>
            {node.id ? node.id : `node #${index + 1}`}
          </span>
          {renderActions()}
        </div>
        <div
          className="node-content"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isShrunken && node.uri && (
            <span className="inline-uri">{node.uri}</span>
          )}
          {!isShrunken && (
            <>
              <div className="input-group">
                <label>ID:</label>
                <input
                  type="text"
                  className="text-input"
                  value={node.id || ''}
                  draggable={false}
                  onChange={evt => {
                    node.id = evt.target.value || null;
                    onNodeUpdate(skele.clone());
                  }}
                />
              </div>
              <div className="input-group">
                <label>Sort:</label>
                <NumberInput
                  value={node.sort}
                  allowUndefined
                  onChange={val => {
                    node.sort = val;
                    onNodeUpdate(skele.clone());
                  }}
                />
              </div>
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
                <NumberInput
                  value={node.mag}
                  step={0.1}
                  onChange={val => {
                    node.mag = val ?? 0;
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
            </>
          )}
        </div>
      </div>
      {!isCollapsed &&
        node.children.map((child, childIndex) => (
          <NodeItem
            activeNode={activeNode}
            lastActiveNode={lastActiveNode}
            key={childIndex}
            node={child}
            index={childIndex}
            depth={depth + 1}
            onNodeUpdate={onNodeUpdate}
            focusNode={focusNode}
            skele={skele}
          />
        ))}
    </div>
  );
};
