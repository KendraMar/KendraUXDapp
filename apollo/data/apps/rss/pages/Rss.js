import React, { useState, useEffect, useRef } from 'react';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Badge,
  Button,
  TextInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  ToggleGroup,
  ToggleGroupItem,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Spinner
} from '@patternfly/react-core';
import {
  RssIcon,
  SearchIcon,
  PlusCircleIcon,
  SyncAltIcon,
  ImportIcon,
  ExportIcon,
  EllipsisVIcon,
  ArrowLeftIcon
} from '@patternfly/react-icons';
import FeedList from './components/FeedList';
import ItemsList from './components/ItemsList';
import ArticleView from './components/ArticleView';
import AddFeedModal from './components/AddFeedModal';
import MarkAllSeenModal from './components/MarkAllSeenModal';

// localStorage key for persisting selected state
const RSS_STATE_KEY = 'rss-selected-state';

// Mobile breakpoint (matches typical phone screens)
const MOBILE_BREAKPOINT = 768;

const Rss = () => {
  // State for feeds
  const [feeds, setFeeds] = useState([]);
  const [selectedFeedId, setSelectedFeedId] = useState(() => {
    // Initialize from localStorage if available
    try {
      const saved = localStorage.getItem(RSS_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.feedId ?? null;
      }
    } catch (e) {
      console.warn('Failed to load RSS state from localStorage:', e);
    }
    return null;
  });
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [feedsError, setFeedsError] = useState(null);

  // State for items
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(() => {
    // Initialize from localStorage if available
    try {
      const saved = localStorage.getItem(RSS_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.itemId ?? null;
      }
    } catch (e) {
      // Already warned above
    }
    return null;
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingItemDetail, setLoadingItemDetail] = useState(false);

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [sortSelectOpen, setSortSelectOpen] = useState(false);

  // State for modals
  const [addFeedModalOpen, setAddFeedModalOpen] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedTitle, setNewFeedTitle] = useState('');
  const [newFeedDescription, setNewFeedDescription] = useState('');
  const [addingFeed, setAddingFeed] = useState(false);
  const [addFeedError, setAddFeedError] = useState(null);

  // State for refresh
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingFeeds, setRefreshingFeeds] = useState(new Set());

  // State for kebab menu
  const [kebabMenuOpen, setKebabMenuOpen] = useState({});

  // State for AI summary
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // State for mark all seen confirmation modal
  const [markAllSeenModalOpen, setMarkAllSeenModalOpen] = useState(false);
  const [markingAllSeen, setMarkingAllSeen] = useState(false);

  // State for mobile view
  // mobileView: 'feeds' | 'items' | 'article'
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState('feeds');

  // File input ref for OPML import
  const fileInputRef = useRef(null);

  // Calculate total unseen count
  const totalUnseenCount = feeds.reduce((sum, f) => sum + (f.unseenCount || 0), 0);

  // Handle responsive layout
  useEffect(() => {
    const checkMobile = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(nowMobile);
      
      // When first loading on mobile, set appropriate view based on persisted state
      if (!wasMobile && nowMobile) {
        if (selectedItemId && selectedItem) {
          setMobileView('article');
        } else if (selectedFeedId !== null) {
          setMobileView('items');
        } else {
          setMobileView('feeds');
        }
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile, selectedItemId, selectedItem, selectedFeedId]);

  // On initial mobile load, set view based on persisted state
  useEffect(() => {
    if (isMobile && !loadingFeeds) {
      if (selectedItemId && selectedItem) {
        setMobileView('article');
      } else if (selectedFeedId !== null) {
        setMobileView('items');
      }
      // Otherwise keep default 'feeds' view
    }
  }, [loadingFeeds]);

  // Persist selected state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RSS_STATE_KEY, JSON.stringify({
        feedId: selectedFeedId,
        itemId: selectedItemId
      }));
    } catch (e) {
      console.warn('Failed to save RSS state to localStorage:', e);
    }
  }, [selectedFeedId, selectedItemId]);

  // Fetch feeds on mount
  useEffect(() => {
    fetchFeeds();
  }, []);

  // Fetch items when feed selection or filter changes
  useEffect(() => {
    fetchItems();
  }, [selectedFeedId, stateFilter]);

  // Restore selected item detail on mount (when items are loaded and there's a persisted itemId)
  useEffect(() => {
    if (selectedItemId && !selectedItem && !loadingItemDetail && items.length > 0) {
      // Check if the selected item is in the current items list
      const itemExists = items.some(item => item.id === selectedItemId);
      if (itemExists) {
        fetchItemDetail(selectedItemId);
      } else {
        // Item not in current list - try to fetch it anyway (it might exist in a different filter)
        fetchItemDetail(selectedItemId);
      }
    }
  }, [items, selectedItemId, selectedItem, loadingItemDetail]);

  // Close the feed actions dropdown when switching feeds
  useEffect(() => {
    setKebabMenuOpen({});
  }, [selectedFeedId]);

  const fetchFeeds = async () => {
    setLoadingFeeds(true);
    setFeedsError(null);

    try {
      const response = await fetch('/api/rss/feeds');
      const data = await response.json();

      if (data.success) {
        setFeeds(data.feeds || []);
      } else {
        setFeedsError(data.error || 'Failed to fetch feeds');
      }
    } catch (err) {
      setFeedsError(`Error fetching feeds: ${err.message}`);
    } finally {
      setLoadingFeeds(false);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);

    try {
      const params = new URLSearchParams({
        stateFilter,
        limit: '100',
        offset: '0'
      });

      if (selectedFeedId) {
        params.append('feedId', selectedFeedId);
      }

      const response = await fetch(`/api/rss/items?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchItemDetail = async (itemId) => {
    setLoadingItemDetail(true);

    try {
      const response = await fetch(`/api/rss/items/${itemId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedItem(data.item);

        // Mark as seen if unseen
        if (data.item.state === 'unseen') {
          markItemSeen(itemId);
        }
      }
    } catch (err) {
      console.error('Error fetching item detail:', err);
    } finally {
      setLoadingItemDetail(false);
    }
  };

  const markItemSeen = async (itemId) => {
    try {
      await fetch(`/api/rss/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'seen' })
      });

      // Update local state
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, state: 'seen', seenAt: new Date().toISOString() } : item
      ));

      // Update feed unseen counts
      fetchFeeds();
    } catch (err) {
      console.error('Error marking item as seen:', err);
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItemId(item.id);
    fetchItemDetail(item.id);
    // On mobile, switch to article view when item is selected
    if (isMobile) {
      setMobileView('article');
    }
  };

  // Handle feed selection on mobile
  const handleFeedSelect = (feedId) => {
    setSelectedFeedId(feedId);
    // On mobile, switch to items view when feed is selected
    if (isMobile) {
      setMobileView('items');
    }
  };

  // Handle back navigation on mobile
  const handleMobileBackToItems = () => {
    setMobileView('items');
  };

  const handleMobileBackToFeeds = () => {
    setMobileView('feeds');
  };

  const handleToggleSaved = async (e, item) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/rss/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved: !item.saved })
      });

      const data = await response.json();

      if (data.success) {
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, saved: !item.saved } : item
        ));

        if (selectedItem?.id === item.id) {
          setSelectedItem(prev => ({ ...prev, saved: !item.saved }));
        }
      }
    } catch (err) {
      console.error('Error toggling saved:', err);
    }
  };

  const handleArchiveItem = async (e, item) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/rss/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true })
      });

      const data = await response.json();

      if (data.success) {
        // Remove from current list unless in archive view
        if (stateFilter !== 'archive') {
          setItems(prev => prev.filter(i => i.id !== item.id));
        }

        if (selectedItem?.id === item.id) {
          setSelectedItem(null);
          setSelectedItemId(null);
        }

        fetchFeeds();
      }
    } catch (err) {
      console.error('Error archiving item:', err);
    }
  };

  const handleMarkUnseen = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/rss/items/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'unseen' })
      });

      const data = await response.json();

      if (data.success) {
        setItems(prev => prev.map(i =>
          i.id === selectedItem.id ? { ...i, state: 'unseen', seenAt: null } : i
        ));
        setSelectedItem(prev => ({ ...prev, state: 'unseen', seenAt: null }));
        fetchFeeds();
      }
    } catch (err) {
      console.error('Error marking as unseen:', err);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedItem) return;

    setGeneratingSummary(true);
    setSummaryError(null);

    try {
      const response = await fetch(`/api/rss/items/${selectedItem.id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        // Update selected item with the new summary
        setSelectedItem(prev => ({
          ...prev,
          aiSummary: data.item.aiSummary
        }));
      } else {
        setSummaryError(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setSummaryError(err.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleAddFeed = async () => {
    if (!newFeedUrl) return;

    setAddingFeed(true);
    setAddFeedError(null);

    try {
      const response = await fetch('/api/rss/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xmlUrl: newFeedUrl,
          title: newFeedTitle || undefined,
          description: newFeedDescription || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setAddFeedModalOpen(false);
        setNewFeedUrl('');
        setNewFeedTitle('');
        setNewFeedDescription('');
        fetchFeeds();
        fetchItems();
      } else {
        setAddFeedError(data.error);
      }
    } catch (err) {
      setAddFeedError(err.message);
    } finally {
      setAddingFeed(false);
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (!window.confirm('Are you sure you want to delete this feed?')) return;

    try {
      const response = await fetch(`/api/rss/feeds/${feedId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        if (selectedFeedId === feedId) {
          setSelectedFeedId(null);
        }
        fetchFeeds();
        fetchItems();
      }
    } catch (err) {
      console.error('Error deleting feed:', err);
    }
  };

  const handleRefresh = async (feedId = null) => {
    if (feedId) {
      // Refreshing a specific feed
      setRefreshingFeeds(prev => new Set([...prev, feedId]));
    } else {
      // Refreshing all feeds
      setRefreshing(true);
      setRefreshingFeeds(new Set(feeds.map(f => f.id)));
    }

    try {
      const response = await fetch('/api/rss/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedId })
      });

      await response.json();
      fetchFeeds();
      fetchItems();
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      if (feedId) {
        setRefreshingFeeds(prev => {
          const next = new Set(prev);
          next.delete(feedId);
          return next;
        });
      } else {
        setRefreshing(false);
        setRefreshingFeeds(new Set());
      }
    }
  };

  const handleMarkAllSeen = async (feedId) => {
    try {
      await fetch(`/api/rss/feeds/${feedId}/mark-all-seen`, {
        method: 'POST'
      });
      fetchFeeds();
      fetchItems();
    } catch (err) {
      console.error('Error marking all as seen:', err);
    }
  };

  const handleArchiveAllSeen = async (feedId) => {
    try {
      await fetch(`/api/rss/feeds/${feedId}/archive-all-seen`, {
        method: 'POST'
      });
      fetchFeeds();
      fetchItems();
    } catch (err) {
      console.error('Error archiving seen:', err);
    }
  };

  const handleMarkAllSeenAllFeeds = async () => {
    setMarkingAllSeen(true);
    try {
      await fetch('/api/rss/mark-all-seen', {
        method: 'POST'
      });
      fetchFeeds();
      fetchItems();
      setMarkAllSeenModalOpen(false);
    } catch (err) {
      console.error('Error marking all as seen:', err);
    } finally {
      setMarkingAllSeen(false);
    }
  };

  const handleImportOpml = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('opml', file);

    try {
      const response = await fetch('/api/rss/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert(`Imported ${data.imported} feeds, skipped ${data.skipped} duplicates`);
        fetchFeeds();
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Import error: ${err.message}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportOpml = () => {
    window.open('/api/rss/export', '_blank');
  };

  // Filter items by search query
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.descriptionTruncated?.toLowerCase().includes(query) ||
      item.feedTitle?.toLowerCase().includes(query)
    );
  });

  // Filter feeds based on state filter
  const filteredFeeds = feeds.filter(feed => stateFilter !== 'unseen' || feed.unseenCount > 0);

  // Global styles for animations and mobile
  const globalStyles = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @media (max-width: ${MOBILE_BREAKPOINT - 1}px) {
      .rss-mobile-hide {
        display: none !important;
      }
      .rss-action-buttons-mobile {
        flex-wrap: wrap;
      }
      .rss-action-buttons-mobile .pf-v6-c-button {
        flex: 1 1 auto;
        min-width: 0;
      }
      
      /* Prevent horizontal scrolling on mobile */
      .rss-main-container {
        max-width: 100vw;
        overflow-x: hidden;
      }
      
      /* State filter tabs - allow horizontal scroll for many options */
      .rss-state-filter-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .rss-state-filter-container .pf-v6-c-toggle-group {
        flex-wrap: nowrap;
      }
    }
  `;

  if (loadingFeeds && feeds.length === 0) {
    return (
      <div className="rss-main-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', maxWidth: '100vw' }}>
        <style>{globalStyles}</style>
        <PageSection variant="light" style={{ flexShrink: 0 }}>
          <Title headingLevel="h1" size="2xl">RSS</Title>
          <Content component="p">Your RSS feed reader</Content>
        </PageSection>
        <PageSection isFilled>
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '4rem' }}>
            <Spinner size="xl" />
          </Flex>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="rss-main-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', maxWidth: '100vw' }}>
      <style>{globalStyles}</style>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">RSS</Title>
              </FlexItem>
              {totalUnseenCount > 0 && (
                <FlexItem>
                  <Badge isRead={false}>{totalUnseenCount} unseen</Badge>
                </FlexItem>
              )}
            </Flex>
            <Content component="p" style={{ marginTop: '0.25rem' }}>Your RSS feed reader</Content>
          </FlexItem>
          <FlexItem>
            <Button
              variant="secondary"
              icon={<SyncAltIcon />}
              onClick={() => handleRefresh()}
              isLoading={refreshing}
            >
              Refresh All
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, maxWidth: '100%' }}>
        {/* Column 1: Feed List (on mobile, shows when mobileView === 'feeds') */}
        <div style={{
          width: isMobile ? '100%' : '280px',
          maxWidth: isMobile ? '100vw' : undefined,
          flexShrink: 0,
          display: isMobile && mobileView !== 'feeds' ? 'none' : 'flex',
          flexDirection: 'column',
          borderRight: isMobile ? 'none' : '1px solid var(--pf-v6-global--BorderColor--100)',
          overflow: 'hidden',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
        }}>
          {/* Search */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)' }}>
            <TextInput
              id="rss-search-articles"
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e, value) => setSearchQuery(value)}
              customIcon={<SearchIcon />}
            />
          </div>

          {/* State Filter Tabs */}
          <div className="rss-state-filter-container" style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)' }}>
            <ToggleGroup aria-label="Filter by state" isCompact>
              <ToggleGroupItem
                text="All"
                buttonId="filter-all"
                isSelected={stateFilter === 'all'}
                onChange={() => setStateFilter('all')}
              />
              <ToggleGroupItem
                text="Unseen"
                buttonId="filter-unseen"
                isSelected={stateFilter === 'unseen'}
                onChange={() => setStateFilter('unseen')}
              />
              <ToggleGroupItem
                text="Seen"
                buttonId="filter-seen"
                isSelected={stateFilter === 'seen'}
                onChange={() => setStateFilter('seen')}
              />
              <ToggleGroupItem
                text="Saved"
                buttonId="filter-saved"
                isSelected={stateFilter === 'saved'}
                onChange={() => setStateFilter('saved')}
              />
              <ToggleGroupItem
                text="Archive"
                buttonId="filter-archive"
                isSelected={stateFilter === 'archive'}
                onChange={() => setStateFilter('archive')}
              />
            </ToggleGroup>
          </div>

          {/* Feed List */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--pf-v6-global--Color--200)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              position: 'sticky',
              top: 0,
              background: 'var(--pf-v6-global--BackgroundColor--100)',
              zIndex: 1
            }}>
              <RssIcon style={{ fontSize: '0.75rem' }} />
              Feeds ({feeds.length})
            </div>
            <FeedList
              feeds={filteredFeeds}
              selectedFeedId={selectedFeedId}
              onFeedSelect={isMobile ? handleFeedSelect : setSelectedFeedId}
              totalUnseenCount={totalUnseenCount}
              refreshingFeeds={refreshingFeeds}
              kebabMenuOpen={kebabMenuOpen}
              onKebabMenuToggle={setKebabMenuOpen}
              onMarkAllSeenClick={() => setMarkAllSeenModalOpen(true)}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--pf-v6-global--BorderColor--100)', background: 'var(--pf-v6-global--BackgroundColor--100)' }}>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Button variant="primary" isBlock icon={<PlusCircleIcon />} onClick={() => setAddFeedModalOpen(true)}>
                  Add Feed
                </Button>
              </FlexItem>
              <FlexItem>
                <Flex gap={{ default: 'gapSm' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Button
                      variant="secondary"
                      isBlock
                      icon={<ImportIcon />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Import
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".opml,.xml"
                      style={{ display: 'none' }}
                      onChange={handleImportOpml}
                    />
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Button variant="secondary" isBlock icon={<ExportIcon />} onClick={handleExportOpml}>
                      Export
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </div>
        </div>

        {/* Column 2: Items List - Shows on mobile when mobileView === 'items' */}
        <div style={{
          width: isMobile ? '100%' : '350px',
          maxWidth: isMobile ? '100vw' : undefined,
          flexShrink: 0,
          display: isMobile ? (mobileView === 'items' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          borderRight: isMobile ? 'none' : '1px solid var(--pf-v6-global--BorderColor--100)',
          overflow: 'hidden',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)'
        }}>
          {/* Items Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
            background: 'var(--pf-v6-global--BackgroundColor--100)',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  {isMobile && (
                    <FlexItem>
                      <Button
                        variant="plain"
                        icon={<ArrowLeftIcon />}
                        onClick={handleMobileBackToFeeds}
                        style={{ padding: '0.25rem', marginRight: '0.25rem' }}
                        aria-label="Back to feeds"
                      />
                    </FlexItem>
                  )}
                  <FlexItem>
                    {selectedFeedId ? feeds.find(f => f.id === selectedFeedId)?.title || 'Feed' : 'All Feeds'}
                  </FlexItem>
                </Flex>
              </FlexItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                {selectedFeedId && (
                  <FlexItem>
                    <Dropdown
                      key={selectedFeedId}
                      isOpen={kebabMenuOpen['selected'] === true}
                      onSelect={() => setKebabMenuOpen({})}
                      onOpenChange={(isOpen) => setKebabMenuOpen(isOpen ? { selected: true } : {})}
                      toggle={(toggleRef) => (
                        <MenuToggle
                          ref={toggleRef}
                          variant="plain"
                          onClick={() => setKebabMenuOpen(prev => prev.selected ? {} : { selected: true })}
                          isExpanded={kebabMenuOpen['selected'] === true}
                          style={{ padding: '4px' }}
                        >
                          <EllipsisVIcon />
                        </MenuToggle>
                      )}
                      popperProps={{ position: 'end' }}
                    >
                      <DropdownList>
                        <DropdownItem 
                          key="id" 
                          isDisabled 
                          style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--pf-v6-global--Color--200)',
                            fontFamily: 'monospace',
                            opacity: 1
                          }}
                        >
                          ID: {selectedFeedId}
                        </DropdownItem>
                        <Divider component="li" />
                        <DropdownItem key="refresh" onClick={() => handleRefresh(selectedFeedId)}>
                          Refresh
                        </DropdownItem>
                        <DropdownItem key="mark-all" onClick={() => handleMarkAllSeen(selectedFeedId)}>
                          Mark all as seen
                        </DropdownItem>
                        <DropdownItem key="archive-seen" onClick={() => handleArchiveAllSeen(selectedFeedId)}>
                          Archive all seen
                        </DropdownItem>
                        <Divider component="li" />
                        <DropdownItem key="delete" onClick={() => handleDeleteFeed(selectedFeedId)} style={{ color: 'var(--pf-v6-global--danger-color--100)' }}>
                          Delete feed
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </FlexItem>
                )}
                <FlexItem>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    {filteredItems.length} items
                  </Content>
                </FlexItem>
              </Flex>
            </Flex>
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ItemsList
              items={filteredItems}
              loadingItems={loadingItems}
              feeds={feeds}
              selectedItemId={selectedItemId}
              onItemSelect={handleItemSelect}
              onToggleSaved={handleToggleSaved}
              onArchiveItem={handleArchiveItem}
              stateFilter={stateFilter}
              refreshing={refreshing}
              onRefresh={() => handleRefresh()}
              onAddFeed={() => setAddFeedModalOpen(true)}
            />
          </div>
        </div>

        {/* Column 3: Article Content */}
        <div style={{
          flex: 1,
          display: isMobile ? (mobileView === 'article' ? 'block' : 'none') : 'block',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
          maxWidth: isMobile ? '100vw' : undefined,
          width: isMobile ? '100%' : undefined
        }}>
          {/* Mobile back button */}
          {isMobile && mobileView === 'article' && (
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
              zIndex: 10
            }}>
              <Button
                variant="link"
                icon={<ArrowLeftIcon />}
                onClick={handleMobileBackToItems}
                style={{ paddingLeft: 0 }}
              >
                Back to articles
              </Button>
            </div>
          )}
          <ArticleView
            selectedItemId={selectedItemId}
            selectedItem={selectedItem}
            loadingItemDetail={loadingItemDetail}
            feeds={feeds}
            onToggleSaved={handleToggleSaved}
            onMarkUnseen={handleMarkUnseen}
            onArchiveItem={handleArchiveItem}
            onGenerateSummary={handleGenerateSummary}
            generatingSummary={generatingSummary}
            summaryError={summaryError}
          />
        </div>
      </div>

      {/* Add Feed Modal */}
      <AddFeedModal
        isOpen={addFeedModalOpen}
        onClose={() => {
          setAddFeedModalOpen(false);
          setNewFeedUrl('');
          setNewFeedTitle('');
          setNewFeedDescription('');
          setAddFeedError(null);
        }}
        newFeedUrl={newFeedUrl}
        newFeedTitle={newFeedTitle}
        newFeedDescription={newFeedDescription}
        onUrlChange={setNewFeedUrl}
        onTitleChange={setNewFeedTitle}
        onDescriptionChange={setNewFeedDescription}
        onAddFeed={handleAddFeed}
        addingFeed={addingFeed}
        addFeedError={addFeedError}
      />

      {/* Mark All Seen Confirmation Modal */}
      <MarkAllSeenModal
        isOpen={markAllSeenModalOpen}
        onClose={() => setMarkAllSeenModalOpen(false)}
        totalUnseenCount={totalUnseenCount}
        onConfirm={handleMarkAllSeenAllFeeds}
        markingAllSeen={markingAllSeen}
      />
    </div>
  );
};

export default Rss;
