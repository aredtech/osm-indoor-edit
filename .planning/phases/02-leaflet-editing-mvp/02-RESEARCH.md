# Phase 2 Research: Leaflet Editing MVP

**Phase:** 02 - Leaflet Editing MVP  
**Date:** 2026-05-12  
**Purpose:** Identify the technical approach needed to plan Leaflet drawing/editing behavior without violating the headless SDK boundary.

## Summary

Phase 2 should implement Leaflet as a thin renderer adapter plus the missing core editor behavior needed for drawing, selecting, editing, tagging, filtering, and exporting. The safest plan is to keep Leaflet imports inside `packages/leaflet`, expand core editor operations in renderer-neutral terms, and prove real integration through both automated contract/unit tests and a bare Leaflet example with Playwright smoke coverage.

## Primary Findings

### Leaflet Version And Dependency Shape

- Leaflet's official API reference currently reflects `1.9.4`; the docs also separate Leaflet 2.0 alpha references, so v1 should remain on the stable 1.9 line.
- npm registry lookup confirmed:
  - `leaflet`: `1.9.4`
  - `@types/leaflet`: `1.9.21`
- `@osminedit-lib/leaflet` should declare:
  - `peerDependencies.leaflet = "^1.9.4"`
  - `devDependencies.leaflet = "^1.9.4"`
  - `devDependencies.@types/leaflet = "^1.9.21"`
- Keep `@osminedit-lib/core` as a workspace dependency.

### Leaflet Adapter Surface

Leaflet has first-class pieces that map cleanly onto the existing renderer contract:

- `Map` supports click/mouse events and coordinate conversion methods, so adapter event capture should translate Leaflet map/layer events into core `Coordinate` payloads.
- `LayerGroup` supports `addLayer`, `removeLayer`, `clearLayers`, and `getLayers`, which fits an SDK-owned editing layer container.
- `Path`/`FeatureGroup` style APIs support `setStyle`, `bringToFront`, and `bringToBack`, which fits draft/committed/selected style transitions.
- `Polyline` and `Polygon` expose `setLatLngs`, which supports live geometry updates during drawing and vertex drags.
- `CircleMarker` and `Marker` can represent POIs/handles. Draggable marker behavior is mature, but for small vertex handles `CircleMarker` plus Leaflet `Draggable` or marker-based handles are both viable.

Recommendation: implement a `LeafletRendererAdapter` with concrete Leaflet layers internally, but expose only the core package's map-neutral contract and style options.

### Layer Architecture

Use an SDK-owned pane and root `LayerGroup`:

- Pane name: `osminedit-editing` or similar.
- Root layer group owns all SDK visuals.
- Internal groups:
  - draft vertices
  - draft line/polygon preview
  - committed features
  - selection highlight
  - vertex/midpoint handles
- `detach()` must remove the root group and pane-owned event listeners.

This structure gives deterministic cleanup, predictable z-order, and makes host apps independent from SDK internals.

### Core API Work Needed

Phase 1 intentionally left several public methods unsupported. Phase 2 should implement:

- `startDraw(kind, options?)`
- `cancelDraw()`
- `finishDraw()`
- `selectFeature(featureId | null)`
- `deleteFeature(featureId)`
- `updateTags(featureId, tags)`
- new explicit editing operations such as `deleteVertex(featureId, vertexIndex)` and likely an internal/adapter-driven `insertVertex`/`moveVertex`/`moveFeature` path.

The core needs a renderer-neutral draft/edit state model so the Leaflet adapter can send pointer coordinates and the core can decide what primitives/features change. Avoid putting primitive mutation rules only in `packages/leaflet`; MapLibre will need the same semantics later.

### Drawing Semantics

For room/corridor polygons:

- `startDraw("room" | "corridor")` requires current level.
- Map clicks add draft vertices.
- Once 3 distinct vertices exist, adapter shows a closed polygon preview.
- `finishDraw()` creates nodes and a closed way with repeated first node.
- Minimum tags:
  - room: `indoor=room`, `level=currentLevel`
  - corridor: `indoor=corridor`, `level=currentLevel`
