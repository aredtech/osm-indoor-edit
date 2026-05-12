export interface FakeMapLibrePoint {
  x: number;
  y: number;
}

export interface FakeMapLibreLngLat {
  lng: number;
  lat: number;
}

export type FakeGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: Array<[number, number]> }
  | { type: "Polygon"; coordinates: Array<Array<[number, number]>> };

export interface FakeFeature {
  type: "Feature";
  geometry: FakeGeometry;
  properties?: Record<string, unknown>;
}

export interface FakeFeatureCollection {
  type: "FeatureCollection";
  features: FakeFeature[];
}

export interface FakeGeoJSONSource {
  type: "geojson";
  data: FakeFeatureCollection;
  setData(data: FakeFeatureCollection): void;
}

type Listener = (event: Record<string, unknown>) => void;

export class FakeMapLibreMap {
  readonly sources = new Map<string, FakeGeoJSONSource>();
  readonly layers = new Map<string, Record<string, unknown>>();
  readonly dragPan = {
    disabled: 0,
    enabled: 0,
    disable: () => {
      this.dragPan.disabled += 1;
    },
    enable: () => {
      this.dragPan.enabled += 1;
    }
  };

  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly layerListeners = new Map<string, Map<string, Set<Listener>>>();
  private renderedFeatures: FakeFeature[] = [];

  on(eventName: string, layerOrHandler: string | Listener, maybeHandler?: Listener): void {
    if (typeof layerOrHandler === "string") {
      const byLayer = this.layerListeners.get(eventName) ?? new Map<string, Set<Listener>>();
      const listeners = byLayer.get(layerOrHandler) ?? new Set<Listener>();
      listeners.add(maybeHandler as Listener);
      byLayer.set(layerOrHandler, listeners);
      this.layerListeners.set(eventName, byLayer);
      return;
    }

    const listeners = this.listeners.get(eventName) ?? new Set<Listener>();
    listeners.add(layerOrHandler);
    this.listeners.set(eventName, listeners);
  }

  off(eventName: string, layerOrHandler: string | Listener, maybeHandler?: Listener): void {
    if (typeof layerOrHandler === "string") {
      this.layerListeners.get(eventName)?.get(layerOrHandler)?.delete(maybeHandler as Listener);
      return;
    }

    this.listeners.get(eventName)?.delete(layerOrHandler);
  }

  addSource(id: string, source: { type: "geojson"; data: FakeFeatureCollection }): void {
    const fakeSource: FakeGeoJSONSource = {
      type: "geojson",
      data: source.data,
      setData(data) {
        this.data = data;
      }
    };
    this.sources.set(id, fakeSource);
  }

  getSource(id: string): FakeGeoJSONSource | undefined {
    return this.sources.get(id);
  }

  removeSource(id: string): void {
    this.sources.delete(id);
  }

  addLayer(layer: Record<string, unknown>): void {
    this.layers.set(layer.id as string, layer);
  }

  getLayer(id: string): Record<string, unknown> | undefined {
    return this.layers.get(id);
  }

  removeLayer(id: string): void {
    this.layers.delete(id);
  }

  project(lngLat: [number, number] | FakeMapLibreLngLat): FakeMapLibrePoint {
    const lon = Array.isArray(lngLat) ? lngLat[0] : lngLat.lng;
    const lat = Array.isArray(lngLat) ? lngLat[1] : lngLat.lat;
    return { x: lon, y: lat };
  }

  unproject(point: FakeMapLibrePoint): FakeMapLibreLngLat {
    return { lng: point.x, lat: point.y };
  }

  queryRenderedFeatures(): FakeFeature[] {
    return this.renderedFeatures;
  }

  setRenderedFeatures(features: FakeFeature[]): void {
    this.renderedFeatures = features;
  }

  fire(eventName: string, event: Record<string, unknown> = {}): void {
    for (const listener of this.listeners.get(eventName) ?? []) {
      listener(event);
    }
  }

  fireLayer(eventName: string, layerId: string, event: Record<string, unknown> = {}): void {
    for (const listener of this.layerListeners.get(eventName)?.get(layerId) ?? []) {
      listener(event);
    }
  }

  listenerCount(eventName: string): number {
    return this.listeners.get(eventName)?.size ?? 0;
  }
}

export function feature(
  geometry: FakeGeometry,
  properties: Record<string, unknown> = {}
): FakeFeature {
  return { type: "Feature", geometry, properties };
}
