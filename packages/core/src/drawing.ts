import type { Coordinate, TemporaryGeometry } from "./adapter";
import type { PrimitiveId, Tags } from "./types";

export type DrawKind = "room" | "corridor" | "poi" | "custom";
export type DrawGeometryType = "point" | "line" | "polygon";
export type DefaultTagsConfig =
  | Partial<Record<DrawKind, Tags>>
  | ((kind: DrawKind, level: string) => Tags);

export interface StartDrawOptions {
  tags?: Tags;
  geometryType?: DrawGeometryType;
  presetId?: string;
}

export interface DraftDrawingState {
  kind: DrawKind;
  geometryType: DrawGeometryType;
  level: string;
  tags: Tags;
  coordinates: Coordinate[];
  nodeIds?: Array<PrimitiveId | undefined>;
  presetId?: string;
}

export function createMinimumTags(kind: DrawKind, level: string, hostTags: Tags = {}): Tags {
  if (kind === "room") {
    return { ...hostTags, indoor: "room", level };
  }

  if (kind === "corridor") {
    return { ...hostTags, indoor: "corridor", level };
  }

  return { ...hostTags, level };
}

export function resolveDrawGeometry(kind: DrawKind, options: StartDrawOptions = {}): DrawGeometryType {
  if (kind === "poi") {
    return "point";
  }

  if (kind === "room" || kind === "corridor") {
    return "polygon";
  }

  if (!options.geometryType) {
    throw new Error('Custom drawing requires options.geometryType.');
  }

  return options.geometryType;
}

export function getMinimumPointCount(kindOrGeometry: DrawKind | DrawGeometryType): number {
  if (kindOrGeometry === "point" || kindOrGeometry === "poi") {
    return 1;
  }

  if (kindOrGeometry === "line") {
    return 2;
  }

  return 3;
}

export function buildTemporaryGeometry(
  draft: DraftDrawingState,
  previewCoordinate?: Coordinate
): TemporaryGeometry | undefined {
  if (draft.coordinates.length === 0) {
    return undefined;
  }

  const geometryType = draft.geometryType ?? resolveDrawGeometry(draft.kind);

  if (geometryType === "point") {
    return {
      geometryType: "point",
      coordinates: draft.coordinates.slice(0, 1),
      vertexCoordinates: draft.coordinates.slice(0, 1)
    };
  }

  const previewCoordinates = buildPreviewCoordinates(draft.coordinates, previewCoordinate, geometryType);
  const vertexCoordinates = [...draft.coordinates];

  if (geometryType === "polygon" && draft.coordinates.length >= getMinimumPointCount(geometryType)) {
    return {
      geometryType: "polygon",
      coordinates: [...draft.coordinates, draft.coordinates[0]],
      vertexCoordinates,
      ...(previewCoordinates ? { previewCoordinates } : {})
    };
  }

  return {
    geometryType: "line",
    coordinates: [...draft.coordinates],
    vertexCoordinates,
    ...(previewCoordinates ? { previewCoordinates } : {})
  };
}

function buildPreviewCoordinates(
  coordinates: Coordinate[],
  previewCoordinate: Coordinate | undefined,
  geometryType: DrawGeometryType
): Coordinate[] | undefined {
  if (!previewCoordinate || coordinates.length === 0) {
    return undefined;
  }

  const last = coordinates[coordinates.length - 1];
  if (geometryType === "polygon" && coordinates.length >= 3) {
    return [last, previewCoordinate, coordinates[0]];
  }

  return [last, previewCoordinate];
}
