# Requirements: Osm Indoor Editing Library

**Defined:** 2026-05-12
**Core Value:** Developers can add reliable indoor map editing behavior to a Leaflet or MapLibre frontend and export valid OsmInEdit-style node/way/relation JSON without building geometry editing themselves.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Package Foundation

- [ ] **PKG-01**: Developer can install and import a plain TypeScript core package with generated type declarations.
- [ ] **PKG-02**: Developer can use separate Leaflet and MapLibre adapter packages without pulling both renderers into every app.
- [ ] **PKG-03**: Developer can run build, type-check, and test commands from the repository root.
- [ ] **PKG-04**: Developer can inspect public API types for editor options, events, features, primitives, validation issues, and adapter contracts.

### Core Data Model

- [ ] **DATA-01**: Editor state stores OSM-like nodes, ways, and relations with numeric IDs, tags, and timestamps.
- [ ] **DATA-02**: Editor state stores editable feature records linked to their backing node, way, and relation primitives.
- [ ] **DATA-03**: New frontend-created nodes, ways, and relations receive stable large numeric IDs for the editing session.
- [ ] **DATA-04**: Imported primitive IDs, tags, and timestamps are preserved unless the host explicitly updates them.
- [ ] **DATA-05**: Closed polygon ways repeat the first node ID at the end and remain valid after geometry edits.

### Public Editor API

- [ ] **API-01**: Developer can create and destroy an editor instance using a small framework-independent API.
- [ ] **API-02**: Developer can get and set the current indoor level.
- [x] **API-03**: Developer can start, cancel, and finish drawing for supported feature types.
- [x] **API-04**: Developer can select, delete, move, and update tags for created or imported features.
- [ ] **API-05**: Developer can subscribe and unsubscribe to typed editor events.
- [ ] **API-06**: Developer can configure default tags, ID strategy options, validation rules, and editing styles.

### Drawing Behavior

- [x] **DRAW-01**: User can draw a room polygon through SDK-managed map click capture and temporary visuals.
- [x] **DRAW-02**: User can draw a corridor polygon through the same drawing workflow.
- [x] **DRAW-03**: User can draw a POI/point feature.
- [x] **DRAW-04**: During drawing, user sees temporary vertices, temporary lines, and polygon preview where applicable.
- [x] **DRAW-05**: User can finish drawing and receive committed editable geometry backed by nodes and ways.
- [x] **DRAW-06**: User can cancel drawing and the SDK removes temporary visuals without mutating committed data.

### Editing Behavior

- [x] **EDIT-01**: User can select a feature and see selected/hover/editable visual state.
- [x] **EDIT-02**: User can drag a vertex handle and the linked node coordinates update.
- [x] **EDIT-03**: User can add a vertex to an existing way and the way node sequence updates.
- [x] **EDIT-04**: User can delete a vertex from an existing way while preserving minimum valid geometry rules.
- [x] **EDIT-05**: User can move a whole feature and all linked primitive coordinates update.
- [x] **EDIT-06**: User can delete a feature and the primitive store is updated without leaving broken references.
- [x] **EDIT-07**: User can update feature tags and see exports reflect the new tags.

### Indoor Semantics

- [x] **INDOOR-01**: New room features receive appropriate indoor and level tags.
- [x] **INDOOR-02**: New corridor features receive appropriate indoor and level tags.
- [x] **INDOOR-03**: New POI features can carry amenity, shop, office, name, level, and custom tags.
- [x] **INDOOR-04**: Developer can filter visible features by current level.
- [x] **INDOOR-05**: Developer can represent single-level and multi-level features using `level` and `repeat_on` style tags.
- [ ] **INDOOR-06**: Developer can create or import floor outline and building outline features as supported indoor feature types.

### Shared Nodes and Snapping

- [x] **SNAP-01**: User can snap a new vertex to a nearby existing node when snapping is enabled.
- [x] **SNAP-02**: User can snap a new vertex to an existing edge and reuse or create shared boundary nodes as needed.
- [x] **SNAP-03**: Adjacent rooms can intentionally share wall nodes.
- [ ] **SNAP-04**: When a shared node moves, all connected ways update consistently.
- [ ] **SNAP-05**: Export avoids duplicating nodes when features intentionally share geometry.

