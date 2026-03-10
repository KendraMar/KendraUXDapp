import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Flex,
  FlexItem,
  Button,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Label,
  Tabs,
  Tab,
  TabTitleText
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  PlayIcon,
  SaveIcon,
  ExternalLinkAltIcon
} from '@patternfly/react-icons';
import { parseMarkdownToSlides, generateStackedPreviewHtml } from './utils';
import ExportModal from './components/ExportModal';
import MarkdownEditor from './components/MarkdownEditor';
import PreviewView from './components/PreviewView';
import SplitView from './components/SplitView';
import PresentMode from './components/PresentMode';

const SlideDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [slideDeck, setSlideDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('split');
  const [markdown, setMarkdown] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Generate stacked preview HTML from current markdown for split view
  const stackedPreviewHtml = useMemo(() => {
    const slideData = parseMarkdownToSlides(markdown, slideDeck?.title || 'Presentation');
    return generateStackedPreviewHtml(slideData);
  }, [markdown, slideDeck?.title]);

  useEffect(() => {
    fetchSlideDeck();
  }, [id]);

  const fetchSlideDeck = async () => {
    try {
      const response = await fetch(`/api/slides/${id}`);
      const data = await response.json();
      if (data.success) {
        setSlideDeck(data.slideDeck);
        setMarkdown(data.slideDeck.markdown || '');
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching slide deck:', err);
      setError('Failed to load slide deck');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/slides/${id}/slides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown })
      });
      const data = await response.json();
      if (data.success) {
        setHasChanges(false);
        // Update slide count
        setSlideDeck(prev => ({ ...prev, slideCount: data.slideCount }));
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save changes');
    }
    setIsSaving(false);
  };

  const handleMarkdownChange = (value) => {
    setMarkdown(value);
    setHasChanges(true);
  };

  const openPresentation = () => {
    window.open(`/api/slides/${id}/player`, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const enterPresentMode = () => {
    setIsPresentMode(true);
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading slide deck...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <Title headingLevel="h2" size="lg">Error Loading Slide Deck</Title>
          <EmptyStateBody>{error}</EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/slides')}>
            Back to Slides
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  // Present mode - fullscreen iframe
  if (isPresentMode) {
    return (
      <PresentMode 
        slideDeckId={id}
        slideDeckTitle={slideDeck?.title}
        onExit={() => setIsPresentMode(false)}
      />
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0, paddingBottom: '1rem' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Button variant="plain" onClick={() => navigate('/slides')}>
              <ArrowLeftIcon />
            </Button>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="xl">
              {slideDeck?.title || 'Slide Deck'}
            </Title>
            <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ marginTop: '0.25rem' }}>
              <FlexItem>
                <Label color="red" isCompact>
                  {slideDeck?.template?.toUpperCase() || 'UXD'}
                </Label>
              </FlexItem>
              <FlexItem>
                <Label color="blue" isCompact>
                  {slideDeck?.aspectRatio || '16:9'}
                </Label>
              </FlexItem>
              <FlexItem>
                <Label color="grey" isCompact>
                  {slideDeck?.slideCount || 0} slides
                </Label>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              {hasChanges && (
                <FlexItem>
                  <Button 
                    variant="primary" 
                    icon={<SaveIcon />}
                    onClick={handleSave}
                    isLoading={isSaving}
                  >
                    Save Changes
                  </Button>
                </FlexItem>
              )}
              <FlexItem>
                <ExportModal 
                  slideDeckId={id}
                  slideDeckTitle={slideDeck?.title}
                  isExporting={isExporting}
                  setIsExporting={setIsExporting}
                />
              </FlexItem>
              <FlexItem>
                <Button variant="secondary" icon={<ExternalLinkAltIcon />} onClick={openPresentation}>
                  Open
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="primary" icon={<PlayIcon />} onClick={enterPresentMode}>
                  Present
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Tabs */}
      <PageSection variant="light" style={{ flexShrink: 0, paddingTop: 0, paddingBottom: 0 }}>
        <Tabs activeKey={activeTab} onSelect={(e, k) => setActiveTab(k)}>
          <Tab eventKey="preview" title={<TabTitleText>Preview</TabTitleText>} />
          <Tab eventKey="edit" title={<TabTitleText>Edit Markdown</TabTitleText>} />
          <Tab eventKey="split" title={<TabTitleText>Split View</TabTitleText>} />
        </Tabs>
      </PageSection>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#1a1a1a' }}>
        {activeTab === 'preview' && (
          <PreviewView 
            slideDeckId={id}
            slideDeckTitle={slideDeck?.title}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        )}

        {activeTab === 'edit' && (
          <MarkdownEditor 
            markdown={markdown}
            onChange={handleMarkdownChange}
          />
        )}

        {activeTab === 'split' && (
          <SplitView 
            markdown={markdown}
            onMarkdownChange={handleMarkdownChange}
            stackedPreviewHtml={stackedPreviewHtml}
            slideDeckTitle={slideDeck?.title}
          />
        )}
      </div>

      {/* Help text for editor */}
      {(activeTab === 'edit' || activeTab === 'split') && (
        <div style={{ 
          background: '#1a1a1a', 
          borderTop: '1px solid #333',
          padding: '0.5rem 1rem',
          color: '#888',
          fontSize: '12px'
        }}>
          <strong>Slide format:</strong> Separate slides with <code style={{ background: '#333', padding: '2px 6px', borderRadius: '3px' }}>---</code> • 
          Use <code style={{ background: '#333', padding: '2px 6px', borderRadius: '3px' }}># Heading</code> for slide title • 
          <code style={{ background: '#333', padding: '2px 6px', borderRadius: '3px' }}>## Subheading</code> for subtitle • 
          <code style={{ background: '#333', padding: '2px 6px', borderRadius: '3px' }}>- item</code> for bullets • 
          Add <code style={{ background: '#333', padding: '2px 6px', borderRadius: '3px' }}>{'<!-- type: title -->'}</code> for title slides
        </div>
      )}
    </div>
  );
};

export default SlideDetail;
