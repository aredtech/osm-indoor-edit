# Phase 3: Topology, Relations, and Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 3-Topology, Relations, and Validation
**Areas discussed:** Snapping Semantics, Shared Geometry Mutation, Relation Editing Scope, Validation Strictness, Import Round Trip Behavior

---

## Snapping Semantics

| Question | Options | Selected |
|----------|---------|----------|
| Default snapping behavior | Explicit Mode; Always Nearby; Host Decides | Explicit Mode |
| Edge snap behavior | Split Edge And Share Node; Snap Coordinate Only; Ask Host Callback | Split Edge And Share Node |
| Node vs edge candidate priority | Nearest Candidate; Prefer Existing Nodes; Prefer Edges While Drawing Walls | Nearest Candidate |
| Tolerance configuration | Pixel Tolerance; Meter Tolerance; Both | Pixel Tolerance |

**Notes:** Snapping should be host-enabled and intentional. Edge snapping should mutate existing topology by inserting and sharing a node.

---

## Shared Geometry Mutation

| Question | Options | Selected |
|----------|---------|----------|
| Shared node movement | Move All Connected Features; Move Only Selected Feature; Configurable Per Operation | Move All Connected Features |
| Detach API | Yes, Explicit Detach; No Detach In v1; Automatic Detach Prompt Event | Yes, Explicit Detach |
| Feature deletion with shared nodes | Keep Shared Nodes; Delete Whole Geometry; Host Policy Callback | Keep Shared Nodes |
| Connected feature visual refresh | Refresh All Affected Features; Refresh Selected Only; Core Only, Adapter Later | Refresh All Affected Features |

**Notes:** Shared topology is real by default, but hosts need an explicit detach/copy operation when users intend to break shared walls.

---

## Relation Editing Scope

| Question | Options | Selected |
|----------|---------|----------|
| Minimum useful relation API | Store, Import, Export, Validate; Also Edit Members; Grouped Feature Behavior | Store, Import, Export, Validate |
| Relation create/tag APIs | Yes, Tags Only; No New Relation APIs; Full Relation CRUD | Yes, Tags Only |
| Relation member editing | Append/Remove Members; Read Only Members; Full Ordered Editing | Append/Remove Members |
| Relation-backed feature representation | Feature Records Without Map Geometry; Selectable Group Features; Hidden Primitives Only | Feature Records Without Map Geometry |

**Notes:** Relations are first-class data and minimally editable, but v1 does not require grouped map rendering or full ordered member editing.

---

## Validation Strictness

| Question | Options | Selected |
|----------|---------|----------|
| Built-in validation default | Advisory Structured Issues; Blocking Errors; Host Configured Mode | Advisory Structured Issues |
| Severity model | Error / Warning / Info; Critical / Error / Warning / Info; Boolean Valid/Invalid Only | Error / Warning / Info |
| Built-in rule coverage | Roadmap Set; Geometry First; Everything Practical | Roadmap Set |
| Pluggable validation model | Rule Functions; Config Toggles Only; Class-Based Plugin API | Rule Functions |

**Notes:** Validation returns structured advisory issues. Host applications decide how to block or present issues.

---

## Import Round Trip Behavior

| Question | Options | Selected |
|----------|---------|----------|
| Unsupported-but-valid imported data | Preserve Everything; Normalize To Known Features; Reject Unsupported Data | Preserve Everything |
| Structurally invalid imports | Reject Structurally Invalid Data; Load With Errors; Auto-Repair | Reject Structurally Invalid Data |
| Unknown imported feature representation | Custom Feature Records; Raw Elements Only; Best Guess Feature Kind | Custom Feature Records |
| Shared references after imported edits | Preserve Shared References; Duplicate On Edit; Host Chooses Per Edit | Preserve Shared References |

**Notes:** Valid imports should be preserved faithfully. Structurally invalid imports fail fast; loaded data remains round-trip safe.

---

## The Agent's Discretion

- Exact API names and internal module boundaries.
- Spatial index implementation.
- Validation issue field naming.
- Test file layout and fixture structure.

## Deferred Ideas

- Full relation ordering, role editing, and grouped relation map rendering.
- MapLibre snapping/editing parity.
- Full renderer-wide style customization for snap indicators.
- Polished validation UI and documentation examples.
