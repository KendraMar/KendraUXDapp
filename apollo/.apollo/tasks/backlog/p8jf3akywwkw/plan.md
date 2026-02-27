# Apollo Design System Abstraction Architecture Plan

**Author:** AI Agent  
**Date:** January 23, 2026  
**Status:** Draft - Ready for Implementation  
**Estimated Scope:** Major architectural refactor affecting ~40+ page files and core components

---

## Executive Summary

This document outlines the architectural plan to restructure Apollo from a PatternFly 6-specific implementation to a **design system agnostic** application that can swap between different UI design systems (PatternFly, Material Design, Carbon, custom systems) at runtime with a single click.

The approach follows **Brad Frost's Atomic Design** methodology, implementing a provider-based abstraction layer that allows pages to declaratively specify what components they need, while the selected design system provides the actual implementations.

---

## Design Decisions (Confirmed)

| Decision | Choice |
|----------|--------|
| **Switching Mechanism** | Runtime (hot-swap with a click) |
| **Token Strategy** | Apollo defines canonical token schema; design systems adapt to it |
| **Complex Components** | Organized as "Organisms" in separate folder (Option C) |
| **Initial System** | PatternFly 6 only; others planned for future |
| **Prop API Design** | Rich prop API inspired by PatternFly with graceful degradation |
| **Theming** | User-level `custom.css` applied across any design system |
| **Page Architecture** | Declarative/Provider pattern (pages declare needs, system provides) |
| **CSS Strategy** | Complete CSS replacement per system, user overrides via `custom.css` |
| **Migration Approach** | Build architecture first, then migrate page-by-page |

---

## Directory Structure

```
apollo/
├── src/
│   ├── systems/                              # NEW: Design System Framework
│   │   ├── index.js                          # System provider exports
│   │   ├── DesignSystemProvider.js           # React Context provider
│   │   ├── useDesignSystem.js                # Hook for consuming components
│   │   ├── tokens/                           # Canonical design tokens
│   │   │   ├── schema.json                   # Apollo's canonical token schema
│   │   │   ├── tokens.js                     # Token accessor utilities
│   │   │   └── README.md                     # Token documentation
│   │   │
│   │   └── ui-systems/                       # Individual design systems
│   │       ├── patternfly/                   # PatternFly 6 implementation
│   │       │   ├── index.js                  # System manifest & exports
│   │       │   ├── tokens.json               # PF6 token mapping to Apollo schema
│   │       │   ├── styles.css                # PF6 base styles import
│   │       │   ├── atoms/                    # Atomic Design: Atoms
│   │       │   │   ├── index.js              # Re-exports all atoms
│   │       │   │   ├── Button.js
│   │       │   │   ├── Icon.js
│   │       │   │   ├── TextInput.js
│   │       │   │   ├── Checkbox.js
│   │       │   │   ├── Radio.js
│   │       │   │   ├── Switch.js
│   │       │   │   ├── Badge.js
│   │       │   │   ├── Label.js
│   │       │   │   ├── Spinner.js
│   │       │   │   ├── Avatar.js
│   │       │   │   ├── Divider.js
│   │       │   │   ├── Tooltip.js
│   │       │   │   └── ...                   # ~30-40 atoms
│   │       │   ├── molecules/                # Atomic Design: Molecules
│   │       │   │   ├── index.js
│   │       │   │   ├── SearchInput.js
│   │       │   │   ├── FormGroup.js
│   │       │   │   ├── InputGroup.js
│   │       │   │   ├── Dropdown.js
│   │       │   │   ├── Select.js
│   │       │   │   ├── Pagination.js
│   │       │   │   ├── Breadcrumb.js
│   │       │   │   ├── Tabs.js
│   │       │   │   ├── ActionList.js
│   │       │   │   └── ...                   # ~40-50 molecules
│   │       │   ├── organisms/                # Atomic Design: Organisms
│   │       │   │   ├── index.js
│   │       │   │   ├── Modal.js
│   │       │   │   ├── Drawer.js
│   │       │   │   ├── Table.js
│   │       │   │   ├── DataList.js
│   │       │   │   ├── Card.js
│   │       │   │   ├── EmptyState.js
│   │       │   │   ├── Alert.js
│   │       │   │   ├── Wizard.js
│   │       │   │   ├── Masthead.js
│   │       │   │   ├── Sidebar.js
│   │       │   │   ├── Chatbot.js            # PF-specific complex component
│   │       │   │   ├── TopologyView.js       # PF-specific complex component
│   │       │   │   ├── LogViewer.js          # PF-specific complex component
│   │       │   │   └── ...                   # ~50-60 organisms
│   │       │   └── templates/                # Atomic Design: Templates (layouts)
│   │       │       ├── index.js
│   │       │       ├── Page.js
│   │       │       ├── PageSection.js
│   │       │       ├── Stack.js
│   │       │       ├── Split.js
│   │       │       ├── Grid.js
│   │       │       ├── Flex.js
│   │       │       ├── Gallery.js
│   │       │       └── ...                   # ~15-20 templates
│   │       │
│   │       ├── material/                     # FUTURE: Material Design
│   │       │   └── (same structure)
│   │       │
│   │       └── custom/                       # FUTURE: User's custom system
│   │           └── (same structure, user-editable copies)
│   │
│   ├── App.js                                # MODIFIED: Wrap with DesignSystemProvider
│   ├── components/                           # MODIFIED: Use abstracted components
│   │   ├── AppMasthead.js
│   │   └── AppSidebar.js
│   ├── pages/                                # MODIFIED: Each page migrated
│   │   └── ...
│   └── custom.css                            # User theme overrides (preserved)
│
├── data/
│   └── user-system-overrides/                # NEW: User component overrides
│       └── (copied/modified component files)
```

