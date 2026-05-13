---
phase: 6
slug: preset-catalog-and-custom-draw-mode
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm test -- --run packages/core/test/presets.test.ts packages/core/test/editor-drawing.test.ts` |
| **Full suite command** | `pnpm test && pnpm build && pnpm build:examples && pnpm test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the relevant package test command listed in the plan task.
- **After every plan wave:** Run `pnpm test && pnpm build`.
- **Before `$gsd-verify-work`:** Run `pnpm test && pnpm build && pnpm build:examples && pnpm test:e2e`.
- **Max feedback latency:** 120 seconds for full-suite feedback; less than 20 seconds for focused core tests.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | PRESET-01 | T-06-01 | N/A | unit | `pnpm test -- --run packages/core/test/presets.test.ts` | ✅ | ✅ green |
| 06-01-02 | 01 | 1 | PRESET-02 | T-06-02 | N/A | unit | `pnpm test -- --run packages/core/test/presets.test.ts` | ✅ | ✅ green |
| 06-01-03 | 01 | 1 | PRESET-05 | T-06-03 | N/A | unit | `pnpm test -- --run packages/core/test/presets.test.ts` | ✅ | ✅ green |
| 06-02-01 | 02 | 2 | CUSTOM-01 | T-06-04 | N/A | unit | `pnpm test -- --run packages/core/test/editor-drawing.test.ts packages/core/test/presets.test.ts` | ✅ | ✅ green |
| 06-02-02 | 02 | 2 | CUSTOM-02 | T-06-05 | N/A | unit | `pnpm test -- --run packages/core/test/editor-drawing.test.ts packages/core/test/import-export.test.ts` | ✅ | ✅ green |
| 06-03-01 | 03 | 3 | PRESET-03 | T-06-06 | N/A | unit + docs | `pnpm test -- --run packages/core/test/presets.test.ts && pnpm build` | ✅ | ✅ green |
| 06-03-02 | 03 | 3 | PRESET-04 | T-06-07 | N/A | e2e | `pnpm build:examples && pnpm test:e2e` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:

- [x] `vitest.config.ts` — existing unit test runner.
- [x] `playwright.config.ts` — existing Leaflet and MapLibre example e2e runner.
- [x] `package.json` — existing build, test, example build, and e2e scripts.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Host-owned preset UI remains clearly outside SDK ownership | PRESET-03 | Requires documentation/examples review in addition to automated smoke tests | Read `README.md`, `docs/api-recipes.md`, `examples/leaflet/src/main.ts`, and `examples/maplibre/src/main.ts`; confirm picker/form markup lives in examples, not core or renderer packages. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 120 seconds for full-suite feedback.
- [x] `nyquist_compliant: true` set in frontmatter.

Approval: passed 2026-05-13
