import type {
  Coordinate,
  RendererAdapter,
  RendererAdapterEventMap,
  ScreenPoint,
  TemporaryGeometry,
  VertexHandle
} from "./adapter";
import type { FeatureRecord } from "./feature-store";

export interface FakeAdapterCall {
  name: string;
  args: unknown[];
}

export class FakeRendererAdapter implements RendererAdapter {
  readonly calls: FakeAdapterCall[] = [];
  attachedTarget: unknown;
  selectedFeatureId: string | null = null;
  private readonly handlers = new Map<
    keyof RendererAdapterEventMap,
    Set<(event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void>
  >();

  attach(target: unknown): void {
    this.attachedTarget = target;
    this.record("attach", target);
  }

  detach(): void {
    this.record("detach");
    this.attachedTarget = undefined;
  }

  on<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    handler: (event: RendererAdapterEventMap[TName]) => void
  ): () => void {
    const handlers =
      this.handlers.get(eventName) ??
      new Set<(event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void>();
    handlers.add(handler as (event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void);
    this.handlers.set(eventName, handlers);
    this.record("on", eventName);

    return () => this.off(eventName, handler);
  }

  off<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    handler: (event: RendererAdapterEventMap[TName]) => void
  ): void {
    this.handlers
      .get(eventName)
      ?.delete(handler as (event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void);
    this.record("off", eventName);
  }

  emit<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    event: RendererAdapterEventMap[TName]
  ): void {
    for (const handler of this.handlers.get(eventName) ?? []) {
      (handler as (payload: RendererAdapterEventMap[TName]) => void)(event);
    }
  }

  showTemporaryFeature(id: string, geometry: TemporaryGeometry): void {
    this.record("showTemporaryFeature", id, geometry);
  }

  clearTemporaryFeature(id?: string): void {
    this.record("clearTemporaryFeature", id);
  }

  commitFeature(feature: FeatureRecord): void {
    this.record("commitFeature", feature);
  }

  updateFeature(feature: FeatureRecord): void {
    this.record("updateFeature", feature);
  }

  removeFeature(featureId: string): void {
    this.record("removeFeature", featureId);
  }

  showVertexHandles(featureId: string, handles: VertexHandle[]): void {
    this.record("showVertexHandles", featureId, handles);
  }

  clearVertexHandles(featureId?: string): void {
    this.record("clearVertexHandles", featureId);
  }

  setSelectedFeature(featureId: string | null): void {
    this.selectedFeatureId = featureId;
    this.record("setSelectedFeature", featureId);
  }

  setLevel(level: string | undefined): void {
    this.record("setLevel", level);
  }

  project(coordinate: Coordinate): ScreenPoint {
    this.record("project", coordinate);
    return { x: coordinate.lon, y: coordinate.lat };
  }

  unproject(point: ScreenPoint): Coordinate {
    this.record("unproject", point);
    return { lat: point.y, lon: point.x };
  }

  private record(name: string, ...args: unknown[]): void {
    this.calls.push({ name, args });
  }
}
