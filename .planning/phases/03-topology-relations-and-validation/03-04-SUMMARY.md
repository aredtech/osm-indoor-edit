---
phase: 03-topology-relations-and-validation
plan: "04"
subsystem: core-validation
tags: [typescript, validation, advisory, topology]
requires:
  - phase: 03-topology-relations-and-validation
    provides: node, way, relation, and feature state from plans 01-03
provides:
  - Public validation issue/result/rule types
  - Built-in semantic, reference, duplicate, and geometry rules
  - Editor validate/registerValidationRule APIs
  - Structured validationChanged events
affects: [phase-03, phase-05, host-api]
tech-stack:
  added: []
  patterns: [advisory validation, custom rule registration, structured validation issues]
key-files:
  created:
    - packages/core/src/validation.ts
    - packages/core/test/validation.test.ts
    - packages/core/test/editor-validation.test.ts
  modified:
    - packages/core/src/editor.ts
    - packages/core/src/events.ts
    - packages/core/src/index.ts
    - packages/core/test/editor.test.ts
    - packages/core/test/events.test.ts
key-decisions:
  - "Validation remains advisory and does not block export."
  - "Geometry validation uses local segment-intersection checks instead of adding Turf dependencies in this slice."
patterns-established:
  - "Validation context is created from cloned primitive/feature snapshots."
  - "Custom validation rules are constructor-provided or registered/unregistered at runtime."
requirements-completed: [VAL-01, VAL-02, VAL-03, VAL-04, VAL-05, VAL-06]
duration: 9 min
completed: 2026-05-12
---

# Phase 03 Plan 04: Advisory Validation Summary

**Structured advisory validation with built-in topology rules and pluggable host rules**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-12T11:22:20Z
- **Completed:** 2026-05-12T11:31:01Z
- **Tasks:** 4
- **Files modified:** 8

## Accomplishments

- Added `ValidationIssue`, `ValidationResult`, `ValidationRule`, validation context creation, and rule running.
- Implemented built-in rules for missing tags, broken references, duplicate nodes/coordinates, invalid closed ways, too-few nodes, and self-intersections.
- Replaced `validate()` placeholder with advisory editor validation and `validationChanged` structured events.
- Added `registerValidationRule` with unregister support and tests proving export remains non-blocking.

## Task Commits

1. **Tasks 1-4: Validation model, built-ins, geometry checks, and editor integration** - `402eba4`

## Files Created/Modified

- `packages/core/src/validation.ts` - Public validation model and built-in rules.
- `packages/core/src/editor.ts` - `validate()` and `registerValidationRule`.
- `packages/core/src/events.ts` - Structured `validationChanged` payload.
- `packages/core/test/validation.test.ts` - Rule runner and built-in rule coverage.
- `packages/core/test/editor-validation.test.ts` - Editor validation API and advisory export tests.

## Decisions Made

- Did not add Turf packages; local geometry checks cover the planned v1 cases and avoid dependency churn.
- Built-in semantic tag issues are warnings, while broken references and invalid geometry are errors in validation output.

## Deviations from Plan

Tasks 1-4 were implemented and committed together because the public validation model, built-in rules, and editor integration were tightly coupled. No scope was added beyond the plan.

## Issues Encountered

Updated existing event/editor tests from the old placeholder validation shape to the new structured issue payload.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm typecheck` exits 0.
- `pnpm test -- --runInBand packages/core/test/validation.test.ts packages/core/test/editor-validation.test.ts` exits 0.
- `pnpm test` exits 0.
- `validate()` returns `{ valid, issues }` and does not block export.
- `validationChanged` emits structured issues.
- Structurally invalid import tests still throw `DataIntegrityError`.

## Next Phase Readiness

Phase 03 is ready for verification. The SDK now has connected topology, relation primitives, and advisory validation for host applications.

---
*Phase: 03-topology-relations-and-validation*
*Completed: 2026-05-12*
