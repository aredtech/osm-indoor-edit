---
phase: 05-examples-docs-and-release-readiness
plan: "01"
subsystem: examples
tags: [typescript, vite, leaflet, maplibre, playwright]
requires:
  - phase: 04-maplibre-parity-and-host-integration
    provides: MapLibre adapter parity and host event surface
provides:
  - Shared renderer-neutral example fixture utilities
  - Runnable Leaflet and MapLibre examples with matching host-owned controls
  - Dual Playwright smoke coverage for renderer examples
affects: [examples, docs, release-readiness]
tech-stack:
  added: [maplibre-gl example dependency, playwright projects]
  patterns: [host-owned controls call IndoorEditor APIs directly, no-network example maps]
key-files:
  created: [examples/maplibre/index.html, examples/maplibre/vite.config.ts, examples/maplibre/src/styles.css, tests/e2e/maplibre-example.spec.ts]
  modified: [examples/vanilla/src/main.ts, examples/leaflet/src/main.ts, examples/maplibre/src/main.ts, package.json, playwright.config.ts]
key-decisions:
  - "Kept shared example code limited to fixture and formatting helpers."
  - "Used an inline MapLibre background style so smoke tests do not depend on external tiles."
  - "Kept validation advisory while export remains available."
patterns-established:
  - "Renderer examples expose matching host-owned controls and call the same IndoorEditor methods."
  - "Playwright smoke asserts visible host controls and export/validation text, not renderer internals."
requirements-completed: [EX-01, EX-02]
duration: 55min
completed: 2026-05-12T16:46:26Z
---

# Phase 5: Examples Workflow Summary

**Parallel Leaflet and MapLibre examples now demonstrate host-owned drawing, levels, tags, snapping, sample import, validation, export, and event feedback.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-05-12T15:51:00Z
- **Completed:** 2026-05-12T16:46:26Z
- **Tasks:** 4
- **Files modified:** 18

## Accomplishments

- Converted `examples/vanilla` into renderer-neutral `sampleIndoorData`, JSON formatting, validation summary, and event label helpers.
- Upgraded the Leaflet example with Load sample, Validate, Snapping, Validation issues, status/event log, and export panels.
- Built a matching MapLibre Vite example using `createMapLibreAdapter()` and an inline no-network `background` style.
- Added root scripts and Playwright projects/smoke tests for both renderer examples.

## Task Commits

1. **Task 1: Shared example utilities** - `e58d018` (feat)
2. **Task 2: Leaflet host workflow** - `b9c1409` (feat)
3. **Task 3: MapLibre host workflow** - `19ba8fd` (feat)
4. **Task 4: Dual smoke coverage** - `d26f6bd` (test)

**Plan metadata:** `c924bd1` (docs)

## Files Created/Modified

- `examples/vanilla/src/main.ts` - Shared sample fixture and helper exports.
- `examples/leaflet/src/main.ts` - Full host-owned Leaflet workflow.
- `examples/maplibre/src/main.ts` - Full host-owned MapLibre workflow.
- `examples/maplibre/index.html` - MapLibre Vite shell.
- `examples/maplibre/vite.config.ts` - Source aliases for local dev.
- `examples/maplibre/src/styles.css` - Responsive operational example layout.
- `package.json` - Root example dev/build/e2e scripts.
- `playwright.config.ts` - Leaflet and MapLibre projects/web servers.
- `tests/e2e/leaflet-example.spec.ts` - Expanded Leaflet smoke.
- `tests/e2e/maplibre-example.spec.ts` - New MapLibre smoke.

## Decisions Made

- Shared helpers stay data-only so developers can still read each renderer example as direct host integration code.
- MapLibre uses a local inline style with a `background` layer to avoid external network dependencies.
- Playwright smoke checks visible controls and export/validation/status behavior, leaving map rendering internals to unit tests.

## Deviations from Plan

### Auto-fixed Issues

**1. Root TypeScript alias for shared example package**
- **Found during:** Task 2
- **Issue:** Root `pnpm typecheck` could not resolve `@osminedit-lib/example-vanilla`.
- **Fix:** Added the alias to `tsconfig.typecheck.json` and package references in example tsconfigs.
- **Files modified:** `tsconfig.typecheck.json`, `examples/leaflet/tsconfig.json`, `examples/maplibre/tsconfig.json`
- **Verification:** `pnpm typecheck`
- **Committed in:** `b9c1409` and `19ba8fd`

**2. Fixture compatibility with existing import/export tests**
- **Found during:** Task 1
- **Issue:** Adding a POI to `shared-rooms.json` changed feature numbering expected by an existing shared-reference test.
- **Fix:** Kept POI coverage in `sampleIndoorData` and preserved the original shared-room fixture shape.
- **Files modified:** `packages/core/test/fixtures/shared-rooms.json`, `examples/vanilla/src/main.ts`
- **Verification:** `pnpm test`
- **Committed in:** `e58d018`

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** Both fixes were required for repo-wide verification and did not expand Phase 05 scope.

## Issues Encountered

- `pnpm install --offline` could not find all tarballs after dependency metadata changed, so the workspace install was restored with approved network access.
- Playwright dev servers need local port binding outside the sandbox; e2e tests passed when run with approved local networking.

## User Setup Required

None - no external services required.

## Next Phase Readiness

Wave 2 can now document the working examples, package metadata, and release dry-run gate against real runnable Leaflet and MapLibre examples.

---
*Phase: 05-examples-docs-and-release-readiness*
*Completed: 2026-05-12*
