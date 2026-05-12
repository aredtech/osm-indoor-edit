# Phase 03 Research: Topology, Relations, and Validation

**Phase:** 03 - topology-relations-and-validation  
**Researched:** 2026-05-12  
**Status:** Ready for planning

## Research Goal

Answer what needs to be known to plan Phase 03 well: explicit snapping, shared-node/shared-wall semantics, relation APIs, validation, and import/edit/export round trips for an OSM-like indoor editing SDK.

## Phase Fit

Phase 03 should extend the existing Phase 02 editing path, not replace it. The strongest implementation direction is:

1. Add core topology utilities and a spatial index for snap candidates.
2. Teach editor drawing/editing operations to reuse/split shared nodes and refresh all affected features.
3. Expand relation primitives with minimal host-facing APIs.
4. Replace unsupported `validate()` with advisory structured validation and pluggable rule functions.
5. Keep imports structurally strict but preserve all valid unknown data.

## Current Code Observations

### Core Editor

- `packages/core/src/editor.ts` already centralizes draw, edit, move, delete, import, export, and adapter refresh behavior.
- Vertex movement currently updates one feature record after moving a node. Phase 03 must update all feature records whose `primitiveRefs.nodeIds` include the changed node.
- Feature deletion already tries to remove nodes only when unreferenced, but it depends on `PrimitiveStore.deleteElement` throwing for referenced nodes. That matches the Phase 03 preservation decision.
- `loadOsmInEdit()` rebuilds feature records after importing and validating references, which matches the strict structural import decision.
- `validate()` currently throws `UnsupportedOperationError`; Phase 03 should replace this with structured validation results.

### Primitive Store

- `PrimitiveStore` already stores nodes, ways, and relations and has reference validation for ways and relation members.
- `updateWayNodes` can already insert nodes into closed area ways while preserving first-node repetition.
- Missing capabilities for Phase 03:
  - Query references by node/way/relation.
  - Insert a node into an existing way edge for edge snapping.
  - Detach/copy feature nodes for intentionally breaking shared geometry.
  - Relation append/remove member APIs.

### Feature Store

- `FeatureStore.rebuildFromElements` already creates `custom` features for unknown ways and relation-backed features with `geometryType: "relation"`.
- Missing capability: efficient lookup of affected features by node/way/relation IDs.

### Adapter Boundary

- `RendererAdapter` already has projection/unprojection, pointer events, temporary/committed feature rendering, selection, and handles.
- Pixel-based snapping should use `adapter.project(coordinate)` for candidate scoring; this keeps core renderer-neutral while honoring the v1 screen-pixel tolerance decision.
- Adapter additions should be minimal:
  - `showSnapCandidate` / `clearSnapCandidate` or equivalent for Leaflet snap visual feedback.
  - Optional snap events are probably unnecessary if the editor owns snap resolution from pointer coordinates.

## External Reference Findings

### Spatial Index

RBush is a good fit for snap candidate broad-phase search because it indexes points/rectangles and returns items intersecting a query bounding box. The current npm readme documents TypeScript declarations, ESM-only v4+, bulk load, search, and collision queries. Use it only as an internal optimization; exact nearest-candidate scoring should stay in SDK code so node-vs-edge behavior remains deterministic.

Planning implication: add `rbush` as a core dependency only if the implementation needs indexed lookup beyond simple scans. For the small v1 data sizes, a simple in-memory index wrapper that can later switch implementation is preferable to exposing RBush types publicly.

### Geometry Validation

Turf has modular packages that match the validation need:

- `@turf/boolean-valid` checks whether GeoJSON geometry is valid according to OGC Simple Features.
- `@turf/kinks` returns self-intersection points for lines/polygons.
- `@turf/line-intersect` can detect intersections between line or polygon geometries.

Planning implication: validation should use modular Turf imports only in core validation internals if needed. Do not expose Turf types in public API; convert internal primitives to small GeoJSON objects at the validation boundary.

### Leaflet Projection

Leaflet's public map API includes `latLngToContainerPoint` and `containerPointToLatLng`, which already power the current adapter's `project` and `unproject` methods. This supports the Phase 03 decision to use screen-pixel snap tolerance without putting Leaflet into core.

Planning implication: keep pixel math renderer-neutral through `RendererAdapter.project`. Leaflet can render snap indicators in its editing pane/layer group, while core chooses candidates.

### Indoor/OSM Semantics

OpenStreetMap Simple Indoor Tagging expects indoor areas such as rooms and corridors to be mapped as closed ways or multipolygons, and it explicitly says shared real-world walls should share nodes. It also treats `level=*` as mandatory for indoor elements and documents `repeat_on=*` for repeated features.

Planning implication: Phase 03 validation rules should flag missing `level` and `indoor` on indoor area features, preserve `repeat_on`, and validate shared references rather than duplicating wall nodes.

OpenStreetMap relations are ordered member collections of nodes, ways, and relations, with optional member roles. Multipolygon relations use `outer` and `inner` roles for complex areas, but Phase 03 context explicitly keeps full ordered member/role UX out of scope.

Planning implication: minimal append/remove member APIs are enough for this phase, with role preserved as a string where supplied.

