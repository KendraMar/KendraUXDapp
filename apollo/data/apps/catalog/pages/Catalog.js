import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  Flex,
  FlexItem,
  Label,
  Badge,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Alert,
  Button,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
  Tabs,
  Tab,
  TabTitleText,
  TabTitleIcon,
  Split,
  SplitItem,
  Tooltip,
  Divider,
  LabelGroup,
  TextContent,
  Text,
  Panel,
  PanelMain,
  PanelMainBody,
  Grid,
  GridItem,
  Icon
} from '@patternfly/react-core';
import {
  CatalogIcon,
  CubesIcon,
  CodeIcon,
  PaintBrushIcon,
  BookIcon,
  BookOpenIcon,
  ListIcon,
  ThIcon,
  StarIcon,
  DownloadIcon,
  CheckCircleIcon,
  ArrowCircleUpIcon,
  SearchIcon,
  ExternalLinkAltIcon,
  PlusCircleIcon,
  SyncAltIcon,
  HomeIcon,
  SlackHashIcon,
  GitlabIcon,
  ObjectGroupIcon,
  CalendarAltIcon,
  FlaskIcon,
  PaletteIcon,
  TachometerAltIcon,
  CommentsIcon,
  UserIcon,
  UsersIcon,
  EditIcon,
  PluggedIcon,
  BundleIcon,
  OutlinedClockIcon,
  RocketIcon,
  BellIcon
} from '@patternfly/react-icons';

// Icon mapping for catalog items
const catalogIconMap = {
  CubesIcon: CubesIcon,
  CodeIcon: CodeIcon,
  PaintBrushIcon: PaintBrushIcon,
  BookIcon: BookIcon,
  BookOpenIcon: BookOpenIcon,
  ListIcon: ListIcon,
  HomeIcon: HomeIcon,
  SlackHashIcon: SlackHashIcon,
  GitlabIcon: GitlabIcon,
  ObjectGroupIcon: ObjectGroupIcon,
  CalendarAltIcon: CalendarAltIcon,
  FlaskIcon: FlaskIcon,
  PaletteIcon: PaletteIcon,
  TachometerAltIcon: TachometerAltIcon,
  CommentsIcon: CommentsIcon,
  UserIcon: UserIcon,
  UsersIcon: UsersIcon,
  EditIcon: EditIcon,
  RocketIcon: RocketIcon,
  BellIcon: BellIcon
};

// Category definitions
const CATEGORIES = [
  { id: 'all', label: 'All', icon: <CatalogIcon />, description: 'Browse everything in the catalog' },
  { id: 'application', label: 'Applications', icon: <CubesIcon />, description: 'Extend Apollo with new features' },
  { id: 'integration', label: 'Integrations', icon: <PluggedIcon />, description: 'Connect to external services' },
  { id: 'agent', label: 'Agents', icon: <UserIcon />, description: 'AI-powered assistants' },
  { id: 'template', label: 'Templates', icon: <FlaskIcon />, description: 'Pre-configured workspace templates' },
  { id: 'theme', label: 'Themes', icon: <PaletteIcon />, description: 'Customize the look and feel' },
  { id: 'updates', label: 'Updates', icon: <ArrowCircleUpIcon />, description: 'Available updates for installed items' }
];

