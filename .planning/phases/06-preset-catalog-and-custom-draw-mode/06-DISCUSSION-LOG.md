# Phase 6: Preset Catalog and Custom Draw Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 6-Preset Catalog and Custom Draw Mode
**Areas discussed:** Preset Catalog Scope, Custom Draw API Shape, Preset Fields and Forms, Preset Matching and Preset Changes

---

## Preset Catalog Scope

### Built-In Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Indoor + common presets | Include indoor structure presets plus common OSM amenities, shops, and offices so examples like motorcycle dealer work. | yes |
| Indoor only | Focus only on rooms, corridors, doors, stairs, elevators, walls, and core indoor mapping. | |
| Minimal seed | Ship a tiny starter catalog and design the API around host-provided catalogs. | |

**User's choice:** Indoor + common presets  
**Notes:** User specifically referenced OsmInEdit's motorcycle dealer flow, so common OSM presets matter.

### Built-In Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Curated normalized snapshot | Ship a typed JSON/TS preset catalog derived from OsmInEdit/JOSM-style presets, trimmed for browser SDK use and easier to test. | yes |
| Runtime XML parser | Load OsmInEdit/JOSM XML-style preset files and parse them in the browser. | |
| Host-only catalogs | SDK ships APIs and types, while serious catalogs are supplied by the host. | |

**User's choice:** Curated normalized snapshot  
**Notes:** Avoid runtime XML parsing in browser code.

### Host Catalog Extension

| Option | Description | Selected |
|--------|-------------|----------|
| Extend or override built-ins | SDK ships built-ins, and hosts can add or replace presets by ID for app-specific needs. | yes |
| Separate catalogs only | Built-ins and host presets stay separate; host decides which catalog to search/display. | |
| Built-ins only for Phase 6 | Keep custom host catalogs out until the built-in model is stable. | |

**User's choice:** Extend or override built-ins by preset ID  
**Notes:** Preserves out-of-box usefulness and host control.

### Preset Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Icon names only | Expose stable icon identifiers or category names; host provides assets. | |
| No icons | Presets expose labels, tags, geometry, and fields only. | |
| Bundled SVG icons | SDK ships actual icon assets for presets. | yes |

**User's choice:** Bundled SVG icon assets  
**Notes:** Icons should remain optional assets, not SDK-owned UI.

---

## Custom Draw API Shape

### API Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| General custom draw API | `startDraw("custom", { geometryType, tags, presetId })`, a richer version of the existing draw model. | yes |
| Dedicated preset API | `startDrawFromPreset(presetId, { geometryType })`, ergonomic but separate. | |
| Host computes tags only | Host uses preset helpers, then calls existing draw APIs where possible. | |

**User's choice:** General custom draw API  
**Notes:** Keep preset-backed drawing inside the existing editor model.

### Geometry Support

| Option | Description | Selected |
|--------|-------------|----------|
| Point, line, polygon | Covers OsmInEdit point/line/area choices and maps to node/way/closed-way export. | yes |
| Point and polygon only | Covers many POIs/areas but misses walls, steps, and footways. | |
| Polygon first only | Smallest implementation but does not match the point-or-area pattern. | |

**User's choice:** Point, line, and polygon  
**Notes:** Required for OsmInEdit-like preset geometry choices.

### Geometry Compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Validate allowed geometry | SDK refuses incompatible preset/geometry combinations. | yes |
| Warn but allow | SDK warns but lets hosts force unusual combinations. | |
| Host responsibility only | SDK exposes allowed geometry, but `startDraw` accepts anything. | |

**User's choice:** Validate allowed geometry  
**Notes:** Use clear typed errors for incompatible combinations.

### Finished Feature Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Create `custom` feature with preset metadata | Feature kind stays `custom`; tags and metadata carry the meaning. | yes |
| Infer feature kind from tags | Tags like `shop=*` or `amenity=*` become feature kinds. | |
| Preset ID becomes feature kind | Feature kind follows preset identity. | |

