import {useCallback, useEffect} from 'react';
import type {TabData} from '../shared/types';
import {nodeActions} from '../utils/nodeActions';
import {SkeleNode} from '../utils/SkeleNode';

export interface History {
  undo: () => {state: SkeleNode} | null;
  redo: () => {state: SkeleNode} | null;
}

interface KeyBinding {
  action: string;
  contexts: string[];
}

const keyBindings: Record<string, KeyBinding> = {
  'ctrl+z': {action: 'undo', contexts: ['node', 'editor']},
  'ctrl+shift+z': {action: 'redo', contexts: ['node', 'editor']},
  'ctrl+y': {action: 'redo', contexts: ['node', 'editor']},
  'meta+z': {action: 'undo', contexts: ['node', 'editor']},
  'meta+shift+z': {action: 'redo', contexts: ['node', 'editor']},
  delete: {action: 'delete', contexts: ['node']},
  backspace: {action: 'delete', contexts: ['node']},
  p: {action: 'createParent', contexts: ['node']},
  c: {action: 'createChild', contexts: ['node']},
  h: {action: 'toggleVisibility', contexts: ['node']},
};

export function useKeyboardShortcuts({
  activeTab,
  updateSkele,
  restoreState,
  history,
}: {
  activeTab: TabData;
  updateSkele: (base: SkeleNode, description?: string) => void;
  restoreState: (state: SkeleNode, filePath?: string) => void;
  history: History;
}) {
  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      if (!activeTab) return;

      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const comboName = [
        e.altKey ? 'alt' : '',
        e.ctrlKey ? 'ctrl' : e.metaKey ? 'meta' : '',
        e.shiftKey ? 'shift' : '',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      const binding = keyBindings[comboName];
      if (!binding) return;

      const targetNode =
        activeTab.lastActiveNode?.node || activeTab.activeNode?.node;
      const context = targetNode ? 'node' : 'editor';
      if (!binding.contexts.includes(context)) return;

      e.preventDefault();

      const currentNode = targetNode
        ? activeTab.skele.findId(targetNode.id)
        : null;
      if (binding.contexts.includes('node') && !currentNode) return;

      switch (binding.action) {
        case 'undo': {
          const undoState = history.undo();
          if (undoState) restoreState(undoState.state, activeTab.filePath);
          break;
        }
        case 'redo': {
          const redoState = history.redo();
          if (redoState) restoreState(redoState.state, activeTab.filePath);
          break;
        }
        case 'delete':
        case 'createParent':
        case 'createChild':
        case 'toggleVisibility': {
          if (!currentNode) return;
          nodeActions[binding.action]({
            node: currentNode,
            updateNode: updateSkele,
          });
          break;
        }
      }
    },
    [activeTab, history, restoreState, updateSkele]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);
}
