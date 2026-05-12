# Phase 1: Headless Core Foundation - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the typed, headless SDK foundation only: workspace/package setup, final package names, core public API surface, primitive and feature data model, ID/timestamp strategy, OsmInEdit-style import/export, typed events, immutable snapshots, unsupported-operation errors for later-phase methods, and fake adapter contract tests.

No real Leaflet or MapLibre editing behavior is implemented in this phase. Drawing workflows, vertex dragging, renderer visuals, shared-node snapping behavior, full validation breadth, examples, and documentation are later phases.

</domain>

<decisions>
## Implementation Decisions

### Package Identity

- **D-01:** Use the PRD package names: `@osminedit-lib/core`, `@osminedit-lib/leaflet`, and `@osminedit-lib/maplibre`.
- **D-02:** Lock the PRD layout: `packages/core`, `packages/leaflet`, `packages/maplibre`, `examples/vanilla`, `examples/leaflet`, and `examples/maplibre`.
- **D-03:** Create all package and example folders early in Phase 1, even before adapter/example behavior exists.
- **D-04:** Keep workspace packages private at first; use final package names internally without making them publishable yet.

### Core API Feel

- **D-05:** Define the full public SDK surface from day one, even before every method has behavior.
- **D-06:** Methods belonging to later phases should exist but throw typed unsupported-operation errors until implemented.
- **D-07:** State inspection methods must return immutable snapshots or copies, not live mutable internal references.
- **D-08:** Events must use a strict typed event map so known event names and payloads are enforced by TypeScript.

### OsmInEdit JSON Fidelity

- **D-09:** Export strict sample-compatible OsmInEdit-style JSON: `{ elements: [...], status: true }`.
- **D-10:** Node, way, and relation elements must match the PRD structure: numeric `id`, `type`, `tags`, ISO `timestamp`, node `lat`/`lon`, way `nodes`, optional `featureTypeId`, and relation `members`.
- **D-11:** Export ordering must be deterministic: nodes first, then ways, then relations.
- **D-12:** New timestamps are SDK-generated ISO strings through an injectable clock so tests can be deterministic.
- **D-13:** ID generation must use large numeric ranges by element type, keep node/way/relation ranges separate, remain stable during the editing session, and support injectable seed/counter configuration for tests.

### Feature/Primitive Link Model

- **D-14:** Every editable feature must carry explicit primitive links, including linked `nodeIds`, `wayId`, and optional `relationIds` where applicable.
- **D-15:** Feature IDs are separate stable local IDs for editor/host selection; primitive IDs remain numeric OsmInEdit-style IDs.
- **D-16:** Imported feature kinds are inferred cautiously from tags. Known tags such as `indoor=room` and `indoor=corridor` map to known feature kinds; unknown or unsupported tags fall back to `custom`.
- **D-17:** Phase 1 enforces reference integrity and valid closed-way sequences. Shared-node snapping semantics are deferred to Phase 3.

### Headless Proof

- **D-18:** Phase 1 is proven through automated tests and fixture round-trips, not through demos.
- **D-19:** Mandatory fixtures are: sample room, relation, and imported custom way.
- **D-20:** Phase 1 gate is root build, typecheck, unit tests, and fixture snapshot tests passing.
- **D-21:** Fake adapter contract tests are required to prove the renderer boundary before Leaflet and MapLibre behavior land.

### The Agent's Discretion

The agent may choose the exact test runner and build wiring within the project research recommendations, as long as the phase gate supports build, typecheck, unit tests, fixture snapshots, and fake adapter contract tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — Project boundary, core value, constraints, and v1/out-of-scope decisions.
- `.planning/REQUIREMENTS.md` — Phase 1 requirement IDs and traceability.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and planned phase boundary.
- `.planning/STATE.md` — Current project state and deferred items.

### Product Requirements

- `docs/osm-indoor-prd.md` — Seed PRD defining OsmInEdit-style behavior, data shape, package structure, and v1 exclusions.

### Research

- `.planning/research/SUMMARY.md` — Research synthesis for stack, architecture, table stakes, and pitfalls.
- `.planning/research/STACK.md` — Package/tooling recommendations.
- `.planning/research/ARCHITECTURE.md` — Core/adapter/component boundary recommendations.
- `.planning/research/PITFALLS.md` — Warnings to avoid polygon-only modeling, renderer leakage, and broken round trips.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- None yet. This is a greenfield repository with planning artifacts and the PRD only.

### Established Patterns

- No implementation patterns exist yet.
- Planning decisions establish a package-first TypeScript workspace with a renderer-agnostic core and adapter packages.

### Integration Points

- Future code should connect through `packages/core` first.
- `packages/leaflet`, `packages/maplibre`, and examples directories should exist in Phase 1 as private workspace placeholders but behavior lands in later phases.

</code_context>

<specifics>
## Specific Ideas

- The public names should be the PRD names, not repo-derived alternatives.
- The SDK should feel complete from a type/API standpoint early, while unsupported later-phase behavior fails loudly with typed errors.
- Phase 1 should make import/export and primitive linkage feel real through fixture-backed tests, avoiding a demo that would blur into later UI/example phases.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Headless Core Foundation*
*Context gathered: 2026-05-12*