---

## Atomic Design Classification

Based on Brad Frost's Atomic Design, components are classified into four levels:

### 1. Atoms (~35 components)
The fundamental building blocks - smallest UI elements that can't be broken down further.

| Component | Description | PatternFly Source |
|-----------|-------------|-------------------|
| Button | Clickable action element | `@patternfly/react-core` |
| Icon | SVG icons | `@patternfly/react-icons` |
| TextInput | Single-line text input | `@patternfly/react-core` |
| TextArea | Multi-line text input | `@patternfly/react-core` |
| Checkbox | Boolean toggle (checkbox style) | `@patternfly/react-core` |
| Radio | Single select from group | `@patternfly/react-core` |
| Switch | Boolean toggle (switch style) | `@patternfly/react-core` |
| Badge | Numeric indicator | `@patternfly/react-core` |
| Label | Categorization tag | `@patternfly/react-core` |
| Spinner | Loading indicator | `@patternfly/react-core` |
| Avatar | User/entity image | `@patternfly/react-core` |
| Divider | Visual separator | `@patternfly/react-core` |
| Tooltip | Hover information | `@patternfly/react-core` |
| Popover | Click-triggered overlay | `@patternfly/react-core` |
| Title | Heading text | `@patternfly/react-core` |
| Content | Paragraph/text content | `@patternfly/react-core` |
| Text | Inline text | `@patternfly/react-core` |
| Link | Hyperlink | Custom wrapper |
| Image | Image display | Custom wrapper |
| Progress | Progress indicator | `@patternfly/react-core` |
| Skeleton | Loading placeholder | `@patternfly/react-core` |
| Truncate | Text truncation | `@patternfly/react-core` |
| HelperText | Form helper/error text | `@patternfly/react-core` |
| FormHelperText | Form field helper | `@patternfly/react-core` |
| MenuToggle | Dropdown trigger | `@patternfly/react-core` |
| Timestamp | Date/time display | `@patternfly/react-core` |

### 2. Molecules (~45 components)
Combinations of atoms forming functional units.

| Component | Atoms Used | PatternFly Source |
|-----------|-----------|-------------------|
| SearchInput | TextInput + Icon + Button | `@patternfly/react-core` |
| FormGroup | Label + Input + HelperText | `@patternfly/react-core` |
| InputGroup | Multiple inputs grouped | `@patternfly/react-core` |
| Dropdown | MenuToggle + List | `@patternfly/react-core` |
| Select | MenuToggle + List + Checkbox | `@patternfly/react-core` |
| Pagination | Button + Text + Select | `@patternfly/react-core` |
| Breadcrumb | Link chain | `@patternfly/react-core` |
| Tabs | Tab buttons + content area | `@patternfly/react-core` |
| ActionList | Button group | `@patternfly/react-core` |
| ActionGroup | Form action buttons | `@patternfly/react-core` |
| ChipGroup | Multiple labels | `@patternfly/react-core` |
| LabelGroup | Multiple labels | `@patternfly/react-core` |
| Nav | NavItem list | `@patternfly/react-core` |
| NavItem | Link + Icon | `@patternfly/react-core` |
| NavGroup | Section of NavItems | `@patternfly/react-core` |
| Menu | Item list | `@patternfly/react-core` |
| MenuItem | Icon + Text + Action | `@patternfly/react-core` |
| ExpandableSection | Toggle + Content | `@patternfly/react-core` |
| Accordion | Multiple expandable sections | `@patternfly/react-core` |
| DatePicker | Input + Calendar | `@patternfly/react-core` |
| TimePicker | Input + Time selector | `@patternfly/react-core` |
| NumberInput | Input + Increment/Decrement | `@patternfly/react-core` |
| Slider | Track + Thumb + Input | `@patternfly/react-core` |
| ToggleGroup | Multiple toggles | `@patternfly/react-core` |
| DualListSelector | Two lists + actions | `@patternfly/react-core` |
| TreeView | Hierarchical list | `@patternfly/react-core` |

