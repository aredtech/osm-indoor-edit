import { describe, expect, it } from "vitest";
import {
  createEditor,
  ElementIdAllocator,
  FakeRendererAdapter,
  VertexEditError,
  fixedClock
} from "../src";

function createEditingEditor() {
  const adapter = new FakeRendererAdapter();
  const editor = createEditor({
    adapter,
    target: { id: "map" },
    defaultLevel: "0",
    ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
    clock: fixedClock("2026-05-12T09:20:00.000Z")
  });
  return { adapter, editor };
}

function drawRoom(pointCount = 3) {
  const { adapter, editor } = createEditingEditor();
  editor.startDraw("room");
  for (const coordinate of [
    { lat: 1, lon: 2 },
    { lat: 3, lon: 4 },
    { lat: 5, lon: 6 },
    { lat: 7, lon: 8 }
  ].slice(0, pointCount)) {
    adapter.emit("pointerDown", { coordinate });
  }
  const feature = editor.finishDraw();
  return { adapter, editor, feature };
}

describe("editor editing lifecycle", () => {
  it("handles click-to-select committed features", () => {
    const { adapter, editor, feature } = drawRoom();
    const selected: Array<string | null> = [];
    editor.on("featureSelected", (event) => selected.push(event.featureId));

    adapter.emit("featureClick", {
      featureId: feature.id,
      coordinate: { lat: 1, lon: 2 }
    });

    expect(selected).toEqual([feature.id]);
    expect(adapter.selectedFeatureId).toBe(feature.id);
    expect(adapter.calls.map((call) => call.name)).toContain("showVertexHandles");
  });

  it("updates export coordinates on drag vertex", () => {
    const { adapter, editor, feature } = drawRoom();

    adapter.emit("vertexDrag", {
      featureId: feature.id,
      vertexIndex: 1,
      coordinate: { lat: 30, lon: 40 }
    });

    expect(editor.exportOsmInEdit().elements.slice(0, 3)).toMatchObject([
      { type: "node", id: 1, lat: 1, lon: 2 },
      { type: "node", id: 2, lat: 30, lon: 40 },
      { type: "node", id: 3, lat: 5, lon: 6 }
    ]);
  });

  it("supports host API vertex delete", () => {
    const { editor, feature } = drawRoom(4);

    const updated = editor.deleteVertex(feature.id, 1);
    const elements = editor.exportOsmInEdit().elements;

    expect(updated.primitiveRefs.nodeIds).toEqual([1, 3, 4, 1]);
    expect(elements.slice(0, 3)).toMatchObject([
      { type: "node", id: 1 },
      { type: "node", id: 3 },
      { type: "node", id: 4 }
    ]);
    expect(elements[3]).toMatchObject({ type: "way", id: 10, nodes: [1, 3, 4, 1] });
  });

  it("inserts midpoint vertices into way sequences", () => {
    const { editor, feature } = drawRoom();

    const updated = editor.insertVertex(feature.id, 1, { lat: 4, lon: 5 });
    const elements = editor.exportOsmInEdit().elements;

    expect(updated.primitiveRefs.nodeIds).toEqual([1, 2, 4, 3, 1]);
    expect(elements.slice(0, 3)).toMatchObject([
      { type: "node", id: 1 },
      { type: "node", id: 2 },
      { type: "node", id: 3 }
    ]);
    expect(elements[3]).toMatchObject({ type: "node", id: 4, lat: 4, lon: 5 });
    expect(elements[4]).toMatchObject({ type: "way", id: 10, nodes: [1, 2, 4, 3, 1] });
  });

  it("can move whole feature geometry", () => {
    const { editor, feature } = drawRoom();

    editor.moveFeature(feature.id, { lat: 10, lon: 20 });

    expect(editor.exportOsmInEdit().elements.slice(0, 3)).toMatchObject([
      { type: "node", id: 1, lat: 11, lon: 22 },
      { type: "node", id: 2, lat: 13, lon: 24 },
      { type: "node", id: 3, lat: 15, lon: 26 }
    ]);
  });

  it("updates tags and deletes features", () => {
    const { adapter, editor, feature } = drawRoom();

    const updated = editor.updateTags(feature.id, { name: "Suite A" });
    editor.selectFeature(feature.id);
    editor.deleteFeature(feature.id);

    expect(updated.tags.name).toBe("Suite A");
    expect(editor.exportOsmInEdit().elements).toEqual([]);
    expect(adapter.calls.map((call) => call.name)).toContain("removeFeature");
  });

  it("rejects deleting a triangle vertex", () => {
    const { editor, feature } = drawRoom();

    expect(() => editor.deleteVertex(feature.id, 1)).toThrow(VertexEditError);
  });
});
