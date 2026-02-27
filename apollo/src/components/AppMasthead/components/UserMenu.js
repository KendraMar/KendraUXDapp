import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Divider
} from '@patternfly/react-core';

const UserMenu = ({
  isOpen,
  onToggle,
  onSelect,
  onOpenChange
}) => {
  const navigate = useNavigate();
  const [avatarSrc, setAvatarSrc] = useState(null);

  useEffect(() => {
    const loadMyCard = async () => {
      try {
        const res = await fetch('/api/people/me');
        const data = await res.json();
        if (data.success && data.person && data.person.avatar) {
          setAvatarSrc(data.person.avatar);
        }
      } catch {
        // Silently fall back to default
      }
    };
    loadMyCard();
  }, []);

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={onOpenChange}
      popperProps={{ position: 'end' }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggle}
          isExpanded={isOpen}
          variant="plain"
          aria-label="User menu"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          ) : (
            <img
              src="/api/people/me/avatar"
              alt=""
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          )}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem 
          key="profile"
          onClick={() => navigate('/profile')}
        >
          Profile
        </DropdownItem>
        <DropdownItem key="account">Account Settings</DropdownItem>
        <Divider key="divider" />
        <DropdownItem key="logout">Sign Out</DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export default UserMenu;
