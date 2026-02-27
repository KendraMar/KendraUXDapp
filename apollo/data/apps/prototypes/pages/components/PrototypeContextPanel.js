import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  Divider,
  DrilldownMenu,
  MenuToggle,
  Popper,
  Card,
  CardTitle,
  CardBody,
  Stack,
  StackItem,
  Title,
  List,
  ListItem,
  Button,
  Content,
  Alert,
  AlertActionLink,
  AlertActionCloseButton,
  ProgressStepper,
  ProgressStep,
  TextInput,
  Flex,
  FlexItem,
  Label
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td
} from '@patternfly/react-table';
import { 
  ExternalLinkAltIcon, 
  OptimizeIcon,
  ClipboardCheckIcon,
  FolderIcon,
  ChatIcon,
  AngleUpIcon,
  PlusIcon
} from '@patternfly/react-icons';

// Default dummy data from Apollo-old prototypes
const defaultOverview = {
  title: 'What is this?',
  description: 'This is the AI Assets page that displays a list of model endpoints that the user can consume simply by creating an API key.',
  rationale: 'Making it easier to provide models-as-a-service to internal AI Engineers is one of the top requests we\'ve heard from customers via our field teams. Customers are looking for something that\'s well-integrated with the rest of the OpenShift platform.',
  personas: [
    { name: 'AI Engineer', need: 'Get self-service access to model inference API endpoints without needing to wait for approval.' },
    { name: 'AI Platform Engineer', need: 'Enable AIEs with self-service access to model inference API endpoints.' }
  ],
  deliverables: '3.0 includes a new model deployment wizard that you can access by clicking "Deploy Model" from this page. Not much changes on this list page itself.',
  team: [
    { name: 'Jonathan Zarecki', role: 'PM' },
    { name: 'Alessandro Lazarotti', role: 'ENG Lead' },
    { name: 'Daniele Zonca', role: 'Architect' },
    { name: 'Yuan Tang', role: 'Staff' },
    { name: 'Lindani Phiri', role: 'Security Architect' },
    { name: 'Andy Braren', role: 'Designer' }
  ]
};

const defaultHistory = [
  { id: 'h1', title: 'Design Review this Thursday', description: 'Iteration 4 is on the agenda for Thursday\'s Stakeholder Review meeting.', status: 'pending', date: null },
  { id: 'h2', title: 'Iteration 4 created', description: 'Gabriel created a new iteration of this design to include a Panda Stack reboot form based on the recent architecture decision.', status: 'success', date: '2025-01-15T15:45:00' },
  { id: 'h3', title: 'Jira: architects agree that Panda Stack needs to be rebooted', description: 'Due to technical restrictions with Panda Stack for 3.0, the Playground will have to be rebooted.', status: 'danger', date: '2025-01-12T11:20:00' },
  { id: 'h4', title: 'Slack: Jason discovered that Panda Stack may need to restart after config changes', description: 'Updated tab interface with cleaner visual design, improved contrast ratios, and better touch targets.', status: 'warning', date: '2025-01-08T14:15:00' },
  { id: 'h5', title: 'Responsive Design Implementation', description: 'Currently implementing responsive breakpoints and mobile-first design patterns across all components.', status: 'info', date: '2025-01-05T09:30:00' },
  { id: 'h6', title: 'Iteration 3 completed', description: 'Planning comprehensive color palette updates to align with latest brand guidelines and accessibility standards.', status: 'success', date: '2025-01-02T16:00:00' },
  { id: 'h7', title: 'Micro-interactions Framework', description: 'Scheduled implementation of advanced micro-interactions and animation system for enhanced user experience.', status: 'success', date: '2024-12-28T13:45:00' },
  { id: 'h8', title: 'Design review complete, more changes needed', description: 'This design was discussed at the Stakeholder Review meeting. The group agreed that the wizard needed some adjustments.', status: 'success', date: '2024-12-20T10:15:00' },
  { id: 'h9', title: 'Iteration 1 published', description: 'Established new design token system with PatternFly integration for consistent styling across components.', status: 'success', date: '2024-12-15T15:20:00' }
];

const defaultSources = {
  jira: [
    { title: 'RHOAIENG-12345: Feature Implementation', url: '#' },
    { title: 'RHOAIENG-12346: UI Component Updates', url: '#' },
    { title: 'RHOAIENG-12347: User Testing Results', url: '#' }
  ],
  drive: [
    { title: 'Red Hat AI 6-pager', url: '#' },
    { title: 'MaaS Worksheet', url: '#' },
    { title: 'MaaS Product Definition', url: '#' },
    { title: 'MaaS Architecture', url: '#' },
    { title: 'Observability Worksheet', url: '#' }
  ],
  slack: [
    { title: '#forum-openshift-ai', url: '#' },
    { title: '#wg-ai-hub-x-gen-ai-studio', url: '#' },
    { title: '#wg-rhoai-observability-ux', url: '#' }
  ]
};

