import { describe, expect, it } from "vitest";
import {
  DEFAULT_SNAP_TOLERANCE_PX,
  collectSnapCandidates,
  resolveSnapCandidate,
  type Coordinate,
  type ScreenPoint,
  type SnapCandidate
} from "../src";

const project = (coordinate: Coordinate): ScreenPoint => ({
  x: coordinate.lon,
  y: coordinate.lat
});

describe("resolveSnapCandidate", () => {
  it("chooses the nearest node candidate inside tolerance", () => {
    const candidates: SnapCandidate[] = [
      { kind: "node", nodeId: 1, coordinate: { lat: 0, lon: 0 } },
      { kind: "node", nodeId: 2, coordinate: { lat: 4, lon: 3 } }
    ];

    const resolved = resolveSnapCandidate({ lat: 5, lon: 3 }, candidates, project);

    expect(DEFAULT_SNAP_TOLERANCE_PX).toBe(12);
    expect(resolved).toMatchObject({
      kind: "node",
      nodeId: 2,
      coordinate: { lat: 4, lon: 3 },
      distancePx: 1
    });
  });

  it("projects an edge snap to the nearest point on that edge", () => {
    const candidates: SnapCandidate[] = [
      {
        kind: "edge",
        wayId: 10,
        edgeIndex: 0,
        fromNodeId: 1,
        toNodeId: 2,
        from: { lat: 0, lon: 0 },
        to: { lat: 0, lon: 10 }
      }
    ];

    const resolved = resolveSnapCandidate({ lat: 3, lon: 4 }, candidates, project);

    expect(resolved).toMatchObject({
      kind: "edge",
      wayId: 10,
      edgeIndex: 0,
      coordinate: { lat: 0, lon: 4 },
      distancePx: 3
    });
  });

  it("breaks node and edge ties by shortest pixel distance", () => {
    const candidates: SnapCandidate[] = [
      {
        kind: "edge",
        wayId: 10,
        edgeIndex: 0,
        fromNodeId: 1,
        toNodeId: 2,
        from: { lat: 0, lon: 0 },
        to: { lat: 0, lon: 10 }
      },
      { kind: "node", nodeId: 3, coordinate: { lat: 1, lon: 5 } }
    ];

    const resolved = resolveSnapCandidate({ lat: 2, lon: 5 }, candidates, project);

    expect(resolved).toMatchObject({ kind: "node", nodeId: 3, distancePx: 1 });
  });

  it("returns no result outside tolerance", () => {
    const candidates: SnapCandidate[] = [
      { kind: "node", nodeId: 1, coordinate: { lat: 0, lon: 0 } }
    ];

    expect(resolveSnapCandidate({ lat: 20, lon: 20 }, candidates, project, 5)).toBeUndefined();
  });
});

describe("collectSnapCandidates", () => {
  it("includes nodes and one candidate per editable edge", () => {
    const candidates = collectSnapCandidates([
      {
        type: "node",
        id: 1,
        lat: 0,
        lon: 0,
        tags: {},
        timestamp: "2026-05-12T09:00:00Z"
      },
      {
        type: "node",
        id: 2,
        lat: 0,
        lon: 10,
        tags: {},
        timestamp: "2026-05-12T09:00:00Z"
      },
      {
        type: "node",
        id: 3,
        lat: 10,
        lon: 10,
        tags: {},
        timestamp: "2026-05-12T09:00:00Z"
      },
      {
        type: "way",
        id: 10,
        nodes: [1, 2, 3, 1],
        tags: { indoor: "room" },
        timestamp: "2026-05-12T09:00:00Z"
      }
    ]);

    expect(candidates.filter((candidate) => candidate.kind === "node")).toHaveLength(3);
    expect(candidates.filter((candidate) => candidate.kind === "edge")).toMatchObject([
      { kind: "edge", wayId: 10, edgeIndex: 0, fromNodeId: 1, toNodeId: 2 },
      { kind: "edge", wayId: 10, edgeIndex: 1, fromNodeId: 2, toNodeId: 3 },
      { kind: "edge", wayId: 10, edgeIndex: 2, fromNodeId: 3, toNodeId: 1 }
    ]);
  });
});
