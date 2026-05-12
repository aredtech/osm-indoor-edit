# Phase 05 Research: Examples, Docs, and Release Readiness

## Research Complete

Phase 05 should turn the completed editing engine into a developer-usable v1 package. The implementation work is mostly integration, documentation, and release hygiene: make the examples runnable and equivalent, document the host-owned UI boundary, and add repeatable checks that prove the packages/examples are coherent.

## Phase Scope

**Phase:** 05 - Examples, Docs, and Release Readiness

**Goal:** Developers can learn and verify the SDK through vanilla Leaflet and MapLibre examples plus documentation that clearly separates SDK responsibilities from host app responsibilities.

**Requirement IDs:** EX-01, EX-02, EX-03, EX-04

**MVP mode:** Active via ROADMAP.md. Plans should be vertical developer-experience slices: after each task, a developer can run, inspect, or verify more of the SDK than before.

## Current Codebase Findings

### Example State

- `examples/leaflet` is a runnable Vite app. It already creates a Leaflet map, creates an editor with `createLeafletAdapter`, exposes host-owned draw/finish/cancel/delete/tag/level controls, and renders export JSON.
- The Leaflet example does not yet demonstrate the Phase 05 locked workflow: no "Load sample" import button, no validation issue panel, no snapping toggle, and no event/status log beyond simple status text.
- `examples/maplibre` is still a placeholder TypeScript package. It has no `index.html`, no Vite config, no `dev` or `build` scripts, no `maplibre-gl` dependency in the example package, and `src/main.ts` only exports a placeholder constant.
- `examples/vanilla` is also a placeholder. Per Phase 05 context, it should become tiny shared example utilities/fixtures rather than a third runnable app.
- `examples/leaflet/vite.config.ts` aliases workspace packages to source entrypoints. MapLibre should use the same source-alias pattern for local dev.
- `examples/leaflet/src/styles.css` provides a usable operational example layout: full-viewport map, host-owned controls, export panel, compact mobile behavior. Planner may either reuse it directly as shared example CSS or copy the pattern into a tiny shared utility/style module.

### Core API Surface Available For Examples And Docs

- `createEditor` accepts `adapter`, `target`, `defaultLevel`, `snapping`, `defaultTags`, `idStrategy`, and `validationRules`.
- `IndoorEditor` already exposes all methods needed for examples/docs: `startDraw`, `cancelDraw`, `finishDraw`, `setLevel`, `selectFeature`, `deleteFeature`, `updateTags`, `deleteVertex`, `moveVertex`, `insertVertex`, `moveFeature`, `detachFeatureGeometry`, relation APIs, `setSnapping`, `getSnapping`, `loadOsmInEdit`, `exportOsmInEdit`, `validate`, `on`, and `off`.
- `EditorEventMap` includes events to demonstrate host-owned UI updates: `ready`, `toolChanged`, `levelChanged`, drawing lifecycle, feature lifecycle, primitive updates, `validationChanged`, `exportReady`, and `error`.
- `ValidationResult` and `ValidationIssue` already provide the compact issue-panel fields Phase 05 needs: `valid`, `issues`, `ruleId`, `severity`, `message`, optional element metadata, and optional `featureId`.
- `exportOsmInEdit()` emits `exportReady`; `validate()` emits `validationChanged`; examples can use those events to show that host UI is driven by the SDK event surface.
- `loadOsmInEdit()` rebuilds features and commits them to the attached adapter, which fits the "Load sample" workflow.

### Renderer Adapter State

- `@osminedit-lib/leaflet` and `@osminedit-lib/maplibre` both export adapter factories and style APIs.
- MapLibre adapter already supports SDK-owned sources/layers, selection, handles, snapping visuals, projection/unprojection, level filtering, and layer event translation.
- MapLibre examples can instantiate a real `maplibre-gl` map, but tests should stay light. Playwright smoke can verify DOM controls and output, while adapter behavior remains covered by Vitest fake-map tests.
- Real network basemaps should be avoided in examples and browser smoke tests. Leaflet currently creates a map with no tile layer, which is reliable. MapLibre can use an inline empty style with background or simple local GeoJSON layers so Playwright does not depend on external tiles.

### Documentation State

- Public docs are essentially absent except for `docs/osm-indoor-prd.md`, which is the seed PRD and not a developer quickstart.
- There is no root `README.md`.
- Docs should not copy the entire PRD. They should translate the now-built API into developer-facing guidance:
  - what the SDK owns vs what the host owns
  - install/import shape for core, Leaflet, and MapLibre packages
  - copy-paste recipes for create, renderer setup, draw, edit tags, validate, load, export, and events
  - v1 limits: no backend, no real OSM publishing, no framework wrappers, no floor-plan calibration metadata in OsmInEdit `elements`

