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
