import {HistoryEntry} from '../utils/HistoryManager';
import {KebabMenu} from './KebabMenu';
import './HistoryDropdown.css';

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
