# Phase 6 - Pattern Map

**Phase:** 6 - Preset Catalog and Custom Draw Mode
**Created:** 2026-05-13

## Purpose

Map the Phase 6 implementation to existing code patterns so plans can be executed without inventing a new architecture.

## Closest Existing Analogs

### Public Core API

- `packages/core/src/editor.ts` is the public facade pattern. New editor methods should be plain TypeScript methods on `IndoorEditor`, implemented by `HeadlessIndoorEditor`, and exported through `packages/core/src/index.ts`.
- `packages/core/src/drawing.ts` is the draw state pattern. Extend `DrawKind`, `StartDrawOptions`, and `DraftDrawingState` here rather than storing draw options ad hoc in `editor.ts`.
- `packages/core/src/errors.ts` is the typed error pattern. Add a preset-specific typed error here if geometry compatibility or missing preset failures need a stable code.

### Data and Immutability

- `packages/core/src/feature-store.ts` is the feature snapshot pattern. Add optional preset metadata here only if it should appear in `editor.getState()`. Preserve clone-on-read behavior.
- `packages/core/src/primitive-store.ts` is the primitive creation/update pattern. Custom line drawing should create an open way with `closed: false`; custom polygon drawing should create a closed way with `closed: true`.
- `packages/core/src/types.ts` is the shared `Tags` source of truth. Preset helpers should use `Tags` and should not introduce non-export OSM fields into element tags.

### Renderer Boundary

- `packages/core/src/adapter.ts` already supports temporary `point`, `line`, and `polygon` geometry. Custom drawing should reuse this contract; renderer packages should not receive preset-specific concepts.
- `packages/leaflet/src/leaflet-adapter.ts` and `packages/maplibre/src/maplibre-adapter.ts` are parity checks only. Modify them only if custom line/point rendering exposes a real adapter gap.

### Tests

- `packages/core/test/editor-drawing.test.ts` is the draw lifecycle test pattern for point/polygon export and draft errors.
- `packages/core/test/feature-store.test.ts` is the feature metadata and clone-safety test pattern.
- `packages/core/test/import-export.test.ts` is the OsmInEdit round-trip/export assertion pattern.
- Add `packages/core/test/presets.test.ts` for catalog/search/matching/field/tag helper tests.

### Examples and Docs

- `examples/leaflet/src/main.ts` and `examples/maplibre/src/main.ts` are host-owned UI examples. Preset picker/form markup belongs here.
- `examples/leaflet/src/styles.css` and `examples/maplibre/src/styles.css` already define compact floating panel styles. Extend these styles; do not introduce a new visual system.
- `docs/api-recipes.md` is the recipe pattern for new preset APIs.
- `README.md` and `docs/sdk-host-boundary.md` must keep the SDK-vs-host boundary explicit.

## Planned File Areas

### Preset Catalog

- `packages/core/src/presets.ts` - preset types, catalog class/helpers, matching, field value helpers, tag diff helpers.
- `packages/core/src/preset-data.ts` - curated normalized built-in preset data.
- `packages/core/src/preset-icons.ts` or `packages/core/src/preset-icons/*.svg` - SVG icon exports/assets. Keep package export/files implications in mind.
- `packages/core/test/presets.test.ts` - catalog, search, override, match, and tag helper tests.

### Custom Draw

- `packages/core/src/drawing.ts` - draw kind and geometry options.
- `packages/core/src/editor.ts` - custom draw start/finish, preset validation, editor convenience methods.
- `packages/core/src/feature-store.ts` - optional preset metadata on feature records.
- `packages/core/test/editor-drawing.test.ts` - point/line/polygon custom draw and export tests.

### Docs and Examples

- `docs/api-recipes.md` - preset catalog, custom draw, field helper, matching recipes.
- `README.md` - preset capability and example command notes.
- `examples/leaflet/src/main.ts` and `examples/maplibre/src/main.ts` - host-owned picker, geometry select, and field form.
- `tests/e2e/leaflet-example.spec.ts` and `tests/e2e/maplibre-example.spec.ts` - smoke proof for preset UI and export tags.

## Constraints

- Core must not import Leaflet or MapLibre.
- Preset metadata must not be exported inside OsmInEdit `elements`.
- Existing room, corridor, and POI flows must remain backward compatible.
- Existing `updateTags` merge-only behavior should not be broken; sparse preset updates need a separate diff/application path.
- Examples may render host UI, but packages must not ship reusable UI components.
