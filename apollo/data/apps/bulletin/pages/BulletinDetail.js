import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Label,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  Split,
  SplitItem,
  Divider
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  TagIcon,
  UserIcon,
  CalendarAltIcon,
  EditIcon,
  ExternalLinkAltIcon
} from '@patternfly/react-icons';

const BulletinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bulletin, setBulletin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current user (in a real app, this would come from auth context)
  const currentUser = { id: 'local-user', name: 'You' };

  useEffect(() => {
    fetchBulletin();
  }, [id]);

  const fetchBulletin = async () => {
    try {
      const response = await fetch(`/api/bulletins/${id}`);
      const data = await response.json();
      if (data.success) {
        setBulletin(data.bulletin);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bulletin:', err);
      setError('Failed to load bulletin');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading bulletin...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error || !bulletin) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <Title headingLevel="h2" size="lg">Bulletin Not Found</Title>
          <EmptyStateBody>{error || 'The requested bulletin could not be found.'}</EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/bulletin')}>
            Back to Bulletin Board
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const isOwner = bulletin.authorId === currentUser.id && bulletin.source === 'local';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Breadcrumb style={{ marginBottom: '1rem' }}>
          <BreadcrumbItem>
            <Button variant="link" isInline onClick={() => navigate('/bulletin')}>
              Bulletin Board
            </Button>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{bulletin.title}</BreadcrumbItem>
        </Breadcrumb>

        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Button 
              variant="plain" 
              onClick={() => navigate('/bulletin')}
              aria-label="Back to bulletin board"
            >
              <ArrowLeftIcon />
            </Button>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="2xl">
              {bulletin.title}
            </Title>
          </FlexItem>
          {isOwner && (
            <FlexItem>
              <Button 
                variant="secondary" 
                icon={<EditIcon />}
                onClick={() => navigate('/bulletin')}
              >
                Edit
              </Button>
            </FlexItem>
          )}
        </Flex>

        {/* Metadata */}
        <Flex 
          spaceItems={{ default: 'spaceItemsLg' }} 
          alignItems={{ default: 'alignItemsCenter' }}
          style={{ marginTop: '1rem' }}
        >
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
              <UserIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
              <Content component="small">{bulletin.author}</Content>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
              <CalendarAltIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
              <Content component="small">{formatDate(bulletin.created)}</Content>
            </Flex>
          </FlexItem>
          {bulletin.source !== 'local' && (
            <FlexItem>
              <Label color="purple">{bulletin.source}</Label>
            </FlexItem>
          )}
        </Flex>

        {/* Tags */}
        {bulletin.tags && bulletin.tags.length > 0 && (
          <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ marginTop: '0.75rem' }}>
            {bulletin.tags.map((tag, idx) => (
              <FlexItem key={idx}>
                <Label color="blue" icon={<TagIcon />}>
                  {tag}
                </Label>
              </FlexItem>
            ))}
          </Flex>
        )}
      </PageSection>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <Split hasGutter>
          {/* Description Card */}
          <SplitItem isFilled>
            {bulletin.description && (
              <Card style={{ marginBottom: '1.5rem' }}>
                <CardBody>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: '0.75rem' }}>
                    Description
                  </Title>
                  <Content>
                    {bulletin.description}
                  </Content>
                </CardBody>
              </Card>
            )}

            {/* HTML Content */}
            {bulletin.hasContent || bulletin.htmlContent ? (
              <Card>
                <CardBody>
                  <Flex 
                    justifyContent={{ default: 'justifyContentSpaceBetween' }} 
                    alignItems={{ default: 'alignItemsCenter' }}
                    style={{ marginBottom: '1rem' }}
                  >
                    <FlexItem>
                      <Title headingLevel="h3" size="md">
                        Content
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="link"
                        icon={<ExternalLinkAltIcon />}
                        component="a"
                        href={`/api/bulletins/${bulletin.id}/content`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in new tab
                      </Button>
                    </FlexItem>
                  </Flex>

                  <div
                    style={{
                      background: bulletin.backgroundColor || '#fff9c4',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--pf-v6-global--BorderColor--100)'
                    }}
                  >
                    <iframe
                      src={`/api/bulletins/${bulletin.id}/content`}
                      style={{
                        width: '100%',
                        height: '500px',
                        border: 'none',
                        display: 'block'
                      }}
                      title={`Content for ${bulletin.title}`}
                    />
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card 
                style={{ 
                  background: bulletin.backgroundColor || '#fff9c4',
                  minHeight: '200px'
                }}
              >
                <CardBody>
                  <EmptyState variant="sm">
                    <EmptyStateBody>
                      This bulletin has no additional content.
                    </EmptyStateBody>
                  </EmptyState>
                </CardBody>
              </Card>
            )}
          </SplitItem>

          {/* Sidebar Info */}
          <SplitItem style={{ width: '280px', flexShrink: 0 }}>
            <Card>
              <CardBody>
                <Title headingLevel="h4" size="sm" style={{ marginBottom: '1rem' }}>
                  Details
                </Title>

                <dl style={{ margin: 0 }}>
                  <dt style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Author</dt>
                  <dd style={{ marginBottom: '1rem', marginLeft: 0 }}>
                    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <UserIcon />
                      <span>{bulletin.author}</span>
                    </Flex>
                  </dd>

                  <dt style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Created</dt>
                  <dd style={{ marginBottom: '1rem', marginLeft: 0 }}>
                    {formatDate(bulletin.created)}
                  </dd>

                  {bulletin.modified && bulletin.modified !== bulletin.created && (
                    <>
                      <dt style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Modified</dt>
                      <dd style={{ marginBottom: '1rem', marginLeft: 0 }}>
                        {formatDate(bulletin.modified)}
                      </dd>
                    </>
                  )}

                  <dt style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Source</dt>
                  <dd style={{ marginBottom: '1rem', marginLeft: 0 }}>
                    <Label color={bulletin.source === 'local' ? 'green' : 'purple'}>
                      {bulletin.source === 'local' ? 'Local' : bulletin.source}
                    </Label>
                  </dd>

                  {bulletin.backgroundColor && (
                    <>
                      <dt style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Color</dt>
                      <dd style={{ marginBottom: '1rem', marginLeft: 0 }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            background: bulletin.backgroundColor,
                            borderRadius: '4px',
                            border: '1px solid var(--pf-v6-global--BorderColor--100)'
                          }}
                        />
                      </dd>
                    </>
                  )}
                </dl>

                <Divider style={{ margin: '1rem 0' }} />

                <Button
                  variant="secondary"
                  isBlock
                  onClick={() => navigate('/bulletin')}
                >
                  Back to Board
                </Button>
              </CardBody>
            </Card>
          </SplitItem>
        </Split>
      </div>
    </div>
  );
};

export default BulletinDetail;
