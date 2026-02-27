import * as React from 'react';
import {
  Alert,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Flex,
  FlexItem,
  PageSection,
  TextInput,
  Title
} from '@patternfly/react-core';
import { 
  ArrowRightIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
  HelpIcon,
  PaperPlaneIcon,
  StarIcon
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { TellUsWhatYoudLikeToDoCard } from '@app/components/TellUsWhatYoudLikeToDoCard';

const RHELDashboard: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [isVulnerabilityExpanded, setIsVulnerabilityExpanded] = React.useState(true);
  const [isCVSSExpanded, setIsCVSSExpanded] = React.useState(true);
  const [isCentOSExpanded, setIsCentOSExpanded] = React.useState(true);
  const [isAdvisorExpanded, setIsAdvisorExpanded] = React.useState(true);
  const [isRiskExpanded, setIsRiskExpanded] = React.useState(true);
  const [isCategoryExpanded, setIsCategoryExpanded] = React.useState(true);
  const [isRemediationsExpanded, setIsRemediationsExpanded] = React.useState(true);
  const [hasCustomView, setHasCustomView] = React.useState(false);
  const [isCustomViewsDropdownOpen, setIsCustomViewsDropdownOpen] = React.useState(false);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>RHEL</BreadcrumbItem>
          <BreadcrumbItem isActive>Dashboard</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
          {/* Header Section */}
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                  <FlexItem>
                    <Button variant="secondary">
                      Filter by tags
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="plain" aria-label="Help">
                      <HelpIcon />
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <Button variant="secondary">
                      Configure Integrations
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="primary">
                      Register systems
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="plain" aria-label="Star">
                      <StarIcon />
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </FlexItem>

          {/* Tell us what you'd like to do card */}
          <FlexItem>
            <TellUsWhatYoudLikeToDoCard 
              showArrow={true} 
              onShowSetupGuide={() => {
                // RHEL Dashboard doesn't have setup guide functionality
                console.log('Setup guide requested from RHEL Dashboard');
              }}
            />
          </FlexItem>

          {/* System Overview */}
          <FlexItem>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Title headingLevel="h1" size="4xl" style={{ color: '#0066cc' }}>
                  3,651
                </Title>
                <Content style={{ fontSize: '18px', marginTop: '8px' }}>
                  Systems registered with Insights
                </Content>
              </FlexItem>
              <FlexItem>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <ExclamationTriangleIcon style={{ color: '#f0ad4e' }} />
                      </FlexItem>
                      <FlexItem>
                        <Content style={{ color: '#f0ad4e', fontWeight: 'bold' }}>
                          1,090 stale systems
                        </Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                  <FlexItem>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <ExclamationTriangleIcon style={{ color: '#f0ad4e' }} />
                      </FlexItem>
                      <FlexItem>
                        <Content style={{ color: '#f0ad4e', fontWeight: 'bold' }}>
                          1,389 systems to be removed
                        </Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </FlexItem>

          {/* Main Content - Two Column Layout */}
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
              {/* Left Column */}
              <FlexItem flex={{ default: 'flex_1' }}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                  {/* Vulnerability Card */}
                  <FlexItem>
                    <Card>
                      <CardHeader>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Title headingLevel="h3" size="lg">Vulnerability</Title>
                          </FlexItem>
                          <FlexItem>
                            <Button 
                              variant="plain" 
                              onClick={() => setIsVulnerabilityExpanded(!isVulnerabilityExpanded)}
                            >
                              <ChevronDownIcon style={{ 
                                transform: isVulnerabilityExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                              }} />
                            </Button>
                          </FlexItem>
                        </Flex>
                      </CardHeader>
                      {isVulnerabilityExpanded && (
                        <CardBody>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                            <FlexItem>
                              <Content>
                                Red Hat recommends addressing these CVEs with high priority due to heightened risk associated with these security issues. This dataset summary only shows CVEs with Errata.
                              </Content>
                            </FlexItem>
                            
                            {/* Key Metrics */}
                            <FlexItem>
                              <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                  <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                                    <FlexItem>
                                      <Title headingLevel="h2" size="4xl" style={{ color: '#0066cc' }}>59</Title>
                                    </FlexItem>
                                    <FlexItem>
                                      <Content style={{ textAlign: 'center', fontSize: '14px' }}>
                                        CVEs with security rules impacting 1 or more systems
                                      </Content>
                                    </FlexItem>
                                    <FlexItem>
                                      <Button variant="secondary" size="sm">
                                        View CVEs
                                      </Button>
                                    </FlexItem>
                                  </Flex>
                                </FlexItem>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                  <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                                    <FlexItem>
                                      <Title headingLevel="h2" size="4xl" style={{ color: '#0066cc' }}>63</Title>
                                    </FlexItem>
                                    <FlexItem>
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem>
                                          <Content style={{ textAlign: 'center', fontSize: '14px' }}>
                                            CVEs with known exploits impacting 1 or more systems
                                          </Content>
                                        </FlexItem>
                                        <FlexItem>
                                          <HelpIcon style={{ fontSize: '12px' }} />
                                        </FlexItem>
                                      </Flex>
                                    </FlexItem>
                                    <FlexItem>
                                      <Button variant="secondary" size="sm">
                                        View known exploits
                                      </Button>
                                    </FlexItem>
                                  </Flex>
                                </FlexItem>
                              </Flex>
                            </FlexItem>

                            {/* CVEs by CVSS Score */}
                            <FlexItem>
                              <Card>
                                <CardHeader>
                                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                                    <FlexItem>
                                      <Title headingLevel="h4" size="md">CVEs by CVSS score</Title>
                                    </FlexItem>
                                    <FlexItem>
                                      <Button 
                                        variant="plain" 
                                        onClick={() => setIsCVSSExpanded(!isCVSSExpanded)}
                                      >
                                        <ChevronDownIcon style={{ 
                                          transform: isCVSSExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                                        }} />
                                      </Button>
                                    </FlexItem>
                                  </Flex>
                                </CardHeader>
                                {isCVSSExpanded && (
                                  <CardBody>
                                    <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                                      <FlexItem flex={{ default: 'flex_1' }}>
                                        {/* Donut Chart Placeholder */}
                                        <div style={{
                                          width: '200px',
                                          height: '200px',
                                          borderRadius: '50%',
                                          background: 'conic-gradient(#d32f2f 0deg 45deg, #f0ad4e 45deg 180deg, #ffc107 180deg 360deg)',
                                          margin: '0 auto',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: 'white',
                                          fontWeight: 'bold'
                                        }}>
                                          CVEs
                                        </div>
                                      </FlexItem>
                                      <FlexItem flex={{ default: 'flex_1' }}>
                                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                          <FlexItem>
                                            <Title headingLevel="h5" size="md">CVSS score</Title>
                                          </FlexItem>
                                          <FlexItem>
                                            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                              <FlexItem>
                                                <div style={{ width: '12px', height: '12px', backgroundColor: '#d32f2f', borderRadius: '2px' }}></div>
                                              </FlexItem>
                                              <FlexItem>
                                                <Content>8.0 - 10</Content>
                                              </FlexItem>
                                            </Flex>
                                          </FlexItem>
                                          <FlexItem>
                                            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                              <FlexItem>
                                                <div style={{ width: '12px', height: '12px', backgroundColor: '#f0ad4e', borderRadius: '2px' }}></div>
                                              </FlexItem>
                                              <FlexItem>
                                                <Content>4.0 - 7.9</Content>
                                              </FlexItem>
                                            </Flex>
                                          </FlexItem>
                                          <FlexItem>
                                            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                              <FlexItem>
                                                <div style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', borderRadius: '2px' }}></div>
                                              </FlexItem>
                                              <FlexItem>
                                                <Content>0.0 - 3.9</Content>
                                              </FlexItem>
                                            </Flex>
                                          </FlexItem>
                                          <FlexItem>
                                            <Title headingLevel="h5" size="md" style={{ marginTop: '16px' }}>CVE totals</Title>
                                          </FlexItem>
                                          <FlexItem>
                                            <Content>756</Content>
                                          </FlexItem>
                                          <FlexItem>
                                            <Content>5608</Content>
                                          </FlexItem>
                                          <FlexItem>
                                            <Content>379</Content>
                                          </FlexItem>
                                          <FlexItem>
                                            <Title headingLevel="h5" size="md" style={{ marginTop: '16px' }}>Known exploits</Title>
                                          </FlexItem>
                                          <FlexItem>
                                            <Content>38</Content>
                                          </FlexItem>
                                          <FlexItem>
                                            <Content>24</Content>
                                          </FlexItem>
                                          <FlexItem>
                                            <Content>1</Content>
                                          </FlexItem>
                                        </Flex>
                                      </FlexItem>
                                    </Flex>
                                  </CardBody>
                                )}
                              </Card>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      )}
                    </Card>
                  </FlexItem>

                  {/* CentOS Conversion Card */}
                  <FlexItem>
                    <Card>
                      <CardHeader>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Title headingLevel="h3" size="lg">Convert your CentOS systems to RHEL</Title>
                          </FlexItem>
                          <FlexItem>
                            <Button 
                              variant="plain" 
                              onClick={() => setIsCentOSExpanded(!isCentOSExpanded)}
                            >
                              <ChevronDownIcon style={{ 
                                transform: isCentOSExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                              }} />
                            </Button>
                          </FlexItem>
                        </Flex>
                      </CardHeader>
                      {isCentOSExpanded && (
                        <CardBody>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                            <FlexItem>
                              <Alert variant="warning" title="CentOS 7 has reached End of Life (EOL)" />
                            </FlexItem>
                            <FlexItem>
                              <Content>
                                CentOS 7 has reached End of Life (EOL) and will no longer receive security updates, bug fixes, or new features. Red Hat can help you migrate your CentOS 7 systems to Red Hat Enterprise Linux (RHEL) to ensure continued support and security. <Button variant="link" isInline>Learn more</Button>
                              </Content>
                            </FlexItem>
                            <FlexItem>
                              <Button variant="secondary">
                                Prepare CentOS systems to convert via Insights
                                <ExternalLinkAltIcon style={{ marginLeft: '8px' }} />
                              </Button>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      )}
                    </Card>
                  </FlexItem>
                </Flex>
              </FlexItem>

              {/* Right Column */}
              <FlexItem flex={{ default: 'flex_1' }}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                  {/* Advisor Recommendations Card */}
                  <FlexItem>
                    <Card>
                      <CardHeader>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Title headingLevel="h3" size="lg">Advisor recommendations</Title>
                          </FlexItem>
                          <FlexItem>
                            <Button 
                              variant="plain" 
                              onClick={() => setIsAdvisorExpanded(!isAdvisorExpanded)}
                            >
                              <ChevronDownIcon style={{ 
                                transform: isAdvisorExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                              }} />
                            </Button>
                          </FlexItem>
                        </Flex>
                      </CardHeader>
                      {isAdvisorExpanded && (
                        <CardBody>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                            {/* Incidents Detected */}
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <ExclamationTriangleIcon style={{ color: '#f0ad4e' }} />
                                </FlexItem>
                                <FlexItem>
                                  <Content style={{ fontWeight: 'bold' }}>
                                    23 incidents detected
                                  </Content>
                                </FlexItem>
                              </Flex>
                              <Content style={{ marginTop: '8px' }}>
                                Problematic conditions that cause an issue have been actively detected on your systems.
                              </Content>
                              <Button variant="secondary" size="sm" style={{ marginTop: '8px' }}>
                                View incidents
                              </Button>
                            </FlexItem>

                            {/* Recommendations by Total Risk */}
                            <FlexItem>
                              <Card>
                                <CardHeader>
                                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                                    <FlexItem>
                                      <Title headingLevel="h4" size="md">Recommendations by total risk</Title>
                                    </FlexItem>
                                    <FlexItem>
                                      <HelpIcon style={{ fontSize: '12px' }} />
                                    </FlexItem>
                                  </Flex>
                                </CardHeader>
                                <CardBody>
                                  <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                                    <FlexItem>
                                      <Badge color="red">2 Critical</Badge>
                                    </FlexItem>
                                    <FlexItem>
                                      <Badge color="orange">62 Important</Badge>
                                    </FlexItem>
                                    <FlexItem>
                                      <Badge color="blue">34 Moderate</Badge>
                                    </FlexItem>
                                    <FlexItem>
                                      <Badge color="green">6 Low</Badge>
                                    </FlexItem>
                                  </Flex>
                                </CardBody>
                              </Card>
                            </FlexItem>

                            {/* Recommendations by Category */}
                            <FlexItem>
                              <Card>
                                <CardHeader>
                                  <Title headingLevel="h4" size="md">Recommendations by category</Title>
                                </CardHeader>
                                <CardBody>
                                  <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                                    <FlexItem flex={{ default: 'flex_1' }}>
                                      {/* Donut Chart Placeholder */}
                                      <div style={{
                                        width: '150px',
                                        height: '150px',
                                        borderRadius: '50%',
                                        background: 'conic-gradient(#0066cc 0deg 120deg, #004080 120deg 200deg, #002966 200deg 280deg, #001a4d 280deg 360deg)',
                                        margin: '0 auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                      }}>
                                        Categories
                                      </div>
                                    </FlexItem>
                                    <FlexItem flex={{ default: 'flex_1' }}>
                                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                        <FlexItem>
                                          <Content>54 Availability</Content>
                                        </FlexItem>
                                        <FlexItem>
                                          <Content>13 Performance</Content>
                                        </FlexItem>
                                        <FlexItem>
                                          <Content>13 Stability</Content>
                                        </FlexItem>
                                        <FlexItem>
                                          <Content>24 Security</Content>
                                        </FlexItem>
                                      </Flex>
                                    </FlexItem>
                                  </Flex>
                                </CardBody>
                              </Card>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      )}
                    </Card>
                  </FlexItem>

                  {/* Remediations Card */}
                  <FlexItem>
                    <Card>
                      <CardHeader>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Title headingLevel="h3" size="lg">Remediations</Title>
                          </FlexItem>
                          <FlexItem>
                            <Button 
                              variant="plain" 
                              onClick={() => setIsRemediationsExpanded(!isRemediationsExpanded)}
                            >
                              <ChevronDownIcon style={{ 
                                transform: isRemediationsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                              }} />
                            </Button>
                          </FlexItem>
                        </Flex>
                      </CardHeader>
                      {isRemediationsExpanded && (
                        <CardBody>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <HelpIcon style={{ fontSize: '12px', color: '#666' }} />
                                </FlexItem>
                                <FlexItem>
                                  <Content>No activity</Content>
                                </FlexItem>
                                <FlexItem>
                                  <Button variant="link" isInline>ryan</Button>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <HelpIcon style={{ fontSize: '12px', color: '#666' }} />
                                </FlexItem>
                                <FlexItem>
                                  <Content>No activity</Content>
                                </FlexItem>
                                <FlexItem>
                                  <Button variant="link" isInline>Stacy test</Button>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <HelpIcon style={{ fontSize: '12px', color: '#666' }} />
                                </FlexItem>
                                <FlexItem>
                                  <Content>No activity</Content>
                                </FlexItem>
                                <FlexItem>
                                  <Button variant="link" isInline>test1 - 5</Button>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <HelpIcon style={{ fontSize: '12px', color: '#666' }} />
                                </FlexItem>
                                <FlexItem>
                                  <Content>No activity</Content>
                                </FlexItem>
                                <FlexItem>
                                  <Button variant="link" isInline>test - 23</Button>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      )}
                    </Card>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>
    </>
  );
};

export { RHELDashboard };
