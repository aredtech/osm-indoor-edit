---
quick_id: 260513-b3f
slug: add-draft-vertex-dragging-and-fix-maplib
status: in-progress
created: 2026-05-13
---

# Quick Task Plan: Draft Vertex Dragging and MapLibre Preview Visibility

## Goal

Let users drag draft vertices while drawing, before `finishDraw()`, and make MapLibre's dashed draft preview line visible.

## Steps

1. Add failing tests for core draft vertex mutation, Leaflet draft vertex drag, MapLibre draft vertex drag, and MapLibre preview layer styling.
2. Extend renderer adapter events with `draftVertexDrag`.
3. Update the core editor to mutate active draft coordinates when draft vertices are dragged.
4. Make Leaflet and MapLibre draft vertex handles emit `draftVertexDrag`.
5. Harden MapLibre preview line layer styling.
6. Run focused tests, full verification, commit, and push.
