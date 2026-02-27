import React from 'react';
import {
  Title,
  Content,
  Flex,
  FlexItem,
  Label,
  Button,
  EmptyState,
  EmptyStateBody,
  Skeleton,
  Alert,
  Tooltip
} from '@patternfly/react-core';
import {
  RssIcon,
  ExternalLinkAltIcon,
  StarIcon,
  OutlinedStarIcon,
  EyeSlashIcon,
  ArchiveIcon,
  LightbulbIcon,
  SyncAltIcon
} from '@patternfly/react-icons';
import YouTubeIcon from './YouTubeIcon';
import { isYouTubeFeed, extractYouTubeVideoId, formatFullDate, formatTimestamp } from '../utils';

const ArticleView = ({
  selectedItemId,
  selectedItem,
  loadingItemDetail,
  feeds,
  onToggleSaved,
  onMarkUnseen,
  onArchiveItem,
  onGenerateSummary,
  generatingSummary,
  summaryError
}) => {
  if (!selectedItemId) {
    return (
      <EmptyState titleText="Select an article" headingLevel="h3">
        <RssIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />
        <EmptyStateBody>
          Choose an article from the list to read its content.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  if (loadingItemDetail) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <Skeleton width="80%" height="28px" />
        <Skeleton width="40%" height="16px" style={{ marginTop: '1rem' }} />
        <Skeleton width="100%" height="200px" style={{ marginTop: '1.5rem' }} />
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <Alert variant="warning" title="Article not found" style={{ margin: '1rem' }}>
        The selected article could not be loaded.
      </Alert>
    );
  }

  const videoId = extractYouTubeVideoId(selectedItem.link);
  const feedUrl = feeds.find(f => f.id === selectedItem.feedId)?.xmlUrl;
  const isYouTube = isYouTubeFeed(feedUrl) || videoId;
  const showEmbed = isYouTube && videoId;

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Title */}
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        {selectedItem.title}
      </Title>

      {/* Meta info */}
      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }} style={{ marginBottom: '1rem' }}>
        <FlexItem>
          <Label color={isYouTubeFeed(feedUrl) ? 'red' : 'blue'} isCompact icon={isYouTubeFeed(feedUrl) ? <YouTubeIcon /> : <RssIcon />}>
            {selectedItem.feedTitle}
          </Label>
        </FlexItem>
        <FlexItem>
          <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
            {formatFullDate(selectedItem.pubDate)}
          </Content>
        </FlexItem>
      </Flex>

      {/* Author */}
      {selectedItem.author && (
        <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '0.5rem' }}>
          By {selectedItem.author}
        </Content>
      )}

      {/* Categories */}
      {selectedItem.categories && selectedItem.categories.length > 0 && (
        <Flex gap={{ default: 'gapSm' }} style={{ marginBottom: '1rem' }}>
          {selectedItem.categories.map((cat, idx) => (
            <FlexItem key={idx}>
              <Label isCompact>{cat}</Label>
            </FlexItem>
          ))}
        </Flex>
      )}

      {/* Action buttons */}
      <Flex 
        gap={{ default: 'gapSm' }} 
        wrap={{ default: 'wrap' }}
        style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)' }}
      >
        <FlexItem>
          <Button
            variant="primary"
            icon={<ExternalLinkAltIcon />}
            component="a"
            href={selectedItem.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Original
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            variant="secondary"
            icon={selectedItem.saved ? <StarIcon /> : <OutlinedStarIcon />}
            onClick={(e) => onToggleSaved(e, selectedItem)}
          >
            {selectedItem.saved ? 'Saved' : 'Save'}
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            variant="secondary"
            icon={<EyeSlashIcon />}
            onClick={onMarkUnseen}
          >
            Mark as Unseen
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            variant="secondary"
            icon={<ArchiveIcon />}
            onClick={(e) => onArchiveItem(e, selectedItem)}
          >
            Archive
          </Button>
        </FlexItem>
      </Flex>

      {/* AI Summary Block */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, var(--pf-v6-global--palette--purple-50) 0%, var(--pf-v6-global--palette--blue-50) 100%)',
        borderRadius: '8px',
        border: '1px solid var(--pf-v6-global--palette--purple-100)'
      }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '0.75rem' }}>
          <FlexItem>
            <LightbulbIcon style={{ color: 'var(--pf-v6-global--palette--purple-400)' }} />
          </FlexItem>
          <FlexItem>
            <span style={{ fontWeight: 600, color: 'var(--pf-v6-global--palette--purple-600)' }}>AI Summary</span>
          </FlexItem>
        </Flex>

        {summaryError && (
          <Alert 
            variant="danger" 
            title="Error generating summary" 
            isInline 
            isPlain
            style={{ marginBottom: '0.75rem' }}
          >
            {summaryError}
          </Alert>
        )}

        {selectedItem.aiSummary ? (
          <div>
            <Content component="p" style={{ 
              margin: 0, 
              lineHeight: 1.6,
              color: 'var(--pf-v6-global--Color--100)'
            }}>
              {selectedItem.aiSummary.text}
            </Content>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginTop: '0.75rem' }}>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  Generated {formatTimestamp(selectedItem.aiSummary.generatedAt)}
                  {selectedItem.aiSummary.model && (
                    <span style={{ marginLeft: '0.5rem' }}>
                      · <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{selectedItem.aiSummary.model}</span>
                    </span>
                  )}
                </Content>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="link"
                  size="sm"
                  icon={<SyncAltIcon />}
                  onClick={onGenerateSummary}
                  isLoading={generatingSummary}
                  isDisabled={generatingSummary}
                >
                  Regenerate
                </Button>
              </FlexItem>
            </Flex>
          </div>
        ) : (
          <div>
            <Content component="p" style={{ 
              margin: '0 0 0.75rem 0', 
              color: 'var(--pf-v6-global--Color--200)',
              fontSize: '0.875rem'
            }}>
              Generate an AI-powered summary of this article to quickly understand its key points.
            </Content>
            <Button
              variant="secondary"
              icon={<LightbulbIcon />}
              onClick={onGenerateSummary}
              isLoading={generatingSummary}
              isDisabled={generatingSummary}
            >
              {generatingSummary ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        )}
      </div>

      {/* YouTube Embed for YouTube items */}
      {showEmbed && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: '8px',
            backgroundColor: '#000'
          }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={selectedItem.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="rss-article-content"
        style={{
          lineHeight: 1.7,
          fontSize: '1rem'
        }}
        dangerouslySetInnerHTML={{ __html: selectedItem.content || selectedItem.description || '<p>No content available.</p>' }}
      />

      {/* Style for article content */}
      <style>{`
        .rss-article-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }
        .rss-article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 1rem 0;
        }
        .rss-article-content a {
          color: var(--pf-v6-global--link--Color);
          word-break: break-all;
        }
        .rss-article-content p {
          margin-bottom: 1rem;
        }
        .rss-article-content h1, .rss-article-content h2, .rss-article-content h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .rss-article-content blockquote {
          border-left: 4px solid var(--pf-v6-global--BorderColor--100);
          padding-left: 1rem;
          margin: 1rem 0;
          color: var(--pf-v6-global--Color--200);
        }
        .rss-article-content pre, .rss-article-content code {
          background: var(--pf-v6-global--BackgroundColor--200);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          max-width: 100%;
        }
        .rss-article-content pre {
          padding: 1rem;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .rss-article-content table {
          max-width: 100%;
          overflow-x: auto;
          display: block;
        }
        .rss-article-content iframe {
          max-width: 100%;
        }
        .rss-article-content * {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default ArticleView;
