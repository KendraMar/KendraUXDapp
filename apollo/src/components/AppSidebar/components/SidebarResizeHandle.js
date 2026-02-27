import React, { useRef, useCallback } from 'react';
import { Button } from '@patternfly/react-core';

const SidebarResizeHandle = ({ isCollapsed, isHidden, sidebarWidth, onSidebarResize, navPosition }) => {
  const resizeHandleRef = useRef(null);
  const isResizingRef = useRef(false);

  // Resize handlers - unified for mouse and touch
  const handleResizeStart = useCallback((clientX) => {
    if (isCollapsed || isHidden) return;
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
  }, [isCollapsed, isHidden]);

  const handleResizeMove = useCallback((clientX) => {
    if (!isResizingRef.current) return;
    // When nav is on the right, width is calculated from the right edge of the viewport
    const newWidth = navPosition === 'right'
      ? Math.max(180, Math.min(500, window.innerWidth - clientX))
      : Math.max(180, Math.min(500, clientX));
    if (onSidebarResize) {
      onSidebarResize(newWidth);
    }
  }, [onSidebarResize, navPosition]);

  const handleResizeEnd = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (isCollapsed || isHidden) return;
    e.preventDefault();
    handleResizeStart(e.clientX);
    
    const handleMouseMove = (moveEvent) => {
      handleResizeMove(moveEvent.clientX);
    };
    
    const handleMouseUp = () => {
      handleResizeEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isCollapsed, isHidden, handleResizeStart, handleResizeMove, handleResizeEnd]);

  const handleTouchStart = useCallback((e) => {
    if (isCollapsed || isHidden) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleResizeStart(touch.clientX);
    
    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length > 0) {
        const touch = moveEvent.touches[0];
        handleResizeMove(touch.clientX);
      }
    };
    
    const handleTouchEnd = () => {
      handleResizeEnd();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  }, [isCollapsed, isHidden, handleResizeStart, handleResizeMove, handleResizeEnd]);

  if (isCollapsed || isHidden) {
    return null;
  }

  return (
    <div
      ref={resizeHandleRef}
      className="apollo-sidebar-resize-handle"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      tabIndex={0}
      onKeyDown={(e) => {
        // When nav is on the right, arrow keys are reversed for intuitive resizing
        const shrinkKey = navPosition === 'right' ? 'ArrowRight' : 'ArrowLeft';
        const growKey = navPosition === 'right' ? 'ArrowLeft' : 'ArrowRight';
        if (e.key === shrinkKey) {
          onSidebarResize && onSidebarResize(Math.max(180, sidebarWidth - 10));
        } else if (e.key === growKey) {
          onSidebarResize && onSidebarResize(Math.min(500, sidebarWidth + 10));
        }
      }}
    />
  );
};

export default SidebarResizeHandle;
