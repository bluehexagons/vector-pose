export interface HistoryEntry<T> {
  state: T;
  description: string;
  continuityKey?: string;
}

export class HistoryManager<T> {
  private entries: HistoryEntry<T>[] = [];
  private currentIndex = -1;
  private lastContinuityKey?: string;
  private readonly maxHistory: number;

  constructor(maxHistory = 100) {
    this.maxHistory = maxHistory;
  }

  getCurrentState() {
    return this.entries[this.currentIndex];
  }

  pushState(state: T, description: string, continuityKey?: string) {
    // Handle continuity - replace last entry if keys match
    if (continuityKey && continuityKey === this.lastContinuityKey) {
      this.entries[this.currentIndex] = {state, description, continuityKey};
      return;
    }

    // Trim future states when pushing new state
    this.entries = this.entries.slice(0, this.currentIndex + 1);

    // Add new entry
    this.entries.push({state, description, continuityKey});

    // Maintain history limit
    if (this.entries.length > this.maxHistory) {
      this.entries.shift();
      this.currentIndex--;
    }

    this.currentIndex++;
    this.lastContinuityKey = continuityKey;
  }

  undo(): HistoryEntry<T> | null {
    if (this.currentIndex <= 0) return null;
    this.lastContinuityKey = undefined;
    return this.entries[--this.currentIndex];
  }

  redo(): HistoryEntry<T> | null {
    if (this.currentIndex >= this.entries.length - 1) return null;
    this.lastContinuityKey = undefined;
    return this.entries[++this.currentIndex];
  }

  jumpToState(index: number): HistoryEntry<T> | null {
    if (index < 0 || index >= this.entries.length) return null;
    this.currentIndex = index;
    this.lastContinuityKey = undefined;
    return this.entries[index];
  }

  clear() {
    this.entries = [];
    this.currentIndex = -1;
    this.lastContinuityKey = undefined;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.entries.length - 1;
  }

  getEntries() {
    return this.entries;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }
}
