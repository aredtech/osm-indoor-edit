---
phase: 02
slug: leaflet-editing-mvp
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-12
---

# Phase 02 — UI Design Contract

> Visual and interaction contract for the Leaflet Editing MVP. This phase is not a product UI kit; it proves that host-owned controls can drive SDK-owned Leaflet editing visuals.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | none required for Phase 2 |
| Font | system UI stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |

### Product Boundary

- The SDK must not ship a toolbar, sidebar, modal, form system, or fixed application shell.
- The minimal example may include host-owned controls to prove API behavior.
- Leaflet map editing visuals are SDK-owned and must be usable without requiring a host design system.
- The example should be a practical workbench, not a landing page or polished demo.

---

## Layout Contract

### Bare Leaflet Example

The example first screen is the working map experience:

- Full viewport map area.
- Compact host-owned control rail aligned to the top-left or left edge.
- Compact export/status panel aligned to the right or bottom on narrow screens.
- No hero, marketing copy, decorative cards, gradients, or product splash screen.

### Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop >= 900px | Map fills viewport. Left control rail max width 280px. Export/status panel max width 360px on right. |
| Tablet 640-899px | Map fills viewport. Controls remain compact and may wrap into two rows above the map overlay. |
| Mobile < 640px | Map fills viewport. Controls collapse into a bottom sheet-style panel with fixed-height controls and scrollable export JSON. |

### Fixed-Dimension UI Elements

- Control buttons: minimum height 36px, stable width per group where labels differ.
- Level selector: minimum height 36px.
- Export textarea/pre block: fixed max height with internal scroll.
- Map container: `min-height: 100vh`; no layout shift when controls update.

---

## Spacing Scale

Declared values (all multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon/text gaps, Leaflet handle inner spacing |
| sm | 8px | Button gaps, compact control padding |
| md | 16px | Panel padding, grouped controls |
| lg | 24px | Desktop panel offset from viewport edge |
| xl | 32px | Major example panel spacing only |

Exceptions: Leaflet vertex handles may use 7px radius and 14px diameter for crisp map interaction.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.4 |
| Label | 12px | 600 | 1.3 |
| Button | 13px | 600 | 1.2 |
| Panel Heading | 14px | 700 | 1.25 |
| JSON Output | 12px | 400 | 1.45 |

Rules:

- No viewport-scaled font sizes.
- Letter spacing is `0`.
- No hero-scale type in the example.
- Button labels must remain short enough to fit at 320px viewport width.

---

## Color

### Host Example UI

| Role | Value | Usage |
|------|-------|-------|
| Background | `#F7F8FA` | Compact control panels |
| Surface | `#FFFFFF` | Inputs, grouped host controls |
| Border | `#D7DCE2` | Panel and control borders |
| Text | `#17212B` | Primary text |
| Muted Text | `#5D6976` | Status text and labels |
| Accent | `#2563EB` | Primary draw action and active level focus |
| Destructive | `#DC2626` | Delete feature only |

Accent reserved for: active draw action, focused controls, primary host action. Do not apply accent to every button.

### SDK-Owned Leaflet Editing Visuals

| Visual | Style |
|--------|-------|
| Draft vertices | Blue circular markers, 6px radius, white stroke |
| Draft line | `#2563EB`, 2px stroke, 0.9 opacity |
| Polygon preview | `#60A5FA`, 0.22 fill opacity, `#2563EB` stroke |
| Committed room/corridor | `#0F766E` stroke, 2px, `#99F6E4` fill at 0.18 opacity |
| Committed POI | `#0F766E` circular marker, 6px radius |
| Selected outline | `#F97316`, 3px stroke |
| Vertex handle | White fill, `#F97316` stroke, 7px radius |
| Midpoint handle | White fill, `#2563EB` stroke, 5px radius, lower opacity than vertex handles |

Palette rule: keep the map UI multi-hue but restrained. Avoid purple/blue gradient styling and decorative background effects.

---

## Interaction Contract

### Drawing

- Host controls call `startDraw("room")`, `startDraw("corridor")`, or `startDraw("poi", { tags })`.
- `finishDraw()` and `cancelDraw()` are host-owned controls.
- Drawing requires current level.
- Invalid finish surfaces as a typed SDK error; example displays a concise status message.
- Room/corridor previews show closed polygon fill once 3 vertices exist.

### Selection And Editing

- Click committed feature to select.
- Selected feature shows orange outline and vertex handles.
- Drag vertex handle updates geometry live.
- Midpoint handles appear on selected edges; clicking one inserts a vertex.
- Vertex deletion is exposed through host API/control, not a map gesture.
- Drag selected feature body to move the whole feature.

### Levels

- Level selector is host-owned.
- Changing level filters committed map visuals.
- Active draft cannot silently migrate levels; example should cancel or reject active draft with visible status.
- `repeat_on` support is visual filtering only in Phase 2.

### Tags And Export

- Host-owned tag input/panel may be minimal.
- The example must show that `updateTags()` affects export.
- Export panel displays JSON in a scrollable monospace block.
- No save/publish/backend controls in Phase 2.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary draw room action | Draw room |
| Primary draw corridor action | Draw corridor |
| Primary POI action | Add POI |
| Finish action | Finish |
| Cancel action | Cancel |
| Delete feature action | Delete feature |
| Delete vertex action | Delete vertex |
| Empty export heading | No features yet |
| Empty export body | Draw a room, corridor, or POI to populate export JSON. |
| Invalid finish error | Add at least 3 points before finishing this polygon. |
| Missing level error | Select a level before drawing. |
| Destructive confirmation | Delete feature: remove this feature from the map and export? |

Rules:

- Copy should describe the immediate action, not explain the SDK architecture.
- Avoid visible instructional paragraphs in the map. Short status text is allowed.
- Do not mention keyboard shortcuts in Phase 2.

---

## Component Contract For Example

| Element | Required Behavior |
|---------|-------------------|
| Map | Occupies primary viewport, initializes Leaflet without requiring external app UI. |
| Draw controls | Host-owned buttons call SDK APIs. Active draw mode is visually distinguishable. |
| Finish/cancel controls | Enabled only when a draft exists. |
| Level select | Shows at least levels `0`, `1`, and `2`; current level drives creation and filtering. |
| Tag input | Minimal field for `name` or simple POI tags; no full schema editor. |
| Status line | Shows current mode, selected feature, and latest error/success. |
| Export panel | Shows current OsmInEdit-style JSON with `status: true`. |

Controls must not overlap Leaflet zoom controls at common desktop and mobile viewport sizes.

---

## Leaflet Layer Contract

| Layer Group | Z-Order Intent | Contents |
|-------------|----------------|----------|
| committed | Base editing overlay | committed rooms, corridors, POIs visible for current level |
| draft | Above committed | temporary vertices, line, polygon preview |
| selection | Above committed | selected feature outline |
| handles | Top editing layer | vertex handles and midpoint handles |

Requirements:

- All SDK-owned layers live under a dedicated Leaflet pane/group.
- `detach()` removes SDK layer groups and event listeners.
- Host apps should not need to reach into these groups for normal use.
- Minimal style overrides apply at the SDK option level, not by exposing internal Leaflet layers.

---

## Accessibility And Ergonomics

- Host example controls use native buttons/select/input elements.
- Buttons have visible focus states.
- Map-only gestures must have equivalent host API paths for destructive actions.
- Do not rely on color alone for selected state; selected outline width changes too.
- Touch targets in host panels should be at least 36px high.
- JSON panel should be keyboard focusable and scrollable.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed in Phase 2 |

No component registry dependencies should be introduced for the bare Leaflet example.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-12