// Overview Tab Component
const OverviewTab = () => {
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  return (
    <div style={{ padding: '16px 0px', height: '100%', overflow: 'auto' }}>
      <Stack hasGutter>
        <StackItem>
          <Content>
            {isAlertVisible && (
              <Alert
                variant="info"
                isInline
                title="Quick catchup"
                customIcon={<OptimizeIcon />}
                actionClose={<AlertActionCloseButton onClose={() => setIsAlertVisible(false)} />}
                actionLinks={
                  <>
                    <AlertActionLink onClick={() => {}}>
                      Start chat
                    </AlertActionLink>
                    <AlertActionLink onClick={() => {}}>
                      Customize
                    </AlertActionLink>
                  </>
                }
              >
                <p>
                  Since you last visited the team has updated the design twice. The first update improved some confusion around the setup wizard, and the second added a wizard to reboot Panda Stack based on a recent architectural decision for 3.0.
                </p>
                <p>
                  This summary was created for you based on your interests. Some details may be incorrect. Check the Log for more detailed, human-reviewed updates.
                </p>
              </Alert>
            )}
            
            <Content component="h3">{defaultOverview.title}</Content>
            <Content component="p">{defaultOverview.description}</Content>
            
            <Content component="h3">Why is it needed?</Content>
            <Content component="p">{defaultOverview.rationale}</Content>
            
            <Content component="h3">Who does it help?</Content>
            <Table aria-label="Personas table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Persona</Th>
                  <Th>Need</Th>
                </Tr>
              </Thead>
              <Tbody>
                {defaultOverview.personas.map((persona, index) => (
                  <Tr key={index}>
                    <Td>
                      <Button variant="link" isInline component="a" href="#">
                        {persona.name}
                      </Button>
                    </Td>
                    <Td>{persona.need}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            <Content component="h3">What are we delivering in 3.0?</Content>
            <Content component="p">{defaultOverview.deliverables}</Content>
            
            <Content component="h3">Who is working on this?</Content>
            <Table aria-label="Team members table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Role</Th>
                </Tr>
              </Thead>
              <Tbody>
                {defaultOverview.team.map((member, index) => (
                  <Tr key={index}>
                    <Td>
                      <Button variant="link" isInline component="a" href="#">
                        {member.name}
                      </Button>
                    </Td>
                    <Td>{member.role}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Content>
        </StackItem>
      </Stack>
    </div>
  );
};

// History Tab Component
const HistoryTab = () => {
  const getVariant = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'danger': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'pending': return 'pending';
      default: return 'success';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <Title headingLevel="h2" size="lg" style={{ marginBottom: '24px' }}>
        History
      </Title>

      <Content>
      </Content>
      
      <ProgressStepper isVertical aria-label="Design history progress stepper">
        {defaultHistory.map((item, index) => (
          <ProgressStep
            key={item.id}
            variant={getVariant(item.status)}
            description={`${formatDate(item.date)}${item.date ? ' - ' : ''}${item.description}`}
            id={`history-step-${index}`}
            titleId={`history-step-${index}-title`}
            isCurrent={item.status === 'info'}
          >
            {item.title}
          </ProgressStep>
        ))}
      </ProgressStepper>
    </div>
  );
};

// Sources Tab Component
const SourcesTab = () => {
  const renderLinkSection = (title, links, icon) => (
    <Card isCompact>
      <CardTitle>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          {icon && <FlexItem>{icon}</FlexItem>}
          <FlexItem>
            <Title headingLevel="h3" size="md">{title}</Title>
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>
        {links && links.length > 0 ? (
          <List isPlain>
            {links.map((link, index) => (
              <ListItem key={index}>
                <Button
                  variant="link"
                  isInline
                  icon={<ExternalLinkAltIcon />}
                  iconPosition="end"
                  component="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.title}
                </Button>
              </ListItem>
            ))}
          </List>
        ) : (
          <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
            No {title.toLowerCase()} links added yet.
          </Content>
        )}
      </CardBody>
    </Card>
  );

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h2" size="lg">Sources</Title>
        </StackItem>
        <StackItem>
          {renderLinkSection('Jira', defaultSources.jira, <ClipboardCheckIcon />)}
        </StackItem>
        <StackItem>
          {renderLinkSection('Drive', defaultSources.drive, <FolderIcon />)}
        </StackItem>
        <StackItem>
          {renderLinkSection('Slack', defaultSources.slack, <ChatIcon />)}
        </StackItem>
      </Stack>
    </div>
  );
};

// Chat Tab Component
const ChatTab = ({ isSelectMode, setIsSelectMode, selectedElement }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI assistant for Apollo Canvas. I can help you edit and improve your prototype. Use the 'Select Element' button in the toolbar to select elements, then ask for changes.",
      timestamp: new Date()
    }
  ]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: new Date()
      };

      const elementContext = selectedElement 
        ? ` (targeting: ${selectedElement.tagName}${selectedElement.id ? `#${selectedElement.id}` : ''})` 
        : '';

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I understand you want to: "${message}"${elementContext}. I'll help you implement this change to your prototype.`,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, userMessage, assistantMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '16px'
    }}>
      <Stack hasGutter style={{ height: '100%' }}>
        <StackItem>
          <Title headingLevel="h2" size="lg">Chat</Title>
        </StackItem>

        {/* Selected element indicator */}
        {selectedElement && (
          <StackItem>
            <Alert variant="info" isInline isPlain title="Element Selected">
              <code>{selectedElement.tagName}{selectedElement.id ? `#${selectedElement.id}` : ''}</code>
              {selectedElement.textContent && (
                <span style={{ marginLeft: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
                  "{selectedElement.textContent.substring(0, 30)}..."
                </span>
              )}
            </Alert>
          </StackItem>
        )}

        <StackItem isFilled>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardBody style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <Stack hasGutter>
                {chatHistory.map((msg) => (
                  <StackItem key={msg.id}>
                    <Flex direction={{ default: 'column' }}>
                      <FlexItem>
                        <small style={{ 
                          color: 'var(--pf-v6-global--Color--200)',
                          fontWeight: msg.type === 'user' ? 600 : 400
                        }}>
                          {msg.type === 'user' ? 'You' : 'AI Assistant'} • {formatTime(msg.timestamp)}
                        </small>
                      </FlexItem>
                      <FlexItem>
                        <p style={{ 
                          marginTop: '4px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: msg.type === 'user' 
                            ? 'var(--pf-v6-global--primary-color--100)' 
                            : 'var(--pf-v6-global--BackgroundColor--200)',
                          maxWidth: '85%',
                          margin: 0
                        }}>
                          {msg.content}
                        </p>
                      </FlexItem>
                    </Flex>
                  </StackItem>
                ))}
              </Stack>
            </CardBody>
          </Card>
        </StackItem>

        <StackItem>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
            borderRadius: '24px',
            border: '1px solid var(--pf-v6-global--BorderColor--200)'
          }}>
            <Button
              variant="plain"
              icon={<PlusIcon />}
              style={{
                minWidth: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
                border: '1px solid var(--pf-v6-global--BorderColor--200)'
              }}
              aria-label="Add attachment"
            />

            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
              borderRadius: '20px',
              padding: '8px 16px'
            }}>
              <TextInput
                value={message}
                onChange={(_, value) => setMessage(value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask for changes..."
                style={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '14px'
                }}
                aria-label="Chat input"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleSendMessage}
              isDisabled={!message.trim()}
              icon={<AngleUpIcon />}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none'
              }}
              aria-label="Send message"
            />
          </div>
        </StackItem>
      </Stack>
    </div>
  );
};

