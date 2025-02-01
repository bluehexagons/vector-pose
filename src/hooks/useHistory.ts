import {useCallback, useEffect, useRef} from 'react';
import {SkeleNode} from '../utils/SkeleNode';
import {HistoryManager} from '../utils/HistoryManager';

export function useHistory(initialState: SkeleNode, key: string) {
  const managers = useRef<Record<string, HistoryManager<SkeleNode>>>({});

  // Get or create manager for this key
  if (!managers.current[key]) {
    managers.current[key] = new HistoryManager<SkeleNode>();
  }
  const manager = managers.current[key];

  // Initialize with initial state if empty
  useEffect(() => {
    if (!manager.getCurrentState() && initialState) {
      manager.pushState(initialState, 'Initial state');
    }
  }, [manager, initialState]);

  return {
    currentState: manager.getCurrentState()?.state,
    description: manager.getCurrentState()?.description,
    pushState: useCallback(
      (state: SkeleNode, description: string, continuityKey?: string) => {
        manager.pushState(state, description, continuityKey);
      },
      [manager]
    ),
    undo: useCallback(() => manager.undo(), [manager]),
    redo: useCallback(() => manager.redo(), [manager]),
    clear: useCallback(() => manager.clear(), [manager]),
    canUndo: manager.canUndo(),
    canRedo: manager.canRedo(),
    getCurrentIndex: useCallback(() => manager.getCurrentIndex(), [manager]),
    getHistoryEntries: useCallback(() => manager.getEntries(), [manager]),
    jumpToState: useCallback(
      (index: number) => manager.jumpToState(index),
      [manager]
    ),
  };
}
