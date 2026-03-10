import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Card,
  CardBody,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Label,
  TextInput,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextArea,
  MenuToggle,
  Select,
  SelectOption,
  Divider,
  Split,
  SplitItem,
  LabelGroup,
  Tooltip
} from '@patternfly/react-core';
import {
  CommentsIcon,
  PlusIcon,
  SearchIcon,
  OutlinedClockIcon,
  OutlinedEyeIcon,
  OutlinedCommentsIcon,
  ThumbtackIcon,
  LockIcon,
  TagIcon,
  UserIcon
} from '@patternfly/react-icons';

const Discussions = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);
  const [categories, setCategories] = useState(['All', 'General', 'Questions', 'Ideas', 'Feedback', 'Announcements']);
  
  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [isNewCategorySelectOpen, setIsNewCategorySelectOpen] = useState(false);
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscussions();
    fetchCategories();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const response = await fetch('/api/discussions');
      const data = await response.json();
      if (data.success) {
        setDiscussions(data.discussions);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setError('Failed to load discussions');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/discussions/meta/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(['All', ...data.categories]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDiscussionClick = (discussion) => {
    navigate(`/discussions/${discussion.id}`);
  };

  const handleCreateDiscussion = async () => {
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
          tags,
          author: { name: 'You', avatar: null }
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        resetCreateForm();
        navigate(`/discussions/${data.discussion.id}`);
      } else {
        console.error('Failed to create discussion:', data.error);
      }
    } catch (err) {
      console.error('Error creating discussion:', err);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewContent('');
    setNewCategory('General');
    setNewTags('');
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

  // Filter discussions
  const filteredDiscussions = discussions.filter(d => {
    const matchesSearch = !searchTerm || 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading discussions...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <CommentsIcon size="xl" />
          <Title headingLevel="h2" size="lg">Error Loading Discussions</Title>
          <EmptyStateBody>{error}</EmptyStateBody>
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
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="2xl">
              Discussions
            </Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Community forum for sharing ideas, asking questions, and discussions
            </Content>
          </FlexItem>
          <FlexItem>
            <Button 
              variant="primary" 
              icon={<PlusIcon />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Discussion
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Filters */}
      <PageSection variant="light" style={{ flexShrink: 0, paddingTop: 0 }}>
        <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem flex={{ default: 'flex_1' }} style={{ maxWidth: '400px' }}>
            <TextInput
              type="text"
              aria-label="Search discussions"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e, value) => setSearchTerm(value)}
              customIcon={<SearchIcon />}
            />
          </FlexItem>
          <FlexItem>
            <Select
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsCategorySelectOpen(!isCategorySelectOpen)}
                  isExpanded={isCategorySelectOpen}
                  style={{ minWidth: '150px' }}
                >
                  {categoryFilter}
                </MenuToggle>
              )}
              isOpen={isCategorySelectOpen}
              onOpenChange={(isOpen) => setIsCategorySelectOpen(isOpen)}
              onSelect={(e, value) => {
                setCategoryFilter(value);
                setIsCategorySelectOpen(false);
              }}
              selected={categoryFilter}
            >
              {categories.map((cat) => (
                <SelectOption key={cat} value={cat}>
                  {cat}
                </SelectOption>
              ))}
            </Select>
          </FlexItem>
          <FlexItem>
            <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
              {filteredDiscussions.length} discussion{filteredDiscussions.length !== 1 ? 's' : ''}
            </Content>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Discussions List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {filteredDiscussions.length === 0 ? (
          <EmptyState variant="lg">
            <CommentsIcon size="xl" />
            <Title headingLevel="h2" size="lg">
              {discussions.length === 0 ? 'No Discussions Yet' : 'No Matching Discussions'}
            </Title>
            <EmptyStateBody>
              {discussions.length === 0 
                ? 'Start a new discussion to get the conversation going.'
                : 'Try adjusting your search or category filter.'}
            </EmptyStateBody>
            {discussions.length === 0 && (
              <Button 
                variant="primary" 
                icon={<PlusIcon />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Start Discussion
              </Button>
            )}
          </EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredDiscussions.map((discussion) => (
              <Card
                key={discussion.id}
                isClickable
                isSelectable
                onClick={() => handleDiscussionClick(discussion)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: discussion.isPinned 
                    ? '2px solid var(--pf-v6-global--primary-color--100)' 
                    : '1px solid var(--pf-v6-global--BorderColor--100)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <CardBody>
                  <Split hasGutter>
                    {/* Vote/Stats Column */}
                    <SplitItem style={{ 
                      minWidth: '80px', 
                      textAlign: 'center',
                      borderRight: '1px solid var(--pf-v6-global--BorderColor--100)',
                      paddingRight: '1rem'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 'bold',
                          color: 'var(--pf-v6-global--primary-color--100)'
                        }}>
                          {discussion.replyCount || 0}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--pf-v6-global--Color--200)',
                          textTransform: 'uppercase'
                        }}>
                          replies
                        </div>
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '1rem', 
                          color: 'var(--pf-v6-global--Color--200)' 
                        }}>
                          {discussion.viewCount || 0}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--pf-v6-global--Color--200)',
                          textTransform: 'uppercase'
                        }}>
                          views
                        </div>
                      </div>
                    </SplitItem>
                    
                    {/* Main Content */}
                    <SplitItem isFilled>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        {/* Title Row */}
                        <FlexItem>
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
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Title headingLevel="h3" size="lg" style={{ marginBottom: 0 }}>
                                {discussion.title}
                              </Title>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* Excerpt */}
                        {discussion.excerpt && (
                          <FlexItem>
                            <Content 
                              component="p" 
                              style={{ 
                                color: 'var(--pf-v6-global--Color--200)',
                                margin: 0,
                                lineHeight: 1.5
                              }}
                            >
                              {discussion.excerpt}
                            </Content>
                          </FlexItem>
                        )}
                        
                        {/* Meta Row */}
                        <FlexItem>
                          <Flex 
                            spaceItems={{ default: 'spaceItemsMd' }} 
                            alignItems={{ default: 'alignItemsCenter' }}
                            flexWrap={{ default: 'wrap' }}
                          >
                            {/* Category */}
                            <FlexItem>
                              <Label color={getCategoryColor(discussion.category)} isCompact>
                                {discussion.category}
                              </Label>
                            </FlexItem>
                            
                            {/* Tags */}
                            {discussion.tags && discussion.tags.length > 0 && (
                              <FlexItem>
                                <LabelGroup>
                                  {discussion.tags.slice(0, 3).map((tag, idx) => (
                                    <Label key={idx} variant="outline" isCompact icon={<TagIcon />}>
                                      {tag}
                                    </Label>
                                  ))}
                                  {discussion.tags.length > 3 && (
                                    <Label variant="outline" isCompact>
                                      +{discussion.tags.length - 3}
                                    </Label>
                                  )}
                                </LabelGroup>
                              </FlexItem>
                            )}
                            
                            <FlexItem style={{ marginLeft: 'auto' }}>
                              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                    <UserIcon style={{ marginRight: '4px' }} />
                                    {discussion.author?.name || 'Anonymous'}
                                  </Content>
                                </FlexItem>
                                <FlexItem>
                                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                    <OutlinedClockIcon style={{ marginRight: '4px' }} />
                                    {formatRelativeDate(discussion.lastActivity)}
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </SplitItem>
                  </Split>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Discussion Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetCreateForm();
        }}
        variant="medium"
      >
        <ModalHeader title="Start a New Discussion" />
        <ModalBody>
          <Form>
            <FormGroup label="Title" isRequired fieldId="discussion-title">
              <TextInput
                id="discussion-title"
                type="text"
                value={newTitle}
                onChange={(e, value) => setNewTitle(value)}
                placeholder="What do you want to discuss?"
              />
            </FormGroup>
            
            <FormGroup label="Category" fieldId="discussion-category">
              <Select
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsNewCategorySelectOpen(!isNewCategorySelectOpen)}
                    isExpanded={isNewCategorySelectOpen}
                    style={{ width: '100%' }}
                  >
                    {newCategory}
                  </MenuToggle>
                )}
                isOpen={isNewCategorySelectOpen}
                onOpenChange={(isOpen) => setIsNewCategorySelectOpen(isOpen)}
                onSelect={(e, value) => {
                  setNewCategory(value);
                  setIsNewCategorySelectOpen(false);
                }}
                selected={newCategory}
              >
                {categories.filter(c => c !== 'All').map((cat) => (
                  <SelectOption key={cat} value={cat}>
                    {cat}
                  </SelectOption>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup label="Content" fieldId="discussion-content">
              <TextArea
                id="discussion-content"
                value={newContent}
                onChange={(e, value) => setNewContent(value)}
                placeholder="Share your thoughts, ask your question, or describe your idea..."
                rows={8}
              />
            </FormGroup>
            
            <FormGroup 
              label="Tags" 
              fieldId="discussion-tags"
              helperText="Separate tags with commas"
            >
              <TextInput
                id="discussion-tags"
                type="text"
                value={newTags}
                onChange={(e, value) => setNewTags(value)}
                placeholder="e.g., feature-request, bug, design"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={handleCreateDiscussion}
            isLoading={creating}
            isDisabled={!newTitle.trim() || creating}
          >
            Create Discussion
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setIsCreateModalOpen(false);
              resetCreateForm();
            }}
            isDisabled={creating}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Discussions;
