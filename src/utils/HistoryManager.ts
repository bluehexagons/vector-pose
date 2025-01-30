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
  }

  undo(): HistoryEntry<T> | undefined {
    if (this.undoStack.length > 1) {
      const entry = this.undoStack.pop();
      if (entry) {
        this.redoStack.push(entry);
      }
      this.lastContinuityKey = undefined;
      return this.undoStack[this.undoStack.length - 1];
    }

    return this.undoStack[0];
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

  jumpToState(index: number): HistoryEntry<T> | undefined {
    const entries = this.getHistoryEntries();
    if (index < 0 || index >= entries.length) return undefined;

    // Move everything after target index to redo stack
    const targetEntry = entries[index];
    this.undoStack = entries.slice(0, index + 1);
    this.redoStack = entries.slice(index + 1);

    this.lastContinuityKey = undefined;
    return targetEntry;
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

  getCurrentIndex(): number {
    return this.undoStack.length - 1;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  getHistoryEntries(): HistoryEntry<T>[] {
    return [...this.undoStack, ...this.redoStack];
  }
}
