import React from 'react';
import {
  Button,
  Label,
  LabelGroup,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td
} from '@patternfly/react-table';
import {
  StarIcon,
  OutlinedStarIcon,
  PencilAltIcon,
  TrashIcon,
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

const PersonTableView = ({
  people,
  myPerson,
  onMyCardClick,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
  getDisplayName
}) => {
  const hasMyCardContent = myPerson && (myPerson.name?.first || myPerson.name?.last || myPerson.nickname);

  return (
    <Table aria-label="People table" variant="compact">
      <Thead>
        <Tr>
          <Th width={5}></Th>
          <Th width={25}>Name</Th>
          <Th width={15}>Role</Th>
          <Th width={12}>Company</Th>
          <Th width={13}>Location</Th>
          <Th width={15}>Tags</Th>
          <Th width={15}>Actions</Th>
        </Tr>
      </Thead>
      <Tbody>
        {/* My Card - always first row */}
        {hasMyCardContent && (
          <Tr
            key="_my-card"
            isClickable
            onRowClick={() => onMyCardClick()}
            style={{
              cursor: 'pointer',
              borderLeft: '3px solid var(--pf-v6-global--primary-color--100)',
              background: 'var(--pf-v6-global--BackgroundColor--200)'
            }}
          >
            <Td>
              <Label color="blue" isCompact icon={<UserIcon />}>You</Label>
            </Td>
            <Td>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  {myPerson.avatar ? (
                    <img
                      src={myPerson.avatar}
                      alt={getDisplayName(myPerson)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--pf-v6-global--primary-color--100)'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'var(--pf-v6-global--primary-color--100)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#fff'
                      }}
                    >
                      {getInitials(myPerson)}
                    </div>
                  )}
                </FlexItem>
                <FlexItem>
                  <div style={{ fontWeight: 600 }}>
                    {getDisplayName(myPerson)}
                  </div>
                  {myPerson.email && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      {myPerson.email}
                    </div>
                  )}
                </FlexItem>
              </Flex>
            </Td>
            <Td>{myPerson.role || '—'}</Td>
            <Td>{myPerson.company || '—'}</Td>
            <Td>
              {myPerson.location || '—'}
              {myPerson.timezone && (
                <div style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  {myPerson.timezone}
                </div>
              )}
            </Td>
            <Td>—</Td>
            <Td>
              <Button
                variant="secondary"
                size="sm"
                icon={<PencilAltIcon />}
                onClick={(e) => { e.stopPropagation(); onMyCardClick(); }}
              >
                Edit
              </Button>
            </Td>
          </Tr>
        )}
        {people.map(person => (
          <Tr
            key={person.username}
            isClickable
            onRowClick={() => onView(person)}
            style={{ cursor: 'pointer' }}
          >
            <Td>
              <Button
                variant="plain"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(person); }}
                aria-label={person.favorite ? 'Remove from favorites' : 'Add to favorites'}
                style={{ padding: '0.125rem' }}
              >
                {person.favorite ? (
                  <StarIcon style={{ color: 'var(--pf-v6-global--warning-color--100)' }} />
                ) : (
                  <OutlinedStarIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                )}
              </Button>
            </Td>
            <Td>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  {person.avatar ? (
                    <img
                      src={person.avatar}
                      alt={getDisplayName(person)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: getAvatarColor(person),
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#fff'
                      }}
                    >
                      {getInitials(person)}
                    </div>
                  )}
                </FlexItem>
                <FlexItem>
                  <div style={{ fontWeight: 500 }}>
                    {getDisplayName(person)}
                  </div>
                  {person.email && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      {person.email}
                    </div>
                  )}
                </FlexItem>
              </Flex>
            </Td>
            <Td>{person.role || '—'}</Td>
            <Td>{person.company || '—'}</Td>
            <Td>
              {person.location || '—'}
              {person.timezone && (
                <div style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  {person.timezone}
                </div>
              )}
            </Td>
            <Td>
              {person.tags && person.tags.length > 0 ? (
                <LabelGroup numLabels={2} isCompact>
                  {person.tags.map((tag, idx) => (
                    <Label key={idx} color={getTagColor(tag)} isCompact>{tag}</Label>
                  ))}
                </LabelGroup>
              ) : '—'}
            </Td>
            <Td>
              <Flex gap={{ default: 'gapSm' }}>
                <FlexItem>
                  <Button
                    variant="plain"
                    size="sm"
                    icon={<PencilAltIcon />}
                    onClick={(e) => { e.stopPropagation(); onEdit(person); }}
                    aria-label="Edit person"
                  />
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="plain"
                    size="sm"
                    isDanger
                    icon={<TrashIcon />}
                    onClick={(e) => { e.stopPropagation(); onDelete(person); }}
                    aria-label="Delete person"
                  />
                </FlexItem>
              </Flex>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default PersonTableView;
