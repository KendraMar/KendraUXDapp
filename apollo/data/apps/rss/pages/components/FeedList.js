import React from 'react';
import {
  Flex,
  FlexItem,
  Badge,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Divider
} from '@patternfly/react-core';
import {
  RssIcon,
  SyncAltIcon,
  ExclamationCircleIcon,
  EllipsisVIcon
} from '@patternfly/react-icons';
import YouTubeIcon from './YouTubeIcon';
import { isYouTubeFeed } from '../utils';

const FeedList = ({ 
  feeds, 
  selectedFeedId, 
  onFeedSelect, 
  totalUnseenCount,
  refreshingFeeds,
  kebabMenuOpen,
  onKebabMenuToggle,
  onMarkAllSeenClick
}) => {
  const feedItemStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    backgroundColor: isActive ? 'var(--pf-t--global--background--color--primary--hover)' : 'transparent',
    border: isActive ? '1px solid var(--pf-t--global--color--brand--default)' : '1px solid transparent',
    marginBottom: '2px',
    transition: 'all 0.15s ease'
  });

  return (
    <div className="rss-feed-list">
      {/* All Feeds */}
      <div
        className={selectedFeedId === null ? 'rss-feed-selected' : ''}
        style={feedItemStyle(selectedFeedId === null)}
        onClick={() => onFeedSelect(null)}
      >
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
        >
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ flex: 1, minWidth: 0 }}>
            <FlexItem>
              <RssIcon style={{ color: 'var(--pf-v6-global--palette--orange-400)' }} />
            </FlexItem>
            <FlexItem>
              <span style={{ fontWeight: 600 }}>All Feeds</span>
            </FlexItem>
          </Flex>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            {totalUnseenCount > 0 && (
              <FlexItem>
                <Badge isRead={false}>{totalUnseenCount}</Badge>
              </FlexItem>
            )}
            <FlexItem>
              <Dropdown
                isOpen={kebabMenuOpen['allFeeds'] === true}
                onSelect={() => onKebabMenuToggle({})}
                onOpenChange={(isOpen) => onKebabMenuToggle(isOpen ? { allFeeds: true } : {})}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    variant="plain"
                    onClick={(e) => {
                      e.stopPropagation();
                      onKebabMenuToggle(kebabMenuOpen.allFeeds ? {} : { allFeeds: true });
                    }}
                    isExpanded={kebabMenuOpen['allFeeds'] === true}
                    style={{ padding: '4px' }}
                  >
                    <EllipsisVIcon />
                  </MenuToggle>
                )}
                popperProps={{ position: 'end' }}
              >
                <DropdownList>
                  <DropdownItem 
                    key="mark-all-seen" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAllSeenClick();
                      onKebabMenuToggle({});
                    }}
                  >
                    Mark all as seen
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </FlexItem>
          </Flex>
        </Flex>
      </div>

      <Divider style={{ margin: '0.5rem 0' }} />

      {/* Individual Feeds */}
      {feeds
        .map(feed => (
          <div
            key={feed.id}
            className={selectedFeedId === feed.id ? 'rss-feed-selected' : ''}
            style={feedItemStyle(selectedFeedId === feed.id)}
            onClick={() => onFeedSelect(feed.id)}
          >
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              flexWrap={{ default: 'nowrap' }}
              style={{ overflow: 'hidden' }}
            >
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'nowrap' }} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <FlexItem style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {refreshingFeeds.has(feed.id) ? (
                    <SyncAltIcon style={{ 
                      color: 'var(--pf-v6-global--palette--blue-400)',
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : feed.hasError ? (
                    <ExclamationCircleIcon style={{ color: 'var(--pf-v6-global--danger-color--100)' }} />
                  ) : isYouTubeFeed(feed.xmlUrl) ? (
                    <YouTubeIcon style={{ color: '#FF0000' }} />
                  ) : (
                    <RssIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                  )}
                </FlexItem>
                <FlexItem style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  <span style={{
                    fontWeight: feed.unseenCount > 0 ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}>
                    {feed.title}
                  </span>
                </FlexItem>
              </Flex>
              {feed.unseenCount > 0 && (
                <FlexItem style={{ flexShrink: 0 }}>
                  <Badge isRead={false}>{feed.unseenCount}</Badge>
                </FlexItem>
              )}
            </Flex>
          </div>
        ))}
    </div>
  );
};

export default FeedList;
