# Plan 01-02 Summary: Primitive Core

**Phase:** 01 - Headless Core Foundation  
**Plan:** 01-02 - Primitive Store, IDs, and OsmInEdit Types  
**Status:** Complete  
**Completed:** 2026-05-12  

## Outcome

Implemented the core OsmInEdit primitive model, deterministic timestamp and ID utilities, typed data-integrity errors, and a primitive store that creates, imports, validates, orders, and exports node/way/relation JSON with `status: true`.

## Requirements Completed

- DATA-01: Typed OsmInEdit-compatible node, way, relation, relation member, and export envelope shapes.
- DATA-03: Deterministic large numeric ID allocation per element type.
- DATA-04: Injectable clock for deterministic timestamps.
- DATA-05: Primitive-store reference validation and closed-area way validation.
- IO-01: Strict export envelope `{ elements, status: true }`.
- IO-02: Deterministic export ordering of nodes, then ways, then relations.

## Files Changed

- `.gitignore`
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.typecheck.json`
- `packages/core/src/clock.ts`
- `packages/core/src/errors.ts`
- `packages/core/src/ids.ts`
- `packages/core/src/index.ts`
- `packages/core/src/primitive-store.ts`
- `packages/core/src/types.ts`
- `packages/core/test/ids.test.ts`
- `packages/core/test/primitive-store.test.ts`

## Commits

- `2b9291a chore(tooling): make workspace checks reproducible`
- `5db87ec feat(01-02): implement primitive core`

## Deviations

- Added `.gitignore` and committed `pnpm-lock.yaml` after dependency installation so generated build artifacts and dependency trees stay out of source commits.
- Replaced the root `typecheck` command with `tsc --noEmit -p tsconfig.typecheck.json`. TypeScript 5.9 rejects `tsc -b --noEmit` when referenced projects depend on other referenced projects, so this keeps no-emit typechecking reliable while preserving `tsc -b` for builds.
- Closed-area validation is tag-based for Phase 1: `area=yes`, `indoor=room`, and `indoor=corridor` must repeat the first node at the end.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- --runInBand packages/core/test/ids.test.ts packages/core/test/primitive-store.test.ts` passed.
- `pnpm build` passed.
- Targeted `rg` acceptance checks passed for primitive types, `status: true`, deterministic ID/clock utilities, and `DataIntegrityError`.

## Self-Check: PASSED

The primitive core satisfies the plan acceptance criteria and gives later editor/import-export work a stable data foundation.
