---
status: testing
phase: 04-maplibre-parity-and-host-integration
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
  - 04-03-SUMMARY.md
started: 2026-05-12T15:23:24Z
updated: 2026-05-12T15:23:24Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: MapLibre Package Import And Renderer Isolation
expected: |
  A host developer can import `createMapLibreAdapter`, `MapLibreRendererAdapter`, and MapLibre style helpers from `@osminedit-lib/maplibre`. The core package stays renderer-neutral and does not import MapLibre.
awaiting: user response

## Tests

### 1. MapLibre Package Import And Renderer Isolation
expected: A host developer can import `createMapLibreAdapter`, `MapLibreRendererAdapter`, and MapLibre style helpers from `@osminedit-lib/maplibre`. The core package stays renderer-neutral and does not import MapLibre.
result: [pending]

### 2. SDK-Owned MapLibre Visual Layers
expected: Attaching the MapLibre adapter creates prefixed SDK-owned GeoJSON sources/layers for draft, committed, selection, handles, and snap visuals. Detaching removes those sources, layers, and listeners without requiring host cleanup.
result: [pending]

### 3. MapLibre Drawing Workflow
expected: A host can call `startDraw()`, provide MapLibre map clicks, see temporary draft source data while drawing, finish a room/corridor/POI, and export valid OsmInEdit-style node/way data. Cancelling a draw clears draft visuals without committed data.
result: [pending]

### 4. MapLibre Editing Workflow
expected: A host can select MapLibre-rendered features, show selection and vertex/midpoint handles, insert a midpoint, drag a vertex, drag a whole feature, and preserve primitive IDs when loading/editing imported OsmInEdit JSON.
result: [pending]

### 5. MapLibre Snapping And Level Filtering
expected: With snapping enabled, MapLibre workflows show node and edge snap indicators, reuse or insert shared nodes through the core topology logic, clear snap visuals after finish/disable, and filter committed visuals by `level` and `repeat_on`.
result: [pending]

### 6. Host-Owned UI Events And Configuration
expected: A host can drive its own UI from typed editor events (`ready`, `destroyed`, tool, level, drawing, feature, validation, export, and error events), configure default tags and numeric ID strategy through plain TypeScript options, and override MapLibre editing styles for draft, committed, selection, handles, snap, POI, and door roles.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

<!-- YAML format for plan-phase --gaps consumption -->