### Package And Release State

- Root `package.json` has only `build`, `typecheck`, `test`, and `test:e2e` scripts.
- Package metadata is minimal. Core/Leaflet/MapLibre packages are still `private: true`, expose `main`/`types`, but do not define `exports`, `files`, `sideEffects`, `license`, or publish-related metadata.
- Renderer packages correctly keep `leaflet` and `maplibre-gl` as renderer-local peer/dev dependencies. Core has no renderer dependency.
- There is no `.changeset`, release-prep script, package pack/dry-run script, or package sanity script.
- The user selected dry-run release automation, not real npm publishing. Planning should avoid adding a command that publishes to npm automatically.

### Test And E2E State

- Vitest unit coverage is broad across core, Leaflet, and MapLibre.
- Playwright is installed and `tests/e2e/leaflet-example.spec.ts` exists.
- `playwright.config.ts` currently serves only the Leaflet example at `http://127.0.0.1:5173`.
- To smoke-test both examples, planner should either:
  - use multiple Playwright projects with separate `webServer` entries and ports, or
  - split scripts/configs into `test:e2e:leaflet` and `test:e2e:maplibre`.
- The simplest robust route is separate root scripts for each example smoke, plus a combined `test:e2e` that runs both. This keeps ports explicit and avoids complex dynamic launching.

## Implementation Research

### Shared Example Utilities

Use `examples/vanilla` as a tiny shared utility package/module. Suggested contents:

- `sampleIndoorData`: bundled OsmInEdit-style JSON fixture with at least rooms/corridor/POI and one validation-relevant case if useful.
- `formatExport(data)`: JSON stringify helper for output panels.
- `summarizeValidation(result)`: issue count/severity helpers.
- Small exported types for example host state if needed.

Avoid a shared host UI harness. Both renderer examples should remain readable standalone integrations.

### Example Workflow Shape

Both renderer examples should expose equivalent host controls:

- Draw room
- Draw corridor
- Add POI
- Finish
- Cancel
- Level selector
- Name/tag input and apply button
- Snapping toggle
- Load sample
- Validate
- Delete feature
- Delete vertex
- Export panel
- Compact validation issue panel
- Optional event/status log

The examples should call SDK APIs directly from host-owned controls. Do not introduce SDK-owned toolbar/sidebar abstractions.

### MapLibre Example Notes

MapLibre example likely needs:

- `examples/maplibre/index.html`
- `examples/maplibre/vite.config.ts` with aliases to `packages/core/src/index.ts` and `packages/maplibre/src/index.ts`
- `examples/maplibre/src/main.ts`
- `examples/maplibre/src/styles.css` or shared example CSS
- `maplibre-gl` dependency in `examples/maplibre/package.json`
- `dev` and `build` scripts matching Leaflet

For reliability, instantiate MapLibre with an inline style:

```ts
const map = new maplibregl.Map({
  container: mapElement,
  style: {
    version: 8,
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": "#E8EEF5" } }]
  },
  center: [11.9746, 57.7089],
  zoom: 19,
  attributionControl: false
});
```

Create the editor after the map is ready, or attach immediately if MapLibre accepts source/layer registration at that point in the local environment. If real MapLibre requires style load before `addSource`, use `map.on("load", initializeEditor)` and have the host UI show a ready status.

### Documentation Structure

Recommended docs files:

- `README.md` — project overview, install/import sketch, package list, quickstart commands, example commands, and links.
- `docs/sdk-host-boundary.md` — what the SDK owns vs host app owns, plus v1 out-of-scope boundaries.
- `docs/api-recipes.md` — copy-paste recipes for create, renderer setup, draw, tags, validate, load, export, events.
- `docs/release.md` — dry-run release/prepublish checklist and commands.

Keep `docs/osm-indoor-prd.md` as seed PRD; do not rewrite it into the README.

### Release Tooling

Dry-run release readiness can be achieved without actual npm publication by adding:

- package metadata: `exports`, `files`, `sideEffects`, non-private publishable library packages where appropriate, peer dependencies retained for renderer packages
- root scripts for example dev/build:
  - `dev:leaflet`
  - `dev:maplibre`
  - `build:examples`
  - `test:e2e:leaflet`
  - `test:e2e:maplibre`
  - `check:core-boundary`
  - `release:dry-run`
- a dry-run script that runs build/typecheck/test/example builds/e2e smoke/package checks without `npm publish`

If adding Changesets, keep it to version/release-prep scaffolding and documentation. Do not add an automatic publish command. If avoiding a new dependency, a shell-free Node script in `scripts/release-dry-run.mjs` can run the required commands and inspect package metadata. The planner can decide, but actual implementation must stay deterministic and local.