### 3. Organisms (~55 components)
Complex components combining molecules; often standalone functional units.

| Component | Complexity | PatternFly Source |
|-----------|------------|-------------------|
| Modal | Window overlay with header/body/footer | `@patternfly/react-core` |
| Drawer | Slide-out panel | `@patternfly/react-core` |
| Card | Content container with sections | `@patternfly/react-core` |
| Table | Data grid | `@patternfly/react-table` |
| DataList | Flexible data list | `@patternfly/react-core` |
| EmptyState | No-content placeholder | `@patternfly/react-core` |
| Alert | Notification banner | `@patternfly/react-core` |
| AlertGroup | Multiple alerts | `@patternfly/react-core` |
| NotificationDrawer | Notification panel | `@patternfly/react-core` |
| Wizard | Multi-step form | `@patternfly/react-core` |
| Form | Complete form | `@patternfly/react-core` |
| Toolbar | Action bar | `@patternfly/react-core` |
| Banner | Page-wide notification | `@patternfly/react-core` |
| DescriptionList | Key-value pairs | `@patternfly/react-core` |
| Panel | Content panel | `@patternfly/react-core` |
| JumpLinks | In-page navigation | `@patternfly/react-core` |
| **Masthead** | App header | `@patternfly/react-core` |
| **Sidebar/PageSidebar** | App navigation sidebar | `@patternfly/react-core` |
| **Chatbot** | AI chat interface | `@patternfly/chatbot` |
| **CodeEditor** | Code editing | `@patternfly/react-code-editor` |
| **LogViewer** | Log display | `@patternfly/react-log-viewer` |
| **TopologyView** | Node graph | `@patternfly/react-topology` |
| FileUpload | File input with preview | `@patternfly/react-core` |
| ClipboardCopy | Copy-to-clipboard | `@patternfly/react-core` |

### 4. Templates (~15 components)
Page-level layouts and structure components.

| Component | Purpose | PatternFly Source |
|-----------|---------|-------------------|
| Page | Root page wrapper | `@patternfly/react-core` |
| PageSection | Content section | `@patternfly/react-core` |
| PageBreadcrumb | Breadcrumb area | `@patternfly/react-core` |
| Stack | Vertical layout | `@patternfly/react-core` |
| Split | Horizontal layout | `@patternfly/react-core` |
| Flex | Flexbox layout | `@patternfly/react-core` |
| Grid | Grid layout | `@patternfly/react-core` |
| Gallery | Responsive grid gallery | `@patternfly/react-core` |
| Level | Horizontal distribute | `@patternfly/react-core` |
| Bullseye | Center content | `@patternfly/react-core` |

---

## Canonical Token Schema

Apollo defines a canonical design token schema that all design systems must map to. This enables consistent theming across systems.

