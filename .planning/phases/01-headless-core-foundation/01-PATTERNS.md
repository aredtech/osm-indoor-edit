# Phase 1 Pattern Map

**Phase:** 01 - Headless Core Foundation
**Date:** 2026-05-12

## Codebase Pattern Status

This is a greenfield repository. There are no existing source files, package manifests, framework conventions, components, hooks, utilities, or tests to reuse.

## Files To Create

| Area | Planned Files | Closest Existing Analog |
|------|---------------|-------------------------|
| Workspace | `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`, `vitest.config.ts` | None |
| Core package | `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/**/*.ts`, `packages/core/test/**/*.test.ts`, `packages/core/test/fixtures/*.json` | None |
| Adapter placeholders | `packages/leaflet/package.json`, `packages/maplibre/package.json`, placeholder `src/index.ts` files | None |
| Example placeholders | `examples/vanilla/package.json`, `examples/leaflet/package.json`, `examples/maplibre/package.json`, placeholder `src/main.ts` files | None |

## Established Decisions To Preserve

- Package names and layout come from `01-CONTEXT.md` decisions D-01 through D-04.
- Core package must remain renderer-neutral.
- Adapter packages are private placeholders in Phase 1.
- Example directories exist in Phase 1 but no browser/demo behavior is implemented yet.

## Implementation Guidance

- Prefer explicit, boring TypeScript modules over clever abstractions.
- Keep public API exports centralized through `packages/core/src/index.ts`.
- Put core domain modules under `packages/core/src/` by responsibility:
  - `types.ts`
  - `errors.ts`
  - `ids.ts`
  - `clock.ts`
  - `events.ts`
  - `primitive-store.ts`
  - `feature-store.ts`
  - `import-export.ts`
  - `adapter.ts`
  - `editor.ts`
- Tests should live close enough to core to verify public behavior without depending on renderer packages.
