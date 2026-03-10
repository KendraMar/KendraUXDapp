# Applications

An Apollo application is a self-contained unit of functionality that users can install, configure, and compose into their personal Apollo environment. Applications are the primary way that capabilities are added to Apollo—whether built by the core team, shared through the Catalog, or home-cooked by a barefoot developer for their own needs.

Each application is composed of two fundamental layers: a **data model** and a **user interface**. Beyond these, an application can expose a set of **integration hooks** that allow it to participate in the broader Apollo environment—appearing in navigation, surfacing entities in the Omnibar, contributing actions to the masthead, providing agents, and more.

## Data Model

Every application defines a data model: the structured representation of the information it manages. This could be tasks, bookmarks, Kubernetes resources, RSS feeds, calendar events, or any other domain-specific data.

The data model is the foundation. It determines what the application stores, how it's organized, and what operations can be performed on it. Because Apollo is local-first and file-based, application data should be stored in open, human-readable formats (JSON, Markdown, structured files) that are inspectable, portable, and accessible to AI agents without special tooling.

The data model exists independently of the user interface. This separation is important—it means the same data can be presented, queried, and manipulated through multiple surfaces: the application's own UI, the Omnibar, agents, other applications, or direct file access.

## User Interface

An application provides a **default user interface**—a template, a starting point, an initial graphical representation of its data and functionality. This is not a prescriptive, locked-down interface. It is a suggestion.

This distinction is core to Apollo's philosophy. The application author provides the UI they think works best: the layout, the components, the interactions, the visual design. But the user retains full authority to reshape it. Through custom CSS, users can override styles, hide elements entirely, rearrange visual hierarchies, or fundamentally change the look and feel of the application. The application provides the structure; the user owns the presentation.

This means application authors should think of their UI as a **remix-ready template**. Design it well—use good defaults, follow PatternFly conventions, make it beautiful and functional out of the box. But build it with the understanding that users may change anything about how it looks and behaves. They may hide your sidebar. They may restyle your cards. They may strip it down to the bare essentials or layer on their own aesthetic.

This paradigm—where the application provides a starting point but cannot fully control the user's experience—reflects the future we're building toward. Software that adapts to people, not the other way around.

## Integration Hooks

Beyond its own data model and UI, an application can expose a set of **integration hooks**—APIs and extension points that allow it to participate in the broader Apollo environment. These hooks make the application a citizen of the Apollo ecosystem rather than an isolated page.

Each hook is optional. An application can expose all of them, some of them, or none beyond its basic page. The user controls which hooks are active through Apollo's customization surfaces.

### Navigation Items

An application can register a **navigation item** in the left sidebar. This makes the application accessible from Apollo's primary navigation, appearing alongside core pages and other installed apps.

Exposing a nav item doesn't mean it automatically appears in every user's sidebar. Instead, the application makes itself *available* as an option in the sidebar customization screen. Users choose which nav items to show, in what order, and with what grouping. The application provides the option; the user decides whether to use it.

This is the lightest integration hook—simply declaring "I exist, and here's how to get to me."

### Omnibar Entities

An application can surface **entities in the Omnibar**. This means the application's data becomes searchable and actionable from Apollo's universal input surface.

For example, a tasks application might surface individual tasks so that typing in the Omnibar can find, reference, or act on specific tasks. A contacts application might surface people. A bookmarks application might surface saved links. Whatever entities the application manages, it can make them discoverable through the Omnibar.

This integration makes the application's data a first-class participant in Apollo's "one bar to rule them all" interaction model. Users don't need to navigate to the application to find or act on its data—they can reach it from wherever they are.

### Action Menu Buttons

An application can offer to add a **button to the Actions menu** in the top-right corner of the Apollo masthead. This is the area for quick-access actions that should be reachable from anywhere in the interface, regardless of which page is active.

Like navigation items, action buttons are not forced upon the user. The application declares that it can provide an action button—what it does, what icon it uses, what happens when clicked—and this option becomes available in the Actions menu customization screen. Users choose which action buttons to display.

This hook is appropriate for actions that are genuinely global: starting a recording, toggling a mode, launching a quick-capture flow, or triggering a frequently-used workflow.

### Custom Integration Points

The integration hook system is designed to be extensible. As Apollo evolves, new hook types will emerge—the ability to contribute widgets to a dashboard, register keyboard shortcuts, add context menu items, provide notification sources, or extend other applications' interfaces. The pattern remains consistent: the application declares what it can provide, and the user decides what to activate.

## Integrations

Applications can interact with external services through Apollo's **integration system**. This works in two directions: an application can *provide* a new integration, or it can *request access* to an existing one.

### Providing Integrations

An application can introduce a **new integration** to Apollo—a connection to an external service that doesn't yet have one. For example, an application might provide a Slack integration, a GitHub integration, a Figma integration, or a connection to any other service or API.

When an application provides an integration, it defines the connection parameters, authentication flow, available API endpoints, and the tools that other applications (and agents) can use to interact with that service. The integration becomes part of Apollo's shared integration layer, potentially usable by other applications and agents beyond the one that provided it.

### Requesting Integrations

