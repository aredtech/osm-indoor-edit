# Stack Research: Osm Indoor Editing Library

**Date:** 2026-05-12
**Context:** Greenfield frontend TypeScript SDK for OsmInEdit-style indoor editing.

## Recommendation

Use a pnpm workspace monorepo with separate packages for the core engine, Leaflet adapter, MapLibre adapter, and examples.

```text
packages/
  core/
  leaflet/
  maplibre/
examples/
  vanilla-leaflet/
  vanilla-maplibre/
```

## Core Tooling

| Area | Recommendation | Rationale | Confidence |
|------|----------------|-----------|------------|
| Language | TypeScript | Public SDK types are part of the product. The PRD explicitly requires TypeScript. | High |
| Package manager | pnpm workspaces | Native workspace support and `workspace:` protocol fit multi-package SDK development. | High |
| Build | Vite library mode or tsup | Vite gives excellent browser-library/demo workflow; tsup is simple for package bundling. Prefer Vite for examples and package builds unless tsup proves simpler during implementation. | Medium |
| Tests | Vitest | Fast TypeScript test runner; supports TS out of the box and can use jsdom/happy-dom for DOM-facing adapter tests. | High |
| Type checking | `tsc --noEmit` plus declaration generation | Keep test runtime fast while preserving strict public API correctness. | High |
| Lint/format | ESLint + Prettier | Standard library hygiene; add only after initial package skeleton to avoid setup drag. | Medium |

## Runtime Dependencies

| Package | Role | Notes | Confidence |
|---------|------|-------|------------|
| `leaflet` | Leaflet renderer adapter peer dependency | Stable latest is 1.9.4; Leaflet 2 is alpha and should not be the v1 baseline. | High |
| `maplibre-gl` | MapLibre renderer adapter peer dependency | TypeScript/WebGL renderer for interactive maps. Keep as peer dependency in adapter package. | High |
| `@turf/*` modules | Geometry validation and calculations | Prefer modular imports over all of `@turf/turf` to avoid large bundles. Use for intersections/overlap where practical, but keep domain rules in core. | Medium |
| `rbush` | Spatial index for snapping candidates | Useful for nearby-node and edge queries; ESM-only in v4, which is acceptable for a modern browser SDK. | Medium |

## Package Boundaries

| Package | Responsibility |
|---------|----------------|
| `@osminedit-lib/core` | State model, primitives, feature model, IDs, levels, edit operations, validation, import/export, event emitter, renderer-agnostic adapter contracts. |
| `@osminedit-lib/leaflet` | Leaflet adapter implementing map events, temporary layers, committed feature layers, vertex handles, and style translation. |
| `@osminedit-lib/maplibre` | MapLibre adapter implementing sources/layers, click/drag handling, committed/temporary geometry rendering, and style translation. |
| Examples | Thin host apps proving no fixed UI is required. |

## What Not To Use Initially

- Framework wrappers: defer React/Angular/Vue until the headless API stabilizes.
- A backend or database: explicitly outside v1.
- Real OSM publishing libraries: OAuth/changesets/conflicts are outside v1.
- Leaflet 2 alpha as baseline: support later only if API stabilizes.
- A single renderer-coupled core: would make MapLibre/Leaflet behavior leak into engine design.

## Sources

- Leaflet API reference: https://leafletjs.com/reference.html
- MapLibre GL JS docs: https://maplibre.org/maplibre-gl-js/docs
- pnpm workspaces: https://pnpm.io/workspaces
- Vite library mode: https://vite.dev/guide/build
- Vitest guide: https://vitest.dev/guide/
- Turf docs: https://turfjs.org/docs/api/booleanIntersects
- RBush npm package: https://www.npmjs.com/package/rbush
