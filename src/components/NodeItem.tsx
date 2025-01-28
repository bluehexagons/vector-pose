import React, {useState, useCallback, useEffect, useRef} from 'react';
import {toDegrees, toRadians} from '../utils/Equa';
import {SkeleNode} from '../utils/SkeleNode';
import {AngleInput} from './AngleInput';
import {UiNode} from '../shared/types';
import './NodeItem.css';

export const NodeItem: React.FC<{
  node: SkeleNode;
  activeNode: SkeleNode;
  lastActiveNode: SkeleNode;
  pushActiveNode: (node: UiNode) => void;
  index: number;
  depth?: number;
  onNodeUpdate: (skele: SkeleNode) => void;
  skele: SkeleNode;
}> = ({
  activeNode,
  lastActiveNode,
  node,
  index,
  depth = 0,
  onNodeUpdate,
  pushActiveNode,
  skele,
}) => {
  const [showActions, setShowActions] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setShowActions(false);
    }
  }, []);

  useEffect(() => {
    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions, handleClickOutside]);

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

  const handleDelete = () => {
    const clone = skele.clone();
    const nodeToDelete = clone.findIdFromRoot(node.id);
    if (nodeToDelete) {
      nodeToDelete.remove();
      onNodeUpdate(clone);
    }
    setShowActions(false);
  };

  const handleToggleHidden = () => {
    const clone = skele.clone();
    const targetNode = clone.findIdFromRoot(node.id);
    if (targetNode) {
      targetNode.hidden = !targetNode.hidden;
      onNodeUpdate(clone);
    }
    setShowActions(false);
  };

  const handleMoveToTop = () => {
    const clone = skele.clone();
    const targetNode = clone.findIdFromRoot(node.id);
    if (targetNode?.parent) {
      const parent = targetNode.parent;
      const idx = parent.children.indexOf(targetNode);
      if (idx > 0) {
        parent.children.splice(idx, 1);
        parent.children.unshift(targetNode);
        onNodeUpdate(clone);
      }
    }
    setShowActions(false);
  };

  const handleMoveToBottom = () => {
    const clone = skele.clone();
    const targetNode = clone.findIdFromRoot(node.id);
    if (targetNode?.parent) {
      const parent = targetNode.parent;
      const idx = parent.children.indexOf(targetNode);
      if (idx < parent.children.length - 1) {
        parent.children.splice(idx, 1);
        parent.children.push(targetNode);
        onNodeUpdate(clone);
      }
    }
    setShowActions(false);
  };

  return (
    <div
      className="node-wrapper"
      style={{marginLeft: `${depth * 16}px`}}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerDown={e => {
        pushActiveNode({node});
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
            {node.id ? node.id : `node #${index + 1}`}
          </span>
          <div className="node-actions">
            <button
              className="action-button"
              onClick={() => setShowActions(!showActions)}
            >
              ⋮
            </button>
            {showActions && (
              <div className="action-dropdown" ref={dropdownRef}>
                <button onClick={handleToggleHidden}>
                  {node.hidden ? 'Show' : 'Hide'}
                </button>
                <button onClick={handleMoveToTop}>Move to Top</button>
                <button onClick={handleMoveToBottom}>Move to Bottom</button>
                <button onClick={handleDelete}>Delete</button>
              </div>
            )}
          </div>
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
          activeNode={activeNode}
          lastActiveNode={lastActiveNode}
          key={childIndex}
          node={child}
          index={childIndex}
          depth={depth + 1}
          onNodeUpdate={onNodeUpdate}
          pushActiveNode={pushActiveNode}
          skele={skele}
        />
      ))}
    </div>
  );
};
