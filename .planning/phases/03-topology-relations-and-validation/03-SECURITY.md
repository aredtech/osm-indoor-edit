---
phase: 03
slug: topology-relations-and-validation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-12
---

# Phase 03 - Security

Per-phase security contract: threat register, accepted risks, and audit trail.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Host application to SDK core | Host code controls options, imported data, custom validation rules, and editor API calls. | User/imported OSM-like primitives, tags, custom rules, draw/edit commands |
| SDK core to renderer adapter | Core delegates projection and visual updates without importing renderer libraries. | Coordinates, feature records, optional snap visual hints |
| Import/export boundary | OsmInEdit-style JSON enters and leaves the primitive store. | Numeric IDs, node/way/relation references, tags, timestamps |
| Validation boundary | Validation reports advisory issues while strict import/reference integrity remains enforced separately. | Structured validation issues and cloned state snapshots |

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Tampering | Draw-time snapping | Mitigate | Snapping defaults disabled unless enabled through `EditorOptions.snapping` or `setSnapping`; verified in `packages/core/src/editor.ts` and node/edge snapping tests. | closed |
| T-03-02 | Tampering | Way edge splitting | Mitigate | `insertNodeInWayEdge` delegates to `updateWayNodes`, which preserves closed-way closure and validates references; covered by primitive-store and editor snapping tests. | closed |
| T-03-03 | Information disclosure / architecture boundary | Core renderer integration | Mitigate | Core depends only on renderer-neutral `RendererAdapter.project`; `rg "from ['\"]leaflet['\"]" packages/core/src` returned no matches. | closed |
| T-03-04 | Dependency/API exposure | Public snap API | Mitigate | Public exports are SDK-owned snap types and helpers; no RBush/Turf snap dependency was added or exposed. | closed |
| T-03-05 | Repudiation / host awareness | Shared node movement | Mitigate | Moving shared nodes emits `nodeMoved`, `wayUpdated`, and `featureUpdated`, and refreshes all affected features through `afterSharedGeometryUpdate`. | closed |
| T-03-06 | Tampering | Detach shared geometry | Mitigate | `detachFeatureGeometry` clones editable node coordinates into new nodes, keeps the way/tags stable, and tests prove later movement affects only the detached feature. | closed |
| T-03-07 | Tampering | Feature deletion | Mitigate | `deleteFeature` calls `deleteNodeIfUnreferenced`; `PrimitiveStore.deleteElement` blocks deleting still-referenced nodes, and tests prove shared nodes survive. | closed |
| T-03-08 | Tampering | Import rebuild and round trip | Mitigate | Shared-room fixture tests prove shared node references and unknown valid tags such as `source:floorplan` survive import/edit/export. | closed |
| T-03-09 | Tampering | Relation member mutation | Mitigate | `appendRelationMember` and `removeRelationMember` validate relation references before commit; tests cover missing member rejection and role preservation. | closed |
| T-03-10 | Denial of service / renderer misuse | Relation-backed features | Mitigate | Relation-backed records use `geometryType: "relation"` and are state/export visible without renderer commit calls; editor relation tests assert only the original room is committed. | closed |
| T-03-11 | Tampering | Relation member removal | Mitigate | Removal uses index or exact `type/ref/role` matching and throws when no matching member exists. | closed |
| T-03-12 | Denial of service | Validation on malformed loaded state | Mitigate | Built-in rules return structured issues for broken references and invalid geometry; structurally invalid imports still throw `DataIntegrityError` before validation. | closed |
| T-03-13 | Denial of service | Geometry validation cost | Mitigate | Validation operates on in-memory cloned snapshots and uses local segment checks instead of adding heavyweight geometry dependencies in this slice. | closed |
| T-03-14 | Authorization / workflow boundary | Advisory validation | Mitigate | `exportOsmInEdit()` remains independent of advisory validation; editor validation tests assert export still succeeds when validation issues exist. | closed |
| T-03-15 | Tampering | Custom validation rules | Mitigate | Validation contexts are created from cloned element and feature snapshots, while editor state snapshots are deep-frozen before returning to hosts. | closed |

Status: open or closed. Disposition: mitigate, accept, or transfer.

## Accepted Risks Log

No accepted risks.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-12 | 15 | 15 | 0 | Codex |

## Security Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Threats found | 15 |
| Closed | 15 |
| Open | 0 |

## Verification Evidence

- `pnpm typecheck` exited 0.
- `pnpm test` exited 0: 23 test files passed, 98 tests passed.
- `rg "from ['\"]leaflet['\"]" packages/core/src` returned no matches.
- Phase 03 plan-time threat models were present in `03-01-PLAN.md` through `03-04-PLAN.md`.
- Phase 03 execution summaries were present for all four plans.

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

Approval: verified 2026-05-12
