# Design History

## 2026-02-07

### [Addition] Community catalog app
- Modular app for browsing and installing integrations, agents, and applications
- Supports search, filtering, and detail views for catalog items

### [Decision] Modular app architecture for catalog
- Built as a self-contained app in `data/apps/catalog/` using the modular app system
- Auto-registers routes and navigation without modifying core files
