import {MenuAction} from '../components/ContextMenu';
import {SkeleNode} from './SkeleNode';
import {icons} from './Icons';

export interface NodeActionContext {
  node: SkeleNode;
  updateNode: (node: SkeleNode) => void;
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
          updateNode(clone);
        }
      },
    },
    {
      label: 'Create Child',
      icon: icons.addParent,
      action: () => {
        const clone = node.root.clone();
        const targetNode = clone.findId(node.id);
        targetNode.add(new SkeleNode());
        updateNode(clone);
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
          updateNode(clone);
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
            updateNode(clone);
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
            updateNode(clone);
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
          nodeToDelete.remove();
          updateNode(clone);
        }
      },
    }
  );

  return actions;
}
