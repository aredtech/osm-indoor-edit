import { describe, expect, it } from "vitest";
import { createEditor, ElementIdAllocator, FakeRendererAdapter, fixedClock } from "../src";

function createRelationEditor() {
  const adapter = new FakeRendererAdapter();
  const editor = createEditor({
    adapter,
    target: { id: "map" },
    defaultLevel: "0",
    ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
    clock: fixedClock("2026-05-12T09:50:00.000Z")
  });
  editor.startDraw("room");
  adapter.emit("pointerDown", { coordinate: { lat: 0, lon: 0 } });
  adapter.emit("pointerDown", { coordinate: { lat: 0, lon: 10 } });
  adapter.emit("pointerDown", { coordinate: { lat: 10, lon: 10 } });
  editor.finishDraw();
  return { adapter, editor };
}

describe("editor relation APIs", () => {
  it("creates, updates, appends, removes, and exports a relation-backed feature", () => {
    const { adapter, editor } = createRelationEditor();
    const relationUpdated: number[] = [];
    editor.on("relationUpdated", (event) => relationUpdated.push(event.relationId));

    const relationFeature = editor.createRelation({
      members: [{ type: "way", ref: 10, role: "outer" }],
      tags: { type: "multipolygon" }
    });
    editor.updateRelationTags(20, { type: "multipolygon", indoor: "room", level: "0" });
    editor.appendRelationMember(20, { type: "node", ref: 1, role: "label" });
    editor.removeRelationMember(20, { type: "node", ref: 1, role: "label" });

    const stateFeature = editor
      .getState()
      .features.find((feature) => feature.primitiveRefs.relationIds?.includes(20));
    const relation = editor.exportOsmInEdit().elements.find(
      (element) => element.type === "relation" && element.id === 20
    );

    expect(relationFeature).toMatchObject({ geometryType: "relation" });
    expect(stateFeature).toMatchObject({
      geometryType: "relation",
      tags: { type: "multipolygon", indoor: "room", level: "0" }
    });
    expect(relation).toMatchObject({
      type: "relation",
      members: [{ type: "way", ref: 10, role: "outer" }]
    });
    expect(relationUpdated).toEqual([20, 20, 20, 20]);
    expect(adapter.calls.filter((call) => call.name === "commitFeature")).toHaveLength(1);
  });
});