const Catalog = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [categoryCounts, setCategoryCounts] = useState({});
  const [updateCount, setUpdateCount] = useState(0);
  const [installingId, setInstallingId] = useState(null);

  // Fetch category counts on mount
  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  // Fetch items when category or search changes
  useEffect(() => {
    fetchItems();
  }, [activeCategory, searchValue]);

  const fetchCategoryCounts = async () => {
    try {
      const res = await fetch('/api/catalog/categories');
      const data = await res.json();
      if (data.success) {
        setCategoryCounts(data.categories || {});
        setUpdateCount(data.updates || 0);
      }
    } catch (err) {
      console.error('Failed to fetch category counts:', err);
    }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/catalog/items?';
      const params = new URLSearchParams();
      
      if (activeCategory === 'updates') {
        url = '/api/catalog/updates';
      } else if (activeCategory !== 'all') {
        params.set('type', activeCategory);
      }
      
      if (searchValue) {
        params.set('search', searchValue);
      }
      
      const res = await fetch(activeCategory === 'updates' ? url : `${url}${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setItems(data.items || []);
      } else {
        setError(data.error || 'Failed to load catalog');
      }
    } catch (err) {
      setError('Failed to fetch catalog: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchValue]);

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    const params = new URLSearchParams(searchParams);
    params.set('category', categoryId);
    setSearchParams(params);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleInstall = async (e, itemId) => {
    e.stopPropagation();
    setInstallingId(itemId);
    try {
      const res = await fetch(`/api/catalog/items/${itemId}/install`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Update the item in state
        setItems(prev => prev.map(item =>
          item.id === itemId ? { ...item, installed: true, installedVersion: item.version } : item
        ));
        fetchCategoryCounts();
      }
    } catch (err) {
      console.error('Failed to install:', err);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUpdate = async (e, itemId) => {
    e.stopPropagation();
    setInstallingId(itemId);
    try {
      const res = await fetch(`/api/catalog/items/${itemId}/update`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(item =>
          item.id === itemId ? { ...item, installedVersion: item.version } : item
        ));
        fetchCategoryCounts();
      }
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setInstallingId(null);
    }
  };

  const getItemIcon = (iconName) => {
    const IconComponent = catalogIconMap[iconName];
    return IconComponent ? <IconComponent /> : <CubesIcon />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      application: { text: 'Application', color: 'blue' },
      integration: { text: 'Integration', color: 'green' },
      agent: { text: 'Agent', color: 'purple' },
      template: { text: 'Template', color: 'orange' },
      theme: { text: 'Theme', color: 'cyan' }
    };
    return labels[type] || { text: type, color: 'grey' };
  };

  const hasUpdate = (item) => {
    return item.installed && item.installedVersion && item.version !== item.installedVersion;
  };

  // ── Render item card (grid view) ──────────────────────────
  const renderItemCard = (item) => {
    const typeLabel = getTypeLabel(item.type);
    const itemHasUpdate = hasUpdate(item);

    return (
      <Card
        key={item.id}
        isClickable
        isCompact
        className="catalog-item-card"
        onClick={() => navigate(`/catalog/${item.id}`)}
      >
        <CardHeader>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ width: '100%' }}>
            <FlexItem>
              <div className="catalog-item-icon">
                {getItemIcon(item.icon)}
              </div>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }}>
              <CardTitle className="catalog-item-title">{item.name}</CardTitle>
              <div className="catalog-item-author">{item.author}</div>
            </FlexItem>
            <FlexItem>
              <Label color={typeLabel.color} isCompact>{typeLabel.text}</Label>
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardBody>
          <div className="catalog-item-description">
            {item.shortDescription}
          </div>
          <div className="catalog-item-tags">
            <LabelGroup isCompact numLabels={3}>
              {item.tags.slice(0, 4).map(tag => (
                <Label key={tag} isCompact variant="outline" color="grey">{tag}</Label>
              ))}
            </LabelGroup>
          </div>
        </CardBody>
        <CardFooter>
          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%' }}>
            <FlexItem>
              <Flex gap={{ default: 'gapMd' }}>
                <FlexItem>
                  <Tooltip content="Stars">
                    <span className="catalog-item-stat">
                      <StarIcon className="catalog-stat-icon catalog-stat-star" /> {item.stars}
                    </span>
                  </Tooltip>
                </FlexItem>
                <FlexItem>
                  <Tooltip content="Downloads">
                    <span className="catalog-item-stat">
                      <DownloadIcon className="catalog-stat-icon" /> {item.downloads.toLocaleString()}
                    </span>
                  </Tooltip>
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              {item.installed && !itemHasUpdate ? (
                <Label color="green" icon={<CheckCircleIcon />} isCompact>
                  Installed
                </Label>
              ) : itemHasUpdate ? (
                <Button
                  variant="warning"
                  size="sm"
                  icon={<ArrowCircleUpIcon />}
                  onClick={(e) => handleUpdate(e, item.id)}
                  isLoading={installingId === item.id}
                  isDisabled={installingId === item.id}
                >
                  Update
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PlusCircleIcon />}
                  onClick={(e) => handleInstall(e, item.id)}
                  isLoading={installingId === item.id}
                  isDisabled={installingId === item.id}
                >
                  Install
                </Button>
              )}
            </FlexItem>
          </Flex>
        </CardFooter>
      </Card>
    );
  };

  // ── Render item row (list view) ───────────────────────────
  const renderItemRow = (item) => {
    const typeLabel = getTypeLabel(item.type);
    const itemHasUpdate = hasUpdate(item);

    return (
      <div
        key={item.id}
        className="catalog-list-item"
        onClick={() => navigate(`/catalog/${item.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/catalog/${item.id}`); }}
      >
        <div className="catalog-list-item-icon">
          {getItemIcon(item.icon)}
        </div>
        <div className="catalog-list-item-content">
          <div className="catalog-list-item-header">
            <span className="catalog-list-item-name">{item.name}</span>
            <Label color={typeLabel.color} isCompact>{typeLabel.text}</Label>
            {item.installed && !itemHasUpdate && (
              <Label color="green" icon={<CheckCircleIcon />} isCompact>Installed</Label>
            )}
            {itemHasUpdate && (
              <Label color="orange" icon={<ArrowCircleUpIcon />} isCompact>
                Update available
              </Label>
            )}
          </div>
          <div className="catalog-list-item-desc">{item.shortDescription}</div>
          <div className="catalog-list-item-meta">
            <span className="catalog-item-stat">
              <StarIcon className="catalog-stat-icon catalog-stat-star" /> {item.stars}
            </span>
            <span className="catalog-item-stat">
              <DownloadIcon className="catalog-stat-icon" /> {item.downloads.toLocaleString()}
            </span>
            <span className="catalog-item-stat">
              {item.author}
            </span>
            <span className="catalog-item-stat">
              v{item.version}
            </span>
          </div>
        </div>
        <div className="catalog-list-item-action">
          {item.installed && !itemHasUpdate ? (
            <Label color="green" icon={<CheckCircleIcon />} isCompact>Installed</Label>
          ) : itemHasUpdate ? (
            <Button
              variant="warning"
              size="sm"
              icon={<ArrowCircleUpIcon />}
              onClick={(e) => handleUpdate(e, item.id)}
              isLoading={installingId === item.id}
              isDisabled={installingId === item.id}
            >
              Update
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={<PlusCircleIcon />}
              onClick={(e) => handleInstall(e, item.id)}
              isLoading={installingId === item.id}
              isDisabled={installingId === item.id}
            >
              Install
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ── Active category info ──────────────────────────────────
  const activeCategoryInfo = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="catalog-page">
      {/* Left sidebar with categories */}
      <div className="catalog-sidebar">
        <div className="catalog-sidebar-header">
          <CatalogIcon className="catalog-sidebar-title-icon" />
          <span className="catalog-sidebar-title">Catalog</span>
        </div>
        <nav className="catalog-sidebar-nav">
          {CATEGORIES.map(category => {
            const count = category.id === 'all'
              ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
              : category.id === 'updates'
                ? updateCount
                : (categoryCounts[category.id] || 0);

            return (
              <button
                key={category.id}
                className={`catalog-sidebar-item ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <span className="catalog-sidebar-item-icon">{category.icon}</span>
                <span className="catalog-sidebar-item-label">{category.label}</span>
                {count > 0 && (
                  <Badge
                    className={`catalog-sidebar-badge ${category.id === 'updates' && updateCount > 0 ? 'catalog-sidebar-badge-update' : ''}`}
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <Divider className="catalog-sidebar-divider" />

        <div className="catalog-sidebar-section-title">Sources</div>
        <div className="catalog-sidebar-source">
          <GitlabIcon className="catalog-sidebar-source-icon" />
          <div className="catalog-sidebar-source-info">
            <div className="catalog-sidebar-source-name">Apollo Community</div>
            <div className="catalog-sidebar-source-url">gitlab.com/apollo-community</div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="catalog-content">
        {/* Search and view toggle bar */}
        <div className="catalog-toolbar">
          <div className="catalog-search-wrapper">
            <SearchInput
              placeholder="Search the catalog..."
              value={searchValue}
              onChange={(event, value) => handleSearch(value)}
              onClear={() => handleSearch('')}
              className="catalog-search"
            />
          </div>
          <div className="catalog-toolbar-actions">
            <ToggleGroup aria-label="View mode">
              <ToggleGroupItem
                icon={<ThIcon />}
                aria-label="Grid view"
                isSelected={viewMode === 'grid'}
                onChange={() => setViewMode('grid')}
              />
              <ToggleGroupItem
                icon={<ListIcon />}
                aria-label="List view"
                isSelected={viewMode === 'list'}
                onChange={() => setViewMode('list')}
              />
            </ToggleGroup>
          </div>
        </div>

        {/* Category header */}
        <div className="catalog-category-header">
          <div className="catalog-category-info">
            <Title headingLevel="h2" size="xl">
              {activeCategoryInfo?.label || 'Catalog'}
            </Title>
            <Content component="p" className="catalog-category-description">
              {activeCategoryInfo?.description}
            </Content>
          </div>
          {activeCategory === 'updates' && updateCount > 0 && (
            <Button variant="primary" icon={<SyncAltIcon />}>
              Update all
            </Button>
          )}
        </div>

        {/* Items */}
        {loading ? (
          <div className="catalog-loading">
            <Spinner size="xl" />
            <div className="catalog-loading-text">Loading catalog...</div>
          </div>
        ) : error ? (
          <Alert variant="danger" title="Error loading catalog" className="catalog-error">
            {error}
          </Alert>
        ) : items.length === 0 ? (
          <EmptyState>
            <SearchIcon style={{ fontSize: '3rem', color: 'var(--pf-t--global--icon--color--subtle)', marginBottom: '1rem' }} />
            <Title headingLevel="h3" size="lg">
              {searchValue ? 'No results found' : 'No items in this category'}
            </Title>
            <EmptyStateBody>
              {searchValue
                ? `No catalog items match "${searchValue}". Try a different search term.`
                : activeCategory === 'updates'
                  ? 'All your installed items are up to date!'
                  : 'Check back later for new additions to the catalog.'
              }
            </EmptyStateBody>
            {searchValue && (
              <Button variant="link" onClick={() => handleSearch('')}>
                Clear search
              </Button>
            )}
          </EmptyState>
        ) : viewMode === 'grid' ? (
          <div className="catalog-grid">
            {items.map(item => renderItemCard(item))}
          </div>
        ) : (
          <div className="catalog-list">
            {items.map(item => renderItemRow(item))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
