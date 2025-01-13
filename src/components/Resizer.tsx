import {useCallback, useEffect, useState} from 'react';
import './Resizer.css';

interface ResizerProps {
  onResize: (delta: number) => void;
}

export const Resizer: React.FC<ResizerProps> = ({onResize}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const delta = e.clientX - startX;
        onResize(delta);
        setStartX(e.clientX);
      }
    },
    [isDragging, startX, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="resizer" onMouseDown={handleMouseDown}>
      <div className="resizer-handle" />
    </div>
  );
};
