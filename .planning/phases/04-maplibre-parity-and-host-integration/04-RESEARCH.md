# Phase 04 Research: MapLibre Parity and Host Integration

## Research Complete

Phase 04 should implement MapLibre as a renderer-specific translation of the already-proven core editor behavior. Leaflet remains the behavioral reference; MapLibre should differ internally only where the renderer model requires it.

## Phase Scope

**Phase:** 04 - MapLibre Parity and Host Integration

**Goal:** A host app can use the MapLibre adapter with behavior equivalent to Leaflet, customize editing visuals, configure editor behavior, and drive all UI through events.

**Requirement IDs:** ADAPT-03, API-06, EVT-01, EVT-02, STYLE-01, STYLE-02

## Current Codebase Findings

### Reusable Foundations

- `packages/core/src/adapter.ts` already defines the renderer-neutral adapter contract: attach/detach, pointer/feature/vertex/midpoint/drag events, temporary geometry, committed feature lifecycle, vertex handles, selection, snap indicator hooks, `project`, and `unproject`.
- `packages/core/src/editor.ts` already wires adapter events into draw/edit/snap/topology/validation behavior. MapLibre does not need a separate editor path if it implements the adapter faithfully.
- `packages/leaflet/src/leaflet-adapter.ts` is the closest behavioral reference. Its group separation maps cleanly to MapLibre source/layer separation: draft, committed, selection, handles, snap.
- `packages/leaflet/src/styles.ts` establishes the default editing visual vocabulary and palette.
- `packages/maplibre/src/index.ts` is only a placeholder, so Phase 04 must create the adapter and styles modules.
- `packages/maplibre/package.json` currently depends only on core. It needs `maplibre-gl` as the renderer package dependency/peer dependency and test/dev setup.

### Existing Host Integration Surface

`EditorEventMap` already includes most Phase 04 event requirements: `ready`, `toolChanged`, `levelChanged`, drawing lifecycle events, feature lifecycle events, primitive update events, relation update, validation, export, and error. Planning should audit whether `ready` and `error` are actually emitted from the editor lifecycle, because the type surface exists but implementation coverage may be incomplete.

`EditorOptions` already supports `adapter`, `target`, `clock`, `ids`, `defaultLevel`, `snapping`, and `validationRules`. Phase 04 should complete practical configuration by adding default tag/style behavior only where the requirements demand it; avoid replacing the existing injectable clock, ID allocator, validation, and snapping APIs.

## MapLibre Implementation Research

### Package and Dependency Shape

MapLibre GL JS is imported from `maplibre-gl`; the docs show npm usage via `npm install maplibre-gl` and importing `Map` or the default module. Keep this dependency isolated in `@osminedit-lib/maplibre`; do not add it to `@osminedit-lib/core`.

Recommended package shape:

- `packages/maplibre/src/maplibre-adapter.ts` — `MapLibreRendererAdapter` implementation.
- `packages/maplibre/src/styles.ts` — MapLibre editing style types, defaults, and merge helper.
- `packages/maplibre/src/index.ts` — public exports.
- `packages/maplibre/test/maplibre-adapter.test.ts` — layer/source lifecycle and contract tests.
- `packages/maplibre/test/maplibre-drawing.test.ts` — editor integration tests for draw/commit/update.
- `packages/maplibre/test/maplibre-editing.test.ts` — selection, handles, vertex/midpoint/feature drag.
- `packages/maplibre/test/maplibre-snapping.test.ts` — snap indicator source/layer state and core snapping integration.

### Source and Layer Model

MapLibre's renderer model is style-driven. The official docs show `map.addSource(..., { type: "geojson", data })`, `map.addLayer(...)`, and `GeoJSONSource#setData(...)` for re-rendering GeoJSON-backed features. Use dedicated SDK-owned GeoJSON sources and style layers rather than DOM markers for parity visuals.

Recommended source/layer groups:

