# Deploying to GitHub Pages

This app can be deployed as a static prototype to GitHub Pages.

## Setup

1. **Enable GitHub Pages** in your repo:
   - Go to **Settings** → **Pages**
   - Under "Build and deployment", set **Source** to **GitHub Actions**

2. **Push to main** — the workflow runs automatically on push to `main`, or trigger it manually from the **Actions** tab.

## URL

After deployment, the app will be available at:

**https://kendramar.github.io/KendraUXDapp/**

## Notes

- This deploys the **frontend only** (static build). API features (Jira, slides, etc.) will not work without a backend.
- The workflow builds from the `apollo` folder and deploys the `dist` output.
