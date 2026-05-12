import * as L from "leaflet";
import type {
  Coordinate,
  RendererAdapter,
  RendererAdapterEventMap,
  ScreenPoint,
  TemporaryGeometry,
  VertexHandle
} from "@osminedit-lib/core";
import type { FeatureRecord } from "@osminedit-lib/core";
import { isFeatureVisibleOnLevel } from "@osminedit-lib/core";
import {
  type LeafletEditingStyles,
  mergeLeafletEditingStyles
} from "./styles";

export interface LeafletAdapterOptions {
  styles?: Partial<LeafletEditingStyles>;
  paneName?: string;
}

type HandlerSet = Set<(event: RendererAdapterEventMap[keyof RendererAdapterEventMap]) => void>;
type LeafletListener = {
  eventName: "click" | "mousemove" | "mouseup";
  handler: L.LeafletMouseEventHandlerFn;
};

interface EditingGroups {
  root: L.LayerGroup;
  draft: L.LayerGroup;
  committed: L.LayerGroup;
  selection: L.LayerGroup;
  handles: L.LayerGroup;
}

export class LeafletRendererAdapter implements RendererAdapter {
  readonly paneName: string;
  readonly styles: LeafletEditingStyles;
  private map: L.Map | undefined;
  private groups: EditingGroups | undefined;
  private readonly handlers = new Map<keyof RendererAdapterEventMap, HandlerSet>();
  private readonly listeners: LeafletListener[] = [];
  private readonly temporaryLayers = new Map<string, L.Layer>();
  private readonly committedLayers = new Map<string, L.Layer>();
  private readonly committedFeatures = new Map<string, FeatureRecord>();
  private readonly handleLayers = new Map<
    string,
    { vertices: L.CircleMarker[]; midpoints: L.CircleMarker[] }
  >();
  private currentLevel: string | undefined;
  private selectedFeatureId: string | null = null;

  constructor(options: LeafletAdapterOptions = {}) {
    this.paneName = options.paneName ?? "osminedit-editing";
    this.styles = mergeLeafletEditingStyles(options.styles);
  }

  attach(target: unknown): void {
    this.detach();
    const map = target as L.Map;
    if (!map || typeof map.on !== "function" || typeof map.latLngToContainerPoint !== "function") {
      throw new TypeError("LeafletRendererAdapter.attach expects a Leaflet Map target");
    }

    this.map = map;
    map.getPane(this.paneName) ?? map.createPane(this.paneName);

    const groups: EditingGroups = {
      root: L.layerGroup(),
      committed: L.layerGroup([], { pane: this.paneName }),
      draft: L.layerGroup([], { pane: this.paneName }),
      selection: L.layerGroup([], { pane: this.paneName }),
      handles: L.layerGroup([], { pane: this.paneName })
    };

    groups.root.addLayer(groups.committed);
    groups.root.addLayer(groups.draft);
    groups.root.addLayer(groups.selection);
    groups.root.addLayer(groups.handles);
    groups.root.addTo(map);
    this.groups = groups;

    this.bindMapEvent("click", "pointerDown");
    this.bindMapEvent("mousemove", "pointerMove");
    this.bindMapEvent("mouseup", "pointerUp");
  }

