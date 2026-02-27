import React, { useState, useEffect, useRef } from 'react';
import {
  PageSection,
  Title,
  Split,
  SplitItem,
  Card,
  CardBody,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Label,
  Content,
  Flex,
  FlexItem,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Divider,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Badge,
  Button,
  Skeleton
} from '@patternfly/react-core';
import {
  InboxIcon,
  EnvelopeIcon,
  CommentIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  StarIcon,
  OutlinedLightbulbIcon,
  SyncAltIcon
} from '@patternfly/react-icons';

const Feed = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [isUrgencyOpen, setIsUrgencyOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  
  // Skim column state
  const [skimLoading, setSkimLoading] = useState(false);
  const [skimContent, setSkimContent] = useState(null);
  const [skimError, setSkimError] = useState(null);
  const skimAbortRef = useRef(null);
  
  // Full context panel visibility
  const [showFullContext, setShowFullContext] = useState(false);

  useEffect(() => {
    fetchFeedData();
  }, []);

  // Restore last selected item from localStorage when items are loaded
  useEffect(() => {
    if (items.length > 0 && !selectedItem) {
      const lastSelectedId = localStorage.getItem('feed-last-selected-item');
      if (lastSelectedId) {
        const item = items.find(i => i.id === lastSelectedId);
        if (item) {
          setSelectedItem(item);
          setShowFullContext(false);
          generateSkim(item);
          if (!item.read) {
            markAsRead(item.id);
          }
        }
      }
    }
  }, [items]);

  const fetchFeedData = async () => {
    try {
      const response = await fetch('/api/feed');
      const data = await response.json();
      setItems(data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feed data:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (itemId) => {
    try {
      await fetch(`/api/feed/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
      
      setItems(items.map(item => 
        item.id === itemId ? { ...item, read: true } : item
      ));
    } catch (error) {
      console.error('Error marking item as read:', error);
    }
  };

  const generateSummary = async (itemId) => {
    setSummarizing(true);
    setSummaryError(null);
    
    try {
      const response = await fetch(`/api/feed/${itemId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the item in the list with the new summary
        setItems(items.map(item => 
          item.id === itemId ? { ...item, aiSummary: data.summary } : item
        ));
        
        // Update the selected item if it's the one being summarized
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem({ ...selectedItem, aiSummary: data.summary });
        }
      } else {
        setSummaryError(data.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryError('Failed to connect to AI service');
    } finally {
      setSummarizing(false);
    }
  };

  // Generate skim preview for selected item
  const generateSkim = async (item) => {
    if (!item) {
      setSkimContent(null);
      return;
    }

    // Cancel any ongoing skim request
    if (skimAbortRef.current) {
      skimAbortRef.current.abort();
    }

    // If item already has an AI summary, use it for skim
    if (item.aiSkim) {
      setSkimContent(item.aiSkim);
      setSkimError(null);
      return;
    }

    setSkimLoading(true);
    setSkimError(null);
    setSkimContent(null);

    const controller = new AbortController();
    skimAbortRef.current = controller;

    try {
      const response = await fetch(`/api/feed/${item.id}/skim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      const data = await response.json();

      if (data.success) {
        setSkimContent(data.skim);
        // Update the item in the list with the skim
        setItems(prevItems => prevItems.map(i => 
          i.id === item.id ? { ...i, aiSkim: data.skim } : i
        ));
      } else {
        setSkimError(data.error || 'Failed to generate summary');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error generating skim:', error);
        setSkimError('Failed to connect to AI service');
      }
    } finally {
      setSkimLoading(false);
    }
  };

  const handleItemClick = (_event, itemId) => {
    const item = filteredItems.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setShowFullContext(false); // Start with only skim visible
      generateSkim(item);
      // Persist the selected item ID for session restore
      localStorage.setItem('feed-last-selected-item', item.id);
      if (!item.read) {
        markAsRead(item.id);
      }
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'email':
        return <EnvelopeIcon />;
      case 'slack':
        return <CommentIcon />;
      case 'jira':
        return <InboxIcon />;
      default:
        return <InboxIcon />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'grey';
      default:
        return 'grey';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <ExclamationCircleIcon />;
      case 'high':
        return <ExclamationTriangleIcon />;
      case 'medium':
        return <InfoCircleIcon />;
      case 'low':
        return <CheckCircleIcon />;
      default:
        return <InfoCircleIcon />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredItems = items.filter(item => {
    if (filterUrgency !== 'all' && item.urgency !== filterUrgency) {
      return false;
    }
    if (filterTopic !== 'all' && item.topic !== filterTopic) {
      return false;
    }
    return true;
  });

  const urgencyOptions = [
    { value: 'all', label: 'All urgencies' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const topicOptions = [
    { value: 'all', label: 'All topics' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'security', label: 'Security' },
    { value: 'product', label: 'Product' },
    { value: 'code-review', label: 'Code Review' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'design', label: 'Design' },
    { value: 'team', label: 'Team' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'HR' }
  ];

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner />
          <EmptyStateBody>Loading feed items...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Sticky Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="2xl">
              Feed
            </Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Messages and notifications from Email, Slack, Jira, and more
            </Content>
          </FlexItem>
          <FlexItem>
            <Badge isRead={filteredItems.filter(i => !i.read).length === 0}>
              {filteredItems.filter(i => !i.read).length} unread
            </Badge>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Sticky Filters */}
      <div style={{ 
        flexShrink: 0,
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
        backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
      }}>
        <Flex spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem style={{ width: '200px' }}>
            <Select
              isOpen={isUrgencyOpen}
              selected={filterUrgency}
              onSelect={(event, value) => {
                setFilterUrgency(value);
                setIsUrgencyOpen(false);
              }}
              onOpenChange={(isOpen) => setIsUrgencyOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsUrgencyOpen(!isUrgencyOpen)}
                  isExpanded={isUrgencyOpen}
                  style={{ width: '100%' }}
                >
                  {urgencyOptions.find(opt => opt.value === filterUrgency)?.label}
                </MenuToggle>
              )}
            >
              <SelectList>
                {urgencyOptions.map(option => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FlexItem>
          <FlexItem style={{ width: '200px' }}>
            <Select
              isOpen={isTopicOpen}
              selected={filterTopic}
              onSelect={(event, value) => {
                setFilterTopic(value);
                setIsTopicOpen(false);
              }}
              onOpenChange={(isOpen) => setIsTopicOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsTopicOpen(!isTopicOpen)}
                  isExpanded={isTopicOpen}
                  style={{ width: '100%' }}
                >
                  {topicOptions.find(opt => opt.value === filterTopic)?.label}
                </MenuToggle>
              )}
            >
              <SelectList>
                {topicOptions.map(option => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FlexItem>
        </Flex>
      </div>

      {/* Scrollable Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        minHeight: 0 
      }}>
        {/* Left Panel - Message List */}
        <div style={{ 
          width: '380px', 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid var(--pf-v6-global--BorderColor--100)',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {/* Message List - Scrollable */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            <DataList 
              aria-label="feed message list"
              selectedDataListItemId={selectedItem?.id}
              onSelectDataListItem={handleItemClick}
              isCompact
            >
              {filteredItems.map(item => (
                <DataListItem key={item.id} id={item.id}>
                  <DataListItemRow>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key="content" style={{ position: 'relative' }}>
                          {!item.read && (
                            <div style={{
                              position: 'absolute',
                              left: '-0.5rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--pf-v6-global--primary-color--100)'
                            }} />
                          )}
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                            <FlexItem>
                              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                                <FlexItem>
                                  <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                                    <FlexItem style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                      {getSourceIcon(item.source)}
                                    </FlexItem>
                                    <FlexItem>
                                      <span style={{ 
                                        fontSize: '0.875rem',
                                        fontWeight: item.read ? 'normal' : 'bold'
                                      }}>
                                        {item.from}
                                      </span>
                                    </FlexItem>
                                  </Flex>
                                </FlexItem>
                                <FlexItem>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--pf-v6-global--Color--200)' 
                                  }}>
                                    {formatTimestamp(item.timestamp)}
                                  </span>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                            <FlexItem>
                              <p style={{ 
                                fontSize: '0.95rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                margin: 0,
                                fontWeight: item.read ? 'normal' : 'bold'
                              }}>
                                {item.subject}
                              </p>
                            </FlexItem>
                            <FlexItem>
                              <span style={{ 
                                fontSize: '0.875rem',
                                color: 'var(--pf-v6-global--Color--200)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}>
                                {item.preview}
                              </span>
                            </FlexItem>
                            <FlexItem>
                              <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                <FlexItem>
                                  <Label 
                                    color={getUrgencyColor(item.urgency)} 
                                    isCompact
                                    icon={getUrgencyIcon(item.urgency)}
                                  >
                                    {item.urgency}
                                  </Label>
                                </FlexItem>
                                <FlexItem>
                                  <Label color="blue" isCompact>
                                    {item.topic}
                                  </Label>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                          </Flex>
                        </DataListCell>
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              ))}
            </DataList>
          </div>
        </div>

        {/* Middle Panel - Summary Column */}
        <div style={{ 
          width: showFullContext ? '340px' : undefined,
          flex: showFullContext ? undefined : 1,
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)'
        }}>
          {/* Summary Header */}
          <div style={{ 
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
            backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
          }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <OutlinedLightbulbIcon style={{ color: 'var(--pf-v6-global--palette--gold-400)' }} />
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h3" size="md" style={{ margin: 0 }}>
                  Summary
                </Title>
              </FlexItem>
            </Flex>
            <Content style={{ 
              fontSize: '0.8rem', 
              color: 'var(--pf-v6-global--Color--200)',
              marginTop: '0.35rem'
            }}>
              AI-generated quick preview of the selected item
            </Content>
          </div>

          {/* Summary Content */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '1.25rem'
          }}>
            {selectedItem ? (
              <div>
                {/* Item context */}
                <div style={{ marginBottom: '1rem' }}>
                  <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ marginBottom: '0.5rem' }}>
                    <FlexItem>
                      <Label 
                        color={getUrgencyColor(selectedItem.urgency)} 
                        isCompact
                        icon={getUrgencyIcon(selectedItem.urgency)}
                      >
                        {selectedItem.urgency}
                      </Label>
                    </FlexItem>
                    <FlexItem>
                      <Label color="grey" isCompact icon={getSourceIcon(selectedItem.source)}>
                        {selectedItem.source}
                      </Label>
                    </FlexItem>
                  </Flex>
                  <div style={{ 
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--pf-v6-global--Color--100)',
                    marginBottom: '0.25rem'
                  }}>
                    {selectedItem.subject}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'var(--pf-v6-global--Color--200)'
                  }}>
                    From {selectedItem.from} · {formatTimestamp(selectedItem.timestamp)}
                  </div>
                </div>

                <Divider style={{ marginBottom: '1rem' }} />

                {/* AI Summary */}
                {skimLoading ? (
                  <div>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: '1rem' }}>
                      <FlexItem>
                        <Spinner size="sm" />
                      </FlexItem>
                      <FlexItem>
                        <span style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                          Generating summary...
                        </span>
                      </FlexItem>
                    </Flex>
                    <Skeleton screenreaderText="Loading summary content" style={{ marginBottom: '0.5rem' }} />
                    <Skeleton width="80%" style={{ marginBottom: '0.5rem' }} />
                    <Skeleton width="60%" />
                  </div>
                ) : skimError ? (
                  <div style={{ 
                    padding: '1rem',
                    backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
                    borderRadius: '8px',
                    border: '1px solid var(--pf-v6-global--danger-color--100)'
                  }}>
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--pf-v6-global--danger-color--100)',
                      marginBottom: '0.75rem'
                    }}>
                      {skimError}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => generateSkim(selectedItem)}
                      icon={<SyncAltIcon />}
                    >
                      Retry
                    </Button>
                  </div>
                ) : skimContent ? (
                  <div>
                    <Card isCompact style={{ 
                      backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
                      border: '1px solid var(--pf-v6-global--palette--gold-200)',
                      borderLeft: '4px solid var(--pf-v6-global--palette--gold-400)'
                    }}>
                      <CardBody>
                        <Content style={{ 
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {skimContent}
                        </Content>
                      </CardBody>
                    </Card>
                    <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => generateSkim(selectedItem)}
                        icon={<SyncAltIcon />}
                        style={{ fontSize: '0.8rem' }}
                      >
                        Regenerate
                      </Button>
                    </div>
                    
                    {/* View Full Context Button */}
                    <div style={{ 
                      marginTop: '1.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--pf-v6-global--BorderColor--100)'
                    }}>
                      <Button
                        variant={showFullContext ? "secondary" : "primary"}
                        isBlock
                        onClick={() => setShowFullContext(!showFullContext)}
                        icon={<InboxIcon />}
                      >
                        {showFullContext ? "Hide Full Context" : "View Full Context"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
                    borderRadius: '8px'
                  }}>
                    <OutlinedLightbulbIcon style={{ 
                      fontSize: '2rem',
                      color: 'var(--pf-v6-global--Color--200)',
                      marginBottom: '0.75rem'
                    }} />
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--pf-v6-global--Color--200)',
                      marginBottom: '1rem'
                    }}>
                      Generate an AI-powered quick summary
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => generateSkim(selectedItem)}
                      icon={<StarIcon />}
                    >
                      Generate Summary
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <OutlinedLightbulbIcon style={{ 
                  fontSize: '3rem',
                  color: 'var(--pf-v6-global--Color--200)',
                  opacity: 0.5,
                  marginBottom: '1rem'
                }} />
                <div style={{ 
                  fontSize: '0.9rem',
                  color: 'var(--pf-v6-global--Color--200)'
                }}>
                  Select a feed item to see its AI-generated quick summary
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Message Detail - Conditionally visible */}
        {showFullContext && selectedItem && (
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1.5rem',
            minWidth: 0,
            borderLeft: '1px solid var(--pf-v6-global--BorderColor--100)',
            backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
          }}>
            <div>
              {/* Header with close button */}
              <div style={{ marginBottom: '1.5rem' }}>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Label 
                              color={getUrgencyColor(selectedItem.urgency)} 
                              icon={getUrgencyIcon(selectedItem.urgency)}
                            >
                              {selectedItem.urgency}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Label color="blue">
                              {selectedItem.topic}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Label color="grey" icon={getSourceIcon(selectedItem.source)}>
                              {selectedItem.source}
                            </Label>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                      <FlexItem>
                        <Title headingLevel="h2" size="xl">
                          {selectedItem.subject}
                        </Title>
                      </FlexItem>
                      <FlexItem>
                        <Content style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                          From: {selectedItem.from}
                          {selectedItem.fromEmail && ` <${selectedItem.fromEmail}>`}
                          {selectedItem.channel && ` in ${selectedItem.channel}`}
                          {' • '}
                          {new Date(selectedItem.timestamp).toLocaleString()}
                        </Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="plain"
                      onClick={() => setShowFullContext(false)}
                      aria-label="Close full context"
                      style={{ marginTop: '-0.5rem', marginRight: '-0.5rem' }}
                    >
                      ✕
                    </Button>
                  </FlexItem>
                </Flex>
              </div>

              <Divider style={{ marginBottom: '1.5rem' }} />

              {/* AI Summary */}
              {selectedItem.aiSummary ? (
                <Card isCompact style={{ marginBottom: '1.5rem', backgroundColor: '#f0f9ff' }}>
                  <CardBody>
                    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <h3 style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 'bold',
                              color: '#0066cc',
                              margin: 0
                            }}>
                              ✨ AI Summary
                            </h3>
                          </FlexItem>
                          <FlexItem>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => generateSummary(selectedItem.id)}
                              isLoading={summarizing}
                              isDisabled={summarizing}
                              icon={<StarIcon />}
                            >
                              Regenerate
                            </Button>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                      <FlexItem>
                        <Content style={{ fontSize: '0.95rem' }}>
                          {selectedItem.aiSummary}
                        </Content>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              ) : (
                <Card isCompact style={{ marginBottom: '1.5rem', backgroundColor: '#f5f5f5' }}>
                  <CardBody>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <Content style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                          No AI summary available for this message
                        </Content>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => generateSummary(selectedItem.id)}
                          isLoading={summarizing}
                          isDisabled={summarizing}
                          icon={<StarIcon />}
                        >
                          {summarizing ? 'Summarizing...' : 'Summarize with local AI'}
                        </Button>
                      </FlexItem>
                    </Flex>
                    {summaryError && (
                      <Content style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--danger-color--100)', marginTop: '0.5rem' }}>
                        Error: {summaryError}
                      </Content>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Message Content */}
              <Card>
                <CardBody>
                  <Content>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      {selectedItem.content}
                    </pre>
                  </Content>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;

