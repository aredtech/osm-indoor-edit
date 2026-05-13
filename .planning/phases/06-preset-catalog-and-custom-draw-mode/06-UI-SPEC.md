---
phase: 6
slug: preset-catalog-and-custom-draw-mode
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-13
---

# Phase 6 — UI Design Contract

> Visual and interaction contract for frontend-facing example work. The SDK remains headless; this UI-SPEC governs the host-owned Leaflet and MapLibre example controls only.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | SDK-provided preset SVG assets may be rendered by examples; no UI icon framework required |
| Font | system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif |

---

## Scope Boundary

- The SDK must not ship a preset picker component, form component, toolbar, sidebar, modal, or UI kit.
- Leaflet and MapLibre examples may render a small host-owned preset picker and field form to demonstrate SDK data.
- Example UI must make it clear by code structure that picker/form markup lives in `examples/*/src/main.ts`, not in core or renderer packages.
- Preset icons are optional rendered assets. Examples may show them inside host-owned preset choices, but SDK APIs must remain usable without rendering icons.

---

## Example Layout Contract

| Region | Contract |
|--------|----------|
| Map | Full-viewport map remains the primary surface. |
| Controls | Existing floating controls panel remains the primary host UI container. |
| Preset picker | Add inside controls panel as a compact section below basic draw buttons or as a clearly labeled "Preset" subsection. |
| Geometry choice | Use a select or segmented button row for allowed geometry values: Point, Line, Area. Disabled/unavailable choices must not be shown as clickable active choices. |
| Preset fields | Render as compact host-owned form rows below selected preset and geometry. Use the SDK field schema; do not hard-code field labels except for demo fallback text. |
| Validation panel | Keep current non-blocking validation panel. Preset errors should surface through status text or validation results, not modal blocking UI. |
| Export panel | Keep current export panel. Export must visibly show preset-applied tags such as `"shop": "motorcycle"`. |

---

## Interaction Contract

| Interaction | Contract |
|-------------|----------|
| Search/select preset | Host example should provide a simple preset select/search control seeded with SDK catalog data. |
| Geometry select | When a preset allows multiple geometries, host example lets user choose before starting draw. |
| Start custom draw | Host calls the SDK custom draw API with selected preset ID, geometry type, and initial preset tags. |
| Finish draw | Existing Finish button remains the finish action. Finished preset-backed features become selectable/editable like other features. |
| Field edit | Host form applies field values through SDK tag helpers/editor convenience methods. |
| Invalid preset/geometry | Status text must show the typed SDK error message. No modal required. |
| Existing flows | Room, corridor, POI, sample load, validation, snapping, deletion, and export controls must remain visible and usable. |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Field label gaps, icon/text gaps |
| sm | 8px | Button grid gaps, form field padding |
| md | 16px | Controls panel padding |
| lg | 24px | Desktop panel offsets |
| xl | 32px | Reserved only if a new example section needs separation |
| 2xl | 48px | Not used in compact example panels |
| 3xl | 64px | Not used |

Exceptions: none.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 13px | 500 | 1.4 |
| Label | 12px | 600 | 1.3 |
| Section heading | 12px | 800 | 1.2 |
| Panel heading | 14px | 700 | 1.25 |
| Monospace export | 12px | 400 | 1.45 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F7F8FA` | Floating panel backgrounds |
| Secondary (30%) | `#FFFFFF` | Inputs, buttons, export pre background |
| Accent (10%) | `#2563EB` | Focus ring, active draw/finish affordances, selected preset/geometry border |
| Text | `#17212B` | Primary text |
| Muted text | `#5D6976` | Labels, status, helper copy |
| Border | `#D7DCE2` | Panel, input, and button borders |
| Destructive | `#DC2626` | Destructive actions only |

Accent reserved for: focus-visible outlines, active draw affordances, selected preset, selected geometry, and SDK map editing visuals. Do not recolor every button blue.

---

## Component Contracts

### Preset Picker

- Must fit within the existing controls panel width: `width: min(280px, calc(100vw - 80px))`.
- Must not require a modal or drawer.
- Must support a short preset list or search result list with stable item height.
- Each preset option may show an SVG icon, preset name, and small group/category text.
- Long preset names must wrap or truncate without changing panel width.

### Geometry Choice

- Must present only geometries allowed by the selected preset.
- Labels: `Point`, `Line`, `Area`.
- Selected value must be visually distinct using border/background, not color alone.
- The control must not use viewport-scaled font sizes.

### Preset Field Form

- Fields must use host-owned native controls in examples: `input`, `select`, `textarea`, and checkbox controls.
- Field labels come from SDK field schema.
- Optional group labels may be rendered as small uppercase section labels.
- Empty optional fields must not imply empty-string export tags; helper behavior should remove optional tags.
- Multi-select may be represented as a simple semicolon/comma-delimited host input in the example if a full multi-select widget would create UI complexity.

### Status and Errors

- Error copy must be problem plus next step.
- Example status text for invalid geometry: `This preset cannot be drawn as Line. Choose Point or Area.`
- Example status text for no preset: `Choose a preset before starting custom draw.`
- No in-app instructional paragraphs explaining SDK architecture; docs cover that.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Preset section title | Preset |
| Preset selector label | Feature preset |
| Geometry selector label | Geometry |
| Custom draw CTA | Draw preset |
| Field apply CTA | Apply fields |
| Empty preset option | Choose preset |
| No preset status | Choose a preset before starting custom draw. |
| Invalid geometry status | This preset cannot be drawn as {Geometry}. Choose {AllowedGeometries}. |
| Export empty state body | Draw a room, corridor, POI, or preset feature to populate export JSON. |
| Destructive confirmation | Not required for examples; existing Delete feature button remains direct. |

---

## Responsive Contract

- Desktop: controls panel remains top-left, validation bottom-left, export top-right.
- Mobile: preserve existing media behavior; controls panel is bottom sheet-like with `max-height: 44vh` and scroll.
- Preset fields must stay scrollable within the controls panel on mobile.
- No text may overlap map controls, validation panel, or export panel.
- Buttons and fields must maintain at least `36px` min height.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed in Phase 6 examples |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-13
