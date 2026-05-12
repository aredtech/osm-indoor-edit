# Phase 5: Examples, Docs, and Release Readiness - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 packages the SDK into a developer-usable v1 experience. It delivers parallel vanilla Leaflet and MapLibre examples, focused public documentation, and release-readiness checks that prove host apps can run the SDK without adopting SDK-owned application UI.

The SDK examples should demonstrate host-owned controls for drawing, levels, tags, snapping, validation, import, export, and event/status display. The SDK still owns map editing behavior and map editing visuals. Host apps still own buttons, forms, save/publish workflow, user accounts, backend storage, and any product UI. Real OSM publishing, framework wrappers, backend services, and floor-plan calibration remain out of scope for v1.

</domain>

<decisions>
## Implementation Decisions

### Example Shape

- **D-01:** Leaflet and MapLibre should be separate runnable example apps with matching host-owned workflows and controls.
- **D-02:** Shared example code should stay tiny and obvious: fixtures, lightweight types, and helper functions only. Do not hide the integration behind a large shared UI harness.
- **D-03:** Convert the current `examples/vanilla` placeholder into shared example utilities used by the renderer examples.
- **D-04:** Add discoverable root scripts for running examples, such as Leaflet and MapLibre dev commands, while preserving package-local `dev` and `build` scripts.

### Demo Workflow

- **D-05:** Both examples should prove the full integration workflow: draw room/corridor/POI, change level, edit tags, validate, load sample data, export OsmInEdit JSON, and show event/status feedback.
- **D-06:** Import should use a bundled OsmInEdit-style sample fixture and a host-owned "Load sample" control. Avoid paste panels and file upload complexity in v1 examples.
- **D-07:** Validation should appear in a compact, non-blocking host UI panel with issue count, severity, rule id, and message. Validation must not imply SDK-owned export blocking policy.
- **D-08:** Snapping/shared topology should be exposed through a host-owned toggle so developers can see intentional shared-wall behavior.
- **D-09:** Export remains available even when validation reports issues; host apps decide whether to block their own save/publish flow.

### Documentation Structure

- **D-10:** Phase 5 should produce a root README plus focused docs in `docs/`.
- **D-11:** Public docs should lead with the SDK-vs-host responsibility boundary before deep API details.
- **D-12:** API documentation should include copy-paste recipes for create, renderer setup, draw, edit tags, validate, load, export, and event subscription.
- **D-13:** Public docs should explicitly state v1 boundaries: no backend, no real OSM publishing, no framework wrappers, and no floor-plan calibration metadata mixed into OsmInEdit `elements`.

### Release Checks

- **D-14:** Release readiness requires a full repo gate: package build, typecheck, unit tests, example builds, and Playwright smoke tests for both Leaflet and MapLibre examples.
- **D-15:** Package readiness includes coherent package metadata, exports, peer dependencies, files/types/scripts, plus release-prep automation.
- **D-16:** Release automation should support dry-run release preparation and documentation. Actual npm publishing remains a manual human action in v1.
- **D-17:** Add basic bundle/package sanity checks, especially proving renderer dependencies stay out of core. Do not add strict size budgets for v1.

### The Agent's Discretion

The agent may choose exact file names inside `docs/`, exact root script names, the sample fixture content, Playwright test organization, and whether shared example utilities live as an importable workspace package or local shared module. Keep the locked outcome readable, vanilla, host-owned, and release-checkable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — Project boundary, core value, constraints, v1 exclusions, and active examples/docs requirement.
- `.planning/REQUIREMENTS.md` — Phase 5 requirement IDs: EX-01, EX-02, EX-03, EX-04.
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, planned phase boundary, and planned work split.
- `.planning/STATE.md` — Current project state and deferred items.
- `.planning/phases/02-leaflet-editing-mvp/02-CONTEXT.md` — Existing Leaflet example decisions and host-owned UI proof target.
- `.planning/phases/03-topology-relations-and-validation/03-CONTEXT.md` — Snapping, validation, relation, and import/edit/export behavior that examples should demonstrate.
- `.planning/phases/04-maplibre-parity-and-host-integration/04-CONTEXT.md` — MapLibre parity, host event surface, style/configuration, and Phase 5 deferrals.

### Product Requirements

- `docs/osm-indoor-prd.md` — Seed PRD defining OsmInEdit-style output, renderer targets, host-owned UI boundary, and v1 scope exclusions.

### Code Integration Points

- `package.json` — Root build/typecheck/test/e2e scripts and future example/release scripts.
- `playwright.config.ts` — Existing Leaflet-only Playwright smoke setup to extend for MapLibre.
- `tests/e2e/leaflet-example.spec.ts` — Existing browser smoke pattern for host controls and export status.
- `examples/leaflet/src/main.ts` — Current runnable Leaflet host-owned control example.
- `examples/leaflet/src/styles.css` — Current example UI styling to refine or share carefully.
- `examples/maplibre/src/main.ts` — Current placeholder to replace with runnable MapLibre example.
- `examples/maplibre/package.json` — Current MapLibre example package metadata, missing dev/build scripts and renderer dependency.
- `examples/vanilla/src/main.ts` — Current placeholder to convert into shared example utilities.
- `packages/core/src/editor.ts` — Public API surface for docs recipes and examples.
- `packages/core/src/events.ts` — Event subscription API to document and surface in examples.
- `packages/core/src/import-export.ts` — OsmInEdit import/export behavior to explain and fixture-test.
- `packages/core/src/validation.ts` — Validation result shape for docs and issue panel.
- `packages/leaflet/src/index.ts` — Leaflet adapter public entry point for docs examples.
- `packages/maplibre/src/index.ts` — MapLibre adapter public entry point for docs examples.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- The Leaflet example already demonstrates host-owned controls, level changes, tag updates, and export display.
- Existing core fixtures under `packages/core/test/fixtures/` can guide sample OsmInEdit JSON shape, but Phase 5 may add a dedicated example fixture if clearer.
- The editor API already exposes draw/edit/load/export/validate/events methods needed for public recipes.
- Playwright is already installed and a Leaflet smoke test exists.

### Established Patterns

- Examples are plain TypeScript/Vite apps, not framework wrappers.
- Renderer-specific imports stay in renderer example/package boundaries.
- Host UI can be simple and functional; examples should be usable proof surfaces rather than marketing pages.
- Tests use deterministic TypeScript unit coverage plus browser smoke for example-level proof.

### Integration Points

- Replace `examples/maplibre` placeholder with a runnable Vite app matching the Leaflet workflow.
- Convert `examples/vanilla` placeholder into shared utility/fixture code rather than a third visible app.
- Extend root scripts and package scripts so examples and release checks are discoverable.
- Add docs in `README.md` and focused files under `docs/`, while preserving `docs/osm-indoor-prd.md` as the seed PRD.
- Expand Playwright config/tests so both renderer examples are smoke-tested.
- Add release dry-run tooling and package sanity checks without adding real npm publishing.

</code_context>

<specifics>
## Specific Ideas

- Keep examples parallel and readable: a developer should be able to open either renderer example and understand how a host app calls the SDK.
- Use a "Load sample" button to demonstrate import/edit/export without making file handling look like SDK responsibility.
- Show validation issues as advisory data, reinforcing that host apps choose save/publish policy.
- Treat release readiness as practical package hygiene plus repeatable dry-run checks, not actual publication.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Examples, Docs, and Release Readiness*
*Context gathered: 2026-05-12*
