---
id: q9w3e7r1t5y8
title: Community Feedback & Discovery System
type: feature
status: backlog
priority: high
created: 2026-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - tasks
  - community
  - gitlab
  - feedback
  - apollo
parent: h4t7k2m9p3x1
blocks: []
blocked_by: []
related:
  - v2b6n4m8c1x5
external: {}
estimate: null
component: tasks
sprint: null
starred: false
flag: null
---

# Community Feedback & Discovery System

## Description

Build a feedback mechanism that enables Apollo users to submit ideas, feature requests, bug reports, and general feedback directly from the application. This feedback flows to a collective place (GitLab issues) where it can be tracked, discussed, and prioritized. The system also enables users with shared interests to discover each other, fostering a community of people working to solve similar problems.

The key insight is that when multiple people are interested in the same capability, feature, or bug fix, connecting them creates value:
- They can share workarounds and partial solutions
- Their collective voice helps prioritize the most impactful work
- They form a natural community around shared needs

## User Story

As a **user experiencing a limitation or having an idea**, I want to **submit feedback that reaches the right place and connects me with others who share my need**, so that **we can collectively drive improvements and find each other**.

## Goals

1. Frictionless feedback submission from anywhere in Apollo
2. Automatic routing to GitLab issues for tracking and discussion
3. Enable +1/upvoting on existing feedback to signal community interest
4. Help users discover others interested in the same problems
5. Aggregate votes to create a ranked list of community priorities

## Non-Goals

- Full social networking/messaging between users
- Replacing GitLab as the source of truth for issues
- Building a separate issue tracking system
- Anonymous feedback (need authentication for vote integrity)

## Design

### Feedback Submission Flow

1. User clicks feedback button (accessible from any page)
2. Modal opens with options:
   - Search existing feedback/features (to prevent duplicates)
   - Create new: Feature Request, Bug Report, or General Feedback
3. User fills out form with title, description, category
4. System creates GitLab issue with appropriate labels
5. User is shown the issue and any related existing requests

### Community Discovery

1. Each feedback item shows count of interested users
2. Users can see a list of others who +1'd the same item
3. Optional: email notifications when items they care about are updated

### Architecture

```
Apollo UI → Backend API → GitLab Issues API
                ↓
          Local vote cache
          (quick reads, synced with GitLab)
```

## Acceptance Criteria

- [ ] Feedback button accessible from app masthead or sidebar
- [ ] Search existing feedback before submitting new
- [ ] Create new feedback that becomes a GitLab issue
- [ ] +1 button on each feedback item (one vote per user)
- [ ] Vote count displayed on each item
- [ ] List of voters visible (with privacy settings)
- [ ] Server route: `POST /api/feedback` creates GitLab issue
- [ ] Server route: `GET /api/feedback` lists feedback with vote counts
- [ ] Server route: `POST /api/feedback/:id/vote` adds/removes vote
- [ ] Documentation updated
- [ ] Tests passing

## Technical Approach

### Backend (server/routes/feedback.js)

1. **GitLab Integration**
   - Use GitLab API to create issues with labels (`apollo-feedback`, `feature-request`, `bug`, etc.)
   - Store issue ID mapping locally for quick lookups
   - Sync votes as reactions or comments on GitLab issues

2. **Vote Storage**
   - Store votes locally in `data/feedback/votes.json` or SQLite
   - Each vote: `{ issueId, userId, timestamp }`
   - Optionally sync to GitLab as thumbs-up reactions

3. **User Association**
   - Use authenticated user ID for vote integrity
   - Store user interest associations for community discovery

### Frontend (src/pages/Feedback.js or integrated into Tasks.js)

1. **Feedback Modal Component**
   - Search bar for existing feedback
   - Form for new submissions
   - Category selector (Feature, Bug, Idea, Other)

2. **Feedback List View**
   - Cards showing feedback items
   - Vote count with +1 button
   - Expand to see voters and discussion

3. **Integration Points**
   - Add feedback button to AppMasthead
   - Consider embedding in Tasks page as a tab

## Subtasks

- [ ] Design feedback submission modal UI
- [ ] Create backend route for GitLab issue creation
- [ ] Implement search for existing feedback
- [ ] Build voting mechanism (backend + frontend)
- [ ] Add community discovery (show interested users)
- [ ] Create notification system for updates
- [ ] Add feedback link/button to app chrome
- [ ] Write documentation

## Open Questions

- [ ] How to handle anonymous browsing vs authenticated voting?
- [ ] Should votes sync bidirectionally with GitLab reactions?
- [ ] What GitLab project should receive the issues?
- [ ] How to categorize/label feedback for easy filtering?
- [ ] Privacy: should voter names be visible by default?

## References

- Parent epic: [h4t7k2m9p3x1](h4t7k2m9p3x1.md) - Tasks Page Enhancement Epic
- Related: [v2b6n4m8c1x5](v2b6n4m8c1x5.md) - Impact View visualization
- GitLab API: https://docs.gitlab.com/ee/api/issues.html

## History

- 2026-01-23: Created as subtask of Tasks Page Enhancement Epic
