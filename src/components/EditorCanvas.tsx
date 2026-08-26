import {vec2} from 'gl-matrix';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

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
  onContextMenu?: (e: React.MouseEvent, viewport: Viewport) => void;
  rotation: number;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  children,
  onViewportChange,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onContextMenu,
  rotation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Start zoomed out a bit more
  const [scale, setScale] = useState(0.5);
  const [offset, setOffset] = useState<vec2>(vec2.fromValues(0, 0));
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<vec2>();

  const centerViewport = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOffset(vec2.fromValues(rect.width / 2, rect.height / 2));
  }, []);

  useEffect(() => {
    centerViewport();
    window.addEventListener('resize', centerViewport);
    return () => window.removeEventListener('resize', centerViewport);
  }, [centerViewport]);

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

      return vec2.fromValues(canvasX, canvasY);
    },
    [scale, offset]
  );

  const worldToPage = useCallback(
    (worldX: number, worldY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return vec2.create();

      const worldPos = vec2.fromValues(worldX, worldY);

      // Apply scale and offset
      const x = worldPos[0] * BASE_SCALE * scale + offset[0] + rect.left;
      const y = worldPos[1] * BASE_SCALE * scale + offset[1] + rect.top;

      return vec2.fromValues(x, y);
    },
    [scale, offset]
  );

  const viewport: Viewport = useMemo(
    () => ({
      scale: BASE_SCALE * scale,
      offset,
      rotation,
      pageToWorld,
      worldToPage,
    }),
    [offset, pageToWorld, rotation, scale, worldToPage]
  );

  const zoomBy = useCallback(
    (factor: number, anchor?: vec2) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const nextScale = Math.min(8, Math.max(0.15, scale * factor));
      if (nextScale === scale) return;

      const zoomAnchor =
        anchor ?? vec2.fromValues(rect.width / 2, rect.height / 2);
      const ratio = nextScale / scale;
      const nextOffset = vec2.fromValues(
        zoomAnchor[0] - (zoomAnchor[0] - offset[0]) * ratio,
        zoomAnchor[1] - (zoomAnchor[1] - offset[1]) * ratio
      );
      setScale(nextScale);
      setOffset(nextOffset);
    },
    [offset, scale]
  );

  const resetViewport = useCallback(() => {
    setScale(0.5);
    centerViewport();
  }, [centerViewport]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      zoomBy(
        e.deltaY > 0 ? 0.9 : 1.1,
        vec2.fromValues(e.clientX - rect.left, e.clientY - rect.top)
      );
    },
    [zoomBy]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      containerRef.current?.focus({preventScroll: true});
      if (e.button === 1) {
        setIsDragging(true);
        setLastPos(vec2.fromValues(e.clientX, e.clientY));
        e.preventDefault();
      } else {
        // Pass other mouse events to parent with viewport info
        onCanvasMouseDown?.(e, viewport);
      }
    },
    [onCanvasMouseDown, viewport]
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
    [isDragging, lastPos, offset, onCanvasMouseMove, onViewportChange, viewport]
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
    [isDragging, onCanvasMouseUp, viewport]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, {passive: false});
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const gridSize = Math.max(4, 20 * scale);

  return (
    <div
      ref={containerRef}
      className="editor-canvas"
      tabIndex={0}
      aria-label="Pose editor canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={e => onContextMenu?.(e, viewport)}
      onKeyDown={event => {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          zoomBy(1.2);
        } else if (event.key === '-' || event.key === '_') {
          event.preventDefault();
          zoomBy(1 / 1.2);
        } else if (event.key === '0') {
          event.preventDefault();
          resetViewport();
        }
      }}
      style={{
        cursor: isDragging ? 'grabbing' : 'default',
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offset[0] % gridSize}px ${
          offset[1] % gridSize
        }px`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${offset[0]}px, ${offset[1]}px)`,
          transformOrigin: '0 0',
        }}
      >
        {children(viewport)}
      </div>
      <div
        className="canvas-controls"
        aria-label="Canvas view controls"
        onMouseDown={event => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.2)}
          title="Zoom out (-)"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="canvas-zoom-value"
          onClick={resetViewport}
          title="Reset zoom and center (0)"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          +
        </button>
        <span className="canvas-control-divider" />
        <button
          type="button"
          onClick={centerViewport}
          title="Center canvas"
          aria-label="Center canvas"
        >
          ◎
        </button>
      </div>
      <div className="canvas-navigation-hint">
        Wheel to zoom <span>·</span> Middle-drag to pan
      </div>
    </div>
  );
};
