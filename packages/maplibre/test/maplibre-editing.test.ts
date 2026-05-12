import { describe, expect, it } from "vitest";
import type { FeatureRecord } from "@osminedit-lib/core";
import { createEditor, ElementIdAllocator, fixedClock } from "@osminedit-lib/core";
import { createMapLibreAdapter } from "../src";
import { FakeMapLibreMap, feature } from "./fake-maplibre-map";
import { clickMap, createMapLibreDrawingEditor } from "./maplibre-drawing.test";

describe("MapLibre editing workflows", () => {
  it("emits featureClick from committed layer properties", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();
    const seen: string[] = [];

    adapter.attach(map);
    adapter.on("featureClick", (event) => seen.push(event.featureId));
    adapter.commitFeature(roomFeature);
    map.fireLayer("click", "osminedit-committed-fill", {
      lngLat: { lng: 2, lat: 1 },
      features: [feature({ type: "Polygon", coordinates: [] }, { featureId: "feature-1" })]
    });

    expect(seen).toEqual(["feature-1"]);
  });

  it("shows selection and vertex handles", () => {
    const { adapter, editor, map } = createDrawnRoomEditor();
    const featureId = editor.getState().features[0].id;

    editor.selectFeature(featureId);

    expect(adapter.getSourceData("selection").features.length).toBeGreaterThan(0);
    expect(adapter.getSourceData("handles").features.map((item) => item.properties.role)).toEqual([
      "vertex",
      "vertex",
      "vertex",
      "midpoint",
      "midpoint",
      "midpoint"
    ]);
    expect(map.layers.has("osminedit-handle-vertex")).toBe(true);
  });

  it("emits midpointClick with edgeIndex and inserts a midpoint through MapLibre", () => {
    const { adapter, editor, map } = createDrawnRoomEditor();
    const featureId = editor.getState().features[0].id;
    editor.selectFeature(featureId);

    map.fireLayer("click", "osminedit-handle-midpoint", {
      lngLat: { lng: 3, lat: 2 },
      features: [feature({ type: "Point", coordinates: [3, 2] }, { featureId, edgeIndex: 0 })]
    });

    const way = editor.exportOsmInEdit().elements.find((element) => element.type === "way");
    expect(way).toMatchObject({ type: "way", nodes: [1, 4, 2, 3, 1] });
    expect(adapter.getSourceData("handles").features).toContainEqual(
      expect.objectContaining({ properties: expect.objectContaining({ edgeIndex: 0 }) })
    );
  });

  it("moves a vertex through MapLibre and restores dragPan after vertex drag", () => {
    const { editor, map } = createDrawnRoomEditor();
    const featureId = editor.getState().features[0].id;
    editor.selectFeature(featureId);

    map.fireLayer("mousedown", "osminedit-handle-vertex", {
      lngLat: { lng: 2, lat: 1 },
      features: [feature({ type: "Point", coordinates: [2, 1] }, { featureId, vertexIndex: 1 })]
    });
    map.fire("mousemove", { lngLat: { lng: 40, lat: 30 } });
    map.fire("mouseup", { lngLat: { lng: 40, lat: 30 } });

    expect(editor.exportOsmInEdit().elements).toContainEqual(
      expect.objectContaining({ type: "node", id: 2, lat: 30, lon: 40 })
    );
    expect(map.dragPan.disabled).toBe(1);
    expect(map.dragPan.enabled).toBe(1);
  });

  it("moves a whole feature through MapLibre", () => {
    const { editor, map } = createDrawnRoomEditor();
    const featureId = editor.getState().features[0].id;

    map.fireLayer("mousedown", "osminedit-committed-fill", {
      lngLat: { lng: 2, lat: 1 },
      features: [feature({ type: "Polygon", coordinates: [] }, { featureId })]
    });
    map.fire("mouseup", { lngLat: { lng: 3, lat: 2 } });

    expect(editor.exportOsmInEdit().elements).toContainEqual(
      expect.objectContaining({ type: "node", id: 1, lat: 2, lon: 3 })
    );
  });

  it("preserves imported IDs and renders imported features", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();
    const editor = createEditor({
      adapter,
      target: map,
      defaultLevel: "0",
      ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
      clock: fixedClock("2026-05-12T09:10:00.000Z")
    });

    editor.loadOsmInEdit({
      status: true,
      elements: [
        { type: "node", id: 101, lat: 0, lon: 0, tags: {}, timestamp: "x" },
        { type: "node", id: 102, lat: 0, lon: 1, tags: {}, timestamp: "x" },
        { type: "node", id: 103, lat: 1, lon: 1, tags: {}, timestamp: "x" },
        {
          type: "way",
          id: 201,
          nodes: [101, 102, 103, 101],
          tags: { indoor: "room", level: "0" },
          timestamp: "x"
        }
      ]
    });

    expect(adapter.getSourceData("committed").features[0].properties.featureId).toBe("feature-1");
    expect(editor.exportOsmInEdit().elements).toContainEqual(
      expect.objectContaining({ type: "way", id: 201, nodes: [101, 102, 103, 101] })
    );
  });

  it("filters committed features by level and repeat_on", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();
    adapter.attach(map);

    adapter.commitFeature({ ...roomFeature, id: "feature-0", level: "0", tags: { indoor: "room", level: "0" } });
    adapter.commitFeature({
      ...roomFeature,
      id: "feature-repeat",
      level: "0",
      tags: { indoor: "room", level: "0", repeat_on: "1;2" }
    });
    adapter.setLevel("1");

    expect(
      adapter.getSourceData("committed").features.map((item) => item.properties.featureId)
    ).toEqual(["feature-repeat"]);
  });
});

const roomFeature: FeatureRecord = {
  id: "feature-1",
  kind: "room",
  geometryType: "polygon",
  level: "0",
  tags: { indoor: "room", level: "0" },
  primitiveRefs: { nodeIds: [1, 2, 3, 1], wayId: 10, relationIds: [] },
  coordinates: [
    { lat: 1, lon: 2 },
    { lat: 3, lon: 4 },
    { lat: 5, lon: 6 },
    { lat: 1, lon: 2 }
  ]
};

function createDrawnRoomEditor() {
  const context = createMapLibreDrawingEditor();
  context.editor.startDraw("room");
  clickMap(context.map, 1, 2);
  clickMap(context.map, 3, 4);
  clickMap(context.map, 5, 6);
  context.editor.finishDraw();
  return context;
}
