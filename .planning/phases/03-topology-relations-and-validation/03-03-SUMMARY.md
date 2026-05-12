---
phase: 03-topology-relations-and-validation
plan: "03"
subsystem: core-relations
tags: [typescript, relations, indoor, import-export]
requires:
  - phase: 03-topology-relations-and-validation
    provides: primitive reference lookups and shared topology state
provides:
  - Relation helper types
  - Primitive relation member append/remove mutations
  - Editor relation create/update/member APIs
  - Floor and building outline feature inference
affects: [phase-03, validation, import-export]
tech-stack:
  added: []
  patterns: [relation-backed state records, non-rendered relation features, reference-safe member mutation]
key-files:
  created:
    - packages/core/src/relations.ts
    - packages/core/test/editor-relations.test.ts
  modified:
    - packages/core/src/editor.ts
    - packages/core/src/primitive-store.ts
    - packages/core/src/feature-store.ts
    - packages/core/src/index.ts
    - packages/core/test/primitive-store.test.ts
    - packages/core/test/feature-store.test.ts
    - packages/core/test/import-export.test.ts
key-decisions:
  - "Relation-backed features are state/export visible and not committed to renderer geometry."
  - "Relation member removal supports exact member matching or index-based removal."
patterns-established:
  - "Sync relation-backed feature state after every relation primitive mutation."
  - "Infer floor/building outline kinds from OSM-style tags while preserving unknown tags as custom."
requirements-completed: [REL-01, REL-02, REL-03, REL-04, INDOOR-06]
duration: 7 min
completed: 2026-05-12
---

# Phase 03 Plan 03: Relation Primitive Support Summary

**Minimal relation APIs with relation-backed state records and indoor outline inference**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-12T11:15:40Z
- **Completed:** 2026-05-12T11:22:18Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added public relation helper types and exported them from core.
- Added reference-safe primitive relation member append/remove operations.
- Added editor APIs to create relations, update relation tags, append members, and remove members.
- Added relation-backed feature records in editor state without grouped map rendering.
- Added `floor-outline` and `building-outline` inference for indoor/building tags.

## Task Commits

1. **Task 1: Add relation helper types and primitive mutations** - `88094f1`
2. **Task 2: Add editor relation APIs and events** - `be04c96`
3. **Task 3: Improve relation-backed feature rebuilding and indoor outline inference** - `d974d9d`

## Files Created/Modified

- `packages/core/src/relations.ts` - Public relation API helper types.
- `packages/core/src/primitive-store.ts` - Relation member append/remove mutations.
- `packages/core/src/editor.ts` - Relation editor APIs and feature sync.
- `packages/core/src/feature-store.ts` - Floor/building outline inference.
- `packages/core/test/editor-relations.test.ts` - End-to-end editor relation API tests.

## Decisions Made

- Relation features are created/updated in `FeatureStore`, but no adapter `commitFeature` is called for relation geometry.
- Relation state sync uses relation ID lookup rather than rebuilding every feature after each small mutation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm typecheck` exits 0.
- `pnpm test -- --runInBand packages/core/test/editor-relations.test.ts packages/core/test/primitive-store.test.ts packages/core/test/feature-store.test.ts` exits 0.
- Relation APIs preserve numeric IDs and member roles on export.
- Relation-backed features appear in state and are not rendered as grouped Leaflet shapes.
- Floor/building outline inference is tested.

## Next Phase Readiness

Ready for Plan 03-04. Validation can now inspect nodes, ways, relations, relation members, and relation-backed feature records.

---
*Phase: 03-topology-relations-and-validation*
*Completed: 2026-05-12*
