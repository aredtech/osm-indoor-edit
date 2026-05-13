---
phase: 06-preset-catalog-and-custom-draw-mode
plan: "01"
subsystem: core-api
tags: [presets, catalog, osm-tags, typescript]
requires:
  - phase: 05-examples-docs-and-release-readiness
    provides: release-ready package and example baseline
provides:
  - Typed preset catalog API
  - Curated built-in indoor and common OSM preset data
  - Preset search, browse, match, and tag diff helpers
affects: [core, docs, examples, custom-draw]
tech-stack:
  added: []
  patterns: [immutable catalog snapshots, pure tag diff helpers]
key-files:
  created:
    - packages/core/src/presets.ts
    - packages/core/src/preset-data.ts
    - packages/core/src/preset-icons.ts
    - packages/core/test/presets.test.ts
  modified:
    - packages/core/src/index.ts
key-decisions:
  - "Built-in presets ship as normalized TypeScript data, not runtime XML parsing."
  - "Preset helpers return sparse TagDiff objects so hard preset tags can stay protected."
patterns-established:
  - "Preset catalog instances clone built-ins and returned records to prevent host mutation leaks."
  - "Structural and functional matches are returned in separate ranked buckets."
requirements-completed: [PRESET-01, PRESET-02, PRESET-05]
duration: 10 min
completed: 2026-05-13
---

# Phase 6 Plan 01: Preset Catalog Core Summary

**Headless preset catalog with built-in indoor/common presets, ranked matching, and sparse tag diff helpers**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-13T06:41:07Z
- **Completed:** 2026-05-13T06:51:24Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added the public preset type model and `createPresetCatalog()` helper API.
- Added curated built-in structural and functional presets, including `shop-motorcycle` with point/polygon geometry and OsmInEdit-style fields.
- Added search, browse, host extension/override, structural/functional matching, `buildPresetTags`, `applyPresetFieldValues`, and `createPresetChangeDiff`.

## Task Commits

1. **RED: Preset catalog behavior tests** - `33296b0`
2. **GREEN: Preset catalog implementation** - `bba5f39`

## Files Created/Modified

- `packages/core/src/presets.ts` - Public preset types, catalog instance, search/match helpers, and tag diff helpers.
- `packages/core/src/preset-data.ts` - Curated built-in preset definitions.
- `packages/core/src/preset-icons.ts` - Inline SVG icon metadata for host-rendered preset UIs.
- `packages/core/src/index.ts` - Public export for preset APIs.
- `packages/core/test/presets.test.ts` - Catalog, data, matching, override, and sparse tag diff coverage.

## Decisions Made

- Kept built-in catalog data in TypeScript so the browser package does not need XML parsing.
- Used pure helper functions for tag transformations so editor methods in later plans can wrap them without forcing mutation.
- Kept icon data as optional SVG strings on preset metadata so the host remains responsible for UI rendering.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript rejected shared readonly field constants against mutable field option arrays. Fixed by allowing readonly option/default arrays in the public `PresetField` type, matching the catalog's immutable-data pattern.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `06-02`: the editor can now depend on the preset catalog, compatibility checks, and pure tag diff helpers.

---
*Phase: 06-preset-catalog-and-custom-draw-mode*
*Completed: 2026-05-13*
