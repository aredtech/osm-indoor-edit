# Phase 6: Preset Catalog and Custom Draw Mode - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 adds an OsmInEdit-style preset layer to the headless SDK without turning the SDK into an application UI. It delivers a built-in preset catalog, host-extensible preset data, preset search/browse/matching helpers, form field schemas, tag helpers, and a custom preset-backed drawing mode that supports point, line, and polygon geometry.

The SDK owns preset data modeling, compatibility checks, tag transformations, editor integration, map drawing behavior, map editing visuals, and export-compatible primitives. Host applications still own preset picker UI, geometry-choice UI, forms, sidebars, save/publish policy, backend integration, and product workflow. Real OSM publishing, framework wrappers, backend storage, and floor plan calibration remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### Preset Catalog Scope

- **D-01:** Phase 6 should ship built-in indoor plus common OSM presets, not indoor-only presets. The built-in catalog should cover indoor structures as well as common amenities, shops, offices, and examples like motorcycle dealer.
- **D-02:** Built-in presets should be a curated normalized TypeScript/JSON snapshot derived from OsmInEdit/JOSM-style preset concepts. Do not parse XML preset files at runtime in the browser.
- **D-03:** Hosts should be able to extend or override built-in presets by preset ID. The SDK should be useful out of the box while allowing app-specific catalogs and corrections.
- **D-04:** Phase 6 should include bundled SVG icon assets for presets. Icons remain optional metadata/assets: the SDK may provide them, but host applications decide whether and how to render them.

### Custom Draw API Shape

- **D-05:** Add a general custom draw path rather than a separate preset-only drawing universe. The target shape is `startDraw("custom", { geometryType, tags, presetId })` or an equivalent API that keeps preset-backed drawing inside the existing draw model.
- **D-06:** Custom drawing must support point, line, and polygon geometry in Phase 6. These map to OsmInEdit-style node, way, and closed-way exports.
- **D-07:** The SDK should validate preset geometry compatibility. Starting a draw with a preset/geometry combination the preset does not allow should fail with a clear typed error rather than relying on host discipline.
- **D-08:** Finished preset-backed draws should create `custom` feature records with preset metadata. Exported OsmInEdit elements should carry the actual OSM tags; preset identity is SDK/host metadata, not a replacement for tags.

### Preset Fields and Forms

- **D-09:** The SDK should expose a typed field schema plus tag helpers for host-rendered forms. Hosts render the UI; the SDK describes fields and computes/apply tag changes.
- **D-10:** Phase 6 should support OsmInEdit core field types: text, number, combo/select, multi-select, checkbox/tri-state, textarea, and read-only/reference style fields.
- **D-11:** Field value application should use sparse tag updates. Empty or default optional values remove their tags, while hard preset tags stay protected.
- **D-12:** Preset fields should be returned as a flat ordered field list with optional group/section metadata. Simple host UIs can ignore grouping; richer UIs can render sections.

### Preset Matching and Preset Changes

- **D-13:** Preset matching should return ranked candidates with a best match, alternatives, scores, and reasons. Hosts can auto-pick or expose ambiguity.
- **D-14:** Matching should distinguish structural and functional presets. For example, a polygon can structurally be `indoor=room` while functionally matching `shop=motorcycle`.
- **D-15:** Changing a feature from one preset to another should remove old hard tags, apply new hard tags, and preserve non-conflicting user-entered fields.
- **D-16:** Preset matching/update APIs should be available as pure helpers plus editor convenience methods. Hosts can inspect diffs before applying, or use one-call editor behavior for common flows.

### The Agent's Discretion

The agent may choose exact type names, module boundaries, preset ID format, SVG packaging structure, matching score formula, field schema property names, and whether editor convenience methods wrap lower-level helper modules. Keep the locked outcome headless, typed, extensible, and compatible with current Leaflet and MapLibre drawing/editing behavior.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — Project boundary, core value, constraints, headless SDK responsibilities, host-owned UI boundary, and v1 exclusions.
- `.planning/REQUIREMENTS.md` — Existing requirement taxonomy and v1/v2 exclusions; Phase 6 requirement IDs are defined in the roadmap and should be reflected during planning.
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, planned split, dependencies, and roadmap status.
- `.planning/STATE.md` — Current project status and resume context.
- `docs/osm-indoor-prd.md` — Seed PRD defining OsmInEdit-style output, renderer targets, host-owned UI, and v1 scope boundaries.

### Prior Phase Decisions

