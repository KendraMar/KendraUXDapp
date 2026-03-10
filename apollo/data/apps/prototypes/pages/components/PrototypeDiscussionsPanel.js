import React, { useState } from 'react';
import {
  Stack,
  StackItem,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Button,
  ExpandableSection,
  Badge,
  Avatar,
  Split,
  SplitItem,
  CodeBlock,
  CodeBlockCode,
  Flex,
  FlexItem,
  TextInput,
  Content,
  Card,
  CardBody
} from '@patternfly/react-core';
import { CommentIcon, UserIcon, CodeIcon, ImageIcon, PlayIcon } from '@patternfly/react-icons';

const PrototypeDiscussionsPanel = ({ discussions = [], prototypeId, onAddComment }) => {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterBy, setFilterBy] = useState('All');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Latest');
  const [expandedThreads, setExpandedThreads] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});

  // Initialize all comments as expanded by default
  const allCommentIds = discussions.flatMap(thread => 
    (thread.comments || []).map(comment => comment.id)
  );
  const [expandedComments, setExpandedComments] = useState(allCommentIds);

  const toggleThread = (threadId) => {
    setExpandedThreads(prev => 
      prev.includes(threadId) 
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  };

  const toggleComment = (commentId) => {
    setExpandedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const allThreadsExpanded = expandedThreads.length === discussions.length;

  const toggleAllThreads = () => {
    if (allThreadsExpanded) {
      setExpandedThreads([]);
    } else {
      setExpandedThreads(discussions.map(thread => thread.id));
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReply = async (threadId) => {
    const replyText = replyTexts[threadId];
    if (!replyText?.trim()) return;
    
    if (onAddComment) {
      await onAddComment(threadId, replyText);
    }
    
    setReplyTexts(prev => ({ ...prev, [threadId]: '' }));
  };

  const getAvatarColor = (name) => {
    const colors = ['#0066CC', '#009596', '#5752D1', '#F4C145', '#EC7A08', '#C9190B'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Render content based on type (text, code, image, video)
  const renderCommentContent = (comment) => {
    const type = comment.type || 'text';
    
    switch (type) {
      case 'code':
        return (
          <>
            {comment.content && <p style={{ marginBottom: '8px' }}>{comment.content}</p>}
            <CodeBlock>
              <CodeBlockCode>
                {comment.code || comment.codeContent || '// Code snippet'}
              </CodeBlockCode>
            </CodeBlock>
          </>
        );
        
      case 'image':
        return (
          <>
            {comment.content && <p style={{ marginBottom: '8px' }}>{comment.content}</p>}
            {comment.imageUrl ? (
              <img 
                src={comment.imageUrl} 
                alt={comment.imageAlt || 'Attached image'}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px', 
                  borderRadius: '4px',
                  border: '1px solid var(--pf-v6-global--BorderColor--100)'
                }}
              />
            ) : (
              <Card isCompact>
                <CardBody>
                  <Flex 
                    alignItems={{ default: 'alignItemsCenter' }} 
                    justifyContent={{ default: 'justifyContentCenter' }}
                    style={{ 
                      height: '150px', 
                      backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                      borderRadius: '4px'
                    }}
                  >
                    <FlexItem>
                      <ImageIcon size="lg" style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                      <span style={{ marginLeft: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
                        {comment.imagePlaceholder || 'Image attachment'}
                      </span>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            )}
          </>
        );
        
      case 'video':
        return (
          <>
            {comment.content && <p style={{ marginBottom: '8px' }}>{comment.content}</p>}
            {comment.videoUrl ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, maxWidth: '400px' }}>
                <iframe
                  src={comment.videoUrl.replace('watch?v=', 'embed/')}
                  title={comment.videoTitle || 'Video'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <Card isCompact>
                <CardBody>
                  <Flex 
                    alignItems={{ default: 'alignItemsCenter' }} 
                    justifyContent={{ default: 'justifyContentCenter' }}
                    style={{ 
                      height: '150px', 
                      backgroundColor: '#000',
                      borderRadius: '4px'
                    }}
                  >
                    <FlexItem>
                      <PlayIcon size="lg" style={{ color: '#fff' }} />
                      <span style={{ marginLeft: '8px', color: '#fff' }}>
                        {comment.videoPlaceholder || 'Video attachment'}
                      </span>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            )}
          </>
        );
        
      case 'text':
      default:
        return <p>{comment.content}</p>;
    }
  };

  // Get icon for comment type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'code': return <CodeIcon style={{ marginLeft: '4px', color: 'var(--pf-v6-global--Color--200)' }} />;
      case 'image': return <ImageIcon style={{ marginLeft: '4px', color: 'var(--pf-v6-global--Color--200)' }} />;
      case 'video': return <PlayIcon style={{ marginLeft: '4px', color: 'var(--pf-v6-global--Color--200)' }} />;
      default: return null;
    }
  };

  const renderComment = (comment) => {
    const isExpanded = expandedComments.includes(comment.id);
    const typeIcon = getTypeIcon(comment.type);
    
    return (
      <div key={comment.id} style={{ marginBottom: '16px' }}>
        <ExpandableSection
          toggleContent={
            <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: getAvatarColor(comment.author),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {comment.author.charAt(0).toUpperCase()}
                </div>
              </FlexItem>
              <FlexItem>
                <small>
                  <strong>{comment.author}</strong> • {formatTimestamp(comment.timestamp)}
                  {typeIcon}
                </small>
              </FlexItem>
            </Flex>
          }
          isExpanded={isExpanded}
          onToggle={() => toggleComment(comment.id)}
        >
          <div style={{ marginLeft: '30px' }}>
            {renderCommentContent(comment)}
          </div>
        </ExpandableSection>
      </div>
    );
  };

  if (discussions.length === 0) {
    return (
      <div style={{ height: '100%', padding: '16px' }}>
        <Content>
          <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
            No discussions yet. Start a conversation about this prototype.
          </Content>
        </Content>
      </div>
    );
  }

  return (
    <div style={{ height: '100%' }}>
      <Stack hasGutter>
        {/* Controls */}
        <StackItem>
          <Split hasGutter>
            <SplitItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Dropdown
                    isOpen={filterDropdownOpen}
                    onSelect={() => setFilterDropdownOpen(false)}
                    onOpenChange={setFilterDropdownOpen}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                        variant="plainText"
                      >
                        {filterBy}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem key="all" onClick={() => setFilterBy('All')}>
                        All
                      </DropdownItem>
                      <DropdownItem key="recommended" onClick={() => setFilterBy('Recommended')}>
                        Recommended
                      </DropdownItem>
                      <DropdownItem key="most-active" onClick={() => setFilterBy('Most Active')}>
                        Most Active
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </FlexItem>
                <FlexItem>
                  <Dropdown
                    isOpen={sortDropdownOpen}
                    onSelect={() => setSortDropdownOpen(false)}
                    onOpenChange={setSortDropdownOpen}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                        variant="plainText"
                      >
                        {sortBy}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem key="latest" onClick={() => setSortBy('Latest')}>
                        Latest
                      </DropdownItem>
                      <DropdownItem key="oldest" onClick={() => setSortBy('Oldest')}>
                        Oldest
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </FlexItem>
              </Flex>
            </SplitItem>
            <SplitItem isFilled />
            <SplitItem>
              <Button variant="link" isInline onClick={toggleAllThreads}>
                {allThreadsExpanded ? 'Collapse all' : 'Expand all'}
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Discussion Threads */}
        {discussions.map(thread => (
          <StackItem key={thread.id}>
            <ExpandableSection
              toggleContent={
                <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <CommentIcon />
                  </FlexItem>
                  <FlexItem>
                    <h6 style={{ margin: 0 }}>
                      {thread.title}
                    </h6>
                  </FlexItem>
                  <FlexItem>
                    <Badge isRead>{thread.comments?.length || 0}</Badge>
                  </FlexItem>
                </Flex>
              }
              isExpanded={expandedThreads.includes(thread.id)}
              onToggle={() => toggleThread(thread.id)}
            >
              <div style={{ paddingLeft: '16px' }}>
                {(thread.comments || []).map(comment => renderComment(comment))}
                <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <TextInput
                        placeholder="Reply..."
                        aria-label={`Reply to ${thread.title}`}
                        value={replyTexts[thread.id] || ''}
                        onChange={(_, value) => setReplyTexts(prev => ({ ...prev, [thread.id]: value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(thread.id);
                          }
                        }}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="primary"
                        size="sm"
                        isDisabled={!replyTexts[thread.id]?.trim()}
                        onClick={() => handleReply(thread.id)}
                      >
                        Reply
                      </Button>
                    </FlexItem>
                  </Flex>
                </div>
              </div>
            </ExpandableSection>
          </StackItem>
        ))}
      </Stack>
    </div>
  );
};

export default PrototypeDiscussionsPanel;
