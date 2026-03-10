import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  EmptyState,
  ExpandableSection,
  Flex,
  FlexItem,
  JumpLinks,
  JumpLinksItem,
  Label,
  PageSection,
  SearchInput,
  Title
} from '@patternfly/react-core';
import { BookOpenIcon, BookmarkIcon, CubesIcon, ExternalLinkAltIcon, StarIcon } from '@patternfly/react-icons';

const LearningResources: React.FunctionComponent = () => {
  const [expandedSections, setExpandedSections] = React.useState<{[key: string]: boolean}>({
    'section-1': false,
    'section-2': false,
    'section-3': false,
    'section-4': false,
    'section-5': false
  });

  const [searchValue, setSearchValue] = React.useState<string>('');

  const handleSectionToggle = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/overview">Settings</BreadcrumbItem>
          <BreadcrumbItem isActive>Learning Resources</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <BookOpenIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Learning Resources</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Get quick access to documentation, quick starts, learning paths, and more related to Settings. For all learning resources across the Hybrid Cloud Console, browse the All Learning catalog.</p>
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
      
      <PageSection>
        <Flex justifyContent={{ default: 'justifyContentFlexStart' }} spaceItems={{ default: 'spaceItemsLg' }}>
          {/* Left side - 75% width for expandable sections */}
          <FlexItem flex={{ default: 'flex_3' }} style={{ maxWidth: '75%' }}>
            {/* Search bar and counter */}
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '24px' }}>
              <FlexItem flex={{ default: 'flex_1' }} style={{ maxWidth: '400px' }}>
                <SearchInput
                  placeholder="Search learning resources..."
                  value={searchValue}
                  onChange={(event, value) => handleSearchChange(value)}
                  onClear={() => handleSearchChange('')}
                />
              </FlexItem>
              <FlexItem>
                <div style={{ color: '#6a6e73', fontSize: '14px' }}>
                  Showing 5 of 5 resources
                </div>
              </FlexItem>
            </Flex>
            
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <ExpandableSection 
                  displaySize="lg"
                  toggleText="Bookmarks"
                  isExpanded={expandedSections['section-1']}
                  onToggle={() => handleSectionToggle('section-1')}
                >
                  <Flex wrap="wrap" spaceItems={{ default: 'spaceItemsMd' }}>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <StarIcon style={{ marginRight: '8px', color: '#f0ab00' }} />
                            Alert Manager Quick Reference
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="blue">Bookmark</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Personal bookmark for quick access to alert notification setup and configuration guides.
                      </CardBody>
                    </Card>
                  </Flex>
                </ExpandableSection>
              </FlexItem>
              
              <FlexItem>
                <ExpandableSection 
                  displaySize="lg"
                  toggleText="Documentation"
                  isExpanded={expandedSections['section-2']}
                  onToggle={() => handleSectionToggle('section-2')}
                >
                  <Flex wrap="wrap" spaceItems={{ default: 'spaceItemsMd' }}>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <BookOpenIcon style={{ marginRight: '8px', color: '#0066cc' }} />
                            Getting Started with Alert Manager
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="orange">Documentation</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Learn the basics of configuring alert notifications and managing notification preferences.
                      </CardBody>
                    </Card>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <BookOpenIcon style={{ marginRight: '8px', color: '#0066cc' }} />
                            Data Integration Setup Guide
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="orange">Documentation</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Comprehensive guide to connecting cloud providers and managing data integrations.
                      </CardBody>
                    </Card>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <BookOpenIcon style={{ marginRight: '8px', color: '#0066cc' }} />
                            Event Log Management
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="orange">Documentation</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Understanding event logging, monitoring, and analyzing system activities.
                      </CardBody>
                    </Card>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <BookOpenIcon style={{ marginRight: '8px', color: '#0066cc' }} />
                            Settings API Reference
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="orange">Documentation</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Complete API documentation for programmatic Settings management.
                      </CardBody>
                    </Card>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <BookOpenIcon style={{ marginRight: '8px', color: '#0066cc' }} />
                            Workspace Administration
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="orange">Documentation</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Administrative guides for managing workspace settings and permissions.
                      </CardBody>
                    </Card>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <BookOpenIcon style={{ marginRight: '8px', color: '#0066cc' }} />
                            Troubleshooting Guide
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="orange">Documentation</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Common issues and solutions for Settings configuration challenges.
                      </CardBody>
                    </Card>
                  </Flex>
                </ExpandableSection>
              </FlexItem>
              
              <FlexItem>
                <ExpandableSection 
                  displaySize="lg"
                  toggleText="Quick starts"
                  isExpanded={expandedSections['section-3']}
                  onToggle={() => handleSectionToggle('section-3')}
                >
                  <Flex wrap="wrap" spaceItems={{ default: 'spaceItemsMd' }}>
                    <Card style={{ maxWidth: '300px' }}>
                      <CardHeader
                        actions={{
                          actions: (
                            <Button variant="plain" aria-label="Bookmark">
                              <BookmarkIcon />
                            </Button>
                          )
                        }}
                      >
                        <CardTitle>
                          <Button 
                            variant="link" 
                            isInline 
                            style={{ fontSize: '14px', fontWeight: 600, padding: 0 }}
                          >
                            <CubesIcon style={{ marginRight: '8px', color: '#0066cc' }} />
                            Configure your first alert
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <div style={{ padding: '0 16px 8px 16px' }}>
                        <Label color="green">Quick Start</Label>
                      </div>
                      <CardBody style={{ fontSize: '13px' }}>
                        Interactive tutorial to guide you through setting up your first alert notification in just 5 minutes.
                      </CardBody>
                    </Card>
                  </Flex>
                </ExpandableSection>
              </FlexItem>
              
              <FlexItem>
                <ExpandableSection 
                  displaySize="lg"
                  toggleText="Learning paths"
                  isExpanded={expandedSections['section-4']}
                  onToggle={() => handleSectionToggle('section-4')}
                >
                  <EmptyState>
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <BookOpenIcon style={{ fontSize: '64px', color: '#6a6e73', marginBottom: '16px' }} />
                      <Title headingLevel="h4" size="lg" style={{ marginBottom: '8px', color: '#6a6e73' }}>
                        No learning paths available
                      </Title>
                      <Content>
                        <p style={{ color: '#6a6e73' }}>Learning paths will be available soon.</p>
                      </Content>
                    </div>
                  </EmptyState>
                </ExpandableSection>
              </FlexItem>
              
              <FlexItem>
                <ExpandableSection 
                  displaySize="lg"
                  toggleText="Other"
                  isExpanded={expandedSections['section-5']}
                  onToggle={() => handleSectionToggle('section-5')}
                >
                  <EmptyState>
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <CubesIcon style={{ fontSize: '64px', color: '#6a6e73', marginBottom: '16px' }} />
                      <Title headingLevel="h4" size="lg" style={{ marginBottom: '8px', color: '#6a6e73' }}>
                        No additional resources available
                      </Title>
                      <Content>
                        <p style={{ color: '#6a6e73' }}>Additional resources will be added in the future.</p>
                      </Content>
                    </div>
                  </EmptyState>
                </ExpandableSection>
              </FlexItem>
            </Flex>
          </FlexItem>
          
          {/* Right side - 25% width for jump links */}
          <FlexItem flex={{ default: 'flex_1' }} style={{ maxWidth: '25%' }}>
            <JumpLinks 
              isVertical 
              label="Jump to section"
              aria-label="Jump to section navigation"
            >
              <JumpLinksItem 
                href="#section-1"
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionToggle('section-1');
                }}
              >
                Bookmarks
              </JumpLinksItem>
              <JumpLinksItem 
                href="#section-2"
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionToggle('section-2');
                }}
              >
                Documentation
              </JumpLinksItem>
              <JumpLinksItem 
                href="#section-3"
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionToggle('section-3');
                }}
              >
                Quick starts
              </JumpLinksItem>
              <JumpLinksItem 
                href="#section-4"
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionToggle('section-4');
                }}
              >
                Learning paths
              </JumpLinksItem>
              <JumpLinksItem 
                href="#section-5"
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionToggle('section-5');
                }}
              >
                Other
              </JumpLinksItem>
            </JumpLinks>
          </FlexItem>
        </Flex>
      </PageSection>
    </>
  );
};

export { LearningResources };