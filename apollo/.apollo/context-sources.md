# Context Sources

External resources and references relevant to Apollo development.

---

## Documentation

source: docs/
- title: Local Documentation
- description: Project documentation including architecture, design principles, and quickstart guides

source: docs/architecture/
- title: Architecture Documentation
- description: Detailed documentation of Apollo's architecture including components, routing, API endpoints

---

## Repositories

source: https://github.com/organization/apollo
- title: Apollo Repository
- description: Main repository for Apollo development

---

## Related Projects

source: /Users/abraren/acorn/local/code/uxd-prototypes/rhoai/.design
- title: RHOAI Prototypes .design folder
- description: Reference implementation of .apollo folder structure used in RHOAI prototypes (uses .design naming)

---

## Integrations

The following external services are integrated with Apollo:

### Confluence
- Used for Wiki content display
- API integration in `server/routes/confluence.js`

### Jira
- Task management integration
- API integration in `server/routes/jira.js`

### Slack
- Message and channel integration
- API integration in `server/routes/slack.js`

### GitLab
- Repository and code integration
- API integration in `server/routes/gitlab.js`

### Figma
- Design file integration
- API integration in `server/routes/figma.js`

### Google Calendar
- Calendar integration
- API integration in `server/routes/google.js`

### RSS Feeds
- News and content aggregation
- API integration in `server/routes/rss.js`

---

## Design Resources

### PatternFly
source: https://www.patternfly.org/
- title: PatternFly Design System
- description: UI component library used by Apollo

### PatternFly AI
source: https://www.patternfly.org/ai-components/
- title: PatternFly AI Components
- description: AI-specific components including Chatbot, Assistant

---

## Configuration Examples

source: examples/config.example.json
- title: Configuration Example
- description: Example configuration file for Apollo setup

source: examples/spaces.example.json
- title: Spaces Example
- description: Example spaces configuration

---

## Adding New Sources

When adding new context sources, follow this format:

```markdown
source: {url or path}
- title: {Human-readable title}
- description: {Brief description of what this source contains}
- type: {optional: slack | figma | gdrive | jira | repository | documentation}
- last_updated: {optional: YYYY-MM-DD}
```
