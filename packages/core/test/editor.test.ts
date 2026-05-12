import { describe, expect, it } from "vitest";
import {
  createEditor,
  ElementIdAllocator,
  fixedClock,
  type OsmInEditExport,
  type RendererAdapter
} from "../src";

function createAdapter(): RendererAdapter & { attached: boolean; detached: boolean } {
  return {
    attached: false,
    detached: false,
    attach() {
      this.attached = true;
    },
    detach() {
      this.detached = true;
    },
    on() {
      return () => undefined;
    },
    off() {
      return undefined;
    },
    showTemporaryFeature() {
      return undefined;
    },
    clearTemporaryFeature() {
      return undefined;
    },
    commitFeature() {
      return undefined;
    },
    updateFeature() {
      return undefined;
    },
    removeFeature() {
      return undefined;
    },
    showVertexHandles() {
      return undefined;
    },
    clearVertexHandles() {
      return undefined;
    },
    setSelectedFeature() {
      return undefined;
    },
    project(coordinate) {
      return { x: coordinate.lon, y: coordinate.lat };
    },
    unproject(point) {
      return { lat: point.y, lon: point.x };
    }
  };
}

const fixture: OsmInEditExport = {
  status: true,
  elements: [
    {
      type: "way",
      id: 10,
      nodes: [1, 2, 3, 1],
      tags: { indoor: "room", level: "0" },
      timestamp: "2026-05-11T16:40:41Z"
    },
    {
      type: "node",
      id: 1,
      lat: 28.3918376,
      lon: 77.2923857,
      tags: {},
      timestamp: "2026-05-11T16:40:38Z"
    },
    {
      type: "node",
      id: 2,
      lat: 28.3918377,
      lon: 77.2923858,
      tags: {},
      timestamp: "2026-05-11T16:40:39Z"
    },
    {
      type: "node",
      id: 3,
      lat: 28.3918378,
      lon: 77.2923859,
      tags: {},
      timestamp: "2026-05-11T16:40:40Z"
    }
  ]
};

describe("createEditor", () => {
  it("creates and destroys an adapter-backed editor", () => {
    const adapter = createAdapter();
    const editor = createEditor({ adapter, target: { id: "map" } });

    expect(adapter.attached).toBe(true);
    expect(editor.getState().destroyed).toBe(false);

    editor.destroy();

    expect(adapter.detached).toBe(true);
    expect(editor.getState().destroyed).toBe(true);
  });

  it("emits level events through the editor", () => {
    const editor = createEditor({ defaultLevel: "0" });
    const levels: Array<string | undefined> = [];

    editor.on("levelChanged", (payload) => levels.push(payload.level));
    editor.setLevel("1");

    expect(editor.getLevel()).toBe("1");
    expect(levels).toEqual(["1"]);
  });

  it("loads and exports OsmInEdit elements in deterministic order", () => {
    const editor = createEditor({
      ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
      clock: fixedClock("2026-05-11T16:40:38.000Z")
    });

    editor.loadOsmInEdit(fixture);

    expect(editor.getElements().map((element) => element.type)).toEqual([
      "node",
      "node",
      "node",
      "way"
    ]);
    expect(editor.exportOsmInEdit().status).toBe(true);
  });

  it("returns immutable state and element snapshots", () => {
    const editor = createEditor();
    editor.loadOsmInEdit(fixture);

    const state = editor.getState();
    const elements = editor.getElements();

    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.features)).toBe(true);
    expect(Object.isFrozen(elements)).toBe(true);
    expect(() => (state.features as unknown[]).push({})).toThrow();
    expect(() => (elements as unknown[]).push({})).toThrow();
  });

  it("validates through the Phase 3 advisory validation API", () => {
    const editor = createEditor();

    expect(editor.validate()).toEqual({ valid: true, issues: [] });
  });
});
