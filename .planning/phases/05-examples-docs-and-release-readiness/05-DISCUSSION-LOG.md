# Phase 5: Examples, Docs, and Release Readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 5-Examples, Docs, and Release Readiness
**Areas discussed:** Example Shape, Demo Workflow, Docs Structure, Release Checks

---

## Example Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Parallel apps | Keep separate runnable examples for each renderer, with matching controls and small shared helper code only where it stays plain TypeScript. | ✓ |
| Shared harness | Build one common host UI harness and swap renderer setup, reducing duplication but adding abstraction to examples. | |
| Separate entirely | Let each renderer example stand alone with duplicated host UI code, easiest to read but more drift-prone. | |

**User's choice:** Parallel apps.
**Notes:** Examples should match workflow and controls while remaining easy to read.

| Option | Description | Selected |
|--------|-------------|----------|
| Tiny shared utilities only | Share fixtures/types/helper functions if useful, but keep each example's host UI readable in its own app. | ✓ |
| Shared controls module | Reuse the full control/sidebar/export UI between Leaflet and MapLibre. | |
| No shared code | Duplicate everything so each example is completely self-contained. | |

**User's choice:** Tiny shared utilities only.
**Notes:** Readability matters more than eliminating all duplication.

| Option | Description | Selected |
|--------|-------------|----------|
| Convert to shared example utilities | Use `examples/vanilla` as a small shared package/module for fixtures/helpers used by Leaflet and MapLibre. | ✓ |
| Keep as core-only demo | Make it a headless/core-only example without map renderers. | |
| Remove/defer it | Focus Phase 5 only on Leaflet and MapLibre examples. | |

**User's choice:** Convert to shared example utilities.
**Notes:** The existing placeholder should become useful support code rather than a third app surface.

| Option | Description | Selected |
|--------|-------------|----------|
| Root scripts plus package scripts | Add clear root scripts like `dev:leaflet`, `dev:maplibre`, and keep package-local `dev/build` scripts too. | ✓ |
| Package scripts only | Developers run examples through `pnpm --filter ... dev`, less root clutter but less discoverable. | |
| Single examples launcher | One command starts/chooses examples, nicer later but extra machinery now. | |

**User's choice:** Root scripts plus package scripts.
**Notes:** Discoverability is part of Phase 5 release readiness.

---

## Demo Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Full integration workflow | Draw room/corridor/POI, change level, edit tags, validate, import sample data, export JSON, and show events/status. | ✓ |
| Drawing/export only | Keep examples very small: draw, basic tags, export. | |
| Import/edit first | Load a sample indoor map immediately, then let users edit/validate/export it. | |

**User's choice:** Full integration workflow.
**Notes:** Both renderers should prove the same host-owned workflow.

| Option | Description | Selected |
|--------|-------------|----------|
| Built-in sample button | Include a bundled indoor JSON fixture and a "Load sample" host control, with no file picker complexity. | ✓ |
| Paste JSON panel | Let users paste OsmInEdit JSON directly, useful for debugging but heavier UI. | |
| File upload | Let users import a local JSON file, closer to real apps but more host-app machinery. | |

**User's choice:** Built-in sample button.
**Notes:** Import should be visible without making file handling look like SDK-owned behavior.

| Option | Description | Selected |
|--------|-------------|----------|
| Compact issue panel | Show count, severity, rule id, and message in the host UI; no blocking behavior. | ✓ |
| Status text only | Show pass/fail or issue count, simpler but less useful for docs. | |
| Blocking workflow | Prevent export when errors exist, which demonstrates host policy but could imply SDK policy. | |

**User's choice:** Compact issue panel.
**Notes:** Validation is advisory by SDK default; host apps decide blocking policy.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with a toggle | Add a host-owned snapping toggle and status hint so developers can see shared-wall behavior without it being magical. | ✓ |
| Always on | Simpler controls, but less explicit. | |
| Not in examples | Keep demos simpler and leave snapping to docs/tests. | |

