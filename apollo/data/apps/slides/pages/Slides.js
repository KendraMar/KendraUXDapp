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
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  FormSelect,
  FormSelectOption
} from '@patternfly/react-core';
import {
  ScreenIcon,
  PlusCircleIcon,
  CalendarAltIcon,
  ShareAltIcon,
  CodeBranchIcon,
  UndoIcon,
  ListIcon,
  TrashIcon
} from '@patternfly/react-icons';
import ShareArtifactModal from '../../../../src/components/ShareArtifactModal';
import UnshareArtifactModal from '../../../../src/components/UnshareArtifactModal';
import CollectionLayout from '../../../../src/components/CollectionLayout';

const Slides = () => {
  const [slideDecks, setSlideDecks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDeckForm, setNewDeckForm] = useState({
    name: '',
    title: '',
    description: '',
    template: 'uxd',
    aspectRatio: '16:9'
  });
  const [creating, setCreating] = useState(false);
  const [creatingJiraHighlights, setCreatingJiraHighlights] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [unshareTarget, setUnshareTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlideDecks();
    fetchTemplates();
  }, []);

  const fetchSlideDecks = async (isRefresh = false) => {
    try {
      const response = await fetch('/api/slides');
      const data = await response.json();
      if (data.success) {
        setSlideDecks(data.slideDecks);
        // If items are missing heroes, the backend generates them in background.
        // Re-fetch after a delay to pick up the new hero images.
        if (!isRefresh && data.slideDecks.some(d => !d.hasHero && !d.shared)) {
          setTimeout(() => fetchSlideDecks(true), 5000);
        }
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching slide decks:', err);
      setError('Failed to load slide decks');
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/slides/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeckClick = (deck) => {
    navigate(`/slides/${deck.id}`);
  };

  const handleCreateDeck = async () => {
    if (!newDeckForm.name.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeckForm)
      });
      const data = await response.json();
      
      if (data.success) {
        setSlideDecks([data.slideDeck, ...slideDecks]);
        setIsCreateModalOpen(false);
        setNewDeckForm({ name: '', title: '', description: '', template: 'uxd', aspectRatio: '16:9' });
        navigate(`/slides/${data.slideDeck.id}`);
      } else {
        alert(data.error || 'Failed to create slide deck');
      }
    } catch (err) {
      console.error('Error creating slide deck:', err);
      alert('Failed to create slide deck');
    }
    setCreating(false);
  };

  const handleDeleteDeck = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/slides/${deleteTarget.id}`, { method: 'DELETE' });
      if (response.ok) {
        setSlideDecks(slideDecks.filter(d => d.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete slide deck');
      }
    } catch (err) {
      console.error('Error deleting slide deck:', err);
      alert('Failed to delete slide deck');
    }
    setDeleting(false);
  };

  const handleCreateJiraHighlights = async (onlyKey) => {
    setCreatingJiraHighlights(true);
    try {
      const url = onlyKey ? `/api/slides/jira-highlights?only=${encodeURIComponent(onlyKey)}` : '/api/slides/jira-highlights';
      const opts = { method: 'POST' };
      if (onlyKey) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify({ only: onlyKey });
      }
      const response = await fetch(url, opts);
      const data = await response.json().catch(() => ({ success: false, error: 'Invalid response from server' }));
      if (data.success) {
        setSlideDecks([data.slideDeck, ...slideDecks]);
        navigate(`/slides/${data.slideDeck.id}`);
      } else {
        alert(data.error || 'Failed to create Jira highlights slides');
      }
    } catch (err) {
      console.error('Error creating Jira highlights:', err);
      alert(err.message || 'Failed to create Jira highlights slides');
    }
    setCreatingJiraHighlights(false);
  };

  // ── Card renderer ──────────────────────────────────────────────────
  const renderSlideCard = (deck) => (
    <Card
      isClickable
      isSelectable
      onClick={() => handleDeckClick(deck)}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid var(--pf-v6-global--BorderColor--100)',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Slide Preview Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: deck.hasHero ? '#000' : 'linear-gradient(135deg, #151515 0%, #2d3548 50%, #151515 100%)',
          borderRadius: '4px 4px 0 0',
          overflow: 'hidden'
        }}
      >
        {deck.hasHero ? (
          <img
            src={`/api/slides/${deck.id}/hero`}
            alt={deck.title}
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ScreenIcon style={{ fontSize: '28px', color: '#EE0000' }} />
            </div>
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          {deck.slideCount} slides
        </div>
      </div>

      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <h3 style={{
              margin: 0, marginTop: '4px',
              fontSize: '1rem', fontWeight: '600', lineHeight: '1.4',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
            }}>
              {deck.title}
            </h3>
          </FlexItem>

          {deck.description && (
            <FlexItem>
              <p style={{
                margin: 0, fontSize: '0.875rem',
                color: 'var(--pf-v6-global--Color--200)',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>
                {deck.description}
              </p>
            </FlexItem>
          )}

          <FlexItem>
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--pf-v6-global--Color--200)',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <CalendarAltIcon />
              {formatDate(deck.modifiedAt)}
            </span>
          </FlexItem>

          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              {deck.shared && (
                <FlexItem>
                  <Label color="purple" isCompact icon={<CodeBranchIcon />}>
                    {deck.repoName || 'Shared'}
                  </Label>
                </FlexItem>
              )}
              <FlexItem>
                <Label color="red" isCompact>{deck.template?.toUpperCase() || 'UXD'}</Label>
              </FlexItem>
              <FlexItem>
                <Label color="blue" isCompact>{deck.aspectRatio || '16:9'}</Label>
              </FlexItem>
            </Flex>
          </FlexItem>

          <FlexItem>
            <div style={{ borderTop: '1px solid var(--pf-v6-global--BorderColor--100)', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {deck.shared ? (
                <Button variant="link" isSmall icon={<UndoIcon />}
                  onClick={(e) => { e.stopPropagation(); setUnshareTarget({ id: deck.id, title: deck.title, repoId: deck.repoId, repoName: deck.repoName }); }}>
                  Unshare
                </Button>
              ) : (
                <Button variant="link" isSmall icon={<ShareAltIcon />}
                  onClick={(e) => { e.stopPropagation(); setShareTarget({ id: deck.id, title: deck.title }); }}>
                  Share
                </Button>
              )}
              {!deck.shared && (
                <Button variant="link" isSmall icon={<TrashIcon />} style={{ color: 'var(--pf-v6-global--danger-color--100)' }}
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: deck.id, title: deck.title }); }}>
                  Delete
                </Button>
              )}
            </div>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );

  // ── Table columns ──────────────────────────────────────────────────
  const tableColumns = [
    {
      key: 'title',
      label: 'Name',
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            {item.hasHero ? (
              <img
                src={`/api/slides/${item.id}/hero`}
                alt={item.title}
                style={{
                  width: '48px',
                  height: '36px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{
                width: '48px',
                height: '36px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #151515 0%, #2d3548 50%, #151515 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ScreenIcon style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }} />
              </div>
            )}
          </FlexItem>
          <FlexItem>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
              <FlexItem><strong>{item.title}</strong></FlexItem>
              {item.description && (
                <FlexItem>
                  <span style={{ fontSize: '0.85rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    {item.description}
                  </span>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
        </Flex>
      )
    },
    {
      key: 'slideCount',
      label: 'Slides',
      width: 10,
      render: (item) => item.slideCount
    },
    {
      key: 'template',
      label: 'Template',
      width: 12,
      render: (item) => (
        <Label color="red" isCompact>{item.template?.toUpperCase() || 'UXD'}</Label>
      )
    },
    {
      key: 'aspectRatio',
      label: 'Aspect Ratio',
      width: 12,
      render: (item) => item.aspectRatio || '16:9'
    },
    {
      key: 'modifiedAt',
      label: 'Modified',
      width: 18,
      render: (item) => formatDate(item.modifiedAt)
    },
    {
      key: 'status',
      label: 'Status',
      width: 12,
      render: (item) => item.shared ? (
        <Label color="purple" isCompact icon={<CodeBranchIcon />}>Shared</Label>
      ) : null
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 15,
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
          {item.shared ? (
            <Button variant="link" isSmall icon={<UndoIcon />}
              onClick={(e) => { e.stopPropagation(); setUnshareTarget({ id: item.id, title: item.title, repoId: item.repoId, repoName: item.repoName }); }}>
              Unshare
            </Button>
          ) : (
            <Button variant="link" isSmall icon={<ShareAltIcon />}
              onClick={(e) => { e.stopPropagation(); setShareTarget({ id: item.id, title: item.title }); }}>
              Share
            </Button>
          )}
          {!item.shared && (
            <Button variant="link" isSmall icon={<TrashIcon />} style={{ color: 'var(--pf-v6-global--danger-color--100)' }}
              onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: item.id, title: item.title }); }}>
              Delete
            </Button>
          )}
        </Flex>
      )
    }
  ];

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading slide decks...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <ScreenIcon size="xl" />
          <Title headingLevel="h2" size="lg">Error Loading Slide Decks</Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="2xl">Slides</Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Create and present beautiful slide decks from Markdown
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Badge isRead>{slideDecks.length} slide decks</Badge>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="secondary"
                  icon={<ListIcon />}
                  onClick={() => handleCreateJiraHighlights()}
                  isLoading={creatingJiraHighlights}
                  isDisabled={creatingJiraHighlights}
                >
                  Create Jira highlights slides
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="tertiary"
                  icon={<ListIcon />}
                  onClick={() => handleCreateJiraHighlights('CPUX-6140')}
                  isLoading={creatingJiraHighlights}
                  isDisabled={creatingJiraHighlights}
                >
                  Test CPUX-6140 only
                </Button>
              </FlexItem>
              <FlexItem>
                <a href="/api/slides/jira-debug/CPUX-6140" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem' }}>
                  Debug comments (CPUX-6140)
                </a>
              </FlexItem>
              <FlexItem>
                <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setIsCreateModalOpen(true)}>
                  New Slide Deck
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Collection content with card/list toggle */}
      <CollectionLayout
        storageKey="slides"
        items={slideDecks}
        renderCard={renderSlideCard}
        columns={tableColumns}
        onItemClick={handleDeckClick}
        emptyState={
          <EmptyState variant="lg">
            <ScreenIcon size="xl" />
            <Title headingLevel="h2" size="lg">No Slide Decks Found</Title>
            <EmptyStateBody>
              Create your first slide deck to get started. Slide decks are stored in the data/slides folder.
            </EmptyStateBody>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <Button variant="secondary" icon={<ListIcon />} onClick={() => handleCreateJiraHighlights()} isLoading={creatingJiraHighlights} isDisabled={creatingJiraHighlights}>
                Create Jira highlights slides
              </Button>
              <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setIsCreateModalOpen(true)}>
                Create Slide Deck
              </Button>
            </Flex>
          </EmptyState>
        }
      />

      {/* Create Modal */}
      <Modal
        variant={ModalVariant.medium}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        aria-labelledby="create-slide-deck-modal-title"
        aria-describedby="create-slide-deck-modal-description"
      >
        <ModalHeader
          title="Create New Slide Deck"
          labelId="create-slide-deck-modal-title"
          description="Set up your new slide deck with a name, template, and settings."
          descriptorId="create-slide-deck-modal-description"
        />
        <ModalBody>
          <Form id="create-slide-deck-form">
            <FormGroup label="Name" isRequired fieldId="deck-name">
              <TextInput
                isRequired
                id="deck-name"
                value={newDeckForm.name}
                onChange={(e, value) => setNewDeckForm({ ...newDeckForm, name: value })}
                placeholder="my-slide-deck"
              />
              <p style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)', marginTop: '4px' }}>
                This will be used as the folder name (lowercase, hyphens only)
              </p>
            </FormGroup>
            <FormGroup label="Title" fieldId="deck-title">
              <TextInput
                id="deck-title"
                value={newDeckForm.title}
                onChange={(e, value) => setNewDeckForm({ ...newDeckForm, title: value })}
                placeholder="My Presentation"
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="deck-description">
              <TextArea
                id="deck-description"
                value={newDeckForm.description}
                onChange={(e, value) => setNewDeckForm({ ...newDeckForm, description: value })}
                placeholder="A brief description of your presentation..."
                rows={3}
              />
            </FormGroup>
            <FormGroup label="Template" fieldId="deck-template">
              <FormSelect
                id="deck-template"
                value={newDeckForm.template}
                onChange={(e, value) => setNewDeckForm({ ...newDeckForm, template: value })}
              >
                {templates.length > 0 ? (
                  templates.map((t) => (
                    <FormSelectOption key={t.id} value={t.id} label={t.name} />
                  ))
                ) : (
                  <FormSelectOption value="uxd" label="UXD Red Hat" />
                )}
              </FormSelect>
            </FormGroup>
            <FormGroup label="Aspect Ratio" fieldId="deck-aspect">
              <FormSelect
                id="deck-aspect"
                value={newDeckForm.aspectRatio}
                onChange={(e, value) => setNewDeckForm({ ...newDeckForm, aspectRatio: value })}
              >
                <FormSelectOption value="16:9" label="16:9 (Widescreen)" />
                <FormSelectOption value="4:3" label="4:3 (Standard)" />
                <FormSelectOption value="1:1" label="1:1 (Square)" />
              </FormSelect>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button key="create" variant="primary" onClick={handleCreateDeck} isLoading={creating} isDisabled={!newDeckForm.name.trim() || creating} form="create-slide-deck-form">
            Create
          </Button>
          <Button key="cancel" variant="link" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      <ShareArtifactModal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        artifactType="slides"
        artifactId={shareTarget?.id}
        artifactName={shareTarget?.title}
        onShareComplete={() => fetchSlideDecks()}
      />
      <UnshareArtifactModal
        isOpen={!!unshareTarget}
        onClose={() => setUnshareTarget(null)}
        artifactType="slides"
        artifactId={unshareTarget?.id}
        artifactName={unshareTarget?.title}
        repoId={unshareTarget?.repoId}
        repoName={unshareTarget?.repoName}
        onUnshareComplete={() => fetchSlideDecks()}
      />

      <Modal
        variant={ModalVariant.small}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        aria-labelledby="delete-slide-deck-modal-title"
      >
        <ModalHeader
          title="Delete Slide Deck"
          labelId="delete-slide-deck-modal-title"
          description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        />
        <ModalFooter>
          <Button variant="danger" onClick={handleDeleteDeck} isLoading={deleting} isDisabled={deleting}>
            Delete
          </Button>
          <Button variant="link" onClick={() => setDeleteTarget(null)} isDisabled={deleting}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Slides;
