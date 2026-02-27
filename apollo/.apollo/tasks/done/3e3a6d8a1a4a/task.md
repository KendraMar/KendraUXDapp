---
id: 3e3a6d8a1a4a
title: Add Kanban View to Tasks Page
type: feature
status: done
priority: medium
created: 2026-01-25T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - frontend
  - tasks
  - ux
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: tasks
sprint: null
starred: false
flag: null
---

# Add Kanban View to Tasks Page

## Description

Add a Kanban board view to the Tasks page, providing users with a visual, column-based interface for managing tasks by status. This complements the existing List and Canvas views, offering a familiar workflow-oriented perspective that enables quick status transitions via drag-and-drop.

The Kanban view will display tasks as cards organized into columns representing workflow stages (Backlog, Open, In Progress, In Review, Done, etc.). Users can drag cards between columns to update task status, and the view should support the same filtering and source selection as the existing views.

## User Story

As a **designer or developer using Apollo**, I want to **view my tasks in a Kanban board layout**, so that **I can visualize my workflow, quickly see task distribution across statuses, and easily move tasks through my pipeline by dragging them between columns**.

## Goals

1. Provide an intuitive, visual workflow management experience
2. Enable quick status updates via drag-and-drop
3. Maintain feature parity with existing views (filtering, sources, task detail panel)
4. Support both local tasks and Jira tasks (read-only drag for Jira)
5. Deliver a responsive, performant experience even with many tasks

## Non-Goals

- Custom column configuration (use predefined status columns initially)
- WIP (Work in Progress) limits enforcement
- Swimlanes by assignee or priority (potential future enhancement)
- Kanban metrics/analytics (cycle time, throughput)
- Column collapsing/hiding

## Design

### Wireframe Concept

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tasks                                           [List] [Kanban] [Canvas]    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Sources: [All ▼]  Status: [All ▼]  Priority: [All ▼]  Sort: [Created ▼]    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│  │  Backlog    │ │    Open     │ │ In Progress │ │  In Review  │ │  Done   ││
│  │     (12)    │ │     (5)     │ │     (3)     │ │     (2)     │ │   (8)   ││
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────┤│
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │         ││
│  │ │ TASK-1  │ │ │ │ TASK-4  │ │ │ │ TASK-7  │ │ │ │ TASK-9  │ │ │  ...    ││
│  │ │ Title   │ │ │ │ Title   │ │ │ │ Title   │ │ │ │ Title   │ │ │         ││
│  │ │ 🔴 High │ │ │ │ 🟡 Med  │ │ │ │ 🔴 High │ │ │ │ 🟢 Low  │ │ │         ││
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │         ││
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │             │ │         ││
│  │ │ TASK-2  │ │ │ │ TASK-5  │ │ │ │ TASK-8  │ │ │             │ │         ││
│  │ │ Title   │ │ │ │ Title   │ │ │ │ Title   │ │ │             │ │         ││
│  │ │ 🟡 Med  │ │ │ │ 🔴 Crit │ │ │ │ 🟡 Med  │ │ │             │ │         ││
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │             │ │         ││
│  │     ...     │ │             │ │             │ │             │ │         ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Card Design

Each Kanban card should display:
- Task key (e.g., `TASK-123` or local ID)
- Source indicator (Jira logo or folder icon for local)
- Task title (truncated with ellipsis if too long)
- Priority indicator (color-coded label)
- Issue type label
- Optional: Assignee avatar (if available)

### Column Layout

Default columns based on normalized status values:
1. **Backlog** - Tasks not yet prioritized
2. **Open** - Ready to work on
3. **In Progress** - Currently being worked on
4. **Blocked** - Blocked by dependencies (optional, show if tasks exist)
5. **In Review** - Awaiting review
6. **Done** - Completed tasks

### Interaction Patterns

- **Click card**: Opens task detail panel (same as List/Canvas views)
- **Drag card**: Initiates drag operation with visual feedback
- **Drop on column**: Updates task status (local tasks only)
- **Drop indicator**: Shows insertion point within column

## Acceptance Criteria

