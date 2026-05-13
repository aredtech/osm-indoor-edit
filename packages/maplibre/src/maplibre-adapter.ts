import type {
  Coordinate,
  RendererAdapter,
  RendererAdapterEventMap,
  ResolvedSnap,
  ScreenPoint,
  TemporaryGeometry,
  VertexHandle
} from "@aredtech/osm-indoor-edit";
import { isFeatureVisibleOnLevel, type FeatureRecord } from "@aredtech/osm-indoor-edit";
import {
  type MapLibreEditingStyles,
  type MapLibreEditingStyleOverrides,
  mergeMapLibreEditingStyles
} from "./styles";

type Geometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: Array<[number, number]> }
  | { type: "Polygon"; coordinates: Array<Array<[number, number]>> };

interface GeoJSONFeature {
  type: "Feature";
  geometry: Geometry;
  properties: Record<string, unknown>;
}

interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface MapLibreSource {
  setData(data: FeatureCollection): void;
}

interface MapLibrePoint {
  x: number;
  y: number;
}

interface MapLibreLngLat {
  lng: number;
  lat: number;
}

interface MapLibreLikeMap {
  on(eventName: string, handler: (event: Record<string, unknown>) => void): void;
  on(eventName: string, layerId: string, handler: (event: Record<string, unknown>) => void): void;
  off(eventName: string, handler: (event: Record<string, unknown>) => void): void;
  off(eventName: string, layerId: string, handler: (event: Record<string, unknown>) => void): void;
  addSource(id: string, source: { type: "geojson"; data: FeatureCollection }): void;
  getSource(id: string): MapLibreSource | undefined;
  removeSource(id: string): void;
  addLayer(layer: Record<string, unknown>): void;
  getLayer(id: string): unknown;
  removeLayer(id: string): void;
  project(lngLat: [number, number] | MapLibreLngLat): MapLibrePoint;
  unproject(point: ScreenPoint): MapLibreLngLat;
  queryRenderedFeatures?(
    point?: unknown,
    options?: { layers?: string[] }
  ): Array<{ properties?: Record<string, unknown>; geometry?: unknown }>;
  dragPan?: {
    disable(): void;
    enable(): void;
  };
}

