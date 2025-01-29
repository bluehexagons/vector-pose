import React, {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import './ContextMenu.css';

export interface MenuAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  actions: MenuAction[];
  position: {x: number; y: number};
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  actions,
  position,
  onClose,
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
    <div className="context-menu" ref={menuRef}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => {
            action.onClick();
            onClose();
          }}
          disabled={action.disabled}
        >
          {action.label}
          {action.icon && <span className="menu-icon">{action.icon}</span>}
        </button>
      ))}
    </div>,
    document.body
  );
};