- `.planning/phases/03-topology-relations-and-validation/03-CONTEXT.md` — Snapping, shared topology, import round-trip, validation, and the decision that unknown imported data becomes editable `custom` features.
- `.planning/phases/04-maplibre-parity-and-host-integration/04-CONTEXT.md` — Renderer-neutral core, MapLibre parity, host event surface, style/configuration boundaries, and adapter isolation.
- `.planning/phases/05-examples-docs-and-release-readiness/05-CONTEXT.md` — Host-owned example UI, docs boundary, validation/export policy, and release-readiness expectations.

### Code Integration Points

- `packages/core/src/drawing.ts` — Current `DrawKind`, draft drawing state, minimum tags, minimum point counts, and temporary geometry behavior to extend for custom point/line/polygon drawing.
- `packages/core/src/editor.ts` — Public editor facade, draw lifecycle, feature creation, events, snapping, tag update, import/export, and likely home for editor convenience methods.
- `packages/core/src/feature-store.ts` — Feature kinds, geometry types, custom feature inference, and imported feature rebuilding behavior.
- `packages/core/src/types.ts` — OSM-like tags and primitive types that preset helpers must preserve.
- `packages/core/src/import-export.ts` — OsmInEdit-style export/import behavior that preset-backed features must continue to satisfy.
- `packages/core/src/events.ts` — Typed event surface hosts use for external UI state.
- `examples/leaflet/src/main.ts` — Host-owned UI example to extend with a minimal preset picker/form proof.
- `examples/maplibre/src/main.ts` — Parallel host-owned UI example to keep MapLibre parity visible.

### OsmInEdit Reference Behavior

- `https://github.com/PanierAvide/OsmInEdit/blob/master/src/ctrl/PresetsManager.js` — OsmInEdit preset loading, search, browse, and feature matching reference.
- `https://github.com/PanierAvide/OsmInEdit/blob/master/public/presets/indoor.xml` — Indoor preset source concepts such as room, corridor, wall, door, stairs, elevator, furniture, field chunks, and geometry types.
- `https://github.com/PanierAvide/OsmInEdit/blob/master/src/view/PresetInputField.js` — OsmInEdit field rendering behavior to translate into headless field schemas rather than UI components.
- `https://github.com/PanierAvide/OsmInEdit/blob/master/src/view/GeometryTypeSelect.js` — OsmInEdit point/line/area selection concept that Phase 6 should expose as host-renderable geometry choices.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `IndoorEditor.startDraw` already owns the draw lifecycle, temporary visuals, snapping, draft vertex dragging, finish/cancel behavior, and event emission.
- `DrawKind` currently supports only `room`, `corridor`, and `poi`; this is the main public API extension point for custom preset-backed drawing.
- `GeometryType` already supports `point`, `line`, `polygon`, and `relation`, giving Phase 6 a natural vocabulary for allowed preset geometry.
- `FeatureStore` already rebuilds unknown imported ways and standalone points as `custom` feature records, which aligns with preset-backed custom features.
- Existing Leaflet and MapLibre adapters already render point/line/polygon editing visuals and should not need preset-specific UI behavior.

### Established Patterns

- Core remains renderer-neutral and framework-independent.
- Renderer packages translate adapter behavior; core must not import Leaflet or MapLibre.
- Host UI stays outside the SDK. Examples can show a small picker/form, but only as host code using SDK data.
- Validation and export are advisory/available operations; hosts decide save/publish policy.
- Public APIs return immutable snapshots/copies where practical.

### Integration Points

- Add a preset catalog module in core, with typed preset records, field schema records, search/browse helpers, matching helpers, and tag transformation helpers.
- Extend draw state/options so custom drawing can carry geometry type, tags, and preset metadata.
- Update editor finish logic so point, line, and polygon custom features create correct OSM-like primitives and export cleanly.
- Add typed errors for incompatible preset/geometry combinations.
- Add optional preset metadata to feature records or an adjacent metadata model without polluting OsmInEdit `elements`.
- Extend examples/docs with host-owned preset picker, geometry choice, form rendering, and custom draw flow.

</code_context>

<specifics>
## Specific Ideas

- The desired user-facing host flow is OsmInEdit-like: choose a preset such as motorcycle dealer, choose point or area if both are allowed, draw the feature, then render form fields such as second hand, name, operator, brand, sale, and rental from the SDK-provided schema.
- The SDK should provide the preset intelligence, not the visible preset UI.
- Structural and functional preset matching matters for indoor maps: `indoor=room` and `shop=*` can both describe the same feature from different angles.
- Bundled icons are allowed, but should remain optional assets rather than a forced UI kit.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 6-Preset Catalog and Custom Draw Mode*
*Context gathered: 2026-05-13*
