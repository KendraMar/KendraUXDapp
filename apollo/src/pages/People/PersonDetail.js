import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Button,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Card,
  CardBody,
  CardTitle,
  CardHeader,
  Label,
  LabelGroup,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider,
  TextArea,
  Breadcrumb,
  BreadcrumbItem
} from '@patternfly/react-core';
import {
  PencilAltIcon,
  TrashIcon,
  StarIcon,
  OutlinedStarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapMarkerAltIcon,
  ClockIcon,
  PlusCircleIcon,
  TimesIcon
} from '@patternfly/react-icons';
import PersonModal from './components/PersonModal';
import DeletePersonModal from './components/DeletePersonModal';

const TAG_COLORS = ['blue', 'green', 'orange', 'purple', 'cyan', 'red', 'gold', 'grey'];

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
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

function getInitials(person) {
  const first = (person.name?.first || '').charAt(0);
  const last = (person.name?.last || '').charAt(0);
  return (first + last).toUpperCase() || '?';
}

function getDisplayName(person) {
  const parts = [person.name?.first, person.name?.middle, person.name?.last].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : person.nickname || person.username || 'Unnamed';
}

const PersonDetail = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [notes, setNotes] = useState({ entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Note form state
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Edit/Delete modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchPerson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/people/${username}`);
      const data = await response.json();
      if (data.success) {
        setPerson(data.person);
        setNotes(data.notes || { entries: [] });
      } else {
        setError(data.error || 'Person not found');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  const handleToggleFavorite = async () => {
    if (!person) return;
    try {
      const response = await fetch(`/api/people/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !person.favorite })
      });
      const data = await response.json();
      if (data.success) {
        setPerson(prev => ({ ...prev, favorite: !prev.favorite }));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleSavePerson = async (formData) => {
    try {
      const response = await fetch(`/api/people/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        await fetchPerson();
        setIsEditModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save person:', err);
      return false;
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/people/${username}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        navigate('/people');
      }
    } catch (err) {
      console.error('Failed to delete person:', err);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const updatedNotes = {
        entries: [
          {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            content: newNote.trim()
          },
          ...notes.entries
        ]
      };

      const response = await fetch(`/api/people/${username}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNotes)
      });
      const data = await response.json();
      if (data.success) {
        setNotes(updatedNotes);
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const updatedNotes = {
        entries: notes.entries.filter(n => n.id !== noteId)
      };

      const response = await fetch(`/api/people/${username}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNotes)
      });
      const data = await response.json();
      if (data.success) {
        setNotes(updatedNotes);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  if (loading) {
    return (
      <PageSection>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size="lg" />
        </div>
      </PageSection>
    );
  }

  if (error || !person) {
    return (
      <PageSection>
        <EmptyState>
          <Title headingLevel="h4" size="lg">Person not found</Title>
          <EmptyStateBody>{error || 'This person does not exist.'}</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={() => navigate('/people')}>
                Back to People
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="light">
        <Breadcrumb style={{ marginBottom: '1rem' }}>
          <BreadcrumbItem to="/people" onClick={(e) => { e.preventDefault(); navigate('/people'); }}>
            People
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{getDisplayName(person)}</BreadcrumbItem>
        </Breadcrumb>

        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapLg' }}>
              <FlexItem>
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={getDisplayName(person)}
                    style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '72px', height: '72px', backgroundColor: getAvatarColor(person),
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 600, color: '#fff'
                    }}
                  >
                    {getInitials(person)}
                  </div>
                )}
              </FlexItem>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    <Title headingLevel="h1" size="2xl">{getDisplayName(person)}</Title>
                  </FlexItem>
                  {person.nickname && (
                    <FlexItem>
                      <span style={{ fontSize: '1.25rem', color: 'var(--pf-v6-global--Color--200)' }}>"{person.nickname}"</span>
                    </FlexItem>
                  )}
                </Flex>
                <div style={{ fontSize: '1rem', color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  {person.role}{person.company && ` · ${person.company}`}
                </div>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Button variant="plain" onClick={handleToggleFavorite} aria-label={person.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                  {person.favorite ? (
                    <StarIcon style={{ color: 'var(--pf-v6-global--warning-color--100)', fontSize: '1.25rem' }} />
                  ) : (
                    <OutlinedStarIcon style={{ fontSize: '1.25rem' }} />
                  )}
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="secondary" icon={<PencilAltIcon />} onClick={() => setIsEditModalOpen(true)}>Edit</Button>
              </FlexItem>
              <FlexItem>
                <Button variant="danger" icon={<TrashIcon />} onClick={() => setIsDeleteModalOpen(true)}>Delete</Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection isFilled padding={{ default: 'padding' }}>
        <Flex direction={{ default: 'column', lg: 'row' }} gap={{ default: 'gapLg' }}>
          {/* Left column: Person details */}
          <FlexItem style={{ flex: 2 }}>
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardBody>
                <DescriptionList isHorizontal horizontalTermWidthModifier={{ default: '15ch' }}>
                  {person.email && (
                    <DescriptionListGroup>
                      <DescriptionListTerm><Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}><FlexItem><EnvelopeIcon /></FlexItem><FlexItem>Email</FlexItem></Flex></DescriptionListTerm>
                      <DescriptionListDescription><a href={`mailto:${person.email}`}>{person.email}</a></DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {person.phone && (
                    <DescriptionListGroup>
                      <DescriptionListTerm><Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}><FlexItem><PhoneIcon /></FlexItem><FlexItem>Phone</FlexItem></Flex></DescriptionListTerm>
                      <DescriptionListDescription>{person.phone}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {person.location && (
                    <DescriptionListGroup>
                      <DescriptionListTerm><Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}><FlexItem><MapMarkerAltIcon /></FlexItem><FlexItem>Location</FlexItem></Flex></DescriptionListTerm>
                      <DescriptionListDescription>{person.location}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {person.timezone && (
                    <DescriptionListGroup>
                      <DescriptionListTerm><Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}><FlexItem><ClockIcon /></FlexItem><FlexItem>Timezone</FlexItem></Flex></DescriptionListTerm>
                      <DescriptionListDescription>{person.timezone}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>

            {person.bio && (
              <Card style={{ marginTop: '1rem' }}>
                <CardHeader><CardTitle>Biography</CardTitle></CardHeader>
                <CardBody><p style={{ whiteSpace: 'pre-wrap' }}>{person.bio}</p></CardBody>
              </Card>
            )}

            {((person.skills && person.skills.length > 0) || (person.interests && person.interests.length > 0)) && (
              <Card style={{ marginTop: '1rem' }}>
                <CardHeader><CardTitle>Skills & Interests</CardTitle></CardHeader>
                <CardBody>
                  {person.skills && person.skills.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Skills</div>
                      <LabelGroup>{person.skills.map((skill, idx) => (<Label key={idx} color="blue">{skill}</Label>))}</LabelGroup>
                    </div>
                  )}
                  {person.interests && person.interests.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Interests</div>
                      <LabelGroup>{person.interests.map((interest, idx) => (<Label key={idx} color="green">{interest}</Label>))}</LabelGroup>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {person.projects && person.projects.length > 0 && (
              <Card style={{ marginTop: '1rem' }}>
                <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
                <CardBody>
                  {person.projects.map((project, idx) => (
                    <div key={idx} style={{ marginBottom: idx < person.projects.length - 1 ? '0.75rem' : 0 }}>
                      <div style={{ fontWeight: 500 }}>{project.name}</div>
                      {project.role && (<div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>{project.role}</div>)}
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}

            {person.integrations && Object.values(person.integrations).some(Boolean) && (
              <Card style={{ marginTop: '1rem' }}>
                <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
                <CardBody>
                  <DescriptionList isHorizontal horizontalTermWidthModifier={{ default: '10ch' }}>
                    {person.integrations.slack && (<DescriptionListGroup><DescriptionListTerm>Slack</DescriptionListTerm><DescriptionListDescription>{person.integrations.slack}</DescriptionListDescription></DescriptionListGroup>)}
                    {person.integrations.gitlab && (<DescriptionListGroup><DescriptionListTerm>GitLab</DescriptionListTerm><DescriptionListDescription>{person.integrations.gitlab}</DescriptionListDescription></DescriptionListGroup>)}
                    {person.integrations.jira && (<DescriptionListGroup><DescriptionListTerm>Jira</DescriptionListTerm><DescriptionListDescription>{person.integrations.jira}</DescriptionListDescription></DescriptionListGroup>)}
                    {person.integrations.github && (<DescriptionListGroup><DescriptionListTerm>GitHub</DescriptionListTerm><DescriptionListDescription>{person.integrations.github}</DescriptionListDescription></DescriptionListGroup>)}
                  </DescriptionList>
                </CardBody>
              </Card>
            )}

            {person.tags && person.tags.length > 0 && (
              <Card style={{ marginTop: '1rem' }}>
                <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                <CardBody>
                  <LabelGroup>{person.tags.map((tag, idx) => (<Label key={idx} color={getTagColor(tag)}>{tag}</Label>))}</LabelGroup>
                </CardBody>
              </Card>
            )}
          </FlexItem>

          {/* Right column: Private Notes */}
          <FlexItem style={{ flex: 1, minWidth: '300px' }}>
            <Card>
              <CardHeader><CardTitle>Private Notes</CardTitle></CardHeader>
              <CardBody>
                <p style={{ fontSize: '0.8125rem', color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }}>
                  These notes are private to you and never shared with anyone.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <TextArea
                    value={newNote}
                    onChange={(_event, value) => setNewNote(value)}
                    placeholder="Add a private note..."
                    rows={3}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <Button variant="secondary" size="sm" icon={<PlusCircleIcon />} onClick={handleAddNote} isLoading={savingNote} isDisabled={!newNote.trim()}>
                    Add Note
                  </Button>
                </div>

                <Divider style={{ marginBottom: '1rem' }} />

                {notes.entries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    No notes yet. Add your first private note above.
                  </div>
                ) : (
                  notes.entries.map((note, idx) => (
                    <div
                      key={note.id || idx}
                      style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)', borderRadius: '6px' }}
                    >
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                        <FlexItem style={{ flex: 1 }}>
                          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{note.content}</p>
                          <div style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                            {note.date ? new Date(note.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
                          </div>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="plain" size="sm" icon={<TimesIcon />} onClick={() => handleDeleteNote(note.id)} aria-label="Delete note" style={{ padding: '0.125rem' }} />
                        </FlexItem>
                      </Flex>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </PageSection>

      <PersonModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSavePerson} isEditMode={true} person={person} />
      <DeletePersonModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} person={person} getDisplayName={getDisplayName} />
    </>
  );
};

export default PersonDetail;
