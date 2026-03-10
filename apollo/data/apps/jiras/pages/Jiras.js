import React, { useState, useEffect, useMemo } from 'react';
import {
  PageSection,
  Title,
  Content,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Spinner,
  Alert,
  List,
  ListItem,
  Flex,
  FlexItem,
  Button,
  Label,
  Grid,
  GridItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, SyncAltIcon, SitemapIcon, ColumnsIcon } from '@patternfly/react-icons';

const CATEGORIES = [
  { id: 'backlog', title: 'Refinement', statusMatch: ['refinement', 'backlog', 'selected for development'] },
  { id: 'todo', title: 'To Do', statusMatch: ['to do', 'todo', 'open', 'new'] },
  { id: 'inprogress', title: 'In Progress', statusMatch: ['in progress', 'in development', 'in review', 'code review', 'testing'] }
];

function getCategoryForStatus(status) {
  if (!status) return 'backlog';
  const s = status.toLowerCase().trim();
  for (const cat of CATEGORIES) {
    if (cat.statusMatch.some((m) => s === m || s.includes(m))) return cat.id;
  }
  return 'backlog';
}

function IssueRow({ issue }) {
  return (
    <ListItem style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>
          <strong>{issue.key}</strong>
          {issue.summary && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--pf-v6-global--Color--200)' }}>
              {issue.summary}
            </span>
          )}
          {issue.status && (
            <Label color="blue" style={{ marginLeft: '0.5rem' }}>
              {issue.status}
            </Label>
          )}
        </FlexItem>
        <FlexItem>
          {issue.url && (
            <Button
              component="a"
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="link"
              icon={<ExternalLinkAltIcon />}
              iconPosition="right"
            >
              Open in Jira
            </Button>
          )}
        </FlexItem>
      </Flex>
    </ListItem>
  );
}

const NO_EPIC_KEY = '__no_epic__';

