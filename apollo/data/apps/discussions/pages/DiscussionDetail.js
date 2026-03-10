import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Button,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Label,
  LabelGroup,
  TextArea,
  Card,
  CardBody,
  Divider,
  Tooltip,
  DropdownItem,
  Dropdown,
  DropdownList,
  MenuToggle,
  Alert,
  AlertActionCloseButton
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  OutlinedClockIcon,
  OutlinedEyeIcon,
  ReplyIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  EllipsisVIcon,
  EditIcon,
  TrashIcon,
  ThumbtackIcon,
  LockIcon,
  UnlockIcon,
  TagIcon,
  UserIcon
} from '@patternfly/react-icons';

// Recursive Reply Component
const ReplyThread = ({ 
  reply, 
  depth = 0, 
  onReply, 
  onEdit, 
  onDelete, 
  onVote,
  formatDate,
  maxDepth = 4
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    await onReply(reply.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
    setSubmitting(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    await onEdit(reply.id, editContent);
    setIsEditing(false);
    setSubmitting(false);
  };

  const indentStyle = {
    marginLeft: depth > 0 ? '2rem' : 0,
    borderLeft: depth > 0 ? '2px solid var(--pf-v6-global--BorderColor--100)' : 'none',
    paddingLeft: depth > 0 ? '1rem' : 0
  };

  return (
    <div style={{ ...indentStyle, marginTop: '1rem' }}>
      <Card isPlain>
        <CardBody style={{ padding: '1rem' }}>
          {/* Reply Header */}
          <Flex alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '0.5rem' }}>
            <FlexItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--pf-v6-global--BackgroundColor--200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserIcon />
                  </div>
                </FlexItem>
                <FlexItem>
                  <Content component="p" style={{ fontWeight: 600, margin: 0 }}>
                    {reply.author?.name || 'Anonymous'}
                  </Content>
                </FlexItem>
                <FlexItem>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    {formatDate(reply.created)}
                    {reply.edited && ' (edited)'}
                  </Content>
                </FlexItem>
              </Flex>
            </FlexItem>
            
            <FlexItem style={{ marginLeft: 'auto' }}>
              <Dropdown
                isOpen={isMenuOpen}
                onOpenChange={(isOpen) => setIsMenuOpen(isOpen)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    variant="plain"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    isExpanded={isMenuOpen}
                  >
                    <EllipsisVIcon />
                  </MenuToggle>
                )}
                popperProps={{ position: 'right' }}
              >
                <DropdownList>
                  <DropdownItem 
                    key="edit" 
                    icon={<EditIcon />}
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem 
                    key="delete" 
                    icon={<TrashIcon />}
                    onClick={() => {
                      onDelete(reply.id);
                      setIsMenuOpen(false);
                    }}
                    isDanger
                  >
                    Delete
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </FlexItem>
          </Flex>
          
          {/* Reply Content */}
          {isEditing ? (
            <div style={{ marginBottom: '1rem' }}>
              <TextArea
                value={editContent}
                onChange={(e, value) => setEditContent(value)}
                rows={4}
                style={{ marginBottom: '0.5rem' }}
              />
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSaveEdit}
                    isLoading={submitting}
                    isDisabled={!editContent.trim() || submitting}
                  >
                    Save
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(reply.content);
                    }}
                  >
                    Cancel
                  </Button>
                </FlexItem>
              </Flex>
            </div>
          ) : (
            <Content 
              component="p" 
              style={{ 
                margin: 0, 
                marginBottom: '0.75rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}
            >
              {reply.content}
            </Content>
          )}
          
          {/* Reply Actions */}
          <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Tooltip content="Upvote">
                <Button 
                  variant="plain" 
                  size="sm"
                  onClick={() => onVote(reply.id, 'up')}
                  style={{ padding: '4px 8px' }}
                >
                  <ThumbsUpIcon /> {reply.upvotes || 0}
                </Button>
              </Tooltip>
            </FlexItem>
            <FlexItem>
              <Tooltip content="Downvote">
                <Button 
                  variant="plain" 
                  size="sm"
                  onClick={() => onVote(reply.id, 'down')}
                  style={{ padding: '4px 8px' }}
                >
                  <ThumbsDownIcon /> {reply.downvotes || 0}
                </Button>
              </Tooltip>
            </FlexItem>
            {depth < maxDepth && (
              <FlexItem>
                <Button 
                  variant="link" 
                  size="sm"
                  icon={<ReplyIcon />}
                  onClick={() => setIsReplying(!isReplying)}
                >
                  Reply
                </Button>
              </FlexItem>
            )}
          </Flex>
          
          {/* Reply Form */}
          {isReplying && (
            <div style={{ marginTop: '1rem' }}>
              <TextArea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e, value) => setReplyContent(value)}
                rows={3}
                style={{ marginBottom: '0.5rem' }}
              />
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSubmitReply}
                    isLoading={submitting}
                    isDisabled={!replyContent.trim() || submitting}
                  >
                    Post Reply
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </FlexItem>
              </Flex>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div>
          {reply.replies.map((nestedReply) => (
            <ReplyThread
              key={nestedReply.id}
              reply={nestedReply}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onVote={onVote}
              formatDate={formatDate}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DiscussionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Reply state
  const [newReplyContent, setNewReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // Admin actions
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const fetchDiscussion = useCallback(async () => {
    try {
      const response = await fetch(`/api/discussions/${id}`);
      const data = await response.json();
      if (data.success) {
        setDiscussion(data.discussion);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching discussion:', err);
      setError('Failed to load discussion');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'General': 'blue',
      'Questions': 'purple',
      'Ideas': 'orange',
      'Feedback': 'green',
      'Announcements': 'red'
    };
    return colors[category] || 'grey';
  };

  const handleAddReply = async (parentReplyId = null, content = null) => {
    const replyContent = content || newReplyContent;
    if (!replyContent.trim()) return;
    
    if (!parentReplyId) setSubmittingReply(true);
    
    try {
      const response = await fetch(`/api/discussions/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentReplyId,
          author: { name: 'You', avatar: null }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setDiscussion(data.discussion);
        if (!parentReplyId) setNewReplyContent('');
        setAlertMessage({ type: 'success', text: 'Reply posted successfully' });
        setTimeout(() => setAlertMessage(null), 3000);
      } else {
        setAlertMessage({ type: 'danger', text: data.error || 'Failed to post reply' });
      }
    } catch (err) {
      console.error('Error adding reply:', err);
      setAlertMessage({ type: 'danger', text: 'Failed to post reply' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditReply = async (replyId, content) => {
    try {
      const response = await fetch(`/api/discussions/${id}/replies/${replyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchDiscussion();
        setAlertMessage({ type: 'success', text: 'Reply updated' });
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error editing reply:', err);
      setAlertMessage({ type: 'danger', text: 'Failed to update reply' });
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      const response = await fetch(`/api/discussions/${id}/replies/${replyId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        fetchDiscussion();
        setAlertMessage({ type: 'success', text: 'Reply deleted' });
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting reply:', err);
      setAlertMessage({ type: 'danger', text: 'Failed to delete reply' });
    }
  };

  const handleVote = async (replyId, vote) => {
    try {
      const response = await fetch(`/api/discussions/${id}/replies/${replyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote })
      });
      
      if (response.ok) {
        fetchDiscussion();
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleTogglePin = async () => {
    try {
      const response = await fetch(`/api/discussions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !discussion.isPinned })
      });
      
      const data = await response.json();
      if (data.success) {
        setDiscussion(data.discussion);
        setAlertMessage({ 
          type: 'success', 
          text: data.discussion.isPinned ? 'Discussion pinned' : 'Discussion unpinned' 
        });
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
    setIsAdminMenuOpen(false);
  };

  const handleToggleLock = async () => {
    try {
      const response = await fetch(`/api/discussions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !discussion.isLocked })
      });
      
      const data = await response.json();
      if (data.success) {
        setDiscussion(data.discussion);
        setAlertMessage({ 
          type: 'success', 
          text: data.discussion.isLocked ? 'Discussion locked' : 'Discussion unlocked' 
        });
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error toggling lock:', err);
    }
    setIsAdminMenuOpen(false);
  };

  const handleDeleteDiscussion = async () => {
    if (!window.confirm('Are you sure you want to delete this entire discussion? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/discussions/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        navigate('/discussions');
      }
    } catch (err) {
      console.error('Error deleting discussion:', err);
      setAlertMessage({ type: 'danger', text: 'Failed to delete discussion' });
    }
    setIsAdminMenuOpen(false);
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading discussion...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error || !discussion) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <Title headingLevel="h2" size="lg">Discussion Not Found</Title>
          <EmptyStateBody>{error || 'The discussion could not be found.'}</EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/discussions')}>
            Back to Discussions
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const replyCount = discussion.replies?.length || 0;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsFlexStart' }}>
          <FlexItem>
            <Button variant="plain" onClick={() => navigate('/discussions')}>
              <ArrowLeftIcon />
            </Button>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              {discussion.isPinned && (
                <FlexItem>
                  <Tooltip content="Pinned">
                    <ThumbtackIcon style={{ color: 'var(--pf-v6-global--primary-color--100)' }} />
                  </Tooltip>
                </FlexItem>
              )}
              {discussion.isLocked && (
                <FlexItem>
                  <Tooltip content="Locked">
                    <LockIcon style={{ color: 'var(--pf-v6-global--warning-color--100)' }} />
                  </Tooltip>
                </FlexItem>
              )}
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  {discussion.title}
                </Title>
              </FlexItem>
            </Flex>
            
            <Flex 
              spaceItems={{ default: 'spaceItemsMd' }} 
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ marginTop: '0.5rem' }}
            >
              <FlexItem>
                <Label color={getCategoryColor(discussion.category)}>
                  {discussion.category}
                </Label>
              </FlexItem>
              {discussion.tags && discussion.tags.length > 0 && (
                <FlexItem>
                  <LabelGroup>
                    {discussion.tags.map((tag, idx) => (
                      <Label key={idx} variant="outline" isCompact icon={<TagIcon />}>
                        {tag}
                      </Label>
                    ))}
                  </LabelGroup>
                </FlexItem>
              )}
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  <UserIcon style={{ marginRight: '4px' }} />
                  {discussion.author?.name || 'Anonymous'}
                </Content>
              </FlexItem>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  <OutlinedClockIcon style={{ marginRight: '4px' }} />
                  {formatDate(discussion.created)}
                </Content>
              </FlexItem>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  <OutlinedEyeIcon style={{ marginRight: '4px' }} />
                  {discussion.viewCount || 0} views
                </Content>
              </FlexItem>
            </Flex>
          </FlexItem>
          
          <FlexItem>
            <Dropdown
              isOpen={isAdminMenuOpen}
              onOpenChange={(isOpen) => setIsAdminMenuOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  variant="plain"
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  isExpanded={isAdminMenuOpen}
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
              popperProps={{ position: 'right' }}
            >
              <DropdownList>
                <DropdownItem 
                  key="pin" 
                  icon={<ThumbtackIcon />}
                  onClick={handleTogglePin}
                >
                  {discussion.isPinned ? 'Unpin' : 'Pin'} Discussion
                </DropdownItem>
                <DropdownItem 
                  key="lock" 
                  icon={discussion.isLocked ? <UnlockIcon /> : <LockIcon />}
                  onClick={handleToggleLock}
                >
                  {discussion.isLocked ? 'Unlock' : 'Lock'} Discussion
                </DropdownItem>
                <Divider />
                <DropdownItem 
                  key="delete" 
                  icon={<TrashIcon />}
                  onClick={handleDeleteDiscussion}
                  isDanger
                >
                  Delete Discussion
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Alert */}
      {alertMessage && (
        <PageSection style={{ flexShrink: 0, paddingTop: 0, paddingBottom: 0 }}>
          <Alert
            variant={alertMessage.type}
            isInline
            title={alertMessage.text}
            actionClose={<AlertActionCloseButton onClose={() => setAlertMessage(null)} />}
          />
        </PageSection>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {/* Original Post */}
        <Card style={{ marginBottom: '2rem' }}>
          <CardBody>
            <Content 
              component="div" 
              style={{ 
                fontSize: '1rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap'
              }}
            >
              {discussion.content || <em style={{ color: 'var(--pf-v6-global--Color--200)' }}>No content provided</em>}
            </Content>
          </CardBody>
        </Card>

        <Divider style={{ marginBottom: '1.5rem' }} />

        {/* Replies Section */}
        <div style={{ marginBottom: '2rem' }}>
          <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
            {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
          </Title>
          
          {/* Reply Form */}
          {!discussion.isLocked ? (
            <Card style={{ marginBottom: '1.5rem' }}>
              <CardBody>
                <TextArea
                  placeholder="Share your thoughts..."
                  value={newReplyContent}
                  onChange={(e, value) => setNewReplyContent(value)}
                  rows={4}
                  style={{ marginBottom: '0.75rem' }}
                />
                <Button
                  variant="primary"
                  onClick={() => handleAddReply()}
                  isLoading={submittingReply}
                  isDisabled={!newReplyContent.trim() || submittingReply}
                >
                  Post Reply
                </Button>
              </CardBody>
            </Card>
          ) : (
            <Alert variant="warning" isInline title="This discussion is locked" style={{ marginBottom: '1.5rem' }}>
              New replies cannot be added to locked discussions.
            </Alert>
          )}
          
          {/* Reply Threads */}
          {discussion.replies && discussion.replies.length > 0 ? (
            <div>
              {discussion.replies.map((reply) => (
                <ReplyThread
                  key={reply.id}
                  reply={reply}
                  onReply={handleAddReply}
                  onEdit={handleEditReply}
                  onDelete={handleDeleteReply}
                  onVote={handleVote}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <EmptyState variant="sm">
              <EmptyStateBody>
                No replies yet. Be the first to share your thoughts!
              </EmptyStateBody>
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;
