# The Omnibar

The Omnibar is Apollo's unified input surface—a single bar at the top of the interface that serves as search, command palette, agent prompt, contextual switcher, and conversational interface all at once. It is the primary way you interact with Apollo and the agents, people, and tools connected to it.

## Design Philosophy

### One Bar to Rule Them All

Most applications scatter interaction across dozens of surfaces: a search box here, a command palette there, a chat window somewhere else, a navigation menu over there. Each has its own syntax, its own keyboard shortcuts, its own mental model. The cognitive overhead of remembering where to go and how to speak to each surface is real and cumulative.

The Omnibar collapses all of this into a single input. You don't need to decide whether you're "searching" or "commanding" or "chatting" or "navigating." You just type. The system interprets your intent from context—what you've typed, who you've mentioned, what page you're on, what agent is active—and does the right thing.

This isn't a search bar that also does other things. It's a **unified interaction surface** that treats every input as a potential action, query, navigation, or conversation. The distinction between "searching for something" and "asking an agent to do something" is artificial. The Omnibar erases that line.

### Your Language, Your Way

The Omnibar is not prescriptive about how you communicate with it. There are sensible defaults—`@` to mention a person or agent, `#` to reference an app or page—but these are starting points, not constraints.

The deeper vision is that the Omnibar becomes **your** interface, shaped by how **you** think and work. You should be able to define your own shorthand, your own code words, your own command vocabulary. If you prefer `/send` over the default way of dispatching a message, you should be able to set that up. If you want a single keystroke to surface a specific dropdown or trigger a specific workflow, that should be yours to configure.

This is the difference between a tool that teaches you its language and a tool that learns yours. The Omnibar aspires to the latter. It's a programmable surface—not in the sense that you need to write code (though you can), but in the sense that you can bend it to match your mental model rather than conforming to someone else's.

Eventually, an Omnibar settings page will let you customize commands, shortcuts, triggers, and dropdown behaviors. You'll be able to remap, rename, and rewire the interaction vocabulary to whatever feels natural to you.

### Context-Aware by Default

The Omnibar is aware of where you are. Its placeholder text rotates based on the current page, the active agent, and what actions are available in your current context. On the Tasks page, it suggests task-related actions. On the Feed page, it hints at content queries. When an agent is selected, it incorporates the agent's name and capabilities into its suggestions.

This isn't just cosmetic. Context-awareness means the Omnibar can interpret the same input differently depending on where you are and what you're doing. The system uses your current state as implicit context for every interaction, reducing the amount you need to explicitly specify.

### One Prompt, Many Outcomes

The most powerful aspect of the Omnibar is that a single input can produce radically different outcomes depending on its content and context:

- **Type a question with no mentions** and the active agent answers it, drawing on whatever context and capabilities it has.
- **Type `@Sarah` followed by a message** and it becomes a Slack message to your colleague Sarah, sent on your behalf.
- **Type `#tasks create a new task for...`** and it navigates to or acts within the Tasks app.
- **Type a natural language description of a page you want** and an agent might generate an entire prototype or layout for you.
- **Type `@Claude Code refactor the auth module`** and it dispatches a coding task to the Claude Code agent.
- **Mention multiple people and an agent** and the Omnibar understands you're coordinating across humans and AI in a single action.

The Enter key doesn't always mean "search." It means "do what I mean." The Omnibar parses your intent from the structure of your input—the mentions, the context, the active agent, the current page—and routes your action accordingly.

This is fundamentally different from a traditional command palette where each command is a discrete, predefined action you select from a list. The Omnibar operates on **natural language intent**, augmented by structured tokens (mentions, app references) that help it understand exactly what you want.

### Rich Input, Not Just Text

The Omnibar supports inline chips—visual tokens that represent structured references within your input. When you type `@` and select a person, their name appears as a styled chip with their avatar. When you type `#` and select an app, it becomes a chip with the app's icon. These chips are first-class elements of your input, not decorations. They carry semantic meaning that the system uses when interpreting your intent.

