import React, { useState, useEffect, useCallback } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Spinner,
  Alert,
  AlertActionLink,
  Flex,
  FlexItem,
  Label,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Button,
  Badge,
  Skeleton,
  Nav,
  NavItem,
  NavList
} from '@patternfly/react-core';
import {
  SlackHashIcon,
  LockIcon,
  SyncAltIcon,
  CogIcon,
  ExclamationCircleIcon,
  CommentsIcon,
  UserIcon,
  UsersIcon
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

const Slack = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedType, setSelectedType] = useState('channel'); // 'channel' or 'dm'
  const [channelMessages, setChannelMessages] = useState({});
  const [loadingMessages, setLoadingMessages] = useState({});
  const [userCache, setUserCache] = useState({});
  const [expandedThreads, setExpandedThreads] = useState({});
  const [threadReplies, setThreadReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  // Fetch channels on mount
  useEffect(() => {
    fetchChannels();
  }, []);

  // Auto-select first channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      // Select first channel with unreads, or just first channel
      const channelWithUnread = channels.find(c => c.hasUnread);
      const toSelect = channelWithUnread || channels[0];
      setSelectedChannel(toSelect);
      fetchChannelMessages(toSelect.id);
    }
  }, [channels, selectedChannel]);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/slack/unread');
      const data = await response.json();
      
      if (data.success) {
        // Sort alphabetically
        const sortedChannels = (data.channels || []).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setChannels(sortedChannels);
        
        // Set direct messages (already sorted by server: unreads first, then alphabetically)
        setDirectMessages(data.directMessages || []);
      } else {
        setError(data.error || 'Failed to fetch channels');
      }
    } catch (err) {
      setError(`Error fetching channels: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = useCallback(async (userId) => {
    if (userCache[userId]) {
      return userCache[userId];
    }
    
    try {
      const response = await fetch(`/api/slack/users/${userId}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        setUserCache(prev => ({ ...prev, [userId]: data.user }));
        return data.user;
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
    return null;
  }, [userCache]);

  const fetchChannelMessages = async (channelId) => {
    if (channelMessages[channelId]) {
      // Already have messages for this channel
      return;
    }
    
    setLoadingMessages(prev => ({ ...prev, [channelId]: true }));
    
    try {
      const response = await fetch(`/api/slack/channels/${channelId}/messages?limit=25`);
      const data = await response.json();
      
      if (data.success) {
        // Fetch user info for each unique user
        const messages = data.messages || [];
        const uniqueUsers = [...new Set(messages.map(m => m.user).filter(Boolean))];
        
        // Fetch user info in parallel
        await Promise.all(uniqueUsers.map(userId => fetchUserInfo(userId)));
        
        setChannelMessages(prev => ({ ...prev, [channelId]: messages }));
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const handleChannelSelect = (channel, type = 'channel') => {
    setSelectedChannel(channel);
    setSelectedType(type);
    fetchChannelMessages(channel.id);
  };

  const fetchThreadReplies = async (channelId, threadTs) => {
    const threadKey = `${channelId}-${threadTs}`;
    
    if (threadReplies[threadKey]) {
      // Already have replies, just toggle visibility
      return;
    }
    
    setLoadingReplies(prev => ({ ...prev, [threadKey]: true }));
    
    try {
      const response = await fetch(`/api/slack/channels/${channelId}/threads/${threadTs}`);
      const data = await response.json();
      
      if (data.success) {
        // Fetch user info for reply authors
        const replies = data.replies || [];
        const uniqueUsers = [...new Set(replies.map(r => r.user).filter(Boolean))];
        await Promise.all(uniqueUsers.map(userId => fetchUserInfo(userId)));
        
        setThreadReplies(prev => ({ ...prev, [threadKey]: replies }));
      }
    } catch (err) {
      console.error('Error fetching thread replies:', err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [threadKey]: false }));
    }
  };

  const handleReplyBadgeClick = (channelId, message) => {
    const threadTs = message.threadTs || message.ts;
    const threadKey = `${channelId}-${threadTs}`;
    
    // Toggle expanded state
    setExpandedThreads(prev => ({
      ...prev,
      [threadKey]: !prev[threadKey]
    }));
    
    // Fetch replies if not already loaded
    if (!threadReplies[threadKey]) {
      fetchThreadReplies(channelId, threadTs);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatMessageText = (text) => {
    if (!text) return '';
    
    // Replace user mentions with display names
    let formatted = text;
    
    // Handle basic formatting
    formatted = formatted
      .replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
        const user = userCache[userId];
        return user ? `@${user.displayName || user.realName || user.name}` : match;
      })
      .replace(/<#([A-Z0-9]+)\|([^>]+)>/g, '#$2') // Channel mentions
      .replace(/<([^|>]+)\|([^>]+)>/g, '$2') // Links with text
      .replace(/<([^>]+)>/g, '$1') // Plain links
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    return formatted;
  };

  const renderReply = (reply, index, totalReplies) => {
    const user = userCache[reply.user];
    const userName = user?.displayName || user?.realName || user?.name || reply.user || 'Unknown';
    
    return (
      <div 
        key={reply.ts} 
        style={{ 
          padding: '0.5rem 0',
          borderBottom: index < totalReplies - 1 ? '1px solid var(--pf-v6-global--BorderColor--100)' : 'none'
        }}
      >
        <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapSm' }}>
          <FlexItem>
            {user?.image ? (
              <img 
                src={user.image} 
                alt={userName}
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '4px',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div 
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '4px',
                  background: 'var(--pf-v6-global--palette--purple-300)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Content component="p" style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>
                  {userName}
                </Content>
              </FlexItem>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.75rem' }}>
                  {formatTimestamp(reply.timestamp)}
                </Content>
              </FlexItem>
            </Flex>
            <Content 
              component="p" 
              style={{ 
                margin: '0.25rem 0 0 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.875rem'
              }}
            >
              {formatMessageText(reply.text)}
            </Content>
          </FlexItem>
        </Flex>
      </div>
    );
  };

  const renderMessage = (message, index, totalMessages) => {
    const user = userCache[message.user];
    const userName = user?.displayName || user?.realName || user?.name || message.user || 'Unknown';
    const threadTs = message.threadTs || message.ts;
    const threadKey = `${selectedChannel?.id}-${threadTs}`;
    const isExpanded = expandedThreads[threadKey];
    const replies = threadReplies[threadKey] || [];
    const isLoadingThreadReplies = loadingReplies[threadKey];
    
    return (
      <div 
        key={message.ts} 
        style={{ 
          padding: '0.75rem 0',
          borderBottom: index < totalMessages - 1 ? '1px solid var(--pf-v6-global--BorderColor--100)' : 'none'
        }}
      >
        <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapSm' }}>
          <FlexItem>
            {user?.image ? (
              <img 
                src={user.image} 
                alt={userName}
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '4px',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '4px',
                  background: 'var(--pf-v6-global--palette--purple-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Content component="p" style={{ fontWeight: 600, margin: 0 }}>
                  {userName}
                </Content>
              </FlexItem>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  {formatTimestamp(message.timestamp)}
                </Content>
              </FlexItem>
            </Flex>
            <Content 
              component="p" 
              style={{ 
                margin: '0.25rem 0 0 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {formatMessageText(message.text)}
            </Content>
            {message.replyCount > 0 && (
              <Label 
                color="blue" 
                isCompact 
                style={{ 
                  marginTop: '0.5rem', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleReplyBadgeClick(selectedChannel?.id, message)}
              >
                {isExpanded ? '▼' : '▶'} {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
              </Label>
            )}
            
            {/* Thread Replies Section */}
            {isExpanded && message.replyCount > 0 && (
              <div 
                style={{ 
                  marginTop: '0.75rem',
                  marginLeft: '0.5rem',
                  paddingLeft: '1rem',
                  borderLeft: '2px solid var(--pf-v6-global--palette--blue-200)'
                }}
              >
                {isLoadingThreadReplies ? (
                  <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} style={{ padding: '0.5rem 0' }}>
                    {[1, 2, 3].map(i => (
                      <Flex key={i} gap={{ default: 'gapSm' }}>
                        <Skeleton width="28px" height="28px" />
                        <Flex direction={{ default: 'column' }} flex={{ default: 'flex_1' }}>
                          <Skeleton width="100px" height="14px" />
                          <Skeleton width="80%" height="16px" />
                        </Flex>
                      </Flex>
                    ))}
                  </Flex>
                ) : replies.length > 0 ? (
                  <div>
                    {replies.map((reply, idx) => renderReply(reply, idx, replies.length))}
                  </div>
                ) : (
                  <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem', padding: '0.5rem 0' }}>
                    No replies found.
                  </Content>
                )}
              </div>
            )}
          </FlexItem>
        </Flex>
      </div>
    );
  };

  const renderChannelNav = () => {
    return (
      <Nav aria-label="Slack channels" theme="light">
        <NavList>
          {channels.map(channel => (
            <NavItem
              key={channel.id}
              isActive={selectedChannel?.id === channel.id && selectedType === 'channel'}
              onClick={() => handleChannelSelect(channel, 'channel')}
              style={{ cursor: 'pointer' }}
            >
              <Flex 
                alignItems={{ default: 'alignItemsCenter' }} 
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                style={{ width: '100%' }}
              >
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    {channel.isPrivate ? (
                      <LockIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                    ) : (
                      <SlackHashIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                    )}
                  </FlexItem>
                  <FlexItem>
                    <span style={{ 
                      fontWeight: channel.hasUnread ? 600 : 400,
                      color: channel.hasUnread ? 'var(--pf-v6-global--Color--100)' : 'inherit'
                    }}>
                      {channel.name}
                    </span>
                  </FlexItem>
                </Flex>
                {channel.hasUnread && channel.unreadCountDisplay > 0 && (
                  <FlexItem>
                    <Badge isRead={false}>{channel.unreadCountDisplay}</Badge>
                  </FlexItem>
                )}
              </Flex>
            </NavItem>
          ))}
        </NavList>
      </Nav>
    );
  };

  const renderUserAvatar = (dm) => {
    if (dm.userImage) {
      return (
        <img 
          src={dm.userImage} 
          alt={dm.name}
          style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '4px',
            objectFit: 'cover'
          }}
        />
      );
    }
    
    if (dm.isGroupDM) {
      return <UsersIcon style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '16px' }} />;
    }
    
    // Default avatar with initial
    return (
      <div 
        style={{ 
          width: '20px', 
          height: '20px', 
          borderRadius: '4px',
          background: 'var(--pf-v6-global--palette--purple-400)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.65rem'
        }}
      >
        {dm.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  };

  const renderDMNav = () => {
    return (
      <Nav aria-label="Direct messages" theme="light">
        <NavList>
          {directMessages.map(dm => (
            <NavItem
              key={dm.id}
              isActive={selectedChannel?.id === dm.id && selectedType === 'dm'}
              onClick={() => handleChannelSelect(dm, 'dm')}
              style={{ cursor: 'pointer' }}
            >
              <Flex 
                alignItems={{ default: 'alignItemsCenter' }} 
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                style={{ width: '100%' }}
              >
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    {renderUserAvatar(dm)}
                  </FlexItem>
                  <FlexItem>
                    <span style={{ 
                      fontWeight: dm.hasUnread ? 600 : 400,
                      color: dm.hasUnread ? 'var(--pf-v6-global--Color--100)' : 'inherit',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '160px',
                      display: 'inline-block'
                    }}>
                      {dm.name}
                    </span>
                  </FlexItem>
                </Flex>
                {dm.hasUnread && dm.unreadCountDisplay > 0 && (
                  <FlexItem>
                    <Badge isRead={false}>{dm.unreadCountDisplay}</Badge>
                  </FlexItem>
                )}
              </Flex>
            </NavItem>
          ))}
        </NavList>
      </Nav>
    );
  };

  const renderMessagePanel = () => {
    if (!selectedChannel) {
      return (
        <EmptyState titleText="Select a channel" headingLevel="h2">
          <CommentsIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />
          <EmptyStateBody>
            Choose a channel from the list to view its messages
          </EmptyStateBody>
        </EmptyState>
      );
    }

    const messages = channelMessages[selectedChannel.id] || [];
    const isLoadingMessages = loadingMessages[selectedChannel.id];

    const getConversationIcon = () => {
      if (selectedType === 'dm') {
        return selectedChannel.isGroupDM ? <UsersIcon /> : <UserIcon />;
      }
      return selectedChannel.isPrivate ? <LockIcon /> : <SlackHashIcon />;
    };

    return (
      <div>
        {/* Channel/DM Header */}
        <div style={{ 
          marginBottom: '1rem', 
          paddingBottom: '1rem', 
          borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)' 
        }}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              {getConversationIcon()}
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h2" size="xl">
                {selectedChannel.name}
              </Title>
            </FlexItem>
            {selectedChannel.hasUnread && (
              <FlexItem>
                <Badge isRead={false}>
                  {selectedChannel.unreadCountDisplay || 'new'}
                </Badge>
              </FlexItem>
            )}
          </Flex>
        </div>

        {/* Messages */}
        {isLoadingMessages ? (
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Flex key={i} gap={{ default: 'gapSm' }}>
                <Skeleton width="36px" height="36px" />
                <Flex direction={{ default: 'column' }} flex={{ default: 'flex_1' }}>
                  <Skeleton width="120px" height="16px" />
                  <Skeleton width="100%" height="20px" />
                </Flex>
              </Flex>
            ))}
          </Flex>
        ) : messages.length > 0 ? (
          <div>
            {[...messages].reverse().map((msg, idx) => renderMessage(msg, idx, messages.length))}
          </div>
        ) : (
          <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
            No recent messages in this channel.
          </Content>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1" size="2xl">
            Slack
          </Title>
          <Content component="p">
            Your Slack channels and messages
          </Content>
        </PageSection>
        <PageSection isFilled>
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '4rem' }}>
            <Spinner size="xl" />
          </Flex>
        </PageSection>
      </>
    );
  }

  if (error) {
    const isNotConfigured = error.includes('not configured');
    
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1" size="2xl">
            Slack
          </Title>
          <Content component="p">
            Your Slack channels and messages
          </Content>
        </PageSection>
        <PageSection isFilled>
          {isNotConfigured ? (
            <EmptyState 
              variant="lg"
              headingLevel="h2"
              titleText="Slack Not Configured"
              icon={ExclamationCircleIcon}
            >
              <EmptyStateBody>
                To use the Slack integration, you need to configure your Slack tokens in Settings.
                You'll need both the XOXC token and XOXD token from your browser session.
              </EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                  <Button 
                    variant="primary" 
                    icon={<CogIcon />}
                    onClick={() => navigate('/settings')}
                  >
                    Go to Settings
                  </Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <Alert 
              variant="danger" 
              title="Error loading Slack data"
              actionLinks={
                <AlertActionLink onClick={fetchChannels}>Retry</AlertActionLink>
              }
            >
              {error}
            </Alert>
          )}
        </PageSection>
      </>
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
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              Slack
            </Title>
            <Content component="p" style={{ marginTop: '0.25rem' }}>
              Your Slack channels and messages
            </Content>
          </FlexItem>
          <Flex gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Badge isRead={channels.filter(c => c.hasUnread).length + directMessages.filter(d => d.hasUnread).length === 0}>
                {channels.filter(c => c.hasUnread).length + directMessages.filter(d => d.hasUnread).length} with unreads
              </Badge>
            </FlexItem>
            <FlexItem>
              <Button 
                variant="secondary" 
                icon={<SyncAltIcon />}
                onClick={() => {
                  setChannelMessages({});
                  setSelectedChannel(null);
                  setSelectedType('channel');
                  setDirectMessages([]);
                  fetchChannels();
                }}
              >
                Refresh
              </Button>
            </FlexItem>
          </Flex>
        </Flex>
      </PageSection>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        minHeight: 0 
      }}>
        {/* Left Panel - Channel List */}
        <div style={{ 
          width: '280px', 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid var(--pf-v6-global--BorderColor--100)',
          overflow: 'hidden',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
        }}>
          {/* Scrollable container for both sections */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {/* Direct Messages Section - Now First */}
            <div>
              {/* DM header */}
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
                background: '#fff',
                zIndex: 1
              }}>
                <UserIcon style={{ fontSize: '0.75rem' }} />
                Direct Messages ({directMessages.length})
              </div>
              
              {/* DM List */}
              {directMessages.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--pf-v6-global--Color--200)' }}>
                  No direct messages found
                </div>
              ) : (
                renderDMNav()
              )}
            </div>
            
            {/* Channels Section */}
            <div style={{ marginTop: '0.5rem' }}>
              {/* Channel count header */}
              <div style={{ 
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
                borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--pf-v6-global--Color--200)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 1
              }}>
                <SlackHashIcon style={{ fontSize: '0.75rem' }} />
                Channels ({channels.length})
              </div>
              
              {/* Channel List */}
              {channels.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--pf-v6-global--Color--200)' }}>
                  No channels found
                </div>
              ) : (
                renderChannelNav()
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)'
        }}>
          {renderMessagePanel()}
        </div>
      </div>
    </div>
  );
};

export default Slack;
