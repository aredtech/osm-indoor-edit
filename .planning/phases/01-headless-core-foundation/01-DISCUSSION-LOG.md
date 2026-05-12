# Phase 1: Headless Core Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 1-Headless Core Foundation
**Areas discussed:** Package identity, Core API feel, OsmInEdit JSON fidelity, Feature/primitives link model, Headless proof

---

## Package Identity

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Package naming | Use scoped package names from the PRD | `@osminedit-lib/core`, `@osminedit-lib/leaflet`, `@osminedit-lib/maplibre` | yes |
| Package naming | Use project-local names first | `@osm-indoor/*` package names | no |
| Package naming | Keep names provisional | Decide public npm names later | no |
| Monorepo layout | Lock the PRD layout | `packages/*` plus `examples/vanilla`, `examples/leaflet`, `examples/maplibre` | yes |
| Monorepo layout | Slightly tighter layout | Skip generic vanilla example initially | no |
| Monorepo layout | Let implementation decide | Planner chooses exact folders | no |
| Early folders | Create all package folders early | Establish workspace boundaries in Phase 1 | yes |
| Early folders | Create only `core` in Phase 1 | Keep initial scope lean | no |
| Early folders | Create packages only when behavior lands | Avoid placeholders | no |
| Publishability | Private workspace packages at first | Use final names internally, do not publish yet | yes |
| Publishability | Publishable metadata from day one | Prepare npm release metadata immediately | no |
| Publishability | Core publishable, adapters private | Mixed readiness | no |

**User's choice:** PRD names, PRD layout, all package/example folders early, private packages initially.
**Notes:** This locks package identity strongly while avoiding premature publishing commitments.

---

## Core API Feel

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| API breadth | Small command-first API | Minimal methods only | no |
| API breadth | Full API surface from day one | Define conceptual PRD methods early | yes |
| API breadth | Core-only API first | Add drawing/editing APIs later | no |
| Unsupported behavior | Throw typed unsupported-operation errors | Later-phase methods fail loudly | yes |
| Unsupported behavior | No-ops where harmless | Avoid errors but risk hiding gaps | no |
| Unsupported behavior | Capability checks only | More formal but heavier | no |
| State access | Immutable snapshots only | Return copies/snapshots | yes |
| State access | Live readonly-ish references | Easier but mutation-prone | no |
| State access | Only export methods | No state snapshot yet | no |
| Events | Strict typed event map | TypeScript enforces names and payloads | yes |
| Events | Loose string events | Easier to evolve, weaker ergonomics | no |
| Events | Hybrid | Known typed events plus custom strings | no |

**User's choice:** Full public SDK surface early, typed unsupported-operation errors, immutable snapshots, strict typed events.
**Notes:** Phase 1 should establish the API contract even where implementation comes later.

---

## OsmInEdit JSON Fidelity

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Export shape | Strict sample-compatible shape | `{ elements: [...], status: true }` with PRD element fields | yes |
| Export shape | Sample-compatible plus SDK metadata | Adds debug/internal fields | no |
| Export shape | Internal shape first, mapper later | Defer exact OsmInEdit mapping | no |
| Element ordering | Nodes, ways, relations | Deterministic and reference-friendly | yes |
| Element ordering | Creation order | Mirrors edit history | no |
| Element ordering | Preserve imported order | Nice but harder after edits | no |
| Timestamps | SDK-generated ISO with injectable clock | Realistic and deterministic | yes |
| Timestamps | Preserve imported, omit new | Simpler but weaker compatibility | no |
| Timestamps | Current time directly | Easy but noisy tests | no |
| ID generation | Large numeric ranges by element type | PRD-style, stable, testable | yes |
| ID generation | Single global counter | Simpler but less expressive | no |
| ID generation | Negative OSM-style local IDs | Common elsewhere but not PRD style | no |

**User's choice:** Strict sample-compatible output, deterministic nodes/ways/relations ordering, injectable timestamps, separate large numeric ranges by element type.
**Notes:** Phase 1 import/export should be fixture-testable and close to the PRD sample.

---

## Feature/Primitives Link Model

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Link explicitness | Explicit link records on every feature | Store `nodeIds`, `wayId`, optional `relationIds` | yes |
| Link explicitness | Derive links when needed | Less metadata, more inference | no |
| Link explicitness | Primitive-first only | No feature records yet | no |
| Feature IDs | Separate local feature IDs | UI/editor IDs separate from numeric primitives | yes |
| Feature IDs | Use way/relation ID as feature ID | Simpler for areas only | no |
| Feature IDs | Use primitive IDs everywhere | Pure but messy for multi-primitive features | no |
| Ambiguous imports | Infer cautiously, fallback to `custom` | Known tags map to kinds; unknown stays custom | yes |
| Ambiguous imports | Require host mapping | More control, heavier import | no |
| Ambiguous imports | Import primitives only | Safer but weak edit-after-import | no |
| Topology enforcement | Reference integrity and way closure only | Protect core invariants now, defer snapping | yes |
| Topology enforcement | Start shared-node semantics now | Pulls Phase 3 forward | no |
| Topology enforcement | No topology enforcement yet | Fast but sloppy | no |

**User's choice:** Explicit feature links, separate feature IDs, cautious kind inference with `custom` fallback, Phase 1 topology limited to reference integrity and closed-way validity.
**Notes:** This prevents polygon-only modeling while keeping shared-node semantics in Phase 3.

---

## Headless Proof

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Working proof | Automated tests plus fixture round-trips | Prove foundation without demos | yes |
| Working proof | Tests plus Node/console demo | More tangible but extra scope | no |
| Working proof | Minimal browser demo | Visual but pulls examples forward | no |
| Fixtures | Sample room + relation + imported custom way | Covers closure, relations, inference, fallback | yes |
| Fixtures | Only PRD sample room | Lean but weak coverage | no |
| Fixtures | Broad fixture set now | More confidence, larger scope | no |
| Test gate | Build, typecheck, unit tests, fixture snapshots | Balanced Phase 1 gate | yes |
| Test gate | Unit tests only | Faster but weaker | no |
| Test gate | Browser tests now | Too early before adapters | no |
| Fake adapter | Required fake adapter contract tests | Proves renderer boundary | yes |
| Fake adapter | Define but do not test | Lighter but weaker | no |
| Fake adapter | Skip until Leaflet | Risks core/renderer coupling | no |

**User's choice:** Tests and fixture round-trips only; mandatory sample room, relation, and custom-way fixtures; build/typecheck/unit/snapshot gate; fake adapter contract tests required.
**Notes:** Phase 1 remains headless and test-driven.

---

## The Agent's Discretion

- Exact build/test wiring can follow project research recommendations as long as the Phase 1 gate is satisfied.

## Deferred Ideas

None.
