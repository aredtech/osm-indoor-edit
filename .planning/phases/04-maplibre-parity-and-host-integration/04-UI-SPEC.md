# Phase 04 UI Design Contract: MapLibre Editing Visuals

**Phase:** 04 - MapLibre Parity and Host Integration
**Created:** 2026-05-12
**Status:** Approved for planning
**Scope:** SDK-owned map editing visuals and host-facing interaction signals only.

## Design Boundary

Phase 04 does not introduce a fixed application UI. The SDK must remain headless: host applications own toolbars, buttons, forms, sidebars, save flows, publishing flows, keyboard shortcuts, and explanatory text.

The SDK owns the MapLibre editing affordances that appear on the map itself:

- temporary drawing vertices, lines, and polygon preview fills
- committed feature geometry
- selected feature highlighting
- vertex and midpoint handles
- snap indicators
- level-aware feature visibility
- renderer events that allow host UI to react without SDK-owned controls

MapLibre must match Leaflet at the user-observable contract level even though it uses MapLibre-native GeoJSON sources and style layers internally.

## Visual Vocabulary

MapLibre must expose an editing style vocabulary aligned with the existing Leaflet adapter:

| Role | Purpose | Default Visual Contract |
|------|---------|-------------------------|
| `draftLine` | active drawing line or polygon outline | blue `#2563EB`, width `2`, opacity `0.9` |
| `draftVertex` | clicked vertices during drawing | circle radius `6`, white stroke width `2`, blue fill `#2563EB` |
| `preview` | active polygon preview fill | blue outline `#2563EB`, fill `#60A5FA`, fill opacity `0.22` |
| `committed` | saved room, corridor, outline, or point feature | teal outline `#0F766E`, width `2`, opacity `0.9`, fill `#99F6E4`, fill opacity `0.18`, point radius `6` |
| `selected` | currently selected editable feature | orange `#F97316`, width `3`, opacity `1`, fill opacity `0.12` |
| `vertexHandle` | draggable existing vertex | circle radius `7`, orange stroke `#F97316`, white fill, stroke width `2` |
| `midpointHandle` | insertable midpoint between vertices | circle radius `5`, blue stroke `#2563EB`, white fill opacity `0.85`, stroke opacity `0.7`, stroke width `2` |
| `snapIndicator` | current node or edge snap candidate | green `#22C55E`, circle radius `8`, stroke width `2`, opacity `0.9`, fill opacity `0.25`; edge candidate may also show a green line |
| `poi` | committed point feature | uses committed point styling by default; host may override separately |
| `door` | door-like point or way feature | uses committed styling by default; host may override separately |

The palette is intentionally multi-role rather than one-note: blue indicates active drawing and midpoint insertion, teal indicates committed indoor geometry, orange indicates selected/editable state, and green indicates snapping.

## MapLibre Source And Layer Contract

The adapter must create SDK-owned sources and layers with a configurable prefix. The default prefix is `osminedit`.

| Concern | Source ID | Required Layer Roles |
|---------|-----------|----------------------|
| Draft geometry | `osminedit-draft` | draft fill, draft line, draft vertex circles |
| Committed features | `osminedit-committed` | committed fill, committed line, committed point circles |
| Selection | `osminedit-selection` | selected fill, selected line, selected point circles |
| Handles | `osminedit-handles` | vertex handle circles, midpoint handle circles |
| Snap | `osminedit-snap` | snap point circle, snap edge line |

Every GeoJSON feature written to these sources should include deterministic properties for testing and hit detection:

- `featureId`
- `geometryType`
- `kind`
- `level`
- `role`
- `vertexIndex` when applicable
- `edgeIndex` when applicable

The adapter may choose exact layer IDs as long as they are prefixed, deterministic, removable on detach, and exposed to tests through stable helper state or public adapter behavior.

## Interaction Contract

### Drawing

When drawing is active, map clicks captured by the adapter must produce visible temporary geometry:

- first click: a draft vertex appears
- second click for linear/polygon features: a draft line appears
- third and later polygon clicks: preview fill appears with stable opacity
- finish: draft source is cleared and committed geometry appears
- cancel: draft source is cleared and committed state is unchanged

POI drawing commits as a point and should not create misleading polygon preview visuals.

### Selection And Editing Handles

Selecting a feature must show selected geometry plus editable handles where the geometry supports editing. Selected styling must be visible through both color and stroke/handle treatment so selection is not communicated by hue alone.

Relation-backed feature records remain non-rendered in v1. They may exist in editor state, import/export, and validation, but MapLibre must not draw relation group geometry.

### Vertex, Midpoint, And Feature Dragging

Vertex handles are draggable and must update the linked primitive coordinates through the core editor. Midpoint handles are clickable insert targets and must map back to the correct feature and edge index.

