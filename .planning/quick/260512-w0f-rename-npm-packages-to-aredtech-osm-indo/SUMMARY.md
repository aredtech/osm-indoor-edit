---
quick_id: 260512-w0f
slug: rename-npm-packages-to-aredtech-osm-indo
status: complete
completed: 2026-05-12T17:37:00Z
---

# Quick Task Summary: Rename npm packages to @aredtech scope

Renamed the public package architecture to:

- `@aredtech/osm-indoor-edit`
- `@aredtech/osm-indoor-edit-leaflet`
- `@aredtech/osm-indoor-edit-maplibre`

Private example packages were renamed to matching `@aredtech/osm-indoor-edit-example-*` package names so root scripts and Playwright web servers resolve consistently.

## Verification

- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build:examples`
- `pnpm check:core-boundary`
- `pnpm release:dry-run`

All passed.
