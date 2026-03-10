import React from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuGroup,
  Divider,
  Switch
} from '@patternfly/react-core';
import { PaintBrushIcon, CheckIcon } from '@patternfly/react-icons';

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

const ThemeToggle = ({
  isOpen,
  onToggle,
  onOpenChange,
  baseTheme,
  isHighContrast,
  onThemeSelect,
  onHighContrastToggle
}) => {
  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={() => {}}
      onOpenChange={onOpenChange}
      popperProps={{ position: 'end' }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggle}
          isExpanded={isOpen}
          variant="plain"
          aria-label="Theme selection"
        >
          <PaintBrushIcon />
        </MenuToggle>
      )}
    >
      <MenuGroup label="Theme" labelHeadingLevel="h3">
        <DropdownList>
          <DropdownItem 
            key="light"
            onClick={() => onThemeSelect(THEMES.LIGHT)}
            icon={baseTheme === THEMES.LIGHT ? <CheckIcon /> : null}
          >
            Light
          </DropdownItem>
          <DropdownItem 
            key="dark"
            onClick={() => onThemeSelect(THEMES.DARK)}
            icon={baseTheme === THEMES.DARK ? <CheckIcon /> : null}
          >
            Dark
          </DropdownItem>
        </DropdownList>
      </MenuGroup>
      <Divider key="divider" />
      <DropdownList>
        <DropdownItem
          key="high-contrast"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onHighContrastToggle(e, !isHighContrast);
          }}
        >
          <Switch
            id="high-contrast-switch"
            label="High contrast"
            isChecked={isHighContrast}
            onChange={() => {}}
            isReversed
          />
        </DropdownItem>
        <Divider key="divider2" />
        <DropdownItem 
          key="customize"
          isDisabled
        >
          Customize
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export default ThemeToggle;
