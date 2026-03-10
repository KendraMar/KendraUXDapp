import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  GridItem,
  Button,
  Label,
  LabelGroup,
  Flex,
  FlexItem,
  Avatar
} from '@patternfly/react-core';
import {
  StarIcon,
  OutlinedStarIcon,
  EnvelopeIcon,
  PencilAltIcon,
  TrashIcon
} from '@patternfly/react-icons';

const ContactCard = ({
  person,
  onToggleFavorite,
  onEdit,
  onDelete,
  getTagColor,
  formatDate
}) => {
  return (
    <GridItem key={person.id} span={12} md={6}>
      <Card isCompact style={{ height: '100%' }}>
        <CardHeader>
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }} style={{ width: '100%' }}>
            <FlexItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                <FlexItem>
                  {person.avatar ? (
                    <Avatar 
                      src={person.avatar} 
                      alt={person.name}
                      style={{ width: '48px', height: '48px' }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        backgroundColor: 'var(--pf-v6-global--palette--blue-200)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem', 
                        fontWeight: 600,
                        color: 'var(--pf-v6-global--palette--blue-500)'
                      }}
                    >
                      {(person.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </FlexItem>
                <FlexItem>
                  <CardTitle style={{ marginBottom: '0.25rem' }}>{person.name}</CardTitle>
                  <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    {person.role}{person.company && ` • ${person.company}`}
                  </div>
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Button
                variant="plain"
                onClick={() => onToggleFavorite(person)}
                aria-label={person.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {person.favorite ? (
                  <StarIcon style={{ color: 'var(--pf-v6-global--warning-color--100)' }} />
                ) : (
                  <OutlinedStarIcon />
                )}
              </Button>
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardBody>
          {person.relationship && (
            <p style={{ 
              marginBottom: '1rem', 
              fontSize: '0.875rem',
              color: 'var(--pf-v6-global--Color--100)'
            }}>
              {person.relationship}
            </p>
          )}

          <Flex gap={{ default: 'gapSm' }} style={{ marginBottom: '1rem' }}>
            {person.email && (
              <FlexItem>
                <Button 
                  variant="link" 
                  isInline 
                  icon={<EnvelopeIcon />}
                  component="a"
                  href={`mailto:${person.email}`}
                  style={{ fontSize: '0.875rem' }}
                >
                  {person.email}
                </Button>
              </FlexItem>
            )}
          </Flex>

          {person.tags && person.tags.length > 0 && (
            <LabelGroup style={{ marginBottom: '1rem' }}>
              {person.tags.map((tag, idx) => (
                <Label key={idx} color={getTagColor(tag)} isCompact>
                  {tag}
                </Label>
              ))}
            </LabelGroup>
          )}

          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--pf-v6-global--Color--200)',
            marginBottom: '0.75rem'
          }}>
            Last contact: {formatDate(person.lastContact)}
          </div>

          <Flex gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<PencilAltIcon />}
                onClick={() => onEdit(person)}
              >
                Edit
              </Button>
            </FlexItem>
            <FlexItem>
              <Button 
                variant="link" 
                isDanger
                size="sm" 
                icon={<TrashIcon />}
                onClick={() => onDelete(person)}
              >
                Delete
              </Button>
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>
    </GridItem>
  );
};

export default ContactCard;