- Invalid finish throws a typed SDK error and commits nothing.

For POIs:

- `startDraw("poi", { tags })` requires current level.
- First map click can create a draft point.
- `finishDraw()` commits a node-backed point feature.
- Preserve host tags such as `amenity`, `shop`, `office`, `name`, and custom tags.

### Editing Semantics

Phase 2 should support the user's selected gesture set:

- click committed feature to select
- show selected outline and handles
- drag vertex handles with live primitive coordinate updates
- show midpoint handles on selected edges; click midpoint to insert a node
- delete vertices via host API only
- drag selected feature body to move all linked nodes
- delete feature via host API
- update tags via host API

Plan risk: Phase 1 stores primitive maps privately and has limited mutation APIs. Plans must include core mutation methods for node coordinate updates, way node insertion/deletion, feature deletion, and tag updates before Leaflet gestures can be wired.

### Level Filtering

Implement a small core helper for visibility:

- visible if `feature.level === currentLevel`
- visible if `feature.tags.level === currentLevel`
- visible if `feature.tags.repeat_on` contains current level

Treat `repeat_on` as a delimiter-tolerant string for Phase 2. Support semicolon/comma separated values at minimum, but avoid full repeated-feature authoring until later.

### Testing Strategy

Use three layers of verification:

- Core unit tests for draw/edit primitives and events using the fake adapter.
- Leaflet adapter tests in jsdom/happy-dom where practical for attach/detach, layer creation, style translation, and event translation. Some Leaflet behavior may require DOM APIs; tests should avoid relying on real map tiles.
- Playwright smoke for the bare Leaflet example. Playwright's `webServer` config can launch a local dev server before tests and reuse it outside CI.

The Vite example should stay minimal: map, host-owned controls, level select, finish/cancel, simple tag/export panel.

## Planning Implications

Recommended four-plan split matching the roadmap:

1. **Leaflet package foundation and adapter lifecycle**
   - Add Leaflet peer/dev dependencies and types.
   - Implement adapter attach/detach, pane/group lifecycle, coordinate conversion, event registration, and default/minimal style translation.
   - Add Leaflet adapter tests.

2. **Core drawing engine and Leaflet drawing visuals**
   - Implement core draft state and `startDraw`/`cancelDraw`/`finishDraw`.
   - Wire Leaflet map clicks to draft updates.
   - Commit room/corridor/POI primitives and features.
   - Test draw/cancel/invalid finish/export behavior.

3. **Selection and geometry editing**
   - Implement feature selection, tag updates, deletion, vertex movement, vertex insertion, host API vertex deletion, and whole-feature movement.
   - Wire Leaflet selected visuals, vertex handles, midpoint handles, and drag flows.
   - Test primitive synchronization.

4. **Indoor filtering, example, and proof gate**
   - Implement level/repeat_on visibility filtering.
   - Build bare Leaflet example.
   - Add Playwright smoke.
   - Run final build/typecheck/test/browser gate.

## Risks And Mitigations

- **Risk: Leaflet-specific logic leaks into core.** Mitigation: core owns editing state transitions in map-neutral types; Leaflet only renders and translates events.
- **Risk: Phase 2 grows into full style/editor UI.** Mitigation: minimal style overrides only; host controls remain in example, not SDK.
- **Risk: geometry mutation breaks OsmInEdit export.** Mitigation: every editing plan must include primitive-store tests that assert node/way IDs, closed-way repetition, tags, and export order.
- **Risk: jsdom tests cannot fully emulate Leaflet map interaction.** Mitigation: combine focused adapter tests with a Playwright smoke on a real browser.
- **Risk: destructive gestures cause accidental edits.** Mitigation: Phase 2 uses map gestures for spatial movement/addition but keeps vertex deletion as explicit host API.

## Sources

- Leaflet API reference, version 1.9.4: https://leafletjs.com/reference.html
- Playwright web server config: https://playwright.dev/docs/test-webserver
- Vite guide: https://vite.dev/guide/
- npm registry lookups: `npm view leaflet version`, `npm view @types/leaflet version`

