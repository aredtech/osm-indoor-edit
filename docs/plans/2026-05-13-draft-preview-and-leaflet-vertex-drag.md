# Draft Preview and Leaflet Vertex Drag Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add OsmInEdit-style cursor preview lines while drawing and make Leaflet vertex handles draggable after placement.

**Architecture:** The core editor owns draft drawing state and should render non-committed cursor preview geometry from adapter `pointerMove` events. Renderer adapters own visuals: Leaflet and MapLibre render preview lines as dashed draft geometry, while Leaflet handles vertex drag with `mousedown` on handles plus map `mousemove`/`mouseup`.

**Tech Stack:** TypeScript, Vitest, happy-dom, Leaflet adapter, MapLibre adapter.

---

### Task 1: Core Draft Cursor Preview

**Files:**
- Modify: `packages/core/src/adapter.ts`
- Modify: `packages/core/src/drawing.ts`
- Modify: `packages/core/src/editor.ts`
- Test: `packages/core/test/editor-editing.test.ts`

**Steps:**
1. Write a failing core test that clicks one room vertex, moves the pointer, and expects the latest `showTemporaryFeature` geometry to include preview coordinates from the last placed point to the cursor.
2. Extend `TemporaryGeometry` with optional `previewCoordinates`.
3. Let `buildTemporaryGeometry` accept an optional preview coordinate and produce:
   - `[last, preview]` while fewer than three polygon points exist.
   - `[last, preview, first]` once a polygon can close.
4. Subscribe editor core to adapter `pointerMove` and re-render draft geometry without mutating draft coordinates.
5. Run the focused core test.

### Task 2: Adapter Preview Rendering

**Files:**
- Modify: `packages/leaflet/src/leaflet-adapter.ts`
- Modify: `packages/maplibre/src/maplibre-adapter.ts`
- Test: `packages/leaflet/test/leaflet-drawing.test.ts`
- Test: `packages/maplibre/test/maplibre-adapter.test.ts`

**Steps:**
1. Write failing adapter tests for `previewCoordinates`.
2. Render preview coordinates as a dashed draft polyline in Leaflet.
3. Add a `draft-preview-line` GeoJSON feature in MapLibre and style it with line dash array.
4. Run focused adapter tests.

### Task 3: Leaflet Vertex Dragging

**Files:**
- Modify: `packages/leaflet/src/leaflet-adapter.ts`
- Test: `packages/leaflet/test/leaflet-editing.test.ts`

**Steps:**
1. Write a failing Leaflet test that starts a vertex drag through handle `mousedown`, map `mousemove`, and map `mouseup`.
2. Track active vertex drag state in the Leaflet adapter.
3. Disable map dragging during a vertex drag when available.
4. Emit `vertexDrag` on map movement and clear drag state on mouseup.
5. Run focused Leaflet editing tests.

### Task 4: Verification and Commit

**Steps:**
1. Run `pnpm test -- packages/core/test/editor-editing.test.ts packages/leaflet/test/leaflet-drawing.test.ts packages/leaflet/test/leaflet-editing.test.ts packages/maplibre/test/maplibre-adapter.test.ts`.
2. Run `pnpm typecheck`.
3. Run `pnpm build`.
4. Commit and push the completed change.