### Bundle And Boundary Sanity

Basic sanity should cover:

- `packages/core/src` has no `leaflet` or `maplibre` imports.
- `packages/core/package.json` has no renderer dependencies.
- `@osminedit-lib/leaflet` declares Leaflet as peer/dev dependency.
- `@osminedit-lib/maplibre` declares MapLibre as peer/dev dependency.
- Example packages can depend on renderer packages and renderer libraries.
- Strict byte-size budgets are not required for v1.

## Validation Architecture

Phase 05 has automated verification through Vitest, TypeScript, Vite example builds, Playwright, and package/boundary scripts. Nyquist validation should require:

- Each example workflow task includes an automated example build and at least one Playwright smoke assertion for the user-visible host controls it adds.
- Shared example utility tasks include Vitest or typecheck coverage proving fixture shape and helper exports are consumable.
- Documentation tasks include grep-verifiable acceptance criteria for README and docs sections/headings/code snippets.
- Release-readiness tasks include package metadata checks, renderer-core boundary checks, and dry-run release command checks.
- Full phase verification should run `pnpm build`, `pnpm typecheck`, `pnpm test`, example builds, Playwright smoke for Leaflet and MapLibre, and the release dry-run command.

Suggested per-plan commands:

- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @osminedit-lib/example-leaflet build`
- `pnpm --filter @osminedit-lib/example-maplibre build`
- `pnpm test:e2e:leaflet`
- `pnpm test:e2e:maplibre`
- `pnpm check:core-boundary`
- `pnpm release:dry-run`

## Threat Model Research Notes

Every Phase 05 plan should include a `<threat_model>` block because security enforcement is enabled by default.

Likely threats:

- **Renderer leakage into core.** Mitigation: keep `leaflet` and `maplibre-gl` imports out of `packages/core`; add a boundary check script.
- **Examples imply SDK-owned UI or publishing policy.** Mitigation: docs and examples label controls as host-owned; validation remains advisory and export remains available.
- **Network-dependent examples or smoke tests.** Mitigation: avoid external tile sources; use blank/local map styles.
- **Accidental npm publish.** Mitigation: release automation is dry-run only; actual publish remains manual and documented.
- **Package metadata pulls both renderers into consumers.** Mitigation: separate adapter packages keep renderer peer dependencies isolated.
- **Generated build artifacts get treated as source.** Mitigation: package `files` should include intended `dist` output and docs, while repo plans should avoid committing unnecessary generated example `dist` artifacts unless already expected by project policy.

## Recommended Plan Breakdown

Use the roadmap's two-plan structure.

### 05-01: Vanilla Leaflet and MapLibre examples

Goal: A developer can run both renderer examples and exercise the same host-owned workflow.

Recommended task slices:

1. Create shared example utilities and sample OsmInEdit fixture in `examples/vanilla`.
2. Upgrade Leaflet example to the full workflow: load sample, validate issue panel, snapping toggle, event/status feedback, export refresh.
3. Build MapLibre example with matching controls/workflow and local no-network map style.
4. Add example scripts and Playwright smoke tests for both examples.

### 05-02: Documentation, release checks, and package readiness

Goal: A developer can understand integration responsibilities and run a repeatable release-readiness gate.

Recommended task slices:

1. Add root README and focused docs for SDK/host boundary, API recipes, and v1 limitations.
2. Clean package metadata for core, Leaflet, and MapLibre packages.
3. Add core-boundary and package sanity checks.
4. Add dry-run release-prep tooling and documentation.
5. Wire full release gate script across build/typecheck/test/example builds/e2e/package checks.

## Sources

- `.planning/phases/05-examples-docs-and-release-readiness/05-CONTEXT.md` — Locked Phase 05 decisions.
- `.planning/ROADMAP.md` — Phase 05 scope, success criteria, requirement IDs, and planned two-plan structure.
- `.planning/REQUIREMENTS.md` — EX-01 through EX-04.
- `examples/leaflet/src/main.ts` — Existing runnable Leaflet example and host-control pattern.
- `examples/leaflet/src/styles.css` — Existing example layout and responsive controls.
- `examples/maplibre/src/main.ts` — Current placeholder requiring replacement.
- `examples/vanilla/src/main.ts` — Current placeholder for shared utilities.
- `playwright.config.ts` and `tests/e2e/leaflet-example.spec.ts` — Existing e2e setup to extend.
- `packages/core/src/editor.ts`, `packages/core/src/events.ts`, and `packages/core/src/validation.ts` — Public API, event, and validation recipe sources.
- `packages/leaflet/package.json`, `packages/maplibre/package.json`, and `packages/core/package.json` — Package metadata and peer dependency boundaries.
