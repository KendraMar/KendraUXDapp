---
id: exw1o75kwa2a
title: Service Worker & Push Notifications for PWA
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - mobile
  - pwa
  - notifications
  - commuter
  - apollo
parent: gl320ae1erth
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: frontend
sprint: null
starred: false
flag: null
---

# Service Worker & Push Notifications for PWA

## Description

Apollo has a PWA manifest (`public/site.webmanifest`) but lacks a service worker for offline support and push notifications. "The Commuter" demo script describes a mobile-first experience where users receive notifications about agent activity, decision requests, and overnight work results.

Currently:
- PWA manifest exists with basic configuration
- Mobile meta tags are in place
- **No service worker** for offline caching
- **No push notification** support

This gap prevents the core mobile experience described in the demo script where users can:
- Receive push notifications on mobile when agents complete work
- Work offline with cached content
- Get notified when decisions require their input

## Acceptance Criteria

- [ ] Create `public/sw.js` service worker with offline caching strategy
- [ ] Implement cache-first for static assets, network-first for API calls
- [ ] Add push notification subscription with Web Push API
- [ ] Create notification permission request flow in Settings
- [ ] Store push subscription on server (`server/routes/notifications.js`)
- [ ] Send push notifications for key events (agent complete, decision ready)
- [ ] Add notification preferences in Settings (types, quiet hours)
- [ ] Works in both development and production environments

## Technical Notes

### Service Worker Strategy

```javascript
// Cache strategies:
// - Static assets (JS, CSS, images): Cache-first
// - API responses: Network-first with cache fallback
// - HTML pages: Stale-while-revalidate
```

### Push Notification Flow

1. User enables notifications in Settings
2. Browser prompts for permission
3. Subscription object sent to server
4. Server stores subscription in `data/push-subscriptions/`
5. Server sends push via web-push library when events occur

### Files to Create

- `public/sw.js` - Service worker
- `src/lib/pushNotifications.js` - Push subscription management
- `server/routes/push.js` - Push subscription API

### Files to Modify

- `public/index.html` - Register service worker
- `src/pages/Settings.js` - Add notification preferences
- `webpack.config.js` - Service worker build configuration

## Dependencies

- web-push npm package for server-side push
- VAPID keys generation for push authentication

## References

- [The Commuter Plan - Scene 1](./gl320ae1erth/plan.md) - Mobile notification concept
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)

## History

- 2026-01-31: Created as child task of The Commuter epic
