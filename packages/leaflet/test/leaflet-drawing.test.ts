// @vitest-environment happy-dom
import * as L from "leaflet";
import { afterEach, describe, expect, it } from "vitest";
import { createEditor } from "@aredtech/osm-indoor-edit";
import { createLeafletAdapter } from "../src";

const maps: L.Map[] = [];

afterEach(() => {
  for (const map of maps.splice(0)) {
    map.remove();
  }
  document.body.replaceChildren();
});

describe("Leaflet drawing visuals", () => {
  it("shows draft layers after drawing clicks", () => {
    const { adapter, editor, map } = createLeafletDrawingEditor();

    editor.startDraw("room");
    clickMap(map, 1, 2);

    expect(adapter.getLayerCounts().draft).toBe(1);
    expect(adapter.getDraftVertexHandleCount()).toBe(1);
    expect(adapter.getDraftVertexHitTargetCount()).toBe(1);
  });

  it("shows polygon preview after 3 drawing clicks", () => {
    const { adapter, editor, map } = createLeafletDrawingEditor();

    editor.startDraw("room");
    clickMap(map, 1, 2);
    clickMap(map, 3, 4);
    clickMap(map, 5, 6);

    expect(adapter.getLayerCounts().draft).toBe(1);
    expect(adapter.getDraftVertexHandleCount()).toBe(3);
    expect(adapter.getDraftVertexHitTargetCount()).toBe(3);
    expect(adapter.getDraftVertexHitTargetRadius()).toBeGreaterThanOrEqual(14);
  });

  it("shows dashed future connection while drawing toward the pointer", () => {
    const { adapter, editor, map } = createLeafletDrawingEditor();

    editor.startDraw("room");
    clickMap(map, 1, 2);
    moveMap(map, 3, 4);

    expect(adapter.getDraftVertexHandleCount()).toBe(1);
    expect(adapter.getDraftVertexHitTargetCount()).toBe(1);
    expect(adapter.getTemporaryLayerCount("draft")).toBeGreaterThan(adapter.getDraftVertexHandleCount());
  });

  it("emits draftVertexDrag from draft vertex mouse drag gestures", () => {
    const { adapter, editor, map } = createLeafletDrawingEditor();
    const seen: Array<{ index: number; lat: number; lon: number }> = [];
    adapter.on("draftVertexDrag", (event) =>
      seen.push({
        index: event.vertexIndex,
        lat: event.coordinate.lat,
        lon: event.coordinate.lon
      })
    );

    editor.startDraw("room");
    clickMap(map, 1, 2);
    adapter.fireDraftVertexHandleDrag(0, { lat: 10, lon: 20 });

    expect(seen).toEqual([{ index: 0, lat: 10, lon: 20 }]);
  });

  it("clearTemporaryFeature removes one draft layer", () => {
    const { adapter } = createLeafletDrawingEditor();

    adapter.showTemporaryFeature("draft", {
      geometryType: "line",
      coordinates: [
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 }
      ]
    });
    expect(adapter.getLayerCounts().draft).toBe(1);

    adapter.clearTemporaryFeature("draft");

    expect(adapter.getLayerCounts().draft).toBe(0);
  });

  it("cancel clears draft layers", () => {
    const { adapter, editor, map } = createLeafletDrawingEditor();

    editor.startDraw("room");
    clickMap(map, 1, 2);
    editor.cancelDraw();

    expect(adapter.getLayerCounts().draft).toBe(0);
  });
});

function createLeafletDrawingEditor() {
  const map = createMap();
  const adapter = createLeafletAdapter();
  const editor = createEditor({ adapter, target: map, defaultLevel: "0" });
  return { adapter, editor, map };
}

function createMap(): L.Map {
  const container = document.createElement("div");
  container.style.width = "400px";
  container.style.height = "300px";
  document.body.append(container);

  const map = L.map(container, {
    center: [57.7089, 11.9746],
    zoom: 19,
    zoomControl: false,
    attributionControl: false
  });
  maps.push(map);
  return map;
}

function clickMap(map: L.Map, lat: number, lon: number): void {
  map.fire("click", {
    latlng: L.latLng(lat, lon),
    originalEvent: new MouseEvent("click")
  });
}

function moveMap(map: L.Map, lat: number, lon: number): void {
  map.fire("mousemove", {
    latlng: L.latLng(lat, lon),
    originalEvent: new MouseEvent("mousemove")
  });
}
