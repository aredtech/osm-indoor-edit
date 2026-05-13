---
quick_id: 260513-j8h
slug: expand-curated-osminedit-preset-groups-a
status: planned
created: 2026-05-13
---

# Quick Task: Expand Curated OsmInEdit Preset Groups and Category Browser

## Goal

Support all OsmInEdit top-level preset groups visible in the user's screenshot with curated built-in presets, and update Leaflet/MapLibre examples to show host-owned category/subcategory browsing from SDK `groupPath` data.

## Scope

- Add representative presets for: Barriers, Transport, Facilities, Sports, Man Made, Craft.
- Keep existing Building structure, Furniture, Shops, Offices coverage.
- Add tests proving all screenshot top-level groups exist and nested browsing works.
- Update examples to include a category selector and preset selector driven by `groupPath`.
- Keep all UI in `examples/*`, not SDK packages.

## Tasks

1. RED: add preset catalog tests for top-level groups, nested browse paths, and representative presets.
2. GREEN: expand `preset-data.ts` with curated group coverage and icon metadata.
3. RED/GREEN: update Leaflet and MapLibre examples to use category-driven host-owned preset browsing.
4. Update docs to mention curated groups and category browsing.
5. Verify with unit tests, typecheck, example builds, E2E, and release dry-run.

## Verification

- `pnpm test -- --run packages/core/test/presets.test.ts`
- `pnpm typecheck`
- `pnpm build:examples`
- `pnpm test:e2e`
- `pnpm release:dry-run`