### `src/systems/tokens/schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Apollo Design Tokens Schema",
  "version": "1.0.0",
  "description": "Canonical design token schema for Apollo design system abstraction",
  
  "tokens": {
    "color": {
      "brand": {
        "primary": { "type": "color", "description": "Primary brand color" },
        "secondary": { "type": "color", "description": "Secondary brand color" },
        "accent": { "type": "color", "description": "Accent/highlight color" }
      },
      "background": {
        "primary": { "type": "color", "description": "Main background" },
        "secondary": { "type": "color", "description": "Secondary/card background" },
        "tertiary": { "type": "color", "description": "Tertiary/elevated background" }
      },
      "text": {
        "primary": { "type": "color", "description": "Primary text color" },
        "secondary": { "type": "color", "description": "Secondary/muted text" },
        "disabled": { "type": "color", "description": "Disabled text" },
        "inverse": { "type": "color", "description": "Text on dark backgrounds" },
        "link": { "type": "color", "description": "Link text color" }
      },
      "border": {
        "default": { "type": "color", "description": "Default border color" },
        "strong": { "type": "color", "description": "Strong/emphasized border" }
      },
      "status": {
        "success": { "type": "color", "description": "Success/positive state" },
        "warning": { "type": "color", "description": "Warning/caution state" },
        "danger": { "type": "color", "description": "Error/danger state" },
        "info": { "type": "color", "description": "Informational state" }
      },
      "interactive": {
        "default": { "type": "color", "description": "Default interactive element" },
        "hover": { "type": "color", "description": "Hover state" },
        "active": { "type": "color", "description": "Active/pressed state" },
        "focus": { "type": "color", "description": "Focus ring color" },
        "disabled": { "type": "color", "description": "Disabled state" }
      }
    },
    
    "spacing": {
      "none": { "type": "dimension", "value": "0" },
      "xs": { "type": "dimension", "description": "Extra small spacing (4px)" },
      "sm": { "type": "dimension", "description": "Small spacing (8px)" },
      "md": { "type": "dimension", "description": "Medium spacing (16px)" },
      "lg": { "type": "dimension", "description": "Large spacing (24px)" },
      "xl": { "type": "dimension", "description": "Extra large spacing (32px)" },
      "2xl": { "type": "dimension", "description": "2X large spacing (48px)" },
      "3xl": { "type": "dimension", "description": "3X large spacing (64px)" }
    },
    
    "typography": {
      "fontFamily": {
        "base": { "type": "fontFamily", "description": "Base font stack" },
        "heading": { "type": "fontFamily", "description": "Heading font stack" },
        "mono": { "type": "fontFamily", "description": "Monospace font stack" }
      },
      "fontSize": {
        "xs": { "type": "dimension", "description": "12px" },
        "sm": { "type": "dimension", "description": "14px" },
        "md": { "type": "dimension", "description": "16px (base)" },
        "lg": { "type": "dimension", "description": "18px" },
        "xl": { "type": "dimension", "description": "20px" },
        "2xl": { "type": "dimension", "description": "24px" },
        "3xl": { "type": "dimension", "description": "30px" },
        "4xl": { "type": "dimension", "description": "36px" }
      },
      "fontWeight": {
        "normal": { "type": "fontWeight", "value": "400" },
        "medium": { "type": "fontWeight", "value": "500" },
        "semibold": { "type": "fontWeight", "value": "600" },
        "bold": { "type": "fontWeight", "value": "700" }
      },
      "lineHeight": {
        "tight": { "type": "number", "value": "1.25" },
        "base": { "type": "number", "value": "1.5" },
        "loose": { "type": "number", "value": "1.75" }
      }
    },
    
    "borderRadius": {
      "none": { "type": "dimension", "value": "0" },
      "sm": { "type": "dimension", "description": "2px" },
      "md": { "type": "dimension", "description": "4px" },
      "lg": { "type": "dimension", "description": "8px" },
      "xl": { "type": "dimension", "description": "12px" },
      "full": { "type": "dimension", "value": "9999px" }
    },
    
    "shadow": {
      "sm": { "type": "shadow", "description": "Subtle shadow" },
      "md": { "type": "shadow", "description": "Medium shadow" },
      "lg": { "type": "shadow", "description": "Large shadow" },
      "xl": { "type": "shadow", "description": "Extra large shadow" }
    },
    
    "transition": {
      "fast": { "type": "duration", "value": "150ms" },
      "normal": { "type": "duration", "value": "250ms" },
      "slow": { "type": "duration", "value": "400ms" }
    },
    
    "breakpoint": {
      "sm": { "type": "dimension", "value": "576px" },
      "md": { "type": "dimension", "value": "768px" },
      "lg": { "type": "dimension", "value": "992px" },
      "xl": { "type": "dimension", "value": "1200px" },
      "2xl": { "type": "dimension", "value": "1450px" }
    },
    
    "zIndex": {
      "dropdown": { "type": "number", "value": "1000" },
      "sticky": { "type": "number", "value": "1020" },
      "fixed": { "type": "number", "value": "1030" },
      "modalBackdrop": { "type": "number", "value": "1040" },
      "modal": { "type": "number", "value": "1050" },
      "popover": { "type": "number", "value": "1060" },
      "tooltip": { "type": "number", "value": "1070" }
    }
  }
}
```

---

## Component Abstraction API

### Universal Component Interface

Each component in the abstraction layer follows a consistent interface pattern. The API is **inspired by PatternFly** but allows **graceful degradation** when a design system doesn't support a specific prop.

### Example: Button Component

```jsx
// Universal Button Props Interface (conceptual - implemented in JSDoc)
/**
 * @typedef {Object} ButtonProps
 * @property {'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'link' | 'plain'} [variant='primary']
 * @property {'sm' | 'md' | 'lg'} [size='md']
 * @property {boolean} [isDisabled=false]
 * @property {boolean} [isLoading=false]
 * @property {boolean} [isBlock=false] - Full width button
 * @property {React.ReactNode} [icon] - Icon to display
 * @property {'start' | 'end'} [iconPosition='start']
 * @property {string} [ariaLabel]
 * @property {() => void} [onClick]
 * @property {'button' | 'submit' | 'reset'} [type='button']
 * @property {React.ReactNode} children
 */

