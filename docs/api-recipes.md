# API recipes

These recipes use the public TypeScript API directly. Host applications own the UI; the SDK owns map editing behavior and map editing visuals.

## Create an editor

```ts
import { createEditor } from "@aredtech/osm-indoor-edit";

const editor = createEditor({
  defaultLevel: "0"
});

editor.on("ready", () => {
  console.log("Editor ready");
});
```

## Attach Leaflet

```ts
import * as L from "leaflet";
import { createEditor } from "@aredtech/osm-indoor-edit";
import { createLeafletAdapter } from "@aredtech/osm-indoor-edit-leaflet";

const map = L.map("map", {
  center: [57.7089, 11.9746],
  zoom: 19,
  attributionControl: false
});

const adapter = createLeafletAdapter();
const editor = createEditor({
  adapter,
  target: map,
  defaultLevel: "0"
});
```

## Attach MapLibre

```ts
import maplibregl from "maplibre-gl";
import { createEditor } from "@aredtech/osm-indoor-edit";
import { createMapLibreAdapter } from "@aredtech/osm-indoor-edit-maplibre";

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": "#E8EEF5" } }]
  },
  center: [11.9746, 57.7089],
  zoom: 19,
  attributionControl: false
});

map.on("load", () => {
  const editor = createEditor({
    adapter: createMapLibreAdapter(),
    target: map,
    defaultLevel: "0"
  });
});
```

## Draw indoor features

```ts
editor.setLevel("0");

editor.startDraw("room");
// User clicks the map. The adapter forwards those clicks to the editor.
const room = editor.finishDraw();

editor.startDraw("corridor");
editor.cancelDraw();

editor.startDraw("poi", {
  tags: { amenity: "drinking_water", name: "Water point" }
});
```

## Edit tags

```ts
const selectedFeatureId = room.id;

editor.updateTags(selectedFeatureId, {
  name: "Room 101",
  level: "0",
  indoor: "room"
});
```

## Browse and search presets

```ts
import { createPresetCatalog } from "@aredtech/osm-indoor-edit";

const catalog = createPresetCatalog();

const indoorChoices = catalog.browsePresets(["Building structure"]);
const shopChoices = catalog.browsePresets(["Shops"]);
const vehicleShopChoices = catalog.browsePresets(["Shops", "Vehicles"]);
const motorcycleResults = catalog.searchPresets("motorcycle", { geometry: "polygon" });
const motorcycle = catalog.getPreset("shop-motorcycle");
const geometryChoices = catalog.getPresetGeometryOptions("shop-motorcycle");

console.log(indoorChoices.length, shopChoices.length, vehicleShopChoices.length);
console.log(motorcycleResults[0]?.name, motorcycle?.iconSvg, geometryChoices);
```

The built-in catalog includes curated OsmInEdit-style top-level groups for `Building structure`, `Furniture`, `Barriers`, `Transport`, `Facilities`, `Sports`, `Man Made`, `Shops`, `Offices`, and `Craft`. Use `listPresets()` to derive category menus, then pass the selected `groupPath` into `browsePresets()`.

## Draw a preset-backed feature

```ts
import { buildPresetTags } from "@aredtech/osm-indoor-edit";

const preset = editor.getPresetCatalog().getPreset("shop-motorcycle");
if (!preset) {
  throw new Error("Preset missing");
}

editor.startDraw("custom", {
  geometryType: "polygon",
  presetId: "shop-motorcycle",
  tags: buildPresetTags(preset)
});
```

## Render a host-owned preset form

```ts
const preset = editor.getPresetCatalog().getPreset("shop-motorcycle");

for (const field of preset?.fields ?? []) {
  // Host app renders its own input/select/textarea from the SDK field schema.
  console.log(field.label, field.type, field.key, field.options);
}
```

## Apply preset field values

```ts
const updated = editor.applyPresetFieldValues(feature.id, "shop-motorcycle", {
  name: "Ared Bikes",
  operator: "Ared",
  second_hand: "only",
  "service-motorcycle-sales": "yes"
});

console.log(updated.tags.shop); // motorcycle
```

## Match existing tags to presets

```ts
const matches = editor.matchFeaturePresets(feature.id);

console.log(matches.structural[0]?.preset.id);
console.log(matches.functional[0]?.preset.id);
```

## Change a feature preset

```ts
const changed = editor.changeFeaturePreset(feature.id, "amenity-cafe");

console.log(changed.tags.amenity); // cafe
```

## Validate

```ts
const result = editor.validate();

for (const issue of result.issues) {
  console.log(issue.severity, issue.ruleId, issue.message);
}
```

## Load OsmInEdit JSON

```ts
import type { OsmInEditExport } from "@aredtech/osm-indoor-edit";

const data: OsmInEditExport = {
  elements: [],
  status: true
};

editor.loadOsmInEdit(data);
```

## Export OsmInEdit JSON

```ts
const exported = editor.exportOsmInEdit();

await fetch("/api/indoor-map", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(exported)
});
```

## Subscribe to events

```ts
const unsubscribe = editor.on("validationChanged", (event) => {
  console.log(event.valid, event.issues.length);
});

editor.on("featureSelected", (event) => {
  console.log("Selected feature", event.featureId);
});

editor.on("exportReady", (event) => {
  console.log("Elements ready", event.elements.length);
});

unsubscribe();
```

## Configure snapping and defaults

```ts
const editor = createEditor({
  defaultLevel: "0",
  defaultTags: {
    room: { source: "survey" },
    corridor: { source: "survey" },
    poi: { source: "survey" }
  },
  idStrategy: {
    start: 1000000000000000
  },
  snapping: {
    enabled: true,
    tolerancePx: 12
  }
});

editor.setSnapping({ enabled: false });
editor.setSnapping({ enabled: true, tolerancePx: 16 });
```
