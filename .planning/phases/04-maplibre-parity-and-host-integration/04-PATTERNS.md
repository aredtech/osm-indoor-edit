# Phase 04 Pattern Map: MapLibre Parity and Host Integration

**Phase:** 04 - MapLibre Parity and Host Integration
**Created:** 2026-05-12

## Closest Existing Analogs

| New/Changed File | Role | Closest Existing Analog | Pattern To Reuse |
|------------------|------|-------------------------|------------------|
| `packages/maplibre/src/maplibre-adapter.ts` | Renderer adapter implementation | `packages/leaflet/src/leaflet-adapter.ts` | Implement the shared `RendererAdapter` contract, keep renderer state private, expose deterministic test helpers, clear all SDK-owned visuals on detach. |
| `packages/maplibre/src/styles.ts` | Renderer-local style vocabulary | `packages/leaflet/src/styles.ts` | Export default styles plus a merge helper; keep renderer-specific style types out of core. |
| `packages/maplibre/src/index.ts` | Public adapter package surface | `packages/leaflet/src/index.ts` | Export adapter factory, adapter class, style types, defaults, and merge helper. |
| `packages/maplibre/test/fake-maplibre-map.ts` | Test harness | `packages/core/src/fake-adapter.ts`, `packages/leaflet/test/*.test.ts` | Use deterministic in-memory events/sources/layers instead of browser/WebGL. |
| `packages/maplibre/test/maplibre-adapter.test.ts` | Source/layer contract tests | `packages/leaflet/test/leaflet-adapter.test.ts` | Assert attach/detach, style merge, coordinate conversion, pointer events, and source/layer lifecycle. |
| `packages/maplibre/test/maplibre-drawing.test.ts` | Drawing integration tests | `packages/leaflet/test/leaflet-drawing.test.ts`, `packages/core/test/editor-drawing.test.ts` | Drive `createEditor({ adapter, target })` through fake map clicks and assert exports plus source data. |
| `packages/maplibre/test/maplibre-editing.test.ts` | Selection/editing integration tests | `packages/leaflet/test/leaflet-editing.test.ts`, `packages/core/test/editor-editing.test.ts` | Fire layer and drag events, then assert primitive updates and handle source refresh. |
| `packages/maplibre/test/maplibre-snapping.test.ts` | Snap visual/topology tests | `packages/leaflet/test/leaflet-snapping.test.ts`, `packages/core/test/editor-snapping.test.ts` | Assert snap source data and shared-node/edge behavior through core. |
| `packages/core/src/editor.ts` | Host integration config/events | Existing Phase 3 validation and snapping integrations | Extend options without breaking existing `ids`, `validationRules`, or `snapping` behavior. |
| `packages/core/src/events.ts` | Typed host event surface | Existing `EditorEventMap` | Keep payloads renderer-neutral and type-only. |

## Source Truths

- `RendererAdapter` already defines the required adapter shape: attach/detach, map pointer events, feature/vertex/midpoint/drag events, temporary visuals, committed visuals, handles, selected state, level filtering hook, snap visuals, and coordinate conversion.
- `LeafletRendererAdapter` is the behavior oracle for layer grouping, temporary feature lifecycle, committed features, selected feature refresh, handle rendering, snap indicators, level filtering, and test helpers.
- `FeatureRecord.geometryType === "relation"` must remain non-rendered for v1.
- Core `Coordinate` is `{ lat, lon }`; MapLibre/GeoJSON coordinate arrays must be `[lon, lat]`.
- `EditorEventMap` already has most host events, but `ready`, destroy lifecycle, and `error` emission need implementation audit.
- `EditorOptions` already includes injectable `ids`, `snapping`, and `validationRules`; Phase 04 should extend rather than replace them.

## Implementation Landmines

- Do not import `maplibre-gl` from `packages/core`.
- Do not require a real WebGL MapLibre instance for unit tests.
- Do not recreate host UI controls in the adapter.
- Remove MapLibre layers before sources on detach.
- Keep SDK source/layer IDs prefixed and deterministic.
- Restore MapLibre drag-pan after SDK-managed drag completion, cancellation, and detach.
- Regenerate committed/selection/handle/snap FeatureCollections after level switches and edits to avoid stale source state.
- Relation features stay in state/export/validation, but produce no GeoJSON render feature.