### Relations

- [ ] **REL-01**: Editor state can store relation primitives with numeric ID, members, tags, and timestamp.
- [ ] **REL-02**: Developer can import and export relation primitives in OsmInEdit-style JSON.
- [ ] **REL-03**: Developer can validate relations for missing or broken members.
- [ ] **REL-04**: Developer can use minimal relation editing APIs for grouping or complex indoor structures needed in v1.

### Import and Export

- [ ] **IO-01**: Developer can export current data as `{ elements: [...], status: true }`.
- [ ] **IO-02**: Export includes nodes, ways, and relations in an OsmInEdit-style shape.
- [ ] **IO-03**: Developer can load OsmInEdit-style JSON containing nodes, ways, and relations.
- [ ] **IO-04**: Loading data rebuilds editable internal feature and primitive models.
- [ ] **IO-05**: Imported data can be edited and exported back to the same OsmInEdit-style shape.
- [ ] **IO-06**: Developer can get current elements without publishing or saving them anywhere.

### Validation

- [ ] **VAL-01**: Developer can run validation and receive structured issues with severity, rule ID, element ID/type, and message.
- [ ] **VAL-02**: Built-in validation detects missing level and missing indoor tags where required.
- [ ] **VAL-03**: Built-in validation detects unclosed ways, ways with too few nodes, dangling node references, and broken way references.
- [ ] **VAL-04**: Built-in validation detects invalid polygons and self-intersecting polygons.
- [ ] **VAL-05**: Built-in validation detects duplicate node problems and relation members that reference missing elements.
- [ ] **VAL-06**: Host applications can add, remove, or override validation rules.

### Events and Styling

- [ ] **EVT-01**: SDK emits lifecycle events for ready, tool changes, level changes, drawing start/update/cancel/finish, feature create/select/update/delete, primitive updates, validation changes, export readiness, and errors.
- [ ] **EVT-02**: Host applications can update their own UI entirely through API calls and events without SDK-owned controls.
- [ ] **STYLE-01**: SDK provides default styles for temporary vertices, temporary lines, polygon fills, committed features, selection, hover, vertex handles, snap indicators, doors, and POIs.
- [ ] **STYLE-02**: Host applications can override editing visual styles.

### Renderer Adapters

- [ ] **ADAPT-01**: Core defines a renderer adapter contract for map events, coordinate conversion, layer lifecycle, drawing preview, committed features, vertex handles, selection, and snapping visuals.
- [x] **ADAPT-02**: Leaflet adapter implements drawing, committed features, vertex handles, selection, dragging, and style overrides using Leaflet APIs.
- [ ] **ADAPT-03**: MapLibre adapter implements drawing, committed features, vertex handles, selection, dragging, and style overrides using MapLibre APIs.
- [ ] **ADAPT-04**: Core behavior can be tested with a fake adapter without requiring a real map renderer.

### Examples and Documentation

- [ ] **EX-01**: Vanilla Leaflet example demonstrates host-owned draw buttons, level control, tag update, validation display, import, and export.
- [ ] **EX-02**: Vanilla MapLibre example demonstrates the same host-owned workflow.
- [ ] **EX-03**: Documentation explains SDK responsibilities versus host application responsibilities.
- [ ] **EX-04**: Documentation includes public API examples for create, draw, edit tags, validate, load, export, and event subscription.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Future Adapters and Wrappers

- **FW-01**: React wrapper package.
- **FW-02**: Angular wrapper package.
- **FW-03**: Vue wrapper package.
- **FW-04**: Additional renderer adapters such as OpenLayers.

### Publishing and Collaboration

- **PUB-01**: Real OpenStreetMap OAuth and upload workflow.
- **PUB-02**: OSM changeset creation and conflict handling.
- **COLLAB-01**: Multi-user collaborative editing.
- **HIST-01**: Full operation log and undo/redo history.

### Floor Plans

