import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  Badge,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Alert,
  Button,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tabs,
  Tab,
  TabTitleText,
  Split,
  SplitItem,
  TextContent,
  Text,
  Grid,
  GridItem,
  Icon
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  StarIcon,
  DownloadIcon,
  CheckCircleIcon,
  ArrowCircleUpIcon,
  ExternalLinkAltIcon,
  PlusCircleIcon,
  TrashIcon,
  CubesIcon,
  CodeIcon,
  PaintBrushIcon,
  BookIcon,
  BookOpenIcon,
  ListIcon,
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
  OutlinedClockIcon,
  TagIcon,
  InfoCircleIcon,
  BellIcon,
  RocketIcon
} from '@patternfly/react-icons';

// Icon mapping
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

const CatalogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/catalog/items/${id}`);
      const data = await res.json();
      if (data.success) {
        setItem(data.item);
      } else {
        setError(data.error || 'Item not found');
      }
    } catch (err) {
      setError('Failed to fetch item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const res = await fetch(`/api/catalog/items/${id}/install`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setItem(data.item);
      }
    } catch (err) {
      console.error('Failed to install:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstall = async () => {
    setIsInstalling(true);
    try {
      const res = await fetch(`/api/catalog/items/${id}/uninstall`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setItem(data.item);
      }
    } catch (err) {
      console.error('Failed to uninstall:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    setIsInstalling(true);
    try {
      const res = await fetch(`/api/catalog/items/${id}/update`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setItem(data.item);
      }
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setIsInstalling(false);
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

  const hasUpdate = item?.installed && item?.installedVersion && item?.version !== item?.installedVersion;

  // Simple markdown-to-HTML renderer for README content
  const renderMarkdown = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';
    let inList = false;
    let listItems = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="catalog-readme-list">
            {listItems.map((li, i) => <li key={i}>{li}</li>)}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      // Code block
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="catalog-readme-code">
              <code>{codeContent.trim()}</code>
            </pre>
          );
          codeContent = '';
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Headings
      if (line.startsWith('# ')) {
        flushList();
        elements.push(<h1 key={index} className="catalog-readme-h1">{line.slice(2)}</h1>);
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(<h2 key={index} className="catalog-readme-h2">{line.slice(3)}</h2>);
        return;
      }
      if (line.startsWith('### ')) {
        flushList();
        elements.push(<h3 key={index} className="catalog-readme-h3">{line.slice(4)}</h3>);
        return;
      }

      // List items
      if (line.startsWith('- ')) {
        inList = true;
        // Handle bold in list items
        const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        listItems.push(<span dangerouslySetInnerHTML={{ __html: content }} />);
        return;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        return;
      }

      // Regular paragraph — handle inline bold and code
      flushList();
      const content = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code class="catalog-readme-inline-code">$1</code>');
      elements.push(
        <p key={index} className="catalog-readme-paragraph" dangerouslySetInnerHTML={{ __html: content }} />
      );
    });

    flushList();
    return elements;
  };

  if (loading) {
    return (
      <div className="catalog-detail-loading">
        <Spinner size="xl" />
        <div style={{ marginTop: '1rem' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-detail-page">
        <PageSection>
          <Button
            variant="link"
            icon={<ArrowLeftIcon />}
            onClick={() => navigate('/catalog')}
            className="catalog-detail-back"
          >
            Back to Catalog
          </Button>
          <Alert variant="danger" title="Error" style={{ marginTop: '1rem' }}>
            {error}
          </Alert>
        </PageSection>
      </div>
    );
  }

  if (!item) return null;

  const typeLabel = getTypeLabel(item.type);

  return (
    <div className="catalog-detail-page">
      {/* Header */}
      <div className="catalog-detail-header">
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/catalog')}
          className="catalog-detail-back"
        >
          Back to Catalog
        </Button>

        <div className="catalog-detail-hero">
          <div className="catalog-detail-hero-icon">
            {getItemIcon(item.icon)}
          </div>
          <div className="catalog-detail-hero-info">
            <div className="catalog-detail-hero-title-row">
              <Title headingLevel="h1" size="2xl">{item.name}</Title>
              <Label color={typeLabel.color}>{typeLabel.text}</Label>
              {item.installed && !hasUpdate && (
                <Label color="green" icon={<CheckCircleIcon />}>Installed</Label>
              )}
              {hasUpdate && (
                <Label color="orange" icon={<ArrowCircleUpIcon />}>
                  Update available ({item.installedVersion} → {item.version})
                </Label>
              )}
            </div>
            <div className="catalog-detail-hero-author">
              by {item.author}
            </div>
            <div className="catalog-detail-hero-description">
              {item.description}
            </div>
            <div className="catalog-detail-hero-stats">
              <span className="catalog-item-stat">
                <StarIcon className="catalog-stat-icon catalog-stat-star" /> {item.stars} stars
              </span>
              <span className="catalog-item-stat">
                <DownloadIcon className="catalog-stat-icon" /> {item.downloads.toLocaleString()} downloads
              </span>
              <span className="catalog-item-stat">
                <TagIcon className="catalog-stat-icon" /> v{item.version}
              </span>
              <span className="catalog-item-stat">
                <OutlinedClockIcon className="catalog-stat-icon" /> Updated {new Date(item.updated).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="catalog-detail-hero-actions">
            {!item.installed ? (
              <Button
                variant="primary"
                size="lg"
                icon={<PlusCircleIcon />}
                onClick={handleInstall}
                isLoading={isInstalling}
                isDisabled={isInstalling}
              >
                Add to Apollo
              </Button>
            ) : hasUpdate ? (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowCircleUpIcon />}
                  onClick={handleUpdate}
                  isLoading={isInstalling}
                  isDisabled={isInstalling}
                >
                  Update to v{item.version}
                </Button>
                <Button
                  variant="link"
                  isDanger
                  icon={<TrashIcon />}
                  onClick={handleUninstall}
                  isDisabled={isInstalling}
                >
                  Uninstall
                </Button>
              </>
            ) : (
              <Button
                variant="link"
                isDanger
                icon={<TrashIcon />}
                onClick={handleUninstall}
                isDisabled={isInstalling}
              >
                Uninstall
              </Button>
            )}
            {item.repository && (
              <Button
                variant="link"
                icon={<ExternalLinkAltIcon />}
                component="a"
                href={item.repository}
                target="_blank"
                rel="noopener noreferrer"
              >
                View source
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <div className="catalog-detail-content">
        <Tabs
          activeKey={activeTab}
          onSelect={(event, tabIndex) => setActiveTab(tabIndex)}
          className="catalog-detail-tabs"
        >
          <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
            <div className="catalog-detail-tab-content">
              <Grid hasGutter>
                <GridItem span={8}>
                  {/* README */}
                  <Card className="catalog-detail-readme-card">
                    <CardBody>
                      <div className="catalog-readme">
                        {renderMarkdown(item.readme)}
                      </div>
                    </CardBody>
                  </Card>
                </GridItem>
                <GridItem span={4}>
                  {/* Metadata sidebar */}
                  <Card className="catalog-detail-meta-card">
                    <CardHeader>
                      <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <DescriptionList isCompact>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Version</DescriptionListTerm>
                          <DescriptionListDescription>{item.version}</DescriptionListDescription>
                        </DescriptionListGroup>
                        {item.installedVersion && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>Installed</DescriptionListTerm>
                            <DescriptionListDescription>v{item.installedVersion}</DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        <DescriptionListGroup>
                          <DescriptionListTerm>Author</DescriptionListTerm>
                          <DescriptionListDescription>{item.author}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Type</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label color={typeLabel.color} isCompact>{typeLabel.text}</Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Updated</DescriptionListTerm>
                          <DescriptionListDescription>
                            {new Date(item.updated).toLocaleDateString()}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Created</DescriptionListTerm>
                          <DescriptionListDescription>
                            {new Date(item.created).toLocaleDateString()}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        {item.repository && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>Repository</DescriptionListTerm>
                            <DescriptionListDescription>
                              <a
                                href={item.repository}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="catalog-detail-link"
                              >
                                View source <ExternalLinkAltIcon />
                              </a>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                      </DescriptionList>
                    </CardBody>
                  </Card>

                  {/* Capabilities */}
                  {item.capabilities && item.capabilities.length > 0 && (
                    <Card className="catalog-detail-meta-card" style={{ marginTop: '1rem' }}>
                      <CardHeader>
                        <CardTitle>Capabilities</CardTitle>
                      </CardHeader>
                      <CardBody>
                        <LabelGroup>
                          {item.capabilities.map(cap => (
                            <Label key={cap} isCompact variant="filled" color="blue">
                              {cap.replace(/-/g, ' ')}
                            </Label>
                          ))}
                        </LabelGroup>
                      </CardBody>
                    </Card>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <Card className="catalog-detail-meta-card" style={{ marginTop: '1rem' }}>
                      <CardHeader>
                        <CardTitle>Tags</CardTitle>
                      </CardHeader>
                      <CardBody>
                        <LabelGroup>
                          {item.tags.map(tag => (
                            <Label
                              key={tag}
                              isCompact
                              variant="outline"
                              color="grey"
                              onClick={() => navigate(`/catalog?search=${tag}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              {tag}
                            </Label>
                          ))}
                        </LabelGroup>
                      </CardBody>
                    </Card>
                  )}
                </GridItem>
              </Grid>
            </div>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Changelog</TabTitleText>}>
            <div className="catalog-detail-tab-content">
              <Card>
                <CardBody>
                  <EmptyState>
                    <InfoCircleIcon style={{ fontSize: '2rem', color: 'var(--pf-t--global--icon--color--subtle)', marginBottom: '1rem' }} />
                    <Title headingLevel="h3" size="lg">No changelog available</Title>
                    <EmptyStateBody>
                      Changelog information will be available once the catalog source is connected.
                    </EmptyStateBody>
                  </EmptyState>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Reviews</TabTitleText>}>
            <div className="catalog-detail-tab-content">
              <Card>
                <CardBody>
                  <EmptyState>
                    <StarIcon style={{ fontSize: '2rem', color: 'var(--pf-t--global--icon--color--subtle)', marginBottom: '1rem' }} />
                    <Title headingLevel="h3" size="lg">No reviews yet</Title>
                    <EmptyStateBody>
                      Be the first to review this {item.type}.
                    </EmptyStateBody>
                  </EmptyState>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default CatalogDetail;
