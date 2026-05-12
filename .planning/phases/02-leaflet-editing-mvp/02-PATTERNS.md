# Phase 02 Pattern Map: Leaflet Editing MVP

**Generated:** 2026-05-12  
**Purpose:** Local code patterns and closest analogs for Phase 2 planning.

## Files And Analogs

| New/Modified File | Role | Closest Existing Analog | Pattern To Reuse |
|-------------------|------|-------------------------|------------------|
| `packages/leaflet/src/index.ts` | Public adapter exports | `packages/core/src/index.ts` | Explicit public exports, no default export. |
| `packages/leaflet/src/leaflet-adapter.ts` | Concrete renderer adapter | `packages/core/src/fake-adapter.ts` | Implement `RendererAdapter`, typed `on/off`, call cleanup discipline. |
| `packages/leaflet/src/styles.ts` | Leaflet style defaults/merging | `packages/core/src/adapter.ts`, `02-UI-SPEC.md` | Map-neutral options at boundary, concrete renderer details inside adapter package. |
| `packages/core/src/editor.ts` | Draw/edit public API implementation | Existing unsupported stubs in same file | Preserve typed public facade, immutable snapshots, typed errors. |
| `packages/core/src/primitive-store.ts` | Primitive mutation operations | Existing create/import/get/export methods | Clone inputs/outputs, validate references before export. |
| `packages/core/src/feature-store.ts` | Feature mutation operations | Existing add/update/delete/list methods | Keep feature IDs separate from primitive IDs and return cloned records. |
| `packages/core/test/*.test.ts` | Core behavior tests | `packages/core/test/editor.test.ts`, `primitive-store.test.ts` | Vitest unit tests with deterministic IDs/clocks and fixture-like data. |
| `packages/leaflet/test/*.test.ts` | Adapter tests | `packages/core/test/fake-adapter.test.ts` | Contract-style assertions around adapter lifecycle/events. |
| `examples/leaflet/src/main.ts` | Bare integration example | `examples/leaflet/src/main.ts` placeholder | Keep host controls explicit and minimal. |
| `examples/leaflet/index.html` | Example entry page | none yet | Use Vite's default browser entry shape. |
| `tests/e2e/leaflet-example.spec.ts` | Browser smoke | none yet | Playwright launches Vite web server, checks controls/export path. |

## Established Constraints

- `packages/core` must not import Leaflet.
- `packages/leaflet` may import Leaflet and `@osminedit-lib/core`.
- Public state getters return immutable snapshots/copies.
- Errors use typed `OsmIndoorError` subclasses.
- Tests use Vitest; e2e smoke should use Playwright.
- Example controls are host-owned and must not become an SDK UI kit.

## Integration Notes

- The existing `RendererAdapter` contract is the anchor, but Phase 2 should extend its event map for committed feature click, vertex drag, midpoint click, and feature drag behavior.
- Core editor must subscribe to adapter events in the constructor and unregister on `destroy()`.
- Leaflet adapter should internally own a pane/root layer group with draft, committed, selection, and handle groups.
- Primitive and feature mutation APIs should land before Leaflet gestures rely on them.

