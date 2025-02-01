import React, {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import './ContextMenu.css';

export interface MenuAction {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  isSelected?: boolean;
  title?: string;
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
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let top = position.y;
      let left = position.x;

      // Check vertical overflow
      if (position.y + rect.height > viewport.height) {
        // Position above trigger if it would go off bottom
        top = Math.max(0, position.y - rect.height);
      }

      // Check horizontal overflow
      if (align === 'right') {
        if (position.x + rect.width > viewport.width) {
          left = Math.max(0, viewport.width - rect.width);
        }
      } else {
        if (position.x + rect.width > viewport.width) {
          left = Math.max(0, position.x - rect.width);
        }
      }

      menuRef.current.style.left = `${left}px`;
      menuRef.current.style.top = `${top}px`;
    }
  }, [position, align]);

  return createPortal(
    <div ref={menuRef} className="context-menu">
      {actions.map((action, i) => (
        <button
          key={i}
          className={`menu-item ${action.isSelected ? 'selected' : ''}`}
          title={action.title}
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