const Jiras = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('status'); // 'status' | 'epic'

  const byCategory = useMemo(() => {
    const todo = [];
    const inprogress = [];
    const backlog = [];
    for (const issue of issues) {
      const cat = getCategoryForStatus(issue.status);
      if (cat === 'todo') todo.push(issue);
      else if (cat === 'inprogress') inprogress.push(issue);
      else backlog.push(issue);
    }
    return { todo, inprogress, backlog };
  }, [issues]);

  const byEpic = useMemo(() => {
    const map = new Map();
    let baseUrl = '';
    for (const issue of issues) {
      if (issue.url) baseUrl = issue.url.replace(/\/browse\/[^/?#]+.*$/, '');
      const isEpic = issue.issueType && /epic/i.test(issue.issueType);
      if (isEpic) {
        if (!map.has(issue.key)) map.set(issue.key, []);
        continue;
      }
      const parentIsEpic = issue.parent && /epic/i.test(issue.parent.issueType || '');
      const key = issue.epicKey || (parentIsEpic ? issue.parent.key : null) || NO_EPIC_KEY;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(issue);
    }
    if (!baseUrl && issues.length > 0 && issues[0].url) {
      baseUrl = issues[0].url.replace(/\/browse\/[^/?#]+.*$/, '');
    }
    return Array.from(map.entries()).map(([epicKey, epicIssues]) => ({
      epicKey: epicKey === NO_EPIC_KEY ? null : epicKey,
      epicUrl: epicKey === NO_EPIC_KEY ? null : (baseUrl ? `${baseUrl}/browse/${epicKey}` : null),
      issues: epicIssues
    }));
  }, [issues]);

  const fetchJira = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks?sources=jira&refresh=true');
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.issues)) {
        const jiraOnly = data.issues.filter((i) => i && i.source === 'jira');
        setIssues(jiraOnly);
      } else {
        setError(data.error || 'Failed to load Jira issues');
      }
    } catch (err) {
      const msg = err && err.message;
      const isNetwork = !msg || msg === 'Failed to fetch' || msg.includes('NetworkError');
      setError(
        isNetwork
          ? 'Could not reach the server. Make sure the app is running (npm run dev) and try again.'
          : msg || 'Failed to load Jira issues'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJira();
  }, []);

  return (
    <>
      <style>{`
        .jiras-org-chart { display: flex; flex-direction: column; gap: 2.5rem; }
        .jiras-org-chart-epic-block { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .jiras-org-chart-epic-node { min-width: 200px; }
        .jiras-org-chart-vline {
          width: 2px; min-height: 20px; margin: 0 auto;
          background: var(--pf-v6-global--BorderColor--100, #d2d2d2);
        }
        .jiras-org-chart-children {
          display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; gap: 1rem;
          padding-top: 1rem; margin-top: 0;
          border-top: 2px solid var(--pf-v6-global--BorderColor--100, #d2d2d2);
          width: 100%; box-sizing: border-box; overflow: visible;
        }
        .jiras-org-chart-story-node { flex: 0 1 auto; min-width: 200px; }
        .jiras-org-chart-epic-card {
          border: 2px solid var(--pf-v6-global--palette--purple-300, #7373c8);
          background: var(--pf-v6-global--palette--purple-50, #f5f5fa);
        }
      `}</style>
      <PageSection variant="light">
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'wrap' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              Jiras
            </Title>
            <Content component="p" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
              Your assigned Jira issues. Configure Jira in Settings → Integrations if none appear.
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }}>
              <ToggleGroup aria-label="View mode">
                <ToggleGroupItem
                  icon={<ColumnsIcon />}
                  text="By status"
                  isSelected={viewMode === 'status'}
                  onChange={() => setViewMode('status')}
                  buttonId="jiras-view-status"
                />
                <ToggleGroupItem
                  icon={<SitemapIcon />}
                  text="By epic"
                  isSelected={viewMode === 'epic'}
                  onChange={() => setViewMode('epic')}
                  buttonId="jiras-view-epic"
                />
              </ToggleGroup>
              <Button variant="secondary" icon={<SyncAltIcon />} onClick={fetchJira} isDisabled={loading}>
                Refresh
              </Button>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>
      <PageSection>
        {loading && (
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '2rem' }}>
            <Spinner size="lg" />
          </Flex>
        )}
        {!loading && error && (
          <Alert variant="warning" title={error} isInline />
        )}
        {!loading && !error && issues.length === 0 && (
          <Content component="p">
            No Jira issues assigned to you, or Jira is not configured. Add your Jira URL and API token in Settings → Integrations.
          </Content>
        )}
        {!loading && !error && issues.length > 0 && viewMode === 'status' && (
          <Grid hasGutter>
            {CATEGORIES.map((cat) => (
              <GridItem key={cat.id} span={12} md={6} xl={4}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {cat.title} ({byCategory[cat.id].length})
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    {byCategory[cat.id].length === 0 ? (
                      <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                        No issues
                      </Content>
                    ) : (
                      <List isPlain isBordered>
                        {byCategory[cat.id].map((issue) => (
                          <IssueRow key={issue.key} issue={issue} />
                        ))}
                      </List>
                    )}
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}
        {!loading && !error && issues.length > 0 && viewMode === 'epic' && (
          <div className="jiras-org-chart">
            {byEpic.map(({ epicKey, epicUrl, issues: epicIssues }) => (
              <div key={epicKey || NO_EPIC_KEY} className="jiras-org-chart-epic-block">
                <Card className="jiras-org-chart-epic-node jiras-org-chart-epic-card" component="div">
                  <CardHeader style={{ padding: '0.75rem 1rem' }}>
                    <CardTitle>
                      {epicKey ? (
                        epicUrl ? (
                          <Button
                            component="a"
                            href={epicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="link"
                            isInline
                            style={{ fontSize: '1.125rem', fontWeight: 'bold', padding: 0 }}
                          >
                            Epic: {epicKey}
                            <ExternalLinkAltIcon style={{ marginLeft: '0.25rem' }} />
                          </Button>
                        ) : (
                          <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Epic: {epicKey}</span>
                        )
                      ) : (
                        <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--pf-v6-global--Color--200)' }}>
                          No epic
                        </span>
                      )}
                      <Label color="grey" style={{ marginLeft: '0.5rem' }}>
                        {epicIssues.length} {epicIssues.length === 1 ? 'story' : 'stories'} assigned to me
                      </Label>
                    </CardTitle>
                  </CardHeader>
                  <CardBody style={{ padding: '0.5rem 1rem 0.75rem' }}>
                    {epicIssues.length === 0 ? (
                      <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', margin: 0 }}>
                        No stories assigned to you in this epic.
                      </Content>
                    ) : null}
                  </CardBody>
                </Card>
                {epicIssues.length > 0 && (
                  <>
                    <div className="jiras-org-chart-vline" aria-hidden="true" />
                    <div className="jiras-org-chart-children">
                      {epicIssues.map((issue) => (
                        <Card key={issue.key} className="jiras-org-chart-story-node" component="div">
                          <CardBody style={{ padding: '0.75rem 1rem', minWidth: '200px' }}>
                            <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                              {epicKey && (
                                <FlexItem>
                                  <Label color="purple" style={{ fontSize: '0.75rem' }}>
                                    Epic: {epicKey}
                                  </Label>
                                </FlexItem>
                              )}
                              <FlexItem>
                                <strong>{issue.key}</strong>
                                {issue.status && (
                                  <Label color="blue" style={{ marginLeft: '0.5rem' }}>
                                    {issue.status}
                                  </Label>
                                )}
                              </FlexItem>
                              {issue.summary && (
                                <FlexItem style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                  {issue.summary}
                                </FlexItem>
                              )}
                              {issue.url && (
                                <FlexItem>
                                  <Button
                                    component="a"
                                    href={issue.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="link"
                                    size="sm"
                                    icon={<ExternalLinkAltIcon />}
                                    iconPosition="right"
                                  >
                                    Open in Jira
                                  </Button>
                                </FlexItem>
                              )}
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
};

export default Jiras;
