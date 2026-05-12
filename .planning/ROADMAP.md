# Roadmap: Osm Indoor Editing Library

## Overview

The v1 journey builds the SDK from the inside out while preserving vertical usefulness. Phase 1 creates a typed headless core that can round-trip OsmInEdit-style primitives without a real map. Phase 2 makes that core visibly useful through Leaflet drawing and editing. Phase 3 hardens the OSM-like parts that make this more than a polygon tool: shared nodes, relations, validation, and round-trip editing. Phase 4 brings MapLibre to parity and completes style/event configurability. Phase 5 packages the experience with examples and documentation that prove the host app owns the UI.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Headless Core Foundation** - Typed packages, primitive store, feature links, adapter contract, and import/export core. (completed 2026-05-12)
- [x] **Phase 2: Leaflet Editing MVP** - First visible end-to-end drawing and editing experience through the Leaflet adapter. (completed 2026-05-12)
- [ ] **Phase 3: Topology, Relations, and Validation** - Shared nodes/walls, relation primitives, robust validation, and import/edit/export round trips.
- [ ] **Phase 4: MapLibre Parity and Host Integration** - MapLibre adapter, complete event surface, style overrides, and configurable behavior.
- [ ] **Phase 5: Examples, Docs, and Release Readiness** - Vanilla examples and documentation that make the SDK usable by host apps.

## Phase Details

### Phase 1: Headless Core Foundation
**Goal**: Developers can install/import typed core packages, create an editor, manage OSM-like primitives and feature links, and import/export OsmInEdit-style JSON without a real map renderer.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: [PKG-01, PKG-02, PKG-03, PKG-04, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, API-01, API-02, API-05, IO-01, IO-02, IO-03, ADAPT-01, ADAPT-04]
**Success Criteria** (what must be TRUE):
  1. Developer can run root build, type-check, and test commands successfully.
  2. Developer can create/destroy an editor and subscribe to typed events without Leaflet or MapLibre.
  3. Developer can create/import/export nodes, ways, and relations with stable numeric IDs and OsmInEdit-style shape.
  4. Closed polygon ways preserve first-node repetition and imported primitive data is not lost.
  5. Core behavior is testable through a fake adapter contract.
**Plans**: 4 plans

Plans:
- [x] 01-01: Workspace, package, build, and test foundation
- [x] 01-02: Primitive store, ID strategy, and OsmInEdit element types
- [x] 01-03: Feature model, editor facade, events, and level state
- [x] 01-04: Import/export round-trip and fake adapter contract tests

### Phase 2: Leaflet Editing MVP
**Goal**: A host app can use the Leaflet adapter to draw rooms, corridors, and POIs, edit geometry/tags, and export updated OsmInEdit-style JSON.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: [API-03, API-04, DRAW-01, DRAW-02, DRAW-03, DRAW-04, DRAW-05, DRAW-06, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, INDOOR-01, INDOOR-02, INDOOR-03, INDOOR-04, INDOOR-05, ADAPT-02]
**Success Criteria** (what must be TRUE):
  1. User can draw a room, corridor, and POI on a Leaflet map using host-owned controls.
  2. User sees temporary vertices, lines, polygon previews, committed geometry, selection, and editable vertex handles.
  3. User can drag, add, and delete vertices, move/delete features, and edit tags with primitive data staying synchronized.
  4. New indoor features receive expected indoor and level tags and can be filtered by current level.
  5. Cancelling a draw removes temporary visuals without mutating committed data.
**Plans**: 4 plans

Plans:
- [x] 02-01: Leaflet adapter layer lifecycle and coordinate conversion
- [x] 02-02: Drawing workflows for room, corridor, and POI
- [x] 02-03: Selection, vertex handles, geometry editing, and deletion
- [x] 02-04: Indoor tags, level filtering, and Leaflet export verification

### Phase 3: Topology, Relations, and Validation
**Goal**: The editor handles OSM-like topology seriously: shared nodes/walls, relation primitives, validation, imported editable data, and no duplicate shared geometry on export.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: [SNAP-01, SNAP-02, SNAP-03, SNAP-04, SNAP-05, REL-01, REL-02, REL-03, REL-04, VAL-01, VAL-02, VAL-03, VAL-04, VAL-05, VAL-06, INDOOR-06, IO-04, IO-05, IO-06]
**Success Criteria** (what must be TRUE):
  1. User can snap to existing nodes and edges while creating adjacent rooms.
  2. Moving a shared node updates all connected ways and export avoids intentional duplicate nodes.
  3. Developer can import OsmInEdit-style data, edit it, and export it back with IDs and references intact.
  4. Developer can store, export, import, minimally edit, and validate relation primitives.
  5. Validation returns structured issues for missing tags/levels, invalid geometry, broken references, duplicate nodes, and broken relation members.
**Plans**: 4 plans

Plans:
- [ ] 03-01: Spatial index, node snapping, edge snapping, and shared-wall creation
- [ ] 03-02: Shared-node mutation semantics and imported editable feature rebuilding
- [ ] 03-03: Relation primitive support and minimal relation editing API
- [ ] 03-04: Built-in and pluggable validation rules

### Phase 4: MapLibre Parity and Host Integration
**Goal**: A host app can use the MapLibre adapter with behavior equivalent to Leaflet, customize editing visuals, configure editor behavior, and drive all UI through events.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: [ADAPT-03, API-06, EVT-01, EVT-02, STYLE-01, STYLE-02]
**Success Criteria** (what must be TRUE):
  1. User can draw, select, edit, snap, validate, import, and export through the MapLibre adapter.
  2. MapLibre temporary, committed, selection, vertex, and snap visuals update correctly through source/layer changes.
  3. Developer can override styles for drawing, committed features, handles, snap indicators, doors, and POIs.
  4. Developer can configure default tags, ID behavior, validation rules, and style options.
  5. Host UI can stay fully external by reacting to typed SDK events.
**Plans**: 3 plans

Plans:
- [ ] 04-01: MapLibre source/layer rendering and pointer interaction model
- [ ] 04-02: MapLibre drawing/editing parity and topology integration
- [ ] 04-03: Events, style overrides, and editor configuration completion

### Phase 5: Examples, Docs, and Release Readiness
**Goal**: Developers can learn and verify the SDK through vanilla Leaflet and MapLibre examples plus documentation that clearly separates SDK responsibilities from host app responsibilities.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: [EX-01, EX-02, EX-03, EX-04]
**Success Criteria** (what must be TRUE):
  1. Developer can run a vanilla Leaflet example with host-owned controls for draw, level, tags, validation, import, and export.
  2. Developer can run a vanilla MapLibre example with the same host-owned workflow.
  3. Documentation explains what the SDK owns and what the host app owns.
  4. Documentation includes API examples for create, draw, edit tags, validate, load, export, and events.
  5. Release checks pass across packages and examples.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Vanilla Leaflet and MapLibre examples
- [ ] 05-02: Documentation, release checks, and package readiness

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Headless Core Foundation | 4/4 | Complete | 2026-05-12 |
| 2. Leaflet Editing MVP | 4/4 | Complete | 2026-05-12 |
| 3. Topology, Relations, and Validation | 0/4 | Not started | - |
| 4. MapLibre Parity and Host Integration | 0/3 | Not started | - |
| 5. Examples, Docs, and Release Readiness | 0/2 | Not started | - |
