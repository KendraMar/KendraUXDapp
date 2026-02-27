import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PageSection,
  Title,
  Content,
  Button,
  Flex,
  FlexItem,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Spinner,
  Tooltip,
  Divider
} from '@patternfly/react-core';
import {
  PlusCircleIcon,
  PencilAltIcon,
  CheckIcon,
  CubesIcon
} from '@patternfly/react-icons';

import DashboardGrid from './components/dashboard/DashboardGrid';
import DashboardTabs from './components/dashboard/DashboardTabs';
import AddWidgetDrawer from './components/dashboard/AddWidgetDrawer';

/**
 * Dashboard - Main dashboard page with configurable widget grid
 * 
 * Features:
 * - Multiple dashboards via tabs
 * - Drag-and-drop widget repositioning
 * - Resizable widgets
 * - Add/remove widgets from app data sources
 * - Persistent layout saved to server
 */
const Dashboard = () => {
  const [dashboards, setDashboards] = useState([]);
  const [activeTabId, setActiveTabId] = useState('default');
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  // Load dashboard config from server
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/dashboard/config');
        const data = await res.json();
        if (data.success && data.dashboards) {
          setDashboards(data.dashboards);
          setActiveTabId(data.activeTab || data.dashboards[0]?.id || 'default');
        } else {
          // Set default dashboard
          setDashboards([{
            id: 'default',
            name: 'My Dashboard',
            layouts: { lg: [], md: [], sm: [] },
            widgets: []
          }]);
        }
      } catch (err) {
        console.error('[Dashboard] Error loading config:', err);
        setDashboards([{
          id: 'default',
          name: 'My Dashboard',
          layouts: { lg: [], md: [], sm: [] },
          widgets: []
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Save dashboard config to server (debounced)
  const saveConfig = useCallback((updatedDashboards, activeTab) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/dashboard/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dashboards: updatedDashboards,
            activeTab: activeTab
          })
        });
      } catch (err) {
        console.error('[Dashboard] Error saving config:', err);
      }
    }, 500);
  }, []);

  // Get active dashboard
  const activeDashboard = dashboards.find(d => d.id === activeTabId) || dashboards[0];

  // Update a specific dashboard and save
  const updateDashboard = useCallback((dashboardId, updates) => {
    setDashboards(prev => {
      const updated = prev.map(d =>
        d.id === dashboardId ? { ...d, ...updates } : d
      );
      saveConfig(updated, activeTabId);
      return updated;
    });
  }, [activeTabId, saveConfig]);

  // Layout change handler
  const handleLayoutChange = useCallback((allLayouts) => {
    if (!activeDashboard || !isEditing) return;
    updateDashboard(activeDashboard.id, { layouts: allLayouts });
  }, [activeDashboard, isEditing, updateDashboard]);

  // Add widget
  const handleAddWidget = useCallback((widgetDef) => {
    if (!activeDashboard) return;

    const instanceId = `w-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newWidget = {
      instanceId,
      widgetId: widgetDef.id,
      config: {}
    };

    const colCount = 12;
    const defaultW = Math.min(widgetDef.defaultSize?.w || 4, colCount);
    const defaultH = widgetDef.defaultSize?.h || 3;

    // Place new widget at the bottom
    const newLayoutItem = {
      i: instanceId,
      x: 0,
      y: Infinity,
      w: defaultW,
      h: defaultH,
      minW: 2,
      minH: 2
    };

    const updatedLayouts = { ...activeDashboard.layouts };
    for (const bp of ['lg', 'md', 'sm']) {
      updatedLayouts[bp] = [...(updatedLayouts[bp] || []), { ...newLayoutItem }];
    }

    updateDashboard(activeDashboard.id, {
      widgets: [...activeDashboard.widgets, newWidget],
      layouts: updatedLayouts
    });
  }, [activeDashboard, updateDashboard]);

  // Remove widget
  const handleRemoveWidget = useCallback((instanceId) => {
    if (!activeDashboard) return;

    const updatedWidgets = activeDashboard.widgets.filter(w => w.instanceId !== instanceId);
    const updatedLayouts = { ...activeDashboard.layouts };
    for (const bp of ['lg', 'md', 'sm']) {
      updatedLayouts[bp] = (updatedLayouts[bp] || []).filter(l => l.i !== instanceId);
    }

    updateDashboard(activeDashboard.id, {
      widgets: updatedWidgets,
      layouts: updatedLayouts
    });
  }, [activeDashboard, updateDashboard]);

  // Widget config change
  const handleWidgetConfigChange = useCallback((instanceId, newConfig) => {
    if (!activeDashboard) return;

    const updatedWidgets = activeDashboard.widgets.map(w =>
      w.instanceId === instanceId ? { ...w, config: newConfig } : w
    );

    updateDashboard(activeDashboard.id, { widgets: updatedWidgets });
  }, [activeDashboard, updateDashboard]);

  // Tab operations
  const handleSelectTab = useCallback((tabId) => {
    setActiveTabId(tabId);
    saveConfig(dashboards, tabId);
  }, [dashboards, saveConfig]);

  const handleCreateDashboard = useCallback((name) => {
    const newId = `dashboard-${Date.now()}`;
    const newDashboard = {
      id: newId,
      name,
      layouts: { lg: [], md: [], sm: [] },
      widgets: []
    };

    setDashboards(prev => {
      const updated = [...prev, newDashboard];
      saveConfig(updated, newId);
      return updated;
    });
    setActiveTabId(newId);
  }, [saveConfig]);

  const handleRenameDashboard = useCallback((dashboardId, newName) => {
    updateDashboard(dashboardId, { name: newName });
  }, [updateDashboard]);

  const handleDeleteDashboard = useCallback((dashboardId) => {
    setDashboards(prev => {
      const updated = prev.filter(d => d.id !== dashboardId);
      const newActiveId = activeTabId === dashboardId
        ? (updated[0]?.id || 'default')
        : activeTabId;

      if (updated.length === 0) {
        updated.push({
          id: 'default',
          name: 'My Dashboard',
          layouts: { lg: [], md: [], sm: [] },
          widgets: []
        });
      }

      saveConfig(updated, newActiveId);
      setActiveTabId(newActiveId);
      return updated;
    });
  }, [activeTabId, saveConfig]);

  const handleDuplicateDashboard = useCallback((dashboardId) => {
    const source = dashboards.find(d => d.id === dashboardId);
    if (!source) return;

    const newId = `dashboard-${Date.now()}`;
    const duplicated = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (copy)`
    };

    setDashboards(prev => {
      const updated = [...prev, duplicated];
      saveConfig(updated, newId);
      return updated;
    });
    setActiveTabId(newId);
  }, [dashboards, saveConfig]);

  // Toggle edit mode
  const toggleEditing = () => {
    if (isEditing) {
      setIsDrawerOpen(false);
    }
    setIsEditing(!isEditing);
  };

  if (loading) {
    return (
      <PageSection>
        <Flex justifyContent={{ default: 'justifyContentCenter' }} alignItems={{ default: 'alignItemsCenter' }} style={{ minHeight: 300 }}>
          <Spinner size="xl" />
        </Flex>
      </PageSection>
    );
  }

  const hasWidgets = activeDashboard && activeDashboard.widgets.length > 0;

  const drawerContent = (
    <>
      {/* Header */}
      <PageSection variant="light" className="dashboard-header-section" padding={{ default: 'padding' }}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              Dashboard
            </Title>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapSm' }}>
              {isEditing && (
                <FlexItem>
                  <Button
                    variant="secondary"
                    icon={<PlusCircleIcon />}
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  >
                    Add Widget
                  </Button>
                </FlexItem>
              )}
              <FlexItem>
                <Button
                  variant={isEditing ? 'primary' : 'secondary'}
                  icon={isEditing ? <CheckIcon /> : <PencilAltIcon />}
                  onClick={toggleEditing}
                >
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Tabs */}
      {dashboards.length > 0 && (
        <PageSection variant="light" padding={{ default: 'noPadding' }} className="dashboard-tabs-section">
          <DashboardTabs
            dashboards={dashboards}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCreateDashboard={handleCreateDashboard}
            onRenameDashboard={handleRenameDashboard}
            onDeleteDashboard={handleDeleteDashboard}
            onDuplicateDashboard={handleDuplicateDashboard}
          />
        </PageSection>
      )}

      {/* Grid or Empty State */}
      <PageSection className="dashboard-grid-section" isFilled>
        {hasWidgets ? (
          <DashboardGrid
            layouts={activeDashboard.layouts}
            widgets={activeDashboard.widgets}
            isEditing={isEditing}
            onLayoutChange={handleLayoutChange}
            onRemoveWidget={handleRemoveWidget}
            onWidgetConfigChange={handleWidgetConfigChange}
          />
        ) : (
          <EmptyState
            titleText={isEditing ? 'Add your first widget' : 'No widgets yet'}
            headingLevel="h2"
            icon={CubesIcon}
          >
            <EmptyStateBody>
              {isEditing
                ? 'Click "Add Widget" to browse available widgets from your connected apps and data sources.'
                : 'Click "Edit" to start building your custom dashboard with widgets from your apps.'}
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                {isEditing ? (
                  <Button
                    variant="primary"
                    icon={<PlusCircleIcon />}
                    onClick={() => setIsDrawerOpen(true)}
                  >
                    Add Widget
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    icon={<PencilAltIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Dashboard
                  </Button>
                )}
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        )}
      </PageSection>
    </>
  );

  return (
    <Drawer isExpanded={isDrawerOpen} position="right" className="dashboard-drawer">
      <DrawerContent
        panelContent={
          isDrawerOpen ? (
            <AddWidgetDrawer
              onAddWidget={handleAddWidget}
              onClose={() => setIsDrawerOpen(false)}
              existingWidgetIds={activeDashboard?.widgets.map(w => w.widgetId) || []}
            />
          ) : null
        }
      >
        <DrawerContentBody>
          {drawerContent}
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default Dashboard;
