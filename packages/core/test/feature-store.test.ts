import { describe, expect, it } from "vitest";
import { FeatureStore, inferFeatureKind, type OsmWay } from "../src";

const roomWay: OsmWay = {
  type: "way",
  id: 1000000000800000,
  nodes: [1, 2, 3, 1],
  tags: { indoor: "room", level: "0" },
  timestamp: "2026-05-11T16:40:41Z"
};

describe("FeatureStore", () => {
  it("creates local feature IDs that differ from primitive IDs", () => {
    const store = new FeatureStore();

    const feature = store.add({
      kind: "room",
      geometryType: "polygon",
      level: "0",
      tags: roomWay.tags,
      primitiveRefs: { nodeIds: roomWay.nodes, wayId: roomWay.id, relationIds: [] }
    });

    expect(feature.id).toBe("feature-1");
    expect(feature.id).not.toBe(String(roomWay.id));
    expect(feature.primitiveRefs.wayId).toBe(roomWay.id);
  });

  it("infers room, corridor, and custom feature kinds cautiously", () => {
    expect(inferFeatureKind({ indoor: "room" })).toBe("room");
    expect(inferFeatureKind({ indoor: "corridor" })).toBe("corridor");
    expect(inferFeatureKind({ indoor: "level" })).toBe("floor-outline");
    expect(inferFeatureKind({ building: "yes" })).toBe("building-outline");
    expect(inferFeatureKind({ "building:part": "yes" })).toBe("building-outline");
    expect(inferFeatureKind({ highway: "service" })).toBe("custom");
  });

  it("rebuilds indoor=level and building-outline features from ways and relations", () => {
    const store = new FeatureStore();

    const features = store.rebuildFromElements([
      { ...roomWay, id: 201, tags: { indoor: "level", level: "0" } },
      {
        type: "relation",
        id: 300,
        members: [{ type: "node", ref: 1, role: "label" }],
        tags: { building: "yes", level: "0" },
        timestamp: "2026-05-11T16:40:42Z"
      }
    ]);

    expect(features).toMatchObject([
      { kind: "floor-outline", primitiveRefs: { wayId: 201 } },
      {
        kind: "building-outline",
        geometryType: "relation",
        primitiveRefs: { nodeIds: [1], relationIds: [300] }
      }
    ]);
  });

  it("imports unknown ways as custom feature records", () => {
    const store = new FeatureStore();

    const features = store.rebuildFromElements([
      {
        ...roomWay,
        id: 200,
        tags: { highway: "corridorish" }
      }
    ]);

    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      kind: "custom",
      geometryType: "polygon",
      primitiveRefs: { wayId: 200, relationIds: [] }
    });
  });

  it("returns cloned records from get and list", () => {
    const store = new FeatureStore();
    const feature = store.add({
      kind: "custom",
      geometryType: "line",
      tags: { level: "1" },
      primitiveRefs: { nodeIds: [1, 2], wayId: 10, relationIds: [] }
    });

    const listed = store.list();
    listed[0]?.primitiveRefs.nodeIds.push(99);

    expect(store.get(feature.id)?.primitiveRefs.nodeIds).toEqual([1, 2]);
  });

  it("findByNodeId, findByWayId, and findByRelationId return cloned matches", () => {
    const store = new FeatureStore();
    const first = store.add({
      kind: "room",
      geometryType: "polygon",
      primitiveRefs: { nodeIds: [1, 2, 3, 1], wayId: 10, relationIds: [] }
    });
    store.add({
      kind: "room",
      geometryType: "polygon",
      primitiveRefs: { nodeIds: [3, 4, 5, 3], wayId: 11, relationIds: [20] }
    });

    const byNode = store.findByNodeId(3);
    byNode[0]?.primitiveRefs.nodeIds.push(99);

    expect(byNode.map((feature) => feature.id)).toEqual([first.id, "feature-2"]);
    expect(store.findByNodeId(3)[0]?.primitiveRefs.nodeIds).toEqual([1, 2, 3, 1]);
    expect(store.findByWayId(10)?.id).toBe(first.id);
    expect(store.findByRelationId(20).map((feature) => feature.id)).toEqual(["feature-2"]);
  });
});
