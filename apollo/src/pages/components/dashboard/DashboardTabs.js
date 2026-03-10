import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  TextInput,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Flex,
  FlexItem,
  Tooltip
} from '@patternfly/react-core';
import {
  PlusIcon,
  EllipsisVIcon,
  PencilAltIcon,
  TrashIcon,
  CopyIcon
} from '@patternfly/react-icons';

/**
 * DashboardTabs - Tab bar for switching between dashboards
 * 
 * Includes create, rename, duplicate, and delete functionality.
 */
const DashboardTabs = ({
  dashboards,
  activeTabId,
  onSelectTab,
  onCreateDashboard,
  onRenameDashboard,
  onDeleteDashboard,
  onDuplicateDashboard
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [targetDashboardId, setTargetDashboardId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Create dashboard
  const handleOpenCreate = () => {
    setNewName('');
    setIsCreateModalOpen(true);
  };

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateDashboard(newName.trim());
      setIsCreateModalOpen(false);
      setNewName('');
    }
  };

  // Rename dashboard
  const handleOpenRename = (dashboardId) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    setTargetDashboardId(dashboardId);
    setNewName(dashboard?.name || '');
    setMenuOpenId(null);
    setIsRenameModalOpen(true);
  };

  const handleRename = () => {
    if (newName.trim() && targetDashboardId) {
      onRenameDashboard(targetDashboardId, newName.trim());
      setIsRenameModalOpen(false);
      setNewName('');
      setTargetDashboardId(null);
    }
  };

  // Delete dashboard
  const handleOpenDelete = (dashboardId) => {
    setTargetDashboardId(dashboardId);
    setMenuOpenId(null);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (targetDashboardId) {
      onDeleteDashboard(targetDashboardId);
      setIsDeleteModalOpen(false);
      setTargetDashboardId(null);
    }
  };

  // Duplicate dashboard
  const handleDuplicate = (dashboardId) => {
    setMenuOpenId(null);
    onDuplicateDashboard(dashboardId);
  };

  const handleTabSelect = (event, tabId) => {
    onSelectTab(tabId);
  };

  return (
    <>
      <Flex alignItems={{ default: 'alignItemsCenter' }} className="dashboard-tabs-container">
        <FlexItem grow={{ default: 'grow' }}>
          <Tabs
            activeKey={activeTabId}
            onSelect={handleTabSelect}
            aria-label="Dashboard tabs"
            role="region"
            className="dashboard-tabs"
          >
            {dashboards.map(dashboard => (
              <Tab
                key={dashboard.id}
                eventKey={dashboard.id}
                title={
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    <FlexItem>
                      <TabTitleText>{dashboard.name}</TabTitleText>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                        isOpen={menuOpenId === dashboard.id}
                        onSelect={() => setMenuOpenId(null)}
                        onOpenChange={(isOpen) => setMenuOpenId(isOpen ? dashboard.id : null)}
                        toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === dashboard.id ? null : dashboard.id);
                            }}
                            isExpanded={menuOpenId === dashboard.id}
                            className="dashboard-tab-menu-toggle"
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                        popperProps={{ position: 'right' }}
                      >
                        <DropdownList>
                          <DropdownItem
                            key="rename"
                            icon={<PencilAltIcon />}
                            onClick={() => handleOpenRename(dashboard.id)}
                          >
                            Rename
                          </DropdownItem>
                          <DropdownItem
                            key="duplicate"
                            icon={<CopyIcon />}
                            onClick={() => handleDuplicate(dashboard.id)}
                          >
                            Duplicate
                          </DropdownItem>
                          {dashboards.length > 1 && (
                            <DropdownItem
                              key="delete"
                              icon={<TrashIcon />}
                              onClick={() => handleOpenDelete(dashboard.id)}
                              isDanger
                            >
                              Delete
                            </DropdownItem>
                          )}
                        </DropdownList>
                      </Dropdown>
                    </FlexItem>
                  </Flex>
                }
              />
            ))}
          </Tabs>
        </FlexItem>
        <FlexItem>
          <Tooltip content="Create new dashboard">
            <Button
              variant="plain"
              onClick={handleOpenCreate}
              aria-label="Create new dashboard"
              icon={<PlusIcon />}
            />
          </Tooltip>
        </FlexItem>
      </Flex>

      {/* Create Dashboard Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        variant="small"
      >
        <ModalHeader title="Create Dashboard" />
        <ModalBody>
          <TextInput
            value={newName}
            onChange={(event, value) => setNewName(value)}
            aria-label="Dashboard name"
            placeholder="Enter dashboard name..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleCreate} isDisabled={!newName.trim()}>
            Create
          </Button>
          <Button variant="link" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Rename Dashboard Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        variant="small"
      >
        <ModalHeader title="Rename Dashboard" />
        <ModalBody>
          <TextInput
            value={newName}
            onChange={(event, value) => setNewName(value)}
            aria-label="Dashboard name"
            placeholder="Enter new name..."
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleRename} isDisabled={!newName.trim()}>
            Rename
          </Button>
          <Button variant="link" onClick={() => setIsRenameModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Dashboard Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        variant="small"
      >
        <ModalHeader title="Delete Dashboard" />
        <ModalBody>
          Are you sure you want to delete this dashboard? This action cannot be undone.
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="link" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DashboardTabs;
