import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Button,
  TextInput,
  Tooltip,
  Badge,
  Label,
  Flex,
  FlexItem,
  Stack,
  StackItem,
  Divider,
  EmptyState,
  EmptyStateBody,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle
} from '@patternfly/react-core';
import {
  OutlinedCommentsIcon,
  TimesIcon,
  CheckCircleIcon,
  UndoIcon,
  PaperPlaneIcon,
  TrashIcon,
  PencilAltIcon,
  EllipsisVIcon,
  CommentIcon
} from '@patternfly/react-icons';

// ---- Discussion Thread Component ----
const DiscussionThread = ({ thread, isActive, onSelect, onResolve, onReopen, onDelete, onAddReply, onDeleteComment }) => {
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    if (isActive && threadRef.current) {
      threadRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isActive]);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddReply(thread.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ['#0066CC', '#009596', '#5752D1', '#F4C145', '#EC7A08', '#8F4700'];
    const index = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const isResolved = thread.status === 'resolved';

  return (
    <div
      ref={threadRef}
      onClick={() => onSelect(thread.id)}
      style={{
        padding: '0.75rem',
        marginBottom: '0.5rem',
        borderRadius: '8px',
        border: isActive
          ? '2px solid var(--pf-v6-global--primary-color--100)'
          : '1px solid var(--pf-v6-global--BorderColor--100)',
        background: isActive
          ? 'var(--pf-v6-global--BackgroundColor--200)'
          : 'var(--pf-v6-global--BackgroundColor--100)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        opacity: isResolved ? 0.7 : 1
      }}
    >
      {/* Thread header */}
      <Flex alignItems={{ default: 'alignItemsFlexStart' }} style={{ marginBottom: '0.5rem' }}>
        <FlexItem flex={{ default: 'flex_1' }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--pf-v6-global--Color--200)',
            fontStyle: 'italic',
            padding: '4px 8px',
            background: 'var(--pf-v6-global--BackgroundColor--200)',
            borderRadius: '4px',
            borderLeft: '3px solid var(--pf-v6-global--primary-color--100)',
            maxHeight: '3.6em',
            overflow: 'hidden',
            lineHeight: '1.2em'
          }}>
            "{thread.anchor?.text?.slice(0, 120)}{thread.anchor?.text?.length > 120 ? '...' : ''}"
          </div>
        </FlexItem>
        <FlexItem>
          <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
            {isResolved && (
              <FlexItem>
                <Label color="green" isCompact icon={<CheckCircleIcon />}>Resolved</Label>
              </FlexItem>
            )}
            <FlexItem>
              <Dropdown
                isOpen={menuOpen}
                onSelect={() => setMenuOpen(false)}
                onOpenChange={(isOpen) => setMenuOpen(isOpen)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    aria-label="Thread actions"
                    variant="plain"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    isExpanded={menuOpen}
                    style={{ padding: '2px' }}
                  >
                    <EllipsisVIcon />
                  </MenuToggle>
                )}
                popperProps={{ position: 'right' }}
              >
                <DropdownList>
                  {isResolved ? (
                    <DropdownItem key="reopen" onClick={(e) => { e.stopPropagation(); onReopen(thread.id); }}>
                      <UndoIcon style={{ marginRight: '0.5rem' }} /> Reopen
                    </DropdownItem>
                  ) : (
                    <DropdownItem key="resolve" onClick={(e) => { e.stopPropagation(); onResolve(thread.id); }}>
                      <CheckCircleIcon style={{ marginRight: '0.5rem' }} /> Resolve
                    </DropdownItem>
                  )}
                  <DropdownItem key="delete" onClick={(e) => { e.stopPropagation(); onDelete(thread.id); }}
                    style={{ color: 'var(--pf-v6-global--danger-color--100)' }}>
                    <TrashIcon style={{ marginRight: '0.5rem' }} /> Delete
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>

      {/* Comments */}
      <Stack hasGutter>
        {thread.comments.map((comment, idx) => (
          <StackItem key={comment.id}>
            {idx > 0 && <Divider style={{ marginBottom: '0.5rem' }} />}
            <Flex alignItems={{ default: 'alignItemsFlexStart' }}>
              <FlexItem>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: getAvatarColor(comment.author),
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  {getInitials(comment.author)}
                </div>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{comment.author}</span>
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: '11px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {formatTimestamp(comment.created)}
                    </span>
                  </FlexItem>
                  {comment.edited && (
                    <FlexItem>
                      <span style={{ fontSize: '10px', color: 'var(--pf-v6-global--Color--200)', fontStyle: 'italic' }}>(edited)</span>
                    </FlexItem>
                  )}
                </Flex>
                <div style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  marginTop: '4px',
                  color: 'var(--pf-v6-global--Color--100)',
                  wordBreak: 'break-word'
                }}
                  dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }}
                />
                {idx > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <Button
                      variant="plain"
                      isSmall
                      onClick={(e) => { e.stopPropagation(); onDeleteComment(thread.id, comment.id); }}
                      style={{ padding: '2px 4px', fontSize: '11px', color: 'var(--pf-v6-global--Color--200)' }}
                    >
                      <TrashIcon style={{ fontSize: '10px' }} />
                    </Button>
                  </div>
                )}
              </FlexItem>
            </Flex>
          </StackItem>
        ))}

        {/* Reply section */}
        {!isResolved && (
          <StackItem>
            {isReplying ? (
              <div style={{ marginTop: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a reply... (Ctrl+Enter to send)"
                  autoFocus
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    border: '1px solid var(--pf-v6-global--BorderColor--100)',
                    borderRadius: '6px',
                    background: 'var(--pf-v6-global--BackgroundColor--100)',
                    color: 'var(--pf-v6-global--Color--100)',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <Flex justifyContent={{ default: 'justifyContentFlexEnd' }} style={{ marginTop: '0.25rem' }}>
                  <FlexItem>
                    <Button
                      variant="link"
                      isSmall
                      onClick={(e) => { e.stopPropagation(); setIsReplying(false); setReplyText(''); }}
                    >
                      Cancel
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="primary"
                      isSmall
                      onClick={(e) => { e.stopPropagation(); handleSubmitReply(); }}
                      isDisabled={!replyText.trim() || submitting}
                      icon={<PaperPlaneIcon />}
                    >
                      Reply
                    </Button>
                  </FlexItem>
                </Flex>
                <div style={{ fontSize: '11px', color: 'var(--pf-v6-global--Color--200)', marginTop: '2px' }}>
                  Supports <strong>**bold**</strong>, <em>*italic*</em>, <code>`code`</code>
                </div>
              </div>
            ) : (
              <Button
                variant="link"
                isSmall
                onClick={(e) => { e.stopPropagation(); setIsReplying(true); }}
                icon={<CommentIcon />}
                style={{ fontSize: '12px', paddingLeft: 0 }}
              >
                Reply
              </Button>
            )}
          </StackItem>
        )}
      </Stack>
    </div>
  );
};

