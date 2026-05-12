# Phase 4: MapLibre Parity and Host Integration - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 brings the SDK's second renderer adapter to practical parity with the validated Leaflet path. A host app should be able to attach MapLibre, draw and edit indoor features, use snapping/shared topology, validate/import/export data, customize SDK-owned editing visuals, configure behavior, and drive all visible UI through typed SDK events.

The SDK owns MapLibre map interaction capture, temporary drawing visuals, committed feature visuals, selection, vertex/midpoint handles, snap indicators, source/layer lifecycle, and renderer-specific style translation. Host applications own buttons, forms, sidebars, persistence, publishing, user accounts, and product workflow. Vanilla examples and documentation polish remain Phase 5; real OSM publishing, backend storage, framework wrappers, and floor plan calibration remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### MapLibre Layer Model

- **D-01:** MapLibre should mirror Leaflet at the adapter contract level, not necessarily at the internal rendering implementation. The core editor should call the same `RendererAdapter` methods for Leaflet and MapLibre.
- **D-02:** Internally, MapLibre should use SDK-owned GeoJSON sources and layers for draft geometry, committed features, selection state, vertex handles, midpoint handles, and snap indicators.
- **D-03:** Keep SDK-owned MapLibre sources/layers clearly named and isolated so host map styles and host layers can coexist without direct management of SDK internals.
- **D-04:** Prefer layer/source updates over remove-and-recreate churn where practical, but planner may choose the simplest deterministic implementation first if tests prove correct behavior.
- **D-05:** Relation-backed feature records remain non-rendered grouped geometry. They should stay visible in editor state/export/validation, but MapLibre should not attempt to draw relation groups in v1.

### Interaction Parity

- **D-06:** MapLibre should match the Leaflet user-observable behavior for drawing, finish/cancel cleanup, committed features, selection, vertex drag, midpoint insertion, whole-feature drag, snapping, level filtering, and import/edit/export.
- **D-07:** Gesture semantics should be host-UI neutral: hosts call editor methods for tools and deletion; the adapter captures map pointer/feature/handle interactions and emits renderer-neutral adapter events.
- **D-08:** Snap parity is required. MapLibre must support `project`/`unproject`, `showSnapCandidate`, and `clearSnapCandidate` so core snapping logic can remain renderer-neutral.
- **D-09:** Level filtering should use the same feature visibility semantics as Leaflet: features are visible when their `level` matches current level or `repeat_on` includes it.
- **D-10:** MapLibre tests should prove behavior through adapter-level source/layer state and core editor integration, without needing a polished UI example in this phase.

### Style Override API

- **D-11:** Hosts should get a renderer-neutral editing style vocabulary where possible: draft line, draft vertex, preview, committed feature, selected feature, vertex handle, midpoint handle, and snap indicator.
- **D-12:** MapLibre may expose MapLibre-native paint/layout overrides underneath that vocabulary when needed, but the public API should not force hosts to learn a completely different style taxonomy for common editing visuals.
- **D-13:** Defaults should visually align with the existing Leaflet editing palette unless MapLibre-specific constraints require small translation differences.
- **D-14:** Style overrides should remain adapter/package-specific where renderer libraries differ. Core should define behavior/configuration concepts, while MapLibre and Leaflet translate visual styles in their own packages.
- **D-15:** Door/POI styling should be configurable enough for v1 defaults and host overrides, but detailed icon libraries or rich symbol catalogs are deferred unless required for parity tests.

### Host Event Surface

- **D-16:** Host integration depends on typed SDK events being complete enough to drive external UI: ready/destroy, tool changes, level changes, drawing start/update/cancel/finish, feature create/select/update/delete, primitive updates, validation changes, export readiness, and errors.
- **D-17:** Events should remain renderer-neutral and come from core/editor state changes rather than MapLibre-specific event shapes. Adapter `originalEvent` may stay available as an opaque escape hatch.
- **D-18:** The host should not need SDK-owned controls. Every UI-relevant state change should be observable through API calls, state snapshots, or typed events.
- **D-19:** Planning should audit the existing event map and fill missing lifecycle/error events needed by Phase 4 requirements, without adding backend, persistence, or publishing flows.

### Editor Configuration Completion

- **D-20:** Phase 4 should complete practical behavior configuration: default tags, ID strategy options, validation rules, snapping options, and renderer style options.
- **D-21:** Existing injectable clock, ID allocator, validation rule registration, snapping settings, and adapter options should be reused rather than replaced.
- **D-22:** Configuration should stay plain TypeScript object based, framework-independent, and usable from vanilla host apps.
- **D-23:** Package boundaries remain strict: `@osminedit-lib/core` must not import Leaflet or MapLibre; renderer dependencies belong in their adapter packages as peer dependencies.

### The Agent's Discretion

