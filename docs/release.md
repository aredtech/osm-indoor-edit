# Release readiness

This repository supports a dry-run release gate for local and CI confidence. It verifies package builds, type declarations, unit tests, example builds, browser smoke tests, and the renderer/core dependency boundary.

## Dry-run gate

Run:

```sh
pnpm release:dry-run
```

The gate runs:

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm build:examples
pnpm test:e2e:leaflet
pnpm test:e2e:maplibre
pnpm check:core-boundary
```

## Manual publish boundary

The dry-run gate is intentionally verification-only. It does not upload packages or create registry releases.

actual npm publish is manual. A human should review package metadata, changelog/release notes, generated `dist` output, and registry credentials before any package upload.

## Package checklist

- `@osminedit-lib/core`, `@osminedit-lib/leaflet`, and `@osminedit-lib/maplibre` expose `main`, `types`, `exports`, `files`, and `sideEffects`.
- `@osminedit-lib/core` has no Leaflet or MapLibre runtime dependency.
- `@osminedit-lib/leaflet` keeps `leaflet` as a peer dependency.
- `@osminedit-lib/maplibre` keeps `maplibre-gl` as a peer dependency.
- Example packages remain private and are not release targets.

## Commands

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm build:examples
pnpm test:e2e
pnpm check:core-boundary
pnpm release:dry-run
```
