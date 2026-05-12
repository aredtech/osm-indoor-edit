import { describe, expect, it } from "vitest";
import {
  DEFAULT_SNAP_TOLERANCE_PX,
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
