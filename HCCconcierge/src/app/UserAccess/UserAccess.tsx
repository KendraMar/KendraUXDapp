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
  PageSection,
  Tab,
  TabTitleText,
  Tabs,
  Title
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, UsersIcon } from '@patternfly/react-icons';
import { NavLink } from 'react-router-dom';

const UserAccess: React.FunctionComponent = () => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  const handleTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>IAM</BreadcrumbItem>
          <BreadcrumbItem isActive>User Access</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <UsersIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">User Access</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Manage user accounts, permissions, and access controls across your organization.</p>
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
      
      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          <Tab eventKey={0} title={<TabTitleText>All Users</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">User Management</Title>
                    <p>
                      View and manage all user accounts within your organization. Create new users, 
                      modify existing permissions, and control access to resources.
                    </p>
                    
                    <h3>User Management Features:</h3>
                    <ul>
                      <li><strong>User Creation:</strong> Add new users to your organization</li>
                      <li><strong>Permission Assignment:</strong> Assign roles and permissions</li>
                      <li><strong>Access Control:</strong> Manage resource access levels</li>
                      <li><strong>User Status:</strong> Enable, disable, or remove user accounts</li>
                    </ul>
                  </Content>
                </CardBody>
              </Card>
            </PageSection>
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>Access Requests</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">Pending Access Requests</Title>
                    <p>Review and approve pending user access requests.</p>
                  </Content>
                </CardBody>
              </Card>
            </PageSection>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export { UserAccess };
