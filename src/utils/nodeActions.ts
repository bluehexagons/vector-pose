import {MenuAction} from '../components/ContextMenu';
import {icons} from './Icons';
import {SkeleNode} from './SkeleNode';

export interface NodeActionContext {
  node: SkeleNode;
  updateNode: (
    node: SkeleNode,
    description?: string,
    continuityKey?: string
  ) => void;
  isCollapsed?: boolean;
  isShrunken?: boolean;
  onToggleCollapse?: () => void;
  onToggleShrunken?: () => void;
}

interface NodeActionParams {
  node: SkeleNode;
  updateNode: (
    node: SkeleNode,
    description?: string,
    continuityKey?: string
  ) => void;
}

export const nodeActions = {
  delete: ({node, updateNode}: NodeActionParams) => {
    const clone = node.root.clone();
    const nodeToDelete = clone.findId(node.id);
    if (nodeToDelete) {
      const parent = nodeToDelete.parent;
      nodeToDelete.remove();
      updateNode(clone, `Deleted node ${nodeToDelete.id} from ${parent.id}`);
    }
  },

  createChild: ({node, updateNode}: NodeActionParams) => {
    const clone = node.root.clone();
    const targetNode = clone.findId(node.id);
    const newNode = new SkeleNode();
    targetNode.add(newNode);
    updateNode(
      clone,
      `Created node ${newNode.id} and added to ${targetNode.id}`
    );
  },

  createParent: ({node, updateNode}: NodeActionParams) => {
    const clone = node.root.clone();
    const targetNode = clone.findId(node.id);
    if (targetNode?.parent) {
      const newParent = new SkeleNode();
      const parent = targetNode.parent;
      parent.add(newParent);
      newParent.add(targetNode);
      updateNode(
        clone,
        `Added node ${targetNode.id} to new parent node ${newParent.id}, added to ${parent.id}`
      );
    }
  },

  toggleVisibility: ({node, updateNode}: NodeActionParams) => {
    const clone = node.root.clone();
    const targetNode = clone.findId(node.id);
    if (targetNode) {
      targetNode.hidden = !targetNode.hidden;
      updateNode(
        clone,
        `Set node ${targetNode.id} to ${targetNode.hidden ? 'HIDE' : 'SHOW'}`
      );
    }
  },
};

export function getNodeActions({
  node,
  updateNode,
  isCollapsed,
  isShrunken,
  onToggleCollapse,
  onToggleShrunken,
}: NodeActionContext): MenuAction[] {
  if (!node) return [];

  const actions: MenuAction[] = [];

  if (onToggleCollapse) {
    actions.push({
      label: isCollapsed ? 'Expand' : 'Collapse',
      icon: isCollapsed ? icons.expand : icons.collapse,
      action: onToggleCollapse,
      title: 'Collapse this node in the layers pane',
    });
  }

  if (onToggleShrunken) {
    actions.push({
      label: isShrunken ? 'Show Details' : 'Hide Details',
      icon: icons.details,
      action: onToggleShrunken,
      title: 'Show details for this node in the layers pane',
    });
  }

  actions.push(
    {
      label: node.hidden ? 'Show' : 'Hide',
      icon: node.hidden ? icons.visibility : icons.hidden,
      action: () => nodeActions.toggleVisibility({node, updateNode}),
      title:
        "Toggle the node's visibility; hidden nodes can be used for reference",
    },
    {
      label: 'Create Child',
      icon: icons.addParent,
      action: () => nodeActions.createChild({node, updateNode}),
      title: 'Append a new child node to this one',
    },
    {
      label: 'Create Parent',
      icon: icons.addParent,
      action: () => nodeActions.createParent({node, updateNode}),
      title:
        'Append a new parent for this node to its parent, and add this node to that',
    },
    {
      label: 'Move to Top',
      icon: icons.moveTop,
      action: () => {
        const clone = node.root.clone();
        const targetNode = clone.findId(node.id);
        if (targetNode?.parent) {
          const parent = targetNode.parent;
          const idx = parent.children.indexOf(targetNode);
          if (idx > 0) {
            parent.children.splice(idx, 1);
            parent.children.unshift(targetNode);
            updateNode(
              clone,
              `Moved node ${targetNode.id} to top of ${parent.id}`
            );
          }
        }
      },
      title: 'Move this node to the top of its parent',
    },
    {
      label: 'Move to Bottom',
      icon: icons.moveBottom,
      action: () => {
        const clone = node.root.clone();
        const targetNode = clone.findId(node.id);
        if (targetNode?.parent) {
          const parent = targetNode.parent;
          const idx = parent.children.indexOf(targetNode);
          if (idx < parent.children.length - 1) {
            parent.children.splice(idx, 1);
            parent.children.push(targetNode);
            updateNode(
              clone,
              `Moved node ${targetNode.id} to top of ${parent.id}`
            );
          }
        }
      },
      title: 'Move this node to the bottom of its parent',
    },
    {
      label: 'Delete',
      icon: icons.delete,
      action: () => nodeActions.delete({node, updateNode}),
      title: 'Delete this node and its children',
    }
  );

  return actions;
}