type HandlerSet = Set<(event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void>;
type SourceName = "draft" | "committed" | "selection" | "handles" | "snap";

interface MapListener {
  eventName: string;
  handler: (event: Record<string, unknown>) => void;
  layerId?: string;
}

type ActiveDrag =
  | { kind: "vertex"; featureId: string; vertexIndex: number }
  | { kind: "draftVertex"; vertexIndex: number }
  | { kind: "feature"; featureId: string; from: Coordinate };

export interface MapLibreAdapterOptions {
  styles?: MapLibreEditingStyleOverrides;
  sourcePrefix?: string;
}

const SOURCE_NAMES: SourceName[] = ["draft", "committed", "selection", "handles", "snap"];

export class MapLibreRendererAdapter implements RendererAdapter {
  readonly styles: MapLibreEditingStyles;
  readonly sourcePrefix: string;
  private map: MapLibreLikeMap | undefined;
  private readonly handlers = new Map<keyof RendererAdapterEventMap, HandlerSet>();
  private readonly listeners: MapListener[] = [];
  private readonly sourceData = new Map<SourceName, FeatureCollection>();
  private readonly committedFeatures = new Map<string, FeatureRecord>();
  private readonly handles = new Map<string, VertexHandle[]>();
  private selectedFeatureId: string | null = null;
  private currentLevel: string | undefined;
  private activeDrag: ActiveDrag | undefined;

  constructor(options: MapLibreAdapterOptions = {}) {
    this.sourcePrefix = options.sourcePrefix ?? "osminedit";
    this.styles = mergeMapLibreEditingStyles(options.styles);
    for (const sourceName of SOURCE_NAMES) {
      this.sourceData.set(sourceName, emptyCollection());
    }
  }

  attach(target: unknown): void {
    this.detach();
    const map = target as MapLibreLikeMap;
    if (!isMapLibreLikeMap(map)) {
      throw new TypeError("MapLibreRendererAdapter.attach expects a MapLibre Map target");
    }

    this.map = map;
    for (const sourceName of SOURCE_NAMES) {
      const sourceId = this.sourceId(sourceName);
      map.addSource(sourceId, { type: "geojson", data: this.getSourceData(sourceName) });
    }
    for (const layer of this.createLayers()) {
      map.addLayer(layer);
    }

    this.bindMapEvent("click", "pointerDown");
    this.bindMapEvent("mousemove", "pointerMove");
    this.bindMapEvent("mouseup", "pointerUp");
    this.bindLayerEvents();
  }

  detach(): void {
    if (!this.map) {
      return;
    }

    for (const listener of this.listeners) {
      if (listener.layerId) {
        this.map.off(listener.eventName, listener.layerId, listener.handler);
      } else {
        this.map.off(listener.eventName, listener.handler);
      }
    }
    this.listeners.length = 0;

    for (const layerId of [...this.getLayerIds()].reverse()) {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    }
    for (const sourceName of SOURCE_NAMES) {
      const sourceId = this.sourceId(sourceName);
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
      this.sourceData.set(sourceName, emptyCollection());
    }

    this.committedFeatures.clear();
    this.handles.clear();
    this.selectedFeatureId = null;
    this.currentLevel = undefined;
    this.activeDrag = undefined;
    this.map.dragPan?.enable();
    this.map = undefined;
  }

  on<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    handler: (event: RendererAdapterEventMap[TName]) => void
  ): () => void {
    const handlers = this.handlers.get(eventName) ?? new Set();
    handlers.add(handler as (event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void);
    this.handlers.set(eventName, handlers);
    return () => this.off(eventName, handler);
  }

  off<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    handler: (event: RendererAdapterEventMap[TName]) => void
  ): void {
    this.handlers
      .get(eventName)
      ?.delete(handler as (event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void);
  }

  showTemporaryFeature(_id: string, geometry: TemporaryGeometry): void {
    const features: GeoJSONFeature[] = [];
    const coordinates = geometry.coordinates.map(toPosition);
    if (geometry.geometryType === "polygon") {
      features.push(createFeature("Polygon", [coordinates], { role: "draft-fill" }));
      features.push(createFeature("LineString", coordinates, { role: "draft-line" }));
    } else if (geometry.geometryType === "line") {
      features.push(createFeature("LineString", coordinates, { role: "draft-line" }));
    }

    if (geometry.previewCoordinates && geometry.previewCoordinates.length >= 2) {
      features.push(
        createFeature("LineString", geometry.previewCoordinates.map(toPosition), {
          role: "draft-preview-line"
        })
      );
    }

    for (const [vertexIndex, coordinate] of getTemporaryVertexCoordinates(geometry).entries()) {
      features.push(
        createFeature("Point", toPosition(coordinate), { role: "draft-vertex", vertexIndex })
      );
    }
    this.setSourceData("draft", collection(features));
  }

  clearTemporaryFeature(): void {
    this.setSourceData("draft", emptyCollection());
  }

  commitFeature(feature: FeatureRecord): void {
    this.committedFeatures.set(feature.id, cloneFeature(feature));
    this.refreshCommittedSource();
  }

  updateFeature(feature: FeatureRecord): void {
    this.committedFeatures.set(feature.id, cloneFeature(feature));
    this.refreshCommittedSource();
    if (this.selectedFeatureId === feature.id) {
      this.refreshSelectionSource();
    }
  }

  removeFeature(featureId: string): void {
    this.committedFeatures.delete(featureId);
    this.handles.delete(featureId);
    if (this.selectedFeatureId === featureId) {
      this.selectedFeatureId = null;
    }
    this.refreshCommittedSource();
    this.refreshSelectionSource();
    this.refreshHandleSource();
  }

  showVertexHandles(featureId: string, handles: VertexHandle[]): void {
    this.handles.set(
      featureId,
      handles.map((handle) => ({ id: handle.id, coordinate: { ...handle.coordinate } }))
    );
    this.refreshHandleSource();
  }

  clearVertexHandles(featureId?: string): void {
    if (featureId) {
      this.handles.delete(featureId);
    } else {
      this.handles.clear();
    }
    this.refreshHandleSource();
  }

  setSelectedFeature(featureId: string | null): void {
    this.selectedFeatureId = featureId;
    this.refreshSelectionSource();
  }

  setLevel(level: string | undefined): void {
    this.currentLevel = level;
    this.refreshCommittedSource();
    this.refreshSelectionSource();
  }

  showSnapCandidate(candidate: ResolvedSnap): void {
    const features: GeoJSONFeature[] = [
      createFeature("Point", toPosition(candidate.coordinate), {
        role: "snap",
        snapKind: candidate.kind
      })
    ];
    if (candidate.kind === "edge") {
      features.push(
        createFeature("LineString", [toPosition(candidate.from), toPosition(candidate.coordinate), toPosition(candidate.to)], {
          role: "snap",
          snapKind: "edge",
          edgeIndex: candidate.edgeIndex
        })
      );
    }
    this.setSourceData("snap", collection(features));
  }

  clearSnapCandidate(): void {
    this.setSourceData("snap", emptyCollection());
  }

  project(coordinate: Coordinate): ScreenPoint {
    const point = this.requireMap().project([coordinate.lon, coordinate.lat]);
    return { x: point.x, y: point.y };
  }

  unproject(point: ScreenPoint): Coordinate {
    const lngLat = this.requireMap().unproject(point);
    return { lat: lngLat.lat, lon: lngLat.lng };
  }

  getSourceData(sourceName: SourceName): FeatureCollection {
    return cloneCollection(this.sourceData.get(sourceName) ?? emptyCollection());
  }

  getLayerIds(): string[] {
    return [
      "draft-fill",
      "draft-line",
      "draft-preview-line",
      "draft-vertex",
      "committed-fill",
      "committed-line",
      "committed-door",
      "committed-poi",
      "committed-point",
      "selection-fill",
      "selection-line",
      "selection-point",
      "handle-vertex",
      "handle-midpoint",
      "snap-line",
      "snap-point"
    ].map((name) => this.layerId(name));
  }

  private bindMapEvent(
    mapEventName: string,
    adapterEventName: "pointerDown" | "pointerMove" | "pointerUp"
  ): void {
    const handler = (event: Record<string, unknown>) => {
      const coordinate = coordinateFromEvent(event);
      this.handleDragMapEvent(mapEventName, coordinate, event);
      this.emit(adapterEventName, {
        coordinate,
        originalEvent: event
      });
    };
    this.requireMap().on(mapEventName, handler);
    this.listeners.push({ eventName: mapEventName, handler });
  }

  private bindLayerEvents(): void {
    for (const layerName of ["committed-fill", "committed-line", "committed-point"]) {
      this.bindLayerEvent("click", layerName, (event) => {
        const properties = this.featurePropertiesFromEvent(event, [this.layerId(layerName)]);
        const featureId = stringProperty(properties, "featureId");
        if (!featureId) {
          return;
        }
        this.emit("featureClick", {
          featureId,
          coordinate: coordinateFromEvent(event),
          originalEvent: event
        });
      });
      this.bindLayerEvent("mousedown", layerName, (event) => {
        const properties = this.featurePropertiesFromEvent(event, [this.layerId(layerName)]);
        const featureId = stringProperty(properties, "featureId");
        if (!featureId) {
          return;
        }
        this.activeDrag = { kind: "feature", featureId, from: coordinateFromEvent(event) };
        this.map?.dragPan?.disable();
      });
    }

    this.bindLayerEvent("click", "handle-midpoint", (event) => {
      const properties = this.featurePropertiesFromEvent(event, [this.layerId("handle-midpoint")]);
      const featureId = stringProperty(properties, "featureId");
      const edgeIndex = numberProperty(properties, "edgeIndex");
      if (!featureId || edgeIndex === undefined) {
        return;
      }
      this.emit("midpointClick", {
        featureId,
        edgeIndex,
        coordinate: coordinateFromEvent(event),
        originalEvent: event
      });
    });

    this.bindLayerEvent("mousedown", "handle-vertex", (event) => {
      const properties = this.featurePropertiesFromEvent(event, [this.layerId("handle-vertex")]);
      const featureId = stringProperty(properties, "featureId");
      const vertexIndex = numberProperty(properties, "vertexIndex");
      if (!featureId || vertexIndex === undefined) {
        return;
      }
      this.activeDrag = { kind: "vertex", featureId, vertexIndex };
      this.map?.dragPan?.disable();
    });

    this.bindLayerEvent("mousedown", "draft-vertex", (event) => {
      const properties = this.featurePropertiesFromEvent(event, [this.layerId("draft-vertex")]);
      const vertexIndex = numberProperty(properties, "vertexIndex");
      if (vertexIndex === undefined) {
        return;
      }
      this.activeDrag = { kind: "draftVertex", vertexIndex };
      this.map?.dragPan?.disable();
    });
  }

  private bindLayerEvent(
    eventName: string,
    layerName: string,
    handler: (event: Record<string, unknown>) => void
  ): void {
    const layerId = this.layerId(layerName);
    this.requireMap().on(eventName, layerId, handler);
    this.listeners.push({ eventName, layerId, handler });
  }

  private handleDragMapEvent(
    eventName: string,
    coordinate: Coordinate,
    originalEvent: Record<string, unknown>
  ): void {
    if (!this.activeDrag) {
      return;
    }

    if (this.activeDrag.kind === "vertex" && (eventName === "mousemove" || eventName === "mouseup")) {
      this.emit("vertexDrag", {
        featureId: this.activeDrag.featureId,
        vertexIndex: this.activeDrag.vertexIndex,
        coordinate,
        originalEvent
      });
    }

    if (this.activeDrag.kind === "draftVertex" && eventName === "mousemove") {
      this.emit("draftVertexDrag", {
        vertexIndex: this.activeDrag.vertexIndex,
        coordinate,
        originalEvent
      });
    }

    if (this.activeDrag.kind === "feature" && eventName === "mouseup") {
      this.emit("featureDrag", {
        featureId: this.activeDrag.featureId,
        from: this.activeDrag.from,
        to: coordinate,
        originalEvent
      });
    }

    if (eventName === "mouseup") {
      this.activeDrag = undefined;
      this.map?.dragPan?.enable();
    }
  }

  private featurePropertiesFromEvent(
    event: Record<string, unknown>,
    layers: string[]
  ): Record<string, unknown> | undefined {
    const eventFeatures = event.features as Array<{ properties?: Record<string, unknown> }> | undefined;
    const eventProperties = eventFeatures?.[0]?.properties;
    if (eventProperties) {
      return eventProperties;
    }
    return this.map?.queryRenderedFeatures?.(event.point, { layers })[0]?.properties;
  }

  private createLayers(): Array<Record<string, unknown>> {
    return [
      this.layer("draft-fill", "fill", "draft", this.styles.preview.fill.paint, [
        "==",
        ["get", "role"],
        "draft-fill"
      ]),
      this.layer("draft-line", "line", "draft", this.styles.draftLine.paint, [
        "==",
        ["get", "role"],
        "draft-line"
      ]),
      {
        ...this.layer("draft-preview-line", "line", "draft", this.styles.draftLine.paint, [
          "==",
          ["get", "role"],
          "draft-preview-line"
        ]),
        layout: this.styles.draftLine.layout,
        paint: {
          ...this.styles.draftLine.paint,
          "line-opacity": 0.75,
          "line-dasharray": [2, 3]
        }
      },
      this.layer("draft-vertex", "circle", "draft", this.styles.draftVertex.paint, [
        "==",
        ["get", "role"],
        "draft-vertex"
      ]),
      this.layer("committed-fill", "fill", "committed", this.styles.committed.fill.paint, [
        "==",
        ["geometry-type"],
        "Polygon"
      ]),
      this.layer("committed-line", "line", "committed", this.styles.committed.line.paint, [
        "in",
        ["geometry-type"],
        ["literal", ["LineString", "Polygon"]]
      ]),
      this.layer("committed-door", "circle", "committed", this.styles.door.paint, [
        "==",
        ["get", "isDoor"],
        true
      ]),
      this.layer("committed-poi", "circle", "committed", this.styles.poi.paint, [
        "==",
        ["get", "isPoi"],
        true
      ]),
      this.layer("committed-point", "circle", "committed", this.styles.committed.circle.paint, [
        "==",
        ["geometry-type"],
        "Point"
      ]),
      this.layer("selection-fill", "fill", "selection", this.styles.selected.fill.paint, [
        "==",
        ["geometry-type"],
        "Polygon"
      ]),
      this.layer("selection-line", "line", "selection", this.styles.selected.line.paint, [
        "in",
        ["geometry-type"],
        ["literal", ["LineString", "Polygon"]]
      ]),
      this.layer("selection-point", "circle", "selection", this.styles.selected.circle.paint, [
        "==",
        ["geometry-type"],
        "Point"
      ]),
      this.layer("handle-vertex", "circle", "handles", this.styles.vertexHandle.paint, [
        "==",
        ["get", "role"],
        "vertex"
      ]),
      this.layer("handle-midpoint", "circle", "handles", this.styles.midpointHandle.paint, [
        "==",
        ["get", "role"],
        "midpoint"
      ]),
      this.layer("snap-line", "line", "snap", this.styles.snapIndicator.line.paint, [
        "==",
        ["geometry-type"],
        "LineString"
      ]),
      this.layer("snap-point", "circle", "snap", this.styles.snapIndicator.circle.paint, [
        "==",
        ["geometry-type"],
        "Point"
      ])
    ];
  }

  private layer(
    name: string,
    type: "fill" | "line" | "circle",
    sourceName: SourceName,
    paint: Record<string, unknown>,
    filter: unknown[]
  ): Record<string, unknown> {
    return {
      id: this.layerId(name),
      type,
      source: this.sourceId(sourceName),
      paint,
      filter
    };
  }

  private refreshCommittedSource(): void {
    const features = [...this.committedFeatures.values()]
      .filter((feature) => isFeatureVisibleOnLevel(feature, this.currentLevel))
      .flatMap((feature) => featuresForFeature(feature, "committed"));
    this.setSourceData("committed", collection(features));
  }

  private refreshSelectionSource(): void {
    if (!this.selectedFeatureId) {
      this.setSourceData("selection", emptyCollection());
      return;
    }
    const feature = this.committedFeatures.get(this.selectedFeatureId);
    this.setSourceData(
      "selection",
      feature && isFeatureVisibleOnLevel(feature, this.currentLevel)
        ? collection(featuresForFeature(feature, "selection"))
        : emptyCollection()
    );
  }

  private refreshHandleSource(): void {
    const features: GeoJSONFeature[] = [];
    for (const [featureId, handles] of this.handles) {
      for (const [vertexIndex, handle] of handles.entries()) {
        features.push(
          createFeature("Point", toPosition(handle.coordinate), {
            role: "vertex",
            featureId,
            vertexIndex
          })
        );
      }
      const feature = this.committedFeatures.get(featureId);
      const midpointCount = feature?.geometryType === "polygon" ? handles.length : handles.length - 1;
      for (let edgeIndex = 0; edgeIndex < midpointCount; edgeIndex += 1) {
        features.push(
          createFeature(
            "Point",
            toPosition(midpointCoordinate(handles[edgeIndex].coordinate, handles[(edgeIndex + 1) % handles.length].coordinate)),
            { role: "midpoint", featureId, edgeIndex }
          )
        );
      }
    }
    this.setSourceData("handles", collection(features));
  }

  private setSourceData(sourceName: SourceName, data: FeatureCollection): void {
    this.sourceData.set(sourceName, cloneCollection(data));
    this.map?.getSource(this.sourceId(sourceName))?.setData(cloneCollection(data));
  }

  private sourceId(sourceName: SourceName): string {
    return `${this.sourcePrefix}-${sourceName}`;
  }

  private layerId(layerName: string): string {
    return `${this.sourcePrefix}-${layerName}`;
  }

  private emit<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    event: RendererAdapterEventMap[TName]
  ): void {
    for (const handler of this.handlers.get(eventName) ?? []) {
      (handler as (event: RendererAdapterEventMap[TName]) => void)(event);
    }
  }

  private requireMap(): MapLibreLikeMap {
    if (!this.map) {
      throw new Error("MapLibreRendererAdapter is not attached to a map");
    }
    return this.map;
  }
}

