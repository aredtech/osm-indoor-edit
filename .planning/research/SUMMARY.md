# Research Summary: Osm Indoor Editing Library

**Date:** 2026-05-12

## Key Findings

**Stack:** Use a pnpm workspace with TypeScript packages for core, Leaflet adapter, MapLibre adapter, and examples. Keep renderer libraries as adapter peer dependencies. Use Vitest for unit and adapter-contract tests. Use Vite library mode or tsup for packaging, with Vite especially useful for browser examples and library demos.

**Table Stakes:** The product must deliver a headless editor API, SDK-owned map editing layers, OSM-like primitives, OsmInEdit-style import/export, level-aware feature creation, visual vertex editing, shared nodes/walls, basic relation support, structured validation, events, styling overrides, and Leaflet/MapLibre examples.

**Architecture:** Keep the core renderer-agnostic. The core owns state, primitives, feature links, IDs, geometry operations, validation, events, and import/export. Renderer adapters own map event wiring and visual layer manipulation only.

**Watch Out For:** The biggest risks are polygon-only modeling, renderer leakage into core, forced UI creep, delayed snapping, broken import/export round trips, MapLibre drag complexity, unstructured validation, coordinate-order mistakes, and over-scoped relation editing.

## Prescriptive Decisions

1. Build primitives and feature links in Phase 1, not after export.
2. Introduce a fake/test adapter early so core behavior is testable without Leaflet or MapLibre.
3. Implement Leaflet before MapLibre to prove the adapter contract with simpler interactive vector layers.
4. Treat import/export round-trip fixtures as a core quality gate.
5. Keep examples as host apps, not reusable UI packages.

## Research Sources

- Leaflet API reference: https://leafletjs.com/reference.html
- Leaflet npm package: https://www.npmjs.com/package/leaflet
- MapLibre GL JS docs: https://maplibre.org/maplibre-gl-js/docs
- MapLibre GL JS project page: https://maplibre.org/projects/gl-js/
- pnpm workspaces: https://pnpm.io/workspaces
- Vite library mode: https://vite.dev/guide/build
- Vitest guide: https://vitest.dev/guide/
- Turf docs: https://turfjs.org/docs/api/booleanIntersects
- RBush npm package: https://www.npmjs.com/package/rbush
