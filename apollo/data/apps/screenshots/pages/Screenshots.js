import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Gallery,
  GalleryItem,
  Card,
  CardBody,
  CardTitle,
  CardFooter,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle
} from '@patternfly/react-core';
import {
  CameraIcon,
  TrashIcon,
  EditIcon,
  EllipsisVIcon,
  ExternalLinkAltIcon,
  DownloadIcon
} from '@patternfly/react-icons';

const Screenshots = () => {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Kebab menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchScreenshots();
  }, []);

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/screenshots');
      if (response.ok) {
        const data = await response.json();
        setScreenshots(data.screenshots || []);
      } else {
        setError('Failed to load screenshots');
      }
    } catch (err) {
      console.error('Error fetching screenshots:', err);
      setError('Failed to load screenshots');
    } finally {
      setLoading(false);
    }
  };

  const handleViewScreenshot = (screenshot) => {
    setSelectedScreenshot(screenshot);
    setViewModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEditClick = (screenshot) => {
    setSelectedScreenshot(screenshot);
    setEditTitle(screenshot.title);
    setEditDescription(screenshot.description || '');
    setEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEditSave = async () => {
    if (!selectedScreenshot) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/screenshots/${selectedScreenshot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setScreenshots(prev => prev.map(s => 
          s.id === selectedScreenshot.id ? { ...s, ...data.screenshot } : s
        ));
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error updating screenshot:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (screenshot) => {
    setSelectedScreenshot(screenshot);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedScreenshot) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/screenshots/${selectedScreenshot.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setScreenshots(prev => prev.filter(s => s.id !== selectedScreenshot.id));
        setDeleteModalOpen(false);
        if (viewModalOpen) setViewModalOpen(false);
      }
    } catch (err) {
      console.error('Error deleting screenshot:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = (screenshot) => {
    const link = document.createElement('a');
    link.href = screenshot.imageUrl || `/api/screenshots/${screenshot.id}/image`;
    link.download = `${screenshot.title.replace(/[^a-z0-9]/gi, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpenMenuId(null);
  };

  const formatDate = (dateString) => {
    try {
      // Handle the custom format: YYYY-MM-DDTHH_MM_SS_mmm
      const normalized = dateString.replace(/_/g, ':').replace(/:(\d{3})$/, '.$1');
      const date = new Date(normalized);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1">Screenshots</Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-t--global--text--color--subtle)' }}>
          Annotated screen captures saved from across Apollo
        </p>
      </PageSection>
      
      <PageSection isFilled>
        {screenshots.length === 0 ? (
          <EmptyState 
            headingLevel="h4" 
            titleText="No screenshots yet"
            icon={CameraIcon}
          >
            <EmptyStateBody>
              Click the pencil icon in the masthead to annotate and capture any screen in Apollo.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Gallery hasGutter minWidths={{ default: '280px' }}>
            {screenshots.map((screenshot) => (
              <GalleryItem key={screenshot.id}>
                <Card isClickable isCompact className="screenshot-card">
                  <div 
                    className="screenshot-thumbnail"
                    onClick={() => handleViewScreenshot(screenshot)}
                  >
                    <img 
                      src={screenshot.thumbnailUrl || `/api/screenshots/${screenshot.id}/image`}
                      alt={screenshot.title}
                      loading="lazy"
                    />
                  </div>
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <CardTitle style={{ 
                          fontSize: '14px', 
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {screenshot.title}
                        </CardTitle>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--pf-t--global--text--color--subtle)',
                          marginTop: '4px'
                        }}>
                          {formatDate(screenshot.dateTaken)}
                        </div>
                      </div>
                      <Dropdown
                        isOpen={openMenuId === screenshot.id}
                        onOpenChange={(isOpen) => setOpenMenuId(isOpen ? screenshot.id : null)}
                        toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === screenshot.id ? null : screenshot.id);
                            }}
                            isExpanded={openMenuId === screenshot.id}
                            aria-label="Screenshot actions"
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                        popperProps={{ position: 'right' }}
                      >
                        <DropdownList>
                          <DropdownItem
                            key="view"
                            onClick={() => handleViewScreenshot(screenshot)}
                            icon={<ExternalLinkAltIcon />}
                          >
                            View
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            onClick={() => handleEditClick(screenshot)}
                            icon={<EditIcon />}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            key="download"
                            onClick={() => handleDownload(screenshot)}
                            icon={<DownloadIcon />}
                          >
                            Download
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            onClick={() => handleDeleteClick(screenshot)}
                            icon={<TrashIcon />}
                            isDanger
                          >
                            Delete
                          </DropdownItem>
                        </DropdownList>
                      </Dropdown>
                    </div>
                    {screenshot.description && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: 'var(--pf-t--global--text--color--regular)',
                        marginTop: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {screenshot.description}
                      </div>
                    )}
                  </CardBody>
                  <CardFooter style={{ 
                    fontSize: '11px', 
                    color: 'var(--pf-t--global--text--color--subtle)',
                    borderTop: '1px solid var(--pf-t--global--border--color--default)',
                    paddingTop: '8px'
                  }}>
                    {screenshot.width && screenshot.height && (
                      <span>{screenshot.width} × {screenshot.height}</span>
                    )}
                    {screenshot.fileSize && (
                      <span style={{ marginLeft: '12px' }}>{formatFileSize(screenshot.fileSize)}</span>
                    )}
                    {screenshot.annotations?.strokeCount > 0 && (
                      <span style={{ marginLeft: '12px' }}>{screenshot.annotations.strokeCount} annotation{screenshot.annotations.strokeCount !== 1 ? 's' : ''}</span>
                    )}
                  </CardFooter>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        )}
      </PageSection>
      
      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        aria-labelledby="view-screenshot-title"
        variant="large"
        className="screenshot-view-modal"
      >
        <ModalHeader title={selectedScreenshot?.title || 'Screenshot'} labelId="view-screenshot-title" />
        <ModalBody>
          {selectedScreenshot && (
            <div>
              <div className="screenshot-view-image">
                <img 
                  src={`/api/screenshots/${selectedScreenshot.id}/image`}
                  alt={selectedScreenshot.title}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
              {selectedScreenshot.description && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Description:</strong>
                  <p style={{ marginTop: '4px' }}>{selectedScreenshot.description}</p>
                </div>
              )}
              <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--pf-t--global--text--color--subtle)' }}>
                <div>Captured: {formatDate(selectedScreenshot.dateTaken)}</div>
                <div>Source: {selectedScreenshot.sourceUrl}</div>
                {selectedScreenshot.width && selectedScreenshot.height && (
                  <div>Dimensions: {selectedScreenshot.width} × {selectedScreenshot.height}</div>
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => selectedScreenshot && handleDownload(selectedScreenshot)}
            icon={<DownloadIcon />}
          >
            Download
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setViewModalOpen(false);
              handleEditClick(selectedScreenshot);
            }}
            icon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setViewModalOpen(false);
              handleDeleteClick(selectedScreenshot);
            }}
            icon={<TrashIcon />}
          >
            Delete
          </Button>
          <Button variant="link" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        aria-labelledby="edit-screenshot-title"
        variant="small"
      >
        <ModalHeader title="Edit Screenshot" labelId="edit-screenshot-title" />
        <ModalBody>
          <Form>
            <FormGroup label="Title" isRequired fieldId="edit-title">
              <TextInput
                id="edit-title"
                value={editTitle}
                onChange={(event, value) => setEditTitle(value)}
                isRequired
              />
            </FormGroup>
            <FormGroup label="Description (optional)" fieldId="edit-description">
              <TextArea
                id="edit-description"
                value={editDescription}
                onChange={(event, value) => setEditDescription(value)}
                rows={3}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            key="save"
            variant="primary"
            onClick={handleEditSave}
            isDisabled={!editTitle.trim() || isSaving}
            isLoading={isSaving}
          >
            Save
          </Button>
          <Button key="cancel" variant="link" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        aria-labelledby="delete-screenshot-title"
        variant="small"
      >
        <ModalHeader title="Delete Screenshot" labelId="delete-screenshot-title" />
        <ModalBody>
          Are you sure you want to delete "{selectedScreenshot?.title}"? This action cannot be undone.
        </ModalBody>
        <ModalFooter>
          <Button
            key="delete"
            variant="danger"
            onClick={handleDeleteConfirm}
            isLoading={isDeleting}
          >
            Delete
          </Button>
          <Button key="cancel" variant="link" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Screenshots;
