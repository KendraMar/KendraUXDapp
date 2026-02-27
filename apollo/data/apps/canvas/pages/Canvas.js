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
  TextInput
} from '@patternfly/react-core';
import {
  TopologyIcon,
  PlusCircleIcon,
  CalendarAltIcon,
  ShareAltIcon,
  CodeBranchIcon,
  UndoIcon
} from '@patternfly/react-icons';
import ShareArtifactModal from '../../../../src/components/ShareArtifactModal';
import UnshareArtifactModal from '../../../../src/components/UnshareArtifactModal';
import CollectionLayout from '../../../../src/components/CollectionLayout';

const Canvas = () => {
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [unshareTarget, setUnshareTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async (isRefresh = false) => {
    try {
      const response = await fetch('/api/canvas');
      const data = await response.json();
      if (data.success) {
        setCanvases(data.canvases);
        // If items are missing heroes, the backend generates them in background.
        // Re-fetch after a delay to pick up the new hero images.
        if (!isRefresh && data.canvases.some(c => !c.hasHero && !c.shared)) {
          setTimeout(() => fetchCanvases(true), 5000);
        }
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching canvases:', err);
      setError('Failed to load canvases');
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

  const handleCanvasClick = (canvas) => {
    navigate(`/canvas/${canvas.id}`);
  };

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCanvasName })
      });
      const data = await response.json();
      
      if (data.success) {
        setCanvases([data.canvas, ...canvases]);
        setIsCreateModalOpen(false);
        setNewCanvasName('');
        navigate(`/canvas/${data.canvas.id}`);
      } else {
        alert(data.error || 'Failed to create canvas');
      }
    } catch (err) {
      console.error('Error creating canvas:', err);
      alert('Failed to create canvas');
    }
    setCreating(false);
  };

  // ── Card renderer ──────────────────────────────────────────────────
  const renderCanvasCard = (canvas) => (
    <Card
      isClickable
      isSelectable
      onClick={() => handleCanvasClick(canvas)}
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
      {/* Canvas Preview Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: canvas.hasHero ? '#0f1214' : 'linear-gradient(135deg, #0f1214 0%, #1a2332 50%, #0f1214 100%)',
          borderRadius: '4px 4px 0 0',
          overflow: 'hidden'
        }}
      >
        {canvas.hasHero ? (
          <img
            src={`/api/canvas/${canvas.id}/hero`}
            alt={canvas.title}
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <>
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />
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
                <TopologyIcon style={{ fontSize: '28px', color: '#0066CC' }} />
              </div>
            </div>
          </>
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
          {canvas.nodeCount} nodes &bull; {canvas.edgeCount} edges
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
              {canvas.title}
            </h3>
          </FlexItem>

          {canvas.description && (
            <FlexItem>
              <p style={{
                margin: 0, fontSize: '0.875rem',
                color: 'var(--pf-v6-global--Color--200)',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>
                {canvas.description}
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
              {formatDate(canvas.modifiedAt)}
            </span>
          </FlexItem>

          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              {canvas.shared && (
                <FlexItem>
                  <Label color="purple" isCompact icon={<CodeBranchIcon />}>
                    {canvas.repoName || 'Shared'}
                  </Label>
                </FlexItem>
              )}
              <FlexItem>
                <Label color="blue" isCompact>JSON Canvas</Label>
              </FlexItem>
            </Flex>
          </FlexItem>

          <FlexItem>
            <div style={{ borderTop: '1px solid var(--pf-v6-global--BorderColor--100)', paddingTop: '0.5rem' }}>
              {canvas.shared ? (
                <Button variant="link" isSmall icon={<UndoIcon />}
                  onClick={(e) => { e.stopPropagation(); setUnshareTarget({ id: canvas.id, title: canvas.title, repoId: canvas.repoId, repoName: canvas.repoName }); }}>
                  Unshare
                </Button>
              ) : (
                <Button variant="link" isSmall icon={<ShareAltIcon />}
                  onClick={(e) => { e.stopPropagation(); setShareTarget({ id: canvas.id, title: canvas.title }); }}>
                  Share
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
                src={`/api/canvas/${item.id}/hero`}
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
                background: 'linear-gradient(135deg, #0f1214 0%, #1a2332 50%, #0f1214 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <TopologyIcon style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }} />
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
      key: 'nodes',
      label: 'Nodes / Edges',
      width: 15,
      render: (item) => (
        <span>{item.nodeCount} / {item.edgeCount}</span>
      )
    },
    {
      key: 'modifiedAt',
      label: 'Modified',
      width: 20,
      render: (item) => formatDate(item.modifiedAt)
    },
    {
      key: 'status',
      label: 'Status',
      width: 15,
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
          {item.shared && (
            <FlexItem>
              <Label color="purple" isCompact icon={<CodeBranchIcon />}>Shared</Label>
            </FlexItem>
          )}
          <FlexItem>
            <Label color="blue" isCompact>JSON Canvas</Label>
          </FlexItem>
        </Flex>
      )
    }
  ];

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading canvases...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <TopologyIcon size="xl" />
          <Title headingLevel="h2" size="lg">Error Loading Canvases</Title>
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
            <Title headingLevel="h1" size="2xl">Canvas</Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Visual node-based diagrams and mind maps
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Badge isRead>{canvases.length} canvases</Badge>
              </FlexItem>
              <FlexItem>
                <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setIsCreateModalOpen(true)}>
                  New Canvas
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Collection content with card/list toggle */}
      <CollectionLayout
        storageKey="canvas"
        items={canvases}
        renderCard={renderCanvasCard}
        columns={tableColumns}
        onItemClick={handleCanvasClick}
        emptyState={
          <EmptyState variant="lg">
            <TopologyIcon size="xl" />
            <Title headingLevel="h2" size="lg">No Canvases Found</Title>
            <EmptyStateBody>
              Create your first canvas to get started. Canvases are stored in the data/canvas folder.
            </EmptyStateBody>
            <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setIsCreateModalOpen(true)}>
              Create Canvas
            </Button>
          </EmptyState>
        }
      />

      {/* Create Modal */}
      <Modal
        variant={ModalVariant.small}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        aria-labelledby="create-canvas-modal-title"
      >
        <ModalHeader title="Create New Canvas" labelId="create-canvas-modal-title" />
        <ModalBody>
          <Form id="create-canvas-form">
            <FormGroup label="Name" isRequired fieldId="canvas-name">
              <TextInput
                isRequired
                id="canvas-name"
                value={newCanvasName}
                onChange={(e, value) => setNewCanvasName(value)}
                placeholder="My Canvas"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCanvasName.trim()) {
                    e.preventDefault();
                    handleCreateCanvas();
                  }
                }}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button key="create" variant="primary" onClick={handleCreateCanvas} isLoading={creating} isDisabled={!newCanvasName.trim() || creating}>
            Create
          </Button>
          <Button key="cancel" variant="link" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      <ShareArtifactModal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        artifactType="canvas"
        artifactId={shareTarget?.id}
        artifactName={shareTarget?.title}
        onShareComplete={() => fetchCanvases()}
      />
      <UnshareArtifactModal
        isOpen={!!unshareTarget}
        onClose={() => setUnshareTarget(null)}
        artifactType="canvas"
        artifactId={unshareTarget?.id}
        artifactName={unshareTarget?.title}
        repoId={unshareTarget?.repoId}
        repoName={unshareTarget?.repoName}
        onUnshareComplete={() => fetchCanvases()}
      />
    </div>
  );
};

export default Canvas;
