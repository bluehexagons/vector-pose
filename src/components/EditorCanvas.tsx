import React, {useCallback, useEffect, useRef, useState} from 'react';
import {vec2} from 'gl-matrix';
import {rotateVec2, toRadians} from '../utils/Equa';

// Base scale factor: at scale 1.0, a 1x1 unit square will be this many pixels
export const BASE_SCALE = 200;

export interface Viewport {
  scale: number;
  offset: vec2;
  rotation: number;
  pageToWorld: (pageX: number, pageY: number) => vec2;
  worldToPage: (worldX: number, worldY: number) => vec2;
}

interface EditorCanvasProps {
  children: (viewport: Viewport) => React.ReactNode;
  onViewportChange?: (viewport: Viewport) => void;
  onCanvasMouseDown?: (e: React.MouseEvent, viewport: Viewport) => void;
  onCanvasMouseMove?: (e: React.MouseEvent, viewport: Viewport) => void;
  onCanvasMouseUp?: (e: React.MouseEvent, viewport: Viewport) => void;
  rotation: number;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  children,
  onViewportChange,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  rotation = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Start zoomed out a bit more
  const [scale, setScale] = useState(0.5);
  const [offset, setOffset] = useState<vec2>(vec2.fromValues(0, 0));
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<vec2>();

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

  const pageToWorld = useCallback(
    (pageX: number, pageY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return vec2.create();

      // Convert page coordinates to container-relative
      const x = pageX - rect.left;
      const y = pageY - rect.top;

      // Remove offset and scale to get canvas coordinates
      const canvasX = (x - offset[0]) / (BASE_SCALE * scale);
      const canvasY = (y - offset[1]) / (BASE_SCALE * scale);

      // Rotate coordinates back to world space
      return rotateVec2(
        vec2.create(),
        vec2.fromValues(canvasX, canvasY),
        -toRadians(rotation)
      );
    },
    [scale, offset, rotation]
  );

  const worldToPage = useCallback(
    (worldX: number, worldY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return vec2.create();

      // Rotate world coordinates to canvas space
      const rotated = rotateVec2(
        vec2.create(),
        vec2.fromValues(worldX, worldY),
        toRadians(rotation)
      );

      // Apply scale and offset
      const x = rotated[0] * BASE_SCALE * scale + offset[0] + rect.left;
      const y = rotated[1] * BASE_SCALE * scale + offset[1] + rect.top;

      return vec2.fromValues(x, y);
    },
    [scale, offset, rotation]
  );

  const viewport: Viewport = {
    scale: BASE_SCALE * scale,
    offset,
    rotation,
    pageToWorld,
    worldToPage,
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = scale * delta;

      // Keep scale within reasonable bounds
      // These bounds are in terms of BASE_SCALE
      if (newScale < 0.15 || newScale > 8) return;

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
      onViewportChange?.(viewport);
    },
    [scale, offset, viewport]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        setIsDragging(true);
        setLastPos(vec2.fromValues(e.clientX, e.clientY));
        e.preventDefault();
      } else {
        // Pass other mouse events to parent with viewport info
        onCanvasMouseDown?.(e, viewport);
      }
    },
    [viewport]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && lastPos) {
        const delta = vec2.fromValues(
          e.clientX - lastPos[0],
          e.clientY - lastPos[1]
        );

        const newOffset = vec2.add(vec2.create(), offset, delta);
        setOffset(newOffset);
        setLastPos(vec2.fromValues(e.clientX, e.clientY));
        onViewportChange?.(viewport);
      } else {
        onCanvasMouseMove?.(e, viewport);
      }
    },
    [isDragging, lastPos, offset, viewport]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        setLastPos(undefined);
      } else {
        onCanvasMouseUp?.(e, viewport);
      }
    },
    [isDragging, viewport]
  );

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
          // Remove scale from transform, we're applying it to children now
          transform: `translate(${offset[0]}px, ${offset[1]}px)`,
          transformOrigin: '0 0',
        }}
      >
        {children(viewport)}
      </div>
    </div>
  );
};
