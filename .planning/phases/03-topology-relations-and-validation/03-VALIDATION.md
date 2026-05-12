---
phase: 03
slug: topology-relations-and-validation
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-12
---

# Phase 03 - Validation Strategy

Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test -- --runInBand <target test files>` |
| **Full suite command** | `pnpm test` |
| **Type check command** | `pnpm typecheck` |
| **Estimated runtime** | ~2 seconds for full unit suite |

## Sampling Rate

- **After every task commit:** Run the task-specific `pnpm test -- --runInBand ...` command from the plan, plus `pnpm typecheck`.
- **After every plan wave:** Run `pnpm test` and `pnpm typecheck`.
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~2 seconds for the full Vitest unit suite in this repo state.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SNAP-01 | T-03-01 | Snapping is explicit, renderer-neutral, and selects nearby nodes only within tolerance. | unit | `pnpm test -- --runInBand packages/core/test/snapping.test.ts packages/core/test/editor-snapping.test.ts` | Yes | green |
| 03-01-02 | 01 | 1 | SNAP-02 | T-03-02 | Edge snapping inserts a real shared node and preserves closed-way references. | unit | `pnpm test -- --runInBand packages/core/test/primitive-store.test.ts packages/core/test/editor-snapping.test.ts` | Yes | green |
| 03-01-03 | 01 | 1 | SNAP-03 | T-03-01/T-03-02 | Adjacent rooms intentionally share exported node IDs. | integration | `pnpm test -- --runInBand packages/core/test/editor-snapping.test.ts packages/leaflet/test/leaflet-snapping.test.ts` | Yes | green |
| 03-02-01 | 02 | 2 | SNAP-04 | T-03-05 | Moving a shared node updates all connected ways/features and emits host-visible updates. | integration | `pnpm test -- --runInBand packages/core/test/editor-topology.test.ts packages/core/test/fake-adapter.test.ts` | Yes | green |
| 03-02-02 | 02 | 2 | SNAP-05 | T-03-06/T-03-07 | Shared geometry can be detached intentionally and export avoids duplicate shared nodes. | integration | `pnpm test -- --runInBand packages/core/test/editor-topology.test.ts packages/core/test/import-export.test.ts` | Yes | green |
| 03-02-03 | 02 | 2 | IO-04 | T-03-08 | Loading OsmInEdit data rebuilds editable primitive and feature records. | integration | `pnpm test -- --runInBand packages/core/test/import-export.test.ts packages/core/test/feature-store.test.ts` | Yes | green |
| 03-02-04 | 02 | 2 | IO-05 | T-03-08 | Imported shared data can be edited and exported while preserving shared refs and valid unknown tags. | integration | `pnpm test -- --runInBand packages/core/test/import-export.test.ts packages/core/test/editor-topology.test.ts` | Yes | green |
| 03-02-05 | 02 | 2 | IO-06 | T-03-08 | Current elements are exposed without publishing or saving workflow coupling. | unit | `pnpm test -- --runInBand packages/core/test/editor.test.ts packages/core/test/import-export.test.ts` | Yes | green |
| 03-03-01 | 03 | 3 | REL-01 | T-03-09 | Relation primitives are stored with numeric IDs, members, tags, and timestamps. | unit | `pnpm test -- --runInBand packages/core/test/primitive-store.test.ts packages/core/test/editor-relations.test.ts` | Yes | green |
| 03-03-02 | 03 | 3 | REL-02 | T-03-10 | Relation primitives import/export in OsmInEdit-style JSON and relation-backed records do not render as grouped geometry. | integration | `pnpm test -- --runInBand packages/core/test/import-export.test.ts packages/core/test/editor-relations.test.ts` | Yes | green |
| 03-03-03 | 03 | 3 | REL-03 | T-03-09/T-03-12 | Broken relation members are rejected during mutation and reported by validation. | unit | `pnpm test -- --runInBand packages/core/test/primitive-store.test.ts packages/core/test/validation.test.ts` | Yes | green |
| 03-03-04 | 03 | 3 | REL-04 | T-03-09/T-03-11 | Minimal relation editing APIs create, update, append, remove, emit events, and preserve member roles. | integration | `pnpm test -- --runInBand packages/core/test/editor-relations.test.ts packages/core/test/primitive-store.test.ts` | Yes | green |
| 03-03-05 | 03 | 3 | INDOOR-06 | T-03-10 | Floor and building outline features are inferred from OSM-style tags, including relation-backed records. | unit | `pnpm test -- --runInBand packages/core/test/feature-store.test.ts packages/core/test/import-export.test.ts` | Yes | green |
| 03-04-01 | 04 | 4 | VAL-01 | T-03-12 | Validation returns structured issues with severity, rule ID, message, and element references. | unit | `pnpm test -- --runInBand packages/core/test/validation.test.ts packages/core/test/editor-validation.test.ts` | Yes | green |
| 03-04-02 | 04 | 4 | VAL-02 | T-03-12 | Built-ins report missing level and missing indoor tags as advisory warnings. | unit | `pnpm test -- --runInBand packages/core/test/validation.test.ts` | Yes | green |
| 03-04-03 | 04 | 4 | VAL-03 | T-03-12 | Built-ins detect unclosed ways, too few nodes, dangling node refs, and broken way refs. | unit | `pnpm test -- --runInBand packages/core/test/validation.test.ts packages/core/test/import-export.test.ts` | Yes | green |
| 03-04-04 | 04 | 4 | VAL-04 | T-03-13 | Built-ins detect invalid/self-intersecting polygons with local in-memory checks. | unit | `pnpm test -- --runInBand packages/core/test/validation.test.ts` | Yes | green |
| 03-04-05 | 04 | 4 | VAL-05 | T-03-12 | Built-ins detect duplicate node problems and broken relation members. | unit | `pnpm test -- --runInBand packages/core/test/validation.test.ts` | Yes | green |
| 03-04-06 | 04 | 4 | VAL-06 | T-03-15 | Hosts can register and unregister custom validation rules against cloned snapshots. | unit | `pnpm test -- --runInBand packages/core/test/editor-validation.test.ts packages/core/test/validation.test.ts` | Yes | green |

## Requirement Coverage Summary

| Status | Count | Requirements |
|--------|-------|--------------|
| Covered | 19 | SNAP-01, SNAP-02, SNAP-03, SNAP-04, SNAP-05, IO-04, IO-05, IO-06, REL-01, REL-02, REL-03, REL-04, INDOOR-06, VAL-01, VAL-02, VAL-03, VAL-04, VAL-05, VAL-06 |
| Partial | 0 | None |
| Missing | 0 | None |

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

## Manual-Only Verifications

All phase behaviors have automated verification.

## Validation Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

## Automated Verification

- `pnpm typecheck` exited 0.
- `pnpm test` exited 0: 23 test files passed, 98 tests passed.
- Phase 03 verification report already recorded `gaps: []`.
- Phase 03 code review recorded no findings.

## Validation Sign-Off

- [x] All tasks have automated verify commands or existing test infrastructure.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency < 5 seconds for the full unit suite in this repo state.
- [x] `nyquist_compliant: true` set in frontmatter.

Approval: approved 2026-05-12
