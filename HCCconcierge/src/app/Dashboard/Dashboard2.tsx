import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Flex,
  FlexItem,
  Gallery,
  List,
  ListItem,
  PageSection,
  Title
} from '@patternfly/react-core';
import { 
  BellIcon,
  EllipsisVIcon,
  GripVerticalIcon,
  PaperPlaneIcon,
  RebootingIcon
} from '@patternfly/react-icons';
import { Help } from '@app/Help';
import { useAskRedHat } from '@app/AskRedHat';
import { useHelpPanel } from '@app/Help/HelpPanelProvider';

const Dashboard2: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { showAskRedHat } = useAskRedHat();
  const { isOpen: isHelpPanelOpen, activeTabKey, closeHelpPanel, setActiveTabKey, openHelpPanel, setShowConversionContent } = useHelpPanel();
  
  // Get user name (currently hardcoded)
  const userName = "Kendra";

  // Close help panel by default when Dashboard2 mounts
  React.useEffect(() => {
    closeHelpPanel();
  }, [closeHelpPanel]);

  // CSS styles for dashboard layout
  const dashboardStyle = `
    .pf-v6-l-gallery {
      flex-wrap: wrap !important;
      display: flex !important;
    }
    .pf-v6-l-gallery > * {
      flex-shrink: 1 !important;
      flex-grow: 1 !important;
      min-width: 280px !important;
    }
    
    .lightspeed-card-container {
      position: relative;
    }
    
    .recently-visited-card {
      height: auto !important;
      display: flex !important;
      flex-direction: column !important;
      align-self: flex-start !important;
    }
    
    .recently-visited-card .pf-v6-c-card__body {
      flex-grow: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: visible !important;
    }
    
    @media (min-width: 1200px) {
      .settings-card-wide {
        flex: 0 0 calc(25% - 16px) !important;
        max-width: calc(25% - 16px) !important;
        min-width: calc(25% - 16px) !important;
      }
      
      .events-card-extra-wide {
        flex: 0 0 calc(50% - 16px) !important;
        max-width: calc(50% - 16px) !important;
        min-width: calc(50% - 16px) !important;
      }
      
      .subscriptions-extra-wide {
        flex: 0 0 calc(100% - 16px) !important;
        max-width: calc(100% - 16px) !important;
        min-width: calc(100% - 16px) !important;
      }
    }
    
    @media (min-width: 992px) and (max-width: 1199px) {
      .settings-card-wide {
        flex: 0 0 calc(33.333% - 16px) !important;
        max-width: calc(33.333% - 16px) !important;
        min-width: calc(33.333% - 16px) !important;
      }
      
      .events-card-extra-wide {
        flex: 0 0 calc(66.666% - 16px) !important;
        max-width: calc(66.666% - 16px) !important;
        min-width: calc(66.666% - 16px) !important;
      }
      
      .subscriptions-extra-wide {
        flex: 0 0 calc(100% - 16px) !important;
        max-width: calc(100% - 16px) !important;
        min-width: calc(100% - 16px) !important;
      }
    }
    
    @media (max-width: 991px) {
      .settings-card-wide,
      .subscriptions-extra-wide,
      .events-card-extra-wide {
        flex: 1 1 100% !important;
        max-width: 100% !important;
        min-width: 280px !important;
      }
    }
  `;

  return (
    <Help 
      isOpen={isHelpPanelOpen} 
      onClose={closeHelpPanel}
      onAskRedHat={showAskRedHat}
      isInline={true}
      activeTabKey={activeTabKey}
      onTabChange={setActiveTabKey}
    >
      <style>{dashboardStyle}</style>
      <PageSection>
        {/* Header Section */}
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <div style={{ maxWidth: '1566px', margin: '0 auto', width: '100%' }}>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                    <FlexItem>
                      <Title headingLevel="h1" size="2xl">
                        Hi, {userName}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Title headingLevel="h2" size="lg">
                        Welcome to your Hybrid Cloud Console dashboard.
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Content component="p" style={{ fontSize: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
                        My Company Name, Org. ID 6089719
                      </Content>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Button variant="link">
                        Reset to default
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="primary">
                        + Add widgets
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </div>
          </FlexItem>
          
          {/* Divider */}
          <FlexItem>
            <div style={{ maxWidth: '1566px', margin: '0 auto', width: '100%' }}>
              <Divider />
            </div>
          </FlexItem>
          
          {/* Service Cards Section */}
          <FlexItem>
            <div style={{ maxWidth: '1566px', margin: '0 auto', width: '100%' }}>
              <Gallery 
                hasGutter 
                minWidths={{
                  default: '280px',
                  sm: '280px',
                  md: '280px',
                  lg: '280px',
                  xl: '280px'
                }}
                maxWidths={{
                  default: 'none'
                }}
              >
              {/* What's new - Workspaces Card */}
              <Card isFullHeight className="subscriptions-extra-wide">
                <CardHeader>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h4" className="pf-v6-c-card__title">
                        Enhanced RBAC now available
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                        <FlexItem>
                          <Button variant="plain" aria-label="More actions">
                            <EllipsisVIcon />
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="plain" aria-label="Drag to reorder">
                            <GripVerticalIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }} style={{ height: '100%' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Content style={{ fontSize: '16px', lineHeight: '1.5' }}>
                        Role based access control (RBAC) for individual systems is now available. Workspaces give you Organization that matches Your business needs and simplifies Permission control.
                      </Content>
                    </FlexItem>
                    <FlexItem style={{ marginTop: 'auto' }}>
                      <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                        <FlexItem>
                          <Button 
                            variant="link" 
                            isInline
                            onClick={() => {
                              setShowConversionContent(true);
                              openHelpPanel(0);
                            }}
                          >
                            Learn more and convert
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
              
              <div className="lightspeed-card-container">
                <Card isFullHeight className="subscriptions-extra-wide">
                  <CardHeader>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <svg style={{ color: '#0066ff', width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                              <path d="M12 2v20M2 7l20 10M2 12l20 10"/>
                            </svg>
                          </FlexItem>
                          <FlexItem>
                            <Title headingLevel="h4" className="pf-v6-c-card__title">
                              Red Hat Lightspeed Summary
                            </Title>
                          </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                        <FlexItem>
                          <Button variant="plain" aria-label="More actions">
                            <EllipsisVIcon />
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="plain" aria-label="Drag to reorder">
                            <GripVerticalIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Flex direction={{ default: 'row' }} className="lightspeed-content-container">
                    {/* Optimization Section */}
                    <FlexItem flex={{ default: 'flex_1' }} style={{ padding: '16px', position: 'relative' }}>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ height: '100%' }}>
                        {/* Title and Badge */}
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                            <FlexItem>
                              <Title headingLevel="h5" size="md" style={{ textAlign: 'left', margin: 0 }}>Optimization</Title>
                            </FlexItem>
                            <FlexItem>
                              <Badge color="blue">Info</Badge>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* X Systems - Center aligned, 16pt font */}
                        <FlexItem style={{ textAlign: 'center', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Content style={{ fontSize: '16px', fontWeight: 'bold' }}>17 Systems</Content>
                        </FlexItem>
                        
                        {/* Description - Left aligned */}
                        <FlexItem>
                          <Content style={{ textAlign: 'left' }}>
                            17 systems have optimization recommendations.
                          </Content>
                        </FlexItem>
                        
                        {/* Reboot required - Center aligned */}
                        <FlexItem style={{ textAlign: 'center' }}>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                            <FlexItem>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <RebootingIcon style={{ fontSize: '14px', color: '#888' }} />
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '0',
                                  right: '0',
                                  height: '1px',
                                  backgroundColor: '#888',
                                  transform: 'translateY(-50%) rotate(45deg)',
                                  transformOrigin: 'center'
                                }}></div>
                              </div>
                            </FlexItem>
                            <FlexItem>
                              <Content component="small">Reboot: not required</Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* Learn more - Left aligned at bottom */}
                        <FlexItem style={{ marginTop: 'auto' }}>
                          <Button variant="link" isInline style={{ textAlign: 'left', padding: 0 }}>
                            Learn more →
                          </Button>
                        </FlexItem>
                      </Flex>
                      
                      {/* Vertical Divider */}
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '16px',
                        bottom: '16px',
                        width: '1px',
                        backgroundColor: '#d2d2d2'
                      }}></div>
                    </FlexItem>
                    
                    {/* Security Section */}
                    <FlexItem flex={{ default: 'flex_1' }} style={{ padding: '16px', position: 'relative' }}>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ height: '100%' }}>
                        {/* Title and Badge */}
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                            <FlexItem>
                              <Title headingLevel="h5" size="md" style={{ textAlign: 'left', margin: 0 }}>Security</Title>
                            </FlexItem>
                            <FlexItem>
                              <Badge color="warning" style={{ backgroundColor: '#f0ad4e', color: '#000' }}>Warning</Badge>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* X Systems - Center aligned, 16pt font */}
                        <FlexItem style={{ textAlign: 'center', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Content style={{ fontSize: '16px', fontWeight: 'bold' }}>1 System</Content>
                        </FlexItem>
                        
                        {/* Description - Left aligned */}
                        <FlexItem>
                          <Content style={{ textAlign: 'left' }}>
                            Your malware scanner flagged a suspicious shell script on your system.
                          </Content>
                        </FlexItem>
                        
                        {/* Reboot required - Center aligned */}
                        <FlexItem style={{ textAlign: 'center' }}>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                            <FlexItem>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <RebootingIcon style={{ fontSize: '14px', color: '#888' }} />
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '0',
                                  right: '0',
                                  height: '1px',
                                  backgroundColor: '#888',
                                  transform: 'translateY(-50%) rotate(45deg)',
                                  transformOrigin: 'center'
                                }}></div>
                              </div>
                            </FlexItem>
                            <FlexItem>
                              <Content component="small">Reboot: not required</Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* Learn more - Left aligned at bottom */}
                        <FlexItem style={{ marginTop: 'auto' }}>
                          <Button variant="link" isInline style={{ textAlign: 'left', padding: 0 }}>
                            Learn more →
                          </Button>
                        </FlexItem>
                      </Flex>
                      
                      {/* Vertical Divider */}
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '16px',
                        bottom: '16px',
                        width: '1px',
                        backgroundColor: '#d2d2d2'
                      }}></div>
                    </FlexItem>
                    
                    {/* Availability Section */}
                    <FlexItem flex={{ default: 'flex_1' }} style={{ padding: '16px' }}>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ height: '100%' }}>
                        {/* Title and Badge */}
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                            <FlexItem>
                              <Title headingLevel="h5" size="md" style={{ textAlign: 'left', margin: 0 }}>Availability</Title>
                            </FlexItem>
                            <FlexItem>
                              <Badge color="red" style={{ backgroundColor: '#d32f2f', color: '#fff' }}>Incident</Badge>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* X Systems - Center aligned, 16pt font */}
                        <FlexItem style={{ textAlign: 'center', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Content style={{ fontSize: '16px', fontWeight: 'bold' }}>26 Systems</Content>
                        </FlexItem>
                        
                        {/* Description - Left aligned */}
                        <FlexItem>
                          <Content style={{ textAlign: 'left' }}>
                            Fine tune your Oracle DB configuration to improve database performance and avoid
                          </Content>
                        </FlexItem>
                        
                        {/* Reboot required - Center aligned */}
                        <FlexItem style={{ textAlign: 'center' }}>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                            <FlexItem>
                              <RebootingIcon style={{ fontSize: '14px', color: '#888' }} />
                            </FlexItem>
                            <FlexItem>
                              <Content component="small">Reboot: required</Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* Learn more - Left aligned at bottom */}
                        <FlexItem style={{ marginTop: 'auto' }}>
                          <Button variant="link" isInline style={{ textAlign: 'left', padding: 0 }}>
                            Learn more →
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
              </div>
              
              <Card isFullHeight className="settings-card-wide recently-visited-card">
                <CardHeader>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h4" className="pf-v6-c-card__title">
                        Recently Visited
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                        <FlexItem>
                          <Button variant="plain" aria-label="More actions">
                            <EllipsisVIcon />
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="plain" aria-label="Drag to reorder">
                            <GripVerticalIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Content>
                        Quick access to your most recently visited services and resources.
                      </Content>
                    </FlexItem>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <List isPlain>
                        <ListItem>
                          <Button variant="link" onClick={() => navigate('/dashboard')}>
                            Dashboard
                          </Button>
                        </ListItem>
                        <ListItem>
                          <Button variant="link" onClick={() => navigate('/alert-manager')}>
                            Alert Manager
                          </Button>
                        </ListItem>
                      </List>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
              
              <Card isFullHeight className="settings-card-wide">
                <CardHeader>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h4" className="pf-v6-c-card__title">
                        Settings
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                        <FlexItem>
                          <Button variant="plain" aria-label="More actions">
                            <EllipsisVIcon />
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="plain" aria-label="Drag to reorder">
                            <GripVerticalIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                            <FlexItem>
                              <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                Recently fired events
                              </Content>
                            </FlexItem>
                            <FlexItem>
                              <Content component="p" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                7
                              </Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                            <FlexItem>
                              <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                All data integrations
                              </Content>
                            </FlexItem>
                            <FlexItem>
                              <Content component="p" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                12
                              </Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
              
              <Card isFullHeight className="events-card-extra-wide">
                <CardHeader>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <BellIcon style={{ color: '#0066cc' }} />
                        </FlexItem>
                        <FlexItem>
                          <Title headingLevel="h4" className="pf-v6-c-card__title">
                            Events
                          </Title>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="link" size="sm" onClick={() => navigate('/event-log')}>
                            View event log
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                        <FlexItem>
                          <Button variant="plain" aria-label="More actions">
                            <EllipsisVIcon />
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="plain" aria-label="Drag to reorder">
                            <GripVerticalIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    {/* Table Header */}
                    <FlexItem>
                      <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsNone' }}>
                        <FlexItem flex={{ default: 'flex_1' }}>
                          <Content component="small" style={{ fontWeight: 'bold', color: 'var(--pf-v6-global--Color--200)' }}>
                            Event
                          </Content>
                        </FlexItem>
                        <FlexItem flex={{ default: 'flex_1' }}>
                          <Content component="small" style={{ fontWeight: 'bold', color: 'var(--pf-v6-global--Color--200)' }}>
                            Service
                          </Content>
                        </FlexItem>
                        <FlexItem flex={{ default: 'flex_1' }}>
                          <Content component="small" style={{ fontWeight: 'bold', color: 'var(--pf-v6-global--Color--200)' }}>
                            Date
                          </Content>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    
                    {/* Divider */}
                    <FlexItem>
                      <Divider />
                    </FlexItem>
                    
                    {/* Table Rows */}
                    <FlexItem>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsNone' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content component="small">Policy triggered</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content component="small">Policies - Red Hat Enterprise Linux</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content component="small">3 May 2023, 13:45 UTC</Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        <FlexItem>
                          <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsNone' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content component="small">Policy triggered</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content component="small">Policies - Red Hat Enterprise Linux</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content component="small">3 May 2023, 13:45 UTC</Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </Gallery>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>
    </Help>
  );
};

export { Dashboard2 };
