# Phase 3: Topology, Relations, and Validation - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 hardens the SDK's OSM-like editing model so indoor editing behaves as connected topology, not isolated polygons. It delivers explicit snapping, shared-node/shared-wall semantics, imported editable data rebuilding, relation primitive support, structured validation, and import/edit/export round trips that preserve OsmInEdit-style references.

The SDK owns topology behavior, primitive/reference updates, validation results, and adapter-visible refresh events. Host applications own UI controls, confirmation flows, save/publish decisions, and how validation issues are presented. MapLibre parity, full style customization, polished examples, real OSM publishing, and grouped relation map rendering remain outside this phase.

</domain>

<decisions>
## Implementation Decisions

### Snapping Semantics

- **D-01:** Snapping is explicit by default. The host enables snapping as SDK option/tool state; the SDK should not silently snap every nearby pointer movement.
- **D-02:** Edge snapping creates real topology. When drawing near an existing edge, the SDK inserts a node into that existing way and reuses the inserted node in the new feature.
- **D-03:** Snap candidate selection uses nearest candidate within tolerance. Existing nodes and edge projections compete on distance rather than fixed priority.
- **D-04:** Snap tolerance is configured in screen pixels for v1 so snapping feels consistent across zoom levels.

### Shared Geometry Mutation

- **D-05:** Shared nodes are real shared topology. Moving a shared node updates every way/feature that references that node.
- **D-06:** Hosts get an explicit detach/copy API for intentionally breaking shared geometry before editing.
- **D-07:** Deleting a feature preserves shared nodes. The SDK deletes the selected feature's way/relation and removes only nodes that become unreferenced.
- **D-08:** Shared geometry changes refresh all affected connected features immediately and emit update events for those affected features.

### Relation Editing Scope

- **D-09:** Relations are first-class v1 data for storage, import, export, and validation.
- **D-10:** v1 includes relation creation and relation tag update APIs.
- **D-11:** Relation member editing is minimal: append and remove members are in scope; full ordered member editing and grouped map behavior are not required in this phase.
- **D-12:** Relation-backed features appear in editor state for inspection/export/validation, but do not render as grouped map shapes in v1.

### Validation Strictness

- **D-13:** Built-in validation is advisory by default. It returns structured issues with severity and does not block editing or export automatically.
- **D-14:** Validation severities are `error`, `warning`, and `info`.
- **D-15:** Phase 3 built-in rules cover the roadmap set: missing indoor/level tags, invalid geometry, broken references, duplicate nodes, and broken relation members.
- **D-16:** Pluggable validation uses rule functions. Hosts can register functions that receive editor primitives/features and return structured issues.

### Import Round Trip Behavior

- **D-17:** Import preserves all valid unknown tags and elements. Editable features are rebuilt where possible, and unchanged data exports unchanged.
- **D-18:** Structurally invalid imports are rejected with typed data integrity errors. Validation handles loaded data that is structurally coherent but semantically or geometrically questionable.
- **D-19:** Unknown imported ways and standalone points become editable `custom` feature records while preserving all tags.
- **D-20:** After import, edits preserve shared references. If one imported feature shares nodes with another, exported node IDs remain shared and all affected geometry updates consistently.

### The Agent's Discretion

The agent may choose exact API names, internal module boundaries, spatial index implementation, validation issue field names, and test file layout during planning, as long as the decisions above and the Phase 3 roadmap requirements remain intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — Project boundary, core value, constraints, validated Phase 2 behavior, and v1 exclusions.
- `.planning/REQUIREMENTS.md` — Phase 3 requirement IDs and traceability.
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, planned phase boundary, and dependencies.
- `.planning/STATE.md` — Current project state and deferred items.
- `.planning/phases/01-headless-core-foundation/01-CONTEXT.md` — Locked primitive, feature, ID, import/export, and fake-adapter decisions.
- `.planning/phases/02-leaflet-editing-mvp/02-CONTEXT.md` — Locked Leaflet drawing/editing, level/tag, and host-owned UI decisions that Phase 3 extends.

