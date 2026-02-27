import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Card,
  CardTitle,
  CardBody,
  Button,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Alert,
  Spinner,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  Divider,
  Radio,
  Chip,
  ChipGroup,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Breadcrumb,
  BreadcrumbItem,
  ActionGroup,
  HelperText,
  HelperTextItem,
  Split,
  SplitItem,
  Stack,
  StackItem
} from '@patternfly/react-core';
import {
  TimesIcon,
  PlusCircleIcon,
  ExternalLinkAltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  ArrowLeftIcon,
  LockIcon,
  GlobeIcon,
  UsersIcon
} from '@patternfly/react-icons';

// Import service logos
import logoJira from '../assets/logos/logo-jira.svg';
import logoConfluence from '../assets/logos/logo-confluence.svg';
import logoSlack from '../assets/logos/logo-slack.svg';
import logoGoogleDrive from '../assets/logos/logo-google-drive.svg';
import logoGitlab from '../assets/logos/logo-gitlab.svg';
import logoGithub from '../assets/logos/logo-github.svg';
import logoFigma from '../assets/logos/logo-figma.svg';
import logoNotion from '../assets/logos/logo-notion.svg';

// Source type detection patterns and metadata
const sourceTypes = [
  {
    id: 'jira',
    name: 'Jira',
    logo: logoJira,
    color: '#0052CC',
    patterns: [
      /atlassian\.net\/.*\/projects?\//i,
      /atlassian\.net\/browse\//i,
      /jira\./i
    ],
    extractLabel: (url) => {
      // Try to extract project key from URL
      const projectMatch = url.match(/projects?\/([A-Z0-9]+)/i) || url.match(/browse\/([A-Z]+-\d+)/i);
      return projectMatch ? projectMatch[1] : url;
    }
  },
  {
    id: 'confluence',
    name: 'Confluence',
    logo: logoConfluence,
    color: '#172B4D',
    patterns: [
      /atlassian\.net\/wiki\//i,
      /confluence\./i
    ],
    extractLabel: (url) => {
      const spaceMatch = url.match(/spaces\/([^\/]+)/i);
      return spaceMatch ? spaceMatch[1] : url;
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    logo: logoSlack,
    color: '#4A154B',
    patterns: [
      /slack\.com\//i,
      /^#[a-z0-9-_]+$/i  // Slack channel format
    ],
    extractLabel: (url) => {
      if (url.startsWith('#')) return url;
      const channelMatch = url.match(/archives\/([A-Z0-9]+)/i);
      return channelMatch ? `#${channelMatch[1]}` : url;
    }
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    logo: logoGoogleDrive,
    color: '#4285F4',
    patterns: [
      /drive\.google\.com/i,
      /docs\.google\.com/i,
      /sheets\.google\.com/i,
      /slides\.google\.com/i
    ],
    extractLabel: (url) => {
      if (url.includes('folders/')) return 'Drive Folder';
      if (url.includes('document/')) return 'Google Doc';
      if (url.includes('spreadsheets/')) return 'Google Sheet';
      if (url.includes('presentation/')) return 'Google Slides';
      return 'Google Drive';
    }
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    logo: logoGitlab,
    color: '#FC6D26',
    patterns: [
      /gitlab\.com/i,
      /gitlab\./i
    ],
    extractLabel: (url) => {
      const repoMatch = url.match(/gitlab\.[^\/]+\/([^\/]+\/[^\/]+)/i);
      return repoMatch ? repoMatch[1] : url;
    }
  },
  {
    id: 'github',
    name: 'GitHub',
    logo: logoGithub,
    color: '#24292F',
    patterns: [
      /github\.com/i
    ],
    extractLabel: (url) => {
      const repoMatch = url.match(/github\.com\/([^\/]+\/[^\/]+)/i);
      return repoMatch ? repoMatch[1] : url;
    }
  },
  {
    id: 'figma',
    name: 'Figma',
    logo: logoFigma,
    color: '#F24E1E',
    patterns: [
      /figma\.com/i
    ],
    extractLabel: (url) => {
      const fileMatch = url.match(/file\/([^\/]+)/i);
      return fileMatch ? 'Figma File' : url;
    }
  },
  {
    id: 'notion',
    name: 'Notion',
    logo: logoNotion,
    color: '#000000',
    patterns: [
      /notion\.so/i,
      /notion\.site/i
    ],
    extractLabel: (url) => 'Notion Page'
  }
];

// Detect source type from URL
const detectSourceType = (url) => {
  for (const sourceType of sourceTypes) {
    for (const pattern of sourceType.patterns) {
      if (pattern.test(url)) {
        return {
          ...sourceType,
          label: sourceType.extractLabel(url)
        };
      }
    }
  }
  // Unknown type
  return {
    id: 'other',
    name: 'Other',
    logo: null,
    color: '#6c757d',
    label: url
  };
};

// Emoji options
const emojiOptions = ['📁', '🎯', '🚀', '💡', '🔬', '🎨', '📊', '🛠️', '📚', '🌟', '🎪', '🏠', '🌍', '🔒', '💼', '🍀'];

const SpaceSettings = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  
  // Space data
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [description, setDescription] = useState('');
  
  // Sources state
  const [sources, setSources] = useState([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [sourceValidating, setSourceValidating] = useState(false);
  const [sourceError, setSourceError] = useState(null);
  
  // Sharing state
  const [sharingMode, setSharingMode] = useState('private');
  const [sharedEmails, setSharedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState(null);

  // Load space data
  useEffect(() => {
    const loadSpace = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/spaces');
        if (!response.ok) throw new Error('Failed to load spaces');
        
        const data = await response.json();
        const foundSpace = data.spaces.find(s => s.id === spaceId);
        
        if (!foundSpace) {
          setError('Space not found');
          return;
        }
        
        setSpace(foundSpace);
        setName(foundSpace.name || '');
        setEmoji(foundSpace.emoji || '📁');
        setDescription(foundSpace.description || '');
        setSources(foundSpace.sources || []);
        setSharingMode(foundSpace.sharing?.mode || 'private');
        setSharedEmails(foundSpace.sharing?.emails || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadSpace();
  }, [spaceId]);

  // Validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add a new source
  const handleAddSource = useCallback(async () => {
    if (!newSourceUrl.trim()) return;
    
    const url = newSourceUrl.trim();
    
    // Check for duplicates
    if (sources.some(s => s.url === url)) {
      setSourceError('This source has already been added');
      return;
    }
    
    setSourceValidating(true);
    setSourceError(null);
    
    try {
      // Detect source type
      const detected = detectSourceType(url);
      
      // For now, we just validate the URL format
      // In the future, this could make API calls to verify the source exists
      let isValid = true;
      
      // Basic URL validation for non-channel sources
      if (!url.startsWith('#')) {
        try {
          new URL(url);
        } catch {
          isValid = false;
          setSourceError('Please enter a valid URL');
        }
      }
      
      if (isValid) {
        const newSource = {
          id: `source-${Date.now()}`,
          url: url,
          type: detected.id,
          typeName: detected.name,
          label: detected.label,
          addedAt: new Date().toISOString()
        };
        
        setSources(prev => [...prev, newSource]);
        setNewSourceUrl('');
      }
    } catch (err) {
      setSourceError('Failed to validate source');
    } finally {
      setSourceValidating(false);
    }
  }, [newSourceUrl, sources]);

  // Remove a source
  const handleRemoveSource = useCallback((sourceId) => {
    setSources(prev => prev.filter(s => s.id !== sourceId));
  }, []);

  // Add email to shared list
  const handleAddEmail = useCallback(() => {
    if (!newEmail.trim()) return;
    
    const email = newEmail.trim().toLowerCase();
    
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (sharedEmails.includes(email)) {
      setEmailError('This email has already been added');
      return;
    }
    
    setSharedEmails(prev => [...prev, email]);
    setNewEmail('');
    setEmailError(null);
  }, [newEmail, sharedEmails]);

  // Remove email from shared list
  const handleRemoveEmail = useCallback((email) => {
    setSharedEmails(prev => prev.filter(e => e !== email));
  }, []);

  // Save changes
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Space name is required');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          emoji,
          description: description.trim(),
          sources,
          sharing: {
            mode: sharingMode,
            emails: sharingMode === 'shared' ? sharedEmails : []
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to save changes');
      
      const data = await response.json();
      setSpace(data.space);
      setSuccessMessage('Space settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Group sources by type
  const groupedSources = sources.reduce((acc, source) => {
    const type = source.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(source);
    return acc;
  }, {});

  // Get source type info
  const getSourceTypeInfo = (typeId) => {
    return sourceTypes.find(t => t.id === typeId) || { name: 'Other', logo: null, color: '#6c757d' };
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <Flex justifyContent={{ default: 'justifyContentCenter' }} alignItems={{ default: 'alignItemsCenter' }} style={{ height: '200px' }}>
          <Spinner size="lg" />
        </Flex>
      </PageSection>
    );
  }

  if (error && !space) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Title headingLevel="h4" size="lg">Error Loading Space</Title>
          <EmptyStateBody>{error}</EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <>
      {/* Header */}
      <PageSection variant={PageSectionVariants.light}>
        <Breadcrumb style={{ marginBottom: '1rem' }}>
          <BreadcrumbItem>
            <Link to="/">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>
            Configure Space: {space?.emoji} {space?.name}
          </BreadcrumbItem>
        </Breadcrumb>
        <Split hasGutter>
          <SplitItem isFilled>
            <Title headingLevel="h1" size="2xl">
              Configure Space
            </Title>
            <Content component="p" style={{ marginTop: '0.5rem', color: 'var(--pf-v6-global--Color--200)' }}>
              Customize your space settings, add sources, and manage sharing preferences.
            </Content>
          </SplitItem>
          <SplitItem>
            <Button 
              variant="link" 
              icon={<ArrowLeftIcon />} 
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </SplitItem>
        </Split>
      </PageSection>
      
      <PageSection isFilled>
        {/* Alerts */}
        {error && (
          <Alert 
            variant="danger" 
            title={error} 
            actionClose={<Button variant="plain" aria-label="Close" onClick={() => setError(null)}><TimesIcon /></Button>}
            style={{ marginBottom: '1rem' }}
          />
        )}
        {successMessage && (
          <Alert 
            variant="success" 
            title={successMessage}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Stack hasGutter>
          {/* General Section */}
          <StackItem>
            <Card>
              <CardTitle>
                <Title headingLevel="h2" size="lg">General</Title>
              </CardTitle>
              <CardBody>
                <Form>
                  <FormGroup label="Name" isRequired fieldId="space-name">
                    <TextInput
                      id="space-name"
                      value={name}
                      onChange={(event, value) => setName(value)}
                      placeholder="e.g., RHOAI UX"
                      isRequired
                    />
                  </FormGroup>
                  
                  <FormGroup label="Emoji" fieldId="space-emoji">
                    <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }} style={{ marginBottom: '8px' }}>
                      {emojiOptions.map((e) => (
                        <Button
                          key={e}
                          variant={emoji === e ? 'primary' : 'secondary'}
                          onClick={() => setEmoji(e)}
                          style={{ 
                            fontSize: '18px', 
                            padding: '6px 10px',
                            minWidth: '40px'
                          }}
                        >
                          {e}
                        </Button>
                      ))}
                    </Flex>
                    <TextInput
                      id="space-emoji-custom"
                      value={emoji}
                      onChange={(event, value) => setEmoji(value)}
                      placeholder="Or enter custom emoji"
                      style={{ maxWidth: '200px' }}
                    />
                  </FormGroup>
                  
                  <FormGroup label="Description" fieldId="space-description">
                    <TextArea
                      id="space-description"
                      value={description}
                      onChange={(event, value) => setDescription(value)}
                      placeholder="Describe what this space is for..."
                      rows={3}
                    />
                  </FormGroup>
                </Form>
              </CardBody>
            </Card>
          </StackItem>

          {/* Sources Section */}
          <StackItem>
            <Card>
              <CardTitle>
                <Title headingLevel="h2" size="lg">Sources</Title>
              </CardTitle>
              <CardBody>
                <Content component="p" style={{ marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Add links to relevant resources. These will help scope pages like Tasks to show only relevant items.
                </Content>
                
                {/* Add source input */}
                <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                  <FlexItem grow={{ default: 'grow' }}>
                    <TextInput
                      id="new-source-url"
                      value={newSourceUrl}
                      onChange={(event, value) => {
                        setNewSourceUrl(value);
                        setSourceError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSource();
                        }
                      }}
                      placeholder="Paste a URL (Jira project, Google Drive folder, Slack channel, Git repo, etc.)"
                      validated={sourceError ? 'error' : 'default'}
                      isDisabled={sourceValidating}
                    />
                    {sourceError && (
                      <HelperText>
                        <HelperTextItem variant="error">{sourceError}</HelperTextItem>
                      </HelperText>
                    )}
                  </FlexItem>
                  <FlexItem>
                    <Button 
                      variant="primary" 
                      onClick={handleAddSource}
                      isDisabled={!newSourceUrl.trim() || sourceValidating}
                      isLoading={sourceValidating}
                      icon={<PlusCircleIcon />}
                    >
                      Add
                    </Button>
                  </FlexItem>
                </Flex>
                
                {/* Sources list grouped by type */}
                {sources.length > 0 ? (
                  <div style={{ marginTop: '1.5rem' }}>
                    {Object.entries(groupedSources).map(([typeId, typeSources]) => {
                      const typeInfo = getSourceTypeInfo(typeId);
                      return (
                        <div key={typeId} style={{ marginBottom: '1.5rem' }}>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '0.5rem' }}>
                            {typeInfo.logo && (
                              <img 
                                src={typeInfo.logo} 
                                alt={typeInfo.name} 
                                style={{ width: '20px', height: '20px' }}
                              />
                            )}
                            <Title headingLevel="h4" size="md" style={{ color: typeInfo.color }}>
                              {typeInfo.name}
                            </Title>
                            <Label isCompact>{typeSources.length}</Label>
                          </Flex>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {typeSources.map((source) => (
                              <Flex 
                                key={source.id} 
                                alignItems={{ default: 'alignItemsCenter' }}
                                style={{
                                  padding: '8px 12px',
                                  background: 'var(--pf-v6-global--BackgroundColor--200)',
                                  borderRadius: '4px',
                                  borderLeft: `3px solid ${typeInfo.color}`
                                }}
                              >
                                <FlexItem grow={{ default: 'grow' }}>
                                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                    <span style={{ fontWeight: 500 }}>{source.label}</span>
                                    <a 
                                      href={source.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{ 
                                        color: 'var(--pf-v6-global--Color--200)',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <ExternalLinkAltIcon style={{ fontSize: '0.75rem' }} />
                                      Open
                                    </a>
                                  </Flex>
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--pf-v6-global--Color--200)',
                                    marginTop: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '500px'
                                  }}>
                                    {source.url}
                                  </div>
                                </FlexItem>
                                <FlexItem>
                                  <Button 
                                    variant="plain" 
                                    aria-label="Remove source"
                                    onClick={() => handleRemoveSource(source.id)}
                                  >
                                    <TrashIcon />
                                  </Button>
                                </FlexItem>
                              </Flex>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState variant="xs" style={{ marginTop: '1.5rem' }}>
                    <EmptyStateBody>
                      No sources added yet. Paste URLs above to add Jira projects, Google Drive folders, Slack channels, and more.
                    </EmptyStateBody>
                  </EmptyState>
                )}
              </CardBody>
            </Card>
          </StackItem>

          {/* Sharing Section */}
          <StackItem>
            <Card>
              <CardTitle>
                <Title headingLevel="h2" size="lg">Sharing</Title>
              </CardTitle>
              <CardBody>
                <Content component="p" style={{ marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Control who can access this space. Shared spaces will appear in the Spaces Catalog for others to discover.
                </Content>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div 
                    onClick={() => setSharingMode('private')}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${sharingMode === 'private' ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--BorderColor--100)'}`,
                      background: sharingMode === 'private' ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                      <LockIcon style={{ fontSize: '1.5rem', color: sharingMode === 'private' ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--Color--200)' }} />
                      <FlexItem grow={{ default: 'grow' }}>
                        <div style={{ fontWeight: 600 }}>Private</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                          Only you can access this space
                        </div>
                      </FlexItem>
                      {sharingMode === 'private' && (
                        <CheckCircleIcon style={{ color: 'var(--pf-v6-global--primary-color--100)' }} />
                      )}
                    </Flex>
                  </div>
                  
                  <div 
                    onClick={() => setSharingMode('shared')}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${sharingMode === 'shared' ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--BorderColor--100)'}`,
                      background: sharingMode === 'shared' ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                      <UsersIcon style={{ fontSize: '1.5rem', color: sharingMode === 'shared' ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--Color--200)' }} />
                      <FlexItem grow={{ default: 'grow' }}>
                        <div style={{ fontWeight: 600 }}>Shared with specific people</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                          Invite others by email to access this space
                        </div>
                      </FlexItem>
                      {sharingMode === 'shared' && (
                        <CheckCircleIcon style={{ color: 'var(--pf-v6-global--primary-color--100)' }} />
                      )}
                    </Flex>
                  </div>
                  
                  <div 
                    onClick={() => setSharingMode('public')}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${sharingMode === 'public' ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--BorderColor--100)'}`,
                      background: sharingMode === 'public' ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                      <GlobeIcon style={{ fontSize: '1.5rem', color: sharingMode === 'public' ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--Color--200)' }} />
                      <FlexItem grow={{ default: 'grow' }}>
                        <div style={{ fontWeight: 600 }}>Public</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                          Anyone can discover and join this space from the Spaces Catalog
                        </div>
                      </FlexItem>
                      {sharingMode === 'public' && (
                        <CheckCircleIcon style={{ color: 'var(--pf-v6-global--primary-color--100)' }} />
                      )}
                    </Flex>
                  </div>
                </div>
                
                {/* Email input for shared mode */}
                {sharingMode === 'shared' && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <Divider style={{ marginBottom: '1rem' }} />
                    <Title headingLevel="h4" size="md" style={{ marginBottom: '0.5rem' }}>
                      Invite people
                    </Title>
                    <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                      <FlexItem grow={{ default: 'grow' }}>
                        <TextInput
                          id="new-email"
                          value={newEmail}
                          onChange={(event, value) => {
                            setNewEmail(value);
                            setEmailError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEmail();
                            }
                          }}
                          placeholder="Enter email address"
                          validated={emailError ? 'error' : 'default'}
                          type="email"
                        />
                        {emailError && (
                          <HelperText>
                            <HelperTextItem variant="error">{emailError}</HelperTextItem>
                          </HelperText>
                        )}
                      </FlexItem>
                      <FlexItem>
                        <Button 
                          variant="secondary" 
                          onClick={handleAddEmail}
                          isDisabled={!newEmail.trim()}
                        >
                          Add
                        </Button>
                      </FlexItem>
                    </Flex>
                    
                    {sharedEmails.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <LabelGroup>
                          {sharedEmails.map((email) => (
                            <Label
                              key={email}
                              onClose={() => handleRemoveEmail(email)}
                              closeBtnAriaLabel={`Remove ${email}`}
                            >
                              {email}
                            </Label>
                          ))}
                        </LabelGroup>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </StackItem>

          {/* Save Actions */}
          <StackItem>
            <Flex justifyContent={{ default: 'justifyContentFlexEnd' }} gap={{ default: 'gapMd' }}>
              <Button variant="link" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                isDisabled={!name.trim() || saving}
                isLoading={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Flex>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default SpaceSettings;
