# Phase 6: Preset Catalog and Custom Draw Mode - Research

**Date:** 2026-05-13
**Status:** Research complete

## Research Goal

Answer: what do we need to know to plan Phase 6 well?

Phase 6 adds an OsmInEdit-style preset layer while preserving the SDK's headless boundary. The plan must cover a typed preset catalog, host extension/override, search/browse/matching helpers, field schemas and tag helpers, bundled SVG preset assets, custom point/line/polygon drawing, editor convenience methods, docs, and example proof.

## Source Findings

### OsmInEdit Preset Mechanics

OsmInEdit's `PresetsManager` loads two preset files, `indoor.xml` and `default.xml`, parses XML with `xml2js`, simplifies the raw structure, resolves references/chunks into usable entries, merges catalogs, and builds a Fuse search index. Its search weights preset name higher than tag key/value tokens, which is a good conceptual model for our `searchPresets(query)` helper.

Important mechanics to model, not copy directly:

- Presets are grouped and browsable by path.
- Items have display metadata, hard tags, tag match semantics, allowed geometry types, optional fields, and icons.
- Chunks/references are reusable field fragments; our runtime should ship pre-normalized data instead of parsing XML.
- Matching checks preset hard tags against feature tags. `match="key"` means key presence can be enough; `match="none"` means a tag can support preset form fields without being required for matching.
- OsmInEdit keeps structural indoor presets distinguishable with `indoor_structure`, which maps cleanly to the Phase 6 structural/functional matching decision.

Primary references:

- `https://github.com/PanierAvide/OsmInEdit/blob/master/src/ctrl/PresetsManager.js`
- `https://github.com/PanierAvide/OsmInEdit/blob/master/public/presets/indoor.xml`
- `https://github.com/PanierAvide/OsmInEdit/blob/master/public/presets/default.xml`

### Indoor Preset Coverage

`indoor.xml` gives a compact seed for indoor structure presets:

- `Room`: closed way, `indoor=room`, fields for room type, name/ref, access.
- `Area`: closed way, `indoor=area`.
- `Wall`: way or closed way, `indoor=wall`, optional `area` check.
- `Door`: node, `door=yes` with key-match semantics, door type, entrance type, width, automatic door, wheelchair.
- `Corridor`: closed way, `indoor=corridor`.
- `Staircase`: closed way, `indoor=room`, `room=stairs`.
- `Stairs`: way, `highway=steps`, multi-level, name, incline/conveying.
- `Elevator`: closed way, `highway=elevator`, form support for `indoor=room` and `room=elevator` without making those required hard matches.
- `Footway`, `Service road`, `Level connection`, and furniture presets such as table, chair, shelf.

This supports Plan 06-01 as a curated normalized data slice without needing a large catalog immediately.

### Common Preset Coverage

`default.xml` is large and includes shops, amenities, offices, craft, barriers, highways, transport, and shared chunks such as name/operator/opening-hours/wheelchair/payment/contact/address. It includes motorcycle-specific concepts such as `motorcycle_brands` and shop entries using `type="node,closedway"`, which matches the desired "choose point or area" flow.

Planning implication: Phase 6 should not import all of `default.xml` wholesale. It should create a curated common subset sufficient for the promised flows:

- Shops: motorcycle dealer and a small representative set of retail presets.
- Amenities: a small useful indoor subset.
- Offices: representative office presets.
- Shared field chunks: name, ref, operator, brand, opening hours, wheelchair, access, contact/address/payment placeholders where appropriate.

This keeps package size and maintenance sane while proving the extension mechanism for broader catalogs.

## Codebase Findings

### Current Draw Model

`packages/core/src/drawing.ts` defines:

- `DrawKind = "room" | "corridor" | "poi"`
- `StartDrawOptions` with only `tags`
- `DraftDrawingState` with `kind`, `level`, `tags`, `coordinates`, `nodeIds`
- temporary geometry behavior that hard-codes POI as point and other draw kinds as line-until-polygon.

`packages/core/src/editor.ts` currently:

- starts drawing with `startDraw(kind, options)`
- requires a current level
- creates minimum tags from draw kind and level
- finishes POI through `finishPointDrawing`
- finishes room/corridor through `finishWayDrawing`, always creating closed ways
- emits `toolChanged`, `drawingStarted`, `drawingUpdated`, `drawingFinished`, and `featureCreated`
- routes snapping and draft vertex dragging through renderer-neutral core logic.

