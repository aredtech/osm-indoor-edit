import { describe, expect, it } from "vitest";
import {
  DataIntegrityError,
  ElementIdAllocator,
  fixedClock,
  PrimitiveStore,
  canDeleteVertex,
  type OsmNode,
  type OsmRelation,
  type OsmWay
} from "../src";

const nodeA: OsmNode = {
  type: "node",
  id: 1,
  lat: 28.3918376,
  lon: 77.2923857,
  tags: { level: "0" },
  timestamp: "2026-05-11T16:40:38Z"
};

const nodeB: OsmNode = {
  type: "node",
  id: 2,
  lat: 28.3918377,
  lon: 77.2923858,
  tags: { level: "0" },
  timestamp: "2026-05-11T16:40:39Z"
};

const nodeC: OsmNode = {
  type: "node",
  id: 3,
  lat: 28.3918378,
  lon: 77.2923859,
  tags: { level: "0" },
  timestamp: "2026-05-11T16:40:40Z"
};

const closedWay: OsmWay = {
  type: "way",
  id: 10,
  nodes: [1, 2, 3, 1],
  tags: { indoor: "room", level: "0" },
  timestamp: "2026-05-11T16:40:41Z",
  featureTypeId: 1
};

describe("PrimitiveStore", () => {
  it("preserves imported timestamps and exports nodes, ways, then relations", () => {
    const store = new PrimitiveStore();
    store.importElement(nodeC);
    store.importElement(nodeA);
    store.importElement(nodeB);
    store.importElement(closedWay);

    const relation: OsmRelation = {
      type: "relation",
      id: 20,
      members: [{ type: "way", ref: 10, role: "outer" }],
      tags: { type: "multipolygon" },
      timestamp: "2026-05-11T16:40:42Z"
    };
    store.importElement(relation);

    const exported = store.exportOsmInEdit();

    expect(exported.status).toBe(true);
    expect(exported.elements.map((element) => element.type)).toEqual([
      "node",
      "node",
      "node",
      "way",
      "relation"
    ]);
    expect(exported.elements[0]?.timestamp).toBe("2026-05-11T16:40:38Z");
    expect(exported.elements[3]).toMatchObject({ type: "way", nodes: [1, 2, 3, 1] });
  });

  it("creates deterministic primitives with injected IDs and fixed clock", () => {
    const store = new PrimitiveStore({
      ids: new ElementIdAllocator({ nodeStart: 100, wayStart: 200, relationStart: 300 }),
      clock: fixedClock("2026-05-11T16:40:38.000Z")
    });

    const first = store.createNode({ lat: 1, lon: 2 });
    const second = store.createNode({ lat: 3, lon: 4 });
    const third = store.createNode({ lat: 5, lon: 6 });
    const way = store.createWay({
      nodes: [first.id, second.id, third.id, first.id],
      tags: { indoor: "room" }
    });

    expect(first.id).toBe(100);
    expect(way.id).toBe(200);
    expect(way.timestamp).toBe("2026-05-11T16:40:38.000Z");
  });

  it("throws DataIntegrityError for a missing closed way node reference", () => {
    const store = new PrimitiveStore();

    expect(() =>
      store.importElement({
        type: "way",
        id: 10,
        nodes: [1, 2, 1],
        tags: { indoor: "room" },
        timestamp: "2026-05-11T16:40:41Z"
      })
    ).toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for an unclosed closed area way", () => {
    const store = new PrimitiveStore();
    store.importElement(nodeA);
    store.importElement(nodeB);
    store.importElement(nodeC);

    expect(() =>
      store.importElement({
        type: "way",
        id: 10,
        nodes: [1, 2, 3],
        tags: { indoor: "room" },
        timestamp: "2026-05-11T16:40:41Z"
      })
    ).toThrow(DataIntegrityError);
  });

  it("updates node coordinates", () => {
    const store = new PrimitiveStore();
    store.importElement(nodeA);

    const updated = store.updateNodeCoordinate(1, { lat: 10, lon: 20 });

    expect(updated).toMatchObject({ id: 1, lat: 10, lon: 20 });
    expect(store.getNode(1)).toMatchObject({ lat: 10, lon: 20 });
  });

  it("updates way nodes and preserves closed area closure", () => {
    const store = new PrimitiveStore();
    store.importElement(nodeA);
    store.importElement(nodeB);
    store.importElement(nodeC);
    const nodeD = store.createNode({ lat: 28.391838, lon: 77.292386 });
    store.importElement(closedWay);

    const updated = store.updateWayNodes(10, [1, 2, nodeD.id, 3]);

    expect(updated.nodes).toEqual([1, 2, nodeD.id, 3, 1]);
  });

  it("updates element tags", () => {
    const store = new PrimitiveStore();
    store.importElement(nodeA);

    const updated = store.updateElementTags("node", 1, { amenity: "bench" });

    expect(updated).toMatchObject({ type: "node", tags: { amenity: "bench" } });
  });

  it("deletes elements when they are not referenced", () => {
    const store = new PrimitiveStore();
    store.importElement(nodeA);

    expect(store.deleteElement("node", 1)).toBe(true);
    expect(store.getNode(1)).toBeUndefined();
  });

  it("rejects invalid polygon vertex deletion", () => {
    const store = new PrimitiveStore();
    store.importElement(nodeA);
    store.importElement(nodeB);
    store.importElement(nodeC);
    store.importElement(closedWay);

    expect(canDeleteVertex("polygon", 3)).toBe(false);
    expect(() => store.updateWayNodes(10, [1, 2])).toThrow(DataIntegrityError);
  });
});
