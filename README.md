# Osm Indoor Editing Library

Headless TypeScript editing behavior for OsmInEdit-style indoor maps. Host apps bring their own UI, save flow, backend, accounts, and publishing decisions; this library provides the map editing engine, renderer adapters, validation, events, and OsmInEdit-style JSON import/export.

## What it is

Osm Indoor Editing Library is a frontend SDK for applications that need indoor map editing behavior without adopting a fixed editor app. It lets a host application draw and edit rooms, corridors, POIs, shared geometry, levels, tags, and OSM-like primitives in Leaflet or MapLibre.

The primary v1 interchange format is OsmInEdit-style JSON:

```json
{
  "elements": [],
  "status": true
}
```

## Packages

- `@aredtech/osm-indoor-edit` - renderer-neutral editor state, drawing/editing APIs, import/export, validation, events, and adapter contracts.
- `@aredtech/osm-indoor-edit-leaflet` - Leaflet adapter for SDK-owned map editing visuals and pointer behavior.
- `@aredtech/osm-indoor-edit-maplibre` - MapLibre adapter for SDK-owned sources/layers, editing visuals, and pointer behavior.

## Quick start

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Run the examples

```sh
pnpm dev:leaflet
pnpm dev:maplibre
```

The examples are host-owned UI examples. Their buttons, forms, validation panel, export panel, level selector, snapping toggle, and sample loader live in `examples/*`; the SDK owns the map editing behavior and map editing visuals.

## SDK owns vs host owns

SDK owns map editing behavior: draw modes, map click capture, temporary geometry, committed editing visuals, vertex handles, snap indicators, primitive synchronization, validation results, events, and OsmInEdit-style import/export.

Host owns buttons, forms, sidebars, save/publish workflow, backend calls, user accounts, permissions, project UI, validation policy, and product styling.

See [docs/sdk-host-boundary.md](docs/sdk-host-boundary.md) for the full boundary.

## Documentation

- [SDK and host responsibilities](docs/sdk-host-boundary.md)
- [API recipes](docs/api-recipes.md) for `createEditor`, drawing, tags, validation, load/export, events, snapping, defaults, and `idStrategy`
- [Release readiness](docs/release.md)
- [Seed PRD](docs/osm-indoor-prd.md)

## v1 boundaries

v1 does not include backend storage, real OpenStreetMap OAuth/changesets/upload, framework wrappers, additional renderers beyond Leaflet and MapLibre, or floor-plan calibration metadata inside OsmInEdit `elements`.
