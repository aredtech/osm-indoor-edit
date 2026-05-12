# Plan 02-03 Summary: Selection And Editing

**Phase:** 02 - Leaflet Editing MVP  
**Plan:** 02-03 - Selection, vertex handles, geometry editing, and deletion  
**Status:** Complete  
**Completed:** 2026-05-12  

## Outcome

Added editable committed features: users can select features, update tags, move vertices, insert midpoint vertices, delete vertices through host API, move/delete whole features, and keep exported primitives synchronized.

## Requirements Completed

- API-04: Editor exposes tag, selection, delete, vertex, and feature movement APIs.
- EDIT-01 through EDIT-07: Selection, handle movement, midpoint insertion, vertex deletion, feature movement/deletion, tag updates, and primitive synchronization are implemented.
- ADAPT-02: Leaflet committed geometry, selected outlines, vertex handles, midpoint handles, and edit event translation are covered.

## Files Changed

- `packages/core/src/editing.ts`
- `packages/core/src/editor.ts`
- `packages/core/src/feature-store.ts`
- `packages/core/src/index.ts`
- `packages/core/src/primitive-store.ts`
- `packages/core/test/editor-editing.test.ts`
- `packages/core/test/fake-adapter.test.ts`
- `packages/core/test/primitive-store.test.ts`
- `packages/leaflet/src/leaflet-adapter.ts`
- `packages/leaflet/test/leaflet-editing.test.ts`

## Commits

- `70eb6d5 feat(02-03): add primitive editing mutations`
- `1561613 feat(02-03): implement editor geometry editing`
- `58b3a70 feat(02-03): render Leaflet editing handles`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Feature records needed renderer-neutral coordinates**
- **Found during:** Task 3 (Leaflet committed feature rendering)
- **Issue:** `FeatureRecord` only exposed primitive references, so renderer adapters could not render committed geometry from the contract.
- **Fix:** Added optional `coordinates` to `FeatureRecord` and hydrated coordinates from `PrimitiveStore` before adapter commits/updates.
- **Files modified:** `packages/core/src/feature-store.ts`, `packages/core/src/editor.ts`
- **Verification:** Leaflet editing tests render committed/selected geometry and handles.
- **Committed in:** `58b3a70`

---

**Total deviations:** 1 auto-fixed missing contract detail.  
**Impact on plan:** Strengthened the adapter contract without introducing Leaflet into core.

## Issues Encountered

- Existing tests that assumed two-node `indoor=room` ways were updated because closed room/corridor ways now enforce at least 3 distinct nodes.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- --runInBand packages/core/test/editor-editing.test.ts packages/leaflet/test/leaflet-editing.test.ts` passed: 13 files, 63 tests.
- `rg "deleteVertex|moveVertex|insertVertex|moveFeature" packages/core/src packages/core/test` found edit APIs/tests.
- `rg "featureClick|vertexDrag|midpointClick|featureDrag" packages/core/src packages/leaflet/src packages/leaflet/test` found event wiring.

## Self-Check: PASSED

Wave 3 makes committed Leaflet features editable while keeping core primitive data and OsmInEdit export synchronized.