export function createMapLibreAdapter(options?: MapLibreAdapterOptions): MapLibreRendererAdapter {
  return new MapLibreRendererAdapter(options);
}

function featuresForFeature(feature: FeatureRecord, role: "committed" | "selection"): GeoJSONFeature[] {
  if (feature.geometryType === "relation") {
    return [];
  }
  const base = {
    role,
    featureId: feature.id,
    geometryType: feature.geometryType,
    kind: feature.kind,
    level: feature.level ?? feature.tags.level,
    isDoor: feature.kind === "door" || feature.tags.door !== undefined,
    isPoi:
      feature.kind === "poi" ||
      feature.tags.amenity !== undefined ||
      feature.tags.shop !== undefined ||
      feature.tags.office !== undefined
  };
  const coordinates = feature.coordinates ?? [];
  if (feature.geometryType === "point") {
    return [createFeature("Point", toPosition(coordinates[0] ?? { lat: 0, lon: 0 }), base)];
  }
  if (feature.geometryType === "polygon") {
    return [createFeature("Polygon", [coordinates.map(toPosition)], base)];
  }
  return [createFeature("LineString", coordinates.map(toPosition), base)];
}

function createFeature(
  type: "Point",
  coordinates: [number, number],
  properties: Record<string, unknown>
): GeoJSONFeature;
function createFeature(
  type: "LineString",
  coordinates: Array<[number, number]>,
  properties: Record<string, unknown>
): GeoJSONFeature;
function createFeature(
  type: "Polygon",
  coordinates: Array<Array<[number, number]>>,
  properties: Record<string, unknown>
): GeoJSONFeature;
function createFeature(
  type: Geometry["type"],
  coordinates: Geometry["coordinates"],
  properties: Record<string, unknown>
): GeoJSONFeature {
  return {
    type: "Feature",
    geometry: { type, coordinates } as Geometry,
    properties
  };
}