- **FLOOR-01**: Add floor plan images by level.
- **FLOOR-02**: Calibrate, move, scale, rotate, and set opacity for floor plan images.
- **FLOOR-03**: Export floor plan calibration metadata separately from OsmInEdit `elements`.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Fixed editor UI kit | Host applications own UI; SDK must remain headless. |
| Backend service or storage schema | Host applications decide where and how to save exported JSON. |
| User accounts, roles, or permissions | Outside frontend editing engine responsibility. |
| Real OSM publishing in v1 | OAuth, changesets, server versions, and conflicts would over-expand v1. |
| Framework wrappers in v1 | Core API and adapters must stabilize first. |
| Leaflet 2 alpha baseline | Leaflet 1.9.4 is the stable v1 target; alpha support can be revisited later. |
| Full advanced relation authoring | v1 requires basic relation modeling/import/export/validation, not complete OSM relation UX. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01 | Phase 1 | Pending |
| PKG-02 | Phase 1 | Pending |
| PKG-03 | Phase 1 | Pending |
| PKG-04 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-05 | Phase 1 | Pending |
| IO-01 | Phase 1 | Pending |
| IO-02 | Phase 1 | Pending |
| IO-03 | Phase 1 | Pending |
| ADAPT-01 | Phase 1 | Pending |
| ADAPT-04 | Phase 1 | Pending |
| API-03 | Phase 2 | Complete |
| API-04 | Phase 2 | Complete |
| DRAW-01 | Phase 2 | Complete |
| DRAW-02 | Phase 2 | Complete |
| DRAW-03 | Phase 2 | Complete |
| DRAW-04 | Phase 2 | Complete |
| DRAW-05 | Phase 2 | Complete |
| DRAW-06 | Phase 2 | Complete |
| EDIT-01 | Phase 2 | Complete |
| EDIT-02 | Phase 2 | Complete |
| EDIT-03 | Phase 2 | Complete |
| EDIT-04 | Phase 2 | Complete |
| EDIT-05 | Phase 2 | Complete |
| EDIT-06 | Phase 2 | Complete |
| EDIT-07 | Phase 2 | Complete |
| INDOOR-01 | Phase 2 | Complete |
| INDOOR-02 | Phase 2 | Complete |
| INDOOR-03 | Phase 2 | Complete |
| INDOOR-04 | Phase 2 | Complete |
| INDOOR-05 | Phase 2 | Complete |
| ADAPT-02 | Phase 2 | Complete |
| SNAP-01 | Phase 3 | Complete |
| SNAP-02 | Phase 3 | Complete |
| SNAP-03 | Phase 3 | Complete |
| SNAP-04 | Phase 3 | Pending |
| SNAP-05 | Phase 3 | Pending |
| REL-01 | Phase 3 | Pending |
| REL-02 | Phase 3 | Pending |
| REL-03 | Phase 3 | Pending |
| REL-04 | Phase 3 | Pending |
| VAL-01 | Phase 3 | Pending |
| VAL-02 | Phase 3 | Pending |
| VAL-03 | Phase 3 | Pending |
| VAL-04 | Phase 3 | Pending |
| VAL-05 | Phase 3 | Pending |
| VAL-06 | Phase 3 | Pending |
| INDOOR-06 | Phase 3 | Pending |
| IO-04 | Phase 3 | Pending |
| IO-05 | Phase 3 | Pending |
| IO-06 | Phase 3 | Pending |
| ADAPT-03 | Phase 4 | Pending |
| API-06 | Phase 4 | Pending |
| EVT-01 | Phase 4 | Pending |
| EVT-02 | Phase 4 | Pending |
| STYLE-01 | Phase 4 | Pending |
| STYLE-02 | Phase 4 | Pending |
| EX-01 | Phase 5 | Pending |
| EX-02 | Phase 5 | Pending |
| EX-03 | Phase 5 | Pending |
| EX-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 67 total
- Mapped to phases: 67
- Unmapped: 0

---
*Requirements defined: 2026-05-12*
*Last updated: 2026-05-12 after roadmap creation*
