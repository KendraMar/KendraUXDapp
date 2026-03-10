/**
 * Route configuration for Apollo UI.
 * Each entry maps a URL path to a lazily-imported page component.
 * 
 * Adding a new route:
 *   1. Import the page component
 *   2. Add an entry to the `routes` array
 *   3. The route will be rendered automatically by App.js
 */
import React from 'react';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import People from './pages/People';
import PersonDetail from './pages/People/PersonDetail';
import SpaceSettings from './pages/SpaceSettings';
import CreateSpaceSetup from './pages/CreateSpaceSetup';
import CustomPage from './pages/CustomPage';

/**
 * Static route definitions.
 * Dynamic routes from modular apps (data/apps/) are loaded separately via appRegistry.
 */
const routes = [
  { path: '/welcome', component: Welcome },
  { path: '/dashboard', component: Dashboard },
  { path: '/settings', component: Settings },
  { path: '/profile', component: Profile },
  { path: '/people', component: People },
  { path: '/people/:username', component: PersonDetail },
  { path: '/spaces/:spaceId/configure', component: SpaceSettings },
  { path: '/spaces/:spaceId/setup', component: CreateSpaceSetup },
  { path: '/page/:pageId', component: CustomPage },
];

export default routes;
