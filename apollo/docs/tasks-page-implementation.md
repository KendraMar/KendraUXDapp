# Tasks Page - Jira Integration Summary

## What Was Created

### 1. Tasks Page UI (`src/pages/Tasks.js`)
A complete task management interface similar to the Feed page with:

- **Two-panel layout:**
  - Left panel: Scrollable list of Jira issues (400px width)
  - Right panel: Detailed view of selected issue

- **Header section with:**
  - Page title and description
  - Badge showing total issue count

- **Filtering controls:**
  - Status filter dropdown
  - Priority filter dropdown
  - Both dynamically populated from actual issue data

- **Issue list displaying:**
  - Issue key (clickable)
  - Summary (truncated with ellipsis)
  - Priority, status, and issue type as colored labels
  - Last updated timestamp (relative: "5m ago", "2h ago", etc.)
  - Hover effects and selection highlighting

- **Detail view showing:**
  - Full issue key and summary as title
  - Priority, status, and issue type labels with icons
  - Reporter, assignee, created/updated dates
  - Direct link to view in Jira
  - Full description (formatted)
  - Components (as cyan labels)
  - Labels (as purple labels)
  - Project name

- **Error handling:**
  - Loading spinner while fetching
  - Configuration error state with setup instructions
  - Empty states for no issues or no filtered results

### 2. Server-Side Jira API Integration (`server.js`)

Added complete Jira REST API integration:

- **Configuration loading** from `config.json`
- **HTTPS request handler** with Basic Auth
- **New API endpoint:** `GET /api/jira/issues`
  - Uses JQL query: `assignee = currentUser() ORDER BY updated DESC`
  - Fetches up to 100 most recently updated issues
  - Transforms Jira API response to simplified format
  - Returns structured JSON with issue details

- **Fields fetched:**
  - summary, status, priority, assignee, reporter
  - created, updated, description, issuetype
  - project, components, labels

### 3. Configuration Files

- **`examples/config.example.json`** - Template with placeholder values
- **`config.json`** - Actual config file (gitignored) for user credentials
- **`.gitignore`** - Updated to include `config.json`

### 4. Documentation

- **`JIRA-SETUP.md`** - Complete setup guide with:
  - Step-by-step configuration instructions
  - How to generate Personal Access Token from Red Hat Jira
  - Feature list
  - JQL query explanation
  - Troubleshooting section
  - Security notes

## How It Works

1. **Frontend** (`Tasks.js`) makes request to `/api/jira/issues`
2. **Backend** (`server.js`) reads `config.json` for credentials
3. **Server** makes HTTPS request to `https://issues.redhat.com/rest/api/2/search`
   - Uses Basic Auth with username + token
   - Sends JQL query for current user's assigned issues
4. **Response** is transformed and sent to frontend
5. **Frontend** displays issues in list view
6. **User** can filter by status/priority and click to see details

## User Setup Required

1. Copy `examples/config.example.json` to `data/config.json`
2. Edit `config.json` with:
   - Jira URL: `https://issues.redhat.com`
   - Personal Access Token (from Jira)
   - Username/email
3. Restart the server

## Features

✅ Clean, modern UI matching Feed page design
✅ Real-time Jira integration via REST API
✅ Dynamic filtering (status & priority)
✅ Responsive layout with independent scrolling panels
✅ Detailed issue view with all key information
✅ Direct links to open issues in Jira
✅ Proper error handling and empty states
✅ Secure credential management (gitignored)
✅ Comprehensive documentation

## Technical Details

- Uses PatternFly 6 React components
- Native Node.js `https` module (no external dependencies)
- JQL (Jira Query Language) for flexible querying
- Basic Authentication with Personal Access Token
- JSON configuration (no environment variables needed)
- Follows existing app patterns and conventions


