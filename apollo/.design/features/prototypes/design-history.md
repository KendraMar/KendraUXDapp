# Design History

## 2026-02-07

### [Addition] Prototypes viewer with context sidebar
- HTML prototypes served from `data/prototypes/` and rendered in an iframe viewer
- Context sidebar displays design metadata from `.design` and `.apollo` folders
- Discussion panel for per-prototype conversations

### [Decision] Context sidebar approach
- Chose a split-pane layout with prototype on the left and collapsible context panel on the right
- Context panel pulls from design history, stakeholders, and related artifacts
