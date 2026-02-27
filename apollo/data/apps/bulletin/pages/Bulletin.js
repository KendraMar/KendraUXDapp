import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
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
  ToggleGroup,
  ToggleGroupItem,
  ExpandableSection,
  Popover,
  ActionList,
  ActionListItem
} from '@patternfly/react-core';
import {
  PlusIcon,
  SearchIcon,
  TagIcon,
  UserIcon,
  CalendarAltIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkAltIcon,
  TimesIcon
} from '@patternfly/react-icons';

// Predefined background colors for sticky notes
const NOTE_COLORS = [
  { name: 'Yellow', value: '#fff9c4' },
  { name: 'Pink', value: '#f8bbd9' },
  { name: 'Blue', value: '#bbdefb' },
  { name: 'Green', value: '#c8e6c9' },
  { name: 'Orange', value: '#ffe0b2' },
  { name: 'Purple', value: '#e1bee7' },
  { name: 'Teal', value: '#b2dfdb' },
  { name: 'White', value: '#ffffff' }
];

const Bulletin = () => {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'mine'
  const [selectedTags, setSelectedTags] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState(null);
  const [expandedBulletins, setExpandedBulletins] = useState(new Set());
  const navigate = useNavigate();

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formColor, setFormColor] = useState('#fff9c4');
  const [formHtmlContent, setFormHtmlContent] = useState('');
  const [formCssContent, setFormCssContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Current user (in a real app, this would come from auth context)
  const currentUser = { id: 'local-user', name: 'You' };

  useEffect(() => {
    fetchBulletins();
  }, []);

  const fetchBulletins = async () => {
    try {
      const response = await fetch('/api/bulletins');
      const data = await response.json();
      if (data.success) {
        setBulletins(data.bulletins);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bulletins:', err);
      setError('Failed to load bulletins');
      setLoading(false);
    }
  };

  // Get all unique tags from bulletins
  const allTags = useMemo(() => {
    const tags = new Set();
    bulletins.forEach(b => b.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [bulletins]);

  // Filter bulletins
  const filteredBulletins = useMemo(() => {
    return bulletins.filter(bulletin => {
      // Filter by ownership
      if (filterMode === 'mine' && bulletin.authorId !== currentUser.id) {
        return false;
      }

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = bulletin.title?.toLowerCase().includes(term);
        const matchesDescription = bulletin.description?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Filter by selected tags
      if (selectedTags.length > 0) {
        const bulletinTags = bulletin.tags || [];
        const hasMatchingTag = selectedTags.some(tag => bulletinTags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [bulletins, filterMode, searchTerm, selectedTags, currentUser.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormTags('');
    setFormColor('#fff9c4');
    setFormHtmlContent('');
    setFormCssContent('');
    setEditingBulletin(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = async (bulletin) => {
    // Fetch full bulletin data including content
    try {
      const response = await fetch(`/api/bulletins/${bulletin.id}`);
      const data = await response.json();
      if (data.success) {
        const b = data.bulletin;
        setFormTitle(b.title || '');
        setFormDescription(b.description || '');
        setFormTags(b.tags?.join(', ') || '');
        setFormColor(b.backgroundColor || '#fff9c4');
        setFormHtmlContent(b.htmlContent || '');
        setFormCssContent(b.cssContent || '');
        setEditingBulletin(b);
        setIsCreateModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading bulletin for edit:', err);
    }
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;

    setSaving(true);
    try {
      const tags = formTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      const bulletinData = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        author: currentUser.name,
        authorId: currentUser.id,
        backgroundColor: formColor,
        tags,
        htmlContent: formHtmlContent.trim() || null,
        cssContent: formCssContent.trim() || null
      };

      let response;
      if (editingBulletin) {
        response = await fetch(`/api/bulletins/${editingBulletin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulletinData)
        });
      } else {
        response = await fetch('/api/bulletins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulletinData)
        });
      }

      const data = await response.json();
      if (data.success) {
        closeModal();
        fetchBulletins();
      } else {
        console.error('Failed to save bulletin:', data.error);
      }
    } catch (err) {
      console.error('Error saving bulletin:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bulletinId) => {
    if (!window.confirm('Are you sure you want to delete this bulletin?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bulletins/${bulletinId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchBulletins();
      }
    } catch (err) {
      console.error('Error deleting bulletin:', err);
    }
  };

  const toggleExpanded = (bulletinId) => {
    setExpandedBulletins(prev => {
      const next = new Set(prev);
      if (next.has(bulletinId)) {
        next.delete(bulletinId);
      } else {
        next.add(bulletinId);
      }
      return next;
    });
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading bulletins...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <Title headingLevel="h2" size="lg">Error Loading Bulletins</Title>
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
              Bulletin Board
            </Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Share notices, announcements, and mini-advertisements
            </Content>
          </FlexItem>
          <FlexItem>
            <Button 
              variant="primary" 
              icon={<PlusIcon />}
              onClick={openCreateModal}
            >
              New Bulletin
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Filters */}
      <PageSection variant="light" style={{ flexShrink: 0, paddingTop: 0 }}>
        <Flex 
          spaceItems={{ default: 'spaceItemsMd' }} 
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
        >
          {/* Search */}
          <FlexItem style={{ minWidth: '250px', maxWidth: '400px' }}>
            <TextInput
              type="text"
              aria-label="Search bulletins"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e, value) => setSearchTerm(value)}
              customIcon={<SearchIcon />}
            />
          </FlexItem>

          {/* All/Mine Toggle */}
          <FlexItem>
            <ToggleGroup aria-label="Filter by ownership">
              <ToggleGroupItem
                text="All"
                buttonId="filter-all"
                isSelected={filterMode === 'all'}
                onChange={() => setFilterMode('all')}
              />
              <ToggleGroupItem
                text="My Bulletins"
                buttonId="filter-mine"
                isSelected={filterMode === 'mine'}
                onChange={() => setFilterMode('mine')}
              />
            </ToggleGroup>
          </FlexItem>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <FlexItem>
              <Popover
                headerContent="Filter by tags"
                bodyContent={
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '300px' }}>
                    {allTags.map(tag => (
                      <Label
                        key={tag}
                        color={selectedTags.includes(tag) ? 'blue' : 'grey'}
                        onClick={() => toggleTag(tag)}
                        style={{ cursor: 'pointer' }}
                        icon={<TagIcon />}
                      >
                        {tag}
                      </Label>
                    ))}
                  </div>
                }
              >
                <Button variant="secondary" icon={<TagIcon />}>
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Button>
              </Popover>
            </FlexItem>
          )}

          {/* Selected tags display */}
          {selectedTags.length > 0 && (
            <FlexItem>
              <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    Filtering by:
                  </Content>
                </FlexItem>
                {selectedTags.map(tag => (
                  <FlexItem key={tag}>
                    <Label 
                      color="blue" 
                      onClose={() => toggleTag(tag)}
                      closeBtnAriaLabel={`Remove ${tag} filter`}
                    >
                      {tag}
                    </Label>
                  </FlexItem>
                ))}
              </Flex>
            </FlexItem>
          )}

          {/* Count */}
          <FlexItem style={{ marginLeft: 'auto' }}>
            <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
              {filteredBulletins.length} bulletin{filteredBulletins.length !== 1 ? 's' : ''}
            </Content>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Masonry Bulletin Board */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--pf-t--global--background--color--secondary--default)' }}>
        {filteredBulletins.length === 0 ? (
          <EmptyState variant="lg">
            <Title headingLevel="h2" size="lg">
              {bulletins.length === 0 ? 'No Bulletins Yet' : 'No Matching Bulletins'}
            </Title>
            <EmptyStateBody>
              {bulletins.length === 0 
                ? 'Create your first bulletin to get started.'
                : 'Try a different search or filter.'}
            </EmptyStateBody>
            {bulletins.length === 0 && (
              <Button 
                variant="primary" 
                icon={<PlusIcon />}
                onClick={openCreateModal}
              >
                Create Bulletin
              </Button>
            )}
          </EmptyState>
        ) : (
          <div 
            className="apollo-bulletin-masonry"
            style={{
              columnCount: 'auto',
              columnWidth: '300px',
              columnGap: '1rem'
            }}
          >
            {filteredBulletins.map((bulletin) => {
              const isOwner = bulletin.authorId === currentUser.id && bulletin.source === 'local';
              const isExpanded = expandedBulletins.has(bulletin.id);

              return (
                <div
                  key={bulletin.id}
                  className="apollo-bulletin-card"
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '1rem',
                    background: bulletin.backgroundColor || '#fff9c4',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: '1rem',
                    position: 'relative',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) rotate(0.5deg)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) rotate(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Pin decoration */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '16px',
                      height: '16px',
                      background: '#e53935',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  />

                  {/* Title */}
                  <Title 
                    headingLevel="h3" 
                    size="md" 
                    style={{ 
                      marginTop: '0.5rem',
                      marginBottom: '0.5rem',
                      color: '#333',
                      wordBreak: 'break-word'
                    }}
                  >
                    {bulletin.title}
                  </Title>

                  {/* Description */}
                  {bulletin.description && (
                    <p style={{ 
                      margin: '0 0 0.75rem 0', 
                      color: '#555',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}>
                      {bulletin.description}
                    </p>
                  )}

                  {/* Expandable HTML Content */}
                  {bulletin.hasContent && (
                    <ExpandableSection
                      toggleText={isExpanded ? 'Hide content' : 'Show content'}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpanded(bulletin.id)}
                      style={{ marginBottom: '0.75rem' }}
                    >
                      <div 
                        style={{
                          background: '#fff',
                          borderRadius: '4px',
                          padding: '0.5rem',
                          marginTop: '0.5rem'
                        }}
                      >
                        <iframe
                          src={`/api/bulletins/${bulletin.id}/content`}
                          style={{
                            width: '100%',
                            height: '200px',
                            border: 'none',
                            borderRadius: '4px'
                          }}
                          title={`Content for ${bulletin.title}`}
                        />
                        <Button
                          variant="link"
                          icon={<ExternalLinkAltIcon />}
                          onClick={() => navigate(`/bulletin/${bulletin.id}`)}
                          style={{ marginTop: '0.5rem' }}
                          isSmall
                        >
                          View full page
                        </Button>
                      </div>
                    </ExpandableSection>
                  )}

                  {/* Tags */}
                  {bulletin.tags && bulletin.tags.length > 0 && (
                    <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {bulletin.tags.map((tag, idx) => (
                        <FlexItem key={idx}>
                          <Label color="grey" isCompact style={{ background: 'rgba(0,0,0,0.1)' }}>
                            {tag}
                          </Label>
                        </FlexItem>
                      ))}
                    </Flex>
                  )}

                  {/* Metadata */}
                  <Flex 
                    spaceItems={{ default: 'spaceItemsMd' }} 
                    alignItems={{ default: 'alignItemsCenter' }}
                    style={{ fontSize: '0.8rem', color: '#666' }}
                  >
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                        <UserIcon />
                        <span>{bulletin.author}</span>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                        <CalendarAltIcon />
                        <span>{formatDate(bulletin.created)}</span>
                      </Flex>
                    </FlexItem>
                    {bulletin.source !== 'local' && (
                      <FlexItem>
                        <Label isCompact color="purple">{bulletin.source}</Label>
                      </FlexItem>
                    )}
                  </Flex>

                  {/* Actions for owner */}
                  {isOwner && (
                    <ActionList 
                      style={{ 
                        marginTop: '0.75rem', 
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid rgba(0,0,0,0.1)' 
                      }}
                    >
                      <ActionListItem>
                        <Button 
                          variant="link" 
                          icon={<EditIcon />} 
                          onClick={() => openEditModal(bulletin)}
                          isSmall
                          style={{ color: '#555' }}
                        >
                          Edit
                        </Button>
                      </ActionListItem>
                      <ActionListItem>
                        <Button 
                          variant="link" 
                          icon={<TrashIcon />} 
                          onClick={() => handleDelete(bulletin.id)}
                          isSmall
                          isDanger
                        >
                          Delete
                        </Button>
                      </ActionListItem>
                    </ActionList>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        variant="medium"
      >
        <ModalHeader title={editingBulletin ? 'Edit Bulletin' : 'Create New Bulletin'} />
        <ModalBody>
          <Form>
            <FormGroup label="Title" isRequired fieldId="bulletin-title">
              <TextInput
                id="bulletin-title"
                type="text"
                value={formTitle}
                onChange={(e, value) => setFormTitle(value)}
                placeholder="Enter a title..."
              />
            </FormGroup>

            <FormGroup label="Description" fieldId="bulletin-description">
              <TextArea
                id="bulletin-description"
                value={formDescription}
                onChange={(e, value) => setFormDescription(value)}
                placeholder="Brief description or announcement text..."
                rows={3}
              />
            </FormGroup>

            <FormGroup label="Tags" fieldId="bulletin-tags" helperText="Comma-separated tags">
              <TextInput
                id="bulletin-tags"
                type="text"
                value={formTags}
                onChange={(e, value) => setFormTags(value)}
                placeholder="e.g., announcement, event, hiring"
              />
            </FormGroup>

            <FormGroup label="Background Color" fieldId="bulletin-color">
              <Flex spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'wrap' }}>
                {NOTE_COLORS.map((color) => (
                  <FlexItem key={color.value}>
                    <button
                      type="button"
                      onClick={() => setFormColor(color.value)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: color.value,
                        border: formColor === color.value ? '3px solid #0066cc' : '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      aria-label={color.name}
                      title={color.name}
                    />
                  </FlexItem>
                ))}
              </Flex>
            </FormGroup>

            <ExpandableSection toggleText="Add HTML/CSS content (optional)">
              <FormGroup label="HTML Content" fieldId="bulletin-html" style={{ marginTop: '1rem' }}>
                <TextArea
                  id="bulletin-html"
                  value={formHtmlContent}
                  onChange={(e, value) => setFormHtmlContent(value)}
                  placeholder="<div>Your HTML content here...</div>"
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
              </FormGroup>

              <FormGroup label="CSS Styles" fieldId="bulletin-css">
                <TextArea
                  id="bulletin-css"
                  value={formCssContent}
                  onChange={(e, value) => setFormCssContent(value)}
                  placeholder=".my-class { color: blue; }"
                  rows={4}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
              </FormGroup>
            </ExpandableSection>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            isDisabled={!formTitle.trim() || saving}
          >
            {editingBulletin ? 'Save Changes' : 'Create'}
          </Button>
          <Button
            variant="link"
            onClick={closeModal}
            isDisabled={saving}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Bulletin;
