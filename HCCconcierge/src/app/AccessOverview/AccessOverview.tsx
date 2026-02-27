import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  List,
  ListItem,
  PageSection,
  Title
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

const AccessOverview: React.FunctionComponent = () => {
  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>Identity & Access Management</BreadcrumbItem>
          <BreadcrumbItem>User Access</BreadcrumbItem>
          <BreadcrumbItem isActive>Overview</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <svg 
                style={{ fontSize: '32px', color: '#c9190b', width: '32px', height: '32px' }} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
                aria-label="page-header-icon"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 20v-2a5 5 0 0 1 10 0v2" />
              </svg>
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Overview</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73', marginBottom: '8px' }}>
                  Streamline access management for your organization's users and resources with the User Access to ensure secure and efficient control over permissions and authorization.
                </p>
                <Button 
                  variant="link" 
                  isInline
                  component="a"
                  href="#"
                  icon={<ExternalLinkAltIcon />}
                  iconPosition="end"
                  style={{ padding: 0, fontSize: '14px' }}
                >
                  Learn more
                </Button>
              </Content>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Get started with User Access section */}
          <div style={{ marginBottom: '48px' }}>
            <Title headingLevel="h2" size="lg" style={{ marginBottom: '24px', fontWeight: 'bold', color: '#151515' }}>
              Get started with User Access
            </Title>
            <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsXl' }} alignItems={{ default: 'alignItemsFlexStart' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Content style={{ fontSize: '16px', color: '#151515', marginBottom: '16px' }}>
                  The Red Hat Hybrid Cloud Console uses role-based access control (RBAC).
                </Content>
                <List style={{ marginBottom: '24px' }}>
                  <ListItem style={{ marginBottom: '8px' }}>
                    Control user access by organizing roles instead of assigning permissions individually to users
                  </ListItem>
                  <ListItem style={{ marginBottom: '8px' }}>
                    Create groups that include roles and their corresponding permissions
                  </ListItem>
                  <ListItem style={{ marginBottom: '8px' }}>
                    Assign users to these groups, allowing them to inherit the permissions associated with their group's roles
                  </ListItem>
                </List>
                <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                  <FlexItem>
                    <Button variant="primary">
                      View groups
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="secondary">
                      View roles
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingLeft: '32px' }}>
                {/* Hexagonal network graphic with key */}
                <svg 
                  width="280" 
                  height="280" 
                  viewBox="0 0 300 300" 
                  style={{ maxWidth: '100%', height: 'auto' }}
                >
                  {/* Hexagonal network nodes and connections */}
                  <g stroke="#c9190b" strokeWidth="2.5" fill="none">
                    {/* Connections */}
                    <line x1="150" y1="50" x2="100" y2="100" />
                    <line x1="150" y1="50" x2="200" y2="100" />
                    <line x1="100" y1="100" x2="150" y2="150" />
                    <line x1="200" y1="100" x2="150" y2="150" />
                    <line x1="100" y1="100" x2="50" y2="150" />
                    <line x1="200" y1="100" x2="250" y2="150" />
                    <line x1="150" y1="150" x2="100" y2="200" />
                    <line x1="150" y1="150" x2="200" y2="200" />
                    <line x1="50" y1="150" x2="100" y2="200" />
                    <line x1="250" y1="150" x2="200" y2="200" />
                  </g>
                  {/* Nodes - some filled, some outlined */}
                  <circle cx="150" cy="50" r="16" fill="#c9190b" />
                  <circle cx="100" cy="100" r="13" fill="none" stroke="#c9190b" strokeWidth="2.5" />
                  <circle cx="200" cy="100" r="13" fill="#c9190b" />
                  <circle cx="150" cy="150" r="22" fill="#c9190b" />
                  <circle cx="50" cy="150" r="13" fill="none" stroke="#c9190b" strokeWidth="2.5" />
                  <circle cx="250" cy="150" r="13" fill="#c9190b" />
                  <circle cx="100" cy="200" r="13" fill="none" stroke="#c9190b" strokeWidth="2.5" />
                  <circle cx="200" cy="200" r="13" fill="#c9190b" />
                  {/* Key icon in center */}
                  <g transform="translate(150, 150)">
                    <path 
                      d="M-10,-14 L-10,-7 L-5,-7 L-5,0 L5,0 L5,-7 L10,-7 L10,-14 Z M-5,-10 L5,-10" 
                      fill="#c9190b" 
                      stroke="#c9190b" 
                      strokeWidth="1"
                    />
                    <circle cx="0" cy="5" r="4" fill="none" stroke="#c9190b" strokeWidth="2" />
                  </g>
                </svg>
              </FlexItem>
            </Flex>
          </div>

          {/* Cards section - stacked vertically */}
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
            {/* About Workspaces card */}
            <FlexItem>
              <Card style={{ backgroundColor: '#f5f5f5' }}>
                <CardBody style={{ backgroundColor: 'white', padding: '24px' }}>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: '16px', fontWeight: 'bold', color: '#151515' }}>
                    About Workspaces
                  </Title>
                  <Content style={{ marginBottom: '24px', color: '#151515', fontSize: '16px', lineHeight: '1.5' }}>
                    <p style={{ margin: 0 }}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                    </p>
                  </Content>
                  <Button variant="primary">
                    View workspaces
                  </Button>
                </CardBody>
              </Card>
            </FlexItem>

            {/* About Auth Policies card */}
            <FlexItem>
              <Card style={{ backgroundColor: '#f5f5f5' }}>
                <CardBody style={{ backgroundColor: 'white', padding: '24px' }}>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: '16px', fontWeight: 'bold', color: '#151515' }}>
                    About Auth Policies
                  </Title>
                  <Content style={{ marginBottom: '24px', color: '#151515', fontSize: '16px', lineHeight: '1.5' }}>
                    <p style={{ margin: 0 }}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                    </p>
                  </Content>
                  <Button variant="primary">
                    Manage organizations
                  </Button>
                </CardBody>
              </Card>
            </FlexItem>
          </Flex>
        </div>
      </PageSection>
    </>
  );
};

export { AccessOverview };
