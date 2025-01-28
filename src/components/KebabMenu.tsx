import React, {useState} from 'react';
import {ContextMenu, MenuAction} from './ContextMenu';
import './KebabMenu.css';

interface KebabMenuProps {
  actions: MenuAction[];
}

export const KebabMenu: React.FC<KebabMenuProps> = ({actions}) => {
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [shouldClose, setShouldClose] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shouldClose || menuPosition) {
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({x: rect.right, y: rect.top});
    }
  };

  const handleMouseDown = () => {
    setShouldClose(!!menuPosition);
  };

  return (
    <div className="kebab-menu">
      <button
        className="kebab-button"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        ⋮
      </button>
      {menuPosition && (
        <ContextMenu
          actions={actions}
          position={menuPosition}
          onClose={() => setMenuPosition(null)}
        />
      )}
    </div>
  );
};
