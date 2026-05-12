# Phase 2: Leaflet Editing MVP - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the first visible end-to-end Leaflet editing MVP. A host app can attach the Leaflet adapter, start drawing rooms, corridors, and POIs through host-owned controls, see SDK-managed temporary and committed map visuals, select and edit committed geometry, manage indoor levels/tags, and export OsmInEdit-style JSON.

The SDK owns map interaction capture, temporary drawing visuals, committed feature layers, selection outlines, vertex handles, primitive synchronization, and Leaflet adapter behavior. The host app owns buttons, forms, sidebars, save/publish flows, and any product UI. Shared-node snapping, robust validation, MapLibre parity, full style system, and polished examples remain later phases.

</domain>

<decisions>
## Implementation Decisions

### Drawing Completion

- **D-01:** Drawing finishes through explicit host API calls. `startDraw("room" | "corridor" | "poi")` starts SDK-managed Leaflet map capture, while the host calls `finishDraw()` or `cancelDraw()` from its own controls.
- **D-02:** `finishDraw()` must reject incomplete drafts with a typed SDK error and must not commit primitives or visuals. Room/corridor polygons require at least 3 distinct vertices; POI requires 1 point.
- **D-03:** Room and corridor drafts show temporary vertices/lines immediately. Once 3 vertices exist, the SDK previews the closing segment and translucent polygon fill before finish.
- **D-04:** `cancelDraw()` performs full cleanup: remove temporary Leaflet layers, clear draft state, preserve committed data, and emit `drawingCancelled`.

### Leaflet Visual Layers

- **D-05:** Phase 2 uses a simple default editing palette: thin blue draft lines, light blue translucent polygon preview, calm committed outlines/fills, orange selected outline, and small circular vertex handles.
- **D-06:** Phase 2 exposes minimal Leaflet style overrides for draft lines, preview polygons, committed features, selected features, and vertex handles. Full styling for snap indicators, doors/POIs, and renderer-wide customization is deferred.
- **D-07:** The Leaflet adapter should create a dedicated SDK-owned pane/layer group, with internal separation for draft, committed features, selection, and handles. Host apps should not need to manage SDK layers directly.
- **D-08:** On level change, committed Leaflet visuals filter to the current level. Active drawing cannot silently migrate levels; a level switch should cancel or reject active draft state.

### Editing Gestures

- **D-09:** Clicking a committed Leaflet feature selects it, emits `featureSelected`, shows selected visual state, and displays editable handles.
- **D-10:** Dragging vertex handles directly updates linked node coordinates live, refreshes way geometry/Leaflet visuals, and emits primitive/feature update events.
- **D-11:** Selected line/polygon edges show subtle midpoint handles. Clicking a midpoint inserts a new node into the way sequence at that edge and refreshes geometry and handles.
- **D-12:** Vertex deletion is host-API-only in Phase 2, through an explicit method such as `deleteVertex(featureId, vertexIndex)`. Avoid map/keyboard deletion gestures until later.
- **D-13:** A selected feature can be moved as a whole by dragging its body. All linked node coordinates update together.

### Indoor Levels And Tags

- **D-14:** The SDK assigns minimum indoor tags during creation. Rooms get `indoor=room` and `level=currentLevel`; corridors get `indoor=corridor` and `level=currentLevel`; POIs get `level=currentLevel` plus host-supplied semantic tags when provided.
- **D-15:** Drawing requires a current level. `startDraw()` throws a typed SDK error if no level is set; do not silently default to `"0"`.
- **D-16:** Phase 2 preserves imported or host-updated `repeat_on` tags and applies simple visibility filtering: show features whose `level` matches the current level or whose `repeat_on` includes it. Full repeated-feature authoring is deferred.
- **D-17:** POI drawing is generic: `startDraw("poi", { tags })` or equivalent creates a point feature on the current level and preserves host-provided `amenity`, `shop`, `office`, `name`, and custom tags.

### Leaflet Proof Target

- **D-18:** Phase 2 proof requires both automated tests and a minimal Leaflet example. Tests should cover adapter behavior and core/editor draw-edit-export state changes.
- **D-19:** The Leaflet example should be bare and functional: Leaflet map, host-owned draw buttons, finish/cancel controls, level selector, simple tag/export panel, and no polished app shell or fixed editor UI kit.
- **D-20:** Add a basic Playwright smoke test for the example that verifies the map/example loads, controls exist, and the basic export path works.
- **D-21:** The Leaflet package should declare Leaflet as a peer dependency and use a dev dependency for repository tests/examples.

