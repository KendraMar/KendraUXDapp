import * as React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IAppRoute, IAppRouteGroup, routes } from '@app/routes';
import { GlobalSearchProvider, GlobalSearch, useGlobalSearch } from '@app/GlobalSearch';
import { AskRedHatProvider, AskRedHat, useAskRedHat } from '@app/AskRedHat';
import { SetupGuideProvider, SetupGuide, useSetupGuide } from '@app/SetupGuide';
import { Help } from '@app/Help';
import { useHelpPanel } from '@app/Help/HelpPanelProvider';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  Menu,
  MenuGroup,
  MenuItem,
  MenuItemAction,
  MenuList,
  MenuToggle,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  Page,
  PageSidebar,
  PageSidebarBody,
  SearchInput,
  SkipToContent,
  Split,
  SplitItem,
  Tab,
  TabAction,
  TabTitleText,
  Tabs,
  Title,
  Tooltip
} from '@patternfly/react-core';
import {
  BarsIcon, 
  BellIcon, 
  BookOpenIcon, 
  BrainIcon, 
  ChartLineIcon,
  CloudIcon,
  CodeIcon,
  CogIcon,
  CommentsIcon,
  CreditCardIcon,
  CubeIcon,
  DatabaseIcon,
  EllipsisVIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
  EyeIcon,
  HelpIcon,
  InfoCircleIcon,
  ListIcon,
  PlayIcon,
  QuestionCircleIcon,
  RocketIcon,
  ServerIcon,
  ShieldAltIcon,
  SignOutAltIcon,
  StarIcon,
  TachometerAltIcon,
  TimesIcon,
  UserIcon,
  UsersIcon,
  WrenchIcon
} from '@patternfly/react-icons';

interface IAppLayout {
  children: React.ReactNode;
}

interface TabContent {
  id: string;
  title: string;
  originalTitle: string;
  type: 'overview' | 'analytics' | 'settings' | 'custom';
  activeSubTab?: number;
  closable?: boolean;
  hasUserInteracted?: boolean;
  searchQuery?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  details: string;
  features: string[];
  icon: React.ReactElement;
  url?: string;
  isLink?: boolean;
}