- [ ] Kanban view toggle added to existing view switcher (List/Kanban/Canvas)
- [ ] Tasks displayed as cards in status-based columns
- [ ] Column headers show status name and task count
- [ ] Cards show key, title, priority, type, and source indicator
- [ ] Clicking a card opens the task detail panel (right side)
- [ ] Drag-and-drop updates local task status
- [ ] Jira tasks show visual indicator that they're read-only
- [ ] Dragging Jira tasks shows "cannot update external tasks" feedback
- [ ] All existing filters (sources, priority) apply to Kanban view
- [ ] Columns scroll vertically when content overflows
- [ ] Horizontal scroll available if columns exceed viewport width
- [ ] View state persisted (selected view mode remembered)
- [ ] Empty columns show placeholder with count of 0
- [ ] Loading and error states handled gracefully

## Technical Approach

### Frontend Implementation

1. **Add Kanban toggle to ToggleGroup**
   - Add `KanbanIcon` from PatternFly icons
   - Add new view mode `'kanban'` to `viewMode` state

2. **Implement Kanban board component**
   - Create reusable `KanbanColumn` component
   - Create `KanbanCard` component for individual tasks
   - Use CSS Grid or Flexbox for column layout
   - Implement horizontal scrolling container for many columns

3. **Drag-and-drop implementation**
   - Option A: Use `@dnd-kit/core` library (recommended for accessibility)
   - Option B: Use native HTML5 drag-and-drop API
   - Option C: Use `react-beautiful-dnd` (note: may have React 18 issues)
   
   Recommendation: Use `@dnd-kit/core` for best accessibility and React 18 compatibility

4. **Status normalization**
   - Create mapping function to normalize various status strings to column keys
   - Handle both Jira statuses (e.g., "To Do", "In Progress") and local statuses
   - Group unknown statuses into an "Other" column

5. **Task detail panel integration**
   - Reuse existing `IssueDetailPanel` component
   - Show panel on right side when card is selected

### API Changes

- **PUT /api/tasks/:key** - Already exists for updating local tasks
- No new endpoints required; status updates use existing task update API

### State Management

```javascript
// Group tasks by normalized status for columns
const tasksByStatus = useMemo(() => {
  const grouped = {
    backlog: [],
    open: [],
    'in-progress': [],
    blocked: [],
    review: [],
    done: [],
    other: []
  };
  
  filteredIssues.forEach(issue => {
    const normalizedStatus = normalizeStatus(issue.status);
    if (grouped[normalizedStatus]) {
      grouped[normalizedStatus].push(issue);
    } else {
      grouped.other.push(issue);
    }
  });
  
  return grouped;
}, [filteredIssues]);
```

### Styling

- Use PatternFly design tokens for colors and spacing
- Match existing dark theme aesthetic from Canvas view
- Cards should have subtle shadows and hover states
- Dragging card should have elevated appearance
- Drop zones should highlight on drag-over

## Subtasks

- [ ] Add Kanban icon and toggle option to view switcher
- [ ] Create `KanbanBoard` container component
- [ ] Create `KanbanColumn` component with header and scrollable body
- [ ] Create `KanbanCard` component matching design spec
- [ ] Implement status normalization function
- [ ] Add drag-and-drop library (`@dnd-kit/core`)
- [ ] Implement drag-and-drop handlers for local tasks
- [ ] Add read-only indicator for Jira tasks
- [ ] Integrate task detail panel on card click
- [ ] Add horizontal scroll for narrow viewports
- [ ] Persist view mode preference in localStorage
- [ ] Add CSS transitions and animations
- [ ] Test with various task counts and sources
- [ ] Update documentation

## Open Questions

- [ ] Should "Blocked" be a visible column by default, or only shown when tasks exist in that state?
- [ ] What should happen when dragging between columns with sorting applied - insert at top, bottom, or maintain sort order?
- [ ] Should we limit the number of visible tasks per column with "Show more" for performance?
- [ ] Do we want column width to be fixed or flexible based on content?

## Dependencies

- `@dnd-kit/core` - Drag-and-drop primitives
- `@dnd-kit/sortable` - Sortable list utilities (if sorting within columns)
- `@patternfly/react-icons` - For Kanban icon (may need to use alternative if not available)

## References

- [PatternFly 6 Card component](https://www.patternfly.org/components/card)
- [dnd-kit documentation](https://docs.dndkit.com/)
- [Jira Kanban board](https://www.atlassian.com/software/jira/features/kanban-boards) - Reference implementation
- Current Tasks.js implementation: `src/pages/Tasks.js`

## History

- 2026-01-25: Created specification
