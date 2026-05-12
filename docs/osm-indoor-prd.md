# OsmInEdit-Style Frontend Editing Library — Requirements Document

## 1. Purpose

This document defines the requirements for building a **frontend TypeScript library** that provides OsmInEdit-like indoor map editing behavior without forcing any UI.

The library should give developers the core editing capabilities of OsmInEdit as reusable JavaScript/TypeScript APIs.

The goal is simple:

> Build what OsmInEdit gives as editor behavior and OsmInEdit-style output, but as a frontend library with no fixed UI.

The library should allow a host application to build its own UI while the library handles map editing logic.

---

## 2. Core Requirement

The library must provide:

```text
OsmInEdit-like indoor editing behavior
+
OsmInEdit-style JSON output
+
No forced editor UI
+
No real OpenStreetMap publishing in v1
+
No backend responsibility
```

The library is responsible for frontend editing only.

The host app is responsible for:

- UI
- Buttons
- Forms
- Sidebars
- Save flow
- Backend API calls
- User accounts
- Permissions
- Project storage
- Any real-world publishing

---

## 3. What This Library Is

This library is a **headless/frontend OsmInEdit-style editing engine**.

It should provide:

- Indoor drawing tools
- Temporary drawing layers
- Visual vertices
- Draggable nodes
- Geometry editing
- Indoor feature creation
- Level-aware editing
- OSM-like node/way/relation data handling
- OsmInEdit-style export
- Import/load of OsmInEdit-style data
- Validation
- Events for host UI integration

It should not provide a full editor application UI.

---

## 4. What This Library Is Not

This library is not:

- A complete web application
- A backend service
- A storage system
- A real OpenStreetMap uploader
- An OAuth/OpenStreetMap publishing client in v1
- A fixed UI editor
- An Angular/React/Vue component library in v1

The library should only run in the frontend and provide editing behavior.

---

## 5. Relationship to OsmInEdit

OsmInEdit is a full web editor application for indoor OpenStreetMap editing.

This project should extract the useful concept into a reusable frontend library.

The relationship is:

```text
OsmInEdit = full editor app
This project = OsmInEdit-like editing library
```

The library should try to emit the same kind of data OsmInEdit emits:

```json
{
  "elements": [
    {
      "type": "node",
      "id": 1000000001482549,
      "lat": 28.3918376,
      "lon": 77.2923857,
      "tags": {
        "level": "0",
        "name": "Node"
      },
      "timestamp": "2026-05-11T16:40:38Z"
    },
    {
      "type": "way",
      "id": 1000000000881326,
      "featureTypeId": 1,
      "nodes": [
        1000000001482549,
        1000000001482550,
        1000000001482551,
        1000000001482552,
        1000000001482549
      ],
      "tags": {
        "indoor": "room",
        "level": "0",
        "name": "Room"
      },
      "timestamp": "2026-05-11T16:40:40Z"
    }
  ],
  "status": true
}
```

This OsmInEdit-style JSON is the primary output format for v1.

---

## 6. Main Scope

The v1 scope is:

```text
Frontend TypeScript library
MapLibre and Leaflet support
SDK-owned drawing layer
OsmInEdit-style data model
OsmInEdit-style export
No backend
No real OSM publish
No framework wrappers
No forced UI
```

---

## 7. Supported Map Renderers

The library should initially support only:

- Leaflet
- MapLibre GL JS

The design should be extensible so other renderers can be added later, but v1 should not include:

- OpenLayers
- Cesium
- Google Maps
- Mapbox-specific dependency unless compatible through MapLibre-style adapter

---

## 8. Framework Support

The library should be a plain TypeScript library.

There should be no framework-specific wrappers in v1.

No initial packages for:

- Angular
- React
- Vue
- Svelte

However, any framework should still be able to use the library because it exposes normal JavaScript/TypeScript APIs.

Example:

```text
Angular app can call the SDK
React app can call the SDK
Vue app can call the SDK
Vanilla JS app can call the SDK
```

But the library itself should not depend on those frameworks.

---

## 9. UI Responsibility Split

### 9.1 Host App Owns UI

The host application owns all visible application UI, such as:

- Draw Room button
- Draw Corridor button
- Level switcher
- Save button
- Sidebar
- Tag form
- Room name input
- Validation panel
- Project list
- Notifications
- Styling outside the map
- User workflow

The SDK must not force a toolbar, modal, sidebar, or editor layout.

### 9.2 Library Owns Map Editing Behavior

The library owns the map editing behavior, such as:

- Starting drawing mode
- Adding temporary drawing layer
- Capturing map clicks
- Showing temporary points
- Showing temporary lines
- Showing polygon preview
- Creating visual vertices
- Making vertices draggable
- Creating nodes
- Creating ways
- Editing geometry
- Updating internal OsmInEdit-style data
- Exporting OsmInEdit-style JSON

