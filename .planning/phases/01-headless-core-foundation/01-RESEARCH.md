# Phase 1 Research: Headless Core Foundation

**Phase:** 01 - Headless Core Foundation
**Date:** 2026-05-12

## RESEARCH COMPLETE

## Objective

Research what is needed to plan Phase 1 well: typed package foundation, core state model, OsmInEdit-style primitives, public editor API, import/export, deterministic tests, and fake adapter contract tests.

## Inputs Read

- `.planning/phases/01-headless-core-foundation/01-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/STACK.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `docs/osm-indoor-prd.md`
- `AGENTS.md`

## Planning Implications

### Workspace and Tooling

- Use a pnpm workspace because pnpm workspaces require a root `pnpm-workspace.yaml` and support `workspace:` protocol for local package links. This matches the locked PRD layout and final package names.
- Use TypeScript project references for package boundaries because referenced projects can expose declaration output and `tsc --build` can build dependencies in order.
- Use Vitest for unit and snapshot tests because it supports TypeScript, snapshots, projects, and Vite-compatible transforms.
- Use Vite library mode for initial package builds because the project will later need browser-oriented examples, but keep configuration minimal in Phase 1.

### Package Shape

Phase 1 should create:

- Root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`, `vitest.config.ts`, and root test/build/typecheck scripts.
- Private workspace package manifests for:
  - `packages/core`
  - `packages/leaflet`
  - `packages/maplibre`
- Placeholder example package manifests/directories for:
  - `examples/vanilla`
  - `examples/leaflet`
  - `examples/maplibre`

Adapter/example packages can be private placeholders in Phase 1. They should not implement renderer behavior yet.

### Core Types and Boundaries

The core package should own:

- Primitive element types: `OsmNode`, `OsmWay`, `OsmRelation`, `OsmElement`.
- Export envelope: `OsmInEditExport` shaped as `{ elements: OsmElement[]; status: true }`.
- Feature types and local feature records with explicit primitive links.
- Editor options, typed event map, editor state snapshot, adapter contract, clock, and ID allocator options.
- Typed unsupported-operation error for public API methods whose behavior belongs to later phases.

Keep Leaflet/MapLibre types out of `@osminedit-lib/core`. Any adapter-facing type should use core-owned map-neutral shapes such as `{ lat: number; lon: number }`.

### Primitive Store and ID Strategy

Phase 1 should implement a primitive store that:

- Stores nodes, ways, and relations by numeric ID.
- Preserves imported IDs, tags, and timestamps.
- Generates large positive numeric IDs by element type for new primitives.
- Uses injectable seed/counter configuration for deterministic tests.
- Uses an injectable clock for deterministic ISO timestamps.
- Exports nodes first, then ways, then relations.
- Enforces reference integrity and closed-way node repetition.

Shared-wall semantics and snapping are out of scope for Phase 1; only reference validity and closure rules are in scope.

### Feature Store and Import Inference

Phase 1 should create feature records from imported primitives where possible:

- Area/line features can link to a `wayId` and ordered `nodeIds`.
- POI/point features can link to one `nodeId`.
- Relation-backed features can retain optional `relationIds`.
- Feature IDs should be local stable strings, separate from numeric primitive IDs.
- Known tags such as `indoor=room` and `indoor=corridor` infer known feature kinds.
- Unknown ways fall back to `custom`.

### Public API

Phase 1 should expose the full public SDK surface:

- `createEditor(options)`
- `destroy()`
- `setLevel(level)`
- `getLevel()`
- `startDraw(type)`
- `cancelDraw()`
- `finishDraw()`
- `selectFeature(id)`
- `deleteFeature(id)`
- `updateTags(elementOrFeatureId, tags)`
- `getState()`
- `getElements()`
- `loadOsmInEdit(data)`
- `exportOsmInEdit()`
- `validate()`
- `on(eventName, handler)`
- `off(eventName, handler)`

Methods not behaviorally implemented in Phase 1 should throw a typed `UnsupportedOperationError`, not no-op.

### Fake Adapter Contract

Define a renderer-neutral adapter contract in core and a fake adapter for tests. The fake adapter should prove that core can attach/detach from a renderer boundary without importing Leaflet or MapLibre. It should not pretend to draw real geometry; it only records calls/events for contract tests.

## Required Fixtures

Phase 1 test fixtures should include:

- `sample-room.json` — node/closed-way room export matching PRD style.
- `sample-relation.json` — relation primitive shape and member reference integrity.
- `imported-custom-way.json` — ambiguous imported way that becomes a `custom` feature.

Snapshot tests should verify export envelope shape, deterministic element order, deterministic IDs/timestamps, closed-way closure, relation preservation, and custom fallback.

## Risk Notes

- Do not model features as polygons first and generate primitives only at export time; this would weaken Phase 3 topology.
- Do not add real Leaflet/MapLibre dependencies to core.
- Do not create browser demos or renderer examples in Phase 1 beyond directory/package placeholders.
- Do not use negative OSM local IDs; Phase 1 decisions require large positive numeric IDs.
- Do not expose mutable state references to host apps.

## Sources

- pnpm workspaces: https://pnpm.io/workspaces
- TypeScript project references: https://www.typescriptlang.org/docs/handbook/project-references.html
- Vite library mode: https://vite.dev/guide/build
- Vitest guide: https://vitest.dev/guide/
