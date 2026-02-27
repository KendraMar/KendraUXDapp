import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Badge,
  Select,
  SelectOption,
  MenuToggle,
  SelectList,
  Divider,
  Alert
} from '@patternfly/react-core';
import {
  ThIcon,
  ListIcon,
  PlusCircleIcon,
  StarIcon,
  UserIcon,
  AddressBookIcon
} from '@patternfly/react-icons';
import PersonCardView from './components/PersonCardView';
import PersonTableView from './components/PersonTableView';
import PersonModal from './components/PersonModal';
import DeletePersonModal from './components/DeletePersonModal';
import MyCard from './components/MyCard';

const People = () => {
  const navigate = useNavigate();

  // View mode persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('people-view-mode');
    return saved === 'table' ? 'table' : 'card';
  });

  // Data state
  const [people, setPeople] = useState([]);
  const [myPerson, setMyPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isMyCardOpen, setIsMyCardOpen] = useState(false);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('people-view-mode', viewMode);
  }, [viewMode]);

  // Fetch people and my card
  const fetchPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [peopleRes, meRes] = await Promise.all([
        fetch('/api/people'),
        fetch('/api/people/me')
      ]);
      const peopleData = await peopleRes.json();
      const meData = await meRes.json();

      if (peopleData.success) {
        setPeople(peopleData.people || []);
      } else {
        setError(peopleData.error || 'Failed to load people');
      }

      if (meData.success && meData.person) {
        setMyPerson(meData.person);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  // Collect all unique tags for filter dropdown
  const allTags = useMemo(() => {
    const tagSet = new Set();
    people.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [people]);

  // Filter and sort people
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fullName = `${person.name?.first || ''} ${person.name?.middle || ''} ${person.name?.last || ''}`.toLowerCase();
        const nickname = (person.nickname || '').toLowerCase();
        const role = (person.role || '').toLowerCase();
        const company = (person.company || '').toLowerCase();
        const email = (person.email || '').toLowerCase();
        const skills = (person.skills || []).join(' ').toLowerCase();
        const tags = (person.tags || []).join(' ').toLowerCase();

        if (!fullName.includes(q) && !nickname.includes(q) && !role.includes(q)
          && !company.includes(q) && !email.includes(q) && !skills.includes(q)
          && !tags.includes(q)) {
          return false;
        }
      }

      // Favorites filter
      if (filterFavorites && !person.favorite) return false;

      // Tag filter
      if (filterTag && !(person.tags || []).includes(filterTag)) return false;

      return true;
    });
  }, [people, searchQuery, filterFavorites, filterTag]);

  // Sort: favorites first, then by name
  const sortedPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      const nameA = `${a.name?.first || ''} ${a.name?.last || ''}`.trim();
      const nameB = `${b.name?.first || ''} ${b.name?.last || ''}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [filteredPeople]);

  // CRUD handlers
  const handleCreatePerson = () => {
    setSelectedPerson(null);
    setIsCreateModalOpen(true);
  };

  const handleEditPerson = (person) => {
    setSelectedPerson(person);
    setIsEditModalOpen(true);
  };

  const handleDeletePerson = (person) => {
    setSelectedPerson(person);
    setIsDeleteModalOpen(true);
  };

  const handleViewPerson = (person) => {
    navigate(`/people/${person.username}`);
  };

  const handleToggleFavorite = async (person) => {
    try {
      const response = await fetch(`/api/people/${person.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !person.favorite })
      });
      const data = await response.json();
      if (data.success) {
        await fetchPeople();
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleSavePerson = async (formData, isEdit) => {
    try {
      // Extract avatar file before sending JSON
      const avatarFile = formData._avatarFile;
      const { _avatarFile, ...personData } = formData;

      let response;
      if (isEdit && selectedPerson) {
        response = await fetch(`/api/people/${selectedPerson.username}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personData)
        });
      } else {
        response = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personData)
        });
      }

      const data = await response.json();
      if (data.success) {
        // Upload avatar file if one was selected
        if (avatarFile && data.person?.username) {
          const uploadFormData = new FormData();
          uploadFormData.append('avatar', avatarFile);
          try {
            await fetch(`/api/people/${data.person.username}/avatar`, {
              method: 'POST',
              body: uploadFormData
            });
          } catch (err) {
            console.error('Failed to upload avatar:', err);
          }
        }

        await fetchPeople();
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedPerson(null);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Failed to save person:', err);
      return false;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPerson) return;
    try {
      const response = await fetch(`/api/people/${selectedPerson.username}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await fetchPeople();
      }
    } catch (err) {
      console.error('Failed to delete person:', err);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedPerson(null);
    }
  };

  const getDisplayName = (person) => {
    const parts = [person.name?.first, person.name?.middle, person.name?.last].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : person.nickname || person.username || 'Unnamed';
  };

  return (
    <>
      <PageSection variant="light">
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  People
                </Title>
              </FlexItem>
              {!loading && (
                <FlexItem>
                  <Badge isRead>{people.length}</Badge>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Button variant="secondary" icon={<AddressBookIcon />} onClick={() => setIsMyCardOpen(true)}>
                  My Card
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="primary" icon={<PlusCircleIcon />} onClick={handleCreatePerson}>
                  Add Person
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection isFilled padding={{ default: 'padding' }}>
        <Toolbar style={{ marginBottom: '1rem' }}>
          <ToolbarContent>
            <ToolbarItem style={{ flex: 1 }}>
              <SearchInput
                placeholder="Search by name, role, company, skills, tags..."
                value={searchQuery}
                onChange={(_event, value) => setSearchQuery(value)}
                onClear={() => setSearchQuery('')}
              />
            </ToolbarItem>
            <ToolbarGroup>
              <ToolbarItem>
                <ToggleGroup aria-label="Filter options">
                  <ToggleGroupItem
                    text="All"
                    isSelected={!filterFavorites}
                    onChange={() => setFilterFavorites(false)}
                  />
                  <ToggleGroupItem
                    text="Favorites"
                    icon={<StarIcon />}
                    isSelected={filterFavorites}
                    onChange={() => setFilterFavorites(true)}
                  />
                </ToggleGroup>
              </ToolbarItem>
              {allTags.length > 0 && (
                <ToolbarItem>
                  <Select
                    isOpen={isTagFilterOpen}
                    onOpenChange={setIsTagFilterOpen}
                    selected={filterTag}
                    onSelect={(_event, value) => {
                      setFilterTag(value === filterTag ? '' : value);
                      setIsTagFilterOpen(false);
                    }}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                        isExpanded={isTagFilterOpen}
                        style={{ minWidth: '140px' }}
                      >
                        {filterTag || 'All Tags'}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      <SelectOption value="">All Tags</SelectOption>
                      {allTags.map(tag => (
                        <SelectOption key={tag} value={tag}>{tag}</SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarItem>
              )}
              <ToolbarItem>
                <Divider orientation={{ default: 'vertical' }} />
              </ToolbarItem>
              <ToolbarItem>
                <ToggleGroup aria-label="View mode">
                  <ToggleGroupItem
                    icon={<ThIcon />}
                    aria-label="Card view"
                    isSelected={viewMode === 'card'}
                    onChange={() => setViewMode('card')}
                  />
                  <ToggleGroupItem
                    icon={<ListIcon />}
                    aria-label="Table view"
                    isSelected={viewMode === 'table'}
                    onChange={() => setViewMode('table')}
                  />
                </ToggleGroup>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>

        {error && (
          <Alert variant="danger" title="Error loading people" style={{ marginBottom: '1rem' }}>
            {error}
            <Button variant="link" onClick={fetchPeople} style={{ marginLeft: '0.5rem' }}>Retry</Button>
          </Alert>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size="lg" />
          </div>
        )}

        {!loading && !error && sortedPeople.length === 0 && !myPerson && (
          <EmptyState>
            <UserIcon style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)' }} />
            <Title headingLevel="h4" size="lg">
              {searchQuery || filterFavorites || filterTag ? 'No matching people' : 'No people yet'}
            </Title>
            <EmptyStateBody>
              {searchQuery || filterFavorites || filterTag
                ? 'Try adjusting your search or filter criteria.'
                : 'Add people you work with to build your personal Rolodex.'
              }
            </EmptyStateBody>
            {!searchQuery && !filterFavorites && !filterTag && (
              <EmptyStateFooter>
                <EmptyStateActions>
                  <Button variant="primary" icon={<PlusCircleIcon />} onClick={handleCreatePerson}>
                    Add Your First Person
                  </Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            )}
          </EmptyState>
        )}

        {!loading && !error && (sortedPeople.length > 0 || myPerson) && viewMode === 'card' && (
          <PersonCardView
            people={sortedPeople}
            myPerson={myPerson}
            onMyCardClick={() => setIsMyCardOpen(true)}
            onView={handleViewPerson}
            onEdit={handleEditPerson}
            onDelete={handleDeletePerson}
            onToggleFavorite={handleToggleFavorite}
            getDisplayName={getDisplayName}
          />
        )}

        {!loading && !error && (sortedPeople.length > 0 || myPerson) && viewMode === 'table' && (
          <PersonTableView
            people={sortedPeople}
            myPerson={myPerson}
            onMyCardClick={() => setIsMyCardOpen(true)}
            onView={handleViewPerson}
            onEdit={handleEditPerson}
            onDelete={handleDeletePerson}
            onToggleFavorite={handleToggleFavorite}
            getDisplayName={getDisplayName}
          />
        )}
      </PageSection>

      {/* Create Modal */}
      <PersonModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setSelectedPerson(null); }}
        onSave={(data) => handleSavePerson(data, false)}
        isEditMode={false}
        person={null}
      />

      {/* Edit Modal */}
      <PersonModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedPerson(null); }}
        onSave={(data) => handleSavePerson(data, true)}
        isEditMode={true}
        person={selectedPerson}
      />

      {/* Delete Modal */}
      <DeletePersonModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedPerson(null); }}
        onConfirm={handleConfirmDelete}
        person={selectedPerson}
        getDisplayName={getDisplayName}
      />

      {/* My Card */}
      <MyCard
        isOpen={isMyCardOpen}
        onClose={() => setIsMyCardOpen(false)}
      />
    </>
  );
};

export default People;
