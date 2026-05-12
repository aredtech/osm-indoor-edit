import { describe, expect, it } from "vitest";
import { createEditor, ElementIdAllocator, FakeRendererAdapter, fixedClock } from "../src";

function createTopologyEditor() {
  const adapter = new FakeRendererAdapter();
  const editor = createEditor({
    adapter,
    target: { id: "map" },
    defaultLevel: "0",
    ids: new ElementIdAllocator({ nodeStart: 100, wayStart: 200, relationStart: 300 }),
    clock: fixedClock("2026-05-12T09:40:00.000Z")
  });
  return { adapter, editor };
}

function loadTwoRoomsSharingWall() {
  const { adapter, editor } = createTopologyEditor();
  editor.loadOsmInEdit({
    status: true,
    elements: [
      { type: "node", id: 1, lat: 0, lon: 0, tags: {}, timestamp: "2026-05-12T09:00:00Z" },
      { type: "node", id: 2, lat: 0, lon: 10, tags: {}, timestamp: "2026-05-12T09:00:00Z" },
      { type: "node", id: 3, lat: 10, lon: 10, tags: {}, timestamp: "2026-05-12T09:00:00Z" },
      { type: "node", id: 4, lat: 10, lon: 0, tags: {}, timestamp: "2026-05-12T09:00:00Z" },
      { type: "node", id: 5, lat: 0, lon: 20, tags: {}, timestamp: "2026-05-12T09:00:00Z" },
      { type: "node", id: 6, lat: 10, lon: 20, tags: {}, timestamp: "2026-05-12T09:00:00Z" },
      {
        type: "way",
        id: 10,
        nodes: [1, 2, 3, 4, 1],
        tags: { indoor: "room", level: "0", name: "A" },
        timestamp: "2026-05-12T09:00:00Z"
      },
      {
        type: "way",
        id: 11,
        nodes: [2, 5, 6, 3, 2],
        tags: { indoor: "room", level: "0", name: "B" },
        timestamp: "2026-05-12T09:00:00Z"
      }
    ]
  });
  return { adapter, editor };
}

describe("editor topology", () => {
  it("updates two rooms sharing a wall when a shared vertex moves", () => {
    const { adapter, editor } = loadTwoRoomsSharingWall();
    const featureUpdated: string[] = [];
    editor.on("featureUpdated", (event) => featureUpdated.push(event.featureId));

    editor.moveVertex("feature-1", 1, { lat: -1, lon: 11 });

    const node = editor.exportOsmInEdit().elements.find(
      (element) => element.type === "node" && element.id === 2
    );
    const updatedFeatureIds = adapter.calls
      .filter((call) => call.name === "updateFeature")
      .map((call) => (call.args[0] as { id: string }).id);

    expect(node).toMatchObject({ type: "node", id: 2, lat: -1, lon: 11 });
    expect(updatedFeatureIds).toEqual(["feature-1", "feature-2"]);
    expect(featureUpdated).toEqual(["feature-1", "feature-2"]);
  });
});
