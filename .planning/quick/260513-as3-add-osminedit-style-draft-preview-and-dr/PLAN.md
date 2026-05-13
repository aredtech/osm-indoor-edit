---
quick_id: 260513-as3
slug: add-osminedit-style-draft-preview-and-dr
status: in-progress
created: 2026-05-13
---

# Quick Task Plan: OsmInEdit-Style Draft Preview and Leaflet Vertex Drag

## Goal

Add cursor-following draft preview lines while drawing and make Leaflet vertex handles draggable after placement.

## Steps

1. Add failing tests for draft preview geometry, adapter preview rendering, and Leaflet vertex drag behavior.
2. Extend core temporary geometry with non-committed preview coordinates rendered on `pointerMove`.
3. Render preview coordinates as dashed draft lines in Leaflet and MapLibre.
4. Implement real Leaflet vertex handle dragging via map mouse events.
5. Run focused tests, typecheck/build, then commit and push.
