import type { Coordinate, TemporaryGeometry } from "./adapter";
import type { PrimitiveId, Tags } from "./types";

export type DrawKind = "room" | "corridor" | "poi";
export type DefaultTagsConfig =
  | Partial<Record<DrawKind, Tags>>
  | ((kind: DrawKind, level: string) => Tags);

export interface StartDrawOptions {
  tags?: Tags;
}

export interface DraftDrawingState {
  kind: DrawKind;
  level: string;
  tags: Tags;
  coordinates: Coordinate[];
  nodeIds?: Array<PrimitiveId | undefined>;
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

export function getMinimumPointCount(kind: DrawKind): number {
  return kind === "poi" ? 1 : 3;
}

export function buildTemporaryGeometry(
  draft: DraftDrawingState,
  previewCoordinate?: Coordinate
): TemporaryGeometry | undefined {
  if (draft.coordinates.length === 0) {
    return undefined;
  }

  if (draft.kind === "poi") {
    return {
      geometryType: "point",
      coordinates: draft.coordinates.slice(0, 1),
      vertexCoordinates: draft.coordinates.slice(0, 1)
    };
  }

  const previewCoordinates = buildPreviewCoordinates(draft.coordinates, previewCoordinate);
  const vertexCoordinates = [...draft.coordinates];

  if (draft.coordinates.length >= getMinimumPointCount(draft.kind)) {
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
  previewCoordinate: Coordinate | undefined
): Coordinate[] | undefined {
  if (!previewCoordinate || coordinates.length === 0) {
    return undefined;
  }

  const last = coordinates[coordinates.length - 1];
  if (coordinates.length >= 3) {
    return [last, previewCoordinate, coordinates[0]];
  }

  return [last, previewCoordinate];
}
