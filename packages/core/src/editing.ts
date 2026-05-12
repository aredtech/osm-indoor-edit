import type { Coordinate } from "./adapter";
import { OsmIndoorError } from "./errors";
import type { GeometryType } from "./feature-store";

export interface CoordinateDelta {
  lat: number;
  lon: number;
}

export class VertexEditError extends OsmIndoorError {
  constructor(message: string) {
    super(message, "VERTEX_EDIT_ERROR");
  }
}

export function translateCoordinate(coordinate: Coordinate, delta: CoordinateDelta): Coordinate {
  return {
    lat: coordinate.lat + delta.lat,
    lon: coordinate.lon + delta.lon
  };
}

export function canDeleteVertex(geometryType: GeometryType, nodeCount: number): boolean {
  if (geometryType === "polygon") {
    return nodeCount > 3;
  }

  if (geometryType === "line") {
    return nodeCount > 2;
  }

  return false;
}