Planning implication: custom drawing needs to add geometry type to draft state rather than branch only on `kind === "poi"`. Existing draft rendering and adapter APIs already support `TemporaryGeometry.geometryType: "point" | "line" | "polygon"`.

### Current Feature Model

`packages/core/src/feature-store.ts` already defines:

- `FeatureKind` includes `custom`.
- `GeometryType = "point" | "line" | "polygon" | "relation"`.
- imported unknown ways and standalone tagged points become editable `custom` feature records.

Planning implication: preset-backed features should stay `kind: "custom"` and add optional preset metadata without changing OsmInEdit element shape. A conservative approach is to add optional metadata to `FeatureRecord`, such as:

```ts
preset?: {
  id: string;
  structuralPresetId?: string;
  functionalPresetId?: string;
}
```

If implementation finds this too invasive, an adjacent internal metadata map is acceptable, but editor state snapshots should expose enough for hosts to know which preset drove the feature.

### Current Tag Update Semantics

`updateTags(featureId, tags)` merges tags into the existing record and primitives. It cannot remove tags because no deletion sentinel exists. Sparse preset fields require a new helper/editor path that can produce full replacement tags or a patch format with removals.

Planning implication: Phase 6 should introduce pure helpers that return explicit tag diffs:

```ts
interface TagDiff {
  set: Tags;
  unset: string[];
  protectedKeys?: string[];
}
```

Editor convenience can apply the diff through a new method such as `applyPresetTagDiff(featureId, diff)` or `updateFeaturePreset(featureId, presetId)`. Existing `updateTags` can remain merge-only for backward compatibility.

### Renderer Adapters

`RendererAdapter` and existing Leaflet/MapLibre adapters already support point, line, polygon temporary geometry, committed feature rendering, vertex handles, draft vertex dragging, snapping, and level filtering. Preset-specific UI does not belong in adapters.

Planning implication: Phase 6 should modify adapter packages only if tests reveal renderer rendering assumptions around custom lines or points. Most work belongs in core plus examples/docs.

## Recommended API Shape

### Preset Types

Add a core preset module exported from `packages/core/src/index.ts`:

```ts
export type PresetGeometryType = "point" | "line" | "polygon";
export type PresetRole = "structural" | "functional";
export type PresetFieldType =
  | "text"
  | "number"
  | "combo"
  | "multiselect"
  | "check"
  | "textarea"
  | "reference";

export interface PresetFieldOption {
  value: string;
  label?: string;
  description?: string;
}

export interface PresetField {
  id: string;
  key?: string;
  type: PresetFieldType;
  label: string;
  group?: string;
  options?: PresetFieldOption[];
  defaultValue?: string | string[] | boolean;
}

export interface PresetDefinition {
  id: string;
  name: string;
  groupPath: string[];
  role: PresetRole;
  icon?: string;
  iconAsset?: string;
  geometry: PresetGeometryType[];
  tags: Tags;
  match?: Record<string, "keyvalue" | "key" | "none">;
  fields: PresetField[];
}
```

Use `geometry` names that match core `GeometryType` for direct integration; map OsmInEdit `node`, `way`, `closedway` during data normalization.

### Catalog Helpers

Recommended helpers:

- `createPresetCatalog(options?: { presets?: PresetDefinition[]; overrides?: PresetDefinition[] })`
- `listPresets()`
- `browsePresets(path?: string[])`
- `searchPresets(query: string, options?: { geometry?: PresetGeometryType; role?: PresetRole })`
- `getPreset(id: string)`
- `getPresetGeometryOptions(presetId: string)`
- `matchPresets(tags: Tags, geometryType?: PresetGeometryType)`
- `buildPresetTags(presetId: string, values?: Record<string, unknown>)`
- `applyPresetFieldValues(preset, currentTags, values)`
- `createPresetChangeDiff(fromPresetId, toPresetId, currentTags)`

### Editor Convenience

Recommended editor-facing API:

- Extend `DrawKind` to include `"custom"`.
- Extend `StartDrawOptions` to include:
  - `geometryType?: "point" | "line" | "polygon"`
  - `presetId?: string`
  - `presetCatalog?: PresetCatalog` only if needed, but prefer editor-level preset catalog config to avoid passing catalog on every draw.
- Add `presets?: PresetCatalogOptions` to `EditorOptions`.
- Add convenience methods:
  - `getPresetCatalog()`
  - `matchFeaturePresets(featureId)`
  - `changeFeaturePreset(featureId, nextPresetId, options?)`
  - `applyPresetFieldValues(featureId, presetId, values)`

