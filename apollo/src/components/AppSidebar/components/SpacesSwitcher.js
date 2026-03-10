import React, { useState } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  Divider,
  MenuToggle,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button
} from '@patternfly/react-core';
import {
  EditIcon,
  PlusCircleIcon,
  GripVerticalIcon,
  EllipsisVIcon,
  CogIcon,
  TrashIcon
} from '@patternfly/react-icons';
import { DragDropSort } from '@patternfly/react-drag-drop';
import { emojiOptions } from '../constants';

const SpacesSwitcher = ({
  isCollapsed,
  spaces,
  activeSpaceId,
  activeSpace,
  onSpaceChange,
  onSpacesUpdate,
  navigate
}) => {
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [isSpacesEditMode, setIsSpacesEditMode] = useState(false);
  const [editModeSpaces, setEditModeSpaces] = useState([]);
  const [openKebabSpaceId, setOpenKebabSpaceId] = useState(null);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [editSpaceName, setEditSpaceName] = useState('');
  const [editSpaceEmoji, setEditSpaceEmoji] = useState('📁');
  const [editSpaceDescription, setEditSpaceDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSpace, setDeletingSpace] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const setActiveSpace = async (spaceId) => {
    await onSpaceChange(spaceId);
    setIsSpaceDropdownOpen(false);
  };

  const enterSpacesEditMode = () => {
    setEditModeSpaces([...spaces]);
    setIsSpacesEditMode(true);
  };

  const cancelSpacesEditMode = () => {
    setIsSpacesEditMode(false);
    setEditModeSpaces([]);
    setIsSpaceDropdownOpen(false);
  };

  const onSpacesDrop = (event, reorderedItems) => {
    const reorderedSpaces = reorderedItems.map(item => 
      editModeSpaces.find(s => s.id === item.id)
    ).filter(Boolean);
    setEditModeSpaces(reorderedSpaces);
  };

  const saveSpacesOrder = async () => {
    const spacesToSave = editModeSpaces.length > 0 ? editModeSpaces : spaces;
    
    if (spacesToSave.length === 0) {
      setIsSpacesEditMode(false);
      setEditModeSpaces([]);
      setIsSpaceDropdownOpen(false);
      return;
    }
    
    try {
      const spaceIds = spacesToSave.map(s => s.id);
      const response = await fetch('/api/spaces/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        onSpacesUpdate(data.spaces);
      } else {
        const errorData = await response.json();
        console.error('Error saving spaces order:', errorData);
      }
    } catch (error) {
      console.error('Error saving spaces order:', error);
    } finally {
      setIsSpacesEditMode(false);
      setEditModeSpaces([]);
      setIsSpaceDropdownOpen(false);
    }
  };

  const createDraftAndNavigate = async () => {
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Space',
          emoji: '',
          description: '',
          items: []
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSpacesUpdate([...spaces, data.space]);
        setActiveSpace(data.space.id);
        navigate(`/spaces/${data.space.id}/setup`);
      }
    } catch (error) {
      console.error('Error creating draft space:', error);
    }
  };

  const openEditModal = (space) => {
    setEditingSpace(space);
    setEditSpaceName(space.name);
    setEditSpaceEmoji(space.emoji || '');
    setEditSpaceDescription(space.description || '');
    setIsEditModalOpen(true);
    setIsSpaceDropdownOpen(false);
    setOpenKebabSpaceId(null);
  };

  const resetEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSpace(null);
    setEditSpaceName('');
    setEditSpaceEmoji('📁');
    setEditSpaceDescription('');
  };

  const saveSpaceEdits = async () => {
    if (!editingSpace || !editSpaceName.trim()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/spaces/${editingSpace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editSpaceName,
          emoji: editSpaceEmoji,
          description: editSpaceDescription
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedSpaces = spaces.map(s => 
          s.id === editingSpace.id ? { ...s, ...data.space } : s
        );
        onSpacesUpdate(updatedSpaces);
        resetEditModal();
      }
    } catch (error) {
      console.error('Error saving space:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (space) => {
    setDeletingSpace(space);
    setIsDeleteModalOpen(true);
    setIsSpaceDropdownOpen(false);
    setOpenKebabSpaceId(null);
  };

  const resetDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingSpace(null);
  };

  const deleteSpace = async () => {
    if (!deletingSpace) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/spaces/${deletingSpace.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedSpaces = spaces.filter(s => s.id !== deletingSpace.id);
        onSpacesUpdate(updatedSpaces);

        // If the deleted space was active, switch to the first available space
        if (activeSpaceId === deletingSpace.id) {
          const fallbackSpace = updatedSpaces[0];
          if (fallbackSpace) {
            onSpaceChange(fallbackSpace.id);
          }
        }
        resetDeleteModal();
      } else {
        const errorData = await response.json();
        console.error('Error deleting space:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting space:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dropdown
        isOpen={isSpaceDropdownOpen}
        onOpenChange={(isOpen) => {
          setIsSpaceDropdownOpen(isOpen);
          if (!isOpen) {
            setIsSpacesEditMode(false);
            setEditModeSpaces([]);
          }
        }}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsSpaceDropdownOpen(!isSpaceDropdownOpen)}
            isExpanded={isSpaceDropdownOpen}
            variant="plainText"
            icon={activeSpace?.emoji ? <span style={{ fontSize: '18px' }}>{activeSpace.emoji}</span> : undefined}
          >
            {!isCollapsed && (activeSpace?.name || 'General')}
          </MenuToggle>
        )}
        popperProps={{ position: 'left', width: '260px' }}
      >
            {isSpacesEditMode ? (
              <div style={{ padding: '8px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: 'var(--pf-t--global--text--color--subtle)',
                  marginBottom: '8px',
                  paddingLeft: '4px'
                }}>
                  Drag to reorder spaces
                </div>
                <DragDropSort
                  items={editModeSpaces.map((space) => ({
                    id: space.id,
                    content: (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'var(--pf-t--global--background--color--primary--default)',
                        borderRadius: '6px',
                        border: '1px solid var(--pf-t--global--border--color--default)',
                        cursor: 'grab'
                      }}>
                        <GripVerticalIcon style={{ color: 'var(--pf-t--global--icon--color--subtle)' }} />
                        {space.emoji && <span style={{ fontSize: '16px' }}>{space.emoji}</span>}
                        <span style={{ flex: 1 }}>{space.name}</span>
                      </div>
                    )
                  }))}
                  onDrop={onSpacesDrop}
                  variant="DataList"
                />
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="link"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelSpacesEditMode();
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveSpacesOrder();
                    }}
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <DropdownList>
                {spaces.map((space) => (
                  <DropdownItem
                    key={space.id}
                    onClick={() => setActiveSpace(space.id)}
                    isSelected={space.id === activeSpaceId}
                    icon={space.emoji ? <span style={{ fontSize: '16px' }}>{space.emoji}</span> : undefined}
                    actions={
                      <Dropdown
                        isOpen={openKebabSpaceId === space.id}
                        onOpenChange={(isOpen) => setOpenKebabSpaceId(isOpen ? space.id : null)}
                        toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenKebabSpaceId(openKebabSpaceId === space.id ? null : space.id);
                            }}
                            isExpanded={openKebabSpaceId === space.id}
                            aria-label={`Actions for ${space.name}`}
                            style={{ padding: '4px' }}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                        popperProps={{ position: 'right' }}
                      >
                        <DropdownList>
                          <DropdownItem
                            key="edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(space);
                            }}
                            icon={<EditIcon />}
                          >
                            Edit
                          </DropdownItem>
                          {space.id !== 'default' && (
                            <>
                              <Divider component="li" />
                              <DropdownItem
                                key="delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(space);
                                }}
                                icon={<TrashIcon />}
                                style={{ color: 'var(--pf-t--global--color--status--danger--default)' }}
                              >
                                Delete
                              </DropdownItem>
                            </>
                          )}
                        </DropdownList>
                      </Dropdown>
                    }
                  >
                    {space.name}
                  </DropdownItem>
                ))}
                <Divider />
                <DropdownItem
                  key="edit-order"
                  onClick={(e) => {
                    e.stopPropagation();
                    enterSpacesEditMode();
                  }}
                  icon={<GripVerticalIcon />}
                >
                  Edit order
                </DropdownItem>
                <DropdownItem
                  key="create-new"
                  onClick={() => {
                    setIsSpaceDropdownOpen(false);
                    createDraftAndNavigate();
                  }}
                  icon={<PlusCircleIcon color="var(--pf-t--global--color--brand--default)" />}
                >
                  Create new space
                </DropdownItem>
              </DropdownList>
            )}
      </Dropdown>

      {/* Edit Space Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={resetEditModal}
        aria-labelledby="edit-space-title"
        variant="small"
      >
        <ModalHeader title="Edit space" labelId="edit-space-title" />
        <ModalBody>
          <Form>
            <FormGroup label="Name" isRequired fieldId="edit-space-name">
              <TextInput
                id="edit-space-name"
                value={editSpaceName}
                onChange={(event, value) => setEditSpaceName(value)}
                placeholder="e.g., Project Alpha"
                isRequired
              />
            </FormGroup>
            
            <FormGroup label="Emoji" fieldId="edit-space-emoji">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {emojiOptions.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={editSpaceEmoji === emoji ? 'primary' : 'secondary'}
                    onClick={() => setEditSpaceEmoji(emoji)}
                    style={{ 
                      fontSize: '18px', 
                      padding: '6px 10px',
                      minWidth: '40px'
                    }}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              <TextInput
                id="edit-space-emoji"
                value={editSpaceEmoji}
                onChange={(event, value) => setEditSpaceEmoji(value)}
                placeholder="Or enter custom emoji"
                style={{ marginTop: '8px' }}
              />
            </FormGroup>
            
            <FormGroup label="Description (optional)" fieldId="edit-space-description">
              <TextArea
                id="edit-space-description"
                value={editSpaceDescription}
                onChange={(event, value) => setEditSpaceDescription(value)}
                placeholder="Describe what you use this space for"
                rows={3}
              />
            </FormGroup>
            
            <Divider style={{ marginTop: '1.5rem', marginBottom: '1rem' }} />
            
            <div style={{ textAlign: 'center' }}>
              <Button
                variant="link"
                onClick={() => {
                  resetEditModal();
                  navigate(`/spaces/${editingSpace?.id}/configure`);
                }}
                icon={<CogIcon />}
              >
                Configure space
              </Button>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            key="save"
            variant="primary"
            onClick={saveSpaceEdits}
            isDisabled={!editSpaceName.trim() || isSaving}
            isLoading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
          <Button key="cancel" variant="link" onClick={resetEditModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Space Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={resetDeleteModal}
        aria-labelledby="delete-space-title"
        variant="small"
        titleIconVariant="warning"
      >
        <ModalHeader title="Delete space" labelId="delete-space-title" />
        <ModalBody>
          Are you sure you want to delete <strong>{deletingSpace?.emoji} {deletingSpace?.name}</strong>? This action cannot be undone and all navigation items configured for this space will be lost.
        </ModalBody>
        <ModalFooter>
          <Button
            key="delete"
            variant="danger"
            onClick={deleteSpace}
            isDisabled={isDeleting}
            isLoading={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button key="cancel" variant="link" onClick={resetDeleteModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default SpacesSwitcher;
