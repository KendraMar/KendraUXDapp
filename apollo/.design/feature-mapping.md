# Feature Mapping

This file maps code paths to their corresponding design feature areas.

| Code Path | Design Feature | Design History |
|-----------|---------------|----------------|
| `src/pages/Chat.js` | chat | `.design/features/chat/design-history.md` |
| `src/pages/Feed.js` | feed | `.design/features/feed/design-history.md` |
| `src/pages/Dashboard.js` | dashboard | `.design/features/dashboard/design-history.md` |
| `src/components/AppSidebar.js` | sidebar-navigation | `.design/features/sidebar-navigation/design-history.md` |
| `src/components/AppMasthead.js` | sidebar-navigation | `.design/features/sidebar-navigation/design-history.md` |
| `src/pages/Prototypes.js` | prototypes | `.design/features/prototypes/design-history.md` |
| `src/pages/PrototypeDetail.js` | prototypes | `.design/features/prototypes/design-history.md` |
| `src/pages/components/PrototypeContextPanel.js` | prototypes | `.design/features/prototypes/design-history.md` |
| `src/pages/components/PrototypeDiscussionsPanel.js` | prototypes | `.design/features/prototypes/design-history.md` |
| `data/apps/catalog/**/*` | catalog | `.design/features/catalog/design-history.md` |
| `src/pages/Tasks.js` | task-management | `.design/features/task-management/design-history.md` |
| `src/pages/Slack.js` | integrations | `.design/features/integrations/design-history.md` |
| `src/pages/Calendar.js` | integrations | `.design/features/integrations/design-history.md` |
| `src/pages/GitLab.js` | integrations | `.design/features/integrations/design-history.md` |
| `src/pages/Figma.js` | integrations | `.design/features/integrations/design-history.md` |
| `src/pages/Wiki.js` | integrations | `.design/features/integrations/design-history.md` |
| `src/pages/RSS.js` | integrations | `.design/features/integrations/design-history.md` |
| `server/routes/slack.js` | integrations | `.design/features/integrations/design-history.md` |
| `server/routes/jira.js` | integrations | `.design/features/integrations/design-history.md` |
| `server/routes/confluence.js` | integrations | `.design/features/integrations/design-history.md` |
| `server/routes/gitlab.js` | integrations | `.design/features/integrations/design-history.md` |
| `server/routes/figma.js` | integrations | `.design/features/integrations/design-history.md` |
| `server/routes/google.js` | integrations | `.design/features/integrations/design-history.md` |
| `server/routes/rss.js` | integrations | `.design/features/integrations/design-history.md` |
| `src/pages/Canvas.js` | design-workspace | `.design/features/design-workspace/design-history.md` |
| `src/pages/Designs.js` | design-workspace | `.design/features/design-workspace/design-history.md` |
| `src/pages/MoodBoard.js` | design-workspace | `.design/features/design-workspace/design-history.md` |
| `src/pages/Recordings.js` | content | `.design/features/content/design-history.md` |
| `src/pages/Slides.js` | content | `.design/features/content/design-history.md` |
| `src/pages/Documents.js` | content | `.design/features/content/design-history.md` |
| `src/pages/Code.js` | content | `.design/features/content/design-history.md` |
| `src/pages/Discussions.js` | content | `.design/features/content/design-history.md` |
| `src/pages/Bulletin.js` | content | `.design/features/content/design-history.md` |
| `data/apps/kubernetes/**/*` | kubernetes | `.design/features/kubernetes/design-history.md` |
| `src/pages/Settings.js` | settings | `.design/features/settings/design-history.md` |
| `src/pages/Welcome.js` | onboarding | `.design/features/onboarding/design-history.md` |
| `server/lib/ai.js` | chat | `.design/features/chat/design-history.md` |
| `src/lib/appRegistry.js` | catalog | `.design/features/catalog/design-history.md` |
| `server/lib/sharing.js` | sharing | `.design/features/sharing/design-history.md` |
| `server/routes/sharing.js` | sharing | `.design/features/sharing/design-history.md` |
| `src/components/ShareArtifactModal.js` | sharing | `.design/features/sharing/design-history.md` |
| `src/components/UnshareArtifactModal.js` | sharing | `.design/features/sharing/design-history.md` |
| `src/components/SyncStatusPanel.js` | sharing | `.design/features/sharing/design-history.md` |
| `src/pages/Settings/components/SharedReposSettings.js` | sharing | `.design/features/sharing/design-history.md` |
| `data/shared/**/*` | sharing | `.design/features/sharing/design-history.md` |
| `data/apps/documents/**/*` | documents | `.design/features/documents/design-history.md` |

| (future) Extended Displays | extended-displays | `.design/features/extended-displays/design-history.md` |

## How to Use

When making UI/UX changes:

1. Look up the code path in this table
2. Update the corresponding `design-history.md` with a brief entry
3. Follow the entry format in `.design/README.md`

## Adding New Mappings

When new feature areas are created, add them to this table so future changes know where to record design updates.
