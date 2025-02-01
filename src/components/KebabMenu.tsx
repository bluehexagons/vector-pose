import React, {useState} from 'react';
import {ContextMenu, MenuAction} from './ContextMenu';
import './KebabMenu.css';

interface KebabMenuProps {
  actions: MenuAction[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}

export const KebabMenu: React.FC<KebabMenuProps> = ({
  actions,
  trigger,
  align = 'right',
}) => {
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuPosition) {
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        x: align === 'right' ? rect.right : rect.left,
        y: rect.bottom,
      });
    }
  };

  return (
    <div className="kebab-menu">
      {trigger ? (
        <div onClick={handleClick}>{trigger}</div>
      ) : (
        <button
          className="kebab-button"
          onClick={handleClick}
          title="Node menu actions"
        >
          ⋮
        </button>
      )}
      {menuPosition && (
        <ContextMenu
          actions={actions}
          position={menuPosition}
          onClose={() => setMenuPosition(null)}
          align={align}
        />
      )}
    </div>
  );
};
