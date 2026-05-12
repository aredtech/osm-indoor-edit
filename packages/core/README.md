# @aredtech/osm-indoor-edit

Renderer-neutral TypeScript editing engine for OsmInEdit-style indoor maps.

This package contains the headless core SDK: editor state, drawing and editing APIs, OSM-like primitives, level-aware features, validation, events, snapping, import/export, and renderer adapter contracts. It does not depend on Leaflet, MapLibre, React, Vue, Angular, or any host application UI.

## Install

```sh
npm install @aredtech/osm-indoor-edit
```

## Basic usage

```ts
import { createEditor, createFakeAdapter } from "@aredtech/osm-indoor-edit";

const editor = createEditor({
  adapter: createFakeAdapter(),
});

editor.startDrawing("area");
editor.setActiveLevel("1");

const exported = editor.exportOsmInEdit();
```

In a real map application, use one of the renderer adapters:

```sh
npm install @aredtech/osm-indoor-edit-leaflet leaflet
npm install @aredtech/osm-indoor-edit-maplibre maplibre-gl
```

## What this package owns

- Editor lifecycle and state
- Draw/edit operations
- Level-aware indoor features
- OSM-like node, way, and relation primitives
- OsmInEdit-style JSON import/export
- Built-in validation and pluggable validation hooks
- Event emission for host-owned UI
- Renderer adapter contracts

## What the host application owns

The host owns buttons, forms, sidebars, save/publish workflow, backend calls, user accounts, permissions, product UI, and validation policy decisions.

## Packages

- `@aredtech/osm-indoor-edit` - core editing engine
- `@aredtech/osm-indoor-edit-leaflet` - Leaflet adapter
- `@aredtech/osm-indoor-edit-maplibre` - MapLibre adapter

## Repository

https://github.com/aredtech/osm-indoor-edit