The host app should not be required to implement map geometry editing manually.

---

## 10. Drawing Layer Requirement

The library must handle geometry creation by adding and managing a **temporary drawing layer** on the map.

This is a core feature.

When the host app says:

```text
start drawing room
```

the library should:

1. Add a temporary drawing layer.
2. Listen for map clicks.
3. Add visual temporary vertices.
4. Draw temporary lines between vertices.
5. Show polygon preview while drawing.
6. Allow the user to finish or cancel drawing.
7. Convert the final geometry into OsmInEdit-style nodes and ways.
8. Remove or convert temporary visuals into committed editable geometry.

The temporary drawing layer is controlled by the library through the active map adapter.

---

## 11. Visual Editing Requirement

The library must support visual editing after geometry is created.

For created features, the library should support:

- Selection
- Hover state
- Editable outline
- Visual vertex handles
- Draggable nodes/vertices
- Move vertex
- Add vertex
- Delete vertex
- Move whole feature
- Delete feature
- Update geometry after drag
- Keep exported nodes/ways in sync with geometry

When a vertex is dragged, the corresponding internal node position must update.

When a polygon is edited, the corresponding way node sequence must remain valid.

---

## 12. Drawing and Editing Flow

Example room drawing flow:

```text
Host app button: Draw Room
        ↓
Host app calls library: startDraw("room")
        ↓
Library adds temporary drawing layer
        ↓
User clicks map corners
        ↓
Library shows temporary vertices and lines
        ↓
User finishes polygon
        ↓
Library creates nodes
        ↓
Library creates closed way
        ↓
Library adds tags: indoor=room, level=currentLevel
        ↓
Host app may open its own form to edit name/tags
        ↓
Host app calls library to update tags
        ↓
Library export returns OsmInEdit-style JSON
```

---

## 13. Internal Data Model

The library should maintain both:

1. Internal feature/geometry representation
2. OSM-like primitives representation

The user’s requirement is to get OsmInEdit-style data, so the OSM-like primitive model is very important.

Internally, the library may use:

```text
Feature model for easy editing
+
Primitive model for OsmInEdit-style output
```

Feature model example:

```text
Feature
- localId
- type/kind
- geometry
- level
- tags
- linked node IDs
- linked way ID
```

Primitive model example:

```text
Node
- type = node
- id
- lat
- lon
- tags
- timestamp

Way
- type = way
- id
- nodes
- tags
- featureTypeId
- timestamp

Relation
- type = relation
- id
- members
- tags
- timestamp
```

---

## 14. OsmInEdit-Style Elements

The library must support these element types:

### 14.1 Node

A node represents a point.

Used for:

- Polygon vertices
- Doors if represented as points
- POIs
- Amenities
- Standalone indoor nodes

Required fields:

```text
type: "node"
id: numeric
lat: number
lon: number
tags: object
timestamp: ISO string
```

### 14.2 Way

A way represents an ordered list of node references.

Used for:

- Rooms
- Corridors
- Floor outlines
- Building outlines
- Linear indoor features

Required fields:

```text
type: "way"
id: numeric
nodes: numeric[]
tags: object
timestamp: ISO string
```

Optional field:

```text
featureTypeId: number
```

For closed areas, the first node ID should be repeated at the end.

Example:

```text
A → B → C → D → A
```

### 14.3 Relation

The user wants relation support in v1.

A relation should represent grouped or complex OSM-like structures.

Required fields should follow an OsmInEdit/OSM-like shape:

```text
type: "relation"
id: numeric
members: array
tags: object
timestamp: ISO string
```

Relation support in v1 does not need real OSM publishing behavior. It only needs frontend modeling, editing where needed, import/export, and validation.

---

## 15. Feature Types

The library should support indoor feature types such as:

- Room
- Corridor
- Door
- Stairs
- Elevator
- Escalator
- Entrance
- Amenity
- Shop
- Office
- POI
- Floor outline
- Building outline
- Custom feature

Each feature should be represented in OsmInEdit-style output as nodes, ways, and optionally relations.

---

## 16. Levels

The library must support indoor levels.

Requirements:

- Set current level
- Get current level
- Create/edit features on current level
- Filter visible features by level
- Update level tag on created features
- Support single-level and multi-level features
- Support tags like `level` and `repeat_on` where needed

The host app provides the level switcher UI.

The library only exposes APIs and state.

---

## 17. ID Strategy

OsmInEdit-style export should use numeric IDs.

The user requirement:

- IDs in OsmInEdit-style export should be numeric only.
- Local exported IDs should follow the large-number style seen in OsmInEdit.

The library should generate large numeric IDs for local frontend-created nodes, ways, and relations.

Example style:

```text
node id: 1000000001482549
way id: 1000000000881326
relation id: 1000000000000001
```

