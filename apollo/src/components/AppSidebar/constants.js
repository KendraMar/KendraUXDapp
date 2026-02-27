import React from 'react';
import {
  TachometerAltIcon,
  CubesIcon,
  FlaskIcon,
  CogIcon,
  BookIcon,
  BookOpenIcon,
  PaintBrushIcon,
  InboxIcon,
  ListIcon,
  CommentsIcon,
  ArchiveIcon,
  VideoIcon,
  SlackHashIcon,
  ScreenIcon,
  TopologyIcon,
  CalendarAltIcon,
  GitlabIcon,
  ObjectGroupIcon,
  RssIcon,
  HomeIcon,
  CodeIcon,
  PaletteIcon,
  UserIcon,
  UsersIcon,
  ClipboardIcon,
  CameraIcon,
  CatalogIcon
} from '@patternfly/react-icons';
import { getAppNavItems } from '../../lib/appRegistry';

// Icon mapping
export const iconMap = {
  TachometerAltIcon: TachometerAltIcon,
  CubesIcon: CubesIcon,
  FlaskIcon: FlaskIcon,
  CogIcon: CogIcon,
  BookIcon: BookIcon,
  BookOpenIcon: BookOpenIcon,
  PaintBrushIcon: PaintBrushIcon,
  InboxIcon: InboxIcon,
  ListIcon: ListIcon,
  CommentsIcon: CommentsIcon,
  ArchiveIcon: ArchiveIcon,
  VideoIcon: VideoIcon,
  SlackHashIcon: SlackHashIcon,
  ScreenIcon: ScreenIcon,
  TopologyIcon: TopologyIcon,
  CalendarAltIcon: CalendarAltIcon,
  GitlabIcon: GitlabIcon,
  ObjectGroupIcon: ObjectGroupIcon,
  RssIcon: RssIcon,
  HomeIcon: HomeIcon,
  CodeIcon: CodeIcon,
  PaletteIcon: PaletteIcon,
  UserIcon: UserIcon,
  UsersIcon: UsersIcon,
  ClipboardIcon: ClipboardIcon,
  CameraIcon: CameraIcon,
  CatalogIcon: CatalogIcon
};

// Core nav items (built-in to Apollo)
export const coreNavItems = [
  { id: 'welcome', path: '/welcome', displayName: 'Welcome', icon: 'emoji:👋' },
  { id: 'dashboard', path: '/dashboard', displayName: 'Dashboard', icon: 'TachometerAltIcon' },
  { id: 'people', path: '/people', displayName: 'People', icon: 'UsersIcon' },
  { id: 'profile', path: '/profile', displayName: 'Profile', icon: 'UserIcon' },
];

// Get modular app nav items from registry
const modularAppNavItems = getAppNavItems();

// Merge core items with modular app items, avoiding duplicates
// Modular apps override core items with the same ID (for migration)
export const allAvailableItems = [
  ...coreNavItems.filter(item => !modularAppNavItems.some(appItem => appItem.id === item.id)),
  ...modularAppNavItems
];

// Common emoji options for quick selection
export const emojiOptions = ['📁', '🏠', '🔬', '🎨', '💼', '📊', '🚀', '💡', '📝', '🎯', '⚡', '🔧'];

// Helper to generate unique IDs for new sections
export const generateSectionId = () => `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to generate unique IDs for custom pages
export const generateCustomPageId = () => `custom-page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to get icon component from icon name
export const getIcon = (iconName) => {
  if (iconName && iconName.startsWith('emoji:')) {
    const emoji = iconName.slice(6);
    return <span style={{ filter: 'grayscale(1)', fontSize: '1em', lineHeight: 1 }}>{emoji}</span>;
  }
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent /> : null;
};
