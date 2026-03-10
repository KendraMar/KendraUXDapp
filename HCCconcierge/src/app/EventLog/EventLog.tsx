import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  PageSection,
  SearchInput,
  Tab,
  TabTitleText,
  Tabs,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, ListIcon } from '@patternfly/react-icons';

const EventLog: React.FunctionComponent = () => {
  const [searchValue, setSearchValue] = React.useState('');
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  const onSearchChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setSearchValue(value);
  };

  const onSearchClear = () => {
    setSearchValue('');
  };

  const handleTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/overview">Settings</BreadcrumbItem>
          <BreadcrumbItem isActive>Event Log</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <ListIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Event Log</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>View and analyze system events, audit logs, and activity traces across your hybrid cloud environment.</p>
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
                </div>
              </Content>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>
      
      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          <Tab eventKey={0} title={<TabTitleText>Event Viewer</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">System Event Log</Title>
                    <p>
                      View and analyze system events, audit logs, and activity traces 
                      across your hybrid cloud environment.
                    </p>
                    
                    <Toolbar style={{ marginTop: '24px' }}>
                      <ToolbarContent>
                        <ToolbarItem>
                          <SearchInput
                            placeholder="Search events..."
                            value={searchValue}
                            onChange={onSearchChange}
                            onClear={onSearchClear}
                            aria-label="Search events"
                          />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button variant="primary">Filter Events</Button>
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button variant="secondary">Export Log</Button>
                        </ToolbarItem>
                      </ToolbarContent>
                    </Toolbar>
                    
                    <div style={{ marginTop: '24px' }}>
                      <h3>Recent Events:</h3>
                      <ul>
                        <li><strong>2024-01-15 14:30:25</strong> - User authentication successful</li>
                        <li><strong>2024-01-15 14:25:12</strong> - System configuration updated</li>
                        <li><strong>2024-01-15 14:20:08</strong> - Alert rule triggered: High CPU usage</li>
                        <li><strong>2024-01-15 14:15:03</strong> - Data integration job completed</li>
                        <li><strong>2024-01-15 14:10:45</strong> - New user account created</li>
                      </ul>
                    </div>
                  </Content>
                </CardBody>
              </Card>
            </PageSection>
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>Analytics</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">Event Analytics</Title>
                    <p>Analyze event patterns, trends, and system behavior over time.</p>
                  </Content>
                </CardBody>
              </Card>
            </PageSection>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export { EventLog };