function collection(features: GeoJSONFeature[]): FeatureCollection {
  return { type: "FeatureCollection", features };
}

function emptyCollection(): FeatureCollection {
  return collection([]);
}

function cloneCollection(data: FeatureCollection): FeatureCollection {
  return JSON.parse(JSON.stringify(data)) as FeatureCollection;
}

function cloneFeature(feature: FeatureRecord): FeatureRecord {
  return JSON.parse(JSON.stringify(feature)) as FeatureRecord;
}

function toPosition(coordinate: Coordinate): [number, number] {
  return [coordinate.lon, coordinate.lat];
}

function coordinateFromEvent(event: Record<string, unknown>): Coordinate {
  const lngLat = event.lngLat as MapLibreLngLat | undefined;
  if (lngLat) {
    return { lat: lngLat.lat, lon: lngLat.lng };
  }
  return { lat: 0, lon: 0 };
}

function stringProperty(properties: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = properties?.[key];
  return typeof value === "string" ? value : undefined;
}

function numberProperty(properties: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = properties?.[key];
  return typeof value === "number" ? value : undefined;
}

function midpointCoordinate(left: Coordinate, right: Coordinate): Coordinate {
  return {
    lat: (left.lat + right.lat) / 2,
    lon: (left.lon + right.lon) / 2
  };
}

function getTemporaryVertexCoordinates(geometry: TemporaryGeometry): Coordinate[] {
  if (geometry.vertexCoordinates) {
    return geometry.vertexCoordinates;
  }

  if (geometry.geometryType === "polygon" && geometry.coordinates.length > 1) {
    const first = geometry.coordinates[0];
    const last = geometry.coordinates[geometry.coordinates.length - 1];
    if (first.lat === last.lat && first.lon === last.lon) {
      return geometry.coordinates.slice(0, -1);
    }
  }

  return geometry.coordinates;
}

function isMapLibreLikeMap(value: MapLibreLikeMap | undefined): value is MapLibreLikeMap {
  return Boolean(
    value &&
      typeof value.on === "function" &&
      typeof value.off === "function" &&
      typeof value.addSource === "function" &&
      typeof value.addLayer === "function" &&
      typeof value.project === "function" &&
      typeof value.unproject === "function"
  );
}
