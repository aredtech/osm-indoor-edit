# Pitfalls Research: Osm Indoor Editing Library

**Date:** 2026-05-12
**Context:** Headless OsmInEdit-style indoor editing SDK.

## Critical Pitfalls

### 1. Polygon-Only Thinking

**Mistake:** Store rooms and corridors as isolated polygons and generate nodes/ways only at export time.

**Why it hurts:** Shared nodes, shared walls, stable IDs, and imported primitive editing become fragile or impossible.

**Prevention:** Make OSM-like primitives first-class from phase 1. Feature geometry should link to nodes/ways instead of replacing them.

**Phase:** Phase 1 and Phase 2.

### 2. Renderer Leakage Into Core

**Mistake:** Let Leaflet or MapLibre types flow through the core engine.

**Why it hurts:** The second adapter becomes a rewrite instead of an adapter.

**Prevention:** Define a renderer-agnostic adapter contract and test core with a fake adapter.

**Phase:** Phase 1 and Phase 3.

### 3. Forced UI Creep

**Mistake:** Add toolbar/sidebar/form components because examples need controls.

**Why it hurts:** The central promise is no forced UI.

**Prevention:** Examples can have minimal host UI, but SDK packages expose behavior and events only.

**Phase:** All phases, especially examples.

### 4. Snapping Too Late

**Mistake:** Build drawing/editing without thinking about shared nodes, then bolt snapping on later.

**Why it hurts:** Node reuse affects ID assignment, way construction, drag behavior, and validation.

**Prevention:** Include snap candidate abstractions early, even if advanced edge snapping comes after basic node snapping.

**Phase:** Phase 2.

### 5. Broken Round Trips

**Mistake:** Export works for newly drawn features but imported data cannot be edited and re-exported cleanly.

**Why it hurts:** Host apps need save/load/edit cycles.

**Prevention:** Add fixture-based round-trip tests before adapters are considered complete.

**Phase:** Phase 2.

### 6. MapLibre Drag Complexity

**Mistake:** Assume MapLibre drag handles work like Leaflet markers.

**Why it hurts:** MapLibre uses sources/layers and event handling over rendered features, so interactive vertex handles require careful source updates and hit logic.

**Prevention:** Stabilize the adapter contract with Leaflet and fake adapter first; build MapLibre with explicit interaction tests.

**Phase:** Phase 4.

### 7. Validation As Strings

**Mistake:** Return plain validation messages.

**Why it hurts:** Host UIs need filtering, highlighting, routing to elements, and custom rules.

**Prevention:** Use structured issues from the beginning: severity, ruleId, elementId, elementType, message, metadata.

**Phase:** Phase 2 and Phase 5.

### 8. Oversized Dependencies

**Mistake:** Pull in all-in-one geometry libraries without watching bundle impact.

**Why it hurts:** This is a frontend SDK and should stay reasonably lightweight.

**Prevention:** Prefer modular imports and keep adapters as peer-dependent packages.

**Phase:** Phase 1 and package setup.

### 9. Ambiguous Coordinates

**Mistake:** Mix `[lat, lon]`, `[lon, lat]`, Leaflet `LatLng`, MapLibre coordinates, and GeoJSON coordinates casually.

**Why it hurts:** Exports will be subtly wrong.

**Prevention:** Core coordinate type should be explicit, likely `{ lat: number; lon: number }`; adapters convert at boundaries.

**Phase:** Phase 1.

### 10. Relations Without Scope

**Mistake:** Try to implement full OSM relation editing in v1.

**Why it hurts:** It can consume the project before drawing/edit/export is strong.

**Prevention:** v1 relation support means primitive model, import/export, validation, and minimal grouping hooks, not full advanced multipolygon authoring.

**Phase:** Phase 5.
