# @aredtech/osm-indoor-edit-leaflet

Leaflet renderer adapter for `@aredtech/osm-indoor-edit`.

This package connects the headless Osm Indoor editing core to a Leaflet map. It handles SDK-owned map editing behavior and editing visuals while your application keeps ownership of UI, save flows, backend integration, and publishing decisions.

## Install

```sh
npm install @aredtech/osm-indoor-edit @aredtech/osm-indoor-edit-leaflet leaflet
```

`leaflet` is a peer dependency.

## Basic usage

```ts
import L from "leaflet";
import { createEditor } from "@aredtech/osm-indoor-edit";
import { createLeafletAdapter } from "@aredtech/osm-indoor-edit-leaflet";

const map = L.map("map").setView([0, 0], 19);

const adapter = createLeafletAdapter({ map });
const editor = createEditor({ adapter });

editor.startDrawing("area");
editor.setActiveLevel("1");
```

## What this adapter provides

- Leaflet map click and drag handling for editor operations
- Temporary drawing geometry
- Committed feature layers
- Vertex handles for geometry editing
- Level-aware visibility updates
- Style translation from SDK feature records to Leaflet layers

## Package pairing

Use this package with:

- `@aredtech/osm-indoor-edit` for the editor core
- `leaflet` for the map renderer

For MapLibre projects, use `@aredtech/osm-indoor-edit-maplibre` instead.

## Repository

https://github.com/aredtech/osm-indoor-edit
