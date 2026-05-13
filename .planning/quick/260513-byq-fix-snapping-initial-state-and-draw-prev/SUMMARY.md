---
quick_id: 260513-byq
slug: fix-snapping-initial-state-and-draw-prev
status: complete
completed: 2026-05-13
---

# Quick Task Summary: Fix Snapping Initial State and Draw Preview

## Completed

- Reproduced the nearest-node snapping issue with a regression where a near-corner click selected the edge candidate and inserted a new node.
- Changed snap resolution to prefer existing node candidates within tolerance before considering edge insertion candidates.
- Added non-mutating snap resolution for draw preview so pointer move shows the snap candidate and renders the draft preview to the snapped coordinate.
- Initialized Leaflet and MapLibre examples from the checked Snapping host control so the visible UI state matches editor behavior at startup.

## Verification

- `pnpm test -- packages/core/test/editor-snapping.test.ts`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm build:examples`
- `pnpm test:e2e:leaflet`
- `pnpm test:e2e:maplibre`
