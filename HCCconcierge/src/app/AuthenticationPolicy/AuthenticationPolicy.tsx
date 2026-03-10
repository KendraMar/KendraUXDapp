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
import { ExternalLinkAltIcon, ShieldAltIcon } from '@patternfly/react-icons';
import { NavLink } from 'react-router-dom';

const AuthenticationPolicy: React.FunctionComponent = () => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  const handleTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>IAM</BreadcrumbItem>
          <BreadcrumbItem isActive>Authentication Policy</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <ShieldAltIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Authentication Policy</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Configure authentication policies, security settings, and access control rules for your organization.</p>
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
          <Tab eventKey={0} title={<TabTitleText>Security Policies</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">Authentication & Security Configuration</Title>
                    <p>
                      Configure authentication policies and security settings to protect your organization's 
                      resources and ensure compliance with security standards.
                    </p>
                    
                    <h3>Policy Configuration:</h3>
                    <ul>
                      <li><strong>Multi-Factor Authentication:</strong> Enforce MFA requirements</li>
                      <li><strong>Password Policies:</strong> Set password complexity requirements</li>
                      <li><strong>Session Management:</strong> Configure session timeouts and controls</li>
                      <li><strong>Access Controls:</strong> Define resource access restrictions</li>
                      <li><strong>Compliance:</strong> Ensure adherence to security standards</li>
                    </ul>
                  </Content>
                </CardBody>
              </Card>
            </PageSection>
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>SSO Configuration</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">Single Sign-On Settings</Title>
                    <p>Configure single sign-on providers and authentication methods.</p>
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

export { AuthenticationPolicy };
