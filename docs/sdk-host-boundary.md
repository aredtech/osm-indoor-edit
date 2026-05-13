# SDK and host responsibilities

The SDK is a headless indoor map editing library. It provides the editing behavior that would be tedious and error-prone for each host app to rebuild, while leaving product workflow and application UI decisions to the host.

## SDK owns

- Map editing behavior for drawing rooms, corridors, POIs, and imported indoor features.
- Temporary drawing visuals, committed feature visuals, selection visuals, vertex handles, and snap indicators.
- OSM-like node, way, and relation state used for OsmInEdit-style JSON.
- Level-aware feature state and renderer filtering hooks.
- Geometry editing operations such as move, insert, delete, detach, and shared-node updates.
- Structured validation results with severity, rule id, message, and element metadata.
- Built-in preset catalog data, preset search/browse/matching helpers, field schemas, sparse tag helpers, and preset geometry compatibility checks.
- Typed events for ready state, tool changes, drawing, feature updates, validation, export readiness, and errors.
- OsmInEdit-style JSON import and export.

## Host owns

- Buttons, forms, sidebars, modals, menus, and all visible application UI.
- Save/publish workflow, including whether validation warnings or errors block a save.
- Backend API calls, persistence, project storage, user accounts, roles, and permissions.
- Product navigation, notifications, analytics, collaboration, and audit logs.
- Preset picker UI, geometry choice UI, form rendering, tag forms, business rules, and any organization-specific validation policy.
- Application styling outside SDK-owned map editing visuals.

Preset workflows keep the same boundary: the SDK can tell a host which presets exist, which geometries a preset supports, what fields should be rendered, and which tag diff to apply. The host decides how the preset picker looks, how form rendering works, where field values are stored before applying, and whether preset changes require review.

## Validation and export policy

Validation is advisory data from the SDK. The SDK returns structured issues and emits validation events, but the host decides what to do with them.

Export remains available even when validation reports issues. A host application may block a save, show warnings, request fixes, or allow export based on its own workflow.

## Out of scope for v1

- Backend storage or hosted project management.
- Real OpenStreetMap OAuth, changesets, API upload, server version handling, or conflict resolution.
- React, Angular, Vue, Svelte, or other framework wrappers.
- Renderer adapters beyond Leaflet and MapLibre.
- Floor-plan calibration metadata in OsmInEdit `elements`; floor-plan support should remain separate from the OSM-like element list.