You can mix free text with chips freely. A single input might contain multiple people mentions, an app reference, and a natural language instruction—all composed inline in the same bar.

### Agents as First-Class Citizens

The Omnibar treats AI agents with the same interaction model as human collaborators. You `@mention` an agent the same way you `@mention` a colleague. The distinction between asking a person to do something and asking an agent to do something is minimal by design. This reflects Apollo's philosophy that AI augments rather than replaces human workflows—agents are participants in your work, not separate tools you context-switch into.

The assistant selector next to the Omnibar lets you set a default agent for the current session. Any unaddressed query goes to this agent. But you can always override by explicitly mentioning a different agent inline. This gives you both a quick default and precise control.

### Conversational Memory

When you submit a query and receive a response, the Omnibar maintains conversational context. Follow-up inputs are understood in the context of what came before. This means you can have a multi-turn conversation with an agent directly from the Omnibar without opening a separate chat interface. The conversation docks to the sidebar, keeping the main content area unobstructed.

## Current Capabilities

### Triggers and Mentions

| Trigger | Action |
|---------|--------|
| `@` | Opens a dropdown of people and agents to mention |
| `#` | Opens a dropdown of apps and pages to reference |
| `Enter` | Submits the current input to the active agent |
| `Backspace` (on empty input) | Removes the last chip |
| `Escape` | Closes any open dropdown |
| `Arrow keys` | Navigate dropdown options |
| `Tab` | Select highlighted dropdown option |

### Supported Agents

Queries can be routed to different backend agents, each with different capabilities:

- **Claude Code** — coding tasks via Claude Code CLI (streaming)
- **Cursor CLI** — IDE-integrated coding assistance (streaming)
- **Kagi** — web search via Kagi API
- **Other agents** — extensible agent system for future integrations

### Contextual Placeholders

The placeholder text in the Omnibar rotates every 45 seconds and adapts to:

- The current page/route
- The currently selected agent
- General feature hints (mentioning people, referencing apps, voice input)

This serves as passive onboarding—users discover capabilities through the placeholder suggestions without needing to read documentation.

## Future Vision

### Fully Customizable Command Vocabulary

An Omnibar settings page will allow users to:

- **Remap triggers** — Change `@` and `#` to other characters or key combinations
- **Define custom commands** — Create personal shorthand for frequent actions
- **Configure shortcuts** — Bind keyboard shortcuts to specific Omnibar behaviors
- **Customize dropdowns** — Control what appears in mention and app dropdowns, and in what order
- **Create macros** — Define multi-step actions triggered by a single command

### Extensible Action System

Third-party apps and user-created applets will be able to register their own Omnibar actions. An app that manages deployments could register a `/deploy` command. A personal CRM applet could add `@contact` as a trigger. The Omnibar becomes a universal dispatch surface for the entire Apollo ecosystem.

### Learning and Adaptation

Over time, the Omnibar could learn from your usage patterns—surfacing frequently mentioned people first, prioritizing apps you use most, and even suggesting actions based on time of day, current project, or recent activity patterns. All of this would happen locally, consistent with Apollo's privacy-first architecture.

### Voice and Multimodal Input

The Omnibar already includes a microphone button for voice input. The vision extends to full multimodal interaction—speak a command, attach a file, draw an annotation on screen, or combine all three in a single interaction. The Omnibar is the convergence point for all input modalities.

## Relationship to Design Principles

The Omnibar is a direct expression of several core Apollo design principles:

- **User Control** — You shape the Omnibar to match your workflow, not the other way around
- **Multi-Modal & Fully Customizable** — Every input method is supported; every behavior is configurable
- **Signal Over Noise** — One surface instead of many, reducing cognitive overhead and context-switching
- **AI as Augmentation** — Agents are participants you invoke and direct, not autonomous systems that act without your intent
- **Home-Cooked Software** — The Omnibar's extensibility means barefoot developers can add their own commands and integrations, making Apollo's primary interaction surface as personal and purpose-built as the rest of the application
