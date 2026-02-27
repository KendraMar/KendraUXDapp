import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Checkbox,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  Modal,
  ModalVariant,
  PageSection,
  Pagination,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { EllipsisVIcon, ExternalLinkAltIcon, FilterIcon, UserCheckIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

interface UserAssignment {
  id: string;
  name: string;
  email: string;
  group: string;
  dateAssigned: string;
  status: 'Active' | 'Inactive';
}

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

const AlertOverriderRole: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const [searchValue, setSearchValue] = React.useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = React.useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState('All statuses');
  const [isGrantRoleModalOpen, setIsGrantRoleModalOpen] = React.useState(false);
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');

  // Mock data for users with this role (now mutable state)
  const [allUserData, setAllUserData] = React.useState<UserAssignment[]>(() => {
    const users: UserAssignment[] = [
      {
        id: 'user-1',
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        group: 'IT Administrators',
        dateAssigned: '15 Oct 2024',
        status: 'Active'
      },
      {
        id: 'user-2', 
        name: 'Michael Rodriguez',
        email: 'michael.rodriguez@example.com',
        group: 'DevOps Team',
        dateAssigned: '12 Oct 2024',
        status: 'Active'
      },
      {
        id: 'user-3',
        name: 'Emily Johnson',
        email: 'emily.johnson@example.com',
        group: 'System Administrators',
        dateAssigned: '8 Oct 2024',
        status: 'Active'
      },
      {
        id: 'user-4',
        name: 'David Park',
        email: 'david.park@example.com',
        group: 'Security Team',
        dateAssigned: '5 Oct 2024',
        status: 'Inactive'
      },
      {
        id: 'user-5',
        name: 'Lisa Thompson',
        email: 'lisa.thompson@example.com',
        group: 'Platform Team',
        dateAssigned: '2 Oct 2024',
        status: 'Active'
      }
    ];
    return users.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Mock data for groups
  const allGroupsData: Group[] = React.useMemo(() => {
    const groups: Group[] = [
      {
        id: 'group-1',
        name: 'smaht-people',
        description: 'Advanced users with elevated system privileges',
        memberCount: 12
      },
      {
        id: 'group-2',
        name: 'baby-users',
        description: 'New users requiring basic access permissions',
        memberCount: 8
      },
      {
        id: 'group-3',
        name: 'data-wizards',
        description: 'Analytics and data management specialists',
        memberCount: 15
      },
      {
        id: 'group-4',
        name: 'security-ninjas',
        description: 'Information security and compliance team',
        memberCount: 7
      },
      {
        id: 'group-5',
        name: 'dev-ops-heroes',
        description: 'DevOps and infrastructure management team',
        memberCount: 18
      },
      {
        id: 'group-6',
        name: 'product-masters',
        description: 'Product managers and business analysts',
        memberCount: 9
      },
      {
        id: 'group-7',
        name: 'cloud-architects',
        description: 'Cloud platform design and architecture team',
        memberCount: 6
      },
      {
        id: 'group-8',
        name: 'qa-guardians',
        description: 'Quality assurance and testing specialists',
        memberCount: 11
      }
    ];
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter data based on search and status
  const filteredUserData = React.useMemo(() => {
    return allUserData.filter(user => {
      const matchesSearch = !searchValue.trim() || 
        user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.email.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.group.toLowerCase().includes(searchValue.toLowerCase());
      
      const matchesStatus = selectedStatus === 'All statuses' || user.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [allUserData, searchValue, selectedStatus]);

  // Get paginated data
  const paginatedData = React.useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredUserData.slice(startIndex, endIndex);
  }, [filteredUserData, page, perPage]);

  // Event handlers
  const handleSelectAll = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedData.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1); // Reset to first page when searching
  };

  const onSetPage = (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const onPerPageSelect = (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const handleGrantRole = () => {
    setIsGrantRoleModalOpen(true);
  };

  const handleModalClose = () => {
    setIsGrantRoleModalOpen(false);
    setSelectedGroups([]);
  };

  const handleGroupSelect = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, groupId]);
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleSelectAllGroups = (checked: boolean) => {
    if (checked) {
      setSelectedGroups(allGroupsData.map(group => group.id));
    } else {
      setSelectedGroups([]);
    }
  };

  // Helper function to generate mock users for selected groups
  const generateUsersForGroups = (groupIds: string[]): UserAssignment[] => {
    const mockNames = [
      'Alex Johnson', 'Jordan Smith', 'Taylor Brown', 'Casey Davis', 'Riley Wilson',
      'Morgan Garcia', 'Avery Miller', 'Quinn Anderson', 'Sage Martinez', 'River Thompson',
      'Dakota Lee', 'Phoenix White', 'Rowan Harris', 'Skyler Clark', 'Cameron Lewis',
      'Drew Walker', 'Emery Hall', 'Finley Young', 'Harper King', 'Indigo Scott'
    ];
    
    const newUsers: UserAssignment[] = [];
    let nameIndex = 0;
    
    groupIds.forEach(groupId => {
      const group = allGroupsData.find(g => g.id === groupId);
      if (group) {
        // Generate 1-3 random users per group
        const userCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < userCount; i++) {
          if (nameIndex < mockNames.length) {
            const name = mockNames[nameIndex];
            const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
            const currentDate = new Date();
            const dateAssigned = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getFullYear()}`;
            
            newUsers.push({
              id: `user-new-${Date.now()}-${nameIndex}`,
              name: name,
              email: email,
              group: group.name,
              dateAssigned: dateAssigned,
              status: 'Active'
            });
            
            nameIndex++;
          }
        }
      }
    });
    
    return newUsers;
  };

  const handleConfirmGrantRole = () => {
    const newUsers = generateUsersForGroups(selectedGroups);
    const selectedGroupNames = allGroupsData
      .filter(group => selectedGroups.includes(group.id))
      .map(group => group.name);
    
    // Add new users to the existing data
    setAllUserData(prevData => {
      const combinedUsers = [...prevData, ...newUsers];
      return combinedUsers.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Show success message
    const groupText = selectedGroups.length === 1 ? 'group' : 'groups';
    const userText = newUsers.length === 1 ? 'user' : 'users';
    setSuccessMessage(
      `Successfully granted Alert overrider role to ${selectedGroups.length} ${groupText} (${selectedGroupNames.join(', ')}). Added ${newUsers.length} ${userText} to the role.`
    );
    setShowSuccessAlert(true);
    
    console.log(`Granted Alert overrider role to ${selectedGroups.length} groups, adding ${newUsers.length} new users`);
    
    setIsGrantRoleModalOpen(false);
    setSelectedGroups([]);
  };

  return (
    <>
      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert
          variant="success"
          title="Role granted successfully"
          actionClose={
            <AlertActionCloseButton onClose={() => setShowSuccessAlert(false)} />
          }
          style={{ margin: '24px' }}
        >
          {successMessage}
        </Alert>
      )}
      
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>IAM</BreadcrumbItem>
          <BreadcrumbItem 
            onClick={() => navigate('/user-access')}
            style={{ cursor: 'pointer' }}
          >
            User Access
          </BreadcrumbItem>
          <BreadcrumbItem 
            onClick={() => navigate('/roles')}
            style={{ cursor: 'pointer' }}
          >
            Roles
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Alert overrider</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <UserCheckIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Alert overrider</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Users and groups with this role can override workspace default alert settings.</p>
              </Content>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>
      
      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Card>
          <CardBody style={{ padding: 0 }}>
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search users..."
                    value={searchValue}
                    onChange={(event, value) => handleSearchChange(value)}
                    onClear={() => handleSearchChange('')}
                    style={{ minWidth: '250px' }}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Dropdown
                    isOpen={isStatusFilterOpen}
                    onSelect={(event, value) => {
                      setSelectedStatus(value as string);
                      setIsStatusFilterOpen(false);
                      setPage(1);
                    }}
                    onOpenChange={setIsStatusFilterOpen}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                        isExpanded={isStatusFilterOpen}
                        icon={<FilterIcon />}
                      >
                        {selectedStatus}
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <DropdownList>
                      <DropdownItem value="All statuses">All statuses</DropdownItem>
                      <DropdownItem value="Active">Active</DropdownItem>
                      <DropdownItem value="Inactive">Inactive</DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" onClick={handleGrantRole}>
                    Grant role to group
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Dropdown
                    isOpen={isActionsMenuOpen}
                    onSelect={() => setIsActionsMenuOpen(false)}
                    onOpenChange={setIsActionsMenuOpen}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                        isExpanded={isActionsMenuOpen}
                        variant="plain"
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <DropdownList>
                      <DropdownItem>Export assignments</DropdownItem>
                      <DropdownItem>Import assignments</DropdownItem>
                      <DropdownItem>Bulk actions</DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
                <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                  <Pagination
                    itemCount={filteredUserData.length}
                    widgetId="pagination-options-menu-top"
                    perPage={perPage}
                    page={page}
                    variant="top"
                    onSetPage={onSetPage}
                    onPerPageSelect={onPerPageSelect}
                    isCompact
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            
            <Table>
              <Thead>
                <Tr>
                  <Th width={10}>
                    <Checkbox
                      id="select-all"
                      isChecked={selectedUsers.length === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      aria-label="Select all users"
                    />
                  </Th>
                  <Th width={25}>Name</Th>
                  <Th width={30}>Email</Th>
                  <Th width={20}>Group</Th>
                  <Th width={15}>Date assigned</Th>
                  <Th width={10}>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedData.map(user => (
                  <Tr key={user.id}>
                    <Td>
                      <Checkbox
                        id={`select-${user.id}`}
                        isChecked={selectedUsers.includes(user.id)}
                        onChange={(event, checked) => handleUserSelect(user.id, checked)}
                        aria-label={`Select ${user.name}`}
                      />
                    </Td>
                    <Td>{user.name}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.group}</Td>
                    <Td>{user.dateAssigned}</Td>
                    <Td>
                      <Label color={user.status === 'Active' ? 'green' : 'grey'}>
                        {user.status}
                      </Label>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            <div style={{ padding: '16px 24px' }}>
              <Pagination
                itemCount={filteredUserData.length}
                widgetId="pagination-options-menu-bottom"
                perPage={perPage}
                page={page}
                variant="bottom"
                onSetPage={onSetPage}
                onPerPageSelect={onPerPageSelect}
              />
            </div>
          </CardBody>
        </Card>
      </PageSection>

      {/* Grant Role to Groups Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Grant Alert overrider role to groups"
        isOpen={isGrantRoleModalOpen}
        onClose={handleModalClose}
        aria-describedby="grant-role-modal-description"
      >
        <div id="grant-role-modal-description" style={{ marginBottom: '16px' }}>
          Select groups to grant the Alert overrider role. Members of selected groups will be able to override workspace default alert settings.
        </div>
        
        <Table>
          <Thead>
            <Tr>
              <Th width={10}>
                <Checkbox
                  id="select-all-groups"
                  isChecked={selectedGroups.length === allGroupsData.length && allGroupsData.length > 0}
                  onChange={(event, checked) => handleSelectAllGroups(checked)}
                  aria-label="Select all groups"
                />
              </Th>
              <Th width={30}>Group name</Th>
              <Th width={45}>Description</Th>
              <Th width={15}>Members</Th>
            </Tr>
          </Thead>
          <Tbody>
            {allGroupsData.map(group => (
              <Tr key={group.id}>
                <Td>
                  <Checkbox
                    id={`select-group-${group.id}`}
                    isChecked={selectedGroups.includes(group.id)}
                    onChange={(event, checked) => handleGroupSelect(group.id, checked)}
                    aria-label={`Select ${group.name}`}
                  />
                </Td>
                <Td>{group.name}</Td>
                <Td>{group.description}</Td>
                <Td>{group.memberCount}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmGrantRole}
            isDisabled={selectedGroups.length === 0}
          >
            Grant role to {selectedGroups.length} {selectedGroups.length === 1 ? 'group' : 'groups'}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export { AlertOverriderRole };
