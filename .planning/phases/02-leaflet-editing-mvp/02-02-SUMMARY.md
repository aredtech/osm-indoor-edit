# Plan 02-02 Summary: Drawing Workflows

**Phase:** 02 - Leaflet Editing MVP  
**Plan:** 02-02 - Drawing workflows for room, corridor, and POI  
**Status:** Complete  
**Completed:** 2026-05-12  

## Outcome

Implemented host-controlled room, corridor, and POI drawing with level-aware tags, typed drawing errors, primitive creation, draft cleanup, Leaflet temporary visuals, and export proof tests.

## Requirements Completed

- API-03: Host APIs now start, finish, and cancel drawing.
- DRAW-01 through DRAW-06: Draft clicks, temporary visuals, finish/cancel, and invalid finish behavior are covered.
- INDOOR-01 through INDOOR-03: New rooms, corridors, and POIs receive level-aware minimum indoor tags.
- ADAPT-02: Leaflet adapter renders SDK-owned draft vertices, lines, and polygon previews.

## Files Changed

- `vitest.config.ts`
- `packages/core/src/drawing.ts`
- `packages/core/src/editor.ts`
- `packages/core/src/errors.ts`
- `packages/core/src/index.ts`
- `packages/core/test/drawing.test.ts`
- `packages/core/test/editor-drawing.test.ts`
- `packages/core/test/editor.test.ts`
- `packages/core/test/fake-adapter.test.ts`
- `packages/leaflet/src/leaflet-adapter.ts`
- `packages/leaflet/test/leaflet-drawing.test.ts`

## Commits

- `aa7ec13 feat(02-02): add drawing helpers and errors`
- `d0bc350 feat(02-02): implement editor drawing lifecycle`
- `38a0b56 feat(02-02): render Leaflet draft drawing visuals`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cross-package Vitest imports resolved stale dist output**
- **Found during:** Task 3 (Leaflet drawing visuals)
- **Issue:** `@osminedit-lib/core` resolved through the package `dist` entry during Vitest, so Leaflet tests saw the old unsupported `startDraw` implementation.
- **Fix:** Added workspace source aliases to `vitest.config.ts`.
- **Files modified:** `vitest.config.ts`
- **Verification:** Leaflet drawing tests passed after aliasing.
- **Committed in:** `38a0b56`

---

**Total deviations:** 1 auto-fixed blocking test integration issue.  
**Impact on plan:** No scope expansion; tests now exercise source code consistently across workspace packages.

## Issues Encountered

- Existing fake adapter lifecycle tests needed to account for the editor's new adapter event subscription/unsubscription calls.
- The planned Vitest command with `-- --runInBand ...` exits 0, but Vitest runs the configured package test suite instead of filtering to only the listed files.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- --runInBand packages/core/test/drawing.test.ts packages/core/test/editor-drawing.test.ts packages/leaflet/test/leaflet-drawing.test.ts` passed: 11 files, 47 tests.
- `rg "DrawingIntegrityError|drawingCancelled|drawingFinished" packages/core/src packages/core/test` found drawing behavior.
- `rg "showTemporaryFeature|clearTemporaryFeature|Polygon" packages/leaflet/src packages/leaflet/test` found Leaflet draft visuals.

## Self-Check: PASSED

Wave 2 provides a working drawing vertical slice: host APIs control drawing, Leaflet clicks update SDK draft visuals, finish commits OsmInEdit primitives, and cancel/error paths avoid partial committed data.
