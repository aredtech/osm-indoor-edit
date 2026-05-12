# Phase 03 Pattern Map

**Phase:** 03 - topology-relations-and-validation  
**Mapped:** 2026-05-12  

## Purpose

Map Phase 03 planned files to existing code analogs so execution follows established local patterns.

## Existing Patterns To Preserve

### Core Public API

- **Analog:** `packages/core/src/editor.ts`
- **Pattern:** `IndoorEditor` exposes typed methods while `HeadlessIndoorEditor` keeps mutable implementation details private.
- **Use for:** snapping options/methods, relation APIs, validation APIs, shared geometry detach/mutation.
- **Important details:** methods throw typed SDK errors when invalid; adapter calls happen after primitive mutations; events emit after state changes.

### Primitive Storage

- **Analog:** `packages/core/src/primitive-store.ts`
- **Pattern:** store owns numeric primitive records, clones values on return, validates references before accepting/exporting, and preserves closed-way closure.
- **Use for:** relation member mutation, way edge splitting, reference lookup, node detach helpers.
- **Important details:** imported timestamps/tags should be preserved; new primitives get injected clock/ID behavior.

### Feature Rebuild

- **Analog:** `packages/core/src/feature-store.ts`
- **Pattern:** feature records are renderer-neutral local records linked to backing primitive refs.
- **Use for:** affected-feature lookup, relation-backed state records, imported custom features, rebuilding after import.
- **Important details:** feature IDs remain local strings; primitive IDs remain numeric.

### Adapter Contract

- **Analog:** `packages/core/src/adapter.ts`, `packages/core/src/fake-adapter.ts`, `packages/leaflet/src/leaflet-adapter.ts`
- **Pattern:** core defines renderer-neutral methods/events; fake adapter records calls for tests; Leaflet owns concrete layer groups.
- **Use for:** snap indicator methods, snap preview clearing, affected feature refresh proof.
- **Important details:** do not import Leaflet in core.

### Tests

- **Analog:** `packages/core/test/editor-editing.test.ts`, `packages/core/test/primitive-store.test.ts`, `packages/leaflet/test/leaflet-editing.test.ts`
- **Pattern:** small factory helpers, deterministic IDs/clocks, direct fake adapter events, assertion against exported OsmInEdit elements.
- **Use for:** topology, relation, validation, and Leaflet snap visual tests.

## Planned File Map

| Planned file | Closest analog | Guidance |
|--------------|----------------|----------|
| `packages/core/src/snapping.ts` | `packages/core/src/editing.ts`, `packages/core/src/levels.ts` | Keep pure helper functions/types here. No store mutation; return snap decisions/candidates. |
| `packages/core/src/topology.ts` | `packages/core/src/primitive-store.ts`, `packages/core/src/feature-store.ts` | Put shared-node lookup, affected-feature detection, edge splitting helpers, and detach/copy helper logic here if not methods on stores. |
| `packages/core/src/relations.ts` | `packages/core/src/types.ts`, `packages/core/src/primitive-store.ts` | Define relation input/update helper types and narrow member operations. |
| `packages/core/src/validation.ts` | `packages/core/src/events.ts`, `packages/core/src/primitive-store.ts` | Define issue/result/rule types and built-ins. Public shape should not leak Turf types. |
| `packages/core/src/editor.ts` | Existing `editor.ts` | Add public methods and route all state changes through existing primitive + feature store flow. |
| `packages/core/src/primitive-store.ts` | Existing `primitive-store.ts` | Add reference queries, edge insertion, relation member mutation. Preserve clone-on-read pattern. |
| `packages/core/src/feature-store.ts` | Existing `feature-store.ts` | Add query helpers by node/way/relation refs if useful. |
| `packages/core/src/adapter.ts` | Existing adapter contract | Add optional snap visual methods only; keep backwards compatibility for fake/non-visual adapters. |
| `packages/core/src/fake-adapter.ts` | Existing fake adapter | Record snap visual calls and deterministic project/unproject behavior. |
| `packages/leaflet/src/styles.ts` | Existing style tokens | Add snap indicator style defaults, minimal and overrideable. |
| `packages/leaflet/src/leaflet-adapter.ts` | Existing layer groups | Add snap layer group or reuse handles group with clear lifecycle. |

## Test Map

| Capability | Test files |
|------------|------------|
| Snap candidate scoring and edge splitting | `packages/core/test/snapping.test.ts`, `packages/core/test/editor-snapping.test.ts` |
| Shared node movement, detach, delete preservation | `packages/core/test/editor-topology.test.ts`, `packages/core/test/primitive-store.test.ts` |
| Imported shared references and custom rebuild | `packages/core/test/import-export.test.ts`, fixtures under `packages/core/test/fixtures/` |
| Relation APIs and export | `packages/core/test/editor-relations.test.ts`, `packages/core/test/primitive-store.test.ts` |
| Validation issues and pluggable rules | `packages/core/test/validation.test.ts`, `packages/core/test/editor-validation.test.ts` |
| Leaflet snap visuals | `packages/leaflet/test/leaflet-snapping.test.ts` |

## Planning Notes

- Keep Phase 03 as four executable plans matching the roadmap: snapping, shared mutation/import rebuild, relations, validation.
- Dependency order is linear: snapping primitives first, shared mutation/import rebuild second, relations third, validation last.
- Every plan should include a `<threat_model>` block because security enforcement defaults to enabled in GSD when not configured.
- Every plan should keep package dependencies private to implementation; public API should expose SDK types only.
