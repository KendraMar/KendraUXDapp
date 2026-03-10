import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  PageSection,
  SearchInput,
  Title,
  Badge,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { 
  ExternalLinkAltIcon,
  FilterIcon,
  SyncIcon,
  ChevronDownIcon
} from '@patternfly/react-icons';

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string;
  updated: string;
  created: string;
  issuetype: string;
  url?: string;
}

const JIRA: React.FunctionComponent = () => {
  const [issues, setIssues] = React.useState<JiraIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = React.useState<JiraIssue[]>([]);
  const [searchValue, setSearchValue] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Mock data for prototype
  const mockIssues: JiraIssue[] = [
    {
      key: 'CPUX-123',
      summary: 'Implement JIRA integration feature',
      status: 'In Progress',
      priority: 'High',
      assignee: 'Kendra Marchant',
      updated: '2024-11-24',
      created: '2024-11-20',
      issuetype: 'Story',
      url: 'https://redhat.atlassian.net/browse/CPUX-123'
    },
    {
      key: 'CPUX-124',
      summary: 'Add search functionality to JIRA component',
      status: 'To Do',
      priority: 'Medium',
      assignee: 'Kendra Marchant',
      updated: '2024-11-23',
      created: '2024-11-22',
      issuetype: 'Task',
      url: 'https://redhat.atlassian.net/browse/CPUX-124'
    },
    {
      key: 'CPUX-125',
      summary: 'Review and test JIRA API integration',
      status: 'Done',
      priority: 'Low',
      assignee: 'Kendra Marchant',
      updated: '2024-11-21',
      created: '2024-11-18',
      issuetype: 'Bug',
      url: 'https://redhat.atlassian.net/browse/CPUX-125'
    },
    {
      key: 'CPUX-126',
      summary: 'Update documentation for JIRA feature',
      status: 'In Progress',
      priority: 'Medium',
      assignee: 'Kendra Marchant',
      updated: '2024-11-24',
      created: '2024-11-19',
      issuetype: 'Task',
      url: 'https://redhat.atlassian.net/browse/CPUX-126'
    },
    {
      key: 'CPUX-127',
      summary: 'Design UI mockups for JIRA dashboard',
      status: 'To Do',
      priority: 'High',
      assignee: 'Kendra Marchant',
      updated: '2024-11-22',
      created: '2024-11-21',
      issuetype: 'Story',
      url: 'https://redhat.atlassian.net/browse/CPUX-127'
    }
  ];

  React.useEffect(() => {
    // Load mock data for prototype
    setIsLoading(true);
    setTimeout(() => {
      setIssues(mockIssues);
      setFilteredIssues(mockIssues);
      setIsLoading(false);
    }, 500);
  }, []);

  React.useEffect(() => {
    let filtered = issues;

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(issue =>
        issue.key.toLowerCase().includes(searchValue.toLowerCase()) ||
        issue.summary.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

    setFilteredIssues(filtered);
  }, [searchValue, statusFilter, priorityFilter, issues]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'green';
      case 'in progress': return 'blue';
      case 'to do': return 'grey';
      case 'blocked': return 'red';
      default: return 'grey';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'grey';
    }
  };

  const getIssueTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'story': return 'blue';
      case 'task': return 'green';
      case 'bug': return 'red';
      case 'epic': return 'purple';
      default: return 'grey';
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    // In a real implementation, this would call the JIRA API
    setTimeout(() => {
      setIssues(mockIssues);
      setFilteredIssues(mockIssues);
      setIsLoading(false);
    }, 500);
  };

  const uniqueStatuses = Array.from(new Set(issues.map(issue => issue.status)));
  const uniquePriorities = Array.from(new Set(issues.map(issue => issue.priority)));

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>Overview</BreadcrumbItem>
          <BreadcrumbItem isActive>JIRA Issues</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#0052CC',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                J
              </div>
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">My JIRA Issues</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>View and manage your assigned JIRA issues from Red Hat Atlassian.</p>
                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="link"
                    isInline
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="end"
                    component="a"
                    href="https://redhat.atlassian.net"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open JIRA
                  </Button>
                </div>
              </Content>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Card>
          <CardHeader>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Title headingLevel="h2" size="xl">Assigned Issues</Title>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="secondary"
                  icon={<SyncIcon />}
                  onClick={handleRefresh}
                  isDisabled={isLoading}
                >
                  Refresh
                </Button>
              </FlexItem>
            </Flex>
          </CardHeader>
          <Divider />
          <CardBody>
            {/* Filters */}
            <Flex spaceItems={{ default: 'spaceItemsMd' }} style={{ marginBottom: '24px' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <SearchInput
                  placeholder="Search by key or summary..."
                  value={searchValue}
                  onChange={(_, value) => setSearchValue(value)}
                  onClear={() => setSearchValue('')}
                />
              </FlexItem>
              <FlexItem>
                <Dropdown
                  isOpen={isStatusDropdownOpen}
                  onOpenChange={(isOpen: boolean) => setIsStatusDropdownOpen(isOpen)}
                  onSelect={(_, value) => {
                    setStatusFilter(value as string);
                    setIsStatusDropdownOpen(false);
                  }}
                  toggle={(toggleRef: React.Ref<any>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Status filter"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    >
                      <FilterIcon style={{ marginRight: '8px' }} />
                      {statusFilter === 'all' ? 'All Statuses' : statusFilter}
                      <ChevronDownIcon style={{ marginLeft: '8px' }} />
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem value="all">All Statuses</DropdownItem>
                    {uniqueStatuses.map(status => (
                      <DropdownItem key={status} value={status}>{status}</DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </FlexItem>
              <FlexItem>
                <Dropdown
                  isOpen={isPriorityDropdownOpen}
                  onOpenChange={(isOpen: boolean) => setIsPriorityDropdownOpen(isOpen)}
                  onSelect={(_, value) => {
                    setPriorityFilter(value as string);
                    setIsPriorityDropdownOpen(false);
                  }}
                  toggle={(toggleRef: React.Ref<any>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Priority filter"
                      onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                    >
                      <FilterIcon style={{ marginRight: '8px' }} />
                      {priorityFilter === 'all' ? 'All Priorities' : priorityFilter}
                      <ChevronDownIcon style={{ marginLeft: '8px' }} />
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem value="all">All Priorities</DropdownItem>
                    {uniquePriorities.map(priority => (
                      <DropdownItem key={priority} value={priority}>{priority}</DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </FlexItem>
            </Flex>

            {/* Results count */}
            <div style={{ marginBottom: '16px', color: '#6a6e73', fontSize: '14px' }}>
              Showing {filteredIssues.length} of {issues.length} issues
            </div>

            {/* Table */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spinner size="lg" />
                <div style={{ marginTop: '16px', color: '#6a6e73' }}>Loading JIRA issues...</div>
              </div>
            ) : error ? (
              <EmptyState variant={EmptyStateVariant.full}>
                <EmptyStateBody>
                  <Content>{error}</Content>
                </EmptyStateBody>
              </EmptyState>
            ) : filteredIssues.length === 0 ? (
              <EmptyState variant={EmptyStateVariant.full}>
                <EmptyStateBody>
                  <Content>No issues found matching your filters.</Content>
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <Table variant="compact" aria-label="JIRA issues table">
                <Thead>
                  <Tr>
                    <Th>Key</Th>
                    <Th>Summary</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Priority</Th>
                    <Th>Updated</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredIssues.map((issue) => (
                    <Tr key={issue.key}>
                      <Td>
                        <Button
                          variant="link"
                          isInline
                          component="a"
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          icon={<ExternalLinkAltIcon />}
                          iconPosition="end"
                        >
                          {issue.key}
                        </Button>
                      </Td>
                      <Td>{issue.summary}</Td>
                      <Td>
                        <Badge isRead>{issue.issuetype}</Badge>
                      </Td>
                      <Td>
                        <Label color={getStatusColor(issue.status)}>{issue.status}</Label>
                      </Td>
                      <Td>
                        <Label color={getPriorityColor(issue.priority)}>{issue.priority}</Label>
                      </Td>
                      <Td>{issue.updated}</Td>
                      <Td>
                        <Button
                          variant="link"
                          isInline
                          component="a"
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          icon={<ExternalLinkAltIcon />}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export { JIRA };

