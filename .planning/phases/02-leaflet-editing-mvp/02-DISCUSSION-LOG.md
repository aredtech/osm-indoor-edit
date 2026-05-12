# Phase 2: Leaflet Editing MVP - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 02-Leaflet Editing MVP
**Areas discussed:** Drawing Completion, Leaflet Visual Layers, Editing Gestures, Indoor Levels And Tags, Leaflet Proof Target

---

## Drawing Completion

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should drawing finish in Leaflet? | Host-controlled finish; Map gestures too; Hybrid; Other | Host-controlled finish |
| What should happen if the host calls `finishDraw()` too early? | Reject with typed error; No-op and emit error event; Auto-close whatever exists; Other | Reject with typed error |
| Should room/corridor drafts show the closing segment before finish? | Yes, preview closed polygon; Lines only until finish; Only show closing segment, no fill; Other | Yes, preview closed polygon |
| After `cancelDraw()`, what should the SDK do? | Full cleanup and event; Full cleanup only; Keep draft for resume; Other | Full cleanup and event |

**Notes:** Drawing remains host-controlled at the UI boundary. The SDK owns map capture and temporary visuals, but finishing/cancelling is driven by host API calls.

---

## Leaflet Visual Layers

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| What should default Leaflet visuals look like in Phase 2? | Simple editing palette; OSM-ish semantic colors; Minimal debug visuals; Other | Simple editing palette |
| Should Phase 2 expose style override options now? | Minimal overrides now; No overrides yet; Full style config now; Other | Minimal overrides now |
| How should the SDK organize Leaflet layers? | Dedicated SDK layer group/pane; Separate public layer groups; Add directly to the map; Other | Dedicated SDK layer group/pane |
| What happens to visuals when level changes? | Filter committed features by level; Show all levels, highlight current; Host decides visibility; Other | Filter committed features by level |

**Notes:** Phase 2 should look usable without becoming a full style system. SDK-owned layer structure keeps cleanup and z-order predictable.

---

## Editing Gestures

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should feature selection work in Leaflet? | Click feature to select; Host calls `selectFeature()` only; Both map click and host API; Other | Click feature to select |
| How should vertex dragging behave? | Drag handles directly; Drag handles, commit on mouseup only; Host-controlled edit mode only; Other | Drag handles directly |
| How should users add a vertex? | Click midpoint handles; Alt/Option-click edge; Host API only; Other | Click midpoint handles |
| How should users delete vertices? | Host API only for Phase 2; Delete/Backspace; Double-click vertex handle; Other | Host API only for Phase 2 |
| Should Phase 2 include moving an entire feature by dragging it? | Yes, drag selected feature body; No, defer whole-feature move; Host API only; Other | Yes, drag selected feature body |

**Notes:** Map gestures are preferred for spatial editing, but destructive actions remain explicit through host API.

---

## Indoor Levels And Tags

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should tags be assigned when creating features? | SDK assigns minimum indoor tags; Host supplies all tags up front; SDK prompts through events; Other | SDK assigns minimum indoor tags |
| What if there is no current level when drawing starts? | Require current level; Default to level `"0"`; Allow no level; Other | Require current level |
| How should `repeat_on` behave in Phase 2? | Preserve and filter simply; Ignore `repeat_on` until later; Full multi-level editing now; Other | Preserve and filter simply |
| What POI kinds should Phase 2 support directly? | Generic POI plus host tags; Named POI subtypes; POI without semantic tags; Other | Generic POI plus host tags |

**Notes:** Phase 2 should prevent silent bad exports by requiring level before drawing. Multi-level support is intentionally simple.

---

## Leaflet Proof Target

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| What should count as proof that the MVP works? | Adapter tests plus minimal Leaflet example; Tests only; Example only; Other | Adapter tests plus minimal Leaflet example |
| Should the Leaflet example be polished or bare? | Bare functional example; Polished demo; Test harness only; Other | Bare functional example |
| Should Phase 2 include browser automation? | Yes, basic Playwright smoke; No, manual example only; Only screenshot check; Other | Yes, basic Playwright smoke |
| Should Leaflet be direct or peer dependency? | Peer dependency plus dev dependency; Direct dependency; Dev dependency only; Other | Peer dependency plus dev dependency |

**Notes:** The proof target is stronger than tests-only but still avoids drifting into the Phase 5 polished examples/docs scope.

## The Agent's Discretion

- Exact internal module boundaries, test file layout, and method signatures can be chosen during planning if they honor the captured decisions and existing public API shape.

## Deferred Ideas

- Full style system, snapping, robust validation, MapLibre parity, polished examples, and documentation are intentionally deferred to their roadmap phases.
