import React, {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import './ContextMenu.css';

export interface MenuAction {
  label: string;
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

  return createPortal(
    <div
      className="context-menu"
      ref={menuRef}
      style={{
        position: 'fixed',
        right: 10,
        top: position.y + 20,
      }}
    >
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
        </button>
      ))}
    </div>,
    document.body
  );
};
