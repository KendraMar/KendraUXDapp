# Components Page Organization

The Components page has been reorganized into a single-page, scrollable layout with vertical navigation and search capabilities for easy component discovery.

## File Structure

```
src/pages/
├── Components.js                    # Main component page with vertical nav & search
└── components/                      # Component category modules
    ├── ButtonsAndActions.js         # Buttons, ActionList, ToggleGroup, ClipboardCopy
    ├── FormsAndInputs.js            # All form inputs and controls
    ├── DataDisplay.js               # Lists, tables, badges, labels, avatars
    ├── Feedback.js                  # Alerts, banners, progress, spinners, tooltips
    ├── NavigationComponents.js      # Tabs, breadcrumbs, pagination, dropdowns, menus
    ├── LayoutComponents.js          # Flex, Stack, Split, Gallery, Panel, Sidebar
    ├── Overlays.js                  # Modals, drawers, backdrops, popovers
    └── SpecialComponents.js         # Accordion, calendar, wizard, notifications
```

## User Interface Features

### 1. Single-Page Scrollable Layout
- All components are visible on one page
- Natural scrolling through all categories
- No need to click tabs to see content

### 2. Sticky Vertical Navigation
- Fixed sidebar navigation on the left
- Automatically highlights the current section as you scroll
- Click any category to smoothly scroll to that section
- Stays in view as you scroll the page

### 3. Search Functionality
- Search box at the top of the page
- Searches component names and keywords
- Instantly filters the visible categories
- Examples: "button", "modal", "form", "alert"

### 4. Smart Scroll Tracking
- Automatically updates the active navigation item as you scroll
- Smooth scroll animation when clicking navigation items
- Proper offset handling for fixed headers

## Component Categories

All categories are visible on a single scrollable page:
- Button variants (primary, secondary, tertiary, danger, warning, etc.)
- Action List
- Toggle Group
- Clipboard Copy

### Buttons & Actions
- Text Input & Text Area
- Checkboxes & Radio Buttons
- Switch & Number Input
- Date Picker & Time Picker
- Slider
- Search Input
- Form Select
- File Upload
- Input Group

### Forms & Inputs
- Avatars & Badges
- Labels & Label Groups
- Lists (simple, ordered)
- Description Lists
- Data Lists
- Simple List (interactive)
- Tree View
- Skeleton (loading placeholder)
- Truncate & Timestamp
- Code Block

### Data Display
- Alerts (all variants)
- Banners
- Progress Bars
- Spinners
- Tooltips & Popovers
- Helper Text
- Hints
- Empty State

### Feedback
- Tabs
- Breadcrumb
- Pagination
- Dropdown
- Menu
- Jump Links

### Navigation
- Flex Layout
- Stack Layout
- Split Layout
- Level Layout
- Gallery Layout
- Bullseye (center)
- Panel
- Sidebar Layout
- Dividers

### Layouts
- Modals (small, medium, large)
- Drawer
- Backdrop
- Popover (detailed)

### Special Components
- Accordion
- Expandable Section
- Calendar Month
- Toolbar
- About Modal
- Back to Top
- Dual List Selector
- Notification Drawer
- Skip to Content

## Benefits of This Structure

1. **Discoverability**: Search makes finding components instant
2. **Overview**: See all components at once by scrolling
3. **Navigation**: Sticky sidebar provides quick access to any section
4. **Context**: Stay oriented with automatic scroll tracking
5. **Performance**: Components load once, no tab switching delays
6. **Scalability**: Easy to add new components to existing categories
7. **Maintainability**: Each category is self-contained
8. **User-Friendly**: Natural scrolling behavior, no clicks required

## Technical Implementation

### Search Functionality
- Real-time filtering of component categories
- Searches both category names and keywords
- Uses React useMemo for performance optimization
- Shows "no results" message when no matches found

### Scroll Tracking
- Detects which section is currently in view
- Updates navigation highlighting automatically
- Uses scroll event listener with proper cleanup
- Handles edge cases at page boundaries

### Smooth Scrolling
- Native smooth scroll behavior
- Proper offset for fixed headers
- Click navigation item to jump to section
- Maintains scroll position on re-renders

### Responsive Design
- Sidebar width adjusts based on screen size (25% default, 20% on large screens)
- Sticky positioning keeps nav visible while scrolling
- Max height constraint prevents nav from extending off-screen
- Overflow scroll within nav panel for many categories

## Adding New Components

To add a new component example:

1. Choose the appropriate category file (or create a new one)
2. Import the PatternFly component
3. Add state management if needed
4. Create a GridItem with a Card containing your example
5. If creating a new category, add it to the `sections` array in `Components.js` with an ID, title, component, and keywords for search

### Example of Adding a New Category

```javascript
const sections = [
  // ... existing sections
  { 
    id: 'new-category', 
    title: 'New Category', 
    component: NewCategoryComponent,
    keywords: 'keyword1 keyword2 component names for search'
  }
];
```

## Example Usage

Each category component follows this pattern:

```jsx
import React from 'react';
import { Grid, GridItem, Card, CardTitle, CardBody } from '@patternfly/react-core';

const CategoryName = () => {
  // State management
  const [state, setState] = React.useState(initialValue);

  return (
    <Grid hasGutter>
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Component Name</CardTitle>
          <CardBody>
            {/* Component example */}
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default CategoryName;
```

## All PatternFly 6 Components Included

✅ Over 70 interactive component examples covering all major PatternFly 6 components
✅ All examples use only PatternFly 6 components (no deprecated v5 or earlier components)
✅ Interactive demos with working state management
✅ Organized by logical categories for easy navigation

