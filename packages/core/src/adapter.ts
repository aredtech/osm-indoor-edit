import type { FeatureRecord } from "./feature-store";
import type { ResolvedSnap } from "./snapping";

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface TemporaryGeometry {
  geometryType: "point" | "line" | "polygon";
  coordinates: Coordinate[];
  previewCoordinates?: Coordinate[];
}

export interface VertexHandle {
  id: string;
  coordinate: Coordinate;
}

export interface RendererAdapterEventMap {
  pointerDown: { coordinate: Coordinate; originalEvent?: unknown };
  pointerMove: { coordinate: Coordinate; originalEvent?: unknown };
  pointerUp: { coordinate: Coordinate; originalEvent?: unknown };
  featureClick: { featureId: string; coordinate: Coordinate; originalEvent?: unknown };
  featureDrag: {
    featureId: string;
    from: Coordinate;
    to: Coordinate;
    originalEvent?: unknown;
  };
  vertexDrag: {
    featureId: string;
    vertexIndex: number;
    coordinate: Coordinate;
    originalEvent?: unknown;
  };
  draftVertexDrag: {
    vertexIndex: number;
    coordinate: Coordinate;
    originalEvent?: unknown;
  };
  midpointClick: {
    featureId: string;
    edgeIndex: number;
    coordinate: Coordinate;
    originalEvent?: unknown;
  };
}

export interface RendererAdapter {
  attach(target: unknown): void;
  detach(): void;
  on<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    handler: (event: RendererAdapterEventMap[TName]) => void
  ): () => void;
  off<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    handler: (event: RendererAdapterEventMap[TName]) => void
  ): void;
  showTemporaryFeature(id: string, geometry: TemporaryGeometry): void;
  clearTemporaryFeature(id?: string): void;
  commitFeature(feature: FeatureRecord): void;
  updateFeature(feature: FeatureRecord): void;
  removeFeature(featureId: string): void;
  showVertexHandles(featureId: string, handles: VertexHandle[]): void;
  clearVertexHandles(featureId?: string): void;
  setSelectedFeature(featureId: string | null): void;
  setLevel?(level: string | undefined): void;
  showSnapCandidate?(candidate: ResolvedSnap): void;
  clearSnapCandidate?(): void;
  project(coordinate: Coordinate): ScreenPoint;
  unproject(point: ScreenPoint): Coordinate;
}
