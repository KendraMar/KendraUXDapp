---
id: wpdqf4mc23gg
title: 'Tasks Timeline View: Gantt-style Horizontal Timeline'
type: feature
status: backlog
priority: medium
created: 2026-02-12T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - feature
  - tasks
  - timeline
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

# Tasks Timeline View: Gantt-style Horizontal Timeline

## Description

Add a new "Timeline" view to the Tasks app that displays tasks as a Gantt-chart style horizontal timeline. This view provides temporal context for task planning, showing when tasks start, how long they take, and how they relate to each other through dependencies.

The view combines:
- A **hierarchical left panel** showing task grouping (epics → stories → tasks) in a tree structure
- A **horizontal calendar/timeline** showing date-ranged bars for each task
- A **today marker** (vertical line) for temporal orientation
- **Dependency lines** between tasks showing blockers and relationships

## Key Features

1. **Horizontal timeline grid** with date columns (days/weeks/months depending on zoom)
2. **Left-side hierarchy** showing progressive task grouping (initiatives → epics → tasks)
3. **Task bars** showing duration from start date to end date (or estimated dates)
4. **Today line** - vertical marker showing current date
5. **Dependency arrows** - lines between related tasks showing blocking relationships
6. **Color-coded bars** by status (in progress, done, backlog, etc.)
7. **Interactive** - click tasks to view details in the existing detail panel
8. **Zoom levels** - day, week, month granularity

## Acceptance Criteria

- [ ] New "Timeline" toggle button added to the view mode toggle group
- [ ] Tasks with date information display as horizontal bars on a time axis
- [ ] Hierarchical grouping (epics/parents on left, children indented)
- [ ] Vertical "today" line marks the current date
- [ ] Dependency lines drawn between blocked/blocking tasks
- [ ] Bars color-coded by task status
- [ ] Clicking a task bar opens the detail panel
- [ ] Tasks without dates show in a separate section or with estimated placement
- [ ] View scrolls horizontally through time and vertically through tasks

## Technical Notes

- New component: `data/apps/tasks/pages/components/TasksTimelineView.js`
- Follows existing view pattern (TasksKanbanView, TasksListView, TasksCanvasView)
- Uses existing task data structure (created, due, status, parent/children, blocks/blocked_by)
- Pure CSS/SVG implementation (no additional charting libraries)
- Reuses existing task helpers and formatters

## References

- [Tasks App](../../../data/apps/tasks/)
- [Existing views pattern](../../../data/apps/tasks/pages/components/)

## History

- 2026-02-12: Created