| Concern | Source | Layers |
|---------|--------|--------|
| Draft geometry | `osminedit-draft` | draft line, draft fill, draft vertex circle |
| Committed features | `osminedit-committed` | committed fill, committed line, committed point |
| Selection | `osminedit-selection` | selected fill/line/point highlight |
| Handles | `osminedit-handles` | vertex circle, midpoint circle |
| Snap | `osminedit-snap` | snap point circle, snap edge line |

Keep layer IDs and source IDs prefixed by a configurable prefix such as `osminedit`. This avoids collisions with host style layers.

Use `setData()` for updates. For v1 scale, full source replacement is simpler and adequate. `GeoJSONSource#updateData()` can be considered later for large maps, but it requires unique IDs/promoted IDs and adds complexity not needed for this phase.

### Geometry Conversion

Core `Coordinate` is `{ lat, lon }`; GeoJSON requires `[lon, lat]`.

Conversion rules:

- Point feature -> GeoJSON `Point` with `[lon, lat]`.
- Line/polygon draft -> `LineString` for 2 points, `Polygon` when previewing closed polygon fill.
- Polygon feature -> GeoJSON `Polygon` with closed ring coordinates.
- Relation-backed feature -> no renderer feature; keep state/export/validation only.

Each GeoJSON feature should carry stable properties:

- `featureId`
- `geometryType`
- `kind`
- `level`
- `role`: `draft`, `committed`, `selection`, `vertex`, `midpoint`, `snap`
- `vertexIndex` or `edgeIndex` where relevant

These properties make hit testing and test assertions deterministic.

### Interaction Model

MapLibre supports map events and layer-specific events. Use:

- `map.on("click", handler)` for general pointer down when drawing.
- `map.on("mousemove", handler)` and `map.on("mouseup", handler)` for pointer move/up if needed.
- `map.on("click", committedLayerId, handler)` for feature selection.
- `map.on("click", midpointLayerId, handler)` for midpoint insertion.
- Mouse drag can be implemented with `mousedown` on handle/feature layers, then temporary `mousemove`/`mouseup` listeners on the map. Disable/restore drag-pan during active SDK drag if needed.
- Use `map.queryRenderedFeatures(point, { layers: [...] })` for layer hit testing. Query options allow limiting the search to SDK layer IDs.

`project`/`unproject` map directly to MapLibre `map.project([lon, lat])` and `map.unproject(point)`, with conversion back to `{ lat, lon }`.

### Level Filtering

Follow Leaflet semantics using core `isFeatureVisibleOnLevel(feature, currentLevel)` before adding/updating committed and selection GeoJSON data. Keep all committed features in adapter memory, and regenerate the committed FeatureCollection when `setLevel()` changes.

### Style Override Strategy

Use a MapLibre style vocabulary that mirrors Leaflet names:

- `draftLine`
- `draftVertex`
- `preview`
- `committed`
- `selected`
- `vertexHandle`
- `midpointHandle`
- `snapIndicator`
- optionally `poi` and `door` if the planner decides to satisfy STYLE-01 explicitly with separate keys.

Unlike Leaflet, MapLibre needs paint/layout objects. Recommended shape:

```ts
export interface MapLibreEditingStyles {
  draftLine: LineLayerStyle;
  draftVertex: CircleLayerStyle;
  preview: FillLayerStyle;
  committed: {
    fill: FillLayerStyle;
    line: LineLayerStyle;
    circle: CircleLayerStyle;
  };
  selected: {
    fill: FillLayerStyle;
    line: LineLayerStyle;
    circle: CircleLayerStyle;
  };
  vertexHandle: CircleLayerStyle;
  midpointHandle: CircleLayerStyle;
  snapIndicator: {
    circle: CircleLayerStyle;
    line: LineLayerStyle;
  };
}
```

The exact type aliases can be adapter-local and import MapLibre style spec types. Core should not import MapLibre types.

### Testing Strategy