### Product Requirements

- `docs/osm-indoor-prd.md` — Seed PRD defining OsmInEdit-style output, indoor editing behavior, topology expectations, and v1 boundaries.

### Code Integration Points

- `packages/core/src/adapter.ts` — Renderer adapter contract that will need snap-related visual/event extension without leaking Leaflet into core.
- `packages/core/src/editor.ts` — Public editor facade where snapping, relation APIs, validation, shared mutation, and import rebuild behavior connect.
- `packages/core/src/feature-store.ts` — Feature records, primitive refs, imported feature inference, and relation-backed feature records.
- `packages/core/src/primitive-store.ts` — Node/way/relation storage, mutation, reference validation, closed-way handling, and export ordering.
- `packages/core/src/import-export.ts` — Import normalization and OsmInEdit export shape guards.
- `packages/core/src/types.ts` — OSM-like node, way, relation, tags, member, and export types.
- `packages/leaflet/src/leaflet-adapter.ts` — Leaflet committed feature, handle, selection, and future snap visual integration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `PrimitiveStore` already stores nodes, ways, and relations, can update node coordinates and way node sequences, rejects broken references, and exports deterministic nodes-before-ways-before-relations JSON.
- `FeatureStore` already rebuilds feature records from imported nodes, ways, and relations, including relation-backed feature records with `geometryType: "relation"`.
- `IndoorEditor` already routes vertex movement, midpoint insertion, feature movement, deletion, tag updates, import, and export through the primitive store.
- `RendererAdapter` already exposes pointer, feature, vertex, midpoint, committed feature, selection, and coordinate conversion hooks that can be extended for snap indicators.
- `FakeRendererAdapter` and Leaflet tests provide contract-test patterns for renderer-neutral behavior.

### Established Patterns

- Core remains renderer-neutral; Leaflet-specific behavior stays in `packages/leaflet`.
- Host-owned UI remains the rule: SDK exposes behavior APIs/events, while host apps decide controls and workflows.
- Invalid structural data currently fails through `DataIntegrityError`, which aligns with rejecting structurally invalid imports.
- Feature IDs stay separate from numeric primitive IDs.
- State and element inspection return immutable snapshots/copies.

### Integration Points

- Add topology/spatial-index helpers in core without making Leaflet a core dependency.
- Extend editor draw/edit flows so snapping can reuse existing nodes or split existing edges.
- Update all affected feature records and adapter layers when shared nodes move.
- Add relation APIs around existing primitive relation storage, with minimal append/remove member support.
- Replace the current `validate()` unsupported operation with structured issue generation and rule registration.
- Extend Leaflet adapter only as needed for Phase 3 snap visuals and refreshed connected features; MapLibre parity remains Phase 4.

</code_context>

<specifics>
## Specific Ideas

- Snapping should be intentional: explicit host-enabled mode, nearest candidate wins, and pixel tolerance drives feel.
- Edge snapping should create real shared topology by splitting the existing edge and reusing the inserted node.
- Shared topology should behave honestly: moving a shared node moves all connected geometry unless the host explicitly detaches first.
- Relations should be useful as OSM-like data without forcing a grouped-map editing UX in v1.
- Validation should help host apps decide what to block, but the SDK should not automatically block export.

</specifics>

<deferred>
## Deferred Ideas

- Full relation ordering, role editing, and grouped relation map rendering are deferred beyond Phase 3 unless planning finds a tiny safe subset.
- MapLibre snapping/editing parity is deferred to Phase 4.
- Full renderer-wide style customization for snap indicators is deferred to Phase 4.
- Polished validation UI and documentation examples are deferred to Phase 5.

</deferred>

---

*Phase: 3-Topology, Relations, and Validation*
*Context gathered: 2026-05-12*
