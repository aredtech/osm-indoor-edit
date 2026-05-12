---
phase: 05
slug: examples-docs-and-release-readiness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 05 - Validation Strategy

Per-phase validation contract for examples, documentation, and release-readiness work.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x, Playwright 1.60, TypeScript 5.9, Vite 7 |
| **Config file** | `tsconfig.typecheck.json`, `playwright.config.ts`, package-local `vite.config.ts` files |
| **Quick run command** | `pnpm typecheck && pnpm test -- --runInBand <target test files>` |
| **Full suite command** | `pnpm build && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm release:dry-run` |
| **Estimated runtime** | ~10-30 seconds after both example smoke suites are added |

## Sampling Rate

- **After every task commit:** Run the task-specific command from the plan, plus `pnpm typecheck`.
- **After every plan wave:** Run `pnpm build`, `pnpm typecheck`, and `pnpm test`.
- **Before `$gsd-verify-work`:** Full suite, e2e smoke, core-boundary check, and release dry-run must be green.
- **Max feedback latency:** Target < 30 seconds for the full Phase 05 gate.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | EX-01 / EX-02 | T-05-01 / T-05-02 | Shared fixtures/helpers are local example utilities and do not create SDK-owned UI or publishing policy. | type/unit | `pnpm typecheck && pnpm test` | W0 | pending |
| 05-01-02 | 01 | 1 | EX-01 | T-05-02 / T-05-03 | Leaflet example remains host-owned and demonstrates load sample, validate, snapping toggle, tags, levels, and export. | build/e2e | `pnpm --filter @osminedit-lib/example-leaflet build && pnpm test:e2e:leaflet` | W0 | pending |
| 05-01-03 | 01 | 1 | EX-02 | T-05-02 / T-05-03 | MapLibre example uses a local/no-network style and demonstrates the same host-owned workflow as Leaflet. | build/e2e | `pnpm --filter @osminedit-lib/example-maplibre build && pnpm test:e2e:maplibre` | W0 | pending |
| 05-01-04 | 01 | 1 | EX-01 / EX-02 | T-05-03 | Browser smoke tests prove both examples expose host controls and export/validation status. | e2e | `pnpm test:e2e` | W0 | pending |
| 05-02-01 | 02 | 2 | EX-03 / EX-04 | T-05-02 | README and docs explicitly separate SDK-owned map behavior from host-owned UI/save/publish workflow. | docs grep | `test -f README.md && test -f docs/sdk-host-boundary.md && test -f docs/api-recipes.md` | W0 | pending |
| 05-02-02 | 02 | 2 | EX-04 | T-05-02 | API recipes cover create, renderer setup, draw, edit tags, validate, load, export, and events. | docs grep | `rg "createEditor|startDraw|updateTags|validate\\(|loadOsmInEdit|exportOsmInEdit|\\.on\\(" README.md docs/api-recipes.md` | W0 | pending |
| 05-02-03 | 02 | 2 | EX-03 | T-05-01 / T-05-05 | Package metadata keeps renderer dependencies isolated from core and documents manual publish boundary. | script | `pnpm check:core-boundary && pnpm release:dry-run` | W0 | pending |
| 05-02-04 | 02 | 2 | EX-01 / EX-02 / EX-03 / EX-04 | T-05-04 / T-05-05 | Full release gate proves packages, examples, docs, and dry-run release checks pass without npm publishing. | full gate | `pnpm build && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm release:dry-run` | W0 | pending |

## Wave 0 Requirements

- [ ] `examples/vanilla/src/main.ts` — shared sample fixture/helper exports.
- [ ] `examples/maplibre/index.html` — runnable MapLibre example entry.
- [ ] `examples/maplibre/vite.config.ts` — source aliases for local workspace package development.
- [ ] `tests/e2e/maplibre-example.spec.ts` — MapLibre smoke coverage.
- [ ] `playwright.config.ts` — both renderer smoke suites can run deterministically.
- [ ] `README.md`, `docs/sdk-host-boundary.md`, `docs/api-recipes.md`, `docs/release.md` — public docs.
- [ ] `scripts/` or package scripts for `check:core-boundary` and `release:dry-run`.

## Manual-Only Verifications

All Phase 05 success criteria should have automated coverage. Optional manual browser review after execution can inspect example usability, but it must not replace Playwright smoke and package/release checks.

## Validation Sign-Off

- [ ] All tasks have automated verify commands or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 30 seconds.
- [ ] `nyquist_compliant: true` set in frontmatter after execution verification.

Approval: pending
