import React from 'react';
import {
  Gallery,
  GalleryItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Label,
  LabelGroup,
  Flex,
  FlexItem,
  Truncate
} from '@patternfly/react-core';
import {
  StarIcon,
  OutlinedStarIcon,
  EnvelopeIcon,
  PencilAltIcon,
  TrashIcon,
  MapMarkerAltIcon,
  UserIcon
} from '@patternfly/react-icons';

const TAG_COLORS = ['blue', 'green', 'orange', 'purple', 'cyan', 'red', 'gold', 'grey'];

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function getInitials(person) {
  const first = (person.name?.first || '').charAt(0);
  const last = (person.name?.last || '').charAt(0);
  return (first + last).toUpperCase() || '?';
}

const AVATAR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
];

function getAvatarColor(person) {
  const name = `${person.name?.first || ''}${person.name?.last || ''}`;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const PersonCardView = ({
  people,
  myPerson,
  onMyCardClick,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
  getDisplayName
}) => {
  const myDisplayName = myPerson ? getDisplayName(myPerson) : '';
  const hasMyCardContent = myPerson && (myPerson.name?.first || myPerson.name?.last || myPerson.nickname);

  return (
    <Gallery hasGutter minWidths={{ default: '320px' }}>
      {/* My Card - always first */}
      {hasMyCardContent && (
        <GalleryItem key="_my-card">
          <Card
            isCompact
            isClickable
            isSelectable
            selectableActions={{
              onClickAction: () => onMyCardClick(),
              selectableActionAriaLabel: 'View your card'
            }}
            style={{
              height: '100%',
              borderLeft: '3px solid var(--pf-v6-global--primary-color--100)',
              background: 'linear-gradient(135deg, var(--pf-v6-global--BackgroundColor--200) 0%, var(--pf-v6-global--BackgroundColor--100) 100%)'
            }}
          >
            <CardHeader>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }} style={{ width: '100%' }}>
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                    <FlexItem>
                      {myPerson.avatar ? (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={myPerson.avatar}
                            alt={myDisplayName}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--pf-v6-global--primary-color--100)'
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: 'var(--pf-v6-global--primary-color--100)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#fff'
                          }}
                        >
                          {getInitials(myPerson)}
                        </div>
                      )}
                    </FlexItem>
                    <FlexItem>
                      <CardTitle style={{ marginBottom: '0.125rem' }}>
                        {myDisplayName}
                        {myPerson.nickname && (
                          <span style={{ fontWeight: 400, fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)', marginLeft: '0.5rem' }}>
                            &ldquo;{myPerson.nickname}&rdquo;
                          </span>
                        )}
                      </CardTitle>
                      <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                        {myPerson.role}{myPerson.company && ` · ${myPerson.company}`}
                      </div>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <Label color="blue" isCompact icon={<UserIcon />}>You</Label>
                </FlexItem>
              </Flex>
            </CardHeader>
            <CardBody>
              {myPerson.location && (
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '0.5rem' }}>
                  <FlexItem>
                    <MapMarkerAltIcon style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }} />
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      {myPerson.location}
                      {myPerson.timezone && ` (${myPerson.timezone})`}
                    </span>
                  </FlexItem>
                </Flex>
              )}

              {myPerson.email && (
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '0.5rem' }}>
                  <FlexItem>
                    <EnvelopeIcon style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }} />
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      <Truncate content={myPerson.email} />
                    </span>
                  </FlexItem>
                </Flex>
              )}

              {myPerson.skills && myPerson.skills.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <LabelGroup numLabels={3} isCompact>
                    {myPerson.skills.map((skill, idx) => (
                      <Label key={idx} color="blue" isCompact>{skill}</Label>
                    ))}
                  </LabelGroup>
                </div>
              )}

              <Flex gap={{ default: 'gapSm' }} style={{ marginTop: 'auto' }}>
                <FlexItem>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<PencilAltIcon />}
                    onClick={(e) => { e.stopPropagation(); onMyCardClick(); }}
                  >
                    Edit My Card
                  </Button>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </GalleryItem>
      )}

      {people.map(person => (
        <GalleryItem key={person.username}>
          <Card
            isCompact
            isClickable
            isSelectable
            selectableActions={{
              onClickAction: () => onView(person),
              selectableActionAriaLabel: `View ${getDisplayName(person)}`
            }}
            style={{ height: '100%' }}
          >
            <CardHeader>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }} style={{ width: '100%' }}>
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                    <FlexItem>
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          alt={getDisplayName(person)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: getAvatarColor(person),
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#fff'
                          }}
                        >
                          {getInitials(person)}
                        </div>
                      )}
                    </FlexItem>
                    <FlexItem>
                      <CardTitle style={{ marginBottom: '0.125rem' }}>
                        {getDisplayName(person)}
                        {person.nickname && (
                          <span style={{ fontWeight: 400, fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)', marginLeft: '0.5rem' }}>
                            "{person.nickname}"
                          </span>
                        )}
                      </CardTitle>
                      <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                        {person.role}{person.company && ` · ${person.company}`}
                      </div>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="plain"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(person); }}
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
              {person.location && (
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '0.5rem' }}>
                  <FlexItem>
                    <MapMarkerAltIcon style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }} />
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      {person.location}
                      {person.timezone && ` (${person.timezone})`}
                    </span>
                  </FlexItem>
                </Flex>
              )}

              {person.email && (
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '0.5rem' }}>
                  <FlexItem>
                    <EnvelopeIcon style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }} />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="link"
                      isInline
                      component="a"
                      href={`mailto:${person.email}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '0.875rem' }}
                    >
                      <Truncate content={person.email} />
                    </Button>
                  </FlexItem>
                </Flex>
              )}

              {person.skills && person.skills.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <LabelGroup numLabels={3} isCompact>
                    {person.skills.map((skill, idx) => (
                      <Label key={idx} color="blue" isCompact>{skill}</Label>
                    ))}
                  </LabelGroup>
                </div>
              )}

              {person.tags && person.tags.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <LabelGroup numLabels={4} isCompact>
                    {person.tags.map((tag, idx) => (
                      <Label key={idx} color={getTagColor(tag)} isCompact>{tag}</Label>
                    ))}
                  </LabelGroup>
                </div>
              )}

              <Flex gap={{ default: 'gapSm' }} style={{ marginTop: 'auto' }}>
                <FlexItem>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<PencilAltIcon />}
                    onClick={(e) => { e.stopPropagation(); onEdit(person); }}
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
                    onClick={(e) => { e.stopPropagation(); onDelete(person); }}
                  >
                    Delete
                  </Button>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </GalleryItem>
      ))}
    </Gallery>
  );
};

export default PersonCardView;
