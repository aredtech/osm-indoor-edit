import { describe, expect, it } from "vitest";
import { createEditor, ElementIdAllocator, FakeRendererAdapter, fixedClock } from "../src";

function createSnappingEditor() {
  const adapter = new FakeRendererAdapter();
  const editor = createEditor({
    adapter,
    target: { id: "map" },
    defaultLevel: "0",
    ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
    clock: fixedClock("2026-05-12T09:30:00.000Z")
  });
  return { adapter, editor };
}

function drawRoom(adapter: FakeRendererAdapter, editor: ReturnType<typeof createEditor>) {
  editor.startDraw("room");
  adapter.emit("pointerDown", { coordinate: { lat: 0, lon: 0 } });
  adapter.emit("pointerDown", { coordinate: { lat: 0, lon: 10 } });
  adapter.emit("pointerDown", { coordinate: { lat: 10, lon: 10 } });
  adapter.emit("pointerDown", { coordinate: { lat: 10, lon: 0 } });
  return editor.finishDraw();
}

describe("editor snapping", () => {
  it("shares an existing node when snapping is enabled", () => {
    const { adapter, editor } = createSnappingEditor();
    const first = drawRoom(adapter, editor);

    editor.setSnapping(true);
    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 0, lon: 0 } });
    adapter.emit("pointerDown", { coordinate: { lat: 20, lon: 20 } });
    adapter.emit("pointerDown", { coordinate: { lat: 20, lon: 30 } });
    const second = editor.finishDraw();

    const ways = editor.exportOsmInEdit().elements.filter((element) => element.type === "way");
    expect(first.primitiveRefs.nodeIds[0]).toBe(1);
    expect(second.primitiveRefs.nodeIds[0]).toBe(1);
    expect(ways).toMatchObject([
      { type: "way", id: 10, nodes: [1, 2, 3, 4, 1] },
      { type: "way", id: 11, nodes: [1, 5, 6, 1] }
    ]);
  });

  it("splits an existing edge and shares the inserted node", () => {
    const { adapter, editor } = createSnappingEditor();
    drawRoom(adapter, editor);

    editor.setSnapping({ enabled: true, tolerancePx: 4 });
    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });
    adapter.emit("pointerDown", { coordinate: { lat: 20, lon: 20 } });
    adapter.emit("pointerDown", { coordinate: { lat: 20, lon: 30 } });
    const second = editor.finishDraw();

    const ways = editor.exportOsmInEdit().elements.filter((element) => element.type === "way");
    expect(second.primitiveRefs.nodeIds[0]).toBe(5);
    expect(ways).toMatchObject([
      { type: "way", id: 10, nodes: [1, 5, 2, 3, 4, 1] },
      { type: "way", id: 11, nodes: [5, 6, 7, 5] }
    ]);
  });
});
