import React from 'react';
import {
  Title,
  Button,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Grid,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem
} from '@patternfly/react-core';
import {
  PlusCircleIcon,
  StarIcon,
  UserIcon
} from '@patternfly/react-icons';
import { Flex, FlexItem } from '@patternfly/react-core';
import ContactCard from './ContactCard';
import ContactModal from './ContactModal';
import DeleteContactModal from './DeleteContactModal';

const PeopleTab = ({
  people,
  peopleLoading,
  peopleError,
  searchQuery,
  setSearchQuery,
  filterFavorites,
  setFilterFavorites,
  sortedPeople,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onToggleFavorite,
  isModalOpen,
  isEditMode,
  formData,
  handleFormChange,
  onSavePerson,
  onCloseModal,
  isDeleteModalOpen,
  personToDelete,
  onConfirmDelete,
  onCloseDeleteModal,
  fetchPeople,
  getTagColor,
  formatDate
}) => {
  return (
    <div>
      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '1.5rem' }}>
        <FlexItem>
          <Title headingLevel="h2" size="xl">
            People
          </Title>
        </FlexItem>
        <FlexItem>
          <Button variant="primary" icon={<PlusCircleIcon />} onClick={onAddContact}>
            Add Contact
          </Button>
        </FlexItem>
      </Flex>

      <Toolbar style={{ marginBottom: '1rem' }}>
        <ToolbarContent>
          <ToolbarItem style={{ flex: 1 }}>
            <SearchInput
              placeholder="Search by name, role, company, or tags..."
              value={searchQuery}
              onChange={(_event, value) => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
            />
          </ToolbarItem>
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
        </ToolbarContent>
      </Toolbar>

      {peopleLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size="lg" />
        </div>
      )}

      {peopleError && (
        <EmptyState>
          <EmptyStateBody>
            {peopleError}
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={fetchPeople}>Retry</Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      )}

      {!peopleLoading && !peopleError && sortedPeople.length === 0 && (
        <EmptyState>
          <UserIcon style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)' }} />
          <Title headingLevel="h4" size="lg">
            {searchQuery || filterFavorites ? 'No matching contacts' : 'No contacts yet'}
          </Title>
          <EmptyStateBody>
            {searchQuery || filterFavorites 
              ? 'Try adjusting your search or filter criteria.'
              : 'Add people you work with to keep track of your professional relationships.'
            }
          </EmptyStateBody>
          {!searchQuery && !filterFavorites && (
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" icon={<PlusCircleIcon />} onClick={onAddContact}>
                  Add Your First Contact
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          )}
        </EmptyState>
      )}

      {!peopleLoading && !peopleError && sortedPeople.length > 0 && (
        <Grid hasGutter>
          {sortedPeople.map(person => (
            <ContactCard
              key={person.id}
              person={person}
              onToggleFavorite={onToggleFavorite}
              onEdit={onEditContact}
              onDelete={onDeleteContact}
              getTagColor={getTagColor}
              formatDate={formatDate}
            />
          ))}
        </Grid>
      )}

      <ContactModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSave={onSavePerson}
        isEditMode={isEditMode}
        formData={formData}
        handleFormChange={handleFormChange}
      />

      <DeleteContactModal
        isOpen={isDeleteModalOpen}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        personToDelete={personToDelete}
      />
    </div>
  );
};

export default PeopleTab;