**User's choice:** Create `custom` feature with preset metadata  
**Notes:** Export should rely on OSM tags, not preset IDs.

---

## Preset Fields and Forms

### Form Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Typed field schema + tag helpers | SDK returns fields, labels, options, input kind, tag keys, defaults, plus helpers to apply/clear values. | yes |
| Field schema only | Host renders forms and writes all tag logic itself. | |
| Tag helpers only | SDK helps with tags, but does not describe form fields deeply. | |

**User's choice:** Typed field schema plus tag helpers  
**Notes:** SDK provides the form intelligence; host renders the actual UI.

### Field Types

| Option | Description | Selected |
|--------|-------------|----------|
| OsmInEdit core field types | Text, number, combo/select, multi-select, checkbox/tri-state, textarea, and read-only/reference fields. | yes |
| Simple fields only | Text, select, checkbox. | |
| Extensible arbitrary fields | Catalogs define any field type string and hosts interpret everything. | |

**User's choice:** OsmInEdit core field types  
**Notes:** Needed for richer fields like `second_hand=yes/no/only`.

### Tag Application

| Option | Description | Selected |
|--------|-------------|----------|
| Sparse tag updates | Empty/default values remove optional tags; hard preset tags stay protected. | yes |
| Keep empty tags | Empty fields become empty-string tags in export. | |
| Host decides everything | SDK suggests changes but host applies/removes tags manually. | |

**User's choice:** Sparse tag updates  
**Notes:** Avoid empty-string tags in OsmInEdit-style output.

### Field Grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Flat fields with group metadata | Ordered field list plus optional section/group labels. | yes |
| Strict grouped sections | SDK returns nested groups and hosts must render sections. | |
| Flat fields only | No group or section metadata in Phase 6. | |

**User's choice:** Flat ordered fields with optional group metadata  
**Notes:** Simple UIs can ignore groups; richer UIs can use them.

---

## Preset Matching and Preset Changes

### Match Results

| Option | Description | Selected |
|--------|-------------|----------|
| Ranked candidates | Return best match plus alternatives with scores and reasons. | yes |
| Single best match only | Simpler API but hides ambiguity. | |
| Exact matches only | Fewer surprises, less helpful matching. | |

**User's choice:** Ranked candidates  
**Notes:** Hosts can auto-pick or expose choices.

### Structural vs Functional Matching

| Option | Description | Selected |
|--------|-------------|----------|
| Structural + functional matches | Return separate structural and functional matches, mirroring OsmInEdit's useful split. | yes |
| One combined match | Pick one preset that best describes the whole feature. | |
| Functional only | Treat indoor structure as normal tags and only match the business/amenity preset. | |

**User's choice:** Structural and functional matches  
**Notes:** Important for room plus shop/amenity style indoor mapping.

### Preset Change Tags

| Option | Description | Selected |
|--------|-------------|----------|
| Remove old hard tags, preserve user fields | Remove previous hard tags, apply new hard tags, preserve non-conflicting user tags. | yes |
| Only add new hard tags | Safer for preservation but leaves stale tags. | |
| Replace all preset-managed tags | Cleanest switch but can remove expected values. | |

**User's choice:** Remove old hard tags, preserve user fields  
**Notes:** Prevent stale preset identity while protecting user-entered data.

### Mutation Model

| Option | Description | Selected |
|--------|-------------|----------|
| Pure helpers plus editor convenience | Helpers compute diffs; editor methods can apply them when desired. | yes |
| Pure helpers only | Host always applies updates through existing tag APIs. | |
| Editor methods only | SDK hides the diff and mutates features directly. | |

**User's choice:** Pure helpers plus editor convenience  
**Notes:** Hosts can inspect diffs or use one-call behavior.

---

## The Agent's Discretion

- Exact type names, module boundaries, preset ID format, SVG packaging, matching score formula, field schema property names, and editor convenience method names.

## Deferred Ideas

- None.
