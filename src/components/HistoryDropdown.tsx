import {HistoryEntry} from '../utils/HistoryManager';
import './HistoryDropdown.css';
import {KebabMenu} from './KebabMenu';

interface HistoryDropdownProps<T> {
  entries: HistoryEntry<T>[];
  onSelect: (index: number) => void;
  currentIndex: number;
}

export function HistoryDropdown<T>({
  entries,
  onSelect,
  currentIndex,
}: HistoryDropdownProps<T>) {
  const actions = entries.map((entry, index) => ({
    label: entry.description,
    action: () => onSelect(index),
    isSelected: index === currentIndex,
  }));

  return (
    <KebabMenu
      actions={actions.reverse()}
      trigger={<button className="history-button">History ▾</button>}
      align="left"
    />
  );
}
