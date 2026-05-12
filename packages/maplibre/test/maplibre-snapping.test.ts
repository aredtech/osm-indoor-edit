import { describe, expect, it } from "vitest";
import { createMapLibreAdapter } from "../src";
import { FakeMapLibreMap } from "./fake-maplibre-map";
import { clickMap, createMapLibreDrawingEditor } from "./maplibre-drawing.test";

describe("MapLibre snapping workflows", () => {
  it("renders node and edge snap candidates", () => {
    const map = new FakeMapLibreMap();
    const adapter = createMapLibreAdapter();
    adapter.attach(map);

    adapter.showSnapCandidate({
      kind: "node",
      nodeId: 1,
      coordinate: { lat: 1, lon: 2 },
      distancePx: 0
    });

    expect(adapter.getSourceData("snap").features.map((item) => item.geometry.type)).toEqual([
      "Point"
    ]);

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

  it("shares a node through MapLibre snapping", () => {
    const { adapter, editor, map } = createMapLibreDrawingEditor();
    drawBaseRoom(editor, map);

    editor.setSnapping(true);
    editor.startDraw("room");
    clickMap(map, 0, 0);
    clickMap(map, 20, 20);
    clickMap(map, 20, 30);
    const second = editor.finishDraw();

    expect(second.primitiveRefs.nodeIds[0]).toBe(1);
    expect(editor.exportOsmInEdit().elements).toContainEqual(
      expect.objectContaining({ type: "way", id: 11, nodes: [1, 5, 6, 1] })
    );
    expect(adapter.getSourceData("snap").features).toEqual([]);
  });

  it("inserts an edge snap node through MapLibre snapping", () => {
    const { editor, map } = createMapLibreDrawingEditor();
    drawBaseRoom(editor, map);

    editor.setSnapping({ enabled: true, tolerancePx: 4 });
    editor.startDraw("room");
    clickMap(map, 3, 4);
    clickMap(map, 20, 20);
    clickMap(map, 20, 30);
    const second = editor.finishDraw();

    expect(second.primitiveRefs.nodeIds[0]).toBe(5);
    expect(editor.exportOsmInEdit().elements).toContainEqual(
      expect.objectContaining({ type: "way", id: 10, nodes: [1, 5, 2, 3, 4, 1] })
    );
  });

  it("clears snap visuals when setSnapping(false)", () => {
    const { adapter, editor } = createMapLibreDrawingEditor();
    adapter.showSnapCandidate({
      kind: "node",
      nodeId: 1,
      coordinate: { lat: 1, lon: 2 },
      distancePx: 0
    });

    editor.setSnapping(false);

    expect(adapter.getSourceData("snap").features).toEqual([]);
  });
});

function drawBaseRoom(editor: ReturnType<typeof createMapLibreDrawingEditor>["editor"], map: FakeMapLibreMap) {
  editor.startDraw("room");
  clickMap(map, 0, 0);
  clickMap(map, 0, 10);
  clickMap(map, 10, 10);
  clickMap(map, 10, 0);
  return editor.finishDraw();
}
