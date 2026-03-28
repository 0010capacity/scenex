import { useCallback, useState } from 'react';
import { Box } from '@mantine/core';

interface ResizeHandleProps {
  side: 'left' | 'right';
  onResize: (delta: number) => void;
  minWidth: number;
  maxWidth: number;
  currentWidth: number;
}

export function ResizeHandle({ side, onResize, minWidth, maxWidth, currentWidth }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = side === 'left'
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX;

      const newWidth = currentWidth + delta;

      // Clamp to min/max
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onResize(delta);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [side, onResize, currentWidth, minWidth, maxWidth]);

  return (
    <Box
      className={`resize-handle ${side} ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        width: '4px',
        flexShrink: 0,
        cursor: 'col-resize',
        position: 'relative',
        zIndex: 10,
      }}
    />
  );
}
