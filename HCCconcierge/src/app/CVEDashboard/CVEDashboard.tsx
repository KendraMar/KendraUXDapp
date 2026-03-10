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
  Title,
  Badge,
  Pagination,
  Alert
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  ExternalLinkAltIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SortAmountDownIcon,
  SortAmountUpIcon
} from '@patternfly/react-icons';

const CVEDashboard: React.FunctionComponent = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState('cveId');
  const [sortDirection, setSortDirection] = React.useState('asc');

  const cveData = [
    {
      cveId: 'CVE-2024-7012',
      publishDate: '04 Sept 2024',
      severity: 'Critical',
      cvssScore: '9.8',
      systems: 6,
      appliesToOS: 'RHEL 8.8, 8.9, 8.10',
      businessRisk: 'Not defined',
      status: 'Not reviewed',
      advisory: 'Available'
    },
    {
      cveId: 'CVE-2024-7923',
      publishDate: '04 Sept 2024',
      severity: 'Critical',
      cvssScore: '9.8',
      systems: 6,
      appliesToOS: 'RHEL 8.8, 8.9, 8.10',
      businessRisk: 'Not defined',
      status: 'Not reviewed',
      advisory: 'Available'
    },
    {
      cveId: 'CVE-2024-7519',
      publishDate: '05 Aug 2024',
      severity: 'Critical',
      cvssScore: '9.6',
      systems: 144,
      appliesToOS: 'RHEL 8.1, 8.3, 8.4, 8...',
      businessRisk: 'Not defined',
      status: 'Not reviewed',
      advisory: 'Available'
    },
    {
      cveId: 'CVE-2024-32498',
      publishDate: '02 July 2024',
      severity: 'Critical',
      cvssScore: '8.8',
      systems: 1,
      appliesToOS: 'RHEL 9.4',
      businessRisk: 'Not defined',
      status: 'Not reviewed',
      advisory: 'Available'
    },
    {
      cveId: 'CVE-2024-29944',
      publishDate: '21 Mar 2024',
      severity: 'Critical',
      cvssScore: '8.8',
      systems: 84,
      appliesToOS: 'RHEL 7.9, RHEL 8.1, ...',
      businessRisk: 'Not defined',
      status: 'Not reviewed',
      advisory: 'Available'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'red';
      case 'Important': return 'orange';
      default: return 'blue';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'Critical' || severity === 'Important') {
      return <ExclamationTriangleIcon style={{ color: severity === 'Critical' ? '#c9190b' : '#f0ab00' }} />;
    }
    return null;
  };

  const onSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? <SortAmountUpIcon /> : <SortAmountDownIcon />;
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/rhel-systems">RHEL</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to="/rhel-compliance">Security</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to="/cve-dashboard">Vulnerability</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>CVEs</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
          {/* Page Title */}
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">CVEs</Title>
              </FlexItem>
              <FlexItem>
                <Button variant="plain" aria-label="Help">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <text x="8" y="11" textAnchor="middle" fontSize="10" fill="currentColor">?</text>
                  </svg>
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>

          {/* CVE Summary Cards */}
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Card>
                  <CardBody>
                    <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <Title headingLevel="h3" size="4xl" style={{ color: '#0066cc' }}>63</Title>
                      </FlexItem>
                      <FlexItem>
                        <Content>CVEs with known exploits</Content>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Card>
                  <CardBody>
                    <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <Title headingLevel="h3" size="4xl" style={{ color: '#0066cc' }}>56</Title>
                      </FlexItem>
                      <FlexItem>
                        <Content>CVEs with security rules</Content>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Card style={{ border: '2px solid #0066cc', backgroundColor: '#f0f8ff' }}>
                  <CardBody>
                    <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <ExclamationTriangleIcon style={{ color: '#c9190b', fontSize: '24px' }} />
                          </FlexItem>
                          <FlexItem>
                            <Title headingLevel="h3" size="4xl" style={{ color: '#c9190b' }}>25</Title>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                      <FlexItem>
                        <Content style={{ fontWeight: 'bold' }}>CVEs with critical severity</Content>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Card>
                  <CardBody>
                    <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <ExclamationTriangleIcon style={{ color: '#f0ab00', fontSize: '24px' }} />
                          </FlexItem>
                          <FlexItem>
                            <Title headingLevel="h3" size="4xl" style={{ color: '#f0ab00' }}>1040</Title>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                      <FlexItem>
                        <Content>CVEs with important severity</Content>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </FlexItem>
            </Flex>
          </FlexItem>

          {/* Advisory Banner */}
          <FlexItem>
            <Alert
              variant="info"
              title="CVEs with and without an established Advisory"
              isInline
            >
              Red Hat's policy to address critical and important severity issues with high priority. For more information, read:{' '}
              <Button variant="link" isInline icon={<ExternalLinkAltIcon />} iconPosition="end">
                https://access.redhat.com/support/policy/updates/errata
              </Button>
            </Alert>
          </FlexItem>

          {/* Active Filters */}
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Badge color="blue" isRead>
                  Severity: Critical
                </Badge>
              </FlexItem>
              <FlexItem>
                <Badge color="blue" isRead>
                  Systems: 1 or more Convention...
                </Badge>
              </FlexItem>
              <FlexItem>
                <Badge color="blue" isRead>
                  1 or more Immutable (...)
                </Badge>
              </FlexItem>
              <FlexItem>
                <Badge color="blue" isRead>
                  Advisory: Available
                </Badge>
              </FlexItem>
              <FlexItem>
                <Button variant="link" isInline>
                  Reset filters
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>

          {/* CVE List */}
          <FlexItem>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                  {cveData.map((cve, index) => (
                    <FlexItem key={index}>
                      <Card>
                        <CardBody>
                          <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Button variant="link" isInline>
                                {cve.cveId}
                              </Button>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content>{cve.publishDate}</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  {getSeverityIcon(cve.severity)}
                                </FlexItem>
                                <FlexItem>
                                  <Badge color={getSeverityColor(cve.severity)}>
                                    {cve.severity}
                                  </Badge>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content>CVSS: {cve.cvssScore}</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Button variant="link" isInline>
                                {cve.systems} systems
                              </Button>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content>{cve.appliesToOS}</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content>{cve.businessRisk}</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content>{cve.status}</Content>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <Content>{cve.advisory}</Content>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    </FlexItem>
                  ))}
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>

          {/* Pagination */}
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Content>1-20 of 25</Content>
              </FlexItem>
              <FlexItem>
                <Pagination
                  itemCount={25}
                  page={currentPage}
                  perPage={20}
                  onSetPage={(_, page) => setCurrentPage(page)}
                  variant="top"
                />
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>
    </>
  );
};

export { CVEDashboard };