// Simple inline formatting: **bold**, *italic*, `code`
function formatCommentContent(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Code
  html = html.replace(/`(.+?)`/g, '<code style="background:var(--pf-v6-global--BackgroundColor--200);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>');
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// ---- Main Discussions Sidebar Component ----
const DiscussionsSidebar = ({
  documentId,
  discussions,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onResolveThread,
  onReopenThread,
  onDeleteThread,
  onAddReply,
  onDeleteComment,
  onClose
}) => {
  const [filter, setFilter] = useState('open'); // 'all', 'open', 'resolved'

  const filteredDiscussions = discussions.filter(thread => {
    if (filter === 'open') return thread.status !== 'resolved';
    if (filter === 'resolved') return thread.status === 'resolved';
    return true;
  });

  const openCount = discussions.filter(t => t.status !== 'resolved').length;
  const resolvedCount = discussions.filter(t => t.status === 'resolved').length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--pf-v6-global--BackgroundColor--100)'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
        flexShrink: 0
      }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <OutlinedCommentsIcon style={{ color: 'var(--pf-v6-global--primary-color--100)' }} />
              </FlexItem>
              <FlexItem>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Discussions</span>
              </FlexItem>
              {discussions.length > 0 && (
                <FlexItem>
                  <Badge isRead>{openCount} open</Badge>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
          <FlexItem>
            <Tooltip content="Close discussions panel">
              <Button variant="plain" onClick={onClose} style={{ padding: '4px' }}>
                <TimesIcon />
              </Button>
            </Tooltip>
          </FlexItem>
        </Flex>

        {/* Filter tabs */}
        {discussions.length > 0 && (
          <Flex style={{ marginTop: '0.5rem' }} spaceItems={{ default: 'spaceItemsXs' }}>
            <FlexItem>
              <Button
                variant={filter === 'open' ? 'primary' : 'tertiary'}
                isSmall
                onClick={() => setFilter('open')}
              >
                Open ({openCount})
              </Button>
            </FlexItem>
            <FlexItem>
              <Button
                variant={filter === 'resolved' ? 'primary' : 'tertiary'}
                isSmall
                onClick={() => setFilter('resolved')}
              >
                Resolved ({resolvedCount})
              </Button>
            </FlexItem>
            <FlexItem>
              <Button
                variant={filter === 'all' ? 'primary' : 'tertiary'}
                isSmall
                onClick={() => setFilter('all')}
              >
                All ({discussions.length})
              </Button>
            </FlexItem>
          </Flex>
        )}
      </div>

      {/* Thread list */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0.75rem'
      }}>
        {filteredDiscussions.length === 0 ? (
          <EmptyState variant="xs" style={{ padding: '2rem 1rem' }}>
            <OutlinedCommentsIcon style={{ fontSize: '2rem', color: 'var(--pf-v6-global--Color--200)', marginBottom: '0.5rem' }} />
            <EmptyStateBody>
              {discussions.length === 0
                ? 'No discussions yet. Select text in the editor and click the comment button to start a discussion.'
                : `No ${filter} discussions.`}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          filteredDiscussions.map(thread => (
            <DiscussionThread
              key={thread.id}
              thread={thread}
              isActive={activeThreadId === thread.id}
              onSelect={onSelectThread}
              onResolve={onResolveThread}
              onReopen={onReopenThread}
              onDelete={onDeleteThread}
              onAddReply={onAddReply}
              onDeleteComment={onDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DiscussionsSidebar;