MapLibre may be difficult to instantiate fully under plain DOM tests because it expects WebGL/browser APIs. Avoid brittle real-map tests for core parity. Use two layers of testing:

1. **Unit/contract tests against a fake MapLibre map object** implementing the subset the adapter needs: `on`, `off`, `addSource`, `removeSource`, `addLayer`, `removeLayer`, `getSource`, `getLayer`, `project`, `unproject`, `queryRenderedFeatures`, drag-pan hooks.
2. **Editor integration tests** using `createEditor({ adapter, target })` with the MapLibre adapter attached to the fake map. Fire fake map/layer events and assert exported primitives, adapter source data, layer counts, and event emissions.

This matches the existing Leaflet/fake adapter test style and avoids moving Phase 5's browser example work into Phase 4.

## Validation Architecture

Phase 04 has automated test coverage available through Vitest. Nyquist validation should require:

- Each MapLibre source/layer lifecycle task has tests proving sources/layers are created, updated, and removed.
- Each interaction parity task has tests proving adapter events drive core editor behavior and exported OsmInEdit data changes correctly.
- Each style/config/event task has tests proving overrides merge, expected event payloads emit, and host UI can react without SDK controls.
- Full phase verification should run `pnpm typecheck` and `pnpm test`.

Suggested per-plan commands:

- `pnpm test -- --runInBand packages/maplibre/test/maplibre-adapter.test.ts packages/maplibre/test/maplibre-drawing.test.ts`
- `pnpm test -- --runInBand packages/maplibre/test/maplibre-editing.test.ts packages/maplibre/test/maplibre-snapping.test.ts packages/core/test/editor-snapping.test.ts`
- `pnpm test -- --runInBand packages/core/test/events.test.ts packages/core/test/editor.test.ts packages/maplibre/test/maplibre-adapter.test.ts`
- `pnpm typecheck`
- `pnpm test`

## Threat Model Research Notes

Every Phase 04 plan should include a `<threat_model>` block because security enforcement is enabled by default.

Likely threats:

- Renderer leakage into core. Mitigation: keep `maplibre-gl` imports inside `packages/maplibre`; acceptance checks grep core for MapLibre imports.
- Host style collision. Mitigation: configurable source/layer prefix and SDK-owned layer ID registry.
- Broken cleanup on detach/style reload. Mitigation: deterministic removal of all SDK sources/layers/listeners and tests for detach.
- Stale source state after edits/level switches. Mitigation: regenerate source FeatureCollections from adapter memory after every update and test level filtering.
- Drag interaction leaves map drag-pan disabled. Mitigation: restore drag-pan on pointer up/cancel and detach.
- Relation-backed features accidentally render as broken geometry. Mitigation: skip `geometryType: "relation"` in MapLibre rendering.

## Recommended Plan Breakdown

Use the roadmap's three plan structure:

1. **04-01: MapLibre source/layer rendering and pointer interaction model**
   - Add dependency/package exports.
   - Implement adapter attach/detach, source/layer initialization, projection, temporary/committed/selection/handle/snap source updates.
   - Add fake MapLibre map test harness.

2. **04-02: MapLibre drawing/editing parity and topology integration**
   - Wire layer hit testing and drag/midpoint events.
   - Prove editor workflows through MapLibre adapter: draw, select, edit, move, snap, level filter, import/export.

3. **04-03: Events, style overrides, and editor configuration completion**
   - Complete event emissions and config gaps.
   - Add MapLibre style override API and default palette.
   - Audit host-owned UI contract.

## Sources

- MapLibre GL JS documentation: https://maplibre.org/maplibre-gl-js/docs
- MapLibre GeoJSONSource API: https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/
- MapLibre API overview: https://maplibre.org/maplibre-gl-js/docs/API/
- MapLibre QueryRenderedFeaturesOptions API: https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/QueryRenderedFeaturesOptions/
- MapLibre feature query example: https://maplibre.org/maplibre-gl-js/docs/examples/get-features-under-the-mouse-pointer/
