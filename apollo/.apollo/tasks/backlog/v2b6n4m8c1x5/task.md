---
id: v2b6n4m8c1x5
title: Impact View - Task Ranking Visualization
type: feature
status: backlog
priority: high
created: 2026-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - tasks
  - visualization
  - frontend
  - apollo
parent: h4t7k2m9p3x1
blocks: []
blocked_by:
  - q9w3e7r1t5y8
related:
  - q9w3e7r1t5y8
external: {}
estimate: null
component: tasks
sprint: null
starred: false
flag: null
---

# Impact View - Task Ranking Visualization

## Description

Add a new view mode to the Tasks page that visualizes tasks/features/feedback ranked by the number of users they could potentially serve. This "Impact View" shows a distribution chart similar to a long-tail/power law curve, where:

- **Y-axis**: Number of users interested (vote count, +1s)
- **X-axis**: Individual tasks/features/feedback items (ordered by vote count)
- **Left side ("Common Needs")**: High-impact items that many users want
- **Right side ("Long-Tail Needs")**: Specialized items with fewer but dedicated advocates

This visualization helps product teams and developers quickly identify:
1. The most common pain points affecting the largest number of users
2. The distribution of needs (few high-impact vs many niche requests)
3. Where to focus effort for maximum community benefit

## User Story

As a **product team member or developer**, I want to **see tasks and feature requests visualized by community interest**, so that **I can prioritize work that helps the most users and understand the distribution of needs**.

## Goals

1. Add "Impact" as a third view mode alongside List and Canvas
2. Render an interactive chart showing the long-tail distribution of user interest
3. Enable clicking on chart elements to view task details
4. Highlight the distinction between common needs and long-tail needs
5. Make it easy to identify the top unmet needs at a glance

## Non-Goals

- Complex statistical analysis beyond vote counting
- Predictive modeling of future interest
- Weighting votes by user type or influence

## Design

### Visual Concept

Based on the reference image:

```
    ↑
    │   ████
# of│   █████
Users   ██████    Common Needs
    │   ████████
    │   ██████████
    │   ████████████████████████████████████
    │                        Long-Tail Needs
    └──────────────────────────────────────→
              User Needs (Tasks/Features)
```

### Interactive Elements

1. **Hover**: Show task title, vote count, and brief description
2. **Click**: Select task and show details in side panel (like other views)
3. **Zoom**: Ability to focus on a section of the distribution
4. **Threshold line**: Optional marker showing "minimum viable interest"

### Chart Implementation Options

1. **Area Chart**: Smooth curve showing distribution (like reference image)
2. **Bar Chart**: Individual bars for each task, ordered by votes
3. **Hybrid**: Area chart with individual task markers

### Color Coding

- Gradient from hot (high interest) to cool (low interest)
- Or categorical: Common Needs (gold/yellow), Long-Tail (neutral/gray)
- Match existing PatternFly color tokens

## Acceptance Criteria

- [ ] New "Impact" toggle option in view mode selector
- [ ] Chart renders showing tasks ranked by vote/interest count
- [ ] Chart clearly distinguishes common needs (left/high) from long-tail (right/low)
- [ ] Hover shows task details (title, vote count, type)
- [ ] Click selects task and shows in detail panel
- [ ] Works with filtered data (respects status/priority filters)
- [ ] Responsive to window size
- [ ] Empty state when no vote data available
- [ ] Legend explaining the visualization
- [ ] Documentation updated

## Technical Approach

### Chart Library Options

1. **Recharts** (recommended) - React-friendly, good for area/bar charts
2. **Victory** - PatternFly-aligned, React components
3. **D3.js** - Maximum flexibility, more code
4. **CSS-only** - Simple bars with flexbox (limited interactivity)

Recommend starting with Recharts for balance of features and simplicity.

### Data Requirements

```javascript
// From feedback/voting system
const impactData = [
  { id: 'task1', title: 'Dark mode', votes: 127, type: 'feature' },
  { id: 'task2', title: 'Export to PDF', votes: 89, type: 'feature' },
  { id: 'task3', title: 'Fix login bug', votes: 76, type: 'bug' },
  // ... sorted by votes descending
];
```

### Component Structure

```jsx
// In Tasks.js, add to ToggleGroup:
<ToggleGroupItem
  icon={<ChartAreaIcon />}
  text="Impact"
  aria-label="Impact view"
  buttonId="toggle-impact"
  isSelected={viewMode === 'impact'}
  onChange={() => setViewMode('impact')}
/>

// New component or section:
<ImpactView 
  tasks={filteredIssues}
  onTaskSelect={handleIssueClick}
  selectedTask={selectedIssue}
/>
```

### Integration with Voting Data

- Merge Jira issues with feedback vote counts
- Tasks without votes show as 0 or in a separate "unrated" section
- Consider separate views: "All Tasks" vs "Community Feedback Only"

## Subtasks

- [ ] Evaluate and select chart library (Recharts recommended)
- [ ] Install chart library dependency
- [ ] Create ImpactView component with area/bar chart
- [ ] Add "Impact" toggle to view mode selector
- [ ] Implement hover tooltips for task details
- [ ] Implement click to select and show in detail panel
- [ ] Add visual distinction for common vs long-tail regions
- [ ] Add chart legend and axis labels
- [ ] Handle empty state (no vote data)
- [ ] Test with various data distributions
- [ ] Add to documentation

## Open Questions

- [ ] Should this view only show feedback items (with votes) or all tasks?
- [ ] How to handle tasks with 0 votes - include or separate section?
- [ ] What threshold defines "common" vs "long-tail" (top 20%?)?
- [ ] Should there be a way to normalize by task age (newer = fewer votes)?
- [ ] Include Jira issues or only Apollo feedback items?

## References

- Parent epic: [h4t7k2m9p3x1](h4t7k2m9p3x1.md) - Tasks Page Enhancement Epic
- Related: [q9w3e7r1t5y8](q9w3e7r1t5y8.md) - Community Feedback & Discovery System
- Reference image: Long-tail distribution chart showing Common Needs vs Long-Tail Needs
- Recharts: https://recharts.org/
- PatternFly Charts: https://www.patternfly.org/charts/about-charts

## History

- 2026-01-23: Created as subtask of Tasks Page Enhancement Epic