// PatternFly Implementation
// src/systems/ui-systems/patternfly/atoms/Button.js
import React from 'react';
import { Button as PFButton } from '@patternfly/react-core';

const variantMap = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  danger: 'danger',
  warning: 'warning',
  link: 'link',
  plain: 'plain'
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  isBlock = false,
  icon,
  iconPosition = 'start',
  ariaLabel,
  onClick,
  type = 'button',
  children,
  ...rest
}) => {
  // Map size to PatternFly (PF only has 'sm' and default)
  const pfSize = size === 'sm' ? 'sm' : undefined;
  
  return (
    <PFButton
      variant={variantMap[variant] || 'primary'}
      size={pfSize}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isBlock={isBlock}
      icon={iconPosition === 'start' ? icon : undefined}
      iconPosition={icon ? iconPosition : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      type={type}
      {...rest}
    >
      {children}
      {iconPosition === 'end' && icon}
    </PFButton>
  );
};

export default Button;
```

### Graceful Degradation Example

```jsx
// If a future Material Design system doesn't support 'warning' variant:
// src/systems/ui-systems/material/atoms/Button.js

const variantMap = {
  primary: 'contained',
  secondary: 'outlined', 
  tertiary: 'text',
  danger: 'contained', // with color='error'
  warning: 'contained', // Degrades to primary with console.warn in dev
  link: 'text',
  plain: 'text'
};

export const Button = ({ variant = 'primary', ...props }) => {
  let mappedVariant = variantMap[variant];
  let color = 'primary';
  
  if (variant === 'danger') {
    color = 'error';
  } else if (variant === 'warning') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Button variant "warning" not fully supported in Material, using primary');
    }
    color = 'warning'; // MUI does have warning color
  }
  
  return <MUIButton variant={mappedVariant} color={color} {...props} />;
};
```

---

## Design System Provider Architecture

### DesignSystemProvider.js

```jsx
// src/systems/DesignSystemProvider.js
import React, { createContext, useState, useEffect, useMemo } from 'react';

// Dynamic imports for design system bundles
const systemLoaders = {
  patternfly: () => import('./ui-systems/patternfly'),
  // material: () => import('./ui-systems/material'),
  // custom: () => import('./ui-systems/custom'),
};

export const DesignSystemContext = createContext(null);

