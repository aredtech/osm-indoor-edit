# @aredtech/osm-indoor-edit-maplibre

MapLibre GL JS renderer adapter for `@aredtech/osm-indoor-edit`.

This package connects the headless Osm Indoor editing core to a MapLibre map. It handles SDK-owned sources, layers, pointer behavior, and editing visuals while your application keeps ownership of UI, save flows, backend integration, and publishing decisions.

## Install

```sh
npm install @aredtech/osm-indoor-edit @aredtech/osm-indoor-edit-maplibre maplibre-gl
```

`maplibre-gl` is a peer dependency.

## Basic usage

```ts
import maplibregl from "maplibre-gl";
import { createEditor } from "@aredtech/osm-indoor-edit";
import { createMapLibreAdapter } from "@aredtech/osm-indoor-edit-maplibre";

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [0, 0],
  zoom: 19,
});

const adapter = createMapLibreAdapter({ map });
const editor = createEditor({ adapter });

editor.startDrawing("area");
editor.setActiveLevel("1");
```

## What this adapter provides

- MapLibre pointer handling for editor operations
- GeoJSON sources for temporary and committed editing geometry
- SDK-owned editing layers and handles
- Level-aware visibility updates
- Style translation from SDK feature records to MapLibre source data

## Package pairing

Use this package with:

- `@aredtech/osm-indoor-edit` for the editor core
- `maplibre-gl` for the map renderer

For Leaflet projects, use `@aredtech/osm-indoor-edit-leaflet` instead.

## Repository

https://github.com/aredtech/osm-indoor-edit
