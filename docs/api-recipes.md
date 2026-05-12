# API recipes

These recipes use the public TypeScript API directly. Host applications own the UI; the SDK owns map editing behavior and map editing visuals.

## Create an editor

```ts
import { createEditor } from "@osminedit-lib/core";

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
import { createEditor } from "@osminedit-lib/core";
import { createLeafletAdapter } from "@osminedit-lib/leaflet";

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
import { createEditor } from "@osminedit-lib/core";
import { createMapLibreAdapter } from "@osminedit-lib/maplibre";

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

## Validate

```ts
const result = editor.validate();

for (const issue of result.issues) {
  console.log(issue.severity, issue.ruleId, issue.message);
}
```

## Load OsmInEdit JSON

```ts
import type { OsmInEditExport } from "@osminedit-lib/core";

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
