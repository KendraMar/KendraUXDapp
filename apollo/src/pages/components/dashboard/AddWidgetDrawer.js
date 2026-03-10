import React, { useState, useMemo } from 'react';
import {
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  DrawerPanelBody,
  Title,
  SearchInput,
  Card,
  CardBody,
  CardTitle,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Label,
  Button,
  Divider,
  ExpandableSection
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { getWidgetsByApp } from './widgetRegistry';

/**
 * AddWidgetDrawer - Panel content for adding widgets to the dashboard
 * 
 * Shows available widgets grouped by app with search/filter.
 */
const AddWidgetDrawer = ({ onAddWidget, onClose, existingWidgetIds }) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedApps, setExpandedApps] = useState({});

  const widgetsByApp = useMemo(() => getWidgetsByApp(), []);

  // Filter widgets based on search
  const filteredApps = useMemo(() => {
    if (!searchValue.trim()) return widgetsByApp;

    const query = searchValue.toLowerCase();
    return widgetsByApp
      .map(appGroup => ({
        ...appGroup,
        widgets: appGroup.widgets.filter(
          w =>
            w.name.toLowerCase().includes(query) ||
            w.description?.toLowerCase().includes(query) ||
            appGroup.appName.toLowerCase().includes(query)
        )
      }))
      .filter(appGroup => appGroup.widgets.length > 0);
  }, [widgetsByApp, searchValue]);

  const toggleApp = (appId) => {
    setExpandedApps(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  const getWidgetTypeLabel = (type) => {
    const colors = {
      stats: 'blue',
      list: 'green',
      feed: 'purple',
      chart: 'orange',
      note: 'grey'
    };
    return (
      <Label color={colors[type] || 'grey'} isCompact>
        {type}
      </Label>
    );
  };

  return (
    <DrawerPanelContent widths={{ default: 'width_33' }} minSize="320px">
      <DrawerHead>
        <Title headingLevel="h3" size="lg">
          Add Widget
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <SearchInput
          placeholder="Search widgets..."
          value={searchValue}
          onChange={(event, value) => setSearchValue(value)}
          onClear={() => setSearchValue('')}
          style={{ marginBottom: '1rem' }}
        />

        {filteredApps.length === 0 && (
          <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)', textAlign: 'center', padding: '2rem 0' }}>
            No widgets found matching &ldquo;{searchValue}&rdquo;
          </Content>
        )}

        {filteredApps.map(appGroup => (
          <div key={appGroup.appId} style={{ marginBottom: '0.75rem' }}>
            <ExpandableSection
              toggleText={`${appGroup.appName} (${appGroup.widgets.length})`}
              isExpanded={expandedApps[appGroup.appId] !== false}
              onToggle={() => toggleApp(appGroup.appId)}
              isIndented
            >
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} style={{ padding: '0.5rem 0' }}>
                {appGroup.widgets.map(widget => (
                  <FlexItem key={widget.id}>
                    <Card isFlat isCompact className="dashboard-add-widget-card">
                      <CardHeader
                        actions={{
                          actions: (
                            <Button
                              variant="plain"
                              onClick={() => onAddWidget(widget)}
                              aria-label={`Add ${widget.name}`}
                              icon={<PlusCircleIcon />}
                            />
                          )
                        }}
                      >
                        <CardTitle>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <Content component="p" style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>
                                {widget.name}
                              </Content>
                            </FlexItem>
                            <FlexItem>
                              {getWidgetTypeLabel(widget.type)}
                            </FlexItem>
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      {widget.description && (
                        <CardBody>
                          <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                            {widget.description}
                          </Content>
                        </CardBody>
                      )}
                    </Card>
                  </FlexItem>
                ))}
              </Flex>
            </ExpandableSection>
          </div>
        ))}
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default AddWidgetDrawer;
