import * as React from 'react';
import {
  PageSection,
  Title,
  Button,
  TextInput,
  Flex,
  FlexItem,
  Content,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Tabs,
  Tab,
  TabContent,
  TabTitleText
} from '@patternfly/react-core';
import {
  FilterIcon,
  SearchIcon,
  AngleRightIcon,
  AngleDownIcon,
  ExclamationTriangleIcon,
  QuestionCircleIcon,
  InfoCircleIcon,
  EllipsisVIcon,
  ListIcon,
  ThIcon,
  StarIcon,
  TimesIcon
} from '@patternfly/react-icons';

interface ComplianceRule {
  id: string;
  name: string;
  cce: string;
  severity: 'Medium' | 'Unknown';
  remediationType: 'Playbook';
  description?: string;
  identifier?: string;
  references?: string;
  rationale?: string;
}

const initialRules: ComplianceRule[] = [
  {
    id: '1',
    name: 'Add nodev Option to /dev/shm',
    cce: 'CCE-80837-8',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
  {
    id: '2',
    name: 'Add nodev Option to /home',
    cce: 'CCE-81048-1',
    severity: 'Unknown',
    remediationType: 'Playbook',
    description:
      'The nodev mount option can be used to prevent device files from being created in /home. Legitimate character and block devices should exist only in the /dev directory on the root partition or within chroot jails built for system services. Add the nodev option to the fourth column of /etc/fstab for the line which controls mounting of /home.',
    identifier: 'CCE-81048-1',
    references: 'SRG-OS-000368-GPOS-00154, 1.1.2.3.2',
    rationale:
      'The only legitimate location for device files is the /dev directory located on the root partition. The only exception to this is chroot jails.',
  },
  {
    id: '3',
    name: 'Add nodev Option to /tmp',
    cce: 'CCE-82623-0',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
  {
    id: '4',
    name: 'Add nodev Option to /var',
    cce: 'CCE-82062-1',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
  {
    id: '5',
    name: 'Add nodev Option to /var/log',
    cce: 'CCE-82063-2',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
  {
    id: '6',
    name: 'Add nodev Option to /var/log/audit',
    cce: 'CCE-82064-3',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
  {
    id: '7',
    name: 'Add nodev Option to /var/tmp',
    cce: 'CCE-82065-4',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
  {
    id: '8',
    name: 'Add nosuid Option to /dev/shm',
    cce: 'CCE-80838-9',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
  {
    id: '9',
    name: 'Add nosuid Option to /home',
    cce: 'CCE-81049-2',
    severity: 'Unknown',
    remediationType: 'Playbook',
  },
  {
    id: '10',
    name: 'Add nosuid Option to /tmp',
    cce: 'CCE-82624-1',
    severity: 'Medium',
    remediationType: 'Playbook',
  },
];

const RHELCompliance: React.FunctionComponent = () => {
  const [expandedRuleId, setExpandedRuleId] = React.useState<string | null>('2'); // Rule 2 is expanded by default
  const [filterByName, setFilterByName] = React.useState('');
  const [isNameDropdownOpen, setIsNameDropdownOpen] = React.useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = React.useState(false);
  const [showAIPanel, setShowAIPanel] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'details' | 'sources'>('details');
  const [chatInput, setChatInput] = React.useState('');

  const toggleRuleExpansion = (ruleId: string) => {
    setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
  };

  const filteredRules = initialRules.filter((rule) =>
    rule.name.toLowerCase().includes(filterByName.toLowerCase()) ||
    rule.cce.toLowerCase().includes(filterByName.toLowerCase())
  );

  const renderSeverityIcon = (severity: ComplianceRule['severity']) => {
    switch (severity) {
      case 'Medium':
        return <ExclamationTriangleIcon style={{ color: '#f0ad4e' }} />;
      case 'Unknown':
        return <QuestionCircleIcon style={{ color: '#6a6e73' }} />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageSection variant="default" style={{ paddingBottom: 0 }}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              RHEL 8.10
            </Title>
            <Content component="small">SSG version: 0.1.77 <InfoCircleIcon /></Content>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Button variant="primary">Edit rules</Button>
              </FlexItem>
              <FlexItem>
                <Button variant="plain" aria-label="More actions">
                  <EllipsisVIcon />
                </Button>
              </FlexItem>
              <FlexItem>
                <Dropdown
                  isOpen={isViewDropdownOpen}
                  onSelect={() => setIsViewDropdownOpen(false)}
                  onOpenChange={(isOpen: boolean) => setIsViewDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                      isExpanded={isViewDropdownOpen}
                      aria-label="View options"
                    >
                      <ListIcon />
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem key="list-view" icon={<ListIcon />} isDisabled>List view</DropdownItem>
                    <DropdownItem key="grid-view" icon={<ThIcon />}>Grid view</DropdownItem>
                  </DropdownList>
                </Dropdown>
              </FlexItem>
              <FlexItem>
                <Content component="small">1-10 of 298</Content>
                <Button variant="plain" aria-label="Previous page"><AngleRightIcon style={{ transform: 'rotate(180deg)' }} /></Button>
                <Button variant="plain" aria-label="Next page"><AngleRightIcon /></Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection variant="default" style={{ paddingTop: 0 }}>
        <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Dropdown
              isOpen={isNameDropdownOpen}
              onSelect={() => setIsNameDropdownOpen(false)}
              onOpenChange={(isOpen: boolean) => setIsNameDropdownOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsNameDropdownOpen(!isNameDropdownOpen)}
                  isExpanded={isNameDropdownOpen}
                  aria-label="Filter by name"
                >
                  <FilterIcon /> Name <AngleDownIcon />
                </MenuToggle>
              )}
              shouldFocusToggleOnSelect
            >
              <DropdownList>
                <DropdownItem key="name-filter">Filter by Name</DropdownItem>
              </DropdownList>
            </Dropdown>
          </FlexItem>
          <FlexItem>
            <div style={{ position: 'relative' }}>
              <TextInput
                type="text"
                id="filter-by-name"
                placeholder="Filter by name"
                value={filterByName}
                onChange={(_event, value) => setFilterByName(value)}
                aria-label="Filter by name input"
                style={{ paddingRight: '40px' }}
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
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <table className="pf-v6-c-table pf-m-grid-md" role="grid" aria-label="Compliance Rules Table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr role="row" style={{ borderBottom: '1px solid #d2d2d2', backgroundColor: '#f5f5f5' }}>
                  <th role="columnheader" scope="col" style={{ width: '5%', padding: '12px', textAlign: 'left', fontWeight: 'bold' }}></th>
                  <th role="columnheader" scope="col" style={{ width: '50%', padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                    <Button variant="plain" aria-label="Sort by Name" style={{ padding: 0 }}>
                      Name <AngleDownIcon style={{ transform: 'rotate(180deg)' }} />
                    </Button>
                  </th>
                  <th role="columnheader" scope="col" style={{ width: '20%', padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                    <Button variant="plain" aria-label="Sort by Severity" style={{ padding: 0 }}>
                      Severity <AngleDownIcon />
                    </Button>
                  </th>
                  <th role="columnheader" scope="col" style={{ width: '25%', padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                    <Button variant="plain" aria-label="Sort by Remediation type" style={{ padding: 0 }}>
                      Remediation type <AngleDownIcon />
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <React.Fragment key={rule.id}>
                    <tr role="row" style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td role="cell" style={{ padding: '12px' }}>
                        <Button variant="plain" onClick={() => toggleRuleExpansion(rule.id)} aria-expanded={expandedRuleId === rule.id} style={{ padding: 0 }}>
                          {expandedRuleId === rule.id ? <AngleDownIcon /> : <AngleRightIcon />}
                        </Button>
                      </td>
                      <td role="cell" style={{ padding: '12px' }}>
                        <Content component="p" style={{ marginBottom: '0', fontWeight: '500' }}>{rule.name}</Content>
                        <Content component="small" style={{ color: '#6a6e73' }}>{rule.cce}</Content>
                      </td>
                      <td role="cell" style={{ padding: '12px' }}>
                        <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>{renderSeverityIcon(rule.severity)}</FlexItem>
                          <FlexItem>{rule.severity}</FlexItem>
                        </Flex>
                      </td>
                      <td role="cell" style={{ padding: '12px' }}>{rule.remediationType}</td>
                    </tr>
                    {expandedRuleId === rule.id && rule.description && (
                      <tr role="row">
                        <td role="cell" colSpan={4} style={{ padding: 0 }}>
                          <Card style={{ marginLeft: '48px', marginRight: '48px', marginBottom: '16px', backgroundColor: '#f8f9fa' }}>
                            <CardBody>
                              <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>Description</Title>
                              <Content component="p" style={{ marginBottom: '16px' }}>{rule.description}</Content>
                              <Button 
                                variant="secondary" 
                                icon={<StarIcon style={{ color: '#000' }} />} 
                                iconPosition="right" 
                                onClick={() => setShowAIPanel(true)}
                                style={{ 
                                  padding: '8px 16px', 
                                  marginBottom: '16px',
                                  backgroundColor: 'white',
                                  border: '1px solid #0066cc',
                                  borderRadius: '6px',
                                  color: '#0066cc',
                                  fontSize: '14px',
                                  fontWeight: 'normal'
                                }}
                              >
                                Enhanced summary
                              </Button>

                              <Flex spaceItems={{ default: 'spaceItemsXl' }} style={{ marginBottom: '16px' }}>
                                <FlexItem>
                                  <Title headingLevel="h5" size="md" style={{ marginBottom: '4px' }}>Identifier</Title>
                                  <Button variant="link" isInline style={{ padding: 0, fontSize: '14px' }}>{rule.identifier}</Button>
                                </FlexItem>
                                <FlexItem>
                                  <Title headingLevel="h5" size="md" style={{ marginBottom: '4px' }}>References</Title>
                                  <Button variant="link" isInline style={{ padding: 0, fontSize: '14px' }}>{rule.references}</Button>
                                </FlexItem>
                              </Flex>

                              <Title headingLevel="h5" size="md" style={{ marginBottom: '4px' }}>Rationale</Title>
                              <Content component="p">{rule.rationale}</Content>
                            </CardBody>
                          </Card>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </PageSection>

      {/* AI Enhanced Summary Panel */}
      {showAIPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          backgroundColor: 'white',
          borderLeft: '1px solid #d2d2d2',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #d2d2d2',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <StarIcon style={{ color: '#0066cc' }} />
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h3" size="lg" style={{ margin: 0 }}>AI enhanced summary</Title>
              </FlexItem>
            </Flex>
            <Button variant="plain" onClick={() => setShowAIPanel(false)} aria-label="Close panel">
              <TimesIcon />
            </Button>
          </div>

          {/* Panel Content */}
          <div style={{ padding: '16px' }}>
            <Tabs
              activeKey={activeTab}
              onSelect={(event, tabIndex) => setActiveTab(tabIndex as 'details' | 'sources')}
              aria-label="AI Enhanced Summary Tabs"
            >
              <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
                <TabContent id="details-tab-content">
                  <Content component="p" style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                    As a system administrator, understanding and implementing security controls is a core part of your job. CCE-86721-8 is a specific control you might encounter in compliance frameworks like the Security Technical Implementation Guides (STIGs) or other hardening baselines. Let's break down this control for RHEL systems.
                  </Content>
                  
                  <Title headingLevel="h4" size="md" style={{ marginBottom: '8px', marginTop: '16px' }}>
                    Plain-Language Description of CCE-86721-8
                  </Title>
                  <Content component="p" style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                    CCE-86721-8, often associated with STIG benchmarks, essentially requires that a system is configured to enable Pluggable Authentication Modules (PAM).
                  </Content>
                  
                  <Content component="p" style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                    In simple terms, PAM is a flexible framework on Linux and other Unix-like systems that handles how users are authenticated. Instead of each application (like sshd for SSH logins, passwd for changing passwords, or sudo for elevated privileges) having to implement its own authentication logic, they delegate this responsibility to PAM modules. This centralization makes authentication more consistent, secure, and manageable across the system.
                  </Content>
                </TabContent>
              </Tab>
              
              <Tab eventKey="sources" title={<TabTitleText>Sources</TabTitleText>}>
                <TabContent id="sources-tab-content">
                  <Content component="p" style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                    Sources and references for this compliance rule will be displayed here.
                  </Content>
                </TabContent>
              </Tab>
            </Tabs>

            {/* Chat Input Field */}
            <div style={{ marginTop: '24px', marginBottom: '16px' }}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <TextInput
                    type="text"
                    id="ai-chat-input"
                    placeholder="Ask a follow-up question about this compliance rule..."
                    value={chatInput}
                    onChange={(_event, value) => setChatInput(value)}
                    aria-label="AI chat input"
                    style={{ width: '100%' }}
                  />
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (chatInput.trim()) {
                        console.log('Sending chat message:', chatInput);
                        // Here you would typically send the message to an AI service
                        setChatInput('');
                      }
                    }}
                    isDisabled={!chatInput.trim()}
                    aria-label="Send message"
                  >
                    Send
                  </Button>
                </FlexItem>
              </Flex>
            </div>

            {/* Warning Box */}
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              padding: '12px',
              marginTop: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <ExclamationTriangleIcon style={{ color: '#856404', marginTop: '2px', flexShrink: 0 }} />
              <Content component="small" style={{ color: '#856404', fontSize: '12px', lineHeight: '1.4' }}>
                This information is derived from an AI model. While we aim for accuracy, AI-generated content may occasionally contain errors, inaccuracies, or incomplete information.
              </Content>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { RHELCompliance };
