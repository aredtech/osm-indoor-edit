---
phase: 04
slug: maplibre-parity-and-host-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 04 - Validation Strategy

Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test -- --runInBand <target test files>` |
| **Full suite command** | `pnpm test` |
| **Type check command** | `pnpm typecheck` |
| **Estimated runtime** | ~2 seconds for current full unit suite; MapLibre fake-map tests should stay in the same order of magnitude |

## Sampling Rate

- **After every task commit:** Run the task-specific `pnpm test -- --runInBand ...` command from the plan, plus `pnpm typecheck`.
- **After every plan wave:** Run `pnpm test` and `pnpm typecheck`.
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** Target < 10 seconds for full unit suite after MapLibre adapter tests are added.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ADAPT-03 | T-04-01 / T-04-02 | MapLibre adapter owns isolated SDK sources/layers and cleans them up on detach. | unit | `pnpm test -- --runInBand packages/maplibre/test/maplibre-adapter.test.ts` | No - create in plan | pending |
| 04-01-02 | 01 | 1 | STYLE-01 | T-04-02 | Temporary, committed, selection, handles, and snap visuals are represented in deterministic MapLibre source/layer state. | unit | `pnpm test -- --runInBand packages/maplibre/test/maplibre-adapter.test.ts packages/maplibre/test/maplibre-snapping.test.ts` | No - create in plan | pending |
| 04-02-01 | 02 | 2 | ADAPT-03 | T-04-03 / T-04-04 | MapLibre events drive core draw/edit/snap/topology flows and export remains valid. | integration | `pnpm test -- --runInBand packages/maplibre/test/maplibre-drawing.test.ts packages/maplibre/test/maplibre-editing.test.ts packages/maplibre/test/maplibre-snapping.test.ts` | No - create in plan | pending |
| 04-02-02 | 02 | 2 | EVT-02 | T-04-04 | Host-owned controls can drive editor methods while adapter events update state and visuals. | integration | `pnpm test -- --runInBand packages/maplibre/test/maplibre-editing.test.ts packages/core/test/editor-snapping.test.ts` | No - create in plan | pending |
| 04-03-01 | 03 | 3 | API-06 | T-04-05 | Default tags, ID options, validation rules, snapping, and style options remain configurable through plain TypeScript APIs. | unit | `pnpm test -- --runInBand packages/core/test/editor.test.ts packages/core/test/editor-validation.test.ts packages/maplibre/test/maplibre-adapter.test.ts` | Partial - extend in plan | pending |
| 04-03-02 | 03 | 3 | EVT-01 | T-04-06 | Lifecycle, drawing, feature, primitive, validation, export, and error events are emitted with typed payloads. | unit | `pnpm test -- --runInBand packages/core/test/events.test.ts packages/core/test/editor.test.ts` | Partial - extend in plan | pending |
| 04-03-03 | 03 | 3 | STYLE-02 | T-04-02 | Host style overrides merge with defaults and affect MapLibre paint/layout definitions. | unit | `pnpm test -- --runInBand packages/maplibre/test/maplibre-adapter.test.ts` | No - create in plan | pending |

## Wave 0 Requirements

Existing Vitest infrastructure is present. Phase plans must create:

- `packages/maplibre/test/maplibre-adapter.test.ts` — fake MapLibre map and source/layer lifecycle tests.
- `packages/maplibre/test/maplibre-drawing.test.ts` — draw/commit/source update integration tests.
- `packages/maplibre/test/maplibre-editing.test.ts` — selection, handle, midpoint, vertex, and feature drag tests.
- `packages/maplibre/test/maplibre-snapping.test.ts` — snap source/layer and shared topology integration tests.

## Manual-Only Verifications

All Phase 04 behaviors should have automated verification through Vitest fake-map and core integration tests. Browser example verification is deferred to Phase 05.

## Validation Sign-Off

- [ ] All tasks have automated verify commands or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 10 seconds.
- [ ] `nyquist_compliant: true` set in frontmatter after execution verification.

Approval: pending
