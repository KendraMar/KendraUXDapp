import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Label,
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
import { BellIcon, FilterIcon, OutlinedWindowRestoreIcon } from '@patternfly/react-icons';

interface AlertRow {
  eventType: string;
  service: string;
  myNotifiers: { text: string; color?: 'blue' | 'teal' | 'green' | 'orange' | 'purple' | 'red' | 'orangered' | 'grey' | 'yellow'; variant?: 'outline' };
  workspaceNotifiers: { count: number };
  onClick?: () => void;
}

const AlertManager: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize search value from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const [searchValue, setSearchValue] = React.useState<string>(searchParams.get('filter') || '');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState('All Services');

  // Helper function to get random my notifiers
  const getRandomMyNotifiers = () => {
    const options = [
      { text: 'Workspace default', color: 'purple' as const },
      { text: 'Customized from default', color: 'yellow' as const },
      { text: 'No notifiers', color: 'grey' as const, variant: 'outline' as const }
    ];
    return options[Math.floor(Math.random() * options.length)];
  };

  // Helper function to get random workspace notifier count
  const getRandomWorkspaceNotifiers = () => {
    return { count: Math.floor(Math.random() * 7) }; // 0-6
  };

  // Define all table data
  const allAlertData: AlertRow[] = [
    {
      eventType: 'Cluster Scaling',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Any vulnerability with known exploit',
      service: 'Vulnerability | RHEL',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Cluster Configuration',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Availability Status',
      service: 'Integrations | Settings',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Cluster Access',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Capacity Management',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Cluster Add-on',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Cluster Lifecycle',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Cluster Networking',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Cluster Ownership',
      service: 'Cluster Management | OpenShift',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Role deleted',
      service: 'Roles | IAM',
      myNotifiers: { text: 'Customized from default', color: 'yellow' },
      workspaceNotifiers: { count: 3 },
      onClick: () => navigate('/alert-manager/role-deleted')
    },
    {
      eventType: 'Performance degradation',
      service: 'Observability & Monitoring',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Certificate expiration',
      service: 'Security',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Database connection errors',
      service: 'System Configuration',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'API rate limit exceeded',
      service: 'System Configuration',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Service dependency failures',
      service: 'Observability & Monitoring',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Resource quota violations',
      service: 'Containers',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Machine learning model drift',
      service: 'AI/ML',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Deployment pipeline failures',
      service: 'Deploy',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    },
    {
      eventType: 'Operator lifecycle events',
      service: 'Operators',
      myNotifiers: getRandomMyNotifiers(),
      workspaceNotifiers: getRandomWorkspaceNotifiers()
    }
  ];

  // Filter data based on search value
  const filteredAlertData = React.useMemo(() => {
    if (!searchValue.trim()) {
      return allAlertData;
    }
    return allAlertData.filter(row => 
      row.eventType.toLowerCase().includes(searchValue.toLowerCase()) ||
      row.service.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  // Get paginated data for display
  const paginatedData = React.useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredAlertData.slice(startIndex, endIndex);
  }, [filteredAlertData, page, perPage]);

  const onSetPage = (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const onPerPageSelect = (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const onSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1); // Reset to first page when searching
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/overview">Settings</BreadcrumbItem>
          <BreadcrumbItem isActive>Alert Manager</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <BellIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Alert Manager</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Manage your alert default settings for your workspace and configure how fired events should alert users and groups through various communication channels.</p>
                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="link"
                    isInline
                    icon={<OutlinedWindowRestoreIcon />}
                    iconPosition="end"
                    component="a"
                    href="https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more
                  </Button>
                </div>
              </Content>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>
      
      <PageSection>
        {/* Toolbar and Top Pagination - Inline */}
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '16px' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Dropdown
                  isOpen={isServicesDropdownOpen}
                  onOpenChange={(isOpen: boolean) => setIsServicesDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<any>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Services filter"
                      onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                      icon={<FilterIcon />}
                    >
                      {selectedService}
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem 
                      onClick={() => { setSelectedService('All Services'); setIsServicesDropdownOpen(false); }}
                    >
                      All Services
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('AI/ML'); setIsServicesDropdownOpen(false); }}
                    >
                      AI/ML
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Alerting & Data Integrations'); setIsServicesDropdownOpen(false); }}
                    >
                      Alerting & Data Integrations
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Automation'); setIsServicesDropdownOpen(false); }}
                    >
                      Automation
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Containers'); setIsServicesDropdownOpen(false); }}
                    >
                      Containers
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Deploy'); setIsServicesDropdownOpen(false); }}
                    >
                      Deploy
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Identity & Access Management'); setIsServicesDropdownOpen(false); }}
                    >
                      Identity & Access Management
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Inventories'); setIsServicesDropdownOpen(false); }}
                    >
                      Inventories
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Observability & Monitoring'); setIsServicesDropdownOpen(false); }}
                    >
                      Observability & Monitoring
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Operators'); setIsServicesDropdownOpen(false); }}
                    >
                      Operators
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Security'); setIsServicesDropdownOpen(false); }}
                    >
                      Security
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('Subscriptions & Spend'); setIsServicesDropdownOpen(false); }}
                    >
                      Subscriptions & Spend
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => { setSelectedService('System Configuration'); setIsServicesDropdownOpen(false); }}
                    >
                      System Configuration
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </FlexItem>
              <FlexItem>
                <SearchInput
                  placeholder="Search alert settings..."
                  value={searchValue}
                  onChange={(event, value) => onSearchChange(value)}
                  onClear={() => onSearchChange('')}
                  style={{ minWidth: '300px' }}
                />
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Pagination
              itemCount={filteredAlertData.length}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              widgetId="top-pagination"
              variant="top"
              isCompact
            />
          </FlexItem>
        </Flex>

        {/* Table */}
        <Table aria-label="Alert settings table">
          <Thead>
            <Tr>
              <Th>Event type</Th>
              <Th>Service</Th>
              <Th>My notifiers</Th>
              <Th>Workspace notifiers</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedData.map((row, index) => (
              <Tr key={index}>
                <Td>
                  <Button 
                    variant="link" 
                    isInline 
                    onClick={row.onClick}
                  >
                    {row.eventType}
                  </Button>
                </Td>
                <Td>{row.service}</Td>
                <Td>
                  <Label 
                    color={row.myNotifiers.color}
                    variant={row.myNotifiers.variant}
                  >
                    {row.myNotifiers.text}
                  </Label>
                </Td>
                <Td>
                  <Label color="grey">
                    {row.workspaceNotifiers.count} notifier{row.workspaceNotifiers.count !== 1 ? 's' : ''}
                  </Label>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* Bottom Pagination */}
        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }} style={{ marginTop: '16px' }}>
          <FlexItem>
            <Pagination
              itemCount={filteredAlertData.length}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              widgetId="bottom-pagination"
              variant="bottom"
            />
          </FlexItem>
        </Flex>
      </PageSection>
    </>
  );
};

export { AlertManager };
