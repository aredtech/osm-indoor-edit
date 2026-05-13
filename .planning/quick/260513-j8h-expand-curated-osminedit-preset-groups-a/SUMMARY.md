---
quick_id: 260513-j8h
slug: expand-curated-osminedit-preset-groups-a
status: complete
completed: 2026-05-13
---

# Quick Task Summary: Expand Curated OsmInEdit Preset Groups

## Completed

- Expanded the built-in preset catalog to cover the OsmInEdit-style top-level groups shown in the category browser.
- Added representative presets and icons for Barriers, Transport, Facilities, Sports, Man Made, Offices, Shops, and Craft paths.
- Updated Leaflet and MapLibre examples with host-owned Category and Subcategory controls backed by `groupPath` and `browsePresets()`.
- Documented the available built-in groups and the SDK/host boundary for grouped preset browsing.

## Verification

- `pnpm test -- --run packages/core/test/presets.test.ts`
- `pnpm typecheck`
- `pnpm --filter @aredtech/osm-indoor-edit-example-leaflet build`
- `pnpm --filter @aredtech/osm-indoor-edit-example-maplibre build`
- `pnpm test:e2e:leaflet`
- `pnpm test:e2e:maplibre`
- `pnpm test:e2e`
- `pnpm release:dry-run`
