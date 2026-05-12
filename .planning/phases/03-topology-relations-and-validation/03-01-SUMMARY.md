---
phase: 03-topology-relations-and-validation
plan: "01"
subsystem: core-topology
tags: [typescript, snapping, topology, leaflet]
requires:
  - phase: 02-leaflet-editing-mvp
    provides: renderer adapter projection, drawing lifecycle, primitive-backed features
provides:
  - Renderer-neutral snap candidate scoring
  - Way edge splitting and snap candidate collection
  - Host-enabled draw-time node and edge snapping
  - Leaflet snap indicator visuals
affects: [phase-03, leaflet-adapter, validation, shared-topology]
tech-stack:
  added: []
  patterns: [pure core helpers, optional renderer snap hooks, primitive-first topology mutation]
key-files:
  created:
    - packages/core/src/snapping.ts
    - packages/core/src/topology.ts
    - packages/core/test/editor-snapping.test.ts
    - packages/leaflet/test/leaflet-snapping.test.ts
  modified:
    - packages/core/src/editor.ts
    - packages/core/src/primitive-store.ts
    - packages/core/src/adapter.ts
    - packages/core/src/fake-adapter.ts
    - packages/leaflet/src/leaflet-adapter.ts
    - packages/leaflet/src/styles.ts
key-decisions:
  - "Kept snapping dependency-free for v1; simple scan helpers are enough and avoid exposing spatial-index types."
  - "Draft drawing stores optional primitive node IDs so snapped points can reuse or split real topology at finish time."
patterns-established:
  - "Snapping is explicit and defaults off through EditorOptions/setSnapping."
  - "Renderer snap visuals are optional adapter hooks and not required for headless operation."
requirements-completed: [SNAP-01, SNAP-02, SNAP-03]
duration: 15 min
completed: 2026-05-12
---

# Phase 03 Plan 01: Snapping and Shared-Wall Creation Summary

**Renderer-neutral snapping with shared node reuse, edge splitting, and Leaflet snap indicators**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-12T10:51:00Z
- **Completed:** 2026-05-12T11:06:34Z
- **Tasks:** 4
- **Files modified:** 15

## Accomplishments

- Added `resolveSnapCandidate` for nearest pixel-distance node/edge snapping through adapter projection.
- Added topology helpers and `PrimitiveStore.insertNodeInWayEdge` so edge snapping creates real shared way nodes.
- Wired host-enabled snapping into editor drawing with `setSnapping`/`getSnapping` and optional adapter snap visuals.
- Added Leaflet snap indicator layers and tests proving snap visuals stay separate from draft/committed/selection/handle layers.

## Task Commits

1. **Task 1: Add renderer-neutral snap types and candidate scoring** - `a810545`
2. **Task 2: Add topology helpers for edge splitting and snap candidate collection** - `2261b21`
3. **Task 3: Wire explicit snapping into editor drawing** - `b93efec`
4. **Task 4: Add Leaflet snap indicator visuals** - `e0223bb`

## Files Created/Modified

- `packages/core/src/snapping.ts` - Snap settings, candidate types, and nearest-candidate scoring.
- `packages/core/src/topology.ts` - Primitive element to snap candidate collection.
- `packages/core/src/primitive-store.ts` - Way edge insertion and node reference queries.
- `packages/core/src/editor.ts` - Snapping options, draw-time snap resolution, and shared edge insertion.
- `packages/core/src/adapter.ts` - Optional snap visual hooks.
- `packages/core/src/fake-adapter.ts` - Fake adapter snap call recording.
- `packages/leaflet/src/styles.ts` - Default green snap indicator style.
- `packages/leaflet/src/leaflet-adapter.ts` - Dedicated snap layer rendering and clearing.

## Decisions Made

- No `rbush` dependency was added in this plan; candidate collection is a deterministic scan that can be optimized later without changing public API.
- Edge snapping mutates the existing way immediately on click, then records the inserted node ID in the draft so the new feature shares that node on finish.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Initial edge-snap test fixture used a triangle, so the diagonal edge was correctly closer than the intended edge. The fixture was corrected to a rectangle before committing.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm test -- --runInBand packages/core/test/snapping.test.ts packages/core/test/editor-snapping.test.ts packages/leaflet/test/leaflet-snapping.test.ts` exits 0.
- `pnpm typecheck` exits 0.
- `! rg "from [\"']leaflet[\"']" packages/core/src` exits 0.

## Next Phase Readiness

Ready for Plan 03-02. Shared nodes and edge-inserted nodes now exist; the next plan should broaden mutation semantics so moving/deleting shared geometry refreshes every connected feature and preserves imported shared references.

---
*Phase: 03-topology-relations-and-validation*
*Completed: 2026-05-12*
