import { describe, expect, it } from "vitest";
import {
  createEditor,
  FakeRendererAdapter,
  type FeatureRecord,
  type RendererAdapter
} from "../src";

function acceptsRendererAdapter(adapter: RendererAdapter): RendererAdapter {
  return adapter;
}

const feature: FeatureRecord = {
  id: "feature-1",
  kind: "room",
  geometryType: "polygon",
  level: "0",
  tags: { indoor: "room" },
  primitiveRefs: { nodeIds: [1, 2, 3, 1], wayId: 10, relationIds: [] }
};

describe("FakeRendererAdapter", () => {
  it("satisfies the RendererAdapter contract", () => {
    const adapter = acceptsRendererAdapter(new FakeRendererAdapter());

    expect(adapter).toBeInstanceOf(FakeRendererAdapter);
  });

  it("records attach and detach calls through editor lifecycle", () => {
    const adapter = new FakeRendererAdapter();
    const target = { id: "map-target" };
    const editor = createEditor({ adapter, target });

    editor.destroy();

    expect(adapter.calls[0]?.name).toBe("attach");
    expect(adapter.calls.filter((call) => call.name === "on")).toHaveLength(5);
    expect(adapter.calls.filter((call) => call.name === "off")).toHaveLength(5);
    expect(adapter.calls.at(-1)?.name).toBe("detach");
    expect(adapter.calls[0]?.args).toEqual([target]);
    expect(adapter.attachedTarget).toBeUndefined();
  });

  it("records layer, selection, and coordinate conversion calls", () => {
    const adapter = new FakeRendererAdapter();

    adapter.showTemporaryFeature("draft-1", {
      geometryType: "polygon",
      coordinates: [
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 }
      ]
    });
    adapter.commitFeature(feature);
    adapter.setSelectedFeature(feature.id);
    expect(adapter.project({ lat: 5, lon: 6 })).toEqual({ x: 6, y: 5 });
    expect(adapter.unproject({ x: 7, y: 8 })).toEqual({ lat: 8, lon: 7 });

    expect(adapter.selectedFeatureId).toBe("feature-1");
    expect(adapter.calls.map((call) => call.name)).toEqual([
      "showTemporaryFeature",
      "commitFeature",
      "setSelectedFeature",
      "project",
      "unproject"
    ]);
  });

  it("can emit map-neutral adapter events", () => {
    const adapter = new FakeRendererAdapter();
    const seen: Array<{ lat: number; lon: number }> = [];

    const unsubscribe = adapter.on("pointerDown", (event) => {
      seen.push(event.coordinate);
    });

    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    unsubscribe();
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });

    expect(seen).toEqual([{ lat: 1, lon: 2 }]);
  });
});