More commonly, an application **requests access** to integrations that already exist in the user's Apollo environment. This is a permission system analogous to how mobile operating systems handle app permissions on iOS or Android.

When an application needs to interact with an external service—say it wants to read Slack messages, create Jira tickets, or access calendar events—it declares these requirements as **integration requests**. Each request specifies:

- **Which integration** the application wants to access (e.g., Slack, Jira, Google Calendar)
- **What capabilities** it needs (e.g., read messages, write messages, list channels)
- **Why** it needs them (a human-readable explanation of what the application will do with this access)

The user reviews these requests and can **approve or deny** each one individually, on a per-application basis. An application might be granted read access to Slack but denied write access. It might be allowed to read Jira tickets but not create them. The granularity is at the capability level, not all-or-nothing.

This permission model ensures that:

- Users understand exactly what each application can do with their connected services
- Applications cannot silently access integrations without explicit user consent
- Permissions can be reviewed, modified, or revoked at any time
- Trust is established incrementally—an application earns access rather than assuming it

The experience should feel familiar to anyone who has used a mobile app for the first time and been asked "Allow this app to access your contacts?" The same principle applies here, extended to the full range of integrations Apollo supports.

## Agents

An application can provide one or more **agents**—AI-powered assistants with specific capabilities, knowledge, or behaviors tailored to the application's domain.

For example, a project management application might provide an agent that can triage incoming tasks, summarize project status, or suggest priority adjustments. A design application might provide an agent that can generate layout suggestions or critique visual hierarchy. A communication application might provide an agent that can draft messages or summarize conversation threads.

### Opt-In by Default

Agents provided by an application are **not automatically activated**. They are made available to the user as options that can be turned on or off. This is a deliberate design choice rooted in Apollo's principle that nothing happens without the user's intent.

When an application is installed, its agents appear in the agent management interface as available but inactive. The user can review what each agent does, what capabilities it has, and what data it can access, then choose to enable the ones they want. Agents never auto-load or start operating without explicit user permission.

This opt-in model applies equally to the Omnibar—enabled agents become available for `@mention` in the Omnibar, but only after the user has activated them. The user maintains full control over which AI participants are part of their workflow.

### Agent Capabilities

Each agent declares its capabilities: what it can do, what tools it has access to, what data it can read or modify. This declaration serves both as documentation for the user and as a permission boundary for the agent itself. An agent cannot exceed its declared capabilities, and the user can further restrict them.

## Themes

An application can optionally provide **themes**—visual styles, color schemes, or aesthetic packages that affect the application's appearance or potentially Apollo's global appearance.

This capability is still being defined. The vision is that applications can contribute to the visual identity of the Apollo environment, offering users more choices for how their workspace looks and feels. How exactly themes are scoped (application-level vs. global), how they interact with custom CSS overrides, and what the theme API looks like are open questions for future design work.

## Permissions Model Summary

The permissions and activation model across all application capabilities follows a consistent philosophy:

| Capability | Default State | User Control |
|-----------|---------------|--------------|
| Navigation item | Available but not shown | User adds to sidebar via customization |
| Omnibar entities | Available but not active | User enables in Omnibar settings |
| Action menu button | Available but not shown | User adds via Actions menu customization |
| Integration access | Not granted | User approves/denies per capability |
| Agents | Available but inactive | User enables individually |
| Themes | Available but not applied | User selects in theme settings |

The pattern is always the same: **the application declares what it can provide; the user decides what to activate.** Nothing is imposed. Everything is offered.

## Relationship to Design Principles

The application model is a direct expression of Apollo's core design principles:

- **User Control** — Applications offer capabilities; users choose which to activate. Permissions, navigation, agents, and UI are all under user authority. The application suggests; the user decides.

- **Multi-Modal & Fully Customizable** — The UI is a template, not a prescription. Custom CSS can reshape anything. Every integration hook is optional and user-controlled.

- **Local-First** — Application data lives locally in open formats. Agents run locally. No application can force data to leave the user's machine without explicit permission.

- **AI as Augmentation** — Agents are opt-in participants, not autonomous actors. They operate within declared capability boundaries and only when the user has explicitly enabled them.

- **Home-Cooked Software & Barefoot Developers** — The application model is designed so that anyone can create an app for their own needs or their community's needs. The Catalog enables sharing and remixing. The barrier to creation is intentionally low.

- **Composable Artifacts** — Applications and their data participate in Apollo's broader ecosystem. Entities surface in the Omnibar. Agents can reason about data across applications. Nothing exists in isolation unless the user wants it to.

## Current State vs. Vision

Today, Apollo applications are implemented as modular folders in `data/apps/` with a manifest file, page components, and optional API routes. The current system supports navigation items and frontend routes with auto-discovery at build time.

The full vision described in this document—granular integration permissions, agent provisioning, Omnibar entity registration, action menu hooks, theme contributions, and the broader permission model—represents where the application architecture is heading. Not all of these capabilities are implemented yet, but they inform how the system is being designed and extended.

As Apollo evolves, the application model will grow to support each of these capabilities, always guided by the principle that applications provide options and users make choices.
