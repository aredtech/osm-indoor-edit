import { describe, expect, it } from "vitest";
import {
  createMapLibreAdapter,
  mergeMapLibreEditingStyles
} from "../src";
import { FakeMapLibreMap, type FakeFeatureCollection } from "./fake-maplibre-map";

describe("createMapLibreAdapter", () => {
  it("merges style overrides with defaults", () => {
    const styles = mergeMapLibreEditingStyles({
      draftLine: { paint: { "line-color": "#111827" } },
      vertexHandle: { paint: { "circle-radius": 9 } }
    });

    expect(styles.draftLine.paint["line-color"]).toBe("#111827");
    expect(styles.draftLine.paint["line-width"]).toBe(2);
    expect(styles.vertexHandle.paint["circle-radius"]).toBe(9);
    expect(styles.vertexHandle.paint["circle-stroke-color"]).toBe("#F97316");
    expect(styles.snapIndicator.circle.paint["circle-color"]).toBe("#22C55E");
  });

  it("creates prefixed SDK-owned sources and layers", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter({ sourcePrefix: "custom-edit" });

    adapter.attach(map);

    expect([...map.sources.keys()]).toEqual([
      "custom-edit-draft",
      "custom-edit-committed",
      "custom-edit-selection",
      "custom-edit-handles",
      "custom-edit-snap"
    ]);
    expect(adapter.getLayerIds().every((id) => id.startsWith("custom-edit-"))).toBe(true);
  });

  it("removes SDK layers and listeners on detach", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();
    const seen: Array<{ lat: number; lon: number }> = [];
    adapter.on("pointerDown", (event) => seen.push(event.coordinate));

    adapter.attach(map);
    map.fire("click", { lngLat: { lng: 11.9, lat: 57.7 } });
    adapter.detach();
    map.fire("click", { lngLat: { lng: 12.3, lat: 58.1 } });

    expect(seen).toEqual([{ lat: 57.7, lon: 11.9 }]);
    expect(map.sources.size).toBe(0);
    expect(map.layers.size).toBe(0);
    expect(map.listenerCount("click")).toBe(0);
    expect(() => adapter.detach()).not.toThrow();
  });

  it("emits pointerDown coordinates and converts projection coordinates", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();
    const seen: Array<{ lat: number; lon: number }> = [];

    adapter.attach(map);
    adapter.on("pointerDown", (event) => seen.push(event.coordinate));
    map.fire("click", { lngLat: { lng: 11.9746, lat: 57.7089 } });

    expect(seen).toEqual([{ lat: 57.7089, lon: 11.9746 }]);
    expect(adapter.project({ lat: 1, lon: 2 })).toEqual({ x: 2, y: 1 });
    expect(adapter.unproject({ x: 4, y: 3 })).toEqual({ lat: 3, lon: 4 });
  });

  it("renders temporary polygon draft source data", () => {
    const adapter = createAttachedAdapter();

    adapter.showTemporaryFeature("draft", {
      geometryType: "polygon",
      coordinates: [
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 },
        { lat: 5, lon: 6 },
        { lat: 1, lon: 2 }
      ]
    });

    const data = adapter.getSourceData("draft");
    expect(data.features.map((candidate) => candidate.properties?.role)).toEqual([
      "draft-fill",
      "draft-line",
      "draft-vertex",
      "draft-vertex",
      "draft-vertex",
      "draft-vertex"
    ]);
    expect(data.features[0].geometry).toMatchObject({
      type: "Polygon",
      coordinates: [[[2, 1], [4, 3], [6, 5], [2, 1]]]
    });
  });

  it("renders temporary preview line source data", () => {
    const adapter = createAttachedAdapter();

    adapter.showTemporaryFeature("draft", {
      geometryType: "line",
      coordinates: [{ lat: 1, lon: 2 }],
      previewCoordinates: [
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 }
      ]
    });

    const data = adapter.getSourceData("draft");
    expect(data.features.map((candidate) => candidate.properties?.role)).toEqual([
      "draft-line",
      "draft-preview-line",
      "draft-vertex"
    ]);
    expect(data.features[1].geometry).toMatchObject({
      type: "LineString",
      coordinates: [[2, 1], [4, 3]]
    });
  });

  it("configures the temporary preview layer as a dashed visible line", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();

    adapter.attach(map);

    expect(map.layers.get("osminedit-draft-preview-line")).toMatchObject({
      type: "line",
      source: "osminedit-draft",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#2563EB",
        "line-width": 2,
        "line-opacity": 0.75,
        "line-dasharray": [2, 3]
      }
    });
  });

  it("emits draftVertexDrag from draft vertex mouse drag gestures", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();
    const seen: Array<{ index: number; lat: number; lon: number }> = [];
    adapter.attach(map);
    adapter.on("draftVertexDrag", (event) =>
      seen.push({
        index: event.vertexIndex,
        lat: event.coordinate.lat,
        lon: event.coordinate.lon
      })
    );

    map.fireLayer("mousedown", "osminedit-draft-vertex", {
      features: [{ properties: { vertexIndex: 0 } }],
      lngLat: { lng: 2, lat: 1 }
    });
    map.fire("mousemove", { lngLat: { lng: 20, lat: 10 } });
    map.fire("mouseup", { lngLat: { lng: 20, lat: 10 } });

    expect(seen).toEqual([{ index: 0, lat: 10, lon: 20 }]);
  });

  it("filters committed features by level and repeat_on", () => {
    const adapter = createAttachedAdapter();
    adapter.commitFeature({
      id: "feature-1",
      kind: "room",
      geometryType: "polygon",
      level: "0",
      tags: { indoor: "room", level: "0" },
      primitiveRefs: { nodeIds: [1, 2, 3, 1], wayId: 10 },
      coordinates: [
        { lat: 0, lon: 0 },
        { lat: 0, lon: 1 },
        { lat: 1, lon: 1 },
        { lat: 0, lon: 0 }
      ]
    });
    adapter.commitFeature({
      id: "feature-2",
      kind: "room",
      geometryType: "polygon",
      level: "0",
      tags: { indoor: "room", level: "0", repeat_on: "1;2" },
      primitiveRefs: { nodeIds: [4, 5, 6, 4], wayId: 11 },
      coordinates: [
        { lat: 2, lon: 2 },
        { lat: 2, lon: 3 },
        { lat: 3, lon: 3 },
        { lat: 2, lon: 2 }
      ]
    });

    adapter.setLevel("1");

    expect(featureIds(adapter.getSourceData("committed"))).toEqual(["feature-2"]);
  });

  it("renders showSnapCandidate and clearSnapCandidate", () => {
    const adapter = createAttachedAdapter();

    adapter.showSnapCandidate({
      kind: "edge",
      wayId: 10,
      edgeIndex: 0,
      fromNodeId: 1,
      toNodeId: 2,
      from: { lat: 1, lon: 2 },
      to: { lat: 1, lon: 6 },
      coordinate: { lat: 1, lon: 4 },
      distancePx: 1
    });

    expect(adapter.getSourceData("snap").features.map((item) => item.geometry.type)).toEqual([
      "Point",
      "LineString"
    ]);

    adapter.clearSnapCandidate();

    expect(adapter.getSourceData("snap").features).toEqual([]);
  });

  it("applies POI and door style overrides", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter({
      styles: {
        poi: { paint: { "circle-color": "#A855F7" } },
        door: { paint: { "circle-color": "#EF4444" } },
        selected: { line: { paint: { "line-width": 6 } } },
        snapIndicator: { circle: { paint: { "circle-radius": 12 } } }
      }
    });

    adapter.attach(map);
    adapter.commitFeature({
      id: "poi-feature",
      kind: "poi",
      geometryType: "point",
      level: "0",
      tags: { amenity: "bench", level: "0" },
      primitiveRefs: { nodeIds: [1], relationIds: [] },
      coordinates: [{ lat: 1, lon: 2 }]
    });
    adapter.commitFeature({
      id: "door-feature",
      kind: "door",
      geometryType: "point",
      level: "0",
      tags: { door: "yes", level: "0" },
      primitiveRefs: { nodeIds: [2], relationIds: [] },
      coordinates: [{ lat: 3, lon: 4 }]
    });

    expect(map.getLayer("osminedit-committed-poi")?.paint).toMatchObject({
      "circle-color": "#A855F7",
      "circle-radius": 6
    });
    expect(map.getLayer("osminedit-committed-door")?.paint).toMatchObject({
      "circle-color": "#EF4444",
      "circle-radius": 6
    });
    expect(map.getLayer("osminedit-selection-line")?.paint).toMatchObject({
      "line-width": 6
    });
    expect(map.getLayer("osminedit-snap-point")?.paint).toMatchObject({
      "circle-radius": 12
    });
    expect(adapter.getSourceData("committed").features.map((item) => item.properties)).toEqual([
      expect.objectContaining({ isPoi: true }),
      expect.objectContaining({ isDoor: true })
    ]);
  });
});

function createAttachedAdapter() {
  const map = new FakeMapLibreMap();
  const adapter = createMapLibreAdapter();
  adapter.attach(map);
  return adapter;
}

function featureIds(data: FakeFeatureCollection): string[] {
  return [
    ...new Set(data.features.map((item) => item.properties?.featureId).filter(isString))
  ];
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
