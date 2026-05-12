# Phase 4: MapLibre Parity and Host Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 04-MapLibre Parity and Host Integration
**Areas discussed:** MapLibre Layer Model, Interaction Parity, Style Override API, Host Event Surface

---

## MapLibre Layer Model

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror Leaflet internals | Recreate Leaflet's layer-group mental model as closely as possible. | |
| MapLibre-native sources/layers | Use SDK-owned GeoJSON sources/layers while preserving the shared adapter contract. | Yes |
| Defer to planner | Let planning choose without locking a preference. | |

**User's choice:** Proceed with recommended decisions; no detailed discussion needed.
**Notes:** Recommended choice locks MapLibre-native internals with Leaflet-equivalent user-observable behavior.

---

## Interaction Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Strict behavioral parity | Match Leaflet behavior for drawing, editing, snapping, selection, level filtering, import/export, and validation. | Yes |
| MapLibre-specific behavior | Permit different gestures where MapLibre makes that easier. | |
| Partial adapter proof | Implement only drawing/committed rendering first. | |

**User's choice:** Proceed with recommended decisions; no detailed discussion needed.
**Notes:** Recommended choice locks strict parity at the public behavior level while allowing renderer-specific implementation mechanics.

---

## Style Override API

| Option | Description | Selected |
|--------|-------------|----------|
| Shared editing vocabulary | Keep cross-renderer style concepts aligned, with renderer packages translating to native style options. | Yes |
| MapLibre-native only | Expose MapLibre paint/layout objects directly as the primary style API. | |
| Leaflet-compatible only | Force MapLibre styles into the same shape as Leaflet options. | |

**User's choice:** Proceed with recommended decisions; no detailed discussion needed.
**Notes:** Recommended choice keeps host ergonomics consistent while preserving MapLibre-specific escape hatches where needed.

---

## Host Event Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Complete external UI contract | Audit/fill typed events and config so hosts can own all UI without SDK controls. | Yes |
| Minimal event additions | Add only events needed by MapLibre tests. | |
| Defer event polish | Leave event completion to docs/examples. | |

**User's choice:** Proceed with recommended decisions; no detailed discussion needed.
**Notes:** Recommended choice treats events/configuration as a Phase 4 deliverable, matching EVT-01, EVT-02, and API-06.

## The Agent's Discretion

- Exact MapLibre source/layer names.
- GeoJSON feature properties used for hit-testing and rendering.
- Drag implementation mechanics.
- Test helper API shape.
- Whether shared style types are factored into core or kept adapter-local.

## Deferred Ideas

- Phase 5 examples and documentation.
- Real OSM publishing.
- Framework wrappers.
- Rich icon catalogs beyond the v1 configurable defaults.
- Floor plan calibration.
