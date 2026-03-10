import React from 'react';
import {
  Flex,
  FlexItem,
  Content,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Skeleton,
  Tooltip
} from '@patternfly/react-core';
import {
  RssIcon,
  CheckCircleIcon,
  EyeIcon,
  OutlinedStarIcon,
  ArchiveIcon,
  StarIcon,
  SyncAltIcon,
  PlusCircleIcon
} from '@patternfly/react-icons';
import { formatTimestamp } from '../utils';

const ItemsList = ({
  items,
  loadingItems,
  feeds,
  selectedItemId,
  onItemSelect,
  onToggleSaved,
  onArchiveItem,
  stateFilter,
  refreshing,
  onRefresh,
  onAddFeed
}) => {
  if (loadingItems) {
    return (
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ padding: '1rem' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ padding: '0.75rem', background: 'var(--pf-v6-global--BackgroundColor--100)', borderRadius: '6px' }}>
            <Skeleton width="80%" height="18px" />
            <Skeleton width="100%" height="14px" style={{ marginTop: '0.5rem' }} />
            <Skeleton width="40%" height="12px" style={{ marginTop: '0.5rem' }} />
          </div>
        ))}
      </Flex>
    );
  }

  if (feeds.length === 0) {
    return (
      <EmptyState titleText="No feeds subscribed" headingLevel="h3" style={{ padding: '2rem' }}>
        <RssIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />
        <EmptyStateBody>
          Add a feed to get started reading RSS content.
        </EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="primary" icon={<PlusCircleIcon />} onClick={onAddFeed}>
              Add Feed
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  if (items.length === 0) {
    let message = '';
    let icon = <RssIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />;

    switch (stateFilter) {
      case 'unseen':
        message = 'All caught up! 🎉 No unseen articles.';
        icon = <CheckCircleIcon size="xl" style={{ color: 'var(--pf-v6-global--success-color--100)', marginBottom: '1rem' }} />;
        break;
      case 'seen':
        message = 'No seen articles yet. Read some articles to see them here.';
        icon = <EyeIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />;
        break;
      case 'saved':
        message = 'No saved articles. Star items to save them for later.';
        icon = <OutlinedStarIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />;
        break;
      case 'archive':
        message = 'Archive is empty. Archived items will appear here.';
        icon = <ArchiveIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />;
        break;
      default:
        message = 'No articles yet. Click Refresh to fetch new items.';
    }

    return (
      <EmptyState titleText="No items" headingLevel="h3" style={{ padding: '2rem' }}>
        {icon}
        <EmptyStateBody>{message}</EmptyStateBody>
        {stateFilter === 'all' && (
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="secondary" icon={<SyncAltIcon />} onClick={onRefresh} isLoading={refreshing}>
                Refresh
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        )}
      </EmptyState>
    );
  }

  return (
    <div style={{ padding: '0.5rem' }}>
      {items.map(item => (
        <div
          key={item.id}
          className={`rss-item ${selectedItemId === item.id ? 'rss-item-selected' : ''}`}
          onClick={() => onItemSelect(item)}
          style={{
            padding: '0.75rem',
            marginBottom: '0.5rem',
            background: selectedItemId === item.id
              ? 'var(--pf-t--global--background--color--primary--hover)'
              : 'var(--pf-t--global--background--color--primary--default)',
            borderRadius: '6px',
            cursor: 'pointer',
            border: selectedItemId === item.id
              ? '1px solid var(--pf-t--global--color--brand--default)'
              : '1px solid transparent',
            borderLeft: item.state === 'unseen' 
              ? '3px solid var(--pf-t--global--color--brand--default)' 
              : '3px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapSm' }}>
            {/* Image thumbnail */}
            {item.imageUrl && (
              <FlexItem>
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
              </FlexItem>
            )}

            {/* Content */}
            <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0 }}>
              <Content
                component="p"
                style={{
                  fontWeight: item.state === 'unseen' ? 600 : 400,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {item.title}
              </Content>

              {item.descriptionTruncated && (
                <Content
                  component="p"
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--pf-v6-global--Color--200)',
                    margin: '0.25rem 0 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {item.descriptionTruncated}
                </Content>
              )}

              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                gap={{ default: 'gapSm' }}
                style={{ marginTop: '0.5rem' }}
              >
                <FlexItem>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    {item.feedTitle}
                  </Content>
                </FlexItem>
                <FlexItem>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    · {formatTimestamp(item.pubDate)}
                  </Content>
                </FlexItem>
              </Flex>
            </FlexItem>

            {/* Actions */}
            <FlexItem>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
                <FlexItem>
                  <Tooltip content={item.saved ? 'Unsave' : 'Save'}>
                    <Button
                      variant="plain"
                      onClick={(e) => onToggleSaved(e, item)}
                      style={{ padding: '0.25rem' }}
                    >
                      {item.saved ? (
                        <StarIcon style={{ color: 'var(--pf-v6-global--palette--gold-400)' }} />
                      ) : (
                        <OutlinedStarIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                      )}
                    </Button>
                  </Tooltip>
                </FlexItem>
                <FlexItem>
                  <Tooltip content="Archive">
                    <Button
                      variant="plain"
                      onClick={(e) => onArchiveItem(e, item)}
                      style={{ padding: '0.25rem' }}
                    >
                      <ArchiveIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                    </Button>
                  </Tooltip>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </div>
      ))}
    </div>
  );
};

export default ItemsList;
