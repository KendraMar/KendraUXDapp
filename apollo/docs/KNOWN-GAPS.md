# Known Gaps & Limitations

This document tracks known gaps, limitations, and areas for improvement in the Apollo project. It's meant to be transparent about current shortcomings and help prioritize future work.

---

## Security & Dependencies

### Dependency Vulnerability Scanning

**Status**: Not implemented

There is currently no automated vulnerability scanning for npm dependencies. This means:

- No Dependabot, Snyk, or similar tooling configured
- No automated `npm audit` in CI/CD pipelines
- Manual monitoring required for security advisories
- Potential delays in responding to CVEs in transitive dependencies

**Risk**: A vulnerability in a dependency (e.g., Express, Puppeteer, or any of the ~50 packages) could go unnoticed until manually discovered.

**Mitigation options to explore**:
- Enable GitHub Dependabot alerts
- Add `npm audit` to CI pipeline
- Consider Snyk or Socket.dev integration
- Set up automated dependency update PRs

---

## Data & Schema

### Data Structure Versioning

**Status**: Partially implemented

The `.apollo/config.yaml` has a `version: 1` field, but comprehensive versioning is incomplete:

- No migration tooling for schema changes
- No guaranteed backward compatibility between versions
- File formats in `.apollo/` may change without migration paths
- No "1.0 stable" format guarantee yet

**Impact**: Users cannot rely on seamless upgrades. Breaking changes to `.apollo/` formats may require manual data migration.

**Before 1.0 stable release**:
- Define version compatibility policy
- Implement schema migration tooling
- Document breaking changes clearly
- Consider JSON Schema or similar for validation

### Cache Invalidation

**Status**: Basic implementation

The caching system in `data/cache/` lacks:

- No cache versioning
- No automatic invalidation strategies
- No size limits or cleanup policies
- Potential for stale data issues

---

## Testing

### Automated Test Suite

**Status**: Not implemented

As noted in `AGENTS.md`, there is currently no automated test suite:

- No unit tests
- No integration tests
- No end-to-end tests
- No test coverage metrics

**Risk**: Regressions may go unnoticed. Refactoring is higher risk without test safety net.

**Planned approach** (when implemented):
- Jest for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

---

## Authentication & Authorization

### No Authentication Layer

**Status**: Not implemented

The Express server has no authentication:

- All API endpoints are publicly accessible on the local network
- No user sessions or tokens
- No role-based access control
- Assumes trusted local environment

**Current assumption**: Apollo runs locally and is not exposed to untrusted networks.

**If network exposure is needed**:
- Implement authentication middleware
- Add API key or token-based auth
- Consider OAuth for multi-user scenarios

---

## Integrations

### API Error Handling

**Status**: Basic implementation

External API integrations (Jira, Slack, Figma, etc.) have limited error handling:

- Network failures may not gracefully degrade
- Rate limiting not consistently handled
- Token expiration may cause silent failures
- Limited retry logic

### Integration Configuration

**Status**: Manual setup required

Each integration requires manual API token configuration:

- No OAuth flows for easier setup
- Tokens stored in plain text in `data/config.json`
- No token refresh mechanisms
- No validation of token scopes

---

## Performance

### Large Dataset Handling

**Status**: Unknown/Untested

No performance testing has been done for:

- Large numbers of tasks in `.apollo/tasks/`
- Large RSS feed collections
- Many concurrent WebSocket connections
- Large document collections

### Bundle Size

**Status**: Not optimized

The frontend build is not optimized for size:

- No code splitting
- No lazy loading of routes
- All PatternFly components bundled together
- No bundle analysis configured

---

## Documentation

### API Documentation

**Status**: Minimal

While architecture docs exist, API documentation is limited:

- No OpenAPI/Swagger specification
- Endpoint documentation is informal
- No request/response examples
- No versioning strategy for API

### User Documentation

**Status**: Developer-focused only

Current documentation assumes developer usage:

- No end-user guides
- No video tutorials
- No troubleshooting guides
- No FAQ

---

## Accessibility

### WCAG Compliance

**Status**: Partially covered by PatternFly

PatternFly provides good baseline accessibility, but:

- No accessibility audits performed
- Custom components may have gaps
- Keyboard navigation not fully tested
- Screen reader testing not done

---

## Infrastructure

### Deployment

**Status**: Local development only

No production deployment infrastructure:

- No Docker configuration
- No Kubernetes manifests
- No CI/CD pipeline
- No environment configuration management

### Monitoring & Observability

**Status**: Not implemented

No monitoring infrastructure:

- No logging framework (beyond console.log)
- No error tracking (Sentry, etc.)
- No metrics collection
- No health check endpoints

---

## Contributing to This Document

When you discover a new gap or limitation:

1. Add it under the appropriate category (or create a new one)
2. Include current **Status**
3. Describe the **Impact** or **Risk**
4. Note any **Mitigation options** if known
5. Update this document as gaps are addressed

---

*Last updated: 2026-01-22*