// Main Context Panel Component
const PrototypeContextPanel = ({ prototype, selectedScope, onScopeChange, isSelectMode, setIsSelectMode, selectedElement }) => {
  const [activeTabKey, setActiveTabKey] = useState('overview');
  
  // Menu drilldown state
  const [menuDrilledIn, setMenuDrilledIn] = useState([]);
  const [drilldownPath, setDrilldownPath] = useState([]);
  const [menuHeights, setMenuHeights] = useState({});
  const [activeMenu, setActiveMenu] = useState('scope-rootMenu');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const handleTabClick = (event, tabIndex) => {
    setActiveTabKey(tabIndex);
  };

  // Menu drilldown handlers
  const drillIn = (event, fromMenuId, toMenuId, pathId) => {
    setMenuDrilledIn([...menuDrilledIn, fromMenuId]);
    setDrilldownPath([...drilldownPath, pathId]);
    setActiveMenu(toMenuId);
  };

  const drillOut = (event, toMenuId) => {
    const menuDrilledInSansLast = menuDrilledIn.slice(0, menuDrilledIn.length - 1);
    const pathSansLast = drilldownPath.slice(0, drilldownPath.length - 1);
    setMenuDrilledIn(menuDrilledInSansLast);
    setDrilldownPath(pathSansLast);
    setActiveMenu(toMenuId);
  };

  const setHeight = (menuId, height) => {
    if (menuHeights[menuId] === undefined || (menuId !== 'scope-rootMenu' && menuHeights[menuId] !== height)) {
      setMenuHeights({ ...menuHeights, [menuId]: height });
    }
  };

  const onMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle click outside to close menu
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        toggleRef.current &&
        menuRef.current &&
        !toggleRef.current.contains(event.target) &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const onMenuSelect = (event, itemId) => {
    if (typeof itemId === 'string' && onScopeChange) {
      const option = prototype?.scope?.options?.find(o => o.id === itemId);
      if (option) {
        onScopeChange(option.label);
        setIsMenuOpen(false);
      }
    }
  };

  // Group scope options by type
  const scopeOptions = prototype?.scope?.options || [];
  const journeyOptions = scopeOptions.filter(o => o.type === 'journey');
  const featureOptions = scopeOptions.filter(o => o.type === 'feature');
  const defaultOptions = scopeOptions.filter(o => o.type === 'default' || !o.type);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Scope selector menu */}
      <div style={{ marginBottom: '0.5rem' }}>
        <Popper
          trigger={
            <MenuToggle
              ref={toggleRef}
              onClick={onMenuToggle}
              isExpanded={isMenuOpen}
              style={{ width: '100%' }}
            >
              Feature: {'MaaS' || 'MaaS'}
            </MenuToggle>
          }
          popper={
            <Menu
              ref={menuRef}
              id="scope-rootMenu"
              containsDrilldown
              drilldownItemPath={drilldownPath}
              drilledInMenus={menuDrilledIn}
              activeMenu={activeMenu}
              onDrillIn={drillIn}
              onDrillOut={drillOut}
              onGetMenuHeight={setHeight}
              onSelect={onMenuSelect}
            >
              <MenuContent menuHeight={`${menuHeights[activeMenu]}px`}>
                <MenuList>
                  {defaultOptions.map(option => (
                    <MenuItem key={option.id} itemId={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                  {journeyOptions.length > 0 && (
                    <MenuItem
                      itemId="group:journeys"
                      direction="down"
                      drilldownMenu={
                        <DrilldownMenu id="scope-drilldownMenuJourneys">
                          <MenuItem itemId="group:journeys_breadcrumb" direction="up">
                            Journeys
                          </MenuItem>
                          <Divider component="li" />
                          {journeyOptions.map(option => (
                            <MenuItem 
                              key={option.id} 
                              itemId={option.id}
                              description={option.description}
                            >
                              {option.label}
                            </MenuItem>
                          ))}
                        </DrilldownMenu>
                      }
                    >
                      Journeys
                    </MenuItem>
                  )}
                  {featureOptions.length > 0 && (
                    <MenuItem
                      itemId="group:features"
                      direction="down"
                      drilldownMenu={
                        <DrilldownMenu id="scope-drilldownMenuFeatures">
                          <MenuItem itemId="group:features_breadcrumb" direction="up">
                            Features
                          </MenuItem>
                          <Divider component="li" />
                          {featureOptions.map(option => (
                            <MenuItem 
                              key={option.id} 
                              itemId={option.id}
                              description={option.description}
                            >
                              {option.label}
                            </MenuItem>
                          ))}
                        </DrilldownMenu>
                      }
                    >
                      Features
                    </MenuItem>
                  )}
                </MenuList>
              </MenuContent>
            </Menu>
          }
          isVisible={isMenuOpen}
        />
      </div>
      
      {/* Tabs for navigation only */}
      <Tabs
        activeKey={activeTabKey}
        onSelect={handleTabClick}
        aria-label="Context panel tabs"
        role="region"
      >
        <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>} />
        <Tab eventKey="history" title={<TabTitleText>History</TabTitleText>} />
        <Tab eventKey="sources" title={<TabTitleText>Sources</TabTitleText>} />
        <Tab eventKey="chat" title={<TabTitleText>Chat</TabTitleText>} />
      </Tabs>
      
      {/* Content rendered conditionally based on active tab */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTabKey === 'overview' && <OverviewTab />}
        {activeTabKey === 'history' && <HistoryTab />}
        {activeTabKey === 'sources' && <SourcesTab />}
        {activeTabKey === 'chat' && (
          <ChatTab 
            isSelectMode={isSelectMode}
            setIsSelectMode={setIsSelectMode}
            selectedElement={selectedElement}
          />
        )}
      </div>
    </div>
  );
};

export default PrototypeContextPanel;