  detach(): void {
    if (!this.map) {
      return;
    }

    for (const listener of this.listeners) {
      this.map.off(listener.eventName, listener.handler);
    }
    this.listeners.length = 0;
    this.temporaryLayers.clear();
    this.committedLayers.clear();
    this.committedFeatures.clear();
    this.handleLayers.clear();
    this.currentLevel = undefined;
    this.groups?.root.removeFrom(this.map);
    this.groups = undefined;
    this.map = undefined;
    this.selectedFeatureId = null;
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

  showTemporaryFeature(id: string, geometry: TemporaryGeometry): void {
    this.requireGroups();
    this.clearTemporaryFeature(id);
    const layer = this.createTemporaryLayer(geometry);
    this.temporaryLayers.set(id, layer);
    this.groups?.draft.addLayer(layer);
  }

  clearTemporaryFeature(id?: string): void {
    const draft = this.groups?.draft;
    if (!draft) {
      return;
    }

    if (id) {
      const layer = this.temporaryLayers.get(id);
      if (layer) {
        draft.removeLayer(layer);
        this.temporaryLayers.delete(id);
      }
      return;
    }

    draft.clearLayers();
    this.temporaryLayers.clear();
  }

  commitFeature(feature: FeatureRecord): void {
    this.requireGroups();
    this.removeFeature(feature.id);
    this.committedFeatures.set(feature.id, feature);
    const layer = this.createCommittedLayer(feature, false);
    this.committedLayers.set(feature.id, layer);
    if (isFeatureVisibleOnLevel(feature, this.currentLevel)) {
      this.groups?.committed.addLayer(layer);
    }
  }

  updateFeature(feature: FeatureRecord): void {
    this.commitFeature(feature);
  }

  removeFeature(featureId: string): void {
    const layer = this.committedLayers.get(featureId);
    if (layer) {
      this.groups?.committed.removeLayer(layer);
      this.groups?.selection.removeLayer(layer);
      this.committedLayers.delete(featureId);
    }
    this.committedFeatures.delete(featureId);
    this.handleLayers.delete(featureId);

    if (this.selectedFeatureId === featureId) {
      this.setSelectedFeature(null);
    }
  }

  showVertexHandles(featureId: string, handles: VertexHandle[]): void {
    this.requireGroups();
    this.clearVertexHandles(featureId);
    const vertices: L.CircleMarker[] = [];
    const midpoints: L.CircleMarker[] = [];
    for (const [index, handle] of handles.entries()) {
      const marker = L.circleMarker(toLatLng(handle.coordinate), {
        ...this.styles.vertexHandle,
        pane: this.paneName
      });
      marker.on("move", (event) => {
        const target = event.target as L.CircleMarker;
        this.emit("vertexDrag", {
          featureId,
          vertexIndex: index,
          coordinate: fromLatLng(target.getLatLng()),
          originalEvent: event
        });
      });
      this.groups?.handles.addLayer(marker);
      vertices.push(marker);
    }

    for (let index = 0; index < handles.length - 1; index += 1) {
      const midpoint = midpointCoordinate(handles[index].coordinate, handles[index + 1].coordinate);
      const marker = L.circleMarker(toLatLng(midpoint), {
        ...this.styles.midpointHandle,
        pane: this.paneName
      });
      marker.on("click", (event) => {
        this.emit("midpointClick", {
          featureId,
          edgeIndex: index,
          coordinate: fromLatLng((event as L.LeafletMouseEvent).latlng ?? marker.getLatLng()),
          originalEvent: event
        });
      });
      this.groups?.handles.addLayer(marker);
      midpoints.push(marker);
    }
    this.handleLayers.set(featureId, { vertices, midpoints });
  }

  clearVertexHandles(featureId?: string): void {
    if (!featureId) {
      this.groups?.handles.clearLayers();
      this.handleLayers.clear();
      return;
    }

    const handles = this.handleLayers.get(featureId);
    if (!handles) {
      return;
    }
    for (const layer of [...handles.vertices, ...handles.midpoints]) {
      this.groups?.handles.removeLayer(layer);
    }
    this.handleLayers.delete(featureId);
  }

  setSelectedFeature(featureId: string | null): void {
    this.selectedFeatureId = featureId;
    this.groups?.selection.clearLayers();
    if (!featureId) {
      return;
    }

    const feature = this.committedFeatures.get(featureId);
    if (feature) {
      this.groups?.selection.addLayer(this.createCommittedLayer(feature, true));
    }
  }

  setLevel(level: string | undefined): void {
    this.currentLevel = level;
    this.refreshCommittedVisibility();
  }

  project(coordinate: Coordinate): ScreenPoint {
    const point = this.requireMap().latLngToContainerPoint(toLatLng(coordinate));
    return { x: point.x, y: point.y };
  }

  unproject(point: ScreenPoint): Coordinate {
    const latLng = this.requireMap().containerPointToLatLng(L.point(point.x, point.y));
    return fromLatLng(latLng);
  }

  getLayerCounts(): Record<keyof EditingGroups, number> {
    const groups = this.requireGroups();
    return {
      root: groups.root.getLayers().length,
      draft: groups.draft.getLayers().length,
      committed: groups.committed.getLayers().length,
      selection: groups.selection.getLayers().length,
      handles: groups.handles.getLayers().length
    };
  }

  getTemporaryLayerCount(id: string): number {
    const layer = this.temporaryLayers.get(id);
    return layer instanceof L.LayerGroup ? layer.getLayers().length : layer ? 1 : 0;
  }

  getCommittedLayerCount(featureId: string): number {
    const layer = this.committedLayers.get(featureId);
    return layer instanceof L.LayerGroup ? layer.getLayers().length : layer ? 1 : 0;
  }

  getHandleLayerCount(featureId: string): number {
    const handles = this.handleLayers.get(featureId);
    return handles ? handles.vertices.length + handles.midpoints.length : 0;
  }

  fireCommittedFeatureClick(featureId: string, coordinate: Coordinate): void {
    this.emit("featureClick", { featureId, coordinate });
  }

  fireCommittedFeatureDrag(featureId: string, from: Coordinate, to: Coordinate): void {
    this.emit("featureDrag", { featureId, from, to });
  }

  fireVertexDrag(featureId: string, vertexIndex: number, coordinate: Coordinate): void {
    const marker = this.handleLayers.get(featureId)?.vertices[vertexIndex];
    marker?.setLatLng(toLatLng(coordinate));
  }

  fireMidpointClick(featureId: string, edgeIndex: number, coordinate: Coordinate): void {
    const marker = this.handleLayers.get(featureId)?.midpoints[edgeIndex];
    marker?.fire("click", { latlng: toLatLng(coordinate) });
  }

  private bindMapEvent(
    leafletEventName: LeafletListener["eventName"],
    adapterEventName: "pointerDown" | "pointerMove" | "pointerUp"
  ): void {
    const handler = (event: L.LeafletMouseEvent) => {
      this.emit(adapterEventName, {
        coordinate: fromLatLng(event.latlng),
        originalEvent: event.originalEvent
      });
    };
    this.requireMap().on(leafletEventName, handler);
    this.listeners.push({ eventName: leafletEventName, handler });
  }

  private createTemporaryLayer(geometry: TemporaryGeometry): L.Layer {
    const coordinates = geometry.coordinates.map(toLatLng);
    const group = L.layerGroup([], { pane: this.paneName });

    for (const coordinate of coordinates) {
      group.addLayer(
        L.circleMarker(coordinate, {
          ...this.styles.draftVertex,
          pane: this.paneName
        })
      );
    }

    if (geometry.geometryType === "point") {
      return group;
    }

    if (geometry.geometryType === "polygon") {
      const polygon: L.Polygon = L.polygon(coordinates, {
        ...this.styles.preview,
        pane: this.paneName
      });
      group.addLayer(polygon);
      return group;
    }

    group.addLayer(
      L.polyline(coordinates, {
        ...this.styles.draftLine,
        pane: this.paneName
      })
    );
    return group;
  }

  private createCommittedLayer(feature: FeatureRecord, selected: boolean): L.Layer {
    const coordinates = feature.coordinates?.map(toLatLng) ?? [];
    const group = L.layerGroup([], { pane: this.paneName });
    const style = selected ? this.styles.selected : this.styles.committed;
    let dragStart: Coordinate | undefined;

    const bindFeatureEvents = (layer: L.Layer) => {
      layer.on("click", (event) => {
        const latlng = (event as L.LeafletMouseEvent).latlng ?? coordinates[0];
        this.emit("featureClick", {
          featureId: feature.id,
          coordinate: fromLatLng(latlng),
          originalEvent: event
        });
      });
      layer.on("mousedown", (event) => {
        const latlng = (event as L.LeafletMouseEvent).latlng ?? coordinates[0];
        dragStart = fromLatLng(latlng);
      });
      layer.on("mouseup", (event) => {
        const latlng = (event as L.LeafletMouseEvent).latlng ?? coordinates[0];
        if (dragStart) {
          this.emit("featureDrag", {
            featureId: feature.id,
            from: dragStart,
            to: fromLatLng(latlng),
            originalEvent: event
          });
        }
        dragStart = undefined;
      });
    };

    if (feature.geometryType === "point") {
      const marker = L.circleMarker(coordinates[0] ?? L.latLng(0, 0), {
        ...this.styles.committed,
        ...(selected ? this.styles.selected : {}),
        pane: this.paneName
      });
      bindFeatureEvents(marker);
      group.addLayer(marker);
      return group;
    }

    if (feature.geometryType === "polygon") {
      const polygon = L.polygon(coordinates, { ...style, pane: this.paneName });
      bindFeatureEvents(polygon);
      group.addLayer(polygon);
      return group;
    }

    const polyline = L.polyline(coordinates, { ...style, pane: this.paneName });
    bindFeatureEvents(polyline);
    group.addLayer(polyline);
    return group;
  }

  private refreshCommittedVisibility(): void {
    const committed = this.groups?.committed;
    if (!committed) {
      return;
    }

    for (const [featureId, layer] of this.committedLayers) {
      const feature = this.committedFeatures.get(featureId);
      if (!feature) {
        continue;
      }

      if (isFeatureVisibleOnLevel(feature, this.currentLevel)) {
        if (!committed.hasLayer(layer)) {
          committed.addLayer(layer);
        }
      } else if (committed.hasLayer(layer)) {
        committed.removeLayer(layer);
      }
    }
  }

  private emit<TName extends keyof RendererAdapterEventMap>(
    eventName: TName,
    event: RendererAdapterEventMap[TName]
  ): void {
    for (const handler of this.handlers.get(eventName) ?? []) {
      (handler as (event: RendererAdapterEventMap[TName]) => void)(event);
    }
  }

  private requireMap(): L.Map {
    if (!this.map) {
      throw new Error("LeafletRendererAdapter is not attached to a map");
    }
    return this.map;
  }

  private requireGroups(): EditingGroups {
    if (!this.groups) {
      throw new Error("LeafletRendererAdapter is not attached to a map");
    }
    return this.groups;
  }
}

export function createLeafletAdapter(options?: LeafletAdapterOptions): LeafletRendererAdapter {
  return new LeafletRendererAdapter(options);
}

function toLatLng(coordinate: Coordinate): L.LatLng {
  return L.latLng(coordinate.lat, coordinate.lon);
}

function fromLatLng(latLng: L.LatLng): Coordinate {
  return { lat: latLng.lat, lon: latLng.lng };
}

function midpointCoordinate(left: Coordinate, right: Coordinate): Coordinate {
  return {
    lat: (left.lat + right.lat) / 2,
    lon: (left.lon + right.lon) / 2
  };
}