Planning should leave exact names flexible, but every plan should preserve pure helper functions for hosts that do not want editor mutation.

## Data Scope Recommendation

Ship a curated built-in catalog, not full XML parity:

### Indoor structure presets

Include at least:

- Room
- Area
- Wall
- Door
- Corridor
- Staircase
- Stairs
- Elevator
- Footway
- Service road
- Level connection
- Table
- Chair
- Shelf

### Common functional presets

Include enough to prove Phase 6 requirements:

- Motorcycle dealer: `shop=motorcycle`, allowed `point` and `polygon`, fields for name, operator, brand/motorcycle brand, second hand, sales, rental, opening hours, wheelchair.
- A few representative `shop=*`, `amenity=*`, and `office=*` entries.
- Shared chunks for name, ref, operator, brand, opening hours, wheelchair, access, contact/address/payment placeholder field groups.

Do not attempt complete JOSM/default preset parity in Phase 6. Host extension/override by ID is the escape hatch.

## Validation Architecture

Phase 6 needs both data-model tests and integration behavior tests.

### Unit Test Targets

- Built-in catalog lists indoor plus common presets.
- `searchPresets("motorcycle")` returns the motorcycle dealer preset.
- Preset lookup exposes name, group path, icon asset, hard tags, allowed geometry, field schema, and role.
- Host overrides replace built-in presets with the same ID.
- Host extensions add new presets without mutating built-ins.
- Geometry compatibility rejects incompatible preset/draw combinations.
- Field helpers use sparse updates: empty optional values remove tags; hard tags stay protected.
- Matching returns ranked candidates with scores and reasons.
- Matching separates structural and functional matches for tags like `{ indoor: "room", shop: "motorcycle" }`.
- Preset change diffs remove old hard tags, add new hard tags, and preserve non-conflicting tags.

### Editor Integration Tests

- `startDraw("custom", { geometryType: "point", presetId, tags })` creates a point feature backed by a node with preset tags and level.
- `startDraw("custom", { geometryType: "line", presetId, tags })` creates an open way and exports without repeated first node.
- `startDraw("custom", { geometryType: "polygon", presetId, tags })` creates a closed way and exports with repeated first node.
- Draft preview for custom line remains line after two or more points, while custom polygon closes only at finish/preview rules.
- Invalid geometry for preset throws a typed error and does not mutate primitives.
- Preset metadata appears in feature state but not in exported OsmInEdit `elements`.
- `changeFeaturePreset` and field value application update primitive tags and emit `tagsUpdated`/`featureUpdated`.

### Example/E2E Tests

- Leaflet example has host-owned preset picker/form controls and can draw a motorcycle dealer area.
- MapLibre example has the same host-owned preset picker/form controls.
- Export panel contains `shop: "motorcycle"` and host-edited field tags after custom draw.
- Existing room/corridor/POI flows still work.

## Risk Notes

- `updateTags` currently cannot remove tags. Do not fake sparse updates by assigning empty strings.
- Full `default.xml` parity would explode scope and bundle size. Keep Phase 6 curated.
- SVG icon bundling can disturb package `files` and `exports`; plan must include package build checks and npm files sanity.
- Matching can be overfit. Keep scores simple and explainable: hard tag matches, key-only matches, geometry compatibility, and role.
- Do not let examples imply SDK-owned UI. All picker/form UI should live in example host code.
- Do not mix preset metadata into OsmInEdit export elements.

## Recommended Plan Split

### 06-01: Preset catalog model, built-in data, and search/matching helpers

Core preset types, curated data, icon assets, catalog creation/override, browse/list/search, match helpers, and tag diff helpers.

### 06-02: Custom draw mode and preset-backed feature creation

Draw model extension for `custom`, point/line/polygon finish behavior, geometry compatibility, preset metadata, editor convenience methods, and core tests.

### 06-03: Preset field schema APIs, docs, and examples

Field schema/tag helper polish, public docs/API recipes, Leaflet and MapLibre example host UI, e2e proof, and release checks.

## RESEARCH COMPLETE

Research found a clear path: build normalized, curated preset intelligence in core first; then extend drawing to custom geometry; then prove host-owned preset UI through docs and examples. Planning should avoid runtime XML parsing, full default preset parity, adapter-specific preset behavior, and SDK-owned forms.
