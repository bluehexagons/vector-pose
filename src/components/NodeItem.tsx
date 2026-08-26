import React, {useState} from 'react';
import {UiNode} from '../shared/types';
import {toDegrees, toRadians} from '../utils/Equa';
import {getNodeActions} from '../utils/nodeActions';
import {SkeleNode} from '../utils/SkeleNode';
import {AngleInput} from './AngleInput';
import {KebabMenu} from './KebabMenu';
import './NodeItem.css';
import {NumberInput} from './NumberInput';

interface NodeItemProps {
  node: SkeleNode;
  activeNode?: SkeleNode;
  lastActiveNode?: SkeleNode;
  focusNode: (node?: UiNode) => void;
  index: number;
  depth?: number;
  onNodeUpdate: (
    skele: SkeleNode,
    description?: string,
    continuityKey?: string
  ) => void;
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

    let data: {nodeId?: string};
    try {
      data = JSON.parse(e.dataTransfer.getData('application/json')) as {
        nodeId?: string;
      };
    } catch {
      return;
    }

    if (!data.nodeId) return;

    const sourceNode = skele.findIdFromRoot(data.nodeId);
    const targetNode = node;

    // Add validation for circular references
    if (
      !sourceNode ||
      !targetNode ||
      sourceNode === targetNode ||
      sourceNode.includes(targetNode)
    ) {
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

      onNodeUpdate(clone, `Dragged node ${sourceNode.id} to ${targetNode.id}`);
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
            <span className="inline-uri" title={node.uri}>
              {node.uri}
            </span>
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
                  title="Set node ID, used to reference in animations"
                  onChange={evt => {
                    const clone = skele.clone();
                    const updatedNode = clone.findIdFromRoot(node.id);
                    if (!updatedNode) return;

                    const oldId = node.id;
                    const newId = evt.target.value.trim();
                    if (newId && newId !== oldId && clone.findId(newId)) {
                      return;
                    }
                    updatedNode.id = newId || updatedNode.generateId();
                    onNodeUpdate(
                      clone,
                      `Updated node ${updatedNode.id} ID (was ${oldId})`,
                      `update_id_${oldId}`
                    );
                  }}
                />
              </div>
              <div className="input-group">
                <label>Sort:</label>
                <NumberInput
                  value={node.sort}
                  allowUndefined
                  title="The sort value overrides the normal z sorting for this specific node, and not children"
                  onChange={val => {
                    const clone = skele.clone();
                    const updatedNode = clone.findIdFromRoot(node.id);
                    if (!updatedNode) return;

                    const oldSort = node.sort;
                    updatedNode.sort = val ?? 0;
                    onNodeUpdate(
                      clone,
                      `Updated node ${node.id} sort to ${updatedNode.sort} (was ${oldSort})`,
                      `update_sort_${node.id}`
                    );
                  }}
                />
              </div>
              <div className="input-group">
                <label>Angle:</label>
                <AngleInput
                  value={toDegrees(node.rotation)}
                  draggable={false}
                  title="Enter the angle that this node turns by"
                  onChange={v => {
                    const clone = skele.clone();
                    const updatedNode = clone.findIdFromRoot(node.id);
                    if (!updatedNode) return;

                    const oldRotation = node.rotation;
                    updatedNode.rotation = toRadians(v);
                    updatedNode.updateTransform();
                    onNodeUpdate(
                      clone,
                      `Updated node ${node.id} angle to ${toDegrees(
                        updatedNode.rotation
                      ).toFixed(2)} (was ${toDegrees(oldRotation).toFixed(2)})`,
                      `update_rotation_${node.id}`
                    );
                  }}
                />
              </div>
              <div className="input-group">
                <label>Magnitude:</label>
                <NumberInput
                  value={node.mag}
                  step={0.1}
                  title="Enter the magnitude (length or size) of this node"
                  onChange={val => {
                    const clone = skele.clone();
                    const updatedNode = clone.findIdFromRoot(node.id);
                    if (!updatedNode) return;

                    const oldMag = node.mag;
                    updatedNode.mag = Math.max(0, val ?? 0);
                    updatedNode.updateTransform();
                    onNodeUpdate(
                      clone,
                      `Updated node ${node.id} magnitude to ${updatedNode.mag} (was ${oldMag})`,
                      `update_mag_${node.id}`
                    );
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
                  title="The URI marks a sprite node and points to the image location"
                  onChange={evt => {
                    const clone = skele.clone();
                    const updatedNode = clone.findIdFromRoot(node.id);
                    if (!updatedNode) return;

                    const oldUri = node.uri;
                    updatedNode.uri = evt.target.value || null;
                    onNodeUpdate(
                      clone,
                      `Updated node ${node.id} URI to ${updatedNode.uri} (was ${oldUri})`,
                      `update_uri_${node.id}`
                    );
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
            key={child.id}
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
