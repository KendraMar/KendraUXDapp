import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  Checkbox,
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Label,
  List,
  ListItem,
  Select,
  SelectList,
  SelectOption,
  Tab,
  TabAction,
  TabTitleText,
  Tabs,
  TextInput,
  Title
} from '@patternfly/react-core';
import {
  BookmarkIcon,
  CheckIcon,
  CommentsIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
  HelpIcon,
  InfoCircleIcon,
  PaperPlaneIcon,
  PlusIcon,
  TimesIcon,
  StarIcon
} from '@patternfly/react-icons';
import { useHelpPanel } from './HelpPanelProvider';

interface LearningResource {
  id: string;
  title: string;
  description: string;
  contentType: 'Learning path' | 'Documentation' | 'Quick start' | 'Other';
  tags: string[];
  isBookmarked: boolean;
  hasChatIcon?: boolean;
}

interface HelpPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  onAskRedHat?: () => void;
  isInline?: boolean; // For docked panel mode
  children?: React.ReactNode; // Main content when used inline
  activeTabKey?: string | number; // External control of active tab
  onTabChange?: (tabKey: string | number) => void; // Callback when tab changes
}

const HelpPanel: React.FunctionComponent<HelpPanelProps> = ({ isOpen, onClose, onAskRedHat, isInline = false, children, activeTabKey: externalActiveTabKey, onTabChange }) => {
  const { showConversionContent, setShowConversionContent } = useHelpPanel();
  const [internalActiveTabKey, setInternalActiveTabKey] = React.useState<string | number>(0); // Start with "Interact" tab active
  const activeTabKey = externalActiveTabKey !== undefined ? externalActiveTabKey : internalActiveTabKey;
  const setActiveTabKey = (tabKey: string | number) => {
    if (externalActiveTabKey === undefined) {
      setInternalActiveTabKey(tabKey);
    }
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };
  const [contentType, setContentType] = React.useState<string>('All');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = React.useState(false);
  const [isContentTypeOpen, setIsContentTypeOpen] = React.useState(false);
  const [interactInputValue, setInteractInputValue] = React.useState('');
  const [showAIPrivacyAlert, setShowAIPrivacyAlert] = React.useState(true);

  // Setup steps data
  const setupSteps = [
    {
      id: 'setup-notifications',
      title: 'Set up notifications',
      completed: true
    },
    {
      id: 'connect-public-clouds',
      title: 'Connect to public clouds',
      completed: false
    },
    {
      id: 'verify-access-control',
      title: 'Verify access control',
      completed: false
    },
    {
      id: 'customize-dashboard',
      title: 'Customize your dashboard',
      completed: false
    },
    {
      id: 'other-setup-step',
      title: 'Other setup step',
      completed: false
    },
    {
      id: 'configure-third-party-idp',
      title: 'Configure Third Party IdP',
      completed: true
    }
  ];

  // Learning resources data matching the image
  const learningResources: LearningResource[] = [
    {
      id: '1',
      title: 'Image Builder',
      description: '',
      contentType: 'Documentation',
      tags: ['Insights'],
      isBookmarked: false
    },
    {
      id: '2',
      title: 'Analyzing systems for an in-place upgrade from RHEL 8',
      description: '',
      contentType: 'Quick start',
      tags: ['Insights'],
      isBookmarked: false
    },
    {
      id: '3',
      title: 'Configuring console event notifications in Slack',
      description: '',
      contentType: 'Quick start',
      tags: ['Settings'],
      isBookmarked: false
    },
    {
      id: '4',
      title: 'Related documentation for OpenShift AI',
      description: '',
      contentType: 'Documentation',
      tags: ['Application-services', 'OpenShift'],
      isBookmarked: false
    },
    {
      id: '5',
      title: 'Learn about OpenShift AI resources',
      description: '',
      contentType: 'Learning path',
      tags: ['Application-services', 'OpenShift'],
      isBookmarked: false
    },
    {
      id: '6',
      title: 'Learn how to try OpenShift AI',
      description: '',
      contentType: 'Learning path',
      tags: ['Application-services', 'OpenShift'],
      isBookmarked: false
    },
    {
      id: '7',
      title: 'Visualizing costs',
      description: '',
      contentType: 'Documentation',
      tags: ['Insights'],
      isBookmarked: false
    },
    {
      id: '8',
      title: 'Analyzing your cost data',
      description: '',
      contentType: 'Documentation',
      tags: ['Insights'],
      isBookmarked: false
    },
    {
      id: '9',
      title: 'Managing costs using cost models',
      description: '',
      contentType: 'Documentation',
      tags: ['Insights'],
      isBookmarked: false
    }
  ];

  const handleTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const handleContentTypeToggle = () => {
    setIsContentTypeOpen(!isContentTypeOpen);
  };

  const handleContentTypeSelect = (event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setContentType(value as string);
    setIsContentTypeOpen(false);
  };

  const filteredResources = learningResources.filter(resource => {
    if (showBookmarkedOnly && !resource.isBookmarked) {
      return false;
    }
    if (contentType !== 'All' && resource.contentType !== contentType) {
      return false;
    }
    return true;
  });

  const getContentTypeColor = (type: string): 'blue' | 'orange' | 'green' | 'purple' => {
    switch (type) {
      case 'Learning path':
        return 'green';
      case 'Documentation':
        return 'orange';
      case 'Quick start':
        return 'blue';
      case 'Other':
        return 'blue';
      default:
        return 'blue';
    }
  };

  const drawerPanelContent = (
    <DrawerPanelContent defaultSize="600px" minSize="400px" style={{ overflow: 'hidden' }}>
      <style>{`
        .help-drawer-content::-webkit-scrollbar {
          display: none;
        }
        .help-drawer-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .help-drawer-content .pf-v6-c-tabs__panel {
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>
      <DrawerHead>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h2" size="xl">Maybe Help as a title won't work?</Title>
          </FlexItem>
          <FlexItem>
            {onClose && (
              <Button
                variant="plain"
                onClick={onClose}
                aria-label="Close"
                icon={<TimesIcon />}
              />
            )}
          </FlexItem>
        </Flex>
      </DrawerHead>
      <DrawerContentBody className="help-drawer-content" style={{ overflowY: 'auto', overflowX: 'hidden', padding: 0 }}>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
            <Tab
              eventKey={0}
              title={<TabTitleText>Interact</TabTitleText>}
              aria-label="Interact tab"
            >
              <div style={{ 
                padding: '24px',
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                backgroundColor: '#f5f5f5'
              }}>
                {showConversionContent ? (
                  /* Conversion Content */
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {/* AI Privacy Alert */}
                    {showAIPrivacyAlert && (
                      <Card style={{
                        backgroundColor: 'white',
                        border: '1px solid #6a1b9a',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        position: 'relative'
                      }}>
                        <CardBody style={{ padding: '16px' }}>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                            {/* Header with icon, title, and close button */}
                            <FlexItem>
                              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem>
                                  <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                    <FlexItem>
                                      <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: '#6a1b9a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <InfoCircleIcon style={{ color: 'white', fontSize: '12px' }} />
                                      </div>
                                    </FlexItem>
                                    <FlexItem>
                                      <Title headingLevel="h4" size="md" style={{ fontWeight: 'bold', color: '#151515', margin: 0 }}>
                                        Important
                                      </Title>
                                    </FlexItem>
                                  </Flex>
                                </FlexItem>
                                <FlexItem>
                                  <Button
                                    variant="plain"
                                    aria-label="Close"
                                    onClick={() => setShowAIPrivacyAlert(false)}
                                    style={{ padding: '4px' }}
                                  >
                                    <TimesIcon style={{ color: '#151515' }} />
                                  </Button>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                            
                            {/* Content */}
                            <FlexItem>
                              <Content style={{ fontSize: '14px', color: '#151515', lineHeight: '1.5' }}>
                                This feature uses AI technology. Do not include personal or sensitive information in your input. Interactions may be used to improve Red Hat's products or services. For more information about Red Hat's privacy practices, please refer to the{' '}
                                <Button
                                  variant="link"
                                  isInline
                                  component="a"
                                  href="https://www.redhat.com/en/about/privacy-policy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ padding: 0, fontSize: '14px' }}
                                >
                                  Red Hat Privacy Statement
                                </Button>
                                .
                              </Content>
                            </FlexItem>
                            
                            {/* Got it button */}
                            <FlexItem>
                              <Button
                                variant="secondary"
                                onClick={() => setShowAIPrivacyAlert(false)}
                                style={{
                                  borderColor: '#0066cc',
                                  color: '#0066cc',
                                  backgroundColor: 'white'
                                }}
                              >
                                Got it
                              </Button>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    )}
                    
                    <Title headingLevel="h2" size="xl" style={{ fontWeight: 'bold', color: '#151515', marginBottom: '16px' }}>
                      Convert to workspace-based access management
                    </Title>
                    <Content style={{ fontSize: '16px', color: '#151515', marginBottom: '24px' }}>
                      Before converting, please review the following information carefully.
                    </Content>

                    {/* Warning Box */}
                    <Alert
                      variant="warning"
                      title={
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <ExclamationTriangleIcon style={{ color: '#856404' }} />
                          </FlexItem>
                          <FlexItem>
                            <strong>Conversion is permanent</strong>
                          </FlexItem>
                        </Flex>
                      }
                      style={{ marginBottom: '24px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}
                    >
                      Once you convert to workspace-based access management, you cannot revert back to the previous experience. All existing permissions will be preserved, but the organizational structure will change.
                    </Alert>

                    {/* Section 1 */}
                    <div style={{ marginBottom: '24px' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: '12px' }}>
                        <FlexItem>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#c9190b',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            1
                          </div>
                        </FlexItem>
                        <FlexItem>
                          <Title headingLevel="h3" size="lg" style={{ fontWeight: 'bold', color: '#151515', margin: 0 }}>
                            What happens during conversion
                          </Title>
                        </FlexItem>
                      </Flex>
                      <div style={{ marginLeft: '32px' }}>
                        <Content style={{ fontSize: '16px', color: '#151515', marginBottom: '12px' }}>
                          A workspace hierarchy will be created:
                        </Content>
                        <List>
                          <ListItem>
                            <strong>Root workspace:</strong> Created at top level for organization-wide access
                          </ListItem>
                          <ListItem>
                            <strong>Default workspace:</strong> Created under Root; existing workspaces move here as subworkspaces
                          </ListItem>
                          <ListItem>
                            <strong>Ungrouped Assets workspace:</strong> Created under Default for existing systems not yet in a workspace
                          </ListItem>
                        </List>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div style={{ marginBottom: '24px' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: '12px' }}>
                        <FlexItem>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#c9190b',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            2
                          </div>
                        </FlexItem>
                        <FlexItem>
                          <Title headingLevel="h3" size="lg" style={{ fontWeight: 'bold', color: '#151515', margin: 0 }}>
                            How permissions change
                          </Title>
                        </FlexItem>
                      </Flex>
                      <div style={{ marginLeft: '32px' }}>
                        <List>
                          <ListItem>
                            <strong>Default Admin Access:</strong> Scoped to root workspace (all workspaces)
                          </ListItem>
                          <ListItem>
                            <strong>Default Access:</strong> Scoped to default workspace and subworkspaces only
                          </ListItem>
                          <ListItem>
                            <strong>Custom groups:</strong> Preserved with all memberships intact
                          </ListItem>
                        </List>
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div style={{ marginBottom: '24px' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: '12px' }}>
                        <FlexItem>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#c9190b',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            3
                          </div>
                        </FlexItem>
                        <FlexItem>
                          <Title headingLevel="h3" size="lg" style={{ fontWeight: 'bold', color: '#151515', margin: 0 }}>
                            Post-conversion requirements
                          </Title>
                        </FlexItem>
                      </Flex>
                      <div style={{ marginLeft: '32px' }}>
                        <Content style={{ fontSize: '16px', color: '#151515' }}>
                          You'll need to complete several tasks within one week of conversion, including organizing the Ungrouped Assets workspace and verifying user access.
                        </Content>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #d2d2d2' }}>
                      <FlexItem>
                        <Button variant="secondary">
                          Continue to convert
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="link" onClick={() => setShowConversionContent(false)}>
                          Cancel
                        </Button>
                      </FlexItem>
                    </Flex>
                  </div>
                ) : (
                  /* Setup Tasks Progress Tracker */
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Title headingLevel="h2" size="xl" style={{ fontWeight: 'bold', color: '#151515', marginBottom: '16px' }}>
                      {setupSteps.filter(step => step.completed).length} of {setupSteps.length} HCC setup tasks complete
                    </Title>
                    <Card style={{
                      border: '1px solid #d2d2d2',
                      borderRadius: '8px',
                      backgroundColor: 'white'
                    }}>
                      <CardBody style={{ padding: '16px' }}>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                          {setupSteps.map((step) => (
                            <FlexItem key={step.id}>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                                <FlexItem>
                                  {step.completed ? (
                                    <div style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      backgroundColor: '#0066cc',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      <CheckIcon style={{ color: 'white', fontSize: '12px' }} />
                                    </div>
                                  ) : (
                                    <div style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      border: '2px dashed #d2d2d2',
                                      backgroundColor: 'transparent',
                                      flexShrink: 0
                                    }} />
                                  )}
                                </FlexItem>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                  <Content style={{ 
                                    color: '#151515',
                                    fontSize: '14px'
                                  }}>
                                    {step.title}
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                          ))}
                        </Flex>
                      </CardBody>
                    </Card>
                  </div>
                )}
                
                {/* Spacer to push input to bottom */}
                <div style={{ flex: '0 0 auto' }} />
                
                {/* Input field at the bottom */}
                <div style={{ paddingTop: '24px', flexShrink: 0 }}>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <TextInput
                        type="text"
                        placeholder="Send a message..."
                        value={interactInputValue}
                        onChange={(_, value) => setInteractInputValue(value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && interactInputValue.trim()) {
                            // Handle submit - could trigger action based on input
                            console.log('Interact tab input submitted:', interactInputValue);
                            setInteractInputValue('');
                          }
                        }}
                        style={{ 
                          width: '100%',
                          borderRadius: '24px',
                          paddingRight: '48px',
                          paddingLeft: '16px',
                          height: '48px',
                          backgroundColor: 'white',
                          border: '1px solid #d2d2d2'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (interactInputValue.trim()) {
                            console.log('Interact tab input submitted:', interactInputValue);
                            setInteractInputValue('');
                          }
                        }}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: interactInputValue.trim() ? 'pointer' : 'default',
                          padding: '8px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        disabled={!interactInputValue.trim()}
                      >
                        <PaperPlaneIcon style={{ 
                          color: '#0066cc', 
                          fontSize: '20px',
                          opacity: interactInputValue.trim() ? 1 : 0.5
                        }} />
                      </button>
                    </div>
                  </FlexItem>
                  <FlexItem>
                    <Content style={{ 
                      fontSize: '12px', 
                      color: '#6a6e73', 
                      textAlign: 'center',
                      marginTop: '8px'
                    }}>
                      Always review AI generated content prior to use.
                    </Content>
                  </FlexItem>
                </Flex>
                </div>
              </div>
            </Tab>
            <Tab
              eventKey={1}
              title={<TabTitleText>Learn</TabTitleText>}
              aria-label="Learn tab"
            >
              <div style={{ padding: '24px' }}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>

                  {/* Introductory text */}
                  <FlexItem>
                    <Content>
                      Find product documentation, quick starts, learning paths, and more. For a more detailed view, browse the{' '}
                      <Button
                        variant="link"
                        isInline
                        component="a"
                        href="https://docs.redhat.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        All Learning Catalog
                      </Button>
                      .
                    </Content>
                  </FlexItem>

                  {/* Filter options */}
                  <FlexItem>
                    <Flex spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <Select
                          isOpen={isContentTypeOpen}
                          onOpenChange={setIsContentTypeOpen}
                          selected={contentType}
                          onSelect={handleContentTypeSelect}
                          toggle={(toggleRef: React.Ref<HTMLButtonElement>) => (
                            <Button
                              ref={toggleRef}
                              variant="secondary"
                              onClick={handleContentTypeToggle}
                              style={{ minWidth: '150px' }}
                            >
                              Content type
                            </Button>
                          )}
                        >
                          <SelectList>
                            <SelectOption value="All">All</SelectOption>
                            <SelectOption value="Learning path">Learning path</SelectOption>
                            <SelectOption value="Documentation">Documentation</SelectOption>
                            <SelectOption value="Quick start">Quick start</SelectOption>
                            <SelectOption value="Other">Other</SelectOption>
                          </SelectList>
                        </Select>
                      </FlexItem>
                      <FlexItem>
                        <Checkbox
                          id="show-bookmarked-only-learn"
                          label="Show bookmarked only"
                          isChecked={showBookmarkedOnly}
                          onChange={(event, checked) => setShowBookmarkedOnly(checked)}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  {/* Learning resources list */}
                  <FlexItem>
                    <Title headingLevel="h2" size="lg" style={{ marginBottom: '16px' }}>
                      Learning resources ({filteredResources.length})
                    </Title>
                    <DataList aria-label="Learning resources list" isCompact>
                      {filteredResources.map((resource) => (
                        <DataListItem key={resource.id}>
                          <DataListItemRow>
                            <DataListItemCells
                              dataListCells={[
                                <DataListCell key="bookmark" width={1}>
                                  <Button
                                    variant="plain"
                                    aria-label={resource.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                                    icon={<BookmarkIcon />}
                                    style={{
                                      color: resource.isBookmarked ? '#f0ab00' : '#6a6e73'
                                    }}
                                  />
                                  {resource.hasChatIcon && (
                                    <CommentsIcon
                                      style={{
                                        marginLeft: '8px',
                                        color: '#6a1b9a',
                                        fontSize: '16px'
                                      }}
                                    />
                                  )}
                                </DataListCell>,
                                <DataListCell key="content" width={4}>
                                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                    <FlexItem>
                                      <Button
                                        variant="link"
                                        isInline
                                        icon={resource.title.includes('OpenShift') ? <ExternalLinkAltIcon /> : undefined}
                                        iconPosition="end"
                                        style={{
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          padding: 0,
                                          textAlign: 'left'
                                        }}
                                      >
                                        {resource.title}
                                      </Button>
                                    </FlexItem>
                                  </Flex>
                                </DataListCell>,
                                <DataListCell key="tags" width={1}>
                                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsFlexEnd' }}>
                                    <FlexItem>
                                      <Label color={getContentTypeColor(resource.contentType)}>
                                        {resource.contentType}
                                      </Label>
                                    </FlexItem>
                                    <FlexItem>
                                      <Flex wrap="wrap" spaceItems={{ default: 'spaceItemsXs' }} style={{ justifyContent: 'flex-end' }}>
                                        {resource.tags.map((tag, index) => (
                                          <Label key={index} color="grey" isCompact>
                                            {tag}
                                          </Label>
                                        ))}
                                      </Flex>
                                    </FlexItem>
                                  </Flex>
                                </DataListCell>
                              ]}
                            />
                          </DataListItemRow>
                        </DataListItem>
                      ))}
                    </DataList>
                  </FlexItem>
                </Flex>
              </div>
            </Tab>
            <Tab eventKey={2} title={<TabTitleText>APIs</TabTitleText>} aria-label="APIs tab">
              <div style={{ padding: '24px' }}>
                <Content>API documentation coming soon...</Content>
              </div>
            </Tab>
            <Tab eventKey={3} title={<TabTitleText>My support cases</TabTitleText>} aria-label="My support cases tab">
              <div style={{ padding: '24px' }}>
                <Content>Support cases coming soon...</Content>
              </div>
            </Tab>
          </Tabs>
      </DrawerContentBody>
    </DrawerPanelContent>
  );

  // Always render the drawer structure when isInline is true, just control expansion
  if (isInline) {
    React.useEffect(() => {
      console.log('Help component (inline):', { isOpen, isInline, hasChildren: !!children });
    }, [isOpen, isInline, children]);
    
    return (
      <>
        <style>{`
          .help-drawer-main-content::-webkit-scrollbar {
            display: none;
          }
          .help-drawer-main-content {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <Drawer isExpanded={isOpen} isInline={true} position="right">
          <DrawerContent panelContent={drawerPanelContent}>
            <div className="help-drawer-main-content" style={{ overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
              {children || <div />}
            </div>
          </DrawerContent>
        </Drawer>
    
        {/* Floating Feedback Button */}
        {isOpen && !isInline && (
          <div
            style={{
              position: 'fixed',
              right: '624px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10001,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Button
              variant="primary"
              onClick={() => {
                console.log('Feedback button clicked');
              }}
              style={{
                backgroundColor: '#0066cc',
                borderColor: '#0066cc',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                padding: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Feedback"
            >
              <CommentsIcon style={{ fontSize: '24px', color: 'white' }} />
            </Button>
            <div
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                color: '#151515',
                whiteSpace: 'nowrap'
              }}
            >
              Feedback
            </div>
          </div>
        )}
      </>
    );
  }

  // Non-inline mode (overlay drawer)
  if (!isOpen) {
    return children ? <>{children}</> : null;
  }

  return (
    <>
      <Drawer isExpanded={isOpen} isInline={false} position="right">
        <DrawerContent panelContent={drawerPanelContent}>
          {children}
        </DrawerContent>
      </Drawer>
      {/* Floating Feedback Button */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: '624px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Button
            variant="primary"
            onClick={() => {
              console.log('Feedback button clicked');
            }}
            style={{
              backgroundColor: '#0066cc',
              borderColor: '#0066cc',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              padding: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Feedback"
          >
            <CommentsIcon style={{ fontSize: '24px', color: 'white' }} />
          </Button>
          <div
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              color: '#151515',
              whiteSpace: 'nowrap'
            }}
          >
            Feedback
          </div>
        </div>
      )}
    </>
  );
};

export { HelpPanel };
export { HelpPanel as Help }; // Keep backward compatibility

