import { describe, expect, it } from "vitest";
import {
  createEditor,
  DrawingIntegrityError,
  ElementIdAllocator,
  FakeRendererAdapter,
  fixedClock
} from "../src";

function createDrawingEditor() {
  const adapter = new FakeRendererAdapter();
  const editor = createEditor({
    adapter,
    target: { id: "map" },
    defaultLevel: "0",
    ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
    clock: fixedClock("2026-05-12T09:10:00.000Z")
  });

  return { adapter, editor };
}

describe("editor drawing lifecycle", () => {
  it("throws Select a level before drawing when level is missing", () => {
    const editor = createEditor();

    expect(() => editor.startDraw("room")).toThrow(DrawingIntegrityError);
    expect(() => editor.startDraw("room")).toThrow("Select a level before drawing");
  });

  it("commits room primitives and exports a closed way", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });
    adapter.emit("pointerDown", { coordinate: { lat: 5, lon: 6 } });
    const feature = editor.finishDraw();

    expect(feature.kind).toBe("room");
    expect(feature.tags).toEqual({ indoor: "room", level: "0" });
    expect(feature.primitiveRefs.nodeIds).toEqual([1, 2, 3, 1]);
    expect(feature.primitiveRefs.wayId).toBe(10);
    expect(editor.exportOsmInEdit().elements).toMatchObject([
      { type: "node", id: 1, lat: 1, lon: 2 },
      { type: "node", id: 2, lat: 3, lon: 4 },
      { type: "node", id: 3, lat: 5, lon: 6 },
      { type: "way", id: 10, nodes: [1, 2, 3, 1], tags: { indoor: "room", level: "0" } }
    ]);
    expect(adapter.calls.map((call) => call.name)).toContain("commitFeature");
  });

  it("commits POI primitives with host tags", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("poi", { tags: { amenity: "bench", name: "Rest point" } });
    adapter.emit("pointerDown", { coordinate: { lat: 7, lon: 8 } });
    const feature = editor.finishDraw();

    expect(feature.geometryType).toBe("point");
    expect(feature.tags).toEqual({ amenity: "bench", name: "Rest point", level: "0" });
    expect(editor.exportOsmInEdit().elements).toMatchObject([
      {
        type: "node",
        id: 1,
        lat: 7,
        lon: 8,
        tags: { amenity: "bench", name: "Rest point", level: "0" }
      }
    ]);
  });

  it("rejects incomplete polygon finish without committing primitives", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("corridor");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });

    expect(() => editor.finishDraw()).toThrow("Add at least 3 points before finishing this polygon.");
    expect(editor.getElements()).toEqual([]);
  });

  it("cancelDraw clears draft visuals and emits drawingCancelled", () => {
    const { adapter, editor } = createDrawingEditor();
    const cancellations: string[] = [];
    editor.on("drawingCancelled", (event) => cancellations.push(event.reason ?? ""));

    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    editor.cancelDraw();

    expect(cancellations).toEqual(["cancelDraw"]);
    expect(adapter.calls.map((call) => call.name)).toContain("clearTemporaryFeature");
    expect(editor.getElements()).toEqual([]);
  });
});