**User's choice:** Yes, with a toggle.
**Notes:** Snapping should remain explicit and host-controlled.

---

## Docs Structure

| Option | Description | Selected |
|--------|-------------|----------|
| README plus focused docs folder | Root README gives quickstart and package overview; `docs/` holds API recipes and SDK-vs-host responsibility guide. | ✓ |
| Root README only | Faster and simple, but API examples may get crowded. | |
| Docs folder only | Cleaner long-form docs, but package discovery from repo root is weaker. | |

**User's choice:** README plus focused docs folder.
**Notes:** Root discovery and focused long-form docs are both needed.

| Option | Description | Selected |
|--------|-------------|----------|
| Host-owned workflow boundary | Lead with what SDK owns vs what host app owns, then show API recipes. | ✓ |
| API reference first | Start with methods/types, then explain architecture. | |
| Examples first | Lead with running examples, then explain concepts. | |

**User's choice:** Host-owned workflow boundary.
**Notes:** This is the product distinction and should appear before API details.

| Option | Description | Selected |
|--------|-------------|----------|
| Copy-paste recipes | Short runnable snippets for create, draw, edit tags, validate, load, export, events, and renderer setup. | ✓ |
| Narrative examples | Explain concepts with partial snippets, lighter maintenance. | |
| Generated type reference | Point to TypeScript declarations mostly, less hand-written guidance. | |

**User's choice:** Copy-paste recipes.
**Notes:** Docs should help developers integrate quickly.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, explicit v1 boundaries | Document no backend, no real OSM publishing, no framework wrappers, no floor-plan calibration in v1. | ✓ |
| Brief note only | Keep docs upbeat and avoid a large limitations section. | |
| Hide in roadmap only | Leave boundaries in planning docs, not public docs. | |

**User's choice:** Yes, explicit v1 boundaries.
**Notes:** Public docs should prevent wrong expectations.

---

## Release Checks

| Option | Description | Selected |
|--------|-------------|----------|
| Full repo gate | `pnpm build`, `pnpm typecheck`, `pnpm test`, example builds, and Playwright smoke for both Leaflet and MapLibre. | ✓ |
| Core gate only | Build/typecheck/unit tests, but skip example browser smoke. | |
| Manual examples only | Build/tests plus documented manual run checklist, no browser automation expansion. | |

**User's choice:** Full repo gate.
**Notes:** Both examples should be machine-checked before v1 is considered ready.

| Option | Description | Selected |
|--------|-------------|----------|
| Clean package metadata, no publishing | Ensure package names, exports, peer deps, files/types/scripts are coherent, but do not publish or add npm release automation. | |
| Prepare publish automation | Add release scripts/changesets, more complete but bigger scope. | ✓ |
| Skip package metadata | Only prove examples/docs work. | |

**User's choice:** Prepare publish automation.
**Notes:** Phase 5 should go beyond metadata cleanup.

| Option | Description | Selected |
|--------|-------------|----------|
| Dry-run release tooling | Add versioning/release-prep scripts and docs, but keep actual npm publish manual. | ✓ |
| Full npm publish command | Add scripts that can publish packages when credentials are present. | |
| Checklist only | Document release steps, but do not add tooling beyond existing build/test scripts. | |

**User's choice:** Dry-run release tooling.
**Notes:** Actual npm publishing stays manual for v1.

| Option | Description | Selected |
|--------|-------------|----------|
| Basic bundle sanity only | Verify examples/packages build and renderer deps stay out of core; no strict size budget yet. | ✓ |
| Strict size budgets | Add size thresholds for packages/examples, useful but brittle for v1. | |
| No bundle checks | Trust TypeScript/package builds only. | |

**User's choice:** Basic bundle sanity only.
**Notes:** Core boundary checks matter more than strict v1 size budgets.

---

## The Agent's Discretion

- Exact docs file names under `docs/`.
- Exact root script names.
- Sample fixture content.
- Playwright test organization.
- Whether shared example utilities live as an importable workspace package or local shared module.

## Deferred Ideas

None.
