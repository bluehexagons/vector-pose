import React, {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import './ContextMenu.css';

export interface MenuAction {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  isSelected?: boolean;
}

interface ContextMenuProps {
  actions: MenuAction[];
  position: {x: number; y: number};
  onClose: () => void;
  align?: 'left' | 'right';
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  actions,
  position,
  onClose,
  align = 'right',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    // Position menu to avoid screen edges
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Default offset from cursor
      const offset = {x: 0, y: 0};

      // Handle horizontal positioning
      if (position.x + rect.width > viewport.width) {
        // If menu would go off right edge, position to left of cursor/button
        offset.x = -rect.width;
      }

      // Handle vertical positioning
      if (position.y + rect.height > viewport.height) {
        // If menu would go off bottom edge, position above cursor/button
        offset.y = -rect.height;
      }

      menuRef.current.style.transform = 'none';
      menuRef.current.style.left = `${position.x + offset.x}px`;
      menuRef.current.style.top = `${position.y + offset.y}px`;
    }
  }, [position]);

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {actions.map((action, i) => (
        <button
          key={i}
          className={`menu-item ${action.isSelected ? 'selected' : ''}`}
          onClick={() => {
            const callback = action.action;
            onClose();
            // Execute action after menu is closed
            setTimeout(() => callback(), 0);
          }}
        >
          <span className="menu-label">{action.label}</span>
          {action.icon && <span className="menu-icon">{action.icon}</span>}
        </button>
      ))}
    </div>,
    document.body
  );
};
