---
quick_id: 260513-br2
slug: fix-leaflet-continuous-draft-vertex-drag
status: complete
completed: 2026-05-13
---

# Quick Task Summary: Fix Leaflet Continuous Draft Vertex Dragging

## Completed

- Reproduced the Leaflet-only continuous draft drag bug with a failing regression test.
- Confirmed root cause: draft re-render during the first movement cleared `activeDraftVertexDrag`, ending the drag gesture.
- Changed Leaflet draft layer replacement to preserve active draft drag state while still clearing draft drag state on explicit cancel/clear.
- Added a test helper for multi-step draft vertex drag gestures.

## Verification

- `pnpm test -- packages/leaflet/test/leaflet-drawing.test.ts`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm build:examples`
- `pnpm test:e2e`
