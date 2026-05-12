---
quick_id: 260512-wpp
slug: fix-leaflet-example-map-visibility-with-
status: in-progress
created: 2026-05-12
---

# Quick Task Plan: Fix Leaflet Example Map Visibility

## Goal

Make the Leaflet example visibly render a map by default and keep the loaded sample in view.

## Steps

1. Add a base tile layer to the Leaflet example.
2. Center the initial Leaflet view on the bundled sample data.
3. Recenter on the sample after the host clicks "Load sample".
4. Add a focused e2e assertion that the Leaflet tile layer is present.
5. Run targeted verification and commit the fix.
