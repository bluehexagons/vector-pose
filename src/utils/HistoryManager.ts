export interface HistoryEntry<T> {
  state: T;
  description: string;
}

export class HistoryManager<T> {
  private undoStack: HistoryEntry<T>[] = [];
  private redoStack: HistoryEntry<T>[] = [];
  private maxSize: number;
  private lastContinuityKey?: string;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  push(state: T, description: string, continuityKey?: string) {
    if (
      continuityKey &&
      continuityKey === this.lastContinuityKey &&
      this.undoStack.length > 0
    ) {
      // Replace the last entry if continuity key matches
      this.undoStack[this.undoStack.length - 1] = {state, description};
    } else {
      this.undoStack.push({state, description});
      this.redoStack = []; // Clear redo stack on new action

      // Maintain max size
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
    }
    this.lastContinuityKey = continuityKey;
    console.log(continuityKey, this.undoStack);
  }

  undo(): HistoryEntry<T> | undefined {
    const entry = this.undoStack.pop();
    if (entry) {
      this.redoStack.push(entry);

      if (this.undoStack.length === 0) {
        this.undoStack.push(entry);
      }
    }
    this.lastContinuityKey = undefined;
    return this.undoStack[this.undoStack.length - 1];
  }

  redo(): HistoryEntry<T> | undefined {
    const entry = this.redoStack.pop();
    if (entry) {
      this.undoStack.push(entry);
      return entry;
    }
    this.lastContinuityKey = undefined;
    return undefined;
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getCurrentState(): HistoryEntry<T> | undefined {
    return this.undoStack[this.undoStack.length - 1];
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