## Recommended Implementation Shape

### New Core Modules

- `packages/core/src/topology.ts`
  - Shared-node helpers, affected-feature lookup, detach/copy operations, edge insertion helpers.
- `packages/core/src/snapping.ts`
  - Snap settings, candidate types, nearest candidate selection, screen-pixel scoring, optional spatial index wrapper.
- `packages/core/src/relations.ts`
  - Public relation input/update types and helper validation for append/remove semantics.
- `packages/core/src/validation.ts`
  - `ValidationIssue`, `ValidationSeverity`, `ValidationRule`, `ValidationResult`, built-in rules, rule registry.

### Public API Additions

Candidate API shape for planning:

- Editor options:
  - `snapping?: { enabled?: boolean; tolerancePx?: number }`
  - `validationRules?: ValidationRule[]`
- Editor methods:
  - `setSnapping(options | boolean)`
  - `getSnapCandidate(coordinate)` or `previewSnap(coordinate)` if useful for tests/hosts
  - `detachFeatureGeometry(featureId)`
  - `createRelation(input)`
  - `updateRelationTags(relationId, tags)`
  - `appendRelationMember(relationId, member)`
  - `removeRelationMember(relationId, memberRef or index)`
  - `validate(): ValidationResult`
  - `registerValidationRule(rule)` / constructor-provided rules

Planner can refine names, but plans must preserve these capabilities.

### Snapping Algorithm

1. Build candidate index from current primitive nodes and way edges.
2. For a pointer coordinate, project pointer and candidates to screen points through the adapter.
3. Query candidates inside `tolerancePx`.
4. Score by pixel distance to node point or edge projection.
5. Choose nearest candidate.
6. If node candidate wins, reuse node ID.
7. If edge candidate wins, create one new node at projected coordinate, insert it into the existing way sequence, and reuse that node ID in the new/edited feature.

The index should be rebuilt or incrementally updated after primitive mutations. A rebuild-on-mutation strategy is acceptable for v1 unless performance tests show otherwise.

### Shared Mutation

Shared mutation should be primitive-first:

- Moving a node updates the node once.
- Find all features whose refs include that node.
- Rehydrate coordinates for every affected feature.
- Call `adapter.updateFeature` for each visible affected feature.
- Emit `nodeMoved`, `wayUpdated` for affected ways, and `featureUpdated` for affected features.

Detach should clone the selected feature's editable node sequence, update only that feature's way to reference cloned nodes, and preserve tags/timestamps according to existing creation/update policy.

### Validation Architecture

Validation should be pure and advisory:

```ts
type ValidationSeverity = "error" | "warning" | "info";

interface ValidationIssue {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  elementType?: "node" | "way" | "relation";
  elementId?: number;
  featureId?: string;
}

type ValidationRule = (context: ValidationContext) => ValidationIssue[];
```

Built-ins should include:

- Missing `level` for indoor features where required.
- Missing `indoor` tags for indoor area features.
- Broken node references in ways.
- Broken member references in relations.
- Closed area ways with too few distinct nodes or missing closing node.
- Duplicate node problems, including adjacent duplicate node IDs or duplicate coordinates where they imply accidental duplication.
- Invalid/self-intersecting polygons.

Validation should emit `validationChanged` with issues, not the current `{ valid, errors: string[] }` shape.

## Risk Notes

- Edge snapping that splits existing ways is the riskiest behavior because it mutates another feature while drawing a new one. Tests must cover both the existing way and the new way export.
- Shared node movement can make current single-feature update logic stale. Plan must include all-affected-feature refresh before claiming SNAP-04.
- Relation-backed features should not be sent to Leaflet as geometry unless they have explicit renderable member geometry. Context says state-only relation features are enough.
- Turf validity checks work on GeoJSON geometry, so coordinate conversion order must be `[lon, lat]`, not `[lat, lon]`.
- Advisory validation must not be conflated with import structural integrity. `loadOsmInEdit()` should still reject broken references.

## Suggested Plan Breakdown

1. **Spatial index, node snapping, edge snapping, and shared-wall creation**
   - SNAP-01, SNAP-02, SNAP-03.
2. **Shared-node mutation semantics and imported editable feature rebuilding**
   - SNAP-04, SNAP-05, IO-04, IO-05, IO-06.
3. **Relation primitive support and minimal relation editing API**
   - REL-01, REL-02, REL-03, REL-04, INDOOR-06.
4. **Built-in and pluggable validation rules**
   - VAL-01 through VAL-06.

## Sources

- RBush npm package: https://www.npmjs.com/package/rbush
- Turf `booleanValid`: https://turfjs.org/docs/7.2.0/api/booleanValid
- Turf `kinks`: https://turfjs.org/docs/api/kinks
- Turf `lineIntersect`: https://turfjs.org/docs/api/lineIntersect
- Leaflet map reference: https://leafletjs.com/reference
- OpenStreetMap Simple Indoor Tagging: https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging
- OpenStreetMap Relation: https://wiki.openstreetmap.org/wiki/Relation
- OpenStreetMap Multipolygon relation: https://wiki.openstreetmap.org/wiki/Multipolygon