Whole-feature drag must update all linked primitive coordinates while preserving shared topology semantics owned by core. During active SDK drags, MapLibre map drag-pan may be disabled, but it must always be restored on pointer up, cancel, and detach.

### Snapping

When snapping is enabled and a candidate is available, MapLibre must show a snap point indicator. Edge candidates may additionally show a snap edge line. Snap visuals clear when there is no candidate, drawing is cancelled, drawing is finished, snapping is disabled, or the adapter detaches.

Snap indicators are transient guidance only; committed geometry remains driven by core snapping decisions.

### Level Filtering

Committed and selected source data must follow Leaflet visibility semantics:

- visible when feature `level` equals current level
- visible when feature `repeat_on` includes current level
- hidden otherwise

Changing the editor level must regenerate visible committed, selected, handle, and snap state as needed without leaving stale features in sources.

## Host Integration Contract

The host application controls all visible application UI through editor API calls and typed events. Phase 04 planning must audit and complete the event implementation so hosts can observe:

- editor ready and destroy lifecycle
- tool changes
- level changes
- drawing start, update, cancel, and finish
- feature create, select, update, move, and delete
- node, way, and relation updates
- tag updates
- validation changes
- export readiness
- recoverable errors

Renderer-specific MapLibre event objects may appear only as opaque escape hatches on adapter-level events. Core editor events must stay renderer-neutral.

No SDK-owned in-app copy, toolbar labels, onboarding text, keyboard shortcut hints, dialogs, or save/publish prompts are allowed in Phase 04.

## Style Override Contract

Hosts must be able to override common editing visuals without learning MapLibre internals for ordinary styling. The public MapLibre package should provide a typed override object with keys matching the visual vocabulary:

- `draftLine`
- `draftVertex`
- `preview`
- `committed`
- `selected`
- `vertexHandle`
- `midpointHandle`
- `snapIndicator`
- `poi`
- `door`

MapLibre-native paint/layout overrides may be exposed underneath those keys when needed, but the package should keep renderer-specific types inside `@osminedit-lib/maplibre`. Core must not import MapLibre style types.

Partial overrides must merge with defaults so a host can change one color, width, radius, or opacity without restating the entire style system.

## Responsive And Accessibility Notes

Phase 04 is not responsible for a full responsive application shell, but map editing affordances must remain usable in desktop and touch-oriented host apps:

- handles use fixed radii large enough for pointer interaction
- hover-dependent behavior must not be the only way to understand or enter edit mode
- selected state combines stroke width, handle visibility, and color
- source/layer updates must avoid layout shifts in host-owned UI because no SDK DOM controls are created
- the adapter should avoid adding arbitrary z-indexed DOM elements over host controls

## Test And Verification Requirements

Planning must add or preserve automated coverage for these UI-facing contracts:

- source and layer creation use the configured prefix
- detach removes all SDK-owned sources, layers, and listeners
- draft, committed, selection, handle, and snap source data update after the corresponding editor operations
- style overrides merge with default styles role-by-role
- level changes remove hidden features from committed and selected source data
- cancel/finish clears draft and snap visuals
- drag completion restores map drag-pan
- host UI can be driven from typed editor events without SDK controls

Browser screenshots are deferred to Phase 05 examples. Phase 04 verification should rely on deterministic Vitest tests against a fake MapLibre map plus root `pnpm typecheck` and `pnpm test`.

## Non-Goals

- no fixed toolbar, sidebar, properties form, modal, command palette, or save UI
- no framework wrapper components
- no polished example page
- no real OpenStreetMap publishing UI
- no floor-plan image controls
- no rich icon catalog beyond minimal configurable POI and door styling hooks

## Planner Checklist

- Keep MapLibre implementation inside `packages/maplibre`.
- Keep core renderer-neutral and free of MapLibre imports.
- Mirror Leaflet behavior and palette unless MapLibre requires a small translation.
- Use deterministic GeoJSON source state for visual assertions.
- Treat host-owned UI as an API and event completeness problem, not a component-building task.

## UI Quality Gate

**Verdict:** Approved

| Dimension | Result | Notes |
|-----------|--------|-------|
| Visual clarity | Pass | Roles have distinct, purposeful defaults for drawing, committed, selection, handles, and snap state. |
| Interaction completeness | Pass | Drawing, selection, editing, dragging, snapping, cancel/finish cleanup, and level filtering are covered. |
| Host boundary | Pass | SDK-owned map visuals are separated from host-owned application UI. |
| Technical alignment | Pass | Contract matches MapLibre source/layer architecture and Leaflet parity decisions. |
| Accessibility/responsiveness | Pass | Handles, selection redundancy, and DOM overlay avoidance are specified. |
| Testability | Pass | Every visible contract maps to deterministic adapter/source tests. |
