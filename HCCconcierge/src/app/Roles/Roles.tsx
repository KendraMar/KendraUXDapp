import * as React from 'react';
import {
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
  MenuToggle,
  PageSection,
  Pagination,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { BellIcon, EllipsisVIcon, ExternalLinkAltIcon, UserCheckIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

interface RoleData {
  id: string;
  name: string;
  description: string;
  groups: number;
  permissions: number;
  lastModified: string;
}

const Roles: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [searchValue, setSearchValue] = React.useState('');
  const [isEllipsisMenuOpen, setIsEllipsisMenuOpen] = React.useState(false);

  // Real roles data
  const allRoles: RoleData[] = React.useMemo(() => {
    const roles: RoleData[] = [
      {
        id: 'ansible-lightspeed-admin',
        name: 'Ansible Lightspeed administrator',
        description: 'Perform read operations for Organization Administrators on all Lightspeed charts.',
        groups: 1,
        permissions: 4,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'automation-analytics-admin',
        name: 'Automation Analytics administrator',
        description: 'Perform any available operation on Automation Analytics resources.',
        groups: 0,
        permissions: 1,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'automation-analytics-editor',
        name: 'Automation Analytics editor',
        description: 'Perform read and update operations on Automation Analytics resources.',
        groups: 1,
        permissions: 2,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'automation-analytics-viewer',
        name: 'Automation Analytics viewer',
        description: 'Perform read operations on Automation Analytics resources.',
        groups: 0,
        permissions: 1,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'cloud-administrator',
        name: 'Cloud administrator',
        description: 'Perform any available operation on any source.',
        groups: 1,
        permissions: 1,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'compliance-administrator',
        name: 'Compliance administrator',
        description: 'Perform any available operation on Compliance resources.',
        groups: 1,
        permissions: 3,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'compliance-viewer',
        name: 'Compliance viewer',
        description: 'Perform read operations on Compliance resources.',
        groups: 2,
        permissions: 4,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'content-template-administrator',
        name: 'Content Template administrator',
        description: 'Perform any available operation on any Content Template resource.',
        groups: 1,
        permissions: 3,
        lastModified: '02 Oct 2024'
      },
      {
        id: 'content-template-viewer',
        name: 'Content Template viewer',
        description: 'Perform read-only operations on Content Template resources.',
        groups: 1,
        permissions: 2,
        lastModified: '02 Oct 2024'
      },
      {
        id: 'cost-administrator',
        name: 'Cost administrator',
        description: 'Perform any available operation on cost management resources.',
        groups: 1,
        permissions: 1,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'cost-cloud-viewer',
        name: 'Cost cloud viewer',
        description: 'Perform read operations on cost reports related to cloud sources.',
        groups: 0,
        permissions: 5,
        lastModified: '19 Jun 2025'
      },
      {
        id: 'cost-openshift-viewer',
        name: 'Cost OpenShift viewer',
        description: 'Perform read operations on cost reports related to OpenShift sources.',
        groups: 0,
        permissions: 1,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'cost-price-list-administrator',
        name: 'Cost Price List administrator',
        description: 'Perform read and write operations on cost models.',
        groups: 0,
        permissions: 2,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'cost-price-list-viewer',
        name: 'Cost Price List viewer',
        description: 'Perform read operations on cost models.',
        groups: 0,
        permissions: 2,
        lastModified: '19 Sep 2024'
      },
      {
        id: 'alert-overrider',
        name: 'Alert overrider',
        description: 'Override workspace default alert settings for themselves in their personal alert preferences.',
        groups: 1,
        permissions: 2,
        lastModified: '4 Sep 2025'
      }
    ];
    return roles.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredRoles = React.useMemo(() => {
    if (!searchValue) return allRoles;
    return allRoles.filter(role => 
      role.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      role.description.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [allRoles, searchValue]);

  const paginatedRoles = React.useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filteredRoles.slice(startIndex, startIndex + perPage);
  }, [filteredRoles, page, perPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedRoles.map(role => role.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, roleId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== roleId));
    }
  };

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const onPerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1); // Reset to first page when searching
  };

  const handleCreateRole = () => {
    console.log('Create role clicked');
    // Implement create role logic here
  };

  const handleRoleClick = (roleId: string, roleName: string) => {
    if (roleId === 'alert-overrider') {
      navigate('/user-access/roles/alert-overrider');
    } else {
      // For other roles, log for now (can be implemented later)
      console.log(`Clicked on role: ${roleName}`);
    }
  };

  const handleManageAlerts = () => {
    navigate('/alert-manager?filter=Roles | IAM');
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>IAM</BreadcrumbItem>
          <BreadcrumbItem>User Access</BreadcrumbItem>
          <BreadcrumbItem isActive>Roles</BreadcrumbItem>
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
              <Title headingLevel="h1" size="2xl">Roles</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Define and manage user roles with specific permissions and access levels across your organization.</p>
                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="link"
                    isInline
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="end"
                    component="a"
                    href="https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more
                  </Button>
                  <span style={{ margin: '0 8px', color: '#6a6e73' }}>|</span>
                  <Button
                    variant="link"
                    isInline
                    icon={<BellIcon />}
                    iconPosition="start"
                    onClick={handleManageAlerts}
                  >
                    Manage alerts for Roles
                  </Button>
                </div>
              </Content>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>
      
      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Card>
          <CardBody style={{ padding: 0 }}>
            {/* Toolbar */}
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search roles..."
                    value={searchValue}
                    onChange={(event, value) => handleSearchChange(value)}
                    onClear={() => handleSearchChange('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" onClick={handleCreateRole}>
                    Create role
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Dropdown
                    isOpen={isEllipsisMenuOpen}
                    onOpenChange={(isOpen) => setIsEllipsisMenuOpen(isOpen)}
                    popperProps={{ position: 'right' }}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        aria-label="Actions"
                        variant="plain"
                        onClick={() => setIsEllipsisMenuOpen(!isEllipsisMenuOpen)}
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <DropdownList>
                      <DropdownItem>Export roles</DropdownItem>
                      <DropdownItem>Import roles</DropdownItem>
                      <DropdownItem>Bulk actions</DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
                <ToolbarItem>
                  <Pagination
                    itemCount={filteredRoles.length}
                    widgetId="roles-pagination-top"
                    perPage={perPage}
                    page={page}
                    onSetPage={onSetPage}
                    onPerPageSelect={onPerPageSelect}
                    isCompact
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            {/* Table */}
            <Table aria-label="Roles table">
              <Thead>
                <Tr>
                  <Th width={10}>
                    <Checkbox
                      id="select-all"
                      isChecked={
                        paginatedRoles.length > 0 && 
                        paginatedRoles.every(role => selectedRows.includes(role.id))
                      }
                      onChange={(event, checked) => handleSelectAll(checked)}
                      aria-label="Select all roles"
                    />
                  </Th>
                  <Th width={20}>Name</Th>
                  <Th width={35}>Description</Th>
                  <Th width={10}>Groups</Th>
                  <Th width={10}>Permissions</Th>
                  <Th width={25}>Last modified</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedRoles.map((role) => (
                  <Tr key={role.id}>
                    <Td>
                      <Checkbox
                        id={`select-${role.id}`}
                        isChecked={selectedRows.includes(role.id)}
                        onChange={(event, checked) => handleRowSelect(role.id, checked)}
                        aria-label={`Select ${role.name}`}
                      />
                    </Td>
                    <Td>
                      <Button
                        variant="link"
                        isInline
                        onClick={() => handleRoleClick(role.id, role.name)}
                        style={{ padding: 0, fontSize: 'inherit' }}
                      >
                        {role.name}
                      </Button>
                    </Td>
                    <Td>{role.description}</Td>
                    <Td>{role.groups}</Td>
                    <Td>{role.permissions}</Td>
                    <Td>{role.lastModified}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {/* Bottom Pagination */}
            <div style={{ padding: '16px' }}>
              <Pagination
                itemCount={filteredRoles.length}
                widgetId="roles-pagination-bottom"
                perPage={perPage}
                page={page}
                onSetPage={onSetPage}
                onPerPageSelect={onPerPageSelect}
              />
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export { Roles };