The library should maintain stable IDs during the editing session.

If data is imported and then edited, existing IDs should be preserved unless the object is newly created.

---

## 18. Shared Nodes and Shared Walls

The user wants node reuse/shared walls in v1.

The library should support preserving or creating shared nodes where adjacent geometries share boundaries.

Requirements:

- Detect nearby existing nodes during drawing.
- Snap to existing nodes if enabled.
- Reuse existing node IDs when appropriate.
- Allow adjacent rooms to share wall nodes.
- When a shared node is moved, connected ways should update.
- Export should not duplicate nodes unnecessarily when nodes are intentionally shared.

This is important because OsmInEdit/OSM-style data is node/way based, not isolated polygon-only data.

---

## 19. Geometry Operations

The library should support:

- Draw point
- Draw line
- Draw polygon
- Close polygon
- Select feature
- Move feature
- Move vertex/node
- Add vertex/node
- Delete vertex/node
- Delete feature
- Edit tags
- Snap to existing node
- Snap to existing edge
- Reuse shared nodes
- Preserve valid closed ways
- Detect invalid geometry

Minimum required for v1:

- Draw room polygon
- Draw corridor polygon
- Draw POI/node
- Drag vertices
- Edit tags
- Delete feature
- Export OsmInEdit-style JSON
- Import/load OsmInEdit-style JSON
- Shared nodes/walls
- Basic relation support

---

## 20. Validation

Validation should be moderately strict and pluggable.

The library should validate:

- Missing level
- Missing indoor tag
- Invalid polygon
- Unclosed way
- Way with too few nodes
- Duplicate node issues
- Self-intersecting polygon
- Dangling node references
- Broken way references
- Relation with missing members
- Room missing `indoor=room`
- Corridor missing `indoor=corridor`
- Door missing expected tags
- Feature outside current level/floor outline where applicable

Validation should return structured issues.

Example:

```text
severity: error | warning | info
elementId
elementType
message
ruleId
```

Validation rules should be pluggable so the host app can add or remove rules.

---

## 21. Import / Load Requirement

The library must be able to load OsmInEdit-style JSON.

This is important because the host app may save the exported JSON and later reload it.

Required behavior:

1. Accept OsmInEdit-style JSON.
2. Read nodes, ways, and relations.
3. Rebuild internal feature and primitive models.
4. Render committed features on the map.
5. Recreate editable vertex handles when a feature is selected.
6. Preserve numeric IDs.
7. Preserve tags.
8. Preserve timestamps where appropriate.
9. Allow editing after import.
10. Export back to the same OsmInEdit-style shape.

---

## 22. Export Requirement

The primary export method should return OsmInEdit-style JSON.

Conceptual API:

```text
exportOsmInEdit()
```

Output:

```text
{
  elements: [...],
  status: true
}
```

The library may also support GeoJSON export, but OsmInEdit-style export is the main requirement.

The library should not publish this data anywhere.

The host app decides what to do with the export.

---

## 23. No Backend Responsibility

The library does not care about backend implementation.

The library should not define backend schema, database requirements, PostGIS, user roles, project storage, autosave, or operation logs.

The host application may save the exported JSON wherever it wants.

The library responsibility ends at:

```text
Here is the current OsmInEdit-style data.
```

The host app responsibility starts at:

```text
Send it to backend, local storage, file download, or another system.
```

---

## 24. No Real OSM Publishing in v1

Real OpenStreetMap publishing is excluded from v1.

The library should not handle:

- OSM OAuth
- OSM changeset creation
- Upload to OpenStreetMap API
- Conflict handling with real OSM server
- OSM server object versions
- Real-world publish workflow

The host app receives the data and can decide what to do with it.

Publishing may be added later, but it must not shape v1 complexity.

---

## 25. Events

The library should expose events so the host app can build UI around it.

Useful events:

- ready
- toolChanged
- levelChanged
- drawingStarted
- drawingUpdated
- drawingCancelled
- drawingFinished
- featureCreated
- featureSelected
- featureUpdated
- featureDeleted
- nodeMoved
- wayUpdated
- relationUpdated
- tagsUpdated
- validationChanged
- exportReady
- error

The host app can listen and update its UI.

---

## 26. Styling

The library should allow map editing visuals to be styled.

Customizable visual styles:

- Temporary vertex
- Temporary line
- Temporary polygon fill
- Committed room fill
- Committed corridor fill
- Selected feature outline
- Hover outline
- Vertex handle
- Active vertex handle
- Snap indicator
- Door marker
- POI marker

The library should provide default styles, but the host app should be able to override them.

---

## 27. Floor Plan Support

Floor plan support should be designed carefully so it can be added without changing the architecture too much.

It does not need to be fully implemented in the first version unless easy.

Future floor plan support should include:

