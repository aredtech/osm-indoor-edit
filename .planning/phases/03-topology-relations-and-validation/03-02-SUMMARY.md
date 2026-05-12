---
phase: 03-topology-relations-and-validation
plan: "02"
subsystem: core-topology
tags: [typescript, shared-geometry, import-export, topology]
requires:
  - phase: 03-topology-relations-and-validation
    provides: snapping and edge-split shared nodes from plan 01
provides:
  - Feature and primitive reverse lookup helpers
  - Shared-node movement refresh for all affected features
  - Explicit geometry detach API
  - Shared-room import fixture and round-trip proof
affects: [phase-03, relations, validation, import-export]
tech-stack:
  added: []
  patterns: [reverse lookup helpers, shared geometry refresh, explicit detach before isolated edits]
key-files:
  created:
    - packages/core/test/editor-topology.test.ts
    - packages/core/test/fixtures/shared-rooms.json
  modified:
    - packages/core/src/editor.ts
    - packages/core/src/feature-store.ts
    - packages/core/src/primitive-store.ts
    - packages/core/test/feature-store.test.ts
    - packages/core/test/primitive-store.test.ts
    - packages/core/test/import-export.test.ts
key-decisions:
  - "Shared node movement refreshes every feature referencing the changed node."
  - "Detach clones the selected feature's editable node sequence and keeps the way/tags stable."
patterns-established:
  - "Use FeatureStore reverse lookups to discover affected feature records."
  - "Use PrimitiveStore reference checks to preserve still-shared nodes during deletion."
requirements-completed: [SNAP-04, SNAP-05, IO-04, IO-05, IO-06]
duration: 9 min
completed: 2026-05-12
---

# Phase 03 Plan 02: Shared Mutation and Import Round Trip Summary

**Shared topology mutation with all-feature refresh, explicit detach, and import/export preservation**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-12T11:06:40Z
- **Completed:** 2026-05-12T11:15:37Z
- **Tasks:** 4
- **Files modified:** 9

## Accomplishments

- Added reverse lookup helpers for features, ways, relations, and node references.
- Updated vertex and feature movement so shared node changes refresh every affected feature and emit host-visible updates.
- Added `detachFeatureGeometry` so hosts can intentionally break shared geometry before isolated edits.
- Added `shared-rooms.json` fixture and tests proving shared imported node IDs and unknown tags survive edit/export.

## Task Commits

1. **Task 1: Add affected-feature and reference lookup helpers** - `1b77a69`
2. **Task 2: Refresh all affected features when shared nodes move** - `1d141fb`
3. **Task 3: Add explicit detach geometry API and shared-safe deletion** - `9f3101a`
4. **Task 4: Prove imported shared data rebuilds and round-trips** - `84cc571`

## Files Created/Modified

- `packages/core/src/feature-store.ts` - Feature lookup by node, way, and relation IDs.
- `packages/core/src/primitive-store.ts` - Relation reference lookup and node-reference checks.
- `packages/core/src/editor.ts` - Shared refresh path, relation deletion path, and detach API.
- `packages/core/test/editor-topology.test.ts` - Shared movement, detach, and delete-preservation tests.
- `packages/core/test/fixtures/shared-rooms.json` - Two-room shared-wall import fixture.
- `packages/core/test/import-export.test.ts` - Shared import round-trip and invalid import checks.

## Decisions Made

- Shared movement updates each affected feature through the existing adapter `updateFeature` path so hosts see consistent refresh behavior.
- Detach creates new nodes but keeps the original way ID and tags, which minimizes host-facing identity churn while breaking shared node references.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm typecheck` exits 0.
- `pnpm test -- --runInBand packages/core/test/editor-topology.test.ts packages/core/test/import-export.test.ts` exits 0.
- Shared node movement tests show all affected feature exports update.
- Detach tests show cloned node IDs for the selected feature only.
- Import fixture tests preserve unknown tags and shared node references.

## Next Phase Readiness

Ready for Plan 03-03. The editor can now preserve and intentionally detach shared geometry; relation APIs can build on the same primitive and feature reference patterns.

---
*Phase: 03-topology-relations-and-validation*
*Completed: 2026-05-12*
