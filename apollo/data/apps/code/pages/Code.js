import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Card,
  CardBody,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Label,
  Badge,
  Grid,
  GridItem,
  Button,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput
} from '@patternfly/react-core';
import {
  CodeIcon,
  PlusCircleIcon,
  CalendarAltIcon,
  FolderIcon,
  FileCodeIcon,
  HomeIcon
} from '@patternfly/react-icons';

const Code = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/code');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching code projects:', err);
      setError('Failed to load code projects');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleProjectClick = (project) => {
    navigate(`/code/${project.id}`);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName })
      });
      const data = await response.json();
      
      if (data.success) {
        setProjects([data.project, ...projects]);
        setIsCreateModalOpen(false);
        setNewProjectName('');
        navigate(`/code/${data.project.id}`);
      } else {
        alert(data.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Failed to create project');
    }
    setCreating(false);
  };

  // Language color mapping for visual variety
  const getLanguageColor = (language) => {
    const colors = {
      javascript: 'gold',
      typescript: 'blue',
      python: 'green',
      rust: 'orange',
      go: 'cyan',
      java: 'red',
      html: 'orange',
      css: 'purple',
      default: 'grey'
    };
    return colors[language?.toLowerCase()] || colors.default;
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading code projects...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <CodeIcon size="xl" />
          <Title headingLevel="h2" size="lg">Error Loading Projects</Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="2xl">
              Code
            </Title>
            <Content style={{ marginTop: '0.5rem' }}>
              Code projects with an integrated development environment
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Badge isRead>{projects.length} projects</Badge>
              </FlexItem>
              <FlexItem>
                <Button 
                  variant="primary" 
                  icon={<PlusCircleIcon />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  New Project
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {projects.length === 0 ? (
          <EmptyState variant="lg">
            <CodeIcon size="xl" />
            <Title headingLevel="h2" size="lg">No Code Projects Found</Title>
            <EmptyStateBody>
              Create your first code project to get started. Projects are stored in the data/code folder.
            </EmptyStateBody>
            <Button 
              variant="primary" 
              icon={<PlusCircleIcon />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Project
            </Button>
          </EmptyState>
        ) : (
          <Grid hasGutter>
            {projects.map((project) => (
              <GridItem key={project.id} span={12} md={6} lg={4}>
                <Card
                  isClickable
                  isSelectable
                  onClick={() => handleProjectClick(project)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--pf-v6-global--BorderColor--100)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Project Preview */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '50%',
                      background: project.builtIn
                        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                        : 'linear-gradient(135deg, #1e1e1e 0%, #252526 50%, #1e1e1e 100%)',
                      borderRadius: '4px 4px 0 0',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Code-like background pattern */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        right: '16px',
                        bottom: '16px',
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        fontSize: '10px',
                        lineHeight: '1.6',
                        color: project.builtIn ? 'rgba(100, 180, 255, 0.3)' : 'rgba(150, 150, 150, 0.4)',
                        overflow: 'hidden',
                        whiteSpace: 'pre'
                      }}
                    >
{project.builtIn ? `// Apollo — Integrated Design Environment
import { App } from './src/App';
import { server } from './server';

const apollo = {
  name: "${project.name}",
  local: true
};` : `const project = {
  name: "${project.name}",
  files: ${project.fileCount || 0}
};

export default project;`}
                    </div>
                    
                    {/* Icon overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '12px',
                          backgroundColor: project.builtIn
                            ? 'rgba(230, 150, 0, 0.9)'
                            : 'rgba(0, 122, 204, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: project.builtIn
                            ? '0 4px 12px rgba(230, 150, 0, 0.3)'
                            : '0 4px 12px rgba(0, 122, 204, 0.3)'
                        }}
                      >
                        {project.builtIn ? (
                          <HomeIcon style={{ 
                            fontSize: '24px', 
                            color: 'white'
                          }} />
                        ) : (
                          <CodeIcon style={{ 
                            fontSize: '24px', 
                            color: 'white'
                          }} />
                        )}
                      </div>
                    </div>
                    
                    {/* Built-in badge (top-left) */}
                    {project.builtIn && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(230, 150, 0, 0.9)',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          letterSpacing: '0.3px'
                        }}
                      >
                        Built-in
                      </div>
                    )}

                    {/* File count badge */}
                    {!project.builtIn && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FileCodeIcon style={{ fontSize: '12px' }} />
                        {project.fileCount || 0} files
                      </div>
                    )}
                  </div>

                  <CardBody>
                    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      {/* Title */}
                      <FlexItem>
                        <h3 style={{
                          margin: 0,
                          marginTop: '4px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {project.name}
                        </h3>
                      </FlexItem>

                      {/* Description */}
                      {project.description && (
                        <FlexItem>
                          <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: 'var(--pf-v6-global--Color--200)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {project.description}
                          </p>
                        </FlexItem>
                      )}

                      {/* Metadata */}
                      <FlexItem>
                        <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                          <FlexItem>
                            <span style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--pf-v6-global--Color--200)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CalendarAltIcon />
                              {formatDate(project.modifiedAt)}
                            </span>
                          </FlexItem>
                        </Flex>
                      </FlexItem>

                      {/* Labels */}
                      <FlexItem>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                          {project.language && (
                            <FlexItem>
                              <Label color={getLanguageColor(project.language)} isCompact>
                                {project.language}
                              </Label>
                            </FlexItem>
                          )}
                          <FlexItem>
                            {project.builtIn ? (
                              <Label color="gold" isCompact>
                                <HomeIcon style={{ marginRight: '4px' }} />
                                Built-in
                              </Label>
                            ) : (
                              <Label color="blue" isCompact>
                                <FolderIcon style={{ marginRight: '4px' }} />
                                Project
                              </Label>
                            )}
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Create New Project"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        actions={[
          <Button 
            key="create" 
            variant="primary" 
            onClick={handleCreateProject}
            isLoading={creating}
            isDisabled={!newProjectName.trim() || creating}
          >
            Create
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
        ]}
      >
        <Form>
          <FormGroup label="Project Name" isRequired fieldId="project-name">
            <TextInput
              isRequired
              id="project-name"
              value={newProjectName}
              onChange={(e, value) => setNewProjectName(value)}
              placeholder="my-awesome-project"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProjectName.trim()) {
                  e.preventDefault();
                  handleCreateProject();
                }
              }}
            />
          </FormGroup>
        </Form>
      </Modal>
    </div>
  );
};

export default Code;