The agent may choose exact MapLibre source/layer names, GeoJSON feature shapes, hit-testing mechanics, drag implementation details, test helper design, and whether to factor shared style types between renderer packages. The locked outcome is user-observable parity with Leaflet and a host-owned UI boundary.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — Project boundary, core value, constraints, v1 exclusions, and current active requirements.
- `.planning/REQUIREMENTS.md` — Phase 4 requirement IDs: ADAPT-03, API-06, EVT-01, EVT-02, STYLE-01, STYLE-02.
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, planned phase boundary, and dependencies.
- `.planning/STATE.md` — Current project state and deferred items.
- `.planning/phases/02-leaflet-editing-mvp/02-CONTEXT.md` — Locked Leaflet behavior and visual layer decisions that MapLibre must match at the user-observable level.
- `.planning/phases/03-topology-relations-and-validation/03-CONTEXT.md` — Locked snapping, shared topology, relation, validation, and import round-trip decisions that MapLibre must support.

### Product Requirements

- `docs/osm-indoor-prd.md` — Seed PRD defining MapLibre as a v1 renderer, SDK-owned map editing behavior, host-owned UI boundary, and OsmInEdit-style output.

### Code Integration Points

- `packages/core/src/adapter.ts` — Renderer adapter contract and event map that MapLibre must implement or extend compatibly.
- `packages/core/src/editor.ts` — Public editor facade, event emission, snapping, validation, import/export, and configuration options.
- `packages/core/src/events.ts` — Typed editor event map to audit and complete for host-owned UI workflows.
- `packages/core/src/fake-adapter.ts` — Renderer contract test pattern and event recording utilities.
- `packages/core/src/snapping.ts` — Renderer-neutral snapping resolution that depends on adapter projection and snap visual hooks.
- `packages/core/src/topology.ts` — Shared topology helpers used by snapping and editing flows.
- `packages/core/src/validation.ts` — Built-in and custom validation rules that MapLibre workflows must surface through core APIs.
- `packages/leaflet/src/leaflet-adapter.ts` — Existing validated adapter behavior to use as the parity reference.
- `packages/leaflet/src/styles.ts` — Existing renderer style vocabulary and default palette to mirror where practical.
- `packages/maplibre/src/index.ts` — Current placeholder for MapLibre adapter implementation.
- `packages/maplibre/package.json` — MapLibre adapter package metadata; add MapLibre as renderer dependency here, not in core.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `RendererAdapter` already defines attach/detach, pointer events, temporary feature hooks, committed feature hooks, vertex handles, selection, snap visuals, and coordinate conversion.
- `IndoorEditor` already implements the renderer-neutral draw/edit/snap/validate/import/export behavior that MapLibre should drive through adapter events.
- `LeafletRendererAdapter` provides a working parity reference for layer lifecycle, committed feature storage, selection refresh, handle rendering, snap indicators, level filtering, and test helper methods.
- `LeafletEditingStyles` provides a usable style vocabulary for Phase 4 style override design.
- `FakeRendererAdapter` and existing core tests provide contract-level patterns for testing renderer-neutral behavior without a real map.

### Established Patterns

- Core remains framework-independent and renderer-neutral; concrete renderer imports stay in adapter packages.
- Host-owned UI remains the product boundary. SDK APIs and events power host controls; SDK-owned map visuals stay inside adapters.
- Feature records are the renderer input, while OsmInEdit-style primitives remain the import/export source of truth.
- Relation-backed features are state/export/validation records, not grouped map geometry in v1.
- Tests prefer deterministic adapter state inspection and fixture-backed export assertions.

### Integration Points

- Implement MapLibre adapter behavior in `packages/maplibre`.
- Add `maplibre-gl` as a MapLibre package dependency or peer/dev dependency without pulling it into core.
- Extend or audit core events/config only where Phase 4 requirements require host integration completeness.
- Reuse Leaflet tests as a behavioral checklist, adapting assertions to MapLibre source/layer state.
- Keep Phase 5 examples/docs out of scope except for any tiny test fixture needed to prove the adapter.

</code_context>

<specifics>
## Specific Ideas

- Treat Leaflet as the behavioral oracle and MapLibre as a renderer-specific translation, not a second product design.
- Use MapLibre-native source/layer mechanics internally while preserving the shared SDK editing vocabulary externally.
- Make events and configuration the proof that host apps can own all application UI.

</specifics>

<deferred>
## Deferred Ideas

- Vanilla MapLibre example and polished docs are Phase 5.
- Real OpenStreetMap publishing remains out of scope for v1.
- Framework wrappers remain v2.
- Rich icon catalogs or advanced door/POI symbol libraries are deferred unless a minimal configurable v1 style requires them.
- Floor plan image calibration and metadata export remain v2/future work.

</deferred>

---

*Phase: 4-MapLibre Parity and Host Integration*
*Context gathered: 2026-05-12*
