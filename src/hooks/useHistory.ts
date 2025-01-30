import {useState, useCallback, useEffect} from 'react';
import {HistoryManager, HistoryEntry} from '../utils/HistoryManager';

export function useHistory<T>(initialState: T) {
  const [history] = useState(() => new HistoryManager<T>());
  const [currentEntry, setCurrentEntry] = useState<
    HistoryEntry<T> | undefined
  >();

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

  useEffect(() => {
    pushState(initialState, 'Initial state');
  }, []);

  return {
    currentState: currentEntry?.state,
    description: currentEntry?.description,
    pushState,
    undo,
    redo,
    canUndo: history.canUndo(),
    canRedo: history.canRedo(),
  };
}
