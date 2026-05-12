# Architecture Research: Osm Indoor Editing Library

**Date:** 2026-05-12
**Context:** Headless frontend SDK with core engine and map renderer adapters.

## Proposed Architecture

```text
Host Application UI
  - buttons, forms, sidebars, save flow

SDK Public API
  - createEditor, startDraw, setLevel, updateTags, validate, export

Core Engine
  - editor state
  - feature store
  - primitive store
  - ID generation
  - geometry operations
  - levels
  - validation
  - events

Renderer Adapter Contract
  - map events
  - layer lifecycle
  - draw preview rendering
  - committed feature rendering
  - vertex handles
  - hit testing / drag hooks

Leaflet Adapter / MapLibre Adapter

Map Renderer
```

## Major Components

### Public Editor Facade

The main API should remain small and stable:

- `createEditor(options)`
- `destroy()`
- `setLevel(level)`
- `getLevel()`
- `startDraw(type, options?)`
- `cancelDraw()`
- `finishDraw()`
- `selectFeature(id)`
- `deleteFeature(id)`
- `updateTags(id, tags)`
- `getElements()`
- `loadOsmInEdit(data)`
- `exportOsmInEdit()`
- `validate()`
- `on(eventName, handler)`
- `off(eventName, handler)`

### Core State

Core state should be renderer-agnostic:

- Current tool/mode.
- Current level.
- Features by local ID.
- Nodes, ways, and relations by numeric ID.
- Feature-to-primitive links.
- Selection state.
- Validation issues.
- Style config.
- Adapter registration.

### Primitive Store

The primitive store owns:

- Numeric ID allocation.
- Node coordinate updates.
- Way node ordering and closure.
- Relation members.
- Tag/timestamp persistence.
- Import/export ordering.
- Dangling-reference checks.

### Feature Store

The feature store owns editing semantics:

- Feature kind.
- Geometry type.
- Level.
- Tags.
- Linked nodes/ways/relations.
- Selection and edit metadata.

### Geometry Service

Renderer-agnostic operations:

- Build room/corridor/line/point primitives.
- Close polygons.
- Move vertex.
- Add/delete vertex.
- Move feature.
- Snap candidate lookup.
- Detect invalid polygons and self-intersections.
- Preserve shared-node topology.

### Validation Service

Composable rule pipeline:

- Built-in rule set.
- Host-provided rule registration.
- Severity support.
- Full validation and targeted validation after edits.

### Event Bus

Typed events should be part of the public contract. Events are how host UI stays in sync without the SDK owning UI.

### Renderer Adapters

Adapters should implement an interface similar to:

- Attach/detach from map.
- Register/unregister pointer and click events.
- Create/update/remove temporary draw visuals.
- Create/update/remove committed feature visuals.
- Create/update/remove vertex handles.
- Render selection/hover/snap states.
- Convert renderer event coordinates to `{ lat, lon }`.

## Build Order Implications

1. Define public types, primitives, feature model, editor state, and event bus.
2. Implement import/export and ID strategy.
3. Implement core drawing/edit operations without renderer dependency.
4. Define adapter contract and a fake/test adapter.
5. Implement Leaflet adapter first because its vector layer model is direct and good for proving behavior.
6. Implement MapLibre adapter after core behavior is stable because source/layer updates require a different rendering model.
7. Add shared-node snapping once basic draw/edit/export is working.
8. Add relations and validation breadth after primitive operations are reliable.
9. Add examples last as integration proof.

## Testing Strategy

- Unit tests for ID generation, primitive store, import/export, way closure, tags, and validation.
- Unit tests for geometry operations with a fake adapter.
- Adapter contract tests where possible.
- Browser/integration tests for examples once packages exist.
- Round-trip fixtures for OsmInEdit-style JSON.

## Architectural Risks

- Allowing adapters to own too much state will fragment behavior across Leaflet and MapLibre.
- Treating geometry as GeoJSON-only can lose OSM-like node sharing semantics.
- Making validation renderer-aware will make it hard to test.
- Baking in UI concepts will violate the main product boundary.
