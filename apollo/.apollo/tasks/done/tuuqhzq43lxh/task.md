---
id: tuuqhzq43lxh
title: 'Tasks: add support for deadlines'
type: task
status: done
priority: medium
created: '2026-02-02'
due: null
assignees: []
labels:
  - apollo
starred: false
flag: null
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: null
---
# Tasks: add support for deadlines

## Description

Deadlines, target dates, some word to denote that a given task has to be done before a certain date or date/time.

## Acceptance Criteria

- [x] Add deadline filter dropdown (overdue, due today, due this week, has deadline, no deadline)
- [x] Add deadline status helper functions (getDeadlineStatus, getDeadlineColor, formatDeadline)
- [x] Display deadline indicator in list view with color-coded urgency (red=overdue, orange=due today, yellow=due this week)
- [x] Display deadline indicator in kanban view with tooltips
- [x] Filter tasks by deadline status

## Technical Notes

Implementation adds:
- `filterDeadline` state for deadline filtering
- `isDeadlineOpen` state for dropdown control
- `deadlineOptions` array with filter options
- `getDeadlineStatus(dueDate)` - returns 'overdue', 'due-today', 'due-this-week', 'upcoming', or null
- `getDeadlineColor(dueDate)` - returns appropriate color based on urgency
- `formatDeadline(dueDate)` - returns human-readable deadline text (e.g., "Due today", "2 days overdue")
- CalendarAltIcon and OutlinedCalendarAltIcon for visual indicators
- Deadline filter dropdown in toolbar after flag filter
- Deadline indicators in both list view and kanban view

## References

- `src/pages/Tasks.js` - Main implementation

## History

- 2026-02-02: Created
- 2026-02-03: Implemented deadline filter, indicators, and helper functions
