# Phase 05 Pattern Map: Examples, Docs, and Release Readiness

**Phase:** 05 - Examples, Docs, and Release Readiness
**Created:** 2026-05-12

## Closest Existing Analogs

| New/Changed File | Role | Closest Existing Analog | Pattern To Reuse |
|------------------|------|-------------------------|------------------|
| `examples/vanilla/src/main.ts` | Shared example fixtures/helpers | `packages/core/test/fixtures/*.json`, `packages/core/src/types.ts` | Export typed OsmInEdit-style fixture/helper values from plain TypeScript; keep it renderer-neutral and tiny. |
| `examples/leaflet/src/main.ts` | Runnable Leaflet host example | Existing `examples/leaflet/src/main.ts` | Preserve host-owned control pattern: DOM buttons call `IndoorEditor` methods directly; SDK owns map visuals only. |
| `examples/leaflet/src/styles.css` | Example layout/style | Existing `examples/leaflet/src/styles.css` | Keep dense operational panels over full-screen map; use stable responsive dimensions and avoid marketing layout. |
| `examples/maplibre/index.html` | Runnable MapLibre example shell | `examples/leaflet/index.html` | Minimal Vite HTML with `#app` and module script; no framework. |
| `examples/maplibre/vite.config.ts` | Local dev source aliases | `examples/leaflet/vite.config.ts` | Alias workspace package imports to `../../packages/*/src/index.ts` for fast local example development. |
| `examples/maplibre/src/main.ts` | Runnable MapLibre host example | `examples/leaflet/src/main.ts`, `packages/maplibre/src/index.ts` | Same host controls/workflow as Leaflet, but initialize `maplibre-gl` with local no-network style and `createMapLibreAdapter`. |
| `examples/maplibre/src/styles.css` | MapLibre example layout | `examples/leaflet/src/styles.css` | Reuse visual density/responsive constraints; avoid nested cards and explanatory in-app feature copy. |
| `playwright.config.ts` | Browser smoke orchestration | Existing `playwright.config.ts` | Extend from single Leaflet server to deterministic Leaflet and MapLibre smoke runs with explicit ports. |
| `tests/e2e/maplibre-example.spec.ts` | MapLibre smoke test | `tests/e2e/leaflet-example.spec.ts` | Assert host controls, level control, load/validate/export status, not deep map engine behavior. |
| `tests/e2e/leaflet-example.spec.ts` | Leaflet smoke expansion | Existing test | Expand assertions to match Phase 05 workflow while keeping Playwright resilient. |
| `README.md` | Public quickstart and package overview | `.planning/PROJECT.md`, `docs/osm-indoor-prd.md` | Translate project boundary into developer-facing quickstart; do not expose planning jargon. |
| `docs/sdk-host-boundary.md` | Responsibility boundary doc | `.planning/phases/05-examples-docs-and-release-readiness/05-CONTEXT.md` | Make SDK-owned vs host-owned responsibilities explicit and public. |
| `docs/api-recipes.md` | Copy-paste API recipes | `packages/core/src/editor.ts`, `packages/core/src/events.ts`, `packages/core/src/validation.ts` | Use actual public method names and event names; snippets should match TypeScript exports. |
| `docs/release.md` | Release dry-run docs | `package.json`, package `package.json` files | Document dry-run release gate and manual publish boundary. |
| `scripts/check-core-boundary.mjs` or equivalent | Renderer dependency boundary check | Prior shell check `rg 'maplibre' packages/core/src`; package metadata | Programmatically verify core has no renderer imports/deps and adapters keep peer deps isolated. |
| `scripts/release-dry-run.mjs` or equivalent | Release-readiness gate | Root `package.json` scripts | Run build/typecheck/test/example builds/e2e/package checks without npm publish. |
| `packages/*/package.json` | Publish metadata | Existing package metadata | Preserve package names and peer deps, add coherent `exports`, `files`, `sideEffects`, scripts, and publish-safe metadata. |

## Source Truths

- Phase 05 context decisions D-01 through D-17 are all implementation-relevant and must appear in plans.
- Examples remain host-owned UI. The SDK may own map editing visuals, but not buttons, panels, save/publish policy, or file import UI.
- Leaflet and MapLibre examples should be parallel runnable apps, not a single shared harness.
- `examples/vanilla` becomes shared example utilities/fixtures, not a third user-facing example.
- Import in examples uses a bundled sample fixture and "Load sample" host control.
- Validation is advisory and non-blocking; examples should still permit export with validation issues.
- Playwright smoke proves runnable examples; Vitest continues to prove adapter/editor behavior.
- Release automation is dry-run only. Actual npm publish stays manual.

## Implementation Landmines

- Do not make example controls part of SDK package APIs.
- Do not add Leaflet or MapLibre dependencies to `@osminedit-lib/core`.
- Do not use external map tiles or network-dependent basemaps in smoke-tested examples.
- Do not rely on generated `examples/*/dist` artifacts as source of truth.
- Do not add a real `npm publish` command to the default release gate.
- Do not make strict bundle-size budgets part of v1; use boundary/package sanity checks instead.
- Do not let docs imply backend storage, OSM OAuth/changesets, framework wrappers, or floor-plan calibration are v1 features.
- Do not bury public API recipes behind TypeScript declaration references alone; write copy-paste snippets with actual method names.

## Data Flow And Verification Pattern

1. Host example UI calls `IndoorEditor` methods.
2. Core editor mutates primitive/feature state and emits typed events.
3. Renderer adapter updates SDK-owned map visuals.
4. Host panels render validation/export/event state from API calls and events.
5. Playwright asserts the host-visible controls and status/export/validation surfaces exist.
6. Release dry-run runs the full build/type/test/e2e/package sanity gate.
