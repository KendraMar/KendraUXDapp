import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  PageSection,
  Title,
  TextInput,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Breadcrumb,
  BreadcrumbItem
} from '@patternfly/react-core';
import { 
  ServerIcon, 
  SearchIcon, 
  EllipsisVIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  QuestionCircleIcon,
  FilterIcon,
  ThIcon,
  ListIcon,
  StarIcon,
  DesktopIcon,
  PrintIcon
} from '@patternfly/react-icons';

const RHELSystems: React.FunctionComponent = () => {
  const [searchValue, setSearchValue] = React.useState('');
  const [isNameDropdownOpen, setIsNameDropdownOpen] = React.useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = React.useState(false);

  // Sample data based on the image
  const systemsData = [
    {
      id: 1,
      name: 'jacobsee',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.6',
      lastSeen: 'Just now'
    },
    {
      id: 2,
      name: 'rhel9-uefi-base',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.4',
      lastSeen: 'Just now'
    },
    {
      id: 3,
      name: 'John Welby Cluster',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'Not available',
      lastSeen: 'Just now'
    },
    {
      id: 4,
      name: 'ocp4-fd-test',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 8.6',
      lastSeen: 'Just now'
    },
    {
      id: 5,
      name: 'localhost.localdomain',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 8.7',
      lastSeen: 'Just now'
    },
    {
      id: 6,
      name: '133884e0-42a1-4824-8cb4-2c1ad78e3c1e',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'Not available',
      lastSeen: 'Just now'
    },
    {
      id: 7,
      name: 'i-09f6cb6bc33252ac4.us-west-2.compute.internal',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.6',
      lastSeen: 'Just now'
    },
    {
      id: 8,
      name: '3383dbc9-c548-4f9d-a055-c7798c43a898',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.4',
      lastSeen: 'Just now'
    },
    {
      id: 9,
      name: 'c516bf92-3d65-4015-a56a-83da0ccfcf75',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 8.6',
      lastSeen: 'Just now'
    },
    {
      id: 10,
      name: 'rh95-hub-bu',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 8.7',
      lastSeen: 'Just now'
    },
    {
      id: 11,
      name: 'dab10eff-ec1f-45d4-92b6-0fe1e492eaal',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'Not available',
      lastSeen: 'Just now'
    },
    {
      id: 12,
      name: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.6',
      lastSeen: 'Just now'
    },
    {
      id: 13,
      name: 'test-system-01',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.4',
      lastSeen: 'Just now'
    },
    {
      id: 14,
      name: 'prod-server-02',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 8.6',
      lastSeen: 'Just now'
    },
    {
      id: 15,
      name: 'dev-workstation-03',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 8.7',
      lastSeen: 'Just now'
    },
    {
      id: 16,
      name: 'staging-node-04',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'Not available',
      lastSeen: 'Just now'
    },
    {
      id: 17,
      name: 'backup-server-05',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.6',
      lastSeen: 'Just now'
    },
    {
      id: 18,
      name: 'monitoring-host-06',
      workspace: 'Ungrouped Hosts',
      tags: 0,
      os: 'RHEL 9.4',
      lastSeen: 'Just now'
    }
  ];

  const filteredSystemsData = systemsData.filter(system =>
    system.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    system.workspace.toLowerCase().includes(searchValue.toLowerCase()) ||
    system.os.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      {/* Breadcrumbs */}
      <PageSection variant="default" style={{ paddingBottom: '8px' }}>
        <Breadcrumb>
          <BreadcrumbItem>RHEL</BreadcrumbItem>
          <BreadcrumbItem>Inventory</BreadcrumbItem>
          <BreadcrumbItem isActive>Systems</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      {/* Global Filter */}
      <PageSection variant="default" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <Dropdown
              isOpen={false}
              onSelect={() => {}}
              onOpenChange={() => {}}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => {}}
                  isExpanded={false}
                  aria-label="Filter by tags"
                >
                  <FilterIcon /> Filter by tags <ChevronDownIcon />
                </MenuToggle>
              )}
              shouldFocusToggleOnSelect
            >
              <DropdownList>
                <DropdownItem key="filter-tags">Filter by tags</DropdownItem>
              </DropdownList>
            </Dropdown>
          </FlexItem>
          <FlexItem>
            <QuestionCircleIcon style={{ color: '#6a6e73' }} />
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Page Title */}
      <PageSection variant="default" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">Systems</Title>
              </FlexItem>
              <FlexItem>
                <QuestionCircleIcon style={{ color: '#6a6e73' }} />
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Button variant="plain" aria-label="View by desktop">
                  <DesktopIcon />
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="plain" aria-label="View by print">
                  <PrintIcon />
                </Button>
              </FlexItem>
              <FlexItem>
                <Content component="small">1-50 of 43323</Content>
              </FlexItem>
              <FlexItem>
                <Button variant="plain" aria-label="Previous page">
                  <ChevronUpIcon style={{ transform: 'rotate(90deg)' }} />
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="plain" aria-label="Next page">
                  <ChevronUpIcon style={{ transform: 'rotate(-90deg)' }} />
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="plain" aria-label="Star">
                  <StarIcon />
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Action Bar */}
      <PageSection variant="default" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Dropdown
                  isOpen={false}
                  onSelect={() => {}}
                  onOpenChange={() => {}}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => {}}
                      isExpanded={false}
                      aria-label="Select all"
                    >
                      <input type="checkbox" style={{ marginRight: '8px' }} />
                      <ChevronDownIcon />
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem key="select-all">Select all</DropdownItem>
                  </DropdownList>
                </Dropdown>
              </FlexItem>
              <FlexItem>
                <Dropdown
                  isOpen={isNameDropdownOpen}
                  onSelect={() => setIsNameDropdownOpen(false)}
                  onOpenChange={(isOpen: boolean) => setIsNameDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsNameDropdownOpen(!isNameDropdownOpen)}
                      isExpanded={isNameDropdownOpen}
                      aria-label="Filter by name"
                    >
                      Name <ChevronDownIcon />
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem key="name-filter">Filter by Name</DropdownItem>
                  </DropdownList>
                </Dropdown>
              </FlexItem>
              <FlexItem>
                <div style={{ position: 'relative' }}>
                  <TextInput
                    type="text"
                    id="filter-by-name"
                    placeholder="Filter by name"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    aria-label="Filter by name input"
                    style={{ width: '200px', paddingRight: '40px' }}
                  />
                  <SearchIcon style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666'
                  }} />
                </div>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Button variant="secondary" isDisabled>Delete</Button>
              </FlexItem>
              <FlexItem>
                <Dropdown
                  isOpen={isViewDropdownOpen}
                  onSelect={() => setIsViewDropdownOpen(false)}
                  onOpenChange={(isOpen: boolean) => setIsViewDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                      isExpanded={isViewDropdownOpen}
                      aria-label="View options"
                    >
                      <ListIcon />
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem key="list-view" icon={<ListIcon />} isDisabled>List view</DropdownItem>
                    <DropdownItem key="grid-view" icon={<ThIcon />}>Grid view</DropdownItem>
                  </DropdownList>
                </Dropdown>
              </FlexItem>
              <FlexItem>
                <Button variant="plain" aria-label="More actions">
                  <EllipsisVIcon />
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Table */}
      <PageSection>
        <Card>
          <CardBody>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d2d2d2', backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <input type="checkbox" style={{ marginRight: '8px' }} />
                        </FlexItem>
                        <FlexItem>
                          Name
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronUpIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          Workspace
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronUpIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          Tags
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronUpIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          OS
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronUpIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          Last seen
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronDownIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSystemsData.map((system) => (
                    <tr key={system.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <input type="checkbox" style={{ marginRight: '8px' }} />
                          </FlexItem>
                          <FlexItem>
                            <FolderIcon style={{ marginRight: '8px', color: '#6a6e73' }} />
                          </FlexItem>
                          <FlexItem>
                            <Button variant="link" isInline style={{ padding: '0', textAlign: 'left' }}>
                              {system.name}
                            </Button>
                          </FlexItem>
                        </Flex>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {system.workspace}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <span style={{ color: '#6a6e73' }}>🏷️</span>
                          </FlexItem>
                          <FlexItem>
                            {system.tags}
                          </FlexItem>
                        </Flex>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {system.os}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <span style={{ color: '#6a6e73' }}>⚡</span>
                          </FlexItem>
                          <FlexItem>
                            {system.lastSeen}
                          </FlexItem>
                        </Flex>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Button variant="plain" style={{ padding: '0' }}>
                          <EllipsisVIcon />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export { RHELSystems };