import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Content,
  Flex,
  FlexItem,
  Label,
  EmptyState,
  EmptyStateBody
} from '@patternfly/react-core';

/**
 * FeedWidget - Displays a timestamped activity feed with clickable items
 * 
 * Expected data shape:
 * {
 *   items: [
 *     {
 *       id: string,
 *       text: string,
 *       source: string (optional),
 *       sourceColor: string (optional),
 *       timestamp: string,
 *       url: string (optional) - in-app route or external URL,
 *       externalUrl: boolean (optional)
 *     }
 *   ]
 * }
 */
const FeedWidget = ({ data }) => {
  const navigate = useNavigate();

  if (!data || !data.items || data.items.length === 0) {
    return (
      <EmptyState variant="xs">
        <EmptyStateBody>No recent activity</EmptyStateBody>
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
    <div className="dashboard-feed-widget" style={{ overflow: 'auto', height: '100%' }}>
      {items.slice(0, 15).map((item, index) => (
        <div
          key={item.id || index}
          className={`dashboard-feed-item ${item.url ? 'dashboard-feed-item--clickable' : ''}`}
          style={{
            padding: '0.625rem 0.75rem',
            borderBottom: '1px solid var(--pf-t--global--border--color--default)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            cursor: item.url ? 'pointer' : 'default'
          }}
          onClick={() => handleItemClick(item)}
          role={item.url ? 'link' : undefined}
          tabIndex={item.url ? 0 : undefined}
          onKeyDown={item.url ? (e) => { if (e.key === 'Enter') handleItemClick(item); } : undefined}
        >
          <div
            className="dashboard-feed-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--pf-t--global--color--brand--default)',
              marginTop: 6,
              flexShrink: 0
            }}
          />
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapNone' }} style={{ flex: 1, minWidth: 0 }}>
            <FlexItem>
              <Content
                component="p"
                style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.4 }}
                className={item.url ? 'dashboard-feed-item-text' : ''}
              >
                {item.text}
              </Content>
            </FlexItem>
            <FlexItem>
              <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                {item.source && (
                  <FlexItem>
                    <Label color={item.sourceColor || 'grey'} isCompact>
                      {item.source}
                    </Label>
                  </FlexItem>
                )}
                <FlexItem>
                  <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                    {getRelativeTime(item.timestamp)}
                  </Content>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </div>
      ))}
    </div>
  );
};

export default FeedWidget;
