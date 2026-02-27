import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem,
  AccordionToggle,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  Flex,
  FlexItem,
  Label,
  PageSection,
  Tab,
  TabTitleIcon,
  TabTitleText,
  Tabs,
  Title
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { BellIcon, CogIcon, EnvelopeIcon, ExternalLinkAltIcon, IntegrationIcon, OutlinedWindowRestoreIcon, PlusCircleIcon, UserIcon, UsersIcon } from '@patternfly/react-icons';
import { Help } from '@app/Help';
import { useAskRedHat } from '@app/AskRedHat';
import { useHelpPanel } from '@app/Help/HelpPanelProvider';

const Dashboard: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { showAskRedHat } = useAskRedHat();
  const [alertNotifiersTabKey, setAlertNotifiersTabKey] = React.useState<string | number>(0);
  const { isOpen: isHelpPanelOpen, activeTabKey, closeHelpPanel, setActiveTabKey } = useHelpPanel();
  const [expandedAccordionItems, setExpandedAccordionItems] = React.useState<{[key: string]: boolean}>({
    'use-case-1': true,
    'use-case-2': false,
    'use-case-3': false,
    'use-case-4': false
  });

  const handleTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const handleAlertNotifiersTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setAlertNotifiersTabKey(tabIndex);
  };

  const handleAccordionToggle = (id: string) => {
    setExpandedAccordionItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <Help 
      isOpen={isHelpPanelOpen}
      onClose={closeHelpPanel}
      onAskRedHat={showAskRedHat}
      isInline={true}
      activeTabKey={activeTabKey}
      onTabChange={setActiveTabKey}
    >
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>Settings</BreadcrumbItem>
          <BreadcrumbItem isActive>Overview</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <CogIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Settings overview</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Manage all things related to eventing, alerting, and data sourcing.</p>
                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="link"
                    isInline
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="end"
                    component="a"
                    href="https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/html/integrating_the_red_hat_hybrid_cloud_console_with_third-party_applications/index"
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
          <Tab eventKey={0} title={<TabTitleText>Dashboard</TabTitleText>}>
            <PageSection>
              <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                {/* Left side - Two stacked cards (75% width) */}
                <FlexItem flex={{ default: 'flex_3' }}>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    {/* First card in the stack */}
                    <FlexItem>
              <Card>
                        <CardHeader>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Title headingLevel="h2" size="xl">My alert notifiers</Title>
                            </FlexItem>
                            <FlexItem style={{ marginLeft: '16px' }}>
                              <Button variant="link" size="sm" onClick={() => navigate('/alert-manager')}>
                                Manage alerts
                              </Button>
                            </FlexItem>
                          </Flex>
                        </CardHeader>
                        <Divider />
                        <CardBody style={{ padding: 0 }}>
                          <div style={{ position: 'relative' }}>
                            <Tabs activeKey={alertNotifiersTabKey} onSelect={handleAlertNotifiersTabClick}>
                              <Tab eventKey={0} title={<><TabTitleIcon><UserIcon /></TabTitleIcon><TabTitleText>My alert preferences</TabTitleText></>} />
                              <Tab eventKey={1} title={<><TabTitleIcon><UsersIcon /></TabTitleIcon><TabTitleText>Workspace defaults</TabTitleText></>} />
                            </Tabs>
                            <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', zIndex: 1 }}>
                              <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                Showing 10 of 62 events
                              </Content>
                            </div>
                          </div>
                          
                          {alertNotifiersTabKey === 0 && (
                            <div style={{ padding: '24px' }}>
                              <Table variant="compact">
                                <Thead>
                                  <Tr>
                                    <Th sort={{ sortBy: { index: 0, direction: undefined }, onSort: () => {}, columnIndex: 0 }}>Event type</Th>
                                    <Th sort={{ sortBy: { index: 1, direction: undefined }, onSort: () => {}, columnIndex: 1 }}>Service</Th>
                                    <Th>Notifiers</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Cluster Scaling clicked')}>
                                          Cluster Scaling
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                          <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                          <FlexItem><Label color="yellow">Slack</Label></FlexItem>
                                          <FlexItem><Label color="purple">Teams</Label></FlexItem>
                                        </Flex>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Any vulnerability with known exploit clicked')}>
                                          Any vulnerability with known exploit
                                        </Button>
                                      </Td>
                                      <Td>Vulnerability | RHEL</Td>
                                      <Td>
                                        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                          <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                          <FlexItem><Label color="teal">Email</Label></FlexItem>
                                          <FlexItem><Label color="yellow">Slack</Label></FlexItem>
                                          <FlexItem><Label color="green">GChat</Label></FlexItem>
                                          <FlexItem><Label color="purple">Teams</Label></FlexItem>
                                        </Flex>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Cluster Configuration clicked')}>
                                          Cluster Configuration
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Label color="grey">No notifiers</Label>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Availability Status clicked')}>
                                          Availability Status
                                        </Button>
                                      </Td>
                                      <Td>Integrations | Settings</Td>
                                      <Td>
                                        <Label color="blue">Notification drawer</Label>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Cluster Access clicked')}>
                                          Cluster Access
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                          <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                          <FlexItem><Label color="teal">Email</Label></FlexItem>
                                          <FlexItem><Label color="green">GChat</Label></FlexItem>
                                        </Flex>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Capacity Management clicked')}>
                                          Capacity Management
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                          <FlexItem><Label color="teal">Email</Label></FlexItem>
                                          <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                        </Flex>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Cluster Add-on clicked')}>
                                          Cluster Add-on
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                          <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                          <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                        </Flex>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Cluster Lifecycle clicked')}>
                                          Cluster Lifecycle
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                          <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                          <FlexItem><Label color="teal">Email</Label></FlexItem>
                                          <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                        </Flex>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Cluster Networking clicked')}>
                                          Cluster Networking
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Label color="orange">Webhook</Label>
                                      </Td>
                                    </Tr>
                                    <Tr>
                                      <Td>
                                        <Button variant="link" isInline onClick={() => console.log('Cluster Ownership clicked')}>
                                          Cluster Ownership
                                        </Button>
                                      </Td>
                                      <Td>Cluster Management | OpenShift</Td>
                                      <Td>
                                        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                          <FlexItem><Label color="teal">Email</Label></FlexItem>
                                          <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                          <FlexItem><Label color="purple">Teams</Label></FlexItem>
                                        </Flex>
                                      </Td>
                                    </Tr>
                                  </Tbody>
                              </Table>
                            </div>
                          )}
                          
                          {alertNotifiersTabKey === 1 && (
                            <div style={{ padding: '24px' }}>
                              <Table variant="compact">
                                <Thead>
                                  <Tr>
                                    <Th sort={{ sortBy: { index: 0, direction: undefined }, onSort: () => console.log('Event type sort clicked'), columnIndex: 0 }}>Event type</Th>
                                    <Th>Service</Th>
                                    <Th>Notifiers</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Cluster Scaling clicked')}>
                                        Cluster Scaling
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                        <FlexItem><Label color="yellow">Slack</Label></FlexItem>
                                        <FlexItem><Label color="purple">Teams</Label></FlexItem>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Any vulnerability with known exploit clicked')}>
                                        Any vulnerability with known exploit
                                      </Button>
                                    </Td>
                                    <Td>Vulnerability | RHEL</Td>
                                    <Td>
                                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                        <FlexItem><Label color="teal">Email</Label></FlexItem>
                                        <FlexItem><Label color="yellow">Slack</Label></FlexItem>
                                        <FlexItem><Label color="green">GChat</Label></FlexItem>
                                        <FlexItem><Label color="purple">Teams</Label></FlexItem>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Cluster Configuration clicked')}>
                                        Cluster Configuration
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Label color="grey">No notifiers</Label>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Availability Status clicked')}>
                                        Availability Status
                                      </Button>
                                    </Td>
                                    <Td>Integrations | Settings</Td>
                                    <Td>
                                      <Label color="blue">Notification drawer</Label>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Cluster Access clicked')}>
                                        Cluster Access
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                        <FlexItem><Label color="teal">Email</Label></FlexItem>
                                        <FlexItem><Label color="green">GChat</Label></FlexItem>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Capacity Management clicked')}>
                                        Capacity Management
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem><Label color="teal">Email</Label></FlexItem>
                                        <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Cluster Add-on clicked')}>
                                        Cluster Add-on
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                        <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Cluster Lifecycle clicked')}>
                                        Cluster Lifecycle
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem><Label color="blue">Notification drawer</Label></FlexItem>
                                        <FlexItem><Label color="teal">Email</Label></FlexItem>
                                        <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Cluster Networking clicked')}>
                                        Cluster Networking
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Label color="orange">Webhook</Label>
                                    </Td>
                                  </Tr>
                                  <Tr>
                                    <Td>
                                      <Button variant="link" isInline onClick={() => console.log('Cluster Ownership clicked')}>
                                        Cluster Ownership
                                      </Button>
                                    </Td>
                                    <Td>Cluster Management | OpenShift</Td>
                                    <Td>
                                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem><Label color="teal">Email</Label></FlexItem>
                                        <FlexItem><Label color="orange">Webhook</Label></FlexItem>
                                        <FlexItem><Label color="purple">Teams</Label></FlexItem>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                </Tbody>
                              </Table>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </FlexItem>
                    
                    {/* Second card in the stack */}
                    <FlexItem>
                      <Card>
                        <CardHeader>
                          <Title headingLevel="h2" size="xl">
                            Recent events
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => navigate('/event-log')}
                              style={{ marginLeft: '16px' }}
                            >
                              View event log
                            </Button>
                          </Title>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <Table variant="compact">
                            <Thead>
                              <Tr>
                                <Th>Event</Th>
                                <Th>Service</Th>
                                <Th>Date</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              <Tr>
                                <Td>
                                  <Button variant="link" isInline onClick={() => console.log('Group Updated clicked')}>
                                    Group Updated
                                  </Button>
                                </Td>
                                <Td>User Access | IAM</Td>
                                <Td>3 May 2023, 13:45 UTC</Td>
                              </Tr>
                              <Tr>
                                <Td>
                                  <Button variant="link" isInline onClick={() => console.log('Group Updated clicked')}>
                                    Group Updated
                                  </Button>
                                </Td>
                                <Td>User Access | IAM</Td>
                                <Td>2 May 2023, 1:05 UTC</Td>
                              </Tr>
                              <Tr>
                                <Td>
                                  <Button variant="link" isInline onClick={() => console.log('New system registered clicked')}>
                                    New system registered
                                  </Button>
                                </Td>
                                <Td>Systems - Inventory| RHEL</Td>
                                <Td>28 April 2023, 10:41 UTC</Td>
                              </Tr>
                              <Tr>
                                <Td>
                                  <Button variant="link" isInline onClick={() => console.log('Group deleted clicked')}>
                                    Group deleted
                                  </Button>
                                </Td>
                                <Td>User Access | IAM</Td>
                                <Td>15 April 2023, 5:17 UTC</Td>
                              </Tr>
                              <Tr>
                                <Td>
                                  <Button variant="link" isInline onClick={() => console.log('Capacity Management clicked')}>
                                    Capacity Management
                                  </Button>
                                </Td>
                                <Td>Cluster Manager | OpenShift</Td>
                                <Td>12 April 2023, 18:1 UTC</Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </CardBody>
                      </Card>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                
                {/* Right side - Thin card (25% width) */}
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Card style={{ height: '100%' }}>
                    <CardHeader>
                      <Title headingLevel="h3" size="lg">
                        Data integrations
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => navigate('/data-integrations')}
                          style={{ marginLeft: '16px' }}
                        >
                          View dashboard
                        </Button>
                      </Title>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <Card variant="secondary" isCompact>
                            <CardBody style={{ padding: '12px', position: 'relative' }}>
                              <PlusCircleIcon 
                                style={{ 
                                  position: 'absolute', 
                                  top: '8px', 
                                  right: '8px', 
                                  fontSize: '16px',
                                  color: '#888',
                                  margin: '8px'
                                }} 
                              />
                              <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem>
                                  <img 
                                    src="https://icon2.cleanpng.com/20180817/vog/8968d0640f2c4053333ce7334314ef83.webp" 
                                    alt="Amazon Web Services" 
                                    style={{ width: '32px', height: '32px', marginBottom: '8px' }} 
                                  />
                                </FlexItem>
                                <FlexItem style={{ textAlign: 'center' }}>
                                  <div>Amazon Web Services</div>
                                  <Button variant="link" isInline style={{ padding: 0, fontSize: '14px', marginTop: '4px' }}>
                                    3 integrations
                                  </Button>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                        <FlexItem>
                          <Card variant="secondary" isCompact>
                            <CardBody style={{ padding: '12px', position: 'relative' }}>
                              <PlusCircleIcon 
                                style={{ 
                                  position: 'absolute', 
                                  top: '8px', 
                                  right: '8px', 
                                  fontSize: '16px',
                                  color: '#888',
                                  margin: '8px'
                                }} 
                              />
                              <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem>
                                  <img 
                                    src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg" 
                                    alt="Microsoft Azure" 
                                    style={{ width: '32px', height: '32px', marginBottom: '8px' }} 
                                  />
                                </FlexItem>
                                <FlexItem style={{ textAlign: 'center' }}>
                                  <div>Microsoft Azure</div>
                                  <Button variant="link" isInline style={{ padding: 0, fontSize: '14px', marginTop: '4px' }}>
                                    3 integrations
                                  </Button>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                        <FlexItem>
                          <Card variant="secondary" isCompact>
                            <CardBody style={{ padding: '12px', position: 'relative' }}>
                              <PlusCircleIcon 
                                style={{ 
                                  position: 'absolute', 
                                  top: '8px', 
                                  right: '8px', 
                                  fontSize: '16px',
                                  color: '#888',
                                  margin: '8px'
                                }} 
                              />
                              <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem>
                                  <img 
                                    src="https://holori.com/wp-content/uploads/2021/05/GCP.png" 
                                    alt="Google Cloud Platform" 
                                    style={{ width: '82px', height: 'auto', marginBottom: '0' }} 
                                  />
                                </FlexItem>
                                <FlexItem style={{ textAlign: 'center' }}>
                                  <div>Google Cloud Platform</div>
                                  <Button variant="link" isInline style={{ padding: 0, fontSize: '14px', marginTop: '4px' }}>
                                    3 integrations
                                  </Button>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                        <FlexItem>
                          <Card variant="secondary" isCompact>
                            <CardBody style={{ padding: '12px', position: 'relative' }}>
                              <PlusCircleIcon 
                                style={{ 
                                  position: 'absolute', 
                                  top: '8px', 
                                  right: '8px', 
                                  fontSize: '16px',
                                  color: '#888',
                                  margin: '8px'
                                }} 
                              />
                              <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem>
                                  <img 
                                    src="https://store-images.s-microsoft.com/image/apps.33409.0ac29806-cbb4-4856-959c-4c5f4dc90bad.94beb0d6-03a0-4150-bad7-9cddda220466.57c047c4-9da6-4844-a551-8251ba96f99f" 
                                    alt="OpenShift Container Platform" 
                                    style={{ width: '32px', height: '32px', marginBottom: '8px' }} 
                                  />
                                </FlexItem>
                                <FlexItem style={{ textAlign: 'center' }}>
                                  <div>OpenShift Container Platform</div>
                                  <Button variant="link" isInline style={{ padding: 0, fontSize: '14px', marginTop: '4px' }}>
                                    1 integrations
                                  </Button>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                        <FlexItem>
                          <Card variant="secondary" isCompact>
                            <CardBody style={{ padding: '12px', position: 'relative' }}>
                              <PlusCircleIcon 
                                style={{ 
                                  position: 'absolute', 
                                  top: '8px', 
                                  right: '8px', 
                                  fontSize: '16px',
                                  color: '#888',
                                  margin: '8px'
                                }} 
                              />
                              <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem>
                                  <img 
                                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwt02Pvocmj2bC5dPEWVClHVw843KI_a6yNw&s" 
                                    alt="Oracle Cloud Infrastructure" 
                                    style={{ width: '52px', height: 'auto', marginBottom: '0' }} 
                                  />
                                </FlexItem>
                                <FlexItem style={{ textAlign: 'center' }}>
                                  <div>Oracle Cloud Infrastructure</div>
                                  <Button variant="link" isInline style={{ padding: 0, fontSize: '14px', marginTop: '4px' }}>
                                    2 integrations
                                  </Button>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                      </Flex>
                </CardBody>
              </Card>
                </FlexItem>
              </Flex>
            </PageSection>
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>About</TabTitleText>}>
            <PageSection>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                {/* H2 Header */}
                <FlexItem>
                  <Title headingLevel="h2" size="xl">Get started with Hybrid Cloud Console Settings</Title>
                </FlexItem>
                
                {/* Two service cards side by side */}
                <FlexItem>
                  <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Card>
                        <CardHeader>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>
                              <BellIcon style={{ fontSize: '20px', color: '#0066cc' }} />
                            </FlexItem>
                            <FlexItem>
                              <Title headingLevel="h3" size="lg">Alert Manager</Title>
                            </FlexItem>
                          </Flex>
                        </CardHeader>
                        <CardBody>
                          <Content>
                            <p>Configure how you want to be alerted of events firing in your workspace through email, Hybrid Cloud Console-native tools, and third-party tools as well. Users with certain admin roles can also configure workspace-wide alert defaults.</p>
                            <div style={{ marginTop: '16px' }}>
                              <Button variant="secondary" onClick={() => navigate('/alert-manager')}>
                                Manage alerts
                              </Button>
                            </div>
                          </Content>
                        </CardBody>
                      </Card>
                    </FlexItem>
                    <FlexItem flex={{ default: 'flex_1' }}>
              <Card>
                        <CardHeader>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>
                              <IntegrationIcon style={{ fontSize: '20px', color: '#0066cc' }} />
                            </FlexItem>
                            <FlexItem>
                              <Title headingLevel="h3" size="lg">Data Integration</Title>
                            </FlexItem>
                          </Flex>
                        </CardHeader>
                <CardBody>
                  <Content>
                            <p>Manage data sourcing and sharing with cloud providers including OpenShift Container Platform, Microsoft Azure, Amazon Web Services (AWS), Google Cloud Platform (GCP), IBM Cloud, and Oracle Cloud Infrastructure.</p>
                            <div style={{ marginTop: '16px' }}>
                              <Button variant="secondary" onClick={() => navigate('/data-integration')}>
                                Manage data integrations
                              </Button>
                            </div>
                  </Content>
                </CardBody>
              </Card>
                    </FlexItem>
                  </Flex>
                </FlexItem>

                {/* Use cases card with accordion */}
                <FlexItem>
                  <Card>
                    <CardHeader>
                      <Title headingLevel="h3" size="lg">Use cases</Title>
                    </CardHeader>
                    <CardBody style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0 }}>
                      <Accordion isBordered togglePosition="start">
                        <AccordionItem isExpanded={expandedAccordionItems['use-case-1']}>
                          <AccordionToggle id="use-case-1" onClick={() => handleAccordionToggle('use-case-1')}>
                            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ width: '100%' }}>
                              <FlexItem>
                                Customize your own alert notifiers
                              </FlexItem>
                              <FlexItem>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Navigate to destination to be provided later
                                  }}
                                >
                                  Manage my notifiers
                                </Button>
                              </FlexItem>
                            </Flex>
                          </AccordionToggle>
                          <AccordionContent id="use-case-1-content">
                            <p>Determine how you, as an individual user, would like to be made aware of events firing in your workspace. The degree at which a user can customize alert notifiers depends on the roles and permissions determined by workspace admins.</p>
                            <div style={{ marginTop: '12px' }}>
                              <Button
                                variant="link"
                                isInline
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="end"
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Learn more
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem isExpanded={expandedAccordionItems['use-case-2']}>
                          <AccordionToggle id="use-case-2" onClick={() => handleAccordionToggle('use-case-2')}>
                            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ width: '100%' }}>
                              <FlexItem>
                                Manage the default alert settings for your workspace
                              </FlexItem>
                              <FlexItem>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Navigate to destination to be provided later
                                  }}
                                >
                                  Manage workspace notifiers
                                </Button>
                              </FlexItem>
                            </Flex>
                          </AccordionToggle>
                          <AccordionContent id="use-case-2-content">
                            <p>Manage the default alert settings for your workspace</p>
                            <div style={{ marginTop: '12px' }}>
                              <Button
                                variant="link"
                                isInline
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="end"
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Learn more
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem isExpanded={expandedAccordionItems['use-case-3']}>
                          <AccordionToggle id="use-case-3" onClick={() => handleAccordionToggle('use-case-3')}>
                            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ width: '100%' }}>
                              <FlexItem>
                                View all fired events in your workspace
                              </FlexItem>
                              <FlexItem>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/event-log');
                                  }}
                                >
                                  View event log
                                </Button>
                              </FlexItem>
                            </Flex>
                          </AccordionToggle>
                          <AccordionContent id="use-case-3-content">
                            <p>View all fired events in your workspace</p>
                            <div style={{ marginTop: '12px' }}>
                              <Button
                                variant="link"
                                isInline
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="end"
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Learn more
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem isExpanded={expandedAccordionItems['use-case-4']}>
                          <AccordionToggle id="use-case-4" onClick={() => handleAccordionToggle('use-case-4')}>
                            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ width: '100%' }}>
                              <FlexItem>
                                Integrate data from popular cloud providers
                              </FlexItem>
                              <FlexItem>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/data-integrations');
                                  }}
                                >
                                  Manage data integrations
                                </Button>
                              </FlexItem>
                            </Flex>
                          </AccordionToggle>
                          <AccordionContent id="use-case-4-content">
                            <p>Integrate data from popular cloud providers</p>
                            <div style={{ marginTop: '12px' }}>
                              <Button
                                variant="link"
                                isInline
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="end"
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Learn more
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardBody>
                  </Card>
                </FlexItem>

                {/* Recommended content card with table */}
                <FlexItem>
                  <Card>
                    <CardHeader>
                      <Title headingLevel="h3" size="lg">Recommended content</Title>
                    </CardHeader>
                    <CardBody>
                      <Table variant="compact">
                        <Thead>
                          <Tr>
                            <Th>Resource</Th>
                            <Th>Type</Th>
                            <Th>Description</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td>Getting Started with Alert Manager</Td>
                            <Td><Label color="orange">Documentation</Label></Td>
                            <Td>
                              <Button
                                variant="link"
                                isInline
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="end"
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View documentation
                              </Button>
                            </Td>
                          </Tr>
                          <Tr>
                            <Td>Data Integration Best Practices</Td>
                            <Td><Label color="orange">Documentation</Label></Td>
                            <Td>
                              <Button
                                variant="link"
                                isInline
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="end"
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View documentation
                              </Button>
                            </Td>
                          </Tr>
                          <Tr>
                            <Td>Event Log Configuration Tutorial</Td>
                            <Td><Label color="orange">Documentation</Label></Td>
                            <Td>
                              <Button
                                variant="link"
                                isInline
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="end"
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View documentation
                              </Button>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                      <div style={{ marginTop: '16px' }}>
                        <Button variant="link" onClick={() => navigate('/learning-resources')}>
                          View all Settings learning resources
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </FlexItem>
              </Flex>
            </PageSection>
          </Tab>
        </Tabs>
      </PageSection>
    </Help>
  );
};

export { Dashboard };
