import {HistoryManager} from './HistoryManager';

export class TabHistory<T> {
  private histories: Map<string, HistoryManager<T>> = new Map();

  getHistory(tabId: string): HistoryManager<T> {
    let history = this.histories.get(tabId);
    if (!history) {
      history = new HistoryManager<T>();
      this.histories.set(tabId, history);
    }
    return history;
  }

  removeHistory(tabId: string) {
    this.histories.delete(tabId);
  }

  clear() {
    this.histories.clear();
  }
}
