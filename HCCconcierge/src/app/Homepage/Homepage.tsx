import * as React from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Content,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Gallery,
  List,
  ListItem,
  MenuToggle,
  PageSection,
  TextInput,
  Title
} from '@patternfly/react-core';
import { ServiceCard } from '@patternfly/react-component-groups';
import { 
  ArrowRightIcon, 
  BellIcon, 
  ChartLineIcon,
  ChevronDownIcon,
  ClockIcon,
  CloudIcon,
  CogIcon,
  CreditCardIcon,
  DesktopIcon,
  EllipsisVIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
  GripVerticalIcon,
  HandPointerIcon,
  PaperPlaneIcon,
  RebootingIcon,
  SearchIcon,
  ServerIcon,
  ShieldAltIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { SetupGuide } from '@app/SetupGuide/SetupGuide';
import { TellUsWhatYoudLikeToDoCard } from '@app/components/TellUsWhatYoudLikeToDoCard';
import { Help } from '@app/Help';
import { useAskRedHat } from '@app/AskRedHat';
import { useHelpPanel } from '@app/Help/HelpPanelProvider';

const Homepage: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { showAskRedHat } = useAskRedHat();
  const [showSetupGuide, setShowSetupGuide] = React.useState(false);
  const [isCustomViewsDropdownOpen, setIsCustomViewsDropdownOpen] = React.useState(false);
  const { isOpen: isHelpPanelOpen, activeTabKey, closeHelpPanel, setActiveTabKey } = useHelpPanel();

  // Check URL parameters for setup guide
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showSetupGuide') === 'true') {
      setShowSetupGuide(true);
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, []);
  const [hasCustomView, setHasCustomView] = React.useState(false);
  
  // Get user name (currently hardcoded, matching the username dropdown)
  const userName = "Kendra";

  // Check if user has a custom view (from URL params or localStorage)
  React.useEffect(() => {
    // For testing: clear localStorage to reset custom view status
    // Uncomment the line below to reset the custom view status
    localStorage.removeItem('hasCustomView');
    
    const urlParams = new URLSearchParams(window.location.search);
    const hasCustomViewParam = urlParams.get('hasCustomView') === 'true';
    const hasCustomViewStored = localStorage.getItem('hasCustomView') === 'true';
    
    console.log('Checking custom view status:', { hasCustomViewParam, hasCustomViewStored });
    
    // Only set to true if explicitly coming from saving a custom view
    if (hasCustomViewParam) {
      console.log('Setting hasCustomView to true from URL param');
      setHasCustomView(true);
      // Clean up URL param
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (hasCustomViewStored) {
      // Only use localStorage if it was set from a previous save
      console.log('Setting hasCustomView to true from localStorage');
      setHasCustomView(true);
    } else {
      console.log('hasCustomView remains false - no custom view saved');
    }
    // Otherwise, hasCustomView remains false (default)
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCustomViewsDropdownOpen) {
        const dropdown = document.querySelector('[data-custom-views-dropdown]');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsCustomViewsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomViewsDropdownOpen]);

  // CSS styles for explore capability cards hover effects and column spans
  const cardHoverStyle = `
    /* Fluorescent arrow styles */
    .fluorescent-arrow {
      display: block;
      margin-top: 4px;
      animation: pulse 2s infinite;
      background: white;
      border-radius: 50%;
      padding: 4px;
      box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .pulsing-arrow-pointer {
      position: absolute;
      top: 20px;
      right: 20px;
      animation: pulse 2s infinite;
      background: #ff1493;
      border-radius: 50%;
      padding: 4px;
      box-shadow: 0 0 15px rgba(255, 20, 147, 0.8);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    
    .pulsing-arrow-pointer svg {
      color: white;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
      animation: glow 1.5s ease-in-out infinite alternate;
    }
    
    .fluorescent-arrow svg {
      filter: drop-shadow(0 0 15px #ff1493) drop-shadow(0 0 30px #ff1493) drop-shadow(0 0 45px #ff1493);
      animation: glow 1.5s ease-in-out infinite alternate;
    }
    
    @keyframes pulse {
      0% { opacity: 1; transform: translateY(-50%) scale(1); }
      50% { opacity: 0.8; transform: translateY(-50%) scale(1.2); }
      100% { opacity: 1; transform: translateY(-50%) scale(1); }
    }
    
    @keyframes glow {
      from { filter: drop-shadow(0 0 15px #ff1493) drop-shadow(0 0 30px #ff1493) drop-shadow(0 0 45px #ff1493); }
      to { filter: drop-shadow(0 0 25px #ff1493) drop-shadow(0 0 50px #ff1493) drop-shadow(0 0 75px #ff1493); }
    }
    
    /* Position the arrow relative to the Lightspeed card */
    .lightspeed-card-container {
      position: relative;
    }
    .pf-v6-c-card.explore-capability-card {
      cursor: pointer !important;
      border: 1px solid var(--pf-v6-global--BorderColor--100) !important;
      transition: all 0.2s ease-in-out !important;
    }
    .pf-v6-c-card.explore-capability-card:hover {
      border: 1px solid var(--pf-v6-global--primary-color--100) !important;
      box-shadow: var(--pf-v6-global--BoxShadow--md) !important;
      background-color: var(--pf-v6-global--BackgroundColor--300) !important;
      transform: translateY(-2px) !important;
    }
    .pf-v6-c-card.explore-capability-card:active {
      transform: translateY(0px) !important;
    }
    /* Ensure proper wrapping behavior for all screen sizes */
    .pf-v6-l-gallery {
      flex-wrap: wrap !important;
      display: flex !important;
    }
    .pf-v6-l-gallery > * {
      flex-shrink: 1 !important;
      flex-grow: 1 !important;
      min-width: 280px !important;
    }
    
    /* Override PatternFly Gallery defaults for custom sized cards */
    .pf-v6-l-gallery > .settings-card-wide,
    .pf-v6-l-gallery > .explore-capabilities-wide,
    .pf-v6-l-gallery > .subscriptions-extra-wide,
    .pf-v6-l-gallery > .events-card-extra-wide {
      flex-grow: 0 !important;
    }
    
    /* Recently Visited card - size to content */
    .pf-v6-c-card.recently-visited-card {
      height: auto !important;
      display: flex !important;
      flex-direction: column !important;
      align-self: flex-start !important;
    }
    
    .pf-v6-c-card.recently-visited-card .pf-v6-c-card__body {
      flex-grow: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: visible !important;
    }
    
    /* Make first row cards (RHEL, OpenShift, Ansible) same height */
    .pf-v6-c-card.first-row-card {
      height: 320px !important;
      display: flex !important;
      flex-direction: column !important;
      align-self: stretch !important;
    }
    
    /* Ensure card body grows to fill available space */
    .pf-v6-c-card.first-row-card .pf-v6-c-card__body {
      flex-grow: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      overflow: visible !important;
    }
    
    /* Ensure card header and footer have consistent sizing */
    .pf-v6-c-card.first-row-card .pf-v6-c-card__header,
    .pf-v6-c-card.first-row-card .pf-v6-c-card__footer {
      flex-shrink: 0 !important;
    }
    
    /* Create a more compact layout by reducing gap after first row */
    .pf-v6-l-gallery {
      gap: 16px !important;
    }
    
    /* Column spans for larger screens - PatternFly Gallery uses flexbox */
    @media (min-width: 1200px) {
      /* Specific adjustments for better visual alignment */
      .explore-capabilities-wide {
        margin-top: -8px !important;
      }
      
      /* Recently Visited card - size to content on larger screens */
      .pf-v6-c-card.recently-visited-card {
        height: auto !important;
      }
      
      /* Ensure first row cards have consistent height */
      .pf-v6-c-card.first-row-card {
        height: 320px !important;
      }
      
      /* Settings card - 2 columns out of 8 column grid = 25% */
      .settings-card-wide {
        flex: 0 0 calc(25% - 16px) !important;
        max-width: calc(25% - 16px) !important;
        min-width: calc(25% - 16px) !important;
      }
      
      /* Events card - 4 columns out of 8 column grid = 50% (twice the width) */
      .events-card-extra-wide {
        flex: 0 0 calc(50% - 16px) !important;
        max-width: calc(50% - 16px) !important;
        min-width: calc(50% - 16px) !important;
      }
      
      /* Optimization, Security, and Availability cards - consistent height and no scrolling */
      .status-cards-container .pf-v6-c-card {
        height: 220px !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: visible !important;
      }
      
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: visible !important;
        padding: 16px !important;
      }
      
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: visible !important;
        height: 100% !important;
      }
      
      /* Ensure titles are in upper left corner */
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex__item:first-child {
        flex-shrink: 0 !important;
        margin-bottom: 8px !important;
      }
      
      /* Left align the title and badge row */
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex__item:first-child .pf-v6-l-flex {
        justify-content: flex-start !important;
      }
      
      /* Content area takes available space */
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex__item:nth-child(2) {
        flex: 1 !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      /* Reboot info section */
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex__item:nth-child(3) {
        flex-shrink: 0 !important;
        margin: 8px 0 !important;
      }
      
      /* Learn more link at bottom */
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex__item:last-child {
        margin-top: auto !important;
        flex-shrink: 0 !important;
      }
      
      /* Fluorescent arrow positioning */
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex__item:nth-child(4) {
        margin-top: auto !important;
        flex-shrink: 0 !important;
      }
      
      /* Explore capabilities card - 6 columns out of 8 column grid = 75% */
      .explore-capabilities-wide {
        flex: 0 0 calc(75% - 16px) !important;
        max-width: calc(75% - 16px) !important;
        min-width: calc(75% - 16px) !important;
      }
      
      /* Subscriptions card - 8 columns out of 8 column grid = 100% */
      .subscriptions-extra-wide {
        flex: 0 0 calc(100% - 16px) !important;
        max-width: calc(100% - 16px) !important;
        min-width: calc(100% - 16px) !important;
      }
    }
    
    @media (min-width: 992px) and (max-width: 1199px) {
      /* Settings card - 33% on medium screens */
      .settings-card-wide {
        flex: 0 0 calc(33.333% - 16px) !important;
        max-width: calc(33.333% - 16px) !important;
        min-width: calc(33.333% - 16px) !important;
      }
      
      /* Events card - 66.666% on medium screens (twice the width) */
      .events-card-extra-wide {
        flex: 0 0 calc(66.666% - 16px) !important;
        max-width: calc(66.666% - 16px) !important;
        min-width: calc(66.666% - 16px) !important;
      }
      
      /* Explore capabilities card - 66% on medium screens */
      .explore-capabilities-wide {
        flex: 0 0 calc(66.666% - 16px) !important;
        max-width: calc(66.666% - 16px) !important;
        min-width: calc(66.666% - 16px) !important;
      }
      
      /* Subscriptions card - 100% on medium screens */
      .subscriptions-extra-wide {
        flex: 0 0 calc(100% - 16px) !important;
        max-width: calc(100% - 16px) !important;
        min-width: calc(100% - 16px) !important;
      }
    }
    
    /* On smaller screens, all cards take full width */
    @media (max-width: 991px) {
      .settings-card-wide,
      .explore-capabilities-wide,
      .subscriptions-extra-wide,
      .events-card-extra-wide {
        flex: 1 1 100% !important;
        max-width: 100% !important;
        min-width: 280px !important;
      }
      
      /* Ensure status cards maintain proper layout on smaller screens */
      .status-cards-container .pf-v6-c-card {
        height: 220px !important;
        overflow: visible !important;
      }
      
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body {
        overflow: visible !important;
        padding: 12px !important;
      }
      
      .status-cards-container .pf-v6-c-card .pf-v6-c-card__body .pf-v6-l-flex {
        overflow: visible !important;
        height: 100% !important;
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
      <style>{cardHoverStyle}</style>
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
              <TellUsWhatYoudLikeToDoCard 
                showArrow={true} 
                onShowSetupGuide={() => setShowSetupGuide(true)}
                hasCustomView={hasCustomView}
              />
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
                        <ListItem>
                          <Button variant="link" onClick={() => navigate('/data-integration')}>
                            Data Integration
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
                          <Button variant="link" size="sm">
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
              
              <Card isFullHeight className="subscriptions-extra-wide">
                <CardHeader>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h4" className="pf-v6-c-card__title">
                        Subscriptions
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
                  <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Alert title="Active Subscriptions" color="blue" isInline>
                        15 active
                      </Alert>
                    </FlexItem>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <BellIcon style={{ color: '#f0ab00', fontSize: '16px' }} />
                        </FlexItem>
                        <FlexItem>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                            <FlexItem>
                              <Content style={{ fontSize: '14px', fontWeight: 'bold' }}>Expiring Soon</Content>
                            </FlexItem>
                            <FlexItem>
                              <Content style={{ fontSize: '14px' }}>3 expiring</Content>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Alert title="Usage Alerts" color="red" isInline>
                        2 alerts
                      </Alert>
                    </FlexItem>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Alert title="Available Credits" variant="success" isInline>
                        $12,500
                      </Alert>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
              
              <Card isFullHeight className="explore-capabilities-wide">
                <CardHeader>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h4" className="pf-v6-c-card__title">
                        Explore capabilities
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
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                    {/* First row - 3 cards */}
                    <FlexItem>
                      <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsMd' }}>
                        <FlexItem flex={{ default: 'flex_1' }}>
                          <Card 
                            onClick={() => navigate('/tour')} 
                            className="explore-capability-card"
                            isCompact
                            variant="secondary"
                          >
                            <CardBody>
                              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Title headingLevel="h4" size="md">
                                    Get started with a tour
                                  </Title>
                                </FlexItem>
                                <FlexItem>
                                  <Content component="small">
                                    Take a quick guided tour to understand how the Red Hat Hybrid Cloud Console's capabilities will increase your efficiency
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                        <FlexItem flex={{ default: 'flex_1' }}>
                          <Card 
                            onClick={() => navigate('/openshift-aws')} 
                            className="explore-capability-card"
                            isCompact
                            variant="secondary"
                          >
                            <CardBody>
                              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Title headingLevel="h4" size="md">
                                    Try OpenShift on AWS
                                  </Title>
                                </FlexItem>
                                <FlexItem>
                                  <Content component="small">
                                    Quickly build, deploy, and scale applications with Red Hat OpenShift Service on AWS (ROSA), our fully-managed turnkey application platform.
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                        <FlexItem flex={{ default: 'flex_1' }}>
                          <Card 
                            onClick={() => navigate('/developer-sandbox')} 
                            className="explore-capability-card"
                            isCompact
                            variant="secondary"
                          >
                            <CardBody>
                              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Title headingLevel="h4" size="md">
                                    Try our products in the Developer Sandbox
                                  </Title>
                                </FlexItem>
                                <FlexItem>
                                  <Content component="small">
                                    The Developer Sandbox offers no-cost access to Red Hat products and technologies for trial use - no setup or configuration necessary.
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    {/* Second row - 2 cards */}
                    <FlexItem>
                      <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsMd' }} justifyContent={{ default: 'justifyContentFlexStart' }}>
                        <FlexItem flex={{ default: 'flex_1' }} style={{ maxWidth: 'calc(33.333% - 8px)' }}>
                          <Card 
                            onClick={() => navigate('/rhel-analysis')} 
                            className="explore-capability-card"
                            isCompact
                            variant="secondary"
                          >
                            <CardBody>
                              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Title headingLevel="h4" size="md">
                                    Analyze RHEL environments
                                  </Title>
                                </FlexItem>
                                <FlexItem>
                                  <Content component="small">
                                    Analyze platforms and applications from the console to better manage your hybrid cloud environments.
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                        <FlexItem flex={{ default: 'flex_1' }} style={{ maxWidth: 'calc(33.333% - 8px)' }}>
                          <Card 
                            onClick={() => navigate('/centos-rhel-conversion')} 
                            className="explore-capability-card"
                            isCompact
                            variant="secondary"
                          >
                            <CardBody>
                              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Title headingLevel="h4" size="md">
                                    Convert from CentOS to RHEL
                                  </Title>
                                </FlexItem>
                                <FlexItem>
                                  <Content component="small">
                                    Seamlessly migrate your CentOS systems to Red Hat Enterprise Linux with our conversion tools and guidance.
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </CardBody>
                          </Card>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </Gallery>
            </div>
          </FlexItem>
          
          {/* Bottom Action Section */}
          <FlexItem>
            <div style={{ maxWidth: '1566px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Button variant="secondary" onClick={() => navigate('/all-services')} size="lg">
                  Explore All Services
                </Button>
              </div>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>
      
      {/* Setup Guide Overlay */}
      <SetupGuide 
        isOpen={showSetupGuide} 
        onClose={() => setShowSetupGuide(false)} 
      />
    </Help>
  );
};

export { Homepage };