import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  TextInput,
  Title,
  Badge,
  Tabs,
  Tab,
  TabContent,
  TabTitleText
} from '@patternfly/react-core';
import { 
  ExternalLinkAltIcon,
  SearchIcon,
  PlusIcon,
  ExpandArrowsAltIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVIcon
} from '@patternfly/react-icons';
import { SetupGuide } from '@app/SetupGuide/SetupGuide';

const Integrations: React.FunctionComponent = () => {
  const [activeTab, setActiveTab] = React.useState('cloud');
  const [searchValue, setSearchValue] = React.useState('');
  const [expandedSection, setExpandedSection] = React.useState(false);
  const [showSetupGuide, setShowSetupGuide] = React.useState(true);

  const integrations = [
    {
      name: 'my-test',
      type: 'Amazon Web Services',
      connectedApps: ['Cost Management'],
      dateAdded: '13 days ago',
      status: 'Available'
    },
    {
      name: 'gm-aws',
      type: 'Amazon Web Services',
      connectedApps: ['Cost Management', 'RHEL management'],
      dateAdded: '14 days ago',
      status: 'Partially available'
    },
    {
      name: 'cost-mgmt-kflux-prd-rh03',
      type: 'Amazon Web Services',
      connectedApps: ['Cost Management'],
      dateAdded: '4 months ago',
      status: 'Available'
    },
    {
      name: 'sadcsdfc',
      type: 'Microsoft Azure',
      connectedApps: ['Cost Management'],
      dateAdded: '4 months ago',
      status: 'Unavailable'
    },
    {
      name: 'jjohanss-tf',
      type: 'Google Cloud',
      connectedApps: ['Cost Management'],
      dateAdded: '5 months ago',
      status: 'Unavailable'
    },
    {
      name: 'test-shubh-gcp',
      type: 'Google Cloud',
      connectedApps: ['Cost Management', 'RHEL management'],
      dateAdded: '6 months ago',
      status: 'In progress'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'green';
      case 'Partially available': return 'orange';
      case 'Unavailable': return 'red';
      case 'In progress': return 'gray';
      default: return 'gray';
    }
  };

  const getAppBadgeColor = (app: string) => {
    switch (app) {
      case 'Cost Management': return 'green';
      case 'RHEL management': return 'pink';
      default: return 'blue';
    }
  };

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    integration.type.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', marginRight: showSetupGuide ? '424px' : '0' }}>
      {/* Header */}
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
        <FlexItem>
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#0066cc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        right: '2px',
                        bottom: '2px',
                        border: '1px solid #0066cc',
                        borderRadius: '2px'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        right: '4px',
                        bottom: '4px',
                        backgroundColor: '#0066cc',
                        borderRadius: '1px'
                      }} />
                    </div>
                  </div>
                </FlexItem>
                <FlexItem>
                  <Title headingLevel="h1" size="2xl">Integrations</Title>
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Button variant="secondary">
                    <PlusIcon /> Create Integration
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button variant="plain" aria-label="Star">
                    <span style={{ fontSize: '18px' }}>★</span>
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button variant="plain" aria-label="More actions">
                    <EllipsisVIcon />
                  </Button>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </FlexItem>

        {/* Description */}
        <FlexItem>
          <Content style={{ fontSize: '16px', lineHeight: '1.5', color: '#666' }}>
            Integrating third-party applications expands the scope of notifications beyond emails and messages, so that you can view and manage Hybrid Cloud Console events from your preferred platform dashboard. Cloud integrations connect your cloud provider accounts with the Hybrid Cloud Console to collect data, so you can use console services with your cloud providers.
          </Content>
        </FlexItem>

        {/* Learn more link */}
        <FlexItem>
          <Button variant="link" isInline icon={<ExternalLinkAltIcon />} iconPosition="end">
            Learn more
          </Button>
        </FlexItem>

        {/* Tabs */}
        <FlexItem>
          <Tabs activeKey={activeTab} onSelect={(_, tabIndex) => setActiveTab(tabIndex as string)}>
            <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>} />
            <Tab eventKey="cloud" title={<TabTitleText>Cloud</TabTitleText>} />
            <Tab eventKey="redhat" title={<TabTitleText>Red Hat</TabTitleText>} />
          </Tabs>
        </FlexItem>

        {/* Tab Content */}
        <FlexItem>
          <TabContent eventKey={activeTab} id={`${activeTab}-content`}>
            {/* Expandable Section */}
            <FlexItem style={{ marginBottom: '24px' }}>
              <Button
                variant="link"
                isInline
                onClick={() => setExpandedSection(!expandedSection)}
                icon={expandedSection ? <ChevronDownIcon /> : <ChevronRightIcon />}
                iconPosition="start"
                style={{ padding: 0, fontSize: '16px' }}
              >
                I connected to cloud. Now what?
              </Button>
            </FlexItem>

            {/* Filter and Action Bar */}
            <FlexItem style={{ marginBottom: '16px' }}>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>
                      <Button variant="plain" style={{ padding: '8px 12px', border: '1px solid #ccc' }}>
                        Name <ChevronDownIcon />
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <div style={{ position: 'relative' }}>
                        <TextInput
                          type="text"
                          placeholder="Filter by Name"
                          value={searchValue}
                          onChange={(_, value) => setSearchValue(value)}
                          style={{ paddingRight: '40px', width: '200px' }}
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
                    <FlexItem>
                      <Button variant="secondary">Add integration</Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="plain" aria-label="Expand">
                        <ExpandArrowsAltIcon />
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>
                      <Content style={{ fontSize: '14px', color: '#666' }}>
                        1-{filteredIntegrations.length} of {filteredIntegrations.length}
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="plain" size="sm">««</Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="plain" size="sm">‹</Button>
                    </FlexItem>
                    <FlexItem>
                      <TextInput
                        type="text"
                        value="1"
                        style={{ width: '40px', textAlign: 'center' }}
                        readOnly
                      />
                    </FlexItem>
                    <FlexItem>
                      <Content style={{ fontSize: '14px', color: '#666' }}>of 1</Content>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="plain" size="sm">›</Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="plain" size="sm">»»</Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </FlexItem>

            {/* Integrations Table */}
            <FlexItem>
              <Card>
                <CardBody style={{ padding: 0 }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'flex',
                    padding: '12px 16px',
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #ddd',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    <div style={{ flex: '2', display: 'flex', alignItems: 'center' }}>
                      Name <ChevronUpIcon style={{ marginLeft: '4px', fontSize: '12px' }} />
                    </div>
                    <div style={{ flex: '2', display: 'flex', alignItems: 'center' }}>
                      Type <ChevronUpIcon style={{ marginLeft: '4px', fontSize: '12px' }} />
                    </div>
                    <div style={{ flex: '2' }}>Connected applications</div>
                    <div style={{ flex: '1.5', display: 'flex', alignItems: 'center' }}>
                      Date added <ChevronDownIcon style={{ marginLeft: '4px', fontSize: '12px' }} />
                    </div>
                    <div style={{ flex: '1' }}>Status</div>
                    <div style={{ flex: '0.5' }}></div>
                  </div>

                  {/* Table Rows */}
                  {filteredIntegrations.map((integration, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        padding: '12px 16px',
                        borderBottom: '1px solid #eee',
                        alignItems: 'center',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ flex: '2' }}>
                        <Button variant="link" isInline style={{ padding: 0, fontSize: '14px' }}>
                          {integration.name}
                        </Button>
                      </div>
                      <div style={{ flex: '2' }}>{integration.type}</div>
                      <div style={{ flex: '2' }}>
                        <Flex spaceItems={{ default: 'spaceItemsXs' }} wrap="wrap">
                          {integration.connectedApps.map((app, appIndex) => (
                            <FlexItem key={appIndex}>
                              <Badge color={getAppBadgeColor(app)}>
                                {app}
                              </Badge>
                            </FlexItem>
                          ))}
                        </Flex>
                      </div>
                      <div style={{ flex: '1.5' }}>{integration.dateAdded}</div>
                      <div style={{ flex: '1' }}>
                        <Badge color={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                      <div style={{ flex: '0.5', textAlign: 'right' }}>
                        <Button variant="plain" size="sm" aria-label="Actions">
                          <EllipsisVIcon />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </FlexItem>
          </TabContent>
        </FlexItem>
      </Flex>
      
      {/* Setup Guide Panel */}
      <SetupGuide 
        isOpen={showSetupGuide} 
        onClose={() => setShowSetupGuide(false)}
        showCloudHelpByDefault={true}
      />
    </div>
  );
};

export { Integrations };
