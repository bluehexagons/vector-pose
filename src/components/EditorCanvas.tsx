import React, {useCallback, useEffect, useRef, useState} from 'react';
import {vec2} from 'gl-matrix';

// Base scale factor: at scale 1.0, a 1x1 unit square will be this many pixels
export const BASE_SCALE = 400;

interface EditorCanvasProps {
  children: (transform: {scale: number; offset: vec2}) => React.ReactNode;
  onViewportChange?: (scale: number, offset: vec2) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  children,
  onViewportChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Start at a scale that shows a good initial view
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<vec2>(vec2.fromValues(0, 0));
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<vec2>();

  // Add effect to center the viewport on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const centerViewport = () => {
      const rect = container.getBoundingClientRect();
      setOffset(vec2.fromValues(rect.width / 2, rect.height / 2));
    };

    centerViewport();
    window.addEventListener('resize', centerViewport);
    return () => window.removeEventListener('resize', centerViewport);
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = scale * delta;

      // Keep scale within reasonable bounds
      // These bounds are in terms of BASE_SCALE
      if (newScale < 0.25 || newScale > 4) return;

      // Calculate mouse position relative to container
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mousePos = vec2.fromValues(
        e.clientX - rect.left,
        e.clientY - rect.top
      );

      // Adjust offset to zoom toward mouse position
      const newOffset = vec2.create();
      vec2.subtract(newOffset, mousePos, offset);
      vec2.scale(newOffset, newOffset, 1 - delta);
      vec2.add(newOffset, offset, newOffset);

      setScale(newScale);
      setOffset(newOffset);
      onViewportChange?.(newScale, newOffset);
    },
    [scale, offset]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle mouse button
      setIsDragging(true);
      setLastPos(vec2.fromValues(e.clientX, e.clientY));
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !lastPos) return;

      const delta = vec2.fromValues(
        e.clientX - lastPos[0],
        e.clientY - lastPos[1]
      );

      const newOffset = vec2.add(vec2.create(), offset, delta);
      setOffset(newOffset);
      setLastPos(vec2.fromValues(e.clientX, e.clientY));
      onViewportChange?.(scale, newOffset);
    },
    [isDragging, lastPos, offset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastPos(undefined);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, {passive: false});
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className="editor-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div
        style={{
          position: 'absolute',
          transform: `translate(${offset[0]}px, ${offset[1]}px) scale(${
            scale * BASE_SCALE
          })`,
          transformOrigin: '0 0',
        }}
      >
        {children({scale: scale * BASE_SCALE, offset})}
      </div>
    </div>
  );
};
