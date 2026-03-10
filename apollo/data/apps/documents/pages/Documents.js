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
  FormGroup
} from '@patternfly/react-core';
import {
  BookOpenIcon,
  PlusIcon,
  SearchIcon,
  CalendarAltIcon,
  TagIcon,
  OutlinedClockIcon,
  ShareAltIcon,
  CodeBranchIcon,
  UndoIcon
} from '@patternfly/react-icons';
import ShareArtifactModal from '../../../../src/components/ShareArtifactModal';
import UnshareArtifactModal from '../../../../src/components/UnshareArtifactModal';
import CollectionLayout from '../../../../src/components/CollectionLayout';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [unshareTarget, setUnshareTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
      setLoading(false);
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
    return formatDate(dateString);
  };

  const handleDocumentClick = (doc) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDocTitle.trim(), content: '' }),
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setNewDocTitle('');
        navigate(`/documents/${data.document.id}`);
      } else {
        console.error('Failed to create document:', data.error);
      }
    } catch (err) {
      console.error('Error creating document:', err);
    } finally {
      setCreating(false);
    }
  };

  // Filter documents by search term
  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(term) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  });

  // ── Card renderer ──────────────────────────────────────────────────
  const renderDocumentCard = (doc) => (
    <Card
      isClickable
      isSelectable
      onClick={() => handleDocumentClick(doc)}
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
      {/* Document Icon Header */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '35%',
          background: 'linear-gradient(135deg, #0066cc 0%, #004080 100%)',
          borderRadius: '4px 4px 0 0',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <BookOpenIcon style={{ fontSize: '48px', color: 'rgba(255, 255, 255, 0.9)' }} />
        </div>
      </div>

      <CardBody>
        <Title headingLevel="h3" size="lg" style={{ marginBottom: '0.5rem' }}>
          {doc.title || 'Untitled'}
        </Title>

        {doc.tags && doc.tags.length > 0 && (
          <Flex
            spaceItems={{ default: 'spaceItemsXs' }}
            style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}
          >
            {doc.tags.slice(0, 3).map((tag, idx) => (
              <FlexItem key={idx}>
                <Label color="blue" isCompact icon={<TagIcon />}>{tag}</Label>
              </FlexItem>
            ))}
            {doc.tags.length > 3 && (
              <FlexItem>
                <Label color="grey" isCompact>+{doc.tags.length - 3}</Label>
              </FlexItem>
            )}
          </Flex>
        )}

        {doc.shared && (
          <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ marginBottom: '0.5rem' }}>
            <FlexItem>
              <Label color="purple" isCompact icon={<CodeBranchIcon />}>
                {doc.repoName || 'Shared'}
              </Label>
            </FlexItem>
          </Flex>
        )}

        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <CalendarAltIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
              </FlexItem>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  Created {formatDate(doc.created)}
                </Content>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <OutlinedClockIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
              </FlexItem>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  Modified {formatRelativeDate(doc.modified)}
                </Content>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>

        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--pf-v6-global--BorderColor--100)', paddingTop: '0.5rem' }}>
          {doc.shared ? (
            <Button variant="link" isSmall icon={<UndoIcon />}
              onClick={(e) => { e.stopPropagation(); setUnshareTarget({ id: doc.id, title: doc.title, repoId: doc.repoId, repoName: doc.repoName }); }}>
              Unshare
            </Button>
          ) : (
            <Button variant="link" isSmall icon={<ShareAltIcon />}
              onClick={(e) => { e.stopPropagation(); setShareTarget({ id: doc.id, title: doc.title }); }}>
              Share
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );

  // ── Table columns ──────────────────────────────────────────────────
  const tableColumns = [
    {
      key: 'title',
      label: 'Title',
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <div style={{
              width: '48px',
              height: '36px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #0066cc 0%, #004080 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BookOpenIcon style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }} />
            </div>
          </FlexItem>
          <FlexItem><strong>{item.title || 'Untitled'}</strong></FlexItem>
        </Flex>
      )
    },
    {
      key: 'tags',
      label: 'Tags',
      width: 20,
      render: (item) => item.tags && item.tags.length > 0 ? (
        <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ flexWrap: 'wrap' }}>
          {item.tags.slice(0, 3).map((tag, idx) => (
            <FlexItem key={idx}>
              <Label color="blue" isCompact icon={<TagIcon />}>{tag}</Label>
            </FlexItem>
          ))}
          {item.tags.length > 3 && (
            <FlexItem>
              <Label color="grey" isCompact>+{item.tags.length - 3}</Label>
            </FlexItem>
          )}
        </Flex>
      ) : (
        <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>—</span>
      )
    },
    {
      key: 'created',
      label: 'Created',
      width: 18,
      render: (item) => formatDate(item.created)
    },
    {
      key: 'modified',
      label: 'Modified',
      width: 15,
      render: (item) => formatRelativeDate(item.modified)
    },
    {
      key: 'status',
      label: 'Status',
      width: 12,
      render: (item) => item.shared ? (
        <Label color="purple" isCompact icon={<CodeBranchIcon />}>Shared</Label>
      ) : null
    }
  ];

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading documents...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <BookOpenIcon size="xl" />
          <Title headingLevel="h2" size="lg">Error Loading Documents</Title>
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
            <Title headingLevel="h1" size="2xl">Documents</Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Collaborative documents with real-time editing
            </Content>
          </FlexItem>
          <FlexItem>
            <Button variant="primary" icon={<PlusIcon />} onClick={() => setIsCreateModalOpen(true)}>
              New Document
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Collection content with card/list toggle */}
      <CollectionLayout
        storageKey="documents"
        items={filteredDocuments}
        renderCard={renderDocumentCard}
        columns={tableColumns}
        onItemClick={handleDocumentClick}
        toolbarItems={
          <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem style={{ minWidth: '280px' }}>
              <TextInput
                type="text"
                aria-label="Search documents"
                placeholder="Search by title or tag..."
                value={searchTerm}
                onChange={(e, value) => setSearchTerm(value)}
                customIcon={<SearchIcon />}
              />
            </FlexItem>
            <FlexItem>
              <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </Content>
            </FlexItem>
          </Flex>
        }
        emptyState={
          <EmptyState variant="lg">
            <BookOpenIcon size="xl" />
            <Title headingLevel="h2" size="lg">
              {documents.length === 0 ? 'No Documents Yet' : 'No Matching Documents'}
            </Title>
            <EmptyStateBody>
              {documents.length === 0
                ? 'Create your first document to get started with collaborative editing.'
                : 'Try a different search term.'}
            </EmptyStateBody>
            {documents.length === 0 && (
              <Button variant="primary" icon={<PlusIcon />} onClick={() => setIsCreateModalOpen(true)}>
                Create Document
              </Button>
            )}
          </EmptyState>
        }
      />

      {/* Create Document Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setNewDocTitle(''); }}
        variant="small"
      >
        <ModalHeader title="Create New Document" />
        <ModalBody>
          <Form>
            <FormGroup label="Title" isRequired fieldId="doc-title">
              <TextInput
                id="doc-title"
                type="text"
                value={newDocTitle}
                onChange={(e, value) => setNewDocTitle(value)}
                placeholder="Enter document title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDocTitle.trim()) {
                    e.preventDefault();
                    handleCreateDocument();
                  }
                }}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleCreateDocument} isLoading={creating} isDisabled={!newDocTitle.trim() || creating}>
            Create
          </Button>
          <Button variant="link" onClick={() => { setIsCreateModalOpen(false); setNewDocTitle(''); }} isDisabled={creating}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <ShareArtifactModal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        artifactType="documents"
        artifactId={shareTarget?.id}
        artifactName={shareTarget?.title}
        onShareComplete={() => fetchDocuments()}
      />
      <UnshareArtifactModal
        isOpen={!!unshareTarget}
        onClose={() => setUnshareTarget(null)}
        artifactType="documents"
        artifactId={unshareTarget?.id}
        artifactName={unshareTarget?.title}
        repoId={unshareTarget?.repoId}
        repoName={unshareTarget?.repoName}
        onUnshareComplete={() => fetchDocuments()}
      />
    </div>
  );
};

export default Documents;