- Add floor plan image
- Assign to level
- Show/hide by level
- Set opacity
- Move image
- Scale image
- Rotate image
- Calibrate image
- Store calibration metadata in frontend state
- Include floor plan metadata in a separate export if needed

Floor plan images should not be mixed directly into OsmInEdit-style `elements`.

---

## 28. Package Structure

Initial package structure should be simple.

Recommended:

```text
packages/
  core/
  maplibre/
  leaflet/
  examples/
    vanilla/
    leaflet/
    maplibre/
```

Initial packages:

```text
@osminedit-lib/core
@osminedit-lib/leaflet
@osminedit-lib/maplibre
```

No initial packages for:

```text
@osminedit-lib/angular
@osminedit-lib/react
@osminedit-lib/vue
@osminedit-lib/ui
```

Those can be added later if needed.

---

## 29. High-Level Architecture

```text
Host Application UI
  - buttons
  - forms
  - sidebars
  - save action

        ↓

Frontend TypeScript Library API
  - startDraw
  - setLevel
  - updateTags
  - selectFeature
  - validate
  - exportOsmInEdit
  - loadOsmInEdit

        ↓

Core Editing Engine
  - editor state
  - nodes
  - ways
  - relations
  - levels
  - validation
  - import/export

        ↓

Map Adapter
  - Leaflet adapter
  - MapLibre adapter

        ↓

SDK-Owned Map Editing Layers
  - temporary drawing layer
  - committed feature layer
  - vertex handle layer
  - selection layer
  - snap helper layer

        ↓

Map Renderer
  - Leaflet or MapLibre
```

---

## 30. Example Usage Scenario

1. A developer installs the TypeScript library.
2. The app creates a Leaflet or MapLibre map.
3. The app initializes the library with the map adapter.
4. The app renders its own “Draw Room” button.
5. User clicks “Draw Room”.
6. App calls the library to start room drawing.
7. Library adds temporary drawing layer.
8. User clicks map corners.
9. Library shows temporary vertices and polygon preview.
10. User finishes drawing.
11. Library creates nodes.
12. Library creates a closed way.
13. Library assigns tags like `indoor=room` and `level=0`.
14. App opens its own room-name form.
15. User enters room name.
16. App calls library to update tags.
17. User drags a vertex.
18. Library updates the node position and way geometry.
19. User clicks app’s custom Save button.
20. App calls library export.
21. Library returns OsmInEdit-style JSON.
22. App decides whether to store it, download it, or send it somewhere.

---

## 31. MVP Must Have

The first version must include:

- Plain TypeScript core
- Leaflet adapter
- MapLibre adapter
- SDK-owned temporary drawing layer
- SDK-owned committed feature layer
- Visual vertex handles
- Draggable vertices/nodes
- Draw room polygon
- Draw corridor polygon
- Draw point/POI
- Current level support
- Tags support
- Feature selection
- Geometry editing
- Delete feature
- Shared nodes/walls
- Basic relation support
- Import OsmInEdit-style JSON
- Export OsmInEdit-style JSON
- Numeric large-style IDs
- Moderate pluggable validation
- Basic styling customization
- Vanilla examples for Leaflet and MapLibre

---

## 32. MVP Should Not Include

The first version should not include:

- Angular wrapper
- React wrapper
- Vue wrapper
- Fixed UI kit
- Backend logic
- Database schema
- OSM OAuth
- Real OpenStreetMap upload
- Changeset creation
- Real OSM conflict handling
- User management
- Roles/permissions
- Review workflow
- Autosave system
- Operation log system
- Full floor plan calibration unless easy

---

## 33. Public API Shape

The exact API can be designed during implementation, but conceptually the library should expose methods like:

```text
createEditor(options)
destroy()

setLevel(level)
getLevel()

startDraw(type)
cancelDraw()
finishDraw()

selectFeature(id)
deleteFeature(id)

updateTags(elementOrFeatureId, tags)
getElements()
loadOsmInEdit(data)
exportOsmInEdit()

validate()
on(eventName, handler)
off(eventName, handler)
```

The API should be small, predictable, and framework-independent.

---

## 34. Final Summary

The project should be a frontend TypeScript library that provides OsmInEdit-like indoor editing behavior without OsmInEdit’s fixed application UI.

The library should:

```text
Handle drawing
Handle temporary map layers
Handle visual draggable nodes
Handle indoor geometry editing
Handle nodes/ways/relations
Handle OsmInEdit-style import/export
Support Leaflet and MapLibre
Avoid backend and real OSM publishing in v1
Avoid framework wrappers in v1
```

The host application should:

```text
Build the UI
Call the library APIs
Receive OsmInEdit-style JSON
Decide what to do with the data
```

The key principle:

> Give developers OsmInEdit’s editing power and output format as a reusable frontend library, without forcing OsmInEdit’s UI or publishing workflow.
