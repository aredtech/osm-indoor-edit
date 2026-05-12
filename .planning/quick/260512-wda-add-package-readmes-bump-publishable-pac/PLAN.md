---
quick_id: 260512-wda
slug: add-package-readmes-bump-publishable-pac
status: in-progress
created: 2026-05-12
---

# Quick Task Plan: Package READMEs and 0.1.0 Publish Prep

## Goal

Prepare the three public npm packages for republish by adding package-local README files, bumping the public package versions to `0.1.0`, and pushing the committed repository to `git@github.com:aredtech/osm-indoor-edit.git`.

## Steps

1. Add README files under `packages/core`, `packages/leaflet`, and `packages/maplibre` so npm package landing pages have package-specific documentation.
2. Bump the three public package manifests from `0.0.0` to `0.1.0` and update the exported core SDK version.
3. Verify build/test/release readiness and npm package contents.
4. Commit the changes, set the requested GitHub remote/branch, and push.