const AppLayoutContent: React.FunctionComponent<IAppLayout> = ({ children }) => {
  const { isGlobalSearchOpen, closeGlobalSearch, openGlobalSearch } = useGlobalSearch();
  const { isVisible: isAskRedHatVisible, showAskRedHat, hideAskRedHat } = useAskRedHat();
  const { isVisible: isSetupGuideVisible, hideSetupGuide } = useSetupGuide();
  const { isOpen: isHelpPanelOpen, openHelpPanel, closeHelpPanel, toggleHelpPanel } = useHelpPanel();
  
  // Debug logging for SetupGuide
  React.useEffect(() => {
    console.log('AppLayout: SetupGuide state changed', { isSetupGuideVisible, hideSetupGuide: typeof hideSetupGuide });
  }, [isSetupGuideVisible, hideSetupGuide]);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const [tabCounter, setTabCounter] = React.useState(2);
  
  // Sub-tab names mapping
  const subTabNames = [
    'Search',
    'Learn', 
    'Knowledgebase',
    'APIs',
    'Support',
    'Ask Red Hat'
  ];

  const [tabs, setTabs] = React.useState<TabContent[]>([
    { id: 'get-started', title: 'Get started', originalTitle: 'Get started', type: 'overview', activeSubTab: 0, closable: false, hasUserInteracted: false }
  ]);

  const [searchValue, setSearchValue] = React.useState('');

  // User dropdown state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const [isUtilitiesDropdownOpen, setIsUtilitiesDropdownOpen] = React.useState(false);
  
  // Notification drawer state
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = React.useState(false);
  const [isNotificationActionsOpen, setIsNotificationActionsOpen] = React.useState(false);

  // Menu groups data for primary-detail view
  const menuGroupsData: Record<string, MenuItem[]> = {
    'Platforms': [],
    'Services': [
      {
        id: 'my-favorite-services',
        name: 'My Favorite Services',
        description: 'Quick access to your most-used services',
        details: 'Access your frequently used and bookmarked services in one convenient location. Customize your dashboard with the services you use most often to improve your workflow efficiency.',
        features: ['Quick Access', 'Custom Dashboard', 'Service Bookmarks', 'Usage Analytics'],
        icon: <StarIcon style={{ color: 'var(--pf-v6-c-button--m-favorited--hover__icon--Color, #f39200)' }} />
      },
      {
        id: 'ai-ml',
        name: 'AI/ML',
        description: 'Artificial intelligence and machine learning services',
        details: 'Build, train, and deploy machine learning models with enterprise-grade AI/ML platforms. Access GPU-accelerated computing, automated model training, and MLOps pipelines.',
        features: ['Model Training', 'GPU Computing', 'MLOps Pipelines', 'Data Science Workbenches'],
        icon: <BrainIcon />
      },
      {
        id: 'alerting-data-integrations',
        name: 'Alerting & Data Integrations',
        description: 'Monitoring alerts and data pipeline management',
        details: 'Configure intelligent alerting systems and manage data integration workflows across your hybrid cloud infrastructure with real-time monitoring and automated responses.',
        features: ['Real-time Alerts', 'Data Pipelines', 'Integration Workflows', 'Event Processing'],
        icon: <BellIcon />
      },
      {
        id: 'automation',
        name: 'Automation',
        description: 'Infrastructure and application automation',
        details: 'Automate repetitive tasks, configuration management, and deployment processes with comprehensive automation tools and workflow orchestration.',
        features: ['Task Automation', 'Configuration Management', 'Workflow Orchestration', 'Process Optimization'],
        icon: <WrenchIcon />
      },
      {
        id: 'containers',
        name: 'Containers',
        description: 'Container management and orchestration',
        details: 'Deploy, manage, and scale containerized applications with enterprise Kubernetes platforms, container registries, and orchestration tools.',
        features: ['Container Orchestration', 'Registry Management', 'Application Scaling', 'Service Mesh'],
        icon: <CubeIcon />
      },
      {
        id: 'deploy',
        name: 'Deploy',
        description: 'Application deployment and delivery',
        details: 'Streamline application deployment with CI/CD pipelines, automated testing, and progressive delivery strategies across multiple environments.',
        features: ['CI/CD Pipelines', 'Automated Testing', 'Progressive Delivery', 'Environment Management'],
        icon: <RocketIcon />
      },
      {
        id: 'identity-access-mgmt',
        name: 'Identity & Access Management',
        description: 'User authentication and authorization',
        details: 'Secure your applications with comprehensive identity management, single sign-on, multi-factor authentication, and role-based access controls.',
        features: ['Single Sign-On', 'Multi-Factor Auth', 'Role-Based Access', 'Identity Federation'],
        icon: <UsersIcon />
      },
      {
        id: 'inventories',
        name: 'Inventories',
        description: 'Asset and resource inventory management',
        details: 'Track and manage your IT assets, infrastructure resources, and application inventories with automated discovery and real-time updates.',
        features: ['Asset Discovery', 'Resource Tracking', 'Inventory Updates', 'Compliance Reporting'],
        icon: <ListIcon />
      },
      {
        id: 'observability-monitoring',
        name: 'Observability & Monitoring',
        description: 'System monitoring and observability',
        details: 'Gain deep insights into your applications and infrastructure with comprehensive monitoring, logging, tracing, and performance analytics.',
        features: ['Application Monitoring', 'Infrastructure Metrics', 'Distributed Tracing', 'Log Analytics'],
        icon: <EyeIcon />
      },
      {
        id: 'operators',
        name: 'Operators',
        description: 'Kubernetes operators and lifecycle management',
        details: 'Deploy and manage complex applications on Kubernetes with operators that automate installation, updates, and day-2 operations.',
        features: ['Operator Lifecycle', 'Application Management', 'Automated Updates', 'Cluster Operations'],
        icon: <PlayIcon />
      },
      {
        id: 'security',
        name: 'Security',
        description: 'Security scanning and threat protection',
        details: 'Protect your infrastructure with advanced security scanning, vulnerability management, threat detection, and compliance monitoring.',
        features: ['Vulnerability Scanning', 'Threat Detection', 'Security Policies', 'Compliance Monitoring'],
        icon: <ShieldAltIcon />
      },
      {
        id: 'subscriptions-spend',
        name: 'Subscriptions & Spend',
        description: 'Subscription management and cost optimization',
        details: 'Manage subscriptions, track usage, optimize costs, and analyze spending patterns across your Red Hat services and cloud resources.',
        features: ['Subscription Tracking', 'Cost Analysis', 'Usage Optimization', 'Spend Management'],
        icon: <CreditCardIcon />
      },
      {
        id: 'system-configuration',
        name: 'System Configuration',
        description: 'System settings and configuration management',
        details: 'Configure and manage system settings, infrastructure parameters, and application configurations with centralized management tools.',
        features: ['Configuration Management', 'System Settings', 'Parameter Tuning', 'Change Tracking'],
        icon: <ServerIcon />
      }
    ]
  };
  
  // Get the first menu item ID from the first non-link group (Services)
  const getFirstMenuItemId = () => {
    // Default to "My Favorite Services" as the first selected item
    return 'my-favorite-services';
  };
  
  // Service dropdown primary-detail state
  const [selectedMenuItem, setSelectedMenuItem] = React.useState(getFirstMenuItemId());
  
  // Favorited items state
  const [favoritedItems, setFavoritedItems] = React.useState<Set<string>>(new Set());
  
  // Function to toggle favorite status of an item
  const toggleFavorite = (itemId: string) => {
    setFavoritedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  // Logo dropdown and expandable search state
  const [isLogoDropdownOpen, setIsLogoDropdownOpen] = React.useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [mastheadSearchValue, setMastheadSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Array<{id: string, title: string, description: string, category: string, route: string | null}>>([]);
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  // Ref for services dropdown to handle outside clicks
  const servicesDropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Ref for search container to handle outside clicks
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Location and navigation
  const location = useLocation();
  const navigate = useNavigate();

  // Set document title based on current route
  React.useEffect(() => {
    const flattenedRoutes: IAppRoute[] = routes.reduce(
      (flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])],
      [] as IAppRoute[],
    );
    
    const currentRoute = flattenedRoutes.find(route => route.path === location.pathname);
    if (currentRoute && currentRoute.title) {
      document.title = currentRoute.title;
    }
  }, [location.pathname]);
  
  // Check if we're on a page without navigation (homepage or all services)
  const isPageWithoutNav = location.pathname === '/' || location.pathname === '/intro' || location.pathname === '/all-services' || location.pathname === '/dashboard' || location.pathname === '/dashboard2';

  // Mock search data
  const mockSearchData = [
    // Main Settings Bundle Pages
    { id: '1', title: 'Overview', description: 'View system overview and general information', category: 'Settings', route: '/overview' },
    { id: '2', title: 'Alert Manager', description: 'Configure and manage system alerts and notifications', category: 'Settings', route: '/alert-manager' },
    { id: '3', title: 'Data Integration', description: 'Manage data integration workflows, connectors, and synchronization settings', category: 'Settings', route: '/data-integration' },
    { id: '4', title: 'Event Log', description: 'View and configure system event logging and monitoring', category: 'Settings', route: '/event-log' },
    { id: '5', title: 'Learning Resources', description: 'Access training materials, tutorials, and documentation resources', category: 'Settings', route: '/learning-resources' },
    
    // IAM Bundle Pages
    { id: '6', title: 'My User Access', description: 'View and manage your personal access permissions and settings', category: 'IAM', route: '/my-user-access' },
    { id: '7', title: 'User Access', description: 'Manage user accounts, groups, and access permissions overview', category: 'IAM', route: '/user-access' },
    { id: '8', title: 'Users', description: 'Manage user accounts and their access permissions', category: 'IAM', route: '/users' },
    { id: '9', title: 'Groups', description: 'Create and manage user groups and group-based permissions', category: 'IAM', route: '/groups' },
    { id: '10', title: 'Roles', description: 'Define and manage user roles with specific permissions and access levels', category: 'IAM', route: '/roles' },
    { id: '11', title: 'Workspaces', description: 'Manage workspaces and project environments for teams', category: 'IAM', route: '/workspaces' },
    { id: '12', title: 'Red Hat Access Requests', description: 'Manage access requests for Red Hat services and resources', category: 'IAM', route: '/red-hat-access-requests' },
    { id: '13', title: 'Authentication Policy', description: 'Configure authentication policies and security settings', category: 'IAM', route: '/authentication-policy' },
    { id: '14', title: 'Service Accounts', description: 'Manage service accounts and API credentials for automated systems', category: 'IAM', route: '/service-accounts' },
    { id: '15', title: 'IAM Learning Resources', description: 'Access Identity & Access Management learning materials and guides', category: 'IAM', route: '/learning-resources-iam' },
    
    // Additional Services
    { id: '16', title: 'Vulnerability', description: 'View and manage system vulnerabilities', category: 'RHEL', route: null },
    { id: '17', title: 'Policies', description: 'Configure and manage security policies', category: 'RHEL', route: null },
    { id: '18', title: 'Application Performance', description: 'Monitor application performance metrics', category: 'Monitoring', route: null }
  ];

  // Top 5 results for empty state
  const topResults = [
    { id: '1', title: 'Overview', description: 'View system overview and general information', category: 'Settings', route: '/overview' },
    { id: '2', title: 'Alert Manager', description: 'Configure and manage system alerts and notifications', category: 'Settings', route: '/alert-manager' },
    { id: '6', title: 'My User Access', description: 'View and manage your personal access permissions and settings', category: 'IAM', route: '/my-user-access' },
    { id: '7', title: 'User Access', description: 'Manage user accounts, groups, and access permissions overview', category: 'IAM', route: '/user-access' },
    { id: '3', title: 'Data Integration', description: 'Manage data integration workflows, connectors, and synchronization settings', category: 'Settings', route: '/data-integration' }
  ];

  // Hide search results and collapse search bar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchButton = document.querySelector('[aria-label="Expandable search input toggle"]');
      
      // Check if click is on search toggle button - don't collapse if so
      if (searchButton && searchButton.contains(event.target as Node)) {
        return;
      }
      
      // If global search is open and click is outside both the search container and the global search dropdown
      if (isGlobalSearchOpen && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        // Check if click is inside the global search dropdown
        const globalSearchDropdown = document.querySelector('[data-global-search-dropdown]');
        if (!globalSearchDropdown || !globalSearchDropdown.contains(event.target as Node)) {
          closeGlobalSearch();
        }
      }
      
      // If search is expanded and click is outside the search container
      if (isSearchExpanded && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setShowSearchResults(false);
        setSearchResults([]);
        setMastheadSearchValue('');
      } else if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        // Just hide search results if search is not expanded
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded, isGlobalSearchOpen, closeGlobalSearch]);

  // Hide services dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target as Node)) {
        // Also check if click is on the masthead toggle button
        const mastheadToggle = document.querySelector('[aria-label="Red Hat Hybrid Cloud Console menu"]');
        if (mastheadToggle && mastheadToggle.contains(event.target as Node)) {
          return; // Don't close if clicking on the toggle button
        }
        setIsLogoDropdownOpen(false);
      }
    };

    if (isLogoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLogoDropdownOpen]);

  // Reset to first menu item when dropdown opens
  React.useEffect(() => {
    if (isLogoDropdownOpen) {
      const firstItemId = getFirstMenuItemId();
      console.log('Setting selectedMenuItem to:', firstItemId);
      setSelectedMenuItem(firstItemId);
      // Force re-render with a small delay to ensure Menu component applies selection
      setTimeout(() => {
        setSelectedMenuItem(firstItemId);
        console.log('Re-setting selectedMenuItem to:', firstItemId);
      }, 10);
    }
  }, [isLogoDropdownOpen]);

  // Debug effect to log selectedMenuItem changes
  React.useEffect(() => {
    console.log('selectedMenuItem changed to:', selectedMenuItem);
  }, [selectedMenuItem]);

  const handleTabClick = (
    event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
  };

  const handleAddTab = () => {
    const newTab: TabContent = {
      id: `tab-${tabCounter}`,
      title: 'New tab',
      originalTitle: 'New tab',
      type: 'custom',
      closable: true,
      activeSubTab: 0,
      hasUserInteracted: false
    };
    setTabs([...tabs, newTab]);
    setActiveTabKey(tabs.length);
    setTabCounter(tabCounter + 1);
  };

  const handleCloseTab = (
    event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    event.stopPropagation();
    const tabIndexNum = typeof tabIndex === 'string' ? parseInt(tabIndex) : tabIndex;
    
    if (tabs[tabIndexNum] && tabs[tabIndexNum].closable === false) {
      return;
    }
    
    const newTabs = tabs.filter((_, index) => index !== tabIndexNum);
    setTabs(newTabs);
    
    if (activeTabKey === tabIndexNum) {
      setActiveTabKey(newTabs.length ? 0 : 0);
    } else if (typeof activeTabKey === 'number' && activeTabKey > tabIndexNum) {
      setActiveTabKey(activeTabKey - 1);
    }
  };

  const handleSubTabClick = (tabIndex: number, subTabIndex: number) => {
    const newTabs = [...tabs];
    newTabs[tabIndex].activeSubTab = subTabIndex;
    
    newTabs[tabIndex].hasUserInteracted = true;
    
    // Only update title with sub-tab name if there's no search query
    if ((newTabs[tabIndex].type === 'overview' || newTabs[tabIndex].type === 'custom') && !newTabs[tabIndex].searchQuery) {
      newTabs[tabIndex].title = subTabNames[subTabIndex];
    }
    
    setTabs(newTabs);
  };

  const handleContentInteraction = (tabIndex: number) => {
    const newTabs = [...tabs];
    if (!newTabs[tabIndex].hasUserInteracted) {
      newTabs[tabIndex].hasUserInteracted = true;
      
      // Only update title with sub-tab name if there's no search query
      if ((newTabs[tabIndex].type === 'overview' || newTabs[tabIndex].type === 'custom') && !newTabs[tabIndex].searchQuery) {
        newTabs[tabIndex].title = subTabNames[newTabs[tabIndex].activeSubTab || 0];
      }
      
      setTabs(newTabs);
    }
  };

  const onDrawerToggle = () => {
    const newDrawerState = !isDrawerExpanded;
    setIsDrawerExpanded(newDrawerState);
    
    // If opening the help drawer, close the notification drawer
    if (newDrawerState && isNotificationDrawerOpen) {
      setIsNotificationDrawerOpen(false);
    }
  };

  const onDrawerClose = () => {
    setIsDrawerExpanded(false);
  };

  const onHelpPanelToggle = () => {
    // Close the drawer if it's open
    if (isDrawerExpanded) {
      setIsDrawerExpanded(false);
    }
    // Close notification drawer if open
    if (isNotificationDrawerOpen) {
      setIsNotificationDrawerOpen(false);
    }
    // Toggle the help panel
    toggleHelpPanel();
  };

  const onNotificationDrawerToggle = () => {
    const newNotificationState = !isNotificationDrawerOpen;
    setIsNotificationDrawerOpen(newNotificationState);
    
    // If closing the notification drawer, also close the actions dropdown
    if (!newNotificationState) {
      setIsNotificationActionsOpen(false);
    }
    
    // If opening the notification drawer, close the help drawer
    if (newNotificationState && isDrawerExpanded) {
      setIsDrawerExpanded(false);
    }
  };

  const onNotificationDrawerClose = () => {
    setIsNotificationDrawerOpen(false);
    setIsNotificationActionsOpen(false); // Close actions dropdown when drawer closes
  };

  const onSearchChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setSearchValue(value);
  };

  const onSearchClear = () => {
    setSearchValue('');
  };

  const createSearchHandlers = (currentTabIndex: number) => {
    const onSearchSubmit = (value: string) => {
      console.log('onSearchSubmit called with:', value, 'for tab index:', currentTabIndex);
      if (value.trim()) {
        const newTabs = [...tabs];
        
        console.log('Before update - tabs:', newTabs.map(t => ({ id: t.id, title: t.title })));
        
        // Update the specific tab with the search query
        newTabs[currentTabIndex].searchQuery = value.trim();
        newTabs[currentTabIndex].title = value.trim();
        newTabs[currentTabIndex].hasUserInteracted = true;
        
        console.log('After update - tabs:', newTabs.map(t => ({ id: t.id, title: t.title })));
        
        setTabs(newTabs);
      }
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      console.log('Key pressed:', event.key, 'Search value:', searchValue);
      if (event.key === 'Enter') {
        event.preventDefault();
        onSearchSubmit(searchValue);
      }
    };

    return { onSearchSubmit, handleSearchKeyDown };
  };


  const onUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const onUserDropdownSelect = () => {
    setIsUserDropdownOpen(false);
  };

  const onUtilitiesDropdownToggle = () => {
    setIsUtilitiesDropdownOpen(!isUtilitiesDropdownOpen);
  };

  const onUtilitiesDropdownSelect = () => {
    setIsUtilitiesDropdownOpen(false);
  };

  const onLogoDropdownSelect = () => {
    setIsLogoDropdownOpen(false);
  };

  const onSearchToggle = (event: React.SyntheticEvent<HTMLButtonElement>, isExpanded: boolean) => {
    // Open the global search overlay instead of the inline search
    openGlobalSearch();
  };

  const onMastheadSearchChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setMastheadSearchValue(value);
    
    // Show top results when search is empty, filtered results when typing
    if (value.trim().length === 0) {
      // Show top results when search is empty
      setSearchResults(topResults);
      setShowSearchResults(true);
    } else if (value.trim().length >= 2) {
      // Perform filtered search when user types (minimum 2 characters)
      const filteredResults = mockSearchData.filter(item =>
        item.title.toLowerCase().includes(value.toLowerCase()) ||
        item.description.toLowerCase().includes(value.toLowerCase()) ||
        item.category.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6); // Limit to 6 results
      
      setSearchResults(filteredResults);
      setShowSearchResults(true);
    } else {
      // Hide results when typing 1 character (between empty and 2 chars)
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const onMastheadSearchClear = () => {
    setMastheadSearchValue('');
    // Show top results when clearing search (if expanded)
    if (isSearchExpanded) {
      setSearchResults(topResults);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const renderSubTabs = (tabIndex: number, tab: TabContent, ariaLabel: string) => {
    const { onSearchSubmit, handleSearchKeyDown } = createSearchHandlers(tabIndex);
    
    return (
    <Tabs
      isSubtab
      activeKey={tab.activeSubTab || 0}
      onSelect={(event, subTabIndex) => handleSubTabClick(tabIndex, subTabIndex as number)}
      aria-label={ariaLabel}
    >
      <Tab 
        eventKey={0} 
        title={<TabTitleText>Search</TabTitleText>}
        aria-label="Search sub tab"
      >
        <Card>
          <CardBody>
            <Content>
              <h3>Search</h3>
              <p>Find information quickly across all available resources and documentation.</p>
              
              <div style={{ marginBottom: '20px' }}>
                <SearchInput
                  placeholder="Search documentation, APIs, and resources..."
                  value={searchValue}
                  onChange={onSearchChange}
                  onClear={onSearchClear}
                  onKeyDown={handleSearchKeyDown}
                  aria-label="Search help resources"
                />
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  Press Enter to search and update the tab title
                </div>
              </div>

              <h4>Search Categories:</h4>
              <ul>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Search across documentation, APIs, and knowledge articles</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Filter results by category and content type</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Access frequently searched topics</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Save and bookmark search results</li>
              </ul>
            </Content>
          </CardBody>
        </Card>
      </Tab>
      <Tab 
        eventKey={1} 
        title={<TabTitleText>Learn</TabTitleText>}
        aria-label="Learn sub tab"
      >
        <Card>
          <CardBody>
            <Content>
              <h3>Learn</h3>
              <p>Access educational resources, tutorials, and training materials to expand your knowledge.</p>
              <ul>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Interactive tutorials and walkthroughs</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Video training sessions</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Certification programs</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Best practices and implementation guides</li>
              </ul>
            </Content>
          </CardBody>
        </Card>
      </Tab>
      <Tab 
        eventKey={2} 
        title={<TabTitleText>Knowledgebase</TabTitleText>}
        aria-label="Knowledgebase sub tab"
      >
        <Card>
          <CardBody>
            <Content>
              <h3>Knowledgebase</h3>
              <p>Browse comprehensive knowledge articles, solutions, and technical documentation.</p>
              <ul>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Troubleshooting guides and solutions</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Technical articles and whitepapers</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>FAQ and common issues</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Product documentation and specifications</li>
              </ul>
            </Content>
          </CardBody>
        </Card>
      </Tab>
      <Tab 
        eventKey={3} 
        title={<TabTitleText>APIs</TabTitleText>}
        aria-label="APIs sub tab"
      >
        <Card>
          <CardBody>
            <Content>
              <h3>APIs</h3>
              <p>Explore API documentation, reference guides, and integration examples.</p>
              <ul>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>REST API documentation and endpoints</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Code examples and SDK references</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Authentication and authorization guides</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>API testing tools and sandbox environments</li>
              </ul>
            </Content>
          </CardBody>
        </Card>
      </Tab>
      <Tab 
        eventKey={4} 
        title={<TabTitleText>Support</TabTitleText>}
        aria-label="Support sub tab"
      >
        <Card>
          <CardBody>
            <Content>
              <h3>Support</h3>
              <p>Get help with technical issues, access support resources, and connect with support teams.</p>
              <ul>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Submit support tickets and track status</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Access support documentation</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Contact technical support specialists</li>
                <li onClick={() => handleContentInteraction(tabIndex)} style={{cursor: 'pointer'}}>Emergency support and escalation procedures</li>
              </ul>
            </Content>
          </CardBody>
        </Card>
      </Tab>
      <Tab 
        eventKey={5} 
        title={
          <TabTitleText>
            <CommentsIcon />
          </TabTitleText>
        }
        aria-label="Chat sub tab"
      >
        <div style={{ height: '500px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <CommentsIcon style={{ fontSize: '48px', color: '#6a6e73', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#151515' }}>Chat Assistant</h3>
          <p style={{ margin: '0', color: '#6a6e73' }}>
            The chat assistant feature is currently not available. Please check back later or contact support for assistance.
          </p>
        </div>
      </Tab>
    </Tabs>
    );
  };

  const renderTabContent = (tab: TabContent, tabIndex: number) => {
    switch (tab.type) {
      case 'overview':
        return renderSubTabs(tabIndex, tab, "Get started sub tabs");
      
      case 'analytics':
        return (
          <Tabs
            isSubtab
            activeKey={tab.activeSubTab || 0}
            onSelect={(event, subTabIndex) => handleSubTabClick(tabIndex, subTabIndex as number)}
            aria-label="Analytics sub tabs"
          >
            <Tab 
              eventKey={0} 
              title={<TabTitleText>Performance Metrics</TabTitleText>}
              aria-label="Performance Metrics sub tab"
            >
              <Card>
                <CardBody>
                  <Content>
                    <h3>Performance Metrics</h3>
                    <p>Monitor key performance indicators and system metrics to ensure optimal operation.</p>
                    <ul>
                      <li>CPU Usage: 45%</li>
                      <li>Memory Usage: 68%</li>
                      <li>Disk I/O: 2.3 MB/s</li>
                      <li>Network Throughput: 150 Mbps</li>
                    </ul>
                  </Content>
                </CardBody>
              </Card>
            </Tab>
            <Tab 
              eventKey={1} 
              title={<TabTitleText>User Engagement</TabTitleText>}
              aria-label="User Engagement sub tab"
            >
              <Card>
                <CardBody>
                  <Content>
                    <h3>User Engagement</h3>
                    <p>Analyze user behavior patterns and engagement metrics across the platform.</p>
                    <ul>
                      <li>Active Users: 1,247</li>
                      <li>Session Duration: 8m 32s</li>
                      <li>Page Views: 15,892</li>
                      <li>Bounce Rate: 23%</li>
                    </ul>
                  </Content>
                </CardBody>
              </Card>
            </Tab>
            <Tab 
              eventKey={2} 
              title={<TabTitleText>Revenue Reports</TabTitleText>}
              aria-label="Revenue Reports sub tab"
            >
              <Card>
                <CardBody>
                  <Content>
                    <h3>Revenue Reports</h3>
                    <p>Track financial performance and revenue trends across different time periods.</p>
                    <ul>
                      <li>Monthly Revenue: $127,450</li>
                      <li>Growth Rate: +12.5%</li>
                      <li>Top Revenue Source: Premium Subscriptions</li>
                      <li>Conversion Rate: 3.2%</li>
                    </ul>
                  </Content>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        );
      
      case 'settings':
        return (
          <Card>
            <CardBody>
              <Content>
                <h3>Dashboard Settings</h3>
                <p>Configure dashboard preferences, notifications, and display options.</p>
                <ul>
                  <li>Theme: Light/Dark mode toggle</li>
                  <li>Refresh interval: 30 seconds</li>
                  <li>Email notifications: Enabled</li>
                  <li>Data retention: 90 days</li>
                </ul>
              </Content>
            </CardBody>
          </Card>
        );
      
      case 'custom':
        return renderSubTabs(tabIndex, tab, "New tab sub tabs");
      
      default:
        return (
          <Card>
            <CardBody>
              <Content>
                <h3>Default Content</h3>
                <p>Default tab content</p>
              </Content>
            </CardBody>
          </Card>
        );
    }
  };

  const masthead = (
    <Masthead>
      <MastheadMain>
        {!isPageWithoutNav && (
          <MastheadToggle>
            <Button
              icon={<BarsIcon />}
              variant="plain"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Global navigation"
            />
          </MastheadToggle>
        )}
        <MastheadBrand data-codemods>
          <MastheadLogo data-codemods onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Red_Hat_logo.svg/2560px-Red_Hat_logo.svg.png"
              alt="Red Hat Logo"
              style={{ height: '40px', width: 'auto' }}
            />
          </MastheadLogo>
        </MastheadBrand>
        {/* Application dropdown next to logo - Hidden on dashboard2 */}
        {location.pathname !== '/dashboard2' && (
          <div style={{ marginLeft: '4px', marginRight: '4px' }}>
            <Tooltip 
              content="Browse services" 
              position="bottom"
              {...(isLogoDropdownOpen ? { isVisible: false } : {})}
            >
              <MenuToggle
                onClick={() => setIsLogoDropdownOpen(!isLogoDropdownOpen)}
                isExpanded={isLogoDropdownOpen}
                aria-label="Red Hat Hybrid Cloud Console menu"
                style={{ 
                  fontSize: '14px'
                }}
              >
                Red Hat Hybrid Cloud Console
              </MenuToggle>
            </Tooltip>
          </div>
        )}
        
        {/* Expandable Search Input */}
        <div 
          ref={searchContainerRef}
          style={{ 
            marginRight: '4px',
            width: isSearchExpanded ? '552px' : 'auto',
            minWidth: isSearchExpanded ? '552px' : 'auto',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          <style>{`
            .pf-v6-c-masthead__logo {
              width: auto !important;
            }
            .masthead-search-expanded {
              --pf-v6-c-search-input--Width: 552px !important;
              --pf-v6-c-search-input__text-input--Width: 552px !important;
              --pf-v6-c-search-input--MinWidth: 552px !important;
            }
            .masthead-search-expanded .pf-v6-c-search-input,
            .masthead-search-expanded .pf-v6-c-search-input__text-input,
            .masthead-search-expanded .pf-v6-c-form-control {
              width: 552px !important;
              min-width: 552px !important;
            }
            .search-results-dropdown {
              position: absolute;
              top: calc(100% + 4px);
              left: 0;
              right: 0;
              z-index: 1000;
              background: var(--pf-v6-global--BackgroundColor--100);
              border: var(--pf-v6-global--BorderWidth--sm) solid var(--pf-v6-global--BorderColor--200);
              border-radius: var(--pf-v6-global--BorderRadius--md);
              box-shadow: var(--pf-v6-global--BoxShadow--lg);
              max-height: 400px;
              overflow-y: auto;
              padding: 24px;
            }
            .search-result-category-badge {
              font-size: var(--pf-v6-global--FontSize--xs);
              font-weight: var(--pf-v6-global--FontWeight--semi-bold);
              color: var(--pf-v6-global--primary-color--100);
              background-color: var(--pf-v6-global--primary-color--200);
              padding: var(--pf-v6-global--spacer--xs) var(--pf-v6-global--spacer--sm);
              border-radius: var(--pf-v6-global--BorderRadius--sm);
              text-transform: uppercase;
              letter-spacing: 0.025em;
              white-space: nowrap;
              margin-left: auto;
            }
          `}</style>
          <Tooltip 
            content="Search services" 
            position="bottom"
            {...(isSearchExpanded ? { isVisible: false } : {})}
          >
            <div className={isSearchExpanded ? 'masthead-search-expanded' : ''}>
              <SearchInput
                placeholder="Search across all services..."
                value={mastheadSearchValue}
                onChange={onMastheadSearchChange}
                onClear={onMastheadSearchClear}
                expandableInput={{
                  isExpanded: isSearchExpanded,
                  onToggleExpand: onSearchToggle,
                  toggleAriaLabel: "Expandable search input toggle",
                  hasAnimations: true
                }}
                aria-label="Global search"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && isSearchExpanded && (
                <div className="search-results-dropdown">
                                      <Menu 
                        onSelect={(event, itemId) => {
                          console.log('Selected search result:', itemId);
                          setShowSearchResults(false);
                          // Find the result and navigate if it has a route
                          const selectedResult = searchResults.find(result => result.id === itemId);
                          if (selectedResult && selectedResult.route) {
                            navigate(selectedResult.route);
                          }
                        }}
                      >
                      <MenuList>
                        <MenuGroup label="Top 5 results">
                          {searchResults.map((result) => (
                            <MenuItem 
                              key={result.id}
                              itemId={result.id}
                              description={result.description}
                              onClick={() => {
                                console.log('Selected search result:', result);
                                setShowSearchResults(false);
                                // Navigate to the route if it exists
                                if (result.route) {
                                  navigate(result.route);
                                }
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span>{result.title}</span>
                                <span className="search-result-category-badge">{result.category}</span>
                              </div>
                            </MenuItem>
                          ))}
                        </MenuGroup>
                      </MenuList>
                    </Menu>
                  </div>
                )}
              </div>
            </Tooltip>
        </div>
      </MastheadMain>
      <MastheadContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {/* Settings */}
            <Tooltip 
              content="Settings" 
              position="bottom"
              {...(isUtilitiesDropdownOpen ? { isVisible: false } : {})}
            >
              <Dropdown
                isOpen={isUtilitiesDropdownOpen}
                onSelect={onUtilitiesDropdownSelect}
                onOpenChange={(isOpen: boolean) => setIsUtilitiesDropdownOpen(isOpen)}
                toggle={(toggleRef: React.Ref<any>) => (
                  <Button
                    ref={toggleRef}
                    onClick={onUtilitiesDropdownToggle}
                    variant="control"
                    aria-label="Settings"
                    aria-expanded={isUtilitiesDropdownOpen}
                    className={isUtilitiesDropdownOpen ? 'pf-m-clicked' : ''}
                  >
                    <CogIcon />
                  </Button>
                )}
                shouldFocusToggleOnSelect
              >
                <Menu>
                  <MenuList>
                    <MenuGroup label="Settings">
                      <MenuItem 
                        icon={<BellIcon />}
                        onClick={() => {
                          navigate('/alert-manager');
                          setIsUtilitiesDropdownOpen(false);
                        }}
                      >
                        Alert Manager
                      </MenuItem>
                      <MenuItem 
                        icon={<DatabaseIcon />}
                        onClick={() => {
                          navigate('/data-integration');
                          setIsUtilitiesDropdownOpen(false);
                        }}
                      >
                        Data Integration
                      </MenuItem>
                    </MenuGroup>
                    <MenuGroup label="Identity & Access Management">
                      <MenuItem 
                        icon={<UsersIcon />}
                        onClick={() => {
                          navigate('/user-access');
                          setIsUtilitiesDropdownOpen(false);
                        }}
                      >
                        User Access
                      </MenuItem>
                      <MenuItem 
                        icon={<ShieldAltIcon />}
                        onClick={() => {
                          navigate('/authentication-policy');
                          setIsUtilitiesDropdownOpen(false);
                        }}
                      >
                        Authentication Policy
                      </MenuItem>
                      <MenuItem 
                        icon={<ServerIcon />}
                        onClick={() => {
                          navigate('/service-accounts');
                          setIsUtilitiesDropdownOpen(false);
                        }}
                      >
                        Service Accounts
                      </MenuItem>
                    </MenuGroup>
                  </MenuList>
                </Menu>
              </Dropdown>
            </Tooltip>

            {/* Help Panel */}
            <Tooltip 
              content="Help" 
              position="bottom"
              {...(isHelpPanelOpen ? { isVisible: false } : {})}
            >
              <Button
                variant="control"
                onClick={onHelpPanelToggle}
                aria-label="Help"
                aria-expanded={isHelpPanelOpen}
                className={isHelpPanelOpen ? 'pf-m-clicked' : ''}
              >
                <QuestionCircleIcon />
              </Button>
            </Tooltip>

            {/* Alerts */}
            <Tooltip 
              content="Alerts" 
              position="bottom"
              {...(isNotificationDrawerOpen ? { isVisible: false } : {})}
            >
              <Button
                variant="control"
                onClick={onNotificationDrawerToggle}
                aria-label="Alerts"
                aria-expanded={isNotificationDrawerOpen}
                className={isNotificationDrawerOpen ? 'pf-m-clicked' : ''}
              >
                <BellIcon />
              </Button>
            </Tooltip>

            {/* User dropdown */}
            <Tooltip 
              content="User menu" 
              position="bottom"
              {...(isUserDropdownOpen ? { isVisible: false } : {})}
            >
              <Dropdown
                isOpen={isUserDropdownOpen}
                onSelect={onUserDropdownSelect}
                onOpenChange={(isOpen: boolean) => setIsUserDropdownOpen(isOpen)}
                toggle={(toggleRef: React.Ref<any>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onUserDropdownToggle}
                    isExpanded={isUserDropdownOpen}
                    aria-label="User menu"
                    icon={<UserIcon />}
                  >
                    Kendra
                  </MenuToggle>
                )}
                shouldFocusToggleOnSelect
              >
              <DropdownList>
                <div style={{ padding: '16px' }}>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Username:</DescriptionListTerm>
                      <DescriptionListDescription>Kendra</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Account number:</DescriptionListTerm>
                      <DescriptionListDescription>12345678</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Org ID:</DescriptionListTerm>
                      <DescriptionListDescription>987654321</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </div>
                <div style={{ paddingBottom: '8px' }}>
                  <Divider />
                </div>
                <DropdownItem
                  component="a"
                  href="https://console.redhat.com/settings/profile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  My profile
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    navigate('/my-user-access');
                    setIsUserDropdownOpen(false);
                  }}
                >
                  My User Access
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    navigate('/alert-manager');
                    setIsUserDropdownOpen(false);
                  }}
                >
                  My Alert Preferences
                </DropdownItem>
                <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                  <Divider />
                </div>
                <DropdownItem>
                  Logout
                </DropdownItem>
              </DropdownList>
              </Dropdown>
            </Tooltip>
        </div>
      </MastheadContent>
    </Masthead>
  );

  const renderNavItem = (route: IAppRoute, index: number) => (
    <NavItem key={`${route.label}-${index}`} id={`${route.label}-${index}`} isActive={route.path === location.pathname}>
      <NavLink
        to={route.path}
      >
        {route.label}
      </NavLink>
    </NavItem>
  );

  const renderNavGroup = (group: IAppRouteGroup, groupIndex: number) => (
    <NavExpandable
      key={`${group.label}-${groupIndex}`}
      id={`${group.label}-${groupIndex}`}
      title={group.label}
      isActive={group.routes.some((route) => route.path === location.pathname)}
    >
      {group.routes.map((route, idx) => route.label && renderNavItem(route, idx))}
    </NavExpandable>
  );

        // Define navigation groups
        const settingsNavPages = ['/overview', '/alert-manager', '/data-integration', '/event-log', '/learning-resources'];
        const secondaryNavPages = ['/my-user-access', '/user-access', '/users', '/groups', '/roles', '/workspaces', '/red-hat-access-requests', '/authentication-policy', '/service-accounts', '/learning-resources-iam'];
        const insightsNavPages = ['/rhel-dashboard', '/cve-dashboard', '/rhel-compliance', '/rhel-systems', '/rhelopenshift'];

  // Determine which navigation structure to show
  const getNavigationType = () => {
    const currentPath = location.pathname;
    
    console.log('Current path:', currentPath);
    console.log('Settings pages:', settingsNavPages);
    console.log('Insights pages:', insightsNavPages);
    console.log('Secondary pages:', secondaryNavPages);
    
    if (insightsNavPages.some(path => currentPath.startsWith(path))) {
      console.log('Returning insights navigation');
      return 'insights';
    } else if (settingsNavPages.some(path => currentPath.startsWith(path))) {
      console.log('Returning settings navigation');
      return 'settings';
    } else if (secondaryNavPages.some(path => currentPath.startsWith(path))) {
      console.log('Returning secondary navigation');
      return 'secondary';
    }
    console.log('Returning primary navigation (default)');
    return 'primary'; // default fallback
  };

  const navigationType = getNavigationType();

  // Primary navigation structure (current navigation)
  const primaryNavRoutes = routes.filter((route): route is IAppRoute => {
    // Only individual routes, no expandable groups
    return !route.routes && !!route.label && ['Overview', 'Alert Manager', 'Data Integration', 'Event Log', 'Learning Resources'].includes(route.label);
  });

  // Red Hat Insights navigation structure
  const insightsNavItems = [
    { label: 'Dashboard', path: '/rhel-dashboard', isActive: location.pathname === '/rhel-dashboard' },
    { 
      label: 'Inventory', 
      path: '/cve-dashboard', 
      isActive: location.pathname === '/rhel-systems',
      isExpandable: true,
      subItems: [
        { label: 'Systems', path: '/rhel-systems', isActive: location.pathname === '/rhel-systems' },
        { label: 'Workspaces', path: '/cve-dashboard', isActive: false },
        { label: 'Image Builder', path: '/cve-dashboard', isActive: false },
      ]
    },
    { label: 'Content', path: '/cve-dashboard', isActive: false, isExpandable: true },
    { label: 'Operations', path: '/cve-dashboard', isActive: false, isExpandable: true },
    { 
      label: 'Security', 
      path: '/cve-dashboard', 
      isActive: location.pathname === '/cve-dashboard',
      isExpandable: true,
      subItems: [
        { label: 'Vulnerability', path: '/cve-dashboard', isActive: location.pathname === '/cve-dashboard' },
        { label: 'Compliance', path: '/rhel-compliance', isActive: location.pathname === '/rhel-compliance' },
        { label: 'Reports', path: '/cve-dashboard', isActive: false },
        { label: 'SCAP Policies', path: '/cve-dashboard', isActive: false },
        { label: 'Systems', path: '/rhel-systems', isActive: location.pathname === '/rhel-systems' },
      ]
    },
    { label: 'Malware', path: '/cve-dashboard', isActive: false, isExpandable: true },
    { label: 'Planning', path: '/cve-dashboard', isActive: false, isExpandable: true },
    { label: 'Business', path: '/cve-dashboard', isActive: false, isExpandable: true },
    { label: 'Automation Toolkit', path: '/cve-dashboard', isActive: false, isExpandable: true },
    { label: 'Registration Assistant', path: '/cve-dashboard', isActive: false },
    { label: 'Learning Resources', path: '/cve-dashboard', isActive: false },
  ];

  // Settings navigation structure
  const settingsNavItems = [
    { label: 'Overview', path: '/overview', isActive: location.pathname === '/overview' },
    { label: 'Learning Resources', path: '/learning-resources', isActive: location.pathname === '/learning-resources' },
    { label: 'Alert Manager', path: '/alert-manager', isActive: location.pathname === '/alert-manager' },
    { label: 'Event Log', path: '/event-log', isActive: location.pathname === '/event-log' },
    { label: 'Data Integration', path: '/data-integration', isActive: location.pathname === '/data-integration' },
  ];

  // Secondary navigation structure (IAM bundle)
  const secondaryNavItems = [
    { label: 'My Access', path: '/my-user-access', isActive: location.pathname === '/my-user-access' },
    { 
      label: 'User Access', 
      path: '/user-access', 
      isActive: ['/user-access', '/users', '/groups', '/roles', '/workspaces', '/red-hat-access-requests'].includes(location.pathname),
      isExpandable: true,
      subItems: [
        { label: 'Overview', path: '/user-access', isActive: location.pathname === '/user-access' },
        { label: 'Users', path: '/users', isActive: location.pathname === '/users' },
        { label: 'Groups', path: '/groups', isActive: location.pathname === '/groups' },
        { label: 'Roles', path: '/roles', isActive: location.pathname === '/roles' },
        { label: 'Workspaces', path: '/workspaces', isActive: location.pathname === '/workspaces' },
        { label: 'Red Hat Access Requests', path: '/red-hat-access-requests', isActive: location.pathname === '/red-hat-access-requests' },
      ]
    },
    { label: 'Authentication Policy', path: '/authentication-policy', isActive: location.pathname === '/authentication-policy' },
    { label: 'Service Accounts', path: '/service-accounts', isActive: location.pathname === '/service-accounts' },
    { label: 'IAM Learning', path: '/learning-resources-iam', isActive: location.pathname === '/learning-resources-iam' },
  ];

  const Navigation = (
    <Nav id="nav-primary-simple">
      <NavList id="nav-list-simple">
        {navigationType === 'insights' ? (
          // Show Red Hat Insights navigation
          insightsNavItems.map((item, idx) => (
            item.isExpandable ? (
              <NavExpandable
                key={`insights-expandable-${idx}`}
                id={`insights-expandable-${idx}`}
                title={item.label}
                isActive={item.isActive}
                isExpanded={!!(item.isActive && item.subItems) || (item.label === 'Security' && (location.pathname === '/rhel-compliance' || location.pathname === '/rhel-systems' || location.pathname === '/cve-dashboard')) || (item.label === 'Inventory' && location.pathname === '/rhel-systems')}
              >
                {item.subItems?.map((subItem, subIdx) => (
                  <NavItem key={`insights-sub-${idx}-${subIdx}`} id={`insights-sub-${idx}-${subIdx}`} isActive={subItem.isActive}>
                    <NavLink to={subItem.path}>
                      {subItem.label}
                    </NavLink>
                  </NavItem>
                ))}
              </NavExpandable>
            ) : (
              <NavItem key={`insights-${idx}`} id={`insights-${idx}`} isActive={item.isActive}>
                <NavLink to={item.path}>
                  {item.label}
                </NavLink>
              </NavItem>
            )
          ))
        ) : navigationType === 'settings' ? (
          // Show Settings navigation
          settingsNavItems.map((item, idx) => (
            <NavItem key={`settings-${idx}`} id={`settings-${idx}`} isActive={item.isActive}>
              <NavLink to={item.path}>
                {item.label}
              </NavLink>
            </NavItem>
          ))
        ) : navigationType === 'primary' ? (
          // Show primary navigation
          primaryNavRoutes.map((route, idx) => 
            route.label && renderNavItem(route, idx)
          )
        ) : (
          // Show secondary navigation (IAM bundle)
          secondaryNavItems.map((item, idx) => (
            item.isExpandable ? (
              <NavExpandable
                key={`secondary-expandable-${idx}`}
                id={`secondary-expandable-${idx}`}
                title={item.label}
                isActive={item.isActive}
              >
                {item.subItems?.map((subItem, subIdx) => (
                  <NavItem key={`secondary-sub-${idx}-${subIdx}`} id={`secondary-sub-${idx}-${subIdx}`} isActive={subItem.isActive}>
                    <NavLink to={subItem.path}>
                      {subItem.label}
                    </NavLink>
                  </NavItem>
                ))}
              </NavExpandable>
            ) : (
              <NavItem key={`secondary-${idx}`} id={`secondary-${idx}`} isActive={item.isActive}>
                <NavLink to={item.path}>
                  {item.label}
                </NavLink>
              </NavItem>
            )
          ))
        )}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        {navigationType === 'insights' && (
          <div style={{ padding: '16px', borderBottom: '1px solid #d2d2d2', marginBottom: '16px' }}>
            <Title headingLevel="h2" size="lg">Red Hat Insights</Title>
          </div>
        )}
        {navigationType === 'settings' && (
          <div style={{ padding: '16px', borderBottom: '1px solid #d2d2d2', marginBottom: '16px' }}>
            <Title headingLevel="h2" size="lg">Settings</Title>
          </div>
        )}
        {Navigation}
      </PageSidebarBody>
    </PageSidebar>
  );

  const pageId = 'primary-app-container';

  const PageSkipToContent = (
    <SkipToContent
      onClick={(event) => {
        event.preventDefault();
        const primaryContentContainer = document.getElementById(pageId);
        primaryContentContainer?.focus();
      }}
      href={`#${pageId}`}
    >
      Skip to Content
    </SkipToContent>
  );

  const drawerContent = (
    <DrawerPanelContent defaultSize="580px">
      <DrawerHead>
        <Title headingLevel="h2" size="lg">
          <QuestionCircleIcon style={{ marginRight: '8px' }} />
          Hybrid Cloud Help
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={onDrawerClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerContentBody>
        <Tabs 
          isBox
          activeKey={activeTabKey}
          onSelect={handleTabClick}
          onAdd={handleAddTab}
          aria-label="Dashboard tabs"
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={tab.id}
              eventKey={index} 
              title={<TabTitleText>{tab.title}</TabTitleText>}
              aria-label={`${tab.title} tab`}
              actions={
                tab.closable !== false ? (
                  <TabAction
                    aria-label={`Close ${tab.title}`}
                    onClick={(event) => handleCloseTab(event, index)}
                  >
                    <TimesIcon />
                  </TabAction>
                ) : null
              }
            >
              {renderTabContent(tab, index)}
            </Tab>
          ))}
        </Tabs>
      </DrawerContentBody>
    </DrawerPanelContent>
  );



  // Create notification drawer content
  const notificationDrawerContent = (
    <DrawerPanelContent defaultSize="580px">
      <DrawerHead>
        <span style={{ fontWeight: 'bold' }}>Notifications</span>
        <DrawerActions>
          <Dropdown
            isOpen={isNotificationActionsOpen}
            onOpenChange={(isOpen: boolean) => setIsNotificationActionsOpen(isOpen)}
            popperProps={{
              position: 'right'
            }}
            toggle={(toggleRef: React.Ref<any>) => (
              <MenuToggle
                ref={toggleRef}
                aria-label="Notification actions menu"
                variant="plain"
                onClick={() => setIsNotificationActionsOpen(!isNotificationActionsOpen)}
              >
                <EllipsisVIcon />
              </MenuToggle>
            )}
            shouldFocusToggleOnSelect
          >
            <DropdownList>
              <DropdownItem
                onClick={() => {
                  navigate('/event-log');
                  setIsNotificationActionsOpen(false);
                }}
              >
                Event log
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  navigate('/alert-manager');
                  setIsNotificationActionsOpen(false);
                }}
              >
                My alert preferences
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  navigate('/alert-manager');
                  setIsNotificationActionsOpen(false);
                }}
              >
                Organization defaults
              </DropdownItem>
            </DropdownList>
          </Dropdown>
          <DrawerCloseButton onClick={onNotificationDrawerClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerContentBody>
        <NotificationDrawer>
          <NotificationDrawerBody>
            <NotificationDrawerList>
              <NotificationDrawerListItem variant="info">
                <NotificationDrawerListItemHeader
                  variant="info"
                  title="System Update Available"
                  srTitle="Info notification:"
                />
                <NotificationDrawerListItemBody timestamp="5 minutes ago">
                  A new system update is available for installation. Click to view details.
                </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
              <NotificationDrawerListItem variant="warning">
                <NotificationDrawerListItemHeader
                  variant="warning"
                  title="Storage Space Low"
                  srTitle="Warning notification:"
                />
                <NotificationDrawerListItemBody timestamp="15 minutes ago">
                  Your storage space is running low. Consider removing unused files.
                </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
              <NotificationDrawerListItem variant="success">
                <NotificationDrawerListItemHeader
                  variant="success"
                  title="Backup Completed"
                  srTitle="Success notification:"
                />
                <NotificationDrawerListItemBody timestamp="1 hour ago">
                  Your scheduled backup has completed successfully.
                </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
            </NotificationDrawerList>
          </NotificationDrawerBody>
        </NotificationDrawer>
      </DrawerContentBody>
    </DrawerPanelContent>
  );

  return (
    <React.Fragment>
      <Page
        mainContainerId={pageId}
        sidebar={sidebarOpen && !isPageWithoutNav && Sidebar}
        skipToContent={PageSkipToContent}
      >
        {/* Notification Drawer (outer, right-side) */}
        <Drawer isExpanded={isNotificationDrawerOpen} isInline position="right">
          <DrawerContent panelContent={notificationDrawerContent}>
            {/* Help Drawer (inner, left-side) */}
            <Drawer isExpanded={isDrawerExpanded} isInline>
              <DrawerContent panelContent={drawerContent}>
                {children}
              </DrawerContent>
            </Drawer>
          </DrawerContent>
        </Drawer>
      </Page>
      
      {/* Full-width Services Drawer under Masthead */}
      {isLogoDropdownOpen && (
        <div
          ref={servicesDropdownRef}
          style={{
            position: 'fixed',
            top: '72px',
            left: '24px',
            right: '24px',
            backgroundColor: 'white',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            padding: '24px',
            borderRadius: '12px',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          {/* Close button */}
          <Button
            variant="plain"
            aria-label="Close services panel"
            onClick={() => setIsLogoDropdownOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10000
            }}
          >
            <TimesIcon />
          </Button>
          <style>
            {`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .pf-v6-c-menu {
                box-shadow: none !important;
              }
              /* Custom selected state for primary-detail menu items */
              .pf-v6-c-menu__item.pf-m-selected,
              .pf-v6-c-menu__item[aria-selected="true"],
              .pf-v6-c-menu__item.pf-m-current {
                background-color: var(--pf-v6-global--BackgroundColor--200) !important;
                color: var(--pf-v6-global--Color--100) !important;
              }
              /* Hide the checkmark icon for selected menu items */
              .pf-v6-c-menu__item.pf-m-selected .pf-v6-c-menu__item-select-icon,
              .pf-v6-c-menu__item[aria-selected="true"] .pf-v6-c-menu__item-select-icon,
              .pf-v6-c-menu__item.pf-m-current .pf-v6-c-menu__item-select-icon {
                display: none !important;
              }
              /* Ensure hover state works correctly with selected state */
              .pf-v6-c-menu__item.pf-m-selected:hover,
              .pf-v6-c-menu__item[aria-selected="true"]:hover,
              .pf-v6-c-menu__item.pf-m-current:hover {
                background-color: var(--pf-v6-global--BackgroundColor--200) !important;
              }
              /* Force default selected styling for menu items by data attribute */
              .pf-v6-c-menu__item[data-selected="true"] {
                background-color: var(--pf-v6-global--BackgroundColor--200) !important;
                color: var(--pf-v6-global--Color--100) !important;
              }
              .pf-v6-c-menu__item[data-selected="true"] .pf-v6-c-menu__item-select-icon {
                display: none !important;
              }
              .pf-v6-c-menu__item[data-selected="true"]:hover {
                background-color: var(--pf-v6-global--BackgroundColor--200) !important;
              }
              /* Explicit styling for My Favorite Services when selected */
              .pf-v6-c-menu__item[data-item-id="my-favorite-services"][data-selected="true"],
              .pf-v6-c-menu__item[itemid="my-favorite-services"].pf-m-selected,
              .pf-v6-c-menu__item[itemid="my-favorite-services"][aria-selected="true"] {
                background-color: var(--pf-v6-global--BackgroundColor--200) !important;
                color: var(--pf-v6-global--Color--100) !important;
              }
              /* Force My Favorite Services to show default selected background - HIGHEST PRIORITY */
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-item-id="my-favorite-services"] {
                background-color: #f0f0f0 !important;
                color: #151515 !important;
              }
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-item-id="my-favorite-services"]:hover {
                background-color: #e7e7e7 !important;
                color: #151515 !important;
              }
              /* Override when other items are selected */
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-item-id="my-favorite-services"][data-selected="false"] {
                background-color: transparent !important;
                color: var(--pf-v6-global--Color--100) !important;
              }
              /* Customize star icon color in My Favorite Services - Multiple targeting approaches */
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-item-id="my-favorite-services"] .pf-v6-c-menu__item-icon svg,
              .pf-v6-c-menu__item[data-item-id="my-favorite-services"] .pf-v6-c-menu__item-icon svg,
              .pf-v6-c-menu__item[data-item-id="my-favorite-services"] svg,
              .pf-v6-c-menu__item[data-item-id="my-favorite-services"] .pf-v6-c-menu__item-icon,
              [data-item-id="my-favorite-services"] svg {
                color: #f39200 !important;
                fill: #f39200 !important;
              }
              /* Try with PatternFly variable as fallback */
              .pf-v6-c-menu__item[data-item-id="my-favorite-services"] svg {
                color: var(--pf-v6-c-button--m-favorited--hover__icon--Color, #f39200) !important;
                fill: var(--pf-v6-c-button--m-favorited--hover__icon--Color, #f39200) !important;
              }
              /* Style link items differently - increased specificity */
              .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-main {
                color: var(--pf-v6-global--link--Color) !important;
              }
              .pf-v6-c-menu__item[data-is-link="true"]:hover .pf-v6-c-menu__item-main {
                background-color: var(--pf-v6-global--BackgroundColor--100) !important;
                color: var(--pf-v6-global--link--Color--hover) !important;
                text-decoration: underline;
              }
              .pf-v6-c-menu__item[data-is-link="true"]:hover {
                background-color: var(--pf-v6-global--BackgroundColor--100) !important;
              }
              /* Maximum specificity targeting for link items */
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"] {
                color: #0066cc !important;
              }
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"]:hover {
                color: #004080 !important;
                background-color: #f0f0f0 !important;
              }
              /* Target all possible child elements and text content */
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] *,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-text,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-main,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] button,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] a,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] span,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] div {
                color: #0066cc !important;
              }
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover *,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover .pf-v6-c-menu__item-text,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover .pf-v6-c-menu__item-main,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover button,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover a,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover span,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover div {
                color: #004080 !important;
              }
              /* Nuclear option - override everything within link items */
              [data-is-link="true"] {
                color: #0066cc !important;
              }
              [data-is-link="true"]:hover {
                color: #004080 !important;
              }
              /* Ultimate specificity - target the exact component structure */
              .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"] {
                color: #0066cc !important;
              }
              .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"]:hover {
                color: #004080 !important;
              }
              /* Override PatternFly's CSS custom properties */
              .pf-v6-c-menu__item[data-is-link="true"] {
                --pf-v6-c-menu__item--Color: #0066cc !important;
                --pf-v6-c-menu__item--m-current--Color: #0066cc !important;
                --pf-v6-c-menu__item--hover--Color: #004080 !important;
              }
              /* CSS class targeting for link items */
              .custom-link-menu-item {
                color: #0066cc !important;
              }
              .custom-link-menu-item:hover {
                color: #004080 !important;
                background-color: #f0f0f0 !important;
              }
              .custom-link-menu-item * {
                color: #0066cc !important;
              }
              .custom-link-menu-item:hover * {
                color: #004080 !important;
              }
              /* Prevent link items from showing selected state */
              .pf-v6-c-menu__item[data-is-link="true"].pf-m-selected {
                background-color: transparent !important;
                color: #0066cc !important;
              }
              .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-select-icon {
                display: none !important;
              }

            `}
          </style>
          <div style={{ maxWidth: '1200px', margin: '0 auto', height: '800px' }}>
            <Card style={{ height: '100%' }}>
              <CardBody style={{ padding: 0, height: '100%' }}>
                <Split style={{ height: '100%' }}>
                  {/* Primary (Menu) Side */}
                  <SplitItem style={{ 
                    width: '450px', 
                    minWidth: '450px', 
                    maxWidth: '450px', 
                    flexShrink: 0, 
                    flexGrow: 0, 
                    borderRight: '1px solid #d2d2d2' 
                  }}>
                    <div style={{ height: '100%' }}>
                      <Menu 
                        key={`menu-${isLogoDropdownOpen}-${selectedMenuItem}`}
                        aria-label="Services menu"
                        activeItemId={selectedMenuItem}
                        selected={selectedMenuItem}
                        onSelect={(event, itemId) => {
                          // Find the clicked item across all groups
                          let clickedItem: MenuItem | null = null;
                          for (const groupItems of Object.values(menuGroupsData)) {
                            const found = groupItems.find(item => item.id === itemId);
                            if (found) {
                              clickedItem = found;
                              break;
                            }
                          }
                          
                          if (clickedItem?.isLink && clickedItem?.url) {
                            // Navigate to URL for link items
                            window.location.href = clickedItem.url;
                          } else {
                            // Set selection for non-link items
                            setSelectedMenuItem(itemId as string);
                          }
                        }}
                      >
                        <MenuList>
                          {Object.entries(menuGroupsData).map(([groupTitle, groupItems], groupIndex, groupsArray) => (
                            <React.Fragment key={groupTitle}>
                              {groupTitle === 'Services' ? (
                                <MenuGroup>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '8px 16px 8px 16px',
                                    fontSize: 'var(--pf-v6-global--FontSize--sm)',
                                    fontWeight: 'var(--pf-v6-global--FontWeight--bold)',
                                    color: 'var(--pf-v6-global--Color--200)'
                                  }}>
                                    <span>Services</span>
                                    <a 
                                      href="/all-services"
                                      style={{ 
                                        fontSize: 'var(--pf-v6-global--FontSize--xs)',
                                        fontWeight: 'var(--pf-v6-global--FontWeight--normal)',
                                        color: '#0066cc',
                                        textDecoration: 'none'
                                      }}
                                      onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                                      onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
                                    >
                                      View all services
                                    </a>
                                  </div>
                                  {groupItems.map((item) => (
                                    <MenuItem 
                                      key={item.id}
                                      itemId={item.id}
                                      icon={!item.isLink ? item.icon : undefined}
                                      isSelected={!item.isLink && selectedMenuItem === item.id}
                                      data-item-id={item.id}
                                      data-selected={!item.isLink && selectedMenuItem === item.id ? "true" : "false"}
                                      data-is-link={item.isLink ? "true" : "false"}
                                      className={`${item.isLink ? 'custom-link-menu-item' : ''} ${!item.isLink && selectedMenuItem === item.id ? 'pf-m-selected' : ''}`.trim()}
                                      style={item.isLink ? { 
                                        color: '#0066cc', 
                                        cursor: 'pointer',
                                        ['--pf-v6-c-menu__item--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--m-current--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--hover--Color' as any]: '#004080'
                                      } : (!item.isLink && selectedMenuItem === item.id ? {
                                        backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                                        color: 'var(--pf-v6-global--Color--100)'
                                      } : undefined)}
                                    >
                                      {item.name}
                                    </MenuItem>
                                  ))}
                                </MenuGroup>
                              ) : (
                                <MenuGroup label={groupTitle}>
                                  {groupItems.map((item) => (
                                    <MenuItem 
                                      key={item.id}
                                      itemId={item.id}
                                      icon={!item.isLink ? item.icon : undefined}
                                      isSelected={!item.isLink && selectedMenuItem === item.id}
                                      data-item-id={item.id}
                                      data-selected={!item.isLink && selectedMenuItem === item.id ? "true" : "false"}
                                      data-is-link={item.isLink ? "true" : "false"}
                                      className={`${item.isLink ? 'custom-link-menu-item' : ''} ${!item.isLink && selectedMenuItem === item.id ? 'pf-m-selected' : ''}`.trim()}
                                      style={item.isLink ? { 
                                        color: '#0066cc', 
                                        cursor: 'pointer',
                                        ['--pf-v6-c-menu__item--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--m-current--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--hover--Color' as any]: '#004080'
                                      } : (!item.isLink && selectedMenuItem === item.id ? {
                                        backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                                        color: 'var(--pf-v6-global--Color--100)'
                                      } : undefined)}
                                    >
                                      {item.name}
                                    </MenuItem>
                                  ))}
                                </MenuGroup>
                              )}
                              {groupIndex < groupsArray.length - 1 && (
                                <Divider component="li" />
                              )}
                            </React.Fragment>
                          ))}
                        </MenuList>
                      </Menu>
                    </div>
                  </SplitItem>

                  {/* Detail Side */}
                  <SplitItem isFilled>
                    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                      {(() => {
                        // Find the selected menu item only among non-link items
                        let currentMenuItem: MenuItem | null = null;
                        for (const groupItems of Object.values(menuGroupsData)) {
                          const found = groupItems.find(item => item.id === selectedMenuItem && !item.isLink);
                          if (found) {
                            currentMenuItem = found;
                            break;
                          }
                        }
                        if (!currentMenuItem) return null;
                        
                        return (
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                            <FlexItem>
                              <Title headingLevel="h3" size="xl">
                                {currentMenuItem.name}
                              </Title>
                            </FlexItem>
                            
                            <FlexItem>
                              {currentMenuItem.id === 'my-favorite-services' ? (
                                // Dynamic My Favorite Services content based on user's favorites
                                favoritedItems.size === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--pf-v6-global--Color--200)' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                      <img 
                                        src="https://console.redhat.com/apps/frontend-assets/favoritedservices/favoriting-emptystate.svg"
                                        alt="No favorited services"
                                        style={{ width: '80px', height: '80px' }}
                                      />
                                            </div>
                                    <Title headingLevel="h4" size="lg" style={{ marginBottom: '8px' }}>No favorited services</Title>
                                    <p style={{ marginBottom: '24px' }}>Add a service to your favorites to get started here.</p>
                                    <Button 
                                      variant="primary" 
                                      onClick={() => {
                                        navigate('/all-services');
                                        setIsLogoDropdownOpen(false);
                                      }}
                                    >
                                      View all services
                                    </Button>
                                  </div>
                                ) : (
                                  <Menu>
                                    {(() => {
                                      // Map of itemId to display information with category grouping
                                      const itemMapping: { [key: string]: { name: string, description: string, onClick: () => void, category: string } } = {
                                            'alert-manager-settings': {
                                              name: 'Alert Manager | Settings',
                                              description: 'Configure and manage system alerts and notifications',
                                              category: 'Console Settings',
                                              onClick: () => {
                                                navigate('/alert-manager');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'data-integration-settings': {
                                              name: 'Data Integration | Settings', 
                                              description: 'Manage data integration workflows and connectors',
                                              category: 'Console Settings',
                                              onClick: () => {
                                                navigate('/data-integrations');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'event-log-settings': {
                                              name: 'Event Log | Settings',
                                              description: 'View and configure system event logging',
                                              category: 'Console Settings',
                                              onClick: () => {
                                                navigate('/event-log');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'overview-settings': {
                                              name: 'Overview | Settings',
                                              description: 'Access the main console overview and dashboard',
                                              category: 'Console Settings',
                                              onClick: () => {
                                                navigate('/overview');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'users': {
                                              name: 'Users',
                                              description: 'Manage user accounts and their access permissions',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => {
                                                navigate('/users');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'groups': {
                                              name: 'Groups',
                                              description: 'Create and manage user groups and permissions',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => {
                                                navigate('/groups');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'roles': {
                                              name: 'Roles',
                                              description: 'Define and manage user roles with specific permissions',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => {
                                                navigate('/roles');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            '60day-trial-openshift-ai': {
                                              name: '60-Day Product Trial | OpenShift AI',
                                              description: 'Create, train, and service AI/ML models',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('60-Day Product Trial | OpenShift AI clicked')
                                            },
                                            'developer-sandbox-openshift-ai': {
                                              name: 'Developer Sandbox | OpenShift AI',
                                              description: 'Create, train, and service AI/ML models',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('Developer Sandbox | OpenShift AI clicked')
                                            },
                                            'authentication-factors': {
                                              name: 'Authentication Factors',
                                              description: 'Configure multi-factor authentication and security settings',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => console.log('Authentication Factors clicked')
                                            },
                                            'service-accounts': {
                                              name: 'Service Accounts',
                                              description: 'Create and manage service accounts for automated systems',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => console.log('Service Accounts clicked')
                                            },
                                            'identity-provider-information': {
                                              name: 'Identity Provider Information',
                                              description: 'Configure and manage external identity providers',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => console.log('Identity Provider Information clicked')
                                            },
                                            'workspaces': {
                                              name: 'Workspaces',
                                              description: 'Manage organizational workspaces and their access controls',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => console.log('Workspaces clicked')
                                            },
                                            'directory-domain-services': {
                                              name: 'Directory and Domain Services',
                                              description: 'Configure directory services and domain management',
                                              category: 'Console Settings',
                                              onClick: () => console.log('Directory and Domain Services clicked')
                                            },
                                            'rhel-rhc': {
                                              name: 'Remote Host Configuration (RHC)',
                                              description: 'Configure and manage remote host connections',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Remote Host Configuration (RHC) clicked')
                                            },
                                            'rhel-activation-keys': {
                                              name: 'Activation Keys',
                                              description: 'Manage activation keys for system registration',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Activation Keys clicked')
                                            },
                                            'rhel-registration-assistant': {
                                              name: 'Registration Assistant',
                                              description: 'Step-by-step guidance for registering systems',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Registration Assistant clicked')
                                            },
                                            'rhel-staleness-deletion': {
                                              name: 'Staleness & Deletion',
                                              description: 'Configure system staleness detection and automated deletion',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Staleness & Deletion clicked')
                                            },
                                            'ansible-registration-assistant': {
                                              name: 'Registration Assistant',
                                              description: 'Guided setup for Ansible automation workflows',
                                              category: 'Red Hat Ansible Automation Platform',
                                              onClick: () => console.log('Ansible Registration Assistant clicked')
                                            },
                                            'console-alert-manager': {
                                              name: 'Alert Manager',
                                              description: 'Configure and manage system alerts and notifications',
                                              category: 'Console Settings',
                                              onClick: () => {
                                                navigate('/alert-manager');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'console-data-integration': {
                                              name: 'Data Integration',
                                              description: 'Manage data integration workflows and connectors',
                                              category: 'Console Settings',
                                              onClick: () => {
                                                navigate('/data-integrations');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            // Additional items from default System Configuration menu
                                            'rhel-insights': {
                                              name: 'Red Hat Insights',
                                              description: 'Proactive identification and remediation of threats',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Red Hat Insights clicked')
                                            },
                                            'rhel-patch': {
                                              name: 'Patch Management',
                                              description: 'Automated patching and system updates for RHEL environments',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Patch Management clicked')
                                            },
                                            'openshift-clusters': {
                                              name: 'OpenShift Clusters',
                                              description: 'Manage and monitor your OpenShift Kubernetes clusters',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('OpenShift Clusters clicked')
                                            },
                                            'container-registry': {
                                              name: 'Container Registry',
                                              description: 'Secure container image registry for storing and managing images',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('Container Registry clicked')
                                            },
                                            'automation-hub': {
                                              name: 'Automation Hub',
                                              description: 'Centralized repository for Ansible content collections',
                                              category: 'Red Hat Ansible Automation Platform',
                                              onClick: () => console.log('Automation Hub clicked')
                                            },
                                            'automation-controller': {
                                              name: 'Automation Controller',
                                              description: 'Enterprise automation control plane for Ansible playbooks',
                                              category: 'Red Hat Ansible Automation Platform',
                                              onClick: () => console.log('Automation Controller clicked')
                                            },
                                            'user-access-item': {
                                              name: 'User Access',
                                              description: 'Manage user permissions, roles, and access controls',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => console.log('User Access clicked')
                                            },
                                            'service-accounts-item': {
                                              name: 'Service Accounts',
                                              description: 'Create and manage service accounts for automated systems',
                                              category: 'Identity & Access Management (IAM)',
                                              onClick: () => console.log('Service Accounts clicked')
                                            },
                                            'preferences': {
                                              name: 'Preferences',
                                              description: 'Customize your console experience, themes, and settings',
                                              category: 'Console Settings',
                                              onClick: () => console.log('Preferences clicked')
                                            },
                                            'notifications': {
                                              name: 'Notifications',
                                              description: 'Configure alert preferences and notification settings',
                                              category: 'Console Settings',
                                              onClick: () => console.log('Notifications clicked')
                                            },
                                            'subscriptions': {
                                              name: 'Subscriptions',
                                              description: 'View and manage your Red Hat product subscriptions',
                                              category: 'Subscription Services',
                                              onClick: () => console.log('Subscriptions clicked')
                                            },
                                            'billing': {
                                              name: 'Billing',
                                              description: 'Access billing information, invoices, and payment methods',
                                              category: 'Subscription Services',
                                              onClick: () => console.log('Billing clicked')
                                            },
                                            'documentation': {
                                              name: 'Documentation',
                                              description: 'Access comprehensive guides and technical documentation',
                                              category: 'Other',
                                              onClick: () => console.log('Documentation clicked')
                                            },
                                            'support': {
                                              name: 'Support',
                                              description: 'Get help from Red Hat support team and submit cases',
                                              category: 'Other',
                                              onClick: () => console.log('Support clicked')
                                            }
                                          };

                                          // Group favorited items by category
                                          const favoritesByCategory: { [category: string]: Array<{ id: string, item: typeof itemMapping[string] }> } = {};
                                          
                                          Array.from(favoritedItems).forEach(itemId => {
                                            const item = itemMapping[itemId];
                                            if (item) {
                                              if (!favoritesByCategory[item.category]) {
                                                favoritesByCategory[item.category] = [];
                                              }
                                              favoritesByCategory[item.category].push({ id: itemId, item });
                                            }
                                          });

                                          // Define category order for consistent display
                                          const categoryOrder = [
                                            'Red Hat Enterprise Linux',
                                            'Red Hat OpenShift', 
                                            'Red Hat Ansible Automation Platform',
                                            'Identity & Access Management (IAM)',
                                            'Console Settings',
                                            'Subscription Services',
                                            'Other'
                                          ];

                                          return (
                                            <>
                                              {categoryOrder.map((category, categoryIndex) => {
                                                const categoryItems = favoritesByCategory[category];
                                                if (!categoryItems || categoryItems.length === 0) return null;

                                                return (
                                                  <div key={category} style={categoryIndex > 0 ? { marginTop: '24px' } : {}}>
                                                    <MenuGroup label={category} labelHeadingLevel="h2">
                                                      <Divider />
                                                      <MenuList>
                                                        {categoryItems.map(({ id, item }) => (
                                                          <MenuItem
                                                            key={id}
                                                            itemId={`favorite-${id}`}
                                                            description={item.description}
                                                            onClick={item.onClick}
                                                            actions={
                                                              <MenuItemAction
                                                                icon={<StarIcon />}
                                                                actionId="unfavorite"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  toggleFavorite(id);
                                                                }}
                                                                isFavorited={true}
                                                                aria-label="Remove from favorites"
                                                              />
                                                            }
                                                          >
                                                            {item.name}
                                                          </MenuItem>
                                                        ))}
                                                      </MenuList>
                                                    </MenuGroup>
                                                  </div>
                                                );
                                              })}
                                            </>
                                          );
                                        })()}
                                  </Menu>
                                )
                              ) : currentMenuItem.id === 'ai-ml' ? (
                                <Menu>
                                  <MenuGroup label="Red Hat OpenShift" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="60day-trial-openshift-ai"
                                        description="Create, train, and service artificial intelligence and machine learning (AI/ML) models."
                                        onClick={() => console.log('60-Day Product Trial | OpenShift AI clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('60day-trial-openshift-ai');
                                            }}
                                            isFavorited={favoritedItems.has('60day-trial-openshift-ai')}
                                            aria-label={favoritedItems.has('60day-trial-openshift-ai') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        60-Day Product Trial | OpenShift AI
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="developer-sandbox-openshift-ai"
                                        description="Create, train, and service artificial intelligence and machine learning (AI/ML) models."
                                        onClick={() => console.log('Developer Sandbox | OpenShift AI clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('developer-sandbox-openshift-ai');
                                            }}
                                            isFavorited={favoritedItems.has('developer-sandbox-openshift-ai')}
                                            aria-label={favoritedItems.has('developer-sandbox-openshift-ai') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Developer Sandbox | OpenShift AI
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                </Menu>
                              ) : currentMenuItem.id === 'alerting-data-integrations' ? (
                                <Menu>
                                  <MenuGroup label="Console Settings" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="alert-manager-settings"
                                        description="Mary to add a description here eventually"
                                        onClick={() => {
                                          navigate('/alert-manager');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('alert-manager-settings');
                                            }}
                                            isFavorited={favoritedItems.has('alert-manager-settings')}
                                            aria-label={favoritedItems.has('alert-manager-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Alert Manager | Settings
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="data-integration-settings"
                                        description="Mary to add a description here eventually"
                                        onClick={() => {
                                          navigate('/data-integrations');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('data-integration-settings');
                                            }}
                                            isFavorited={favoritedItems.has('data-integration-settings')}
                                            aria-label={favoritedItems.has('data-integration-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Data Integration | Settings
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="event-log-settings"
                                        description="Mary to add a description here eventually"
                                        onClick={() => {
                                          navigate('/event-log');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('event-log-settings');
                                            }}
                                            isFavorited={favoritedItems.has('event-log-settings')}
                                            aria-label={favoritedItems.has('event-log-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Event Log | Settings
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="overview-settings"
                                        description="Mary to add a description here evenually"
                                        onClick={() => {
                                          navigate('/overview');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('overview-settings');
                                            }}
                                            isFavorited={favoritedItems.has('overview-settings')}
                                            aria-label={favoritedItems.has('overview-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Overview | Settings
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                </Menu>
                              ) : currentMenuItem.id === 'identity-access-mgmt' ? (
                                <Menu>
                                  <MenuGroup label="Identity & Access Management (IAM)" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="users"
                                        description="Manage user accounts and their access permissions"
                                        onClick={() => {
                                          navigate('/users');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('users');
                                            }}
                                            isFavorited={favoritedItems.has('users')}
                                            aria-label={favoritedItems.has('users') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Users
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="groups"
                                        description="Create and manage user groups and group-based permissions"
                                        onClick={() => {
                                          navigate('/groups');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('groups');
                                            }}
                                            isFavorited={favoritedItems.has('groups')}
                                            aria-label={favoritedItems.has('groups') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Groups
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="roles"
                                        description="Define and manage user roles with specific permissions and access levels"
                                        onClick={() => {
                                          navigate('/roles');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('roles');
                                            }}
                                            isFavorited={favoritedItems.has('roles')}
                                            aria-label={favoritedItems.has('roles') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Roles
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="authentication-factors"
                                        description="Configure multi-factor authentication and security settings"
                                        onClick={() => console.log('Authentication Factors clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('authentication-factors');
                                            }}
                                            isFavorited={favoritedItems.has('authentication-factors')}
                                            aria-label={favoritedItems.has('authentication-factors') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Authentication Factors
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="service-accounts"
                                        description="Create and manage service accounts for automated systems and application integrations"
                                        onClick={() => console.log('Service Accounts clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('service-accounts');
                                            }}
                                            isFavorited={favoritedItems.has('service-accounts')}
                                            aria-label={favoritedItems.has('service-accounts') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Service Accounts
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="identity-provider-information"
                                        description="Configure and manage external identity providers and federation settings"
                                        onClick={() => console.log('Identity Provider Information clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('identity-provider-information');
                                            }}
                                            isFavorited={favoritedItems.has('identity-provider-information')}
                                            aria-label={favoritedItems.has('identity-provider-information') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Identity Provider Information
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="workspaces"
                                        description="Manage organizational workspaces and their access controls"
                                        onClick={() => console.log('Workspaces clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('workspaces');
                                            }}
                                            isFavorited={favoritedItems.has('workspaces')}
                                            aria-label={favoritedItems.has('workspaces') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Workspaces
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Console Settings" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                                                                  itemId="directory-domain-services"
                                        description="Configure directory services and domain management settings"
                                        onClick={() => console.log('Directory and Domain Services clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('directory-domain-services');
                                            }}
                                            isFavorited={favoritedItems.has('directory-domain-services')}
                                            aria-label={favoritedItems.has('directory-domain-services') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Directory and Domain Services
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                            </div>
                                </Menu>
                              ) : currentMenuItem.id === 'system-configuration' ? (
                                <Menu>
                                  <MenuGroup label="Red Hat Enterprise Linux" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="rhel-rhc"
                                        description="Configure and manage remote host connections and system configurations"
                                        onClick={() => console.log('Remote Host Configuration (RHC) clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-rhc');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-rhc')}
                                            aria-label={favoritedItems.has('rhel-rhc') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Remote Host Configuration (RHC)
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-activation-keys"
                                        description="Manage activation keys for system registration and subscription management"
                                        onClick={() => console.log('Activation Keys clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-activation-keys');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-activation-keys')}
                                            aria-label={favoritedItems.has('rhel-activation-keys') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Activation Keys
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-registration-assistant"
                                        description="Step-by-step guidance for registering systems to Red Hat services"
                                        onClick={() => console.log('Registration Assistant clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-registration-assistant');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-registration-assistant')}
                                            aria-label={favoritedItems.has('rhel-registration-assistant') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Registration Assistant
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-staleness-deletion"
                                        description="Configure system staleness detection and automated deletion policies"
                                        onClick={() => console.log('Staleness & Deletion clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-staleness-deletion');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-staleness-deletion')}
                                            aria-label={favoritedItems.has('rhel-staleness-deletion') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Staleness & Deletion
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Red Hat Ansible Automation Platform" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                                                                  itemId="ansible-registration-assistant"
                                        description="Guided setup for registering and configuring Ansible automation workflows"
                                        onClick={() => console.log('Ansible Registration Assistant clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('ansible-registration-assistant');
                                            }}
                                            isFavorited={favoritedItems.has('ansible-registration-assistant')}
                                            aria-label={favoritedItems.has('ansible-registration-assistant') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Registration Assistant
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Console Settings" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                                                                  itemId="console-alert-manager"
                                        description="Configure and manage system alerts, notifications, and escalation policies"
                                        onClick={() => {
                                          navigate('/alert-manager');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('console-alert-manager');
                                            }}
                                            isFavorited={favoritedItems.has('console-alert-manager')}
                                            aria-label={favoritedItems.has('console-alert-manager') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Alert Manager
                                        </MenuItem>
                                        <MenuItem 
                                                                                  itemId="console-data-integration"
                                        description="Manage data integration workflows, connectors, and synchronization settings"
                                        onClick={() => {
                                          navigate('/data-integrations');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('console-data-integration');
                                            }}
                                            isFavorited={favoritedItems.has('console-data-integration')}
                                            aria-label={favoritedItems.has('console-data-integration') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Data Integration
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                </Menu>
                              ) : (
                                <Menu>
                                  <MenuGroup label="Red Hat Enterprise Linux" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="rhel-insights"
                                        description="Proactive identification and remediation of threats to security, performance, availability, and stability"
                                        onClick={() => console.log('Red Hat Insights clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-insights');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-insights')}
                                            aria-label={favoritedItems.has('rhel-insights') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Red Hat Insights
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-patch"
                                        description="Automated patching and system updates for Red Hat Enterprise Linux environments"
                                        onClick={() => console.log('Patch Management clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-patch');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-patch')}
                                            aria-label={favoritedItems.has('rhel-patch') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Patch Management
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Red Hat OpenShift" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="openshift-clusters"
                                          description="Manage and monitor your OpenShift Kubernetes clusters across hybrid cloud environments"
                                          onClick={() => console.log('OpenShift Clusters clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('openshift-clusters');
                                            }}
                                              isFavorited={favoritedItems.has('openshift-clusters')}
                                            aria-label={favoritedItems.has('openshift-clusters') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          OpenShift Clusters
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="container-registry"
                                          description="Secure container image registry for storing, managing, and deploying container images"
                                          onClick={() => console.log('Container Registry clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('container-registry');
                                            }}
                                              isFavorited={favoritedItems.has('container-registry')}
                                            aria-label={favoritedItems.has('container-registry') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Container Registry
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Red Hat Ansible Automation Platform" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="automation-hub"
                                          description="Centralized repository for discovering, downloading, and sharing Ansible content collections"
                                          onClick={() => console.log('Automation Hub clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('automation-hub');
                                            }}
                                              isFavorited={favoritedItems.has('automation-hub')}
                                            aria-label={favoritedItems.has('automation-hub') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Automation Hub
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="automation-controller"
                                          description="Enterprise automation control plane for scheduling, scaling, and managing Ansible playbooks"
                                          onClick={() => console.log('Automation Controller clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('automation-controller');
                                            }}
                                              isFavorited={favoritedItems.has('automation-controller')}
                                            aria-label={favoritedItems.has('automation-controller') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Automation Controller
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Identity & Access Management (IAM)" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="user-access"
                                          description="Manage user permissions, roles, and access controls across Red Hat services"
                                          onClick={() => console.log('User Access clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('user-access-item');
                                            }}
                                              isFavorited={favoritedItems.has('user-access-item')}
                                            aria-label={favoritedItems.has('user-access-item') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          User Access
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="service-accounts"
                                          description="Create and manage service accounts for automated systems and application integrations"
                                          onClick={() => console.log('Service Accounts clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('service-accounts-item');
                                            }}
                                              isFavorited={favoritedItems.has('service-accounts-item')}
                                            aria-label={favoritedItems.has('service-accounts-item') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Service Accounts
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Console Settings" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="preferences"
                                          description="Customize your console experience, themes, and personal settings"
                                          onClick={() => console.log('Preferences clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('preferences');
                                            }}
                                              isFavorited={favoritedItems.has('preferences')}
                                            aria-label={favoritedItems.has('preferences') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Preferences
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="notifications"
                                          description="Configure alert preferences and notification settings for system events"
                                          onClick={() => console.log('Notifications clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('notifications');
                                            }}
                                              isFavorited={favoritedItems.has('notifications')}
                                            aria-label={favoritedItems.has('notifications') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Notifications
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Subscription Services" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="subscriptions"
                                          description="View and manage your Red Hat product subscriptions and entitlements"
                                          onClick={() => console.log('Subscriptions clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('subscriptions');
                                            }}
                                              isFavorited={favoritedItems.has('subscriptions')}
                                            aria-label={favoritedItems.has('subscriptions') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Subscriptions
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="billing"
                                          description="Access billing information, invoices, and payment methods for Red Hat services"
                                          onClick={() => console.log('Billing clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('billing');
                                            }}
                                              isFavorited={favoritedItems.has('billing')}
                                            aria-label={favoritedItems.has('billing') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Billing
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Other" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="documentation"
                                          description="Access comprehensive guides, tutorials, and technical documentation for Red Hat products"
                                          onClick={() => console.log('Documentation clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('documentation');
                                            }}
                                              isFavorited={favoritedItems.has('documentation')}
                                            aria-label={favoritedItems.has('documentation') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Documentation
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="support"
                                          description="Get help from Red Hat support team, submit cases, and access community resources"
                                          onClick={() => console.log('Support clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('support');
                                            }}
                                              isFavorited={favoritedItems.has('support')}
                                            aria-label={favoritedItems.has('support') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Support
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                </Menu>
                              )}
                            </FlexItem>
                          </Flex>
                        );
                      })()}
                    </div>
                  </SplitItem>
                </Split>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      
      {/* Global Search Dropdown */}
      <GlobalSearch 
        isVisible={isGlobalSearchOpen} 
        onClose={closeGlobalSearch} 
      />
      
      {/* Ask Red Hat Overlay */}
      <AskRedHat 
        isVisible={isAskRedHatVisible} 
        onClose={hideAskRedHat}
      />
      
      {/* Setup Guide Overlay */}
      <SetupGuide 
        isOpen={isSetupGuideVisible} 
        onClose={hideSetupGuide}
      />

      {/* Help Panel - removed, pages handle their own inline Help panels */}

    </React.Fragment>
  );
};

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  return (
    <GlobalSearchProvider>
      <AskRedHatProvider>
        <SetupGuideProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </SetupGuideProvider>
      </AskRedHatProvider>
    </GlobalSearchProvider>
  );
};

export { AppLayout };
