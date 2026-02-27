import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Spinner,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Flex,
  FlexItem,
  Content,
  Tooltip
} from '@patternfly/react-core';
import {
  GripVerticalIcon,
  EllipsisVIcon,
  TimesIcon,
  SyncAltIcon
} from '@patternfly/react-icons';

import StatsWidget from './widgets/StatsWidget';
import ListWidget from './widgets/ListWidget';
import FeedWidget from './widgets/FeedWidget';
import ChartWidget from './widgets/ChartWidget';
import NoteWidget from './widgets/NoteWidget';
import { transformData } from './dataTransforms';

const WIDGET_COMPONENTS = {
  stats: StatsWidget,
  list: ListWidget,
  feed: FeedWidget,
  chart: ChartWidget,
  note: NoteWidget
};

/**
 * WidgetCard - Wraps a widget renderer in a PatternFly Card
 * 
 * Handles data fetching, loading states, error states, and edit mode controls.
 */
const WidgetCard = ({
  widgetDef,
  instanceConfig,
  isEditing,
  onRemove,
  onConfigChange
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!widgetDef?.dataEndpoint || widgetDef.type === 'note') return;

    setLoading(prev => prev === false ? false : true);
    if (!data) setLoading(true);

    try {
      const res = await fetch(widgetDef.dataEndpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const transformed = transformData(widgetDef.dataTransform, raw, widgetDef);
      setData(transformed);
      setError(null);
    } catch (err) {
      console.error(`[WidgetCard] Error fetching ${widgetDef.dataEndpoint}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [widgetDef?.dataEndpoint, widgetDef?.dataTransform]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchData();

    if (widgetDef?.refreshInterval && widgetDef.type !== 'note') {
      intervalRef.current = setInterval(fetchData, widgetDef.refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, widgetDef?.refreshInterval]);

  const WidgetComponent = WIDGET_COMPONENTS[widgetDef?.type] || null;
  const widgetName = widgetDef?.name || 'Widget';

  const handleRefresh = () => {
    setMenuOpen(false);
    setData(null);
    setLoading(true);
    fetchData();
  };

  const handleRemove = () => {
    setMenuOpen(false);
    if (onRemove) onRemove();
  };

  const renderCardActions = () => {
    if (!isEditing) return null;

    return (
      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
        <FlexItem>
          <Tooltip content="Refresh">
            <button
              className="dashboard-widget-action-btn"
              onClick={handleRefresh}
              aria-label="Refresh widget"
            >
              <SyncAltIcon />
            </button>
          </Tooltip>
        </FlexItem>
        <FlexItem>
          <Tooltip content="Remove">
            <button
              className="dashboard-widget-action-btn dashboard-widget-remove-btn"
              onClick={handleRemove}
              aria-label="Remove widget"
            >
              <TimesIcon />
            </button>
          </Tooltip>
        </FlexItem>
        <FlexItem>
          <Tooltip content="Drag to move">
            <span className="dashboard-widget-drag-handle" aria-label="Drag handle">
              <GripVerticalIcon />
            </span>
          </Tooltip>
        </FlexItem>
      </Flex>
    );
  };

  const renderBody = () => {
    if (loading && !data) {
      return (
        <Flex
          justifyContent={{ default: 'justifyContentCenter' }}
          alignItems={{ default: 'alignItemsCenter' }}
          style={{ height: '100%', minHeight: 80 }}
        >
          <Spinner size="lg" />
        </Flex>
      );
    }

    if (error && !data) {
      return (
        <Flex
          direction={{ default: 'column' }}
          justifyContent={{ default: 'justifyContentCenter' }}
          alignItems={{ default: 'alignItemsCenter' }}
          style={{ height: '100%', minHeight: 80, textAlign: 'center', padding: '1rem' }}
        >
          <FlexItem>
            <Content component="p" style={{ color: 'var(--pf-t--global--color--status--danger--default)' }}>
              Unable to load data
            </Content>
          </FlexItem>
          <FlexItem>
            <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
              {error}
            </Content>
          </FlexItem>
        </Flex>
      );
    }

    if (!WidgetComponent) {
      return (
        <Content component="p" style={{ padding: '1rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
          Unknown widget type: {widgetDef?.type}
        </Content>
      );
    }

    return (
      <WidgetComponent
        data={data}
        config={instanceConfig?.config}
        onConfigChange={onConfigChange}
      />
    );
  };

  return (
    <Card
      className={`dashboard-widget-card ${isEditing ? 'dashboard-widget-card--editing' : ''}`}
      isFullHeight
      isFlat
    >
      <CardHeader
        className="dashboard-widget-card-header"
        actions={{ actions: renderCardActions() }}
      >
        <CardTitle className="dashboard-widget-card-title">
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            {isEditing && (
              <FlexItem className="dashboard-widget-drag-handle">
                <GripVerticalIcon style={{ color: 'var(--pf-t--global--text--color--subtle)', cursor: 'grab' }} />
              </FlexItem>
            )}
            <FlexItem>
              <Content component="p" style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>
                {widgetName}
              </Content>
            </FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody className="dashboard-widget-card-body" style={{ overflow: 'hidden', padding: 0 }}>
        {renderBody()}
      </CardBody>
    </Card>
  );
};

export default WidgetCard;
