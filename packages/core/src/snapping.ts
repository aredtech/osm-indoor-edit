import type { Coordinate, ScreenPoint } from "./adapter";
import type { PrimitiveId } from "./types";

export const DEFAULT_SNAP_TOLERANCE_PX = 12;

export interface SnapSettings {
  enabled: boolean;
  tolerancePx: number;
}

export interface NodeSnapCandidate {
  kind: "node";
  nodeId: PrimitiveId;
  coordinate: Coordinate;
}

export interface EdgeSnapCandidate {
  kind: "edge";
  wayId: PrimitiveId;
  edgeIndex: number;
  fromNodeId: PrimitiveId;
  toNodeId: PrimitiveId;
  from: Coordinate;
  to: Coordinate;
}

export type SnapCandidate = NodeSnapCandidate | EdgeSnapCandidate;

export type ResolvedSnap =
  | (NodeSnapCandidate & { coordinate: Coordinate; distancePx: number })
  | (EdgeSnapCandidate & { coordinate: Coordinate; distancePx: number });

export function resolveSnapCandidate(
  pointer: Coordinate,
  candidates: readonly SnapCandidate[],
  project: (coordinate: Coordinate) => ScreenPoint,
  tolerancePx: number = DEFAULT_SNAP_TOLERANCE_PX
): ResolvedSnap | undefined {
  const pointerPoint = project(pointer);
  let nearest: ResolvedSnap | undefined;

  for (const candidate of candidates) {
    const resolved = resolveCandidate(pointerPoint, candidate, project);
    if (resolved.distancePx > tolerancePx) {
      continue;
    }

    if (!nearest || resolved.distancePx < nearest.distancePx) {
      nearest = resolved;
    }
  }

  return nearest;
}

function resolveCandidate(
  pointerPoint: ScreenPoint,
  candidate: SnapCandidate,
  project: (coordinate: Coordinate) => ScreenPoint
): ResolvedSnap {
  if (candidate.kind === "node") {
    return {
      ...candidate,
      coordinate: { ...candidate.coordinate },
      distancePx: distance(pointerPoint, project(candidate.coordinate))
    };
  }

  const fromPoint = project(candidate.from);
  const toPoint = project(candidate.to);
  const projection = projectPointToSegment(pointerPoint, fromPoint, toPoint);

  return {
    ...candidate,
    from: { ...candidate.from },
    to: { ...candidate.to },
    coordinate: interpolateCoordinate(candidate.from, candidate.to, projection.t),
    distancePx: distance(pointerPoint, projection.point)
  };
}

function projectPointToSegment(
  point: ScreenPoint,
  from: ScreenPoint,
  to: ScreenPoint
): { point: ScreenPoint; t: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return { point: { ...from }, t: 0 };
  }

  const rawT = ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  return {
    point: {
      x: from.x + dx * t,
      y: from.y + dy * t
    },
    t
  };
}

function interpolateCoordinate(from: Coordinate, to: Coordinate, t: number): Coordinate {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lon: from.lon + (to.lon - from.lon) * t
  };
}

function distance(left: ScreenPoint, right: ScreenPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
