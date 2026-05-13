---
quick_id: 260513-br2
slug: fix-leaflet-continuous-draft-vertex-drag
status: in-progress
created: 2026-05-13
---

# Quick Task Plan: Fix Leaflet Continuous Draft Vertex Dragging

## Goal

Keep Leaflet draft vertex dragging active across repeated draft re-renders so holding and dragging a draft vertex continues to move it.

## Root Cause

The first draft drag movement re-renders the temporary draft layer. Leaflet `showTemporaryFeature("draft", ...)` clears the existing draft layer via `clearTemporaryFeature("draft")`, which also clears `activeDraftVertexDrag`. That ends the drag after the first movement.

## Steps

1. Add a failing integration test for multiple drag movements during a single Leaflet draft vertex drag.
2. Change Leaflet temporary layer replacement to preserve active draft drag state while replacing the draft layer.
3. Keep explicit draft clearing/cancel behavior clearing active draft drag state.
4. Run focused and full verification.
