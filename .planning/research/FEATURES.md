# Feature Research: Osm Indoor Editing Library

**Date:** 2026-05-12
**Context:** Headless indoor map editing SDK with OsmInEdit-style output.

## Table Stakes

These are required for v1 because they directly support the PRD's core promise.

### Headless SDK API

- Create/destroy editor instance.
- Start, cancel, and finish drawing operations.
- Select, update, and delete features.
- Get/set current level.
- Update tags.
- Import/export OsmInEdit-style JSON.
- Subscribe/unsubscribe to events.

### Data Model

- Internal feature model for ergonomic editing.
- OSM-like primitive model for nodes, ways, and relations.
- Bidirectional synchronization between geometry edits and primitives.
- Stable large numeric local IDs.
- Closed way handling with first node repeated at the end.
- Preservation of imported IDs, tags, and timestamps where appropriate.

### Drawing

- SDK-owned temporary drawing layer.
- Click capture for points and polygon vertices.
- Temporary vertices, temporary lines, and polygon preview.
- Finish and cancel behavior.
- Conversion from temporary geometry to committed editable geometry.

### Editing

- Feature selection.
- Hover/selected visual states.
- Draggable vertex handles.
- Move vertex/node.
- Add/delete vertex.
- Move whole feature.
- Delete feature.
- Edit tags.
- Keep node coordinates and way node sequences valid after edits.

### Indoor Semantics

- Room polygon.
- Corridor polygon.
- POI/point feature.
- Level state and level filtering.
- Automatic tags such as `indoor=room`, `indoor=corridor`, and `level`.
- Support for multi-level tags such as `repeat_on`.

### Shared Nodes and Walls

- Snap to nearby existing nodes.
- Snap to existing edges.
- Reuse node IDs when geometry intentionally shares boundaries.
- Update connected ways when shared nodes move.

### Relations

- Basic relation primitive model.
- Relation import/export.
- Relation validation.
- Minimal editing hooks where relations are needed to group structures.

### Validation

- Structured issues with severity, rule ID, element ID/type, and message.
- Built-in rules for missing tags/levels, invalid polygons, unclosed ways, dangling references, broken relation members, duplicate nodes, self-intersections, and feature-specific tag expectations.
- Pluggable rule registration so host apps can add/remove rules.

### Renderer Adapters

- Leaflet adapter.
- MapLibre adapter.
- Adapter contract hides renderer-specific details from core.
- SDK-owned temporary, committed, vertex, selection, and snap helper layers.

### Styling and Events

- Default styles for temporary/committed/selected/editing/snap visuals.
- Host override support.
- Events for tool changes, drawing lifecycle, feature CRUD, node/way/relation updates, level changes, validation changes, export readiness, and errors.

### Examples

- Vanilla Leaflet example.
- Vanilla MapLibre example.
- Examples must demonstrate host-owned UI calling SDK APIs.

## Differentiators To Defer

- Floor plan image calibration.
- Real-time collaboration.
- Framework wrappers.
- OSM publishing.
- Operation history and undo/redo beyond minimal internal consistency support.
- Complex multipolygon indoor relation authoring.
- Advanced topology repair.

## Anti-Features

- Forcing a toolbar/sidebar/modal.
- Hiding OSM-like primitives behind a polygon-only export.
- Binding the core engine to a specific renderer.
- Treating shared walls as duplicated polygon coordinates only.
- Adding backend schema or auth assumptions to a frontend SDK.

## Dependencies Between Features

- Adapter contract must exist before renderer packages.
- Primitive store and ID generation must exist before draw/export.
- Feature-to-primitive linking must exist before geometry editing.
- Selection and vertex handles depend on committed feature rendering.
- Shared-node snapping depends on a spatial index and primitive store.
- Import/export should arrive before broad adapter demos, so examples can prove round-trip behavior.
