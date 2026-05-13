---
quick_id: 260513-b3f
slug: add-draft-vertex-dragging-and-fix-maplib
status: complete
completed: 2026-05-13
---

# Quick Task Summary: Draft Vertex Dragging and MapLibre Preview Visibility

## Completed

- Added `draftVertexDrag` to the renderer adapter event contract.
- Updated core drawing state so active draft vertices can be dragged before `finishDraw()`.
- Made Leaflet draft vertex markers emit draft drag events.
- Made MapLibre draft vertex layers emit draft drag events.
- Added rounded MapLibre draft line layout so dashed preview lines render visibly.
- Added regression tests for draft vertex dragging and MapLibre preview layer style.

## Verification

- `pnpm test -- packages/core/test/editor-editing.test.ts packages/core/test/fake-adapter.test.ts packages/leaflet/test/leaflet-drawing.test.ts packages/maplibre/test/maplibre-adapter.test.ts`
- `pnpm typecheck`
- `pnpm build`
- `pnpm build:examples`
- `pnpm test:e2e`
- `pnpm test`
