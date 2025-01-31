import {useCallback, useEffect, useState} from 'react';
import {HistoryEntry} from '../utils/HistoryManager';
import {TabHistory} from '../utils/TabHistory';

export function useHistory<T>(initialState: T, tabId: string) {
  const [tabHistory] = useState(() => new TabHistory<T>());
  const [currentEntry, setCurrentEntry] = useState<
    HistoryEntry<T> | undefined
  >();

  // Get the history for current tab
  const history = tabHistory.getHistory(tabId);

  const pushState = useCallback(
    (state: T, description: string, continuityKey?: string) => {
      history.push(state, description, continuityKey);
      setCurrentEntry(history.getCurrentState());
    },
    [history]
  );

  const undo = useCallback(() => {
    const entry = history.undo();
    setCurrentEntry(entry);
    return entry?.state;
  }, [history]);

  const redo = useCallback(() => {
    const entry = history.redo();
    setCurrentEntry(entry);
    return entry?.state;
  }, [history]);

  // Reset current entry when tab changes
  useEffect(() => {
    setCurrentEntry(history.getCurrentState());
  }, [tabId, history]);

  // Initialize history for new tabs
  useEffect(() => {
    if (!history.getCurrentState()) {
      pushState(initialState, 'Initial state');
    }
  }, [history, initialState, pushState]);

  return {
    currentState: currentEntry?.state,
    description: currentEntry?.description,
    pushState,
    undo,
    redo,
    clearHistory: history.clear,
    canUndo: history.canUndo(),
    canRedo: history.canRedo(),
    getCurrentIndex: () => history.getCurrentIndex(),
    getHistoryEntries: () => history.getHistoryEntries(),
    jumpToState: (index: number) => history.jumpToState(index),
  };
}
