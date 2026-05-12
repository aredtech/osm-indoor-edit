# Osm Indoor Editing Library

## What This Is

This project is a headless frontend TypeScript library that gives host applications OsmInEdit-like indoor map editing behavior without forcing any application UI. It provides drawing, geometry editing, level-aware indoor features, OSM-like primitives, validation, events, and OsmInEdit-style JSON import/export for developers building their own map editors.

The library is for applications that want OsmInEdit-style editing power and output, but need to own their own buttons, forms, sidebars, save flows, backend integration, user accounts, and publishing decisions.

## Core Value

Developers can add reliable indoor map editing behavior to a Leaflet or MapLibre frontend and export valid OsmInEdit-style node/way/relation JSON without building geometry editing themselves.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Provide a plain TypeScript core editing engine with no framework dependency.
- [ ] Support Leaflet and MapLibre GL JS through renderer adapters.
- [ ] Let the SDK own temporary drawing, committed feature, vertex handle, selection, and snap helper map layers.
- [ ] Support drawing room polygons, corridor polygons, and POI/point features.
- [ ] Support selection, hover state, editable outlines, draggable vertex handles, whole-feature movement, vertex add/delete, and feature deletion.
- [ ] Keep internal feature geometry and OSM-like node/way/relation primitives synchronized during editing.
- [ ] Export OsmInEdit-style JSON as the primary v1 output format.
- [ ] Import/load OsmInEdit-style JSON, preserve numeric IDs/tags/timestamps where appropriate, and allow editing after import.
- [ ] Generate stable large numeric local IDs for frontend-created nodes, ways, and relations.
- [ ] Support level-aware editing, level tags, level filtering, and multi-level tags such as `repeat_on` where needed.
- [ ] Support shared nodes and shared walls through snapping, node reuse, and connected-way updates.
- [ ] Support basic relation modeling, import/export, validation, and editing where needed.
- [ ] Provide moderately strict pluggable validation with structured issues.
- [ ] Expose events so host applications can build their own UI around library state.
- [ ] Provide default map editing styles with host override support.
- [ ] Include vanilla examples for Leaflet and MapLibre.

### Out of Scope

- Fixed editor UI, toolbar, sidebar, modal, or UI kit - host applications own visible workflow and styling.
- Backend service, storage system, database schema, user accounts, roles, permissions, autosave, or operation logs - the SDK stops at frontend editing state and export.
- Real OpenStreetMap publishing in v1 - OAuth, changesets, OSM API upload, conflict handling, and server object versions are deliberately excluded.
- Angular, React, Vue, Svelte, or other framework wrappers in v1 - the library should remain plain JavaScript/TypeScript and framework-independent.
- OpenLayers, Cesium, Google Maps, or Mapbox-specific support in v1 - initial adapters are Leaflet and MapLibre only.
- Full floor plan calibration in v1 unless it is cheap to include - architecture should leave room for it, but it must not drive v1 complexity.

## Context

The seed PRD is `docs/osm-indoor-prd.md`. It defines the project as an OsmInEdit-style frontend editing engine rather than a complete editor application. The useful concept to extract from OsmInEdit is editor behavior plus OsmInEdit-style JSON output, not OsmInEdit's fixed UI or publishing workflow.

The library should maintain two complementary representations:

- A feature/geometry model optimized for editing behavior.
- An OSM-like primitive model containing nodes, ways, and relations for OsmInEdit-style import/export.

The main editing flow is host-driven: the host app renders its own UI, calls APIs such as `startDraw("room")`, and the SDK manages click capture, temporary vertices, temporary lines, polygon preview, committed geometry, primitives, and export. The host then edits tags or saves data through its own form and backend flow.

OsmInEdit-style JSON is the primary v1 interchange format:

- `node` elements have numeric `id`, `lat`, `lon`, `tags`, and ISO `timestamp`.
- `way` elements have numeric `id`, ordered `nodes`, `tags`, ISO `timestamp`, and optional `featureTypeId`.
- `relation` elements have numeric `id`, `members`, `tags`, and ISO `timestamp`.
- Closed ways repeat the first node ID at the end.
- Export shape is `{ "elements": [...], "status": true }`.

Indoor features should include rooms, corridors, doors, stairs, elevators, escalators, entrances, amenities, shops, offices, POIs, floor outlines, building outlines, and custom features. Minimum v1 behavior must cover room polygons, corridor polygons, POIs, tags, current level, selection, geometry editing, deletion, shared nodes/walls, import/export, validation, and examples.

## Constraints

- **Tech stack**: Plain TypeScript library - no framework dependency in the core packages.
- **Renderer compatibility**: Leaflet and MapLibre are the only v1 map renderers.
- **Architecture**: Renderer-specific map behavior must be isolated behind adapters so the core editing engine remains reusable.
- **Data format**: OsmInEdit-style JSON is the primary v1 output and import format.
- **ID strategy**: Exported IDs must be numeric only, stable during a session, and use the large-number local style seen in OsmInEdit.
- **UI boundary**: The SDK owns map editing behavior and map editing visuals, while the host owns application UI and save/publish workflow.
- **Publishing boundary**: No real OpenStreetMap publishing in v1.
- **Validation**: Validation should be structured and pluggable, with moderately strict built-in rules.
- **Floor plans**: Floor plan support should be architecturally possible later, but images and calibration metadata should not be mixed into OsmInEdit `elements`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a headless/frontend TypeScript library instead of a full editor app | Host applications need editing behavior and OsmInEdit-style output without inheriting OsmInEdit's UI, backend, or publishing workflow | - Pending |
| Support Leaflet and MapLibre in v1 | These are the requested initial renderers and cover common open web map use cases | - Pending |
| Keep the core framework-independent | Angular, React, Vue, and vanilla apps should all be able to use normal TypeScript APIs | - Pending |
| Treat OsmInEdit-style JSON as the primary v1 format | The main success condition is producing OsmInEdit-like node/way/relation output | - Pending |
| Include shared nodes/walls and relation support in v1 | The target format is OSM-like, so connected primitives matter; isolated polygon-only editing would miss the point | - Pending |
| Exclude real OSM publishing from v1 | OAuth, changesets, and conflict handling would expand scope beyond frontend editing | - Pending |
| Defer framework wrappers and UI kit packages | v1 should establish the editing engine and adapters before adding convenience wrappers | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-12 after initialization*
