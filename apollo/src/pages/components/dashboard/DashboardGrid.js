import React, { useMemo, useCallback } from 'react';
import { Responsive, useContainerWidth, verticalCompactor } from 'react-grid-layout';
import WidgetCard from './WidgetCard';
import { getWidgetById } from './widgetRegistry';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * DashboardGrid - Main grid layout component
 * 
 * Wraps react-grid-layout v2's Responsive layout with widget cards.
 * Supports drag-and-drop repositioning and resize in edit mode.
 */
const DashboardGrid = ({
  layouts,
  widgets,
  isEditing,
  onLayoutChange,
  onRemoveWidget,
  onWidgetConfigChange
}) => {
  // Use the v2 hook for container width measurement
  const { width, containerRef, mounted } = useContainerWidth();

  // Grid configuration
  const breakpoints = { lg: 1200, md: 900, sm: 480 };
  const cols = { lg: 12, md: 8, sm: 4 };
  const rowHeight = 80;

  const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  }, [onLayoutChange]);

  const handleRemoveWidget = useCallback((instanceId) => {
    if (onRemoveWidget) {
      onRemoveWidget(instanceId);
    }
  }, [onRemoveWidget]);

  const handleWidgetConfigChange = useCallback((instanceId, newConfig) => {
    if (onWidgetConfigChange) {
      onWidgetConfigChange(instanceId, newConfig);
    }
  }, [onWidgetConfigChange]);

  // Build the grid items
  const gridItems = useMemo(() => {
    if (!widgets || widgets.length === 0) return [];

    return widgets.map(widget => {
      const widgetDef = getWidgetById(widget.widgetId);
      if (!widgetDef) {
        // Widget definition not found (app may have been removed)
        return null;
      }

      return (
        <div key={widget.instanceId} className="dashboard-grid-item">
          <WidgetCard
            widgetDef={widgetDef}
            instanceConfig={widget}
            isEditing={isEditing}
            onRemove={() => handleRemoveWidget(widget.instanceId)}
            onConfigChange={(newConfig) => handleWidgetConfigChange(widget.instanceId, newConfig)}
          />
        </div>
      );
    }).filter(Boolean);
  }, [widgets, isEditing, handleRemoveWidget, handleWidgetConfigChange]);

  // Ensure layouts have all widget keys
  const safeLayouts = useMemo(() => {
    const result = { lg: [], md: [], sm: [] };

    for (const bp of ['lg', 'md', 'sm']) {
      const existing = layouts?.[bp] || [];
      const existingKeys = new Set(existing.map(l => l.i));

      // Start with existing layout items
      result[bp] = [...existing];

      // Add missing widgets with default positions
      widgets.forEach((widget, index) => {
        if (!existingKeys.has(widget.instanceId)) {
          const widgetDef = getWidgetById(widget.widgetId);
          const colCount = cols[bp];
          const defaultW = Math.min(widgetDef?.defaultSize?.w || 4, colCount);
          const defaultH = widgetDef?.defaultSize?.h || 3;

          result[bp].push({
            i: widget.instanceId,
            x: (index * defaultW) % colCount,
            y: Infinity, // Places at bottom
            w: defaultW,
            h: defaultH,
            minW: 2,
            minH: 2
          });
        }
      });

      // Remove layout items for widgets that no longer exist
      const widgetIds = new Set(widgets.map(w => w.instanceId));
      result[bp] = result[bp].filter(l => widgetIds.has(l.i));
    }

    return result;
  }, [layouts, widgets, cols]);

  if (!widgets || widgets.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`dashboard-grid ${isEditing ? 'dashboard-grid--editing' : ''}`}
    >
      {mounted && (
        <Responsive
          className="dashboard-responsive-grid"
          layouts={safeLayouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={rowHeight}
          width={width}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".dashboard-widget-drag-handle"
          compactor={verticalCompactor}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
        >
          {gridItems}
        </Responsive>
      )}
    </div>
  );
};

export default DashboardGrid;
