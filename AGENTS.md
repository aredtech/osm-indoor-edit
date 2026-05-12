<!-- GSD:project-start source:PROJECT.md -->
## Project

**Osm Indoor Editing Library**

This project is a headless frontend TypeScript library that gives host applications OsmInEdit-like indoor map editing behavior without forcing any application UI. It provides drawing, geometry editing, level-aware indoor features, OSM-like primitives, validation, events, and OsmInEdit-style JSON import/export for developers building their own map editors.

The library is for applications that want OsmInEdit-style editing power and output, but need to own their own buttons, forms, sidebars, save flows, backend integration, user accounts, and publishing decisions.

**Core Value:** Developers can add reliable indoor map editing behavior to a Leaflet or MapLibre frontend and export valid OsmInEdit-style node/way/relation JSON without building geometry editing themselves.

### Constraints

- **Tech stack**: Plain TypeScript library - no framework dependency in the core packages.
- **Renderer compatibility**: Leaflet and MapLibre are the only v1 map renderers.
- **Architecture**: Renderer-specific map behavior must be isolated behind adapters so the core editing engine remains reusable.
- **Data format**: OsmInEdit-style JSON is the primary v1 output and import format.
- **ID strategy**: Exported IDs must be numeric only, stable during a session, and use the large-number local style seen in OsmInEdit.
- **UI boundary**: The SDK owns map editing behavior and map editing visuals, while the host owns application UI and save/publish workflow.
- **Publishing boundary**: No real OpenStreetMap publishing in v1.
- **Validation**: Validation should be structured and pluggable, with moderately strict built-in rules.
- **Floor plans**: Floor plan support should be architecturally possible later, but images and calibration metadata should not be mixed into OsmInEdit `elements`.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommendation
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
| `@aredtech/osm-indoor-edit` | State model, primitives, feature model, IDs, levels, edit operations, validation, import/export, event emitter, renderer-agnostic adapter contracts. |
| `@aredtech/osm-indoor-edit-leaflet` | Leaflet adapter implementing map events, temporary layers, committed feature layers, vertex handles, and style translation. |
| `@aredtech/osm-indoor-edit-maplibre` | MapLibre adapter implementing sources/layers, click/drag handling, committed/temporary geometry rendering, and style translation. |
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
