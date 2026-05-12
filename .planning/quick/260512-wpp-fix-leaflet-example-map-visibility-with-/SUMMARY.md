---
quick_id: 260512-wpp
slug: fix-leaflet-example-map-visibility-with-
status: complete
completed: 2026-05-12
---

# Quick Task Summary: Fix Leaflet Example Map Visibility

## Completed

- Added an OpenStreetMap tile layer to the Leaflet example.
- Centered the initial Leaflet view on the bundled sample data.
- Recenters the map when the sample is loaded.
- Added an e2e assertion that the map container and tile layer are present.

## Verification

- `pnpm --filter @aredtech/osm-indoor-edit-example-leaflet build`
- `pnpm test:e2e:leaflet`
