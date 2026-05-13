---
status: resolved
trigger: "Leaflet draft vertex hit detection is too small; first/last draft vertices are hard or impossible to move. MapLibre draft dragging works except first node move throws an error. Solution should not be taped on."
created: 2026-05-13
resolved: 2026-05-13
---

# Debug Session: Draft Vertex Hit Detection and First Vertex Drag

## Root Cause

Core temporary polygon geometry closed the render ring by repeating the first coordinate at the end. Leaflet and MapLibre treated every render coordinate as a draggable draft vertex, so a three-point polygon exposed four draft vertex handles. The duplicate closing handle overlapped the first handle and could emit an out-of-range draft vertex index.

Leaflet also used the small visible draft marker as the only interactive target, making drag initiation too precise.

## Fix

- Added `vertexCoordinates` to `TemporaryGeometry` so render coordinates and editable draft vertices are separate.
- Updated Leaflet and MapLibre adapters to render draggable draft vertices from `vertexCoordinates`.
- Added fallback adapter logic that removes a duplicate closing coordinate when older callers omit `vertexCoordinates`.
- Added larger invisible Leaflet draft vertex hit targets while preserving the visible marker size.

## Verification

- `pnpm test -- packages/core/test/drawing.test.ts packages/leaflet/test/leaflet-drawing.test.ts packages/maplibre/test/maplibre-adapter.test.ts`
- `pnpm typecheck`
- `pnpm build`
- `pnpm build:examples`
- `pnpm test`
- `pnpm test:e2e`
