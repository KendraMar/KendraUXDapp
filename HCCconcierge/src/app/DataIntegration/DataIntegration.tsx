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
  Grid,
  GridItem,
  PageSection,
  Progress,
  ProgressMeasureLocation,
  Tab,
  TabTitleText,
  Tabs,
  Title
} from '@patternfly/react-core';
import { DatabaseIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';

const DataIntegration: React.FunctionComponent = () => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  const handleTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/overview">Settings</BreadcrumbItem>
          <BreadcrumbItem isActive>Data Integration</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <DatabaseIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">Data Integration</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Manage data sources, configure integration pipelines, and monitor data flow across your infrastructure.</p>
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
          <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">Data Integration Management</Title>
                    <p>
                      Manage data sources, configure integration pipelines, and monitor 
                      data flow across your hybrid cloud infrastructure.
                    </p>
                    
                    <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                      <Button variant="primary" style={{ marginRight: '16px' }}>
                        Add Data Source
                      </Button>
                      <Button variant="secondary">Create Pipeline</Button>
                    </div>
                    
                    <Grid hasGutter>
                      <GridItem span={6}>
                        <Card>
                          <CardBody>
                            <Title headingLevel="h3" size="lg">Active Data Sources</Title>
                            <ul style={{ marginTop: '16px' }}>
                              <li>PostgreSQL Database - Production</li>
                              <li>Apache Kafka Cluster</li>
                              <li>Amazon S3 Storage</li>
                              <li>Redis Cache Instance</li>
                            </ul>
                          </CardBody>
                        </Card>
                      </GridItem>
                      
                      <GridItem span={6}>
                        <Card>
                          <CardBody>
                            <Title headingLevel="h3" size="lg">Integration Status</Title>
                            <div style={{ marginTop: '16px' }}>
                              <div style={{ marginBottom: '12px' }}>
                                <span>Data Sync Pipeline</span>
                                <Progress 
                                  value={85} 
                                  title="85% Complete"
                                  measureLocation={ProgressMeasureLocation.outside}
                                />
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <span>ETL Processing</span>
                                <Progress 
                                  value={62} 
                                  title="62% Complete"
                                  measureLocation={ProgressMeasureLocation.outside}
                                />
                              </div>
                              <div>
                                <span>Data Validation</span>
                                <Progress 
                                  value={100} 
                                  title="100% Complete"
                                  measureLocation={ProgressMeasureLocation.outside}
                                />
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                  </Content>
                </CardBody>
              </Card>
            </PageSection>
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>Pipelines</TabTitleText>}>
            <PageSection>
              <Card>
                <CardBody>
                  <Content>
                    <Title headingLevel="h2" size="xl">Data Pipelines</Title>
                    <p>Configure and monitor data transformation and processing pipelines.</p>
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

export { DataIntegration };
