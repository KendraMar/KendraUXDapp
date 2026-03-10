# Design History

## 2026-02-07

### [Addition] External service integrations
- Integrated Slack, Jira, GitLab, Figma, Google Calendar, Confluence, and RSS
- Each integration has a dedicated page in the UI and API routes on the backend
- API responses cached locally in `data/cache/` for performance

### [Decision] Per-integration route architecture
- Each integration gets its own Express route file in `server/routes/`
- Keeps integration logic isolated and independently maintainable

### [X-Integration] Slack integration
- Displays channels, messages, and supports search across Slack workspace

### [X-Integration] Jira integration
- Task and issue management integration with project browsing

### [X-Integration] GitLab integration
- Repository browsing and code integration

### [X-Integration] Figma integration
- Design file browsing and preview

### [X-Integration] Google Calendar integration
- Calendar event display and scheduling awareness

### [X-Integration] Confluence/Wiki integration
- Wiki page browsing and content display

### [X-Integration] RSS feed aggregation
- News and content aggregation from configured feeds