export const DesignSystemProvider = ({ 
  children, 
  defaultSystem = 'patternfly',
  userOverridesPath = null 
}) => {
  const [currentSystem, setCurrentSystem] = useState(defaultSystem);
  const [systemModule, setSystemModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  // Load the design system module
  useEffect(() => {
    const loadSystem = async () => {
      setIsLoading(true);
      try {
        const loader = systemLoaders[currentSystem];
        if (!loader) {
          throw new Error(`Unknown design system: ${currentSystem}`);
        }
        
        const module = await loader();
        setSystemModule(module);
        setTokens(module.tokens);
        
        // Apply system styles
        if (module.applyStyles) {
          module.applyStyles();
        }
      } catch (error) {
        console.error('Failed to load design system:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSystem();
  }, [currentSystem]);

  // Load user CSS overrides
  useEffect(() => {
    const userStylesheet = document.getElementById('apollo-user-styles');
    if (!userStylesheet) {
      const link = document.createElement('link');
      link.id = 'apollo-user-styles';
      link.rel = 'stylesheet';
      link.href = '/custom.css'; // User's custom.css file
      document.head.appendChild(link);
    }
  }, []);

  const value = useMemo(() => ({
    // Current system info
    currentSystem,
    isLoading,
    tokens,
    
    // Switch design system at runtime
    setSystem: (systemId) => {
      if (systemLoaders[systemId]) {
        setCurrentSystem(systemId);
        localStorage.setItem('apollo-design-system', systemId);
      }
    },
    
    // Get available systems
    availableSystems: Object.keys(systemLoaders),
    
    // Component accessors (from loaded module)
    atoms: systemModule?.atoms || {},
    molecules: systemModule?.molecules || {},
    organisms: systemModule?.organisms || {},
    templates: systemModule?.templates || {},
    
    // Utility to get any component by name
    getComponent: (category, name) => {
      return systemModule?.[category]?.[name] || null;
    },
    
    // All components flattened (for convenience)
    components: systemModule ? {
      ...systemModule.atoms,
      ...systemModule.molecules,
      ...systemModule.organisms,
      ...systemModule.templates,
    } : {},
  }), [currentSystem, isLoading, tokens, systemModule]);

  if (isLoading && !systemModule) {
    // Show minimal loading state
    return <div style={{ padding: '20px' }}>Loading design system...</div>;
  }

  return (
    <DesignSystemContext.Provider value={value}>
      {children}
    </DesignSystemContext.Provider>
  );
};
```

### useDesignSystem Hook

```jsx
// src/systems/useDesignSystem.js
import { useContext } from 'react';
import { DesignSystemContext } from './DesignSystemProvider';

/**
 * Hook to access design system components and utilities
 * 
 * @example
 * // Get individual components
 * const { Button, Card, Modal } = useDesignSystem();
 * 
 * @example
 * // Get by category
 * const { atoms, molecules, organisms } = useDesignSystem();
 * const { Button } = atoms;
 * 
 * @example
 * // Switch design system
 * const { setSystem, availableSystems } = useDesignSystem();
 * setSystem('material');
 */
export const useDesignSystem = () => {
  const context = useContext(DesignSystemContext);
  
  if (!context) {
    throw new Error(
      'useDesignSystem must be used within a DesignSystemProvider'
    );
  }
  
  return context;
};

/**
 * Convenience hook to get specific components by name
 * 
 * @example
 * const [Button, Card, Modal] = useComponents('Button', 'Card', 'Modal');
 */
export const useComponents = (...componentNames) => {
  const { components } = useDesignSystem();
  return componentNames.map(name => components[name]);
};

/**
 * Hook to access design tokens
 * 
 * @example
 * const tokens = useTokens();
 * const primaryColor = tokens.color.brand.primary;
 */
export const useTokens = () => {
  const { tokens } = useDesignSystem();
  return tokens;
};
```

---

## Design System Module Structure

Each design system folder exports a consistent module interface:

### PatternFly System Index

```jsx
// src/systems/ui-systems/patternfly/index.js
import tokens from './tokens.json';

// Import all component categories
import * as atoms from './atoms';
import * as molecules from './molecules';
import * as organisms from './organisms';
import * as templates from './templates';

// System metadata
export const systemInfo = {
  id: 'patternfly',
  name: 'PatternFly 6',
  version: '6.x',
  description: 'Red Hat PatternFly design system',
  documentation: 'https://www.patternfly.org/v6/',
};

// Export tokens
export { tokens };

// Export component categories
export { atoms, molecules, organisms, templates };

// Apply system styles (called when system loads)
export const applyStyles = () => {
  // PatternFly CSS is already imported via webpack/bundler
  // This function can handle additional runtime style application
  document.documentElement.setAttribute('data-pf-theme', 'light');
  document.documentElement.classList.add('pf-v6-theme-light');
};

// Remove system styles (called when switching away)
export const removeStyles = () => {
  document.documentElement.removeAttribute('data-pf-theme');
  document.documentElement.classList.remove('pf-v6-theme-light', 'pf-v6-theme-dark');
};

// Default export for dynamic import
export default {
  systemInfo,
  tokens,
  atoms,
  molecules,
  organisms,
  templates,
  applyStyles,
  removeStyles,
};
```

---

## Page Migration Pattern

### Before (Current - Direct PatternFly imports)

```jsx
// src/pages/Dashboard.js (BEFORE)
import React from 'react';
import {
  PageSection,
  Title,
  Content,
  EmptyState,
  EmptyStateBody
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';

const Dashboard = () => {
  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">Dashboard</Title>
        <Content component="p">Your personal workspace</Content>
      </PageSection>
      <PageSection>
        <EmptyState titleText="Coming Soon" icon={CubesIcon}>
          <EmptyStateBody>Feature in development</EmptyStateBody>
        </EmptyState>
      </PageSection>
    </>
  );
};
```

### After (Abstracted - Design System Components)

```jsx
// src/pages/Dashboard.js (AFTER)
import React from 'react';
import { useDesignSystem } from '../systems';

const Dashboard = () => {
  // Declaratively request needed components from the design system
  const { 
    PageSection, 
    Title, 
    Content, 
    EmptyState, 
    EmptyStateBody,
    Icon 
  } = useDesignSystem().components;
  
  return (
    <>
      <PageSection variant="light">
        <Title level={1} size="2xl">Dashboard</Title>
        <Content as="p">Your personal workspace</Content>
      </PageSection>
      <PageSection>
        <EmptyState 
          title="Coming Soon" 
          icon={<Icon name="cubes" />}
        >
          <EmptyStateBody>Feature in development</EmptyStateBody>
        </EmptyState>
      </PageSection>
    </>
  );
};

export default Dashboard;
```

---

## App.js Integration

### Modified App.js

```jsx
// src/App.js (MODIFIED)
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DesignSystemProvider, useDesignSystem } from './systems';
import { HomeAssistantActivityTracker } from './lib/homeAssistantActivity';
import { MusicProvider } from './lib/MusicContext';

// Pages (these will be migrated one by one)
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
// ... other imports

// App shell that uses design system components
const AppShell = ({ children }) => {
  const { components } = useDesignSystem();
  const { Page } = components;
  
  // ... sidebar and masthead state logic (same as before)
  
  return (
    <Page
      masthead={<AppMasthead {...mastheadProps} />}
      sidebar={<AppSidebar {...sidebarProps} />}
    >
      {children}
    </Page>
  );
};

function App() {
  // Get saved design system preference
  const savedSystem = localStorage.getItem('apollo-design-system') || 'patternfly';
  
  return (
    <DesignSystemProvider defaultSystem={savedSystem}>
      <MusicProvider>
        <Router>
          <HomeAssistantActivityTracker />
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/welcome" replace />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* ... other routes */}
            </Routes>
          </AppShell>
        </Router>
      </MusicProvider>
    </DesignSystemProvider>
  );
}

export default App;
```

---

## Design System Switcher UI

Add to Settings page or as a quick-access in the masthead:

```jsx
// src/pages/Settings.js (addition)
import React from 'react';
import { useDesignSystem } from '../systems';

const DesignSystemSettings = () => {
  const { 
    currentSystem, 
    setSystem, 
    availableSystems,
    components: { Card, CardBody, Title, Select, SelectOption, FormGroup }
  } = useDesignSystem();
  
  const systemLabels = {
    patternfly: 'PatternFly 6 (Red Hat)',
    material: 'Material Design (Google)',
    carbon: 'Carbon Design (IBM)',
    custom: 'Custom (Your Design)'
  };
  
  return (
    <Card>
      <CardBody>
        <Title level={3}>Design System</Title>
        <FormGroup label="Active Design System" fieldId="design-system-select">
          <Select
            id="design-system-select"
            value={currentSystem}
            onChange={(_, value) => setSystem(value)}
          >
            {availableSystems.map(system => (
              <SelectOption key={system} value={system}>
                {systemLabels[system] || system}
              </SelectOption>
            ))}
          </Select>
        </FormGroup>
      </CardBody>
    </Card>
  );
};
```

---

## User Custom Overrides System

For users who want to customize individual components beyond CSS:

```jsx
// Server route: server/routes/user-overrides.js
router.post('/copy-component', async (req, res) => {
  const { systemId, category, componentName } = req.body;
  
  // Copy component from systems/ui-systems/{system}/{category}/{component}.js
  // to data/user-system-overrides/{component}.js
  
  // User can then edit this file
  // System checks for user overrides before using default
});
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Create `src/systems/` directory structure
2. Implement `DesignSystemProvider.js` and `useDesignSystem.js`
3. Create canonical token schema
4. Create PatternFly token mapping

### Phase 2: Core Atoms (Week 2-3)
1. Create PatternFly atoms wrapper components (~35 components)
2. Document the universal prop API for each atom
3. Test atoms in isolation

### Phase 3: Molecules (Week 3-4)
1. Create PatternFly molecules wrapper components (~45 components)
2. Ensure molecules use atoms from the same system
3. Test molecule compositions

### Phase 4: Organisms (Week 4-5)
1. Create PatternFly organisms wrapper components (~55 components)
2. Handle complex PF-specific components (Chatbot, etc.)
3. Test organism functionality

### Phase 5: Templates (Week 5)
1. Create PatternFly templates wrapper components (~15 components)
2. Implement Page, PageSection, layout components
3. Test full page layouts

### Phase 6: App Integration (Week 5-6)
1. Modify `App.js` to use DesignSystemProvider
2. Migrate `AppMasthead.js` 
3. Migrate `AppSidebar.js`
4. Test core shell functionality

### Phase 7: Page Migration (Week 6-10)
Migrate pages incrementally:

**Priority 1 (High traffic/complexity):**
- Welcome.js
- Chat.js  
- Settings.js
- Dashboard.js

**Priority 2 (Medium complexity):**
- Tasks.js
- Feed.js
- Bulletin.js
- Documents.js
- Calendar.js

**Priority 3 (Standard pages):**
- All remaining pages (~30 pages)
- Detail pages (RecordingDetail, etc.)

### Phase 8: Testing & Polish (Week 10-11)
1. Full application testing with PatternFly
2. Ensure custom.css overrides work
3. Performance optimization (lazy loading systems)
4. Documentation

### Phase 9: Future Systems (Future)
- Material Design implementation
- Carbon Design implementation
- Custom system framework

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/systems/index.js` | Main exports |
| `src/systems/DesignSystemProvider.js` | Context provider |
| `src/systems/useDesignSystem.js` | Consumer hooks |
| `src/systems/tokens/schema.json` | Canonical token schema |
| `src/systems/tokens/tokens.js` | Token utilities |
| `src/systems/ui-systems/patternfly/index.js` | PF system manifest |
| `src/systems/ui-systems/patternfly/tokens.json` | PF token mapping |
| `src/systems/ui-systems/patternfly/atoms/index.js` | Atoms barrel export |
| `src/systems/ui-systems/patternfly/atoms/Button.js` | (and ~34 more atoms) |
| `src/systems/ui-systems/patternfly/molecules/index.js` | Molecules barrel export |
| `src/systems/ui-systems/patternfly/molecules/*.js` | (~45 molecules) |
| `src/systems/ui-systems/patternfly/organisms/index.js` | Organisms barrel export |
| `src/systems/ui-systems/patternfly/organisms/*.js` | (~55 organisms) |
| `src/systems/ui-systems/patternfly/templates/index.js` | Templates barrel export |
| `src/systems/ui-systems/patternfly/templates/*.js` | (~15 templates) |

**Estimated total new files:** ~160 component wrapper files + ~15 infrastructure files

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.js` | Wrap with DesignSystemProvider |
| `src/components/AppMasthead.js` | Use `useDesignSystem()` instead of PF imports |
| `src/components/AppSidebar.js` | Use `useDesignSystem()` instead of PF imports |
| `src/pages/*.js` (40 files) | Migrate to use `useDesignSystem()` |
| `src/pages/Settings.js` | Add design system switcher UI |

---

## Component Mapping Reference

The complete PatternFly 6 component list from the MCP server (463 components) should be analyzed and categorized. Key mappings:

### PatternFly Package → Category

| PatternFly Package | Atomic Category |
|-------------------|-----------------|
| `@patternfly/react-core` (most components) | Atoms, Molecules, Organisms |
| `@patternfly/react-table` | Organisms (Table, Thead, Tbody, etc.) |
| `@patternfly/react-icons` | Atoms (Icon wrapper) |
| `@patternfly/chatbot` | Organisms (Chatbot, Message, etc.) |
| `@patternfly/react-code-editor` | Organisms |
| `@patternfly/react-log-viewer` | Organisms |
| `@patternfly/react-topology` | Organisms |
| `@patternfly/react-drag-drop` | Molecules |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes during migration | Migrate incrementally, keep old imports working until page is fully converted |
| Performance regression (runtime loading) | Lazy load systems, code split, preload active system |
| Missing component mappings | Use fallback components, log warnings in dev |
| CSS conflicts between systems | Complete CSS replacement, namespace styles |
| Complex PF-specific features | Allow direct PF imports for truly unique components (documented exceptions) |

---

## Success Criteria

1. ✅ Application runs with PatternFly through the abstraction layer
2. ✅ All pages render correctly after migration
3. ✅ Design system can be switched at runtime via Settings
4. ✅ User's `custom.css` applies across any design system
5. ✅ No significant performance regression
6. ✅ Developer experience is clean (simple imports, good errors)
7. ✅ Token system provides consistent theming

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Create detailed task breakdown** in `.apollo/tasks/`
3. **Begin Phase 1** implementation
4. **Iterate** based on learnings from initial atoms

---

*This document should be used by Claude 4.5 Opus (or equivalent) as the authoritative guide for implementing the design system abstraction architecture.*
