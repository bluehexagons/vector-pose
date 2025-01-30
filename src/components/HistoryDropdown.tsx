import {useState} from 'react';
import {HistoryEntry} from '../utils/HistoryManager';
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
  const [isOpen, setIsOpen] = useState(false);

  console.log('got', entries, isOpen);

  return (
    <div className="history-dropdown">
      <button onClick={() => setIsOpen(!isOpen)} className="history-button">
        History ▾
      </button>
      {isOpen && (
        <div className="history-menu">
          {entries.map((entry, index) => (
            <div
              key={index}
              className={`history-item ${
                index === currentIndex ? 'current' : ''
              }`}
              onClick={() => {
                onSelect(index);
                setIsOpen(false);
              }}
            >
              {entry.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
