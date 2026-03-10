import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Content,
  Label,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateBody
} from '@patternfly/react-core';

/**
 * ListWidget - Displays a scrollable list of clickable items
 * 
 * Expected data shape:
 * {
 *   items: [
 *     {
 *       id: string,
 *       title: string,
 *       subtitle: string (optional),
 *       status: string (optional),
 *       statusColor: string (optional),
 *       url: string (optional) - in-app route or external URL,
 *       externalUrl: boolean (optional) - if true, opens in new tab,
 *       timestamp: string (optional)
 *     }
 *   ]
 * }
 */
const ListWidget = ({ data }) => {
  const navigate = useNavigate();

  if (!data || !data.items || data.items.length === 0) {
    return (
      <EmptyState variant="xs">
        <EmptyStateBody>No items to display</EmptyStateBody>
      </EmptyState>
    );
  }

  const { items } = data;

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const handleItemClick = (item) => {
    if (!item.url) return;
    if (item.externalUrl) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.url);
    }
  };

  return (
    <div className="dashboard-list-widget" style={{ overflow: 'auto', height: '100%' }}>
      <DataList aria-label="Widget list" isCompact>
        {items.slice(0, 10).map((item, index) => (
          <DataListItem
            key={item.id || index}
            aria-labelledby={`item-${index}`}
            className={item.url ? 'dashboard-list-item--clickable' : ''}
            onClick={() => handleItemClick(item)}
          >
            <DataListItemRow>
              <DataListItemCells
                dataListCells={[
                  <DataListCell key="primary" width={4}>
                    <Flex direction={{ default: 'column' }} gap={{ default: 'gapNone' }}>
                      <FlexItem>
                        <Content
                          component="p"
                          id={`item-${index}`}
                          style={{ fontWeight: 500, margin: 0 }}
                          className={item.url ? 'dashboard-list-item-title' : ''}
                        >
                          {item.title}
                        </Content>
                      </FlexItem>
                      {item.subtitle && (
                        <FlexItem>
                          <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                            {item.subtitle}
                          </Content>
                        </FlexItem>
                      )}
                    </Flex>
                  </DataListCell>,
                  <DataListCell key="meta" width={1} alignRight>
                    <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsFlexEnd' }} gap={{ default: 'gapXs' }}>
                      {item.status && (
                        <FlexItem>
                          <Label color={item.statusColor || 'blue'} isCompact>
                            {item.status}
                          </Label>
                        </FlexItem>
                      )}
                      {item.timestamp && (
                        <FlexItem>
                          <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                            {getRelativeTime(item.timestamp)}
                          </Content>
                        </FlexItem>
                      )}
                    </Flex>
                  </DataListCell>
                ]}
              />
            </DataListItemRow>
          </DataListItem>
        ))}
      </DataList>
    </div>
  );
};

export default ListWidget;
