import React from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Tooltip
} from '@patternfly/react-core';
import { UserIcon, UsersIcon, BuildingIcon } from '@patternfly/react-icons';

const ProfileSelector = ({ isCollapsed, selectedProfile, onProfileChange }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);

  // Profile options config
  const profileOptions = [
    { id: 'public', name: 'Public', icon: <UsersIcon /> },
    { id: 'personal', name: 'Personal', icon: <UserIcon /> },
    { id: 'enterprise', name: 'Enterprise', icon: <BuildingIcon /> }
  ];
  
  const selectedProfileData = profileOptions.find(p => p.id === selectedProfile) || profileOptions[1];

  if (isCollapsed) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isProfileDropdownOpen}
      onOpenChange={(isOpen) => setIsProfileDropdownOpen(isOpen)}
      toggle={(toggleRef) => (
        <Tooltip content={`Profile: ${selectedProfileData.name}`} position="bottom">
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            isExpanded={isProfileDropdownOpen}
            variant="plain"
            style={{
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            aria-label="Select profile"
          >
            {selectedProfileData.icon}
          </MenuToggle>
        </Tooltip>
      )}
      popperProps={{ position: 'right', width: '160px' }}
    >
      <DropdownList>
        {profileOptions.map((profile) => (
          <DropdownItem
            key={profile.id}
            onClick={() => {
              onProfileChange(profile.id);
              setIsProfileDropdownOpen(false);
            }}
            isSelected={profile.id === selectedProfile}
            icon={profile.icon}
          >
            {profile.name}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};

export default ProfileSelector;
