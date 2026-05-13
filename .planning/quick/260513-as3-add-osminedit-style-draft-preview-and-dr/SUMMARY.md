---
quick_id: 260513-as3
slug: add-osminedit-style-draft-preview-and-dr
status: complete
completed: 2026-05-13
---

# Quick Task Summary: OsmInEdit-Style Draft Preview and Leaflet Vertex Drag

## Completed

- Added core draft preview geometry driven by adapter `pointerMove` events.
- Extended temporary geometry with optional `previewCoordinates`.
- Rendered preview coordinates as dashed draft lines in Leaflet and MapLibre.
- Implemented real Leaflet vertex handle dragging through handle `mousedown` plus map `mousemove`/`mouseup`.
- Added regression tests for core preview geometry, adapter preview rendering, and Leaflet handle dragging.

## Verification

- `pnpm test -- packages/core/test/editor-editing.test.ts packages/core/test/fake-adapter.test.ts packages/leaflet/test/leaflet-drawing.test.ts packages/leaflet/test/leaflet-editing.test.ts packages/maplibre/test/maplibre-adapter.test.ts`
- `pnpm typecheck`
- `pnpm build`
- `pnpm build:examples`
- `pnpm test:e2e`