### The Agent's Discretion

The agent may choose exact internal module boundaries, test file layout, and minimal API naming details during planning, as long as the decisions above, existing core API shape, and Phase 2 roadmap requirements remain intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — Project boundary, core value, constraints, and v1/out-of-scope decisions.
- `.planning/REQUIREMENTS.md` — Phase 2 requirement IDs and traceability.
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, planned phase boundary, and dependencies.
- `.planning/STATE.md` — Current project state and deferred items.
- `.planning/phases/01-headless-core-foundation/01-CONTEXT.md` — Locked Phase 1 decisions that Phase 2 must build on.

### Product Requirements

- `docs/osm-indoor-prd.md` — Seed PRD defining Leaflet drawing/editing expectations, map visual ownership, indoor tags, and OsmInEdit-style output.

### Code Integration Points

- `packages/core/src/adapter.ts` — Renderer adapter contract that Leaflet must implement or evolve compatibly.
- `packages/core/src/editor.ts` — Public editor facade where Phase 2 replaces unsupported draw/edit methods with real behavior.
- `packages/core/src/feature-store.ts` — Feature records, local feature IDs, primitive links, and imported feature inference.
- `packages/core/src/primitive-store.ts` — Node/way/relation creation, validation, closed-way handling, and export ordering.
- `packages/leaflet/package.json` — Leaflet adapter package metadata; add Leaflet peer/dev dependency policy here.
- `packages/leaflet/src/index.ts` — Current Leaflet placeholder; Phase 2 adapter implementation starts here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `RendererAdapter` in `packages/core/src/adapter.ts` already defines attach/detach, pointer events, temporary feature hooks, committed feature hooks, vertex handles, selection, and coordinate conversion.
- `IndoorEditor` in `packages/core/src/editor.ts` already exposes `startDraw`, `cancelDraw`, `finishDraw`, `selectFeature`, `deleteFeature`, `updateTags`, `getState`, load/export, and typed event subscription; Phase 2 should replace relevant unsupported-operation stubs.
- `PrimitiveStore` can create nodes, closed ways, and relations with deterministic IDs/timestamps and validate closed area ways.
- `FeatureStore` links local feature records to backing primitive refs and already distinguishes feature IDs from primitive IDs.
- `FakeRendererAdapter` and core tests provide a contract-testing pattern for adapter behavior.

### Established Patterns

- Core remains framework-independent and renderer-neutral; concrete Leaflet imports belong in `packages/leaflet`, not `packages/core`.
- Public state inspection returns immutable snapshots/copies.
- Later-phase unsupported operations should fail loudly with typed SDK errors until implemented.
- Import/export must preserve OsmInEdit-style numeric IDs, tags, timestamps, and deterministic nodes-before-ways-before-relations ordering.

### Integration Points

- Add Leaflet adapter behavior in `packages/leaflet`.
- Extend core editor/drawing APIs only as needed for Phase 2 draw/edit workflows.
- Keep example work in `examples/leaflet` and host controls outside SDK-owned UI.
- Add browser smoke testing only for the bare Leaflet example proof, not a polished product demo.

</code_context>

<specifics>
## Specific Ideas

- The SDK should feel headless but not invisible: host controls invoke APIs, while SDK-managed Leaflet layers make drawing/editing feel real.
- Potentially destructive actions should stay explicit. Phase 2 allows map gestures for spatial edits but keeps vertex deletion host-API-only.
- The minimal Leaflet example should prove integration and export, not become the final documentation/demo experience.

</specifics>

<deferred>
## Deferred Ideas

- Full style override system, including snap indicators, doors/POIs, and renderer-wide visual customization, remains Phase 4.
- Shared-node snapping and connected wall semantics remain Phase 3.
- Full repeated-feature authoring for `repeat_on` remains later; Phase 2 only preserves and filters.
- Polished examples and documentation remain Phase 5.

</deferred>

---

*Phase: 2-Leaflet Editing MVP*
*Context gathered: 2026-05-12*
