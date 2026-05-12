---
quick_id: 260512-wda
slug: add-package-readmes-bump-publishable-pac
status: complete
completed: 2026-05-12
---

# Quick Task Summary: Package READMEs and 0.1.0 Publish Prep

## Completed

- Added package-local README files for:
  - `@aredtech/osm-indoor-edit`
  - `@aredtech/osm-indoor-edit-leaflet`
  - `@aredtech/osm-indoor-edit-maplibre`
- Bumped the three public package manifests to `0.1.0`.
- Updated the core SDK exported `version` constant to `0.1.0`.
- Added GitHub repository, homepage, and issue metadata to each public package manifest.
- Verified release readiness and npm package contents.

## Verification

- `pnpm install --lockfile-only`
- `pnpm build`
- `pnpm release:dry-run`
- `npm --cache /private/tmp/osm-indoor-npm-cache pack --dry-run --json` for each public package

## Notes

The npm pack checks confirmed each public package includes `README.md`.
