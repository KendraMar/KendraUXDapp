# Design History

## 2026-02-07

### [Addition] Kubernetes cluster management app
- Modular app in `data/apps/kubernetes/` for cluster management and resource exploration
- Supports browsing resources by type, namespace, and name
- Built as a self-contained modular app using the app registry system

### [Decision] Modular app architecture
- Built as a self-contained app in `data/apps/` to demonstrate the pluggable architecture
- Can be removed entirely by deleting the `data/apps/kubernetes/` folder
