import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  PageSection,
  Title,
  TextInput
} from '@patternfly/react-core';
import { 
  ServerIcon, 
  SearchIcon, 
  EllipsisVIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HandPointerIcon
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

const RHELOpenShift: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  const [showToast, setShowToast] = React.useState(false);

  // Sample RHEL Systems data
  const systemsData = [
    {
      id: 1,
      name: 'i-09f6cb6bc33252ac4.us-west-2.compute.internal',
      workspace: 'Ungrouped Hosts',
      roles: 'System Administrator'
    },
    {
      id: 2,
      name: '3383dbc9-c548-4f9d-a055-c7798c43a898',
      workspace: 'Ungrouped Hosts',
      roles: 'Viewer'
    },
    {
      id: 3,
      name: 'c516bf92-3d65-4015-a56a-83da0ccfcf75',
      workspace: 'Ungrouped Hosts',
      roles: 'Editor'
    },
    {
      id: 4,
      name: 'rh95-hub-bu',
      workspace: 'Ungrouped Hosts',
      roles: 'System Administrator'
    },
    {
      id: 5,
      name: 'rhel9-uefi-base',
      workspace: 'Ungrouped Hosts',
      roles: 'Viewer'
    },
    {
      id: 6,
      name: 'dab10eff-ec1f-45d4-92b6-0fe1e492eaal',
      workspace: 'Ungrouped Hosts',
      roles: 'Editor'
    }
  ];

  // Sample OpenShift clusters data
  const clustersData = [
    {
      id: 1,
      name: 'openshift-cluster-prod-01',
      workspace: 'Production',
      roles: 'Cluster Administrator'
    },
    {
      id: 2,
      name: 'openshift-cluster-dev-01',
      workspace: 'Development',
      roles: 'Developer'
    },
    {
      id: 3,
      name: 'openshift-cluster-staging-01',
      workspace: 'Staging',
      roles: 'Viewer'
    },
    {
      id: 4,
      name: 'openshift-cluster-test-01',
      workspace: 'Testing',
      roles: 'Editor'
    },
    {
      id: 5,
      name: 'openshift-cluster-demo-01',
      workspace: 'Demo',
      roles: 'Viewer'
    },
    {
      id: 6,
      name: 'openshift-cluster-backup-01',
      workspace: 'Backup',
      roles: 'System Administrator'
    }
  ];

  const filteredSystemsData = systemsData.filter(system =>
    system.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    system.workspace.toLowerCase().includes(searchValue.toLowerCase()) ||
    system.roles.toLowerCase().includes(searchValue.toLowerCase())
  );

  const filteredClustersData = clustersData.filter(cluster =>
    cluster.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    cluster.workspace.toLowerCase().includes(searchValue.toLowerCase()) ||
    cluster.roles.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      {/* Toast Alert */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          zIndex: 9999,
          maxWidth: '400px'
        }}>
          <Alert
            variant="success"
            title="View saved successfully."
            actionClose={
              <AlertActionCloseButton
                onClose={() => setShowToast(false)}
                aria-label="Close"
              />
            }
          >
            <Button 
              variant="link" 
              isInline 
              onClick={() => {
                setShowToast(false);
                navigate('/?hasCustomView=true');
              }}
              style={{ padding: 0, fontSize: 'inherit', textDecoration: 'underline' }}
            >
              Where can I access my custom views?
            </Button>
          </Alert>
        </div>
      )}
      
      {/* CSS for pulsing animation and disabled hover/select states */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-50%) scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
        }
        
        /* Remove hover, focus, and selection states from table rows and interactive elements */
        table tbody tr:hover {
          background-color: transparent !important;
        }
        
        table tbody tr:focus {
          background-color: transparent !important;
        }
        
        table tbody tr:active {
          background-color: transparent !important;
        }
        
        table tbody tr:focus-within {
          background-color: transparent !important;
        }
        
        /* Remove button hover states */
        table button:hover {
          background-color: transparent !important;
          color: inherit !important;
        }
        
        table button:focus {
          background-color: transparent !important;
          color: inherit !important;
          outline: none !important;
        }
        
        table button:active {
          background-color: transparent !important;
          color: inherit !important;
        }
        
        /* Remove link hover states */
        table a:hover {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        table a:focus {
          color: inherit !important;
          text-decoration: none !important;
          outline: none !important;
        }
        
        table a:active {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        /* Remove checkbox hover/focus states */
        table input[type="checkbox"]:hover {
          cursor: default !important;
        }
        
        table input[type="checkbox"]:focus {
          outline: none !important;
        }
        
        /* Remove text selection highlighting */
        table tbody tr {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        
        /* Ensure no background changes on any interaction */
        table tbody tr * {
          transition: none !important;
        }
      `}</style>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <ServerIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h1" size="2xl">RHEL systems you have access to</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Manage and monitor your RHEL systems across different workspaces.</p>
              </Content>
            </div>
          </FlexItem>
          <FlexItem>
            <div style={{ position: 'relative' }}>
              <Button variant="primary" onClick={() => {
                // Simulate saving the custom view
                console.log('Saving custom view with both RHEL systems and OpenShift clusters tables');
                localStorage.setItem('hasCustomView', 'true');
                setShowToast(true);
              }}>
                Save this custom view
              </Button>
              {/* Pulsing Pink Hand Cursor */}
              <div style={{
                position: 'absolute',
                right: '-60px',
                top: '50%',
                transform: 'translateY(-50%)',
                animation: 'pulse 2s infinite',
                zIndex: 10
              }}>
                <HandPointerIcon style={{ 
                  fontSize: '32px', 
                  color: '#ff69b4',
                  filter: 'drop-shadow(0 0 8px rgba(255, 105, 180, 0.6))'
                }} />
              </div>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>
      
      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Card>
          <CardBody>
            {/* Search Bar */}
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }} style={{ marginBottom: '16px' }}>
              <FlexItem>
                <div style={{ position: 'relative' }}>
                  <TextInput
                    value={searchValue}
                    onChange={(_, value) => setSearchValue(value)}
                    placeholder="Filter by name, workspace, or roles"
                    style={{ width: '300px', paddingRight: '40px' }}
                  />
                  <SearchIcon style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666'
                  }} />
                </div>
              </FlexItem>
            </Flex>

            {/* RHEL Systems Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d2d2d2', backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <input type="checkbox" style={{ marginRight: '8px' }} />
                        </FlexItem>
                        <FlexItem>
                          Name
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronUpIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          Workspace
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronDownIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          Roles
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronDownIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSystemsData.map((system) => (
                    <tr key={system.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <input type="checkbox" style={{ marginRight: '8px' }} />
                          </FlexItem>
                          <FlexItem>
                            <FolderIcon style={{ marginRight: '8px', color: '#6a6e73' }} />
                          </FlexItem>
                          <FlexItem>
                            <Button variant="link" isInline style={{ padding: '0', textAlign: 'left' }}>
                              {system.name}
                            </Button>
                          </FlexItem>
                        </Flex>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {system.workspace}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {system.roles}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Button variant="plain" style={{ padding: '0' }}>
                          <EllipsisVIcon />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </PageSection>

      {/* OpenShift Clusters Table */}
      <PageSection hasBodyWrapper={false} style={{ paddingTop: '24px' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: '16px' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <ServerIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Title headingLevel="h2" size="xl">OpenShift clusters you have access to</Title>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Manage and monitor your OpenShift clusters across different workspaces.</p>
              </Content>
            </div>
          </FlexItem>
        </Flex>
        
        <Card>
          <CardBody>
            {/* Search Bar for Clusters */}
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }} style={{ marginBottom: '16px' }}>
              <FlexItem>
                <div style={{ position: 'relative' }}>
                  <TextInput
                    value={searchValue}
                    onChange={(_, value) => setSearchValue(value)}
                    placeholder="Filter by name, workspace, or roles"
                    style={{ width: '300px', paddingRight: '40px' }}
                  />
                  <SearchIcon style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666'
                  }} />
                </div>
              </FlexItem>
            </Flex>

            {/* OpenShift Clusters Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d2d2d2', backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <input type="checkbox" style={{ marginRight: '8px' }} />
                        </FlexItem>
                        <FlexItem>
                          Name
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronUpIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          Workspace
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronDownIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          Roles
                          <Button variant="plain" style={{ padding: '0', marginLeft: '4px' }}>
                            <ChevronDownIcon />
                          </Button>
                        </FlexItem>
                      </Flex>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClustersData.map((cluster) => (
                    <tr key={cluster.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <input type="checkbox" style={{ marginRight: '8px' }} />
                          </FlexItem>
                          <FlexItem>
                            <FolderIcon style={{ marginRight: '8px', color: '#6a6e73' }} />
                          </FlexItem>
                          <FlexItem>
                            <Button variant="link" isInline style={{ padding: '0', textAlign: 'left' }}>
                              {cluster.name}
                            </Button>
                          </FlexItem>
                        </Flex>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {cluster.workspace}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {cluster.roles}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Button variant="plain" style={{ padding: '0' }}>
                          <EllipsisVIcon />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export { RHELOpenShift };
