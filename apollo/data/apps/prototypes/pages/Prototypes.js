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
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Alert,
  Progress,
  ProgressVariant
} from '@patternfly/react-core';
import {
  CubesIcon,
  PlusCircleIcon,
  CalendarAltIcon,
  ShareAltIcon,
  CodeBranchIcon,
  UndoIcon,
  UploadIcon,
  CodeIcon
} from '@patternfly/react-icons';
import ShareArtifactModal from '../../../../src/components/ShareArtifactModal';
import UnshareArtifactModal from '../../../../src/components/UnshareArtifactModal';
import CollectionLayout from '../../../../src/components/CollectionLayout';

const Prototypes = () => {
  const [prototypes, setPrototypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPrototypeName, setNewPrototypeName] = useState('');
  const [newPrototypeDescription, setNewPrototypeDescription] = useState('');
  const [newPrototypeUrl, setNewPrototypeUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [unshareTarget, setUnshareTarget] = useState(null);
  // Add Prototype dropdown
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRepoUrl, setImportRepoUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importBranch, setImportBranch] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importProgress, setImportProgress] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrototypes();
  }, []);

  const fetchPrototypes = async (isRefresh = false) => {
    try {
      const response = await fetch('/api/prototypes');
      const data = await response.json();
      if (data.success) {
        setPrototypes(data.prototypes);
        // If items are missing heroes and we triggered generation, re-fetch to pick them up
        if (!isRefresh && data.prototypes.some(p => !p.hasHero && !p.shared)) {
          // Trigger hero generation for prototypes with local embed URLs
          const missing = data.prototypes.filter(p => !p.hasHero && !p.shared);
          if (missing.length > 0) {
            Promise.allSettled(
              missing.map(p =>
                fetch(`/api/prototypes/${p.id}/hero/generate`, { method: 'POST' })
              )
            ).then(() => {
              setTimeout(() => fetchPrototypes(true), 2000);
            });
          }
        }
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prototypes:', err);
      setError('Failed to load prototypes');
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

  const handlePrototypeClick = (prototype) => {
    navigate(`/prototypes/${prototype.id}`);
  };

  const handleCreatePrototype = async () => {
    if (!newPrototypeName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/prototypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newPrototypeName,
          description: newPrototypeDescription,
          embedUrl: newPrototypeUrl || 'http://localhost:1225'
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setPrototypes([data.prototype, ...prototypes]);
        setIsCreateModalOpen(false);
        setNewPrototypeName('');
        setNewPrototypeDescription('');
        setNewPrototypeUrl('');
        navigate(`/prototypes/${data.prototype.id}`);
      } else {
        alert(data.error || 'Failed to create prototype');
      }
    } catch (err) {
      console.error('Error creating prototype:', err);
      alert('Failed to create prototype');
    }
    setCreating(false);
  };

  const handleImportPrototype = async () => {
    if (!importRepoUrl.trim()) return;

    setImporting(true);
    setImportError(null);
    setImportProgress('Cloning repository...');

    try {
      const response = await fetch('/api/prototypes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryUrl: importRepoUrl.trim(),
          name: importName.trim() || undefined,
          description: importDescription.trim() || undefined,
          branch: importBranch.trim() || undefined
        })
      });
      const data = await response.json();

      if (data.success) {
        setImportProgress('Import complete!');
        setPrototypes([data.prototype, ...prototypes]);
        // Brief delay to show success
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportRepoUrl('');
          setImportName('');
          setImportDescription('');
          setImportBranch('');
          setImportProgress('');
          navigate(`/prototypes/${data.prototype.id}`);
        }, 500);
      } else {
        setImportError(data.error || 'Failed to import prototype');
        setImportProgress('');
      }
    } catch (err) {
      console.error('Error importing prototype:', err);
      setImportError('Failed to import prototype. Check the repository URL and try again.');
      setImportProgress('');
    }
    setImporting(false);
  };

  const resetImportModal = () => {
    setIsImportModalOpen(false);
    setImportRepoUrl('');
    setImportName('');
    setImportDescription('');
    setImportBranch('');
    setImportError(null);
    setImportProgress('');
  };

  // ── Card renderer ──────────────────────────────────────────────────
  const renderPrototypeCard = (prototype) => (
    <Card
      isClickable
      isSelectable
      onClick={() => handlePrototypeClick(prototype)}
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
      {/* Prototype Preview Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: prototype.hasHero ? '#1a1d21' : 'linear-gradient(135deg, #1a1d21 0%, #0066cc 50%, #1a1d21 100%)',
          borderRadius: '4px 4px 0 0',
          overflow: 'hidden'
        }}
      >
        {prototype.hasHero ? (
          <img
            src={`/api/prototypes/${prototype.id}/hero`}
            alt={prototype.name}
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
                  linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
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
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CubesIcon style={{ fontSize: '28px', color: '#0066CC' }} />
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
          {prototype.product?.label} &bull; {prototype.release?.label}
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
              {prototype.name}
            </h3>
          </FlexItem>

          {prototype.description && (
            <FlexItem>
              <p style={{
                margin: 0, fontSize: '0.875rem',
                color: 'var(--pf-v6-global--Color--200)',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>
                {prototype.description}
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
              {formatDate(prototype.modifiedAt)}
            </span>
          </FlexItem>

          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              {prototype.imported && (
                <FlexItem>
                  <Label color="cyan" isCompact icon={<UploadIcon />}>
                    Imported
                  </Label>
                </FlexItem>
              )}
              {prototype.shared && (
                <FlexItem>
                  <Label color="purple" isCompact icon={<CodeBranchIcon />}>
                    {prototype.repoName || 'Shared'}
                  </Label>
                </FlexItem>
              )}
              <FlexItem>
                <Label color="blue" isCompact>{prototype.product?.label || 'Prototype'}</Label>
              </FlexItem>
              <FlexItem>
                <Label color="grey" isCompact>v{prototype.release?.label || '1.0'}</Label>
              </FlexItem>
            </Flex>
          </FlexItem>

          <FlexItem>
            <div style={{ borderTop: '1px solid var(--pf-v6-global--BorderColor--100)', paddingTop: '0.5rem' }}>
              {prototype.shared ? (
                <Button variant="link" isSmall icon={<UndoIcon />}
                  onClick={(e) => { e.stopPropagation(); setUnshareTarget({ id: prototype.id, title: prototype.name, repoId: prototype.repoId, repoName: prototype.repoName }); }}>
                  Unshare
                </Button>
              ) : (
                <Button variant="link" isSmall icon={<ShareAltIcon />}
                  onClick={(e) => { e.stopPropagation(); setShareTarget({ id: prototype.id, title: prototype.name }); }}>
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
      key: 'name',
      label: 'Name',
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            {item.hasHero ? (
              <img
                src={`/api/prototypes/${item.id}/hero`}
                alt={item.name}
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
                background: 'linear-gradient(135deg, #1a1d21 0%, #0066cc 50%, #1a1d21 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CubesIcon style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }} />
              </div>
            )}
          </FlexItem>
          <FlexItem>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
              <FlexItem><strong>{item.name}</strong></FlexItem>
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
      key: 'product',
      label: 'Product',
      width: 15,
      render: (item) => (
        <Label color="blue" isCompact>{item.product?.label || 'Prototype'}</Label>
      )
    },
    {
      key: 'release',
      label: 'Release',
      width: 12,
      render: (item) => `v${item.release?.label || '1.0'}`
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
          <EmptyStateBody>Loading prototypes...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <CubesIcon size="xl" />
          <Title headingLevel="h2" size="lg">Error Loading Prototypes</Title>
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
            <Title headingLevel="h1" size="2xl">Prototypes</Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Interactive prototypes for product design and development
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Badge isRead>{prototypes.length} prototypes</Badge>
              </FlexItem>
              <FlexItem>
                <Dropdown
                  isOpen={isAddDropdownOpen}
                  onOpenChange={(isOpen) => setIsAddDropdownOpen(isOpen)}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                      isExpanded={isAddDropdownOpen}
                      variant="primary"
                      icon={<PlusCircleIcon />}
                    >
                      Add Prototype
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="create-new"
                      icon={<CodeIcon />}
                      onClick={() => {
                        setIsAddDropdownOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                      description="Start from scratch"
                    >
                      Create New
                    </DropdownItem>
                    <DropdownItem
                      key="import-existing"
                      icon={<UploadIcon />}
                      onClick={() => {
                        setIsAddDropdownOpen(false);
                        setIsImportModalOpen(true);
                      }}
                      description="Clone from a Git repository"
                    >
                      Import Existing
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Collection content with card/list toggle */}
      <CollectionLayout
        storageKey="prototypes"
        items={prototypes}
        renderCard={renderPrototypeCard}
        columns={tableColumns}
        onItemClick={handlePrototypeClick}
        emptyState={
          <EmptyState variant="lg">
            <CubesIcon size="xl" />
            <Title headingLevel="h2" size="lg">No Prototypes Found</Title>
            <EmptyStateBody>
              Create a new prototype or import an existing one from a Git repository.
            </EmptyStateBody>
            <Flex spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Button variant="primary" icon={<PlusCircleIcon />} onClick={() => setIsCreateModalOpen(true)}>
                  Create New
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="secondary" icon={<UploadIcon />} onClick={() => setIsImportModalOpen(true)}>
                  Import Existing
                </Button>
              </FlexItem>
            </Flex>
          </EmptyState>
        }
      />

      {/* Create Modal */}
      <Modal
        variant={ModalVariant.medium}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        aria-labelledby="create-prototype-modal-title"
      >
        <ModalHeader title="Create New Prototype" labelId="create-prototype-modal-title" />
        <ModalBody>
          <Form id="create-prototype-form">
            <FormGroup label="Name" isRequired fieldId="prototype-name">
              <TextInput
                isRequired
                id="prototype-name"
                value={newPrototypeName}
                onChange={(e, value) => setNewPrototypeName(value)}
                placeholder="e.g., OpenShift AI 3.1"
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="prototype-description">
              <TextArea
                id="prototype-description"
                value={newPrototypeDescription}
                onChange={(e, value) => setNewPrototypeDescription(value)}
                placeholder="Brief description of the prototype"
                rows={3}
              />
            </FormGroup>
            <FormGroup
              label="Embed URL"
              fieldId="prototype-url"
              helperText="The URL where the prototype is hosted (e.g., http://localhost:1225)"
            >
              <TextInput
                id="prototype-url"
                value={newPrototypeUrl}
                onChange={(e, value) => setNewPrototypeUrl(value)}
                placeholder="http://localhost:1225"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button key="create" variant="primary" onClick={handleCreatePrototype} isLoading={creating} isDisabled={!newPrototypeName.trim() || creating}>
            Create
          </Button>
          <Button key="cancel" variant="link" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* Import Modal */}
      <Modal
        variant={ModalVariant.medium}
        isOpen={isImportModalOpen}
        onClose={resetImportModal}
        aria-labelledby="import-prototype-modal-title"
      >
        <ModalHeader title="Import Existing Prototype" labelId="import-prototype-modal-title" description="Clone a prototype from an existing Git repository. The build artifacts will be generated automatically if a build script is detected." />
        <ModalBody>
          <Form id="import-prototype-form">
            <FormGroup label="Git Repository URL" isRequired fieldId="import-repo-url">
              <TextInput
                isRequired
                id="import-repo-url"
                value={importRepoUrl}
                onChange={(e, value) => setImportRepoUrl(value)}
                placeholder="https://gitlab.example.com/team/my-prototype.git"
                isDisabled={importing}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>HTTPS or SSH URL of the Git repository to clone</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
            <FormGroup label="Name" fieldId="import-name">
              <TextInput
                id="import-name"
                value={importName}
                onChange={(e, value) => setImportName(value)}
                placeholder="Auto-derived from repository name"
                isDisabled={importing}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Leave blank to use the repository name</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
            <FormGroup label="Description" fieldId="import-description">
              <TextArea
                id="import-description"
                value={importDescription}
                onChange={(e, value) => setImportDescription(value)}
                placeholder="Brief description of the prototype"
                rows={2}
                isDisabled={importing}
              />
            </FormGroup>
            <FormGroup label="Branch" fieldId="import-branch">
              <TextInput
                id="import-branch"
                value={importBranch}
                onChange={(e, value) => setImportBranch(value)}
                placeholder="main (default)"
                isDisabled={importing}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Leave blank to use the default branch</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            {importProgress && (
              <div style={{ marginTop: '1rem' }}>
                <Progress
                  value={importing ? undefined : 100}
                  title={importProgress}
                  variant={importError ? ProgressVariant.danger : (importing ? undefined : ProgressVariant.success)}
                  measureLocation="none"
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  {importing && <Spinner size="sm" style={{ marginRight: '0.5rem' }} />}
                  {importProgress}
                </div>
              </div>
            )}

            {importError && (
              <Alert variant="danger" isInline isPlain title="Import Failed" style={{ marginTop: '1rem' }}>
                {importError}
              </Alert>
            )}
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            key="import"
            variant="primary"
            onClick={handleImportPrototype}
            isLoading={importing}
            isDisabled={!importRepoUrl.trim() || importing}
            icon={<UploadIcon />}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
          <Button key="cancel" variant="link" onClick={resetImportModal} isDisabled={importing}>Cancel</Button>
        </ModalFooter>
      </Modal>

      <ShareArtifactModal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        artifactType="prototypes"
        artifactId={shareTarget?.id}
        artifactName={shareTarget?.title}
        onShareComplete={() => fetchPrototypes()}
      />
      <UnshareArtifactModal
        isOpen={!!unshareTarget}
        onClose={() => setUnshareTarget(null)}
        artifactType="prototypes"
        artifactId={unshareTarget?.id}
        artifactName={unshareTarget?.title}
        repoId={unshareTarget?.repoId}
        repoName={unshareTarget?.repoName}
        onUnshareComplete={() => fetchPrototypes()}
      />
    </div>
  );
};

export default Prototypes;
