import {MenuAction} from '../components/ContextMenu';
import {SkeleNode} from './SkeleNode';

export interface NodeActionContext {
  node: SkeleNode;
  updateNode: (node: SkeleNode) => void;
}

export function getNodeActions({
  node,
  updateNode,
}: NodeActionContext): MenuAction[] {
  if (!node) return [];

  return [
    {
      label: node.hidden ? 'Show' : 'Hide',
      onClick: () => {
        const clone = node.root.clone();
        const targetNode = clone.findId(node.id);
        if (targetNode) {
          targetNode.hidden = !targetNode.hidden;
          updateNode(clone);
        }
      },
    },
    {
      label: 'Create Parent',
      onClick: () => {
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
      onClick: () => {
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
      onClick: () => {
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
      onClick: () => {
        const clone = node.root.clone();
        const nodeToDelete = clone.findId(node.id);
        if (nodeToDelete) {
          nodeToDelete.remove();
          updateNode(clone);
        }
      },
    },
  ];
}
