import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Card,
  CardTitle,
  CardBody,
  CardHeader,
  Gallery,
  Grid,
  GridItem,
  Flex,
  FlexItem,
  Alert,
  Spinner,
  Button,
  Label,
  SearchInput,
  Tabs,
  Tab,
  TabTitleText,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Split,
  SplitItem,
  Badge,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  EmptyStateVariant,
  Select,
  SelectOption,
  MenuToggle
} from '@patternfly/react-core';
import {
  HomeIcon,
  LightbulbIcon,
  ThermometerHalfIcon,
  PowerOffIcon,
  SyncAltIcon,
  CogIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  SearchIcon,
  TimesIcon
} from '@patternfly/react-icons';

// Domain icons mapping
const domainIcons = {
  light: LightbulbIcon,
  switch: PowerOffIcon,
  sensor: ThermometerHalfIcon,
  binary_sensor: CheckCircleIcon,
  climate: ThermometerHalfIcon,
  default: HomeIcon
};

// Domain colors mapping
const domainColors = {
  light: '#FFC107',
  switch: '#4CAF50',
  sensor: '#2196F3',
  binary_sensor: '#9C27B0',
  climate: '#FF5722',
  default: '#607D8B'
};

const HomeAssistant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [states, setStates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [isDomainSelectOpen, setIsDomainSelectOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load summary and states in parallel
      const [summaryRes, statesRes] = await Promise.all([
        fetch('/api/homeassistant/summary'),
        fetch('/api/homeassistant/states')
      ]);
      
      const summaryData = await summaryRes.json();
      const statesData = await statesRes.json();
      
      if (!summaryData.success || !statesData.success) {
        setError(summaryData.error || statesData.error || 'Failed to load Home Assistant data');
        return;
      }
      
      setSummary(summaryData.summary);
      setStates(statesData.states);
    } catch (err) {
      setError(`Error connecting to Home Assistant: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get unique domains from states
  const domains = [...new Set(states.map(s => s.domain))].sort();

  // Filter states based on search and domain
  const filteredStates = states.filter(state => {
    const matchesSearch = !searchQuery || 
      state.friendlyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.entityId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDomain = selectedDomain === 'all' || state.domain === selectedDomain;
    
    return matchesSearch && matchesDomain;
  });

  // Group states by domain for the overview
  const statesByDomain = filteredStates.reduce((acc, state) => {
    if (!acc[state.domain]) {
      acc[state.domain] = [];
    }
    acc[state.domain].push(state);
    return acc;
  }, {});

  const getStateColor = (state) => {
    if (state.state === 'on') return 'var(--pf-v6-global--success-color--100)';
    if (state.state === 'off') return 'var(--pf-v6-global--Color--200)';
    if (state.state === 'unavailable' || state.state === 'unknown') return 'var(--pf-v6-global--danger-color--100)';
    return 'var(--pf-v6-global--info-color--100)';
  };

  const formatState = (state) => {
    if (state.attributes?.unit_of_measurement) {
      return `${state.state} ${state.attributes.unit_of_measurement}`;
    }
    return state.state;
  };

  const formatLastChanged = (lastChanged) => {
    if (!lastChanged) return 'Unknown';
    const date = new Date(lastChanged);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} days ago`;
  };

  const getDomainIcon = (domain) => {
    const IconComponent = domainIcons[domain] || domainIcons.default;
    return <IconComponent />;
  };

  if (loading) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
            <HomeIcon size="lg" style={{ color: '#18BCF2' }} />
            <Title headingLevel="h1" size="2xl">Home Assistant</Title>
          </Flex>
        </PageSection>
        <PageSection isFilled>
          <Flex justifyContent={{ default: 'justifyContentCenter' }} alignItems={{ default: 'alignItemsCenter' }} style={{ height: '300px' }}>
            <Spinner size="xl" />
          </Flex>
        </PageSection>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
            <HomeIcon size="lg" style={{ color: '#18BCF2' }} />
            <Title headingLevel="h1" size="2xl">Home Assistant</Title>
          </Flex>
        </PageSection>
        <PageSection isFilled>
          <EmptyState
            titleText="Unable to connect to Home Assistant"
            headingLevel="h2"
            icon={ExclamationCircleIcon}
            status="danger"
          >
            <EmptyStateBody>
              {error}
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={() => navigate('/settings')}>
                  Configure Home Assistant
                </Button>
                <Button variant="secondary" onClick={loadData}>
                  Retry
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </PageSection>
      </>
    );
  }

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Split hasGutter>
          <SplitItem isFilled>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              <HomeIcon size="lg" style={{ color: '#18BCF2' }} />
              <div>
                <Title headingLevel="h1" size="2xl">Home Assistant</Title>
                <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  {summary?.locationName || 'Home'} • v{summary?.version || 'Unknown'} • {summary?.totalEntities || 0} entities
                </Content>
              </div>
            </Flex>
          </SplitItem>
          <SplitItem>
            <Button 
              variant="secondary" 
              icon={<SyncAltIcon />} 
              onClick={handleRefresh}
              isLoading={refreshing}
            >
              Refresh
            </Button>
          </SplitItem>
        </Split>
      </PageSection>

      <PageSection variant={PageSectionVariants.light} style={{ paddingTop: 0 }}>
        {/* Quick Stats */}
        <Gallery hasGutter minWidths={{ default: '200px' }}>
          <Card isCompact>
            <CardBody>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                <LightbulbIcon size="lg" style={{ color: '#FFC107' }} />
                <div>
                  <Title headingLevel="h3" size="lg">
                    {summary?.lights?.on || 0} / {summary?.lights?.total || 0}
                  </Title>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    Lights On
                  </Content>
                </div>
              </Flex>
            </CardBody>
          </Card>
          
          <Card isCompact>
            <CardBody>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                <PowerOffIcon size="lg" style={{ color: '#4CAF50' }} />
                <div>
                  <Title headingLevel="h3" size="lg">
                    {summary?.switches?.on || 0} / {summary?.switches?.total || 0}
                  </Title>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    Switches On
                  </Content>
                </div>
              </Flex>
            </CardBody>
          </Card>
          
          <Card isCompact>
            <CardBody>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                <ThermometerHalfIcon size="lg" style={{ color: '#2196F3' }} />
                <div>
                  <Title headingLevel="h3" size="lg">
                    {summary?.sensors || 0}
                  </Title>
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                    Sensors
                  </Content>
                </div>
              </Flex>
            </CardBody>
          </Card>
          
          {summary?.thermostats?.length > 0 && (
            <Card isCompact>
              <CardBody>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                  <ThermometerHalfIcon size="lg" style={{ color: '#FF5722' }} />
                  <div>
                    <Title headingLevel="h3" size="lg">
                      {summary.thermostats[0]?.currentTemp || '--'}°
                    </Title>
                    <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                      {summary.thermostats[0]?.name || 'Thermostat'}
                    </Content>
                  </div>
                </Flex>
              </CardBody>
            </Card>
          )}
        </Gallery>
      </PageSection>

      <PageSection isFilled>
        <Tabs activeKey={activeTabKey} onSelect={(_e, key) => setActiveTabKey(key)}>
          <Tab eventKey={0} title={<TabTitleText>All Entities</TabTitleText>}>
            {/* Search and Filter */}
            <Flex gap={{ default: 'gapMd' }} style={{ marginBottom: '1rem', marginTop: '1rem' }}>
              <FlexItem grow={{ default: 'grow' }}>
                <SearchInput
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(_e, value) => setSearchQuery(value)}
                  onClear={() => setSearchQuery('')}
                />
              </FlexItem>
              <FlexItem>
                <Select
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsDomainSelectOpen(!isDomainSelectOpen)}
                      isExpanded={isDomainSelectOpen}
                    >
                      {selectedDomain === 'all' ? 'All Domains' : selectedDomain}
                    </MenuToggle>
                  )}
                  isOpen={isDomainSelectOpen}
                  onOpenChange={setIsDomainSelectOpen}
                  onSelect={(_e, value) => {
                    setSelectedDomain(value);
                    setIsDomainSelectOpen(false);
                  }}
                  selected={selectedDomain}
                >
                  <SelectOption value="all">All Domains</SelectOption>
                  {domains.map(domain => (
                    <SelectOption key={domain} value={domain}>{domain}</SelectOption>
                  ))}
                </Select>
              </FlexItem>
            </Flex>

            {/* Entity List by Domain */}
            {Object.entries(statesByDomain).sort().map(([domain, domainStates]) => (
              <div key={domain} style={{ marginBottom: '1.5rem' }}>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '0.5rem' }}>
                  {getDomainIcon(domain)}
                  <Title headingLevel="h3" size="md" style={{ textTransform: 'capitalize' }}>
                    {domain.replace('_', ' ')}
                  </Title>
                  <Badge>{domainStates.length}</Badge>
                </Flex>
                
                <div style={{
                  border: '1px solid var(--pf-v6-global--BorderColor--100)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {domainStates.map((state, index) => (
                    <div
                      key={state.entityId}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: index < domainStates.length - 1 
                          ? '1px solid var(--pf-v6-global--BorderColor--100)' 
                          : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{state.friendlyName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                          {state.entityId}
                        </div>
                      </div>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 500, color: getStateColor(state) }}>
                            {formatState(state)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                            {formatLastChanged(state.lastChanged)}
                          </div>
                        </div>
                      </Flex>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredStates.length === 0 && (
              <EmptyState
                titleText="No entities found"
                headingLevel="h3"
                icon={SearchIcon}
                variant={EmptyStateVariant.sm}
              >
                <EmptyStateBody>
                  No entities match your search criteria.
                </EmptyStateBody>
              </EmptyState>
            )}
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Domain Summary</TabTitleText>}>
            <Grid hasGutter style={{ marginTop: '1rem' }}>
              {Object.entries(summary?.domainCounts || {}).sort((a, b) => b[1] - a[1]).map(([domain, count]) => (
                <GridItem key={domain} span={3}>
                  <Card isCompact isClickable onClick={() => {
                    setSelectedDomain(domain);
                    setActiveTabKey(0);
                  }}>
                    <CardBody>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                        <div style={{ 
                          padding: '0.5rem', 
                          borderRadius: '8px', 
                          backgroundColor: `${domainColors[domain] || domainColors.default}20`,
                          color: domainColors[domain] || domainColors.default
                        }}>
                          {getDomainIcon(domain)}
                        </div>
                        <div>
                          <Title headingLevel="h4" size="md">{count}</Title>
                          <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', textTransform: 'capitalize' }}>
                            {domain.replace('_', ' ')}
                          </Content>
                        </div>
                      </Flex>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Climate</TabTitleText>}>
            <Grid hasGutter style={{ marginTop: '1rem' }}>
              {(summary?.thermostats || []).map((thermostat, index) => (
                <GridItem key={index} span={4}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{thermostat.name}</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <DescriptionList isHorizontal isCompact>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Current</DescriptionListTerm>
                          <DescriptionListDescription>
                            <strong style={{ fontSize: '1.25rem' }}>{thermostat.currentTemp || '--'}°</strong>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Target</DescriptionListTerm>
                          <DescriptionListDescription>{thermostat.targetTemp || '--'}°</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Mode</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label color="blue" isCompact>{thermostat.hvacMode}</Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
              
              {(!summary?.thermostats || summary.thermostats.length === 0) && (
                <GridItem span={12}>
                  <EmptyState
                    titleText="No climate entities"
                    headingLevel="h3"
                    icon={ThermometerHalfIcon}
                    variant={EmptyStateVariant.sm}
                  >
                    <EmptyStateBody>
                      No thermostats or climate devices found in your Home Assistant.
                    </EmptyStateBody>
                  </EmptyState>
                </GridItem>
              )}
            </Grid>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export default HomeAssistant;
