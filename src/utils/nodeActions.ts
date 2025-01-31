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
    });
  }

  if (onToggleShrunken) {
    actions.push({
      label: isShrunken ? 'Show Details' : 'Hide Details',
      icon: icons.details,
      action: onToggleShrunken,
    });
  }

  actions.push(
    {
      label: node.hidden ? 'Show' : 'Hide',
      icon: node.hidden ? icons.visibility : icons.hidden,
      action: () => {
        const clone = node.root.clone();
        const targetNode = clone.findId(node.id);
        if (targetNode) {
          targetNode.hidden = !targetNode.hidden;
          updateNode(
            clone,
            `Set node ${targetNode.id} to ${
              targetNode.hidden ? 'HIDE' : 'SHOW'
            } (was ${!targetNode.hidden})`,
            `visibility_${node.id}`
          );
        }
      },
    },
    {
      label: 'Create Child',
      icon: icons.addParent,
      action: () => {
        const clone = node.root.clone();
        const targetNode = clone.findId(node.id);
        const newNode = new SkeleNode();
        targetNode.add(newNode);
        updateNode(
          clone,
          `Created node ${newNode.id} and added to ${targetNode.id}`
        );
      },
    },
    {
      label: 'Create Parent',
      icon: icons.addParent,
      action: () => {
        const clone = node.root.clone();
        const targetNode = clone.findId(node.id);
        if (targetNode?.parent) {
          const newParent = new SkeleNode();
          const parent = targetNode.parent;
          parent.add(newParent);
          newParent.add(targetNode);
          updateNode(
            clone,
            `Added node ${targetNode} to new parent node ${newParent.id}, added to ${parent.id}`
          );
        }
      },
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
    },
    {
      label: 'Delete',
      icon: icons.delete,
      action: () => {
        const clone = node.root.clone();
        const nodeToDelete = clone.findId(node.id);
        if (nodeToDelete) {
          const parent = nodeToDelete.parent;
          nodeToDelete.remove();
          updateNode(
            clone,
            `Deleted node ${nodeToDelete.id} from ${parent.id}`
          );
        }
      },
    }
  );

  return actions;
}
