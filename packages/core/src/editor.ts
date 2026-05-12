import type { Coordinate, RendererAdapter } from "./adapter";
import { type Clock, systemClock } from "./clock";
import {
  type CoordinateDelta,
  VertexEditError,
  canDeleteVertex,
  translateCoordinate
} from "./editing";
import {
  createMinimumTags,
  buildTemporaryGeometry,
  getMinimumPointCount,
  type DraftDrawingState,
  type DrawKind,
  type StartDrawOptions
} from "./drawing";
import { DrawingIntegrityError, UnsupportedOperationError } from "./errors";
import {
  type EditorEventMap,
  type EventHandler,
  TypedEventEmitter,
  type EditorEventName
} from "./events";
import { FeatureStore, type FeatureRecord } from "./feature-store";
import { normalizeOsmInEditExport } from "./import-export";
import { ElementIdAllocator } from "./ids";
import { PrimitiveStore } from "./primitive-store";
import type { OsmElement, OsmInEditExport, Tags } from "./types";

export interface EditorOptions {
  adapter?: RendererAdapter;
  target?: unknown;
  clock?: Clock;
  ids?: ElementIdAllocator;
  defaultLevel?: string;
}

export interface EditorStateSnapshot {
  level: string | undefined;
  destroyed: boolean;
  features: readonly FeatureRecord[];
  elements: readonly OsmElement[];
}

export interface IndoorEditor {
  destroy(): void;
  setLevel(level: string | undefined): void;
  getLevel(): string | undefined;
  startDraw(kind: DrawKind, options?: StartDrawOptions): void;
  cancelDraw(): void;
  finishDraw(): FeatureRecord;
  selectFeature(featureId: string | null): void;
  deleteFeature(featureId: string): void;
  updateTags(featureId: string, tags: Tags): FeatureRecord;
  deleteVertex(featureId: string, vertexIndex: number): FeatureRecord;
  moveVertex(featureId: string, vertexIndex: number, coordinate: Coordinate): FeatureRecord;
  insertVertex(featureId: string, edgeIndex: number, coordinate: Coordinate): FeatureRecord;
  moveFeature(featureId: string, delta: CoordinateDelta): FeatureRecord;
  getState(): Readonly<EditorStateSnapshot>;
  getElements(): readonly OsmElement[];
  loadOsmInEdit(data: OsmInEditExport): void;
  exportOsmInEdit(): OsmInEditExport;
  validate(): never;
  on<TName extends EditorEventName>(
    eventName: TName,
    handler: EventHandler<EditorEventMap[TName]>
  ): () => void;
  off<TName extends EditorEventName>(
    eventName: TName,
    handler: EventHandler<EditorEventMap[TName]>
  ): void;
}

export function createEditor(options: EditorOptions = {}): IndoorEditor {
  return new HeadlessIndoorEditor(options);
}

class HeadlessIndoorEditor implements IndoorEditor {
  private primitiveStore: PrimitiveStore;
  private readonly featureStore = new FeatureStore();
  private readonly events = new TypedEventEmitter<EditorEventMap>();
  private readonly adapter?: RendererAdapter;
  private readonly adapterUnsubscribers: Array<() => void> = [];
  private readonly clock: Clock;
  private readonly ids: ElementIdAllocator;
  private level: string | undefined;
  private draft: DraftDrawingState | undefined;
  private selectedFeatureId: string | null = null;
  private destroyed = false;

  constructor(options: EditorOptions) {
    this.clock = options.clock ?? systemClock;
    this.ids = options.ids ?? new ElementIdAllocator();
    this.primitiveStore = new PrimitiveStore({ clock: this.clock, ids: this.ids });
    this.adapter = options.adapter;
    this.level = options.defaultLevel;

    if (this.adapter && "target" in options) {
      this.adapter.attach(options.target);
    }

    if (this.adapter) {
      this.adapterUnsubscribers.push(
        this.adapter.on("pointerDown", (event) => this.addDraftCoordinate(event.coordinate)),
        this.adapter.on("featureClick", (event) => this.selectFeature(event.featureId)),
        this.adapter.on("vertexDrag", (event) =>
          this.moveVertex(event.featureId, event.vertexIndex, event.coordinate)
        ),
        this.adapter.on("midpointClick", (event) =>
          this.insertVertex(event.featureId, event.edgeIndex, event.coordinate)
        ),
        this.adapter.on("featureDrag", (event) =>
          this.moveFeature(event.featureId, {
            lat: event.to.lat - event.from.lat,
            lon: event.to.lon - event.from.lon
          })
        )
      );
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    for (const unsubscribe of this.adapterUnsubscribers.splice(0)) {
      unsubscribe();
    }
    this.adapter?.detach();
    this.destroyed = true;
  }

  setLevel(level: string | undefined): void {
    const previousLevel = this.level;
    this.level = level;
    this.events.emit("levelChanged", { level, previousLevel });
  }

  getLevel(): string | undefined {
    return this.level;
  }

  startDraw(kind: DrawKind, options: StartDrawOptions = {}): void {
    if (!this.level) {
      throw new DrawingIntegrityError("Select a level before drawing");
    }

    this.clearDraft();
    this.draft = {
      kind,
      level: this.level,
      tags: createMinimumTags(kind, this.level, options.tags),
      coordinates: []
    };
    this.events.emit("toolChanged", { tool: kind });
    this.events.emit("drawingStarted", { kind });
  }

  cancelDraw(): void {
    if (!this.draft) {
      return;
    }

    this.clearDraft();
    this.events.emit("toolChanged", { tool: null });
    this.events.emit("drawingCancelled", { reason: "cancelDraw" });
  }

  finishDraw(): FeatureRecord {
    const draft = this.draft;
    if (!draft) {
      throw new DrawingIntegrityError("No active drawing");
    }

    if (draft.coordinates.length < getMinimumPointCount(draft.kind)) {
      throw new DrawingIntegrityError(
        draft.kind === "poi"
          ? "Add a point before finishing this POI."
          : "Add at least 3 points before finishing this polygon."
      );
    }

    const feature = draft.kind === "poi" ? this.finishPointDrawing(draft) : this.finishWayDrawing(draft);
    this.clearDraft();
    this.adapter?.commitFeature(this.withFeatureCoordinates(feature));
    this.events.emit("toolChanged", { tool: null });
    this.events.emit("drawingFinished", { featureId: feature.id });
    this.events.emit("featureCreated", { featureId: feature.id });
    return feature;
  }

  selectFeature(featureId: string | null): void {
    if (featureId !== null) {
      this.requireFeature(featureId);
    }

    this.selectedFeatureId = featureId;
    this.adapter?.setSelectedFeature(featureId);
    if (featureId === null) {
      this.adapter?.clearVertexHandles();
    } else {
      this.refreshFeatureHandles(featureId);
    }
    this.events.emit("featureSelected", { featureId });
  }

  deleteFeature(featureId: string): void {
    const feature = this.requireFeature(featureId);
    if (feature.primitiveRefs.wayId !== undefined) {
      this.primitiveStore.deleteElement("way", feature.primitiveRefs.wayId);
    }

    for (const nodeId of uniqueNodeIds(feature.primitiveRefs.nodeIds)) {
      this.deleteNodeIfUnreferenced(nodeId);
    }

    this.featureStore.remove(featureId);
    this.adapter?.removeFeature(featureId);
    if (this.selectedFeatureId === featureId) {
      this.selectedFeatureId = null;
      this.adapter?.clearVertexHandles(featureId);
    }
    this.events.emit("featureDeleted", { featureId });
  }

  updateTags(featureId: string, tags: Tags): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const nextTags = { ...feature.tags, ...tags };
    if (feature.primitiveRefs.wayId !== undefined) {
      this.primitiveStore.updateElementTags("way", feature.primitiveRefs.wayId, nextTags);
    } else {
      for (const nodeId of uniqueNodeIds(feature.primitiveRefs.nodeIds)) {
        this.primitiveStore.updateElementTags("node", nodeId, nextTags);
      }
    }

    const updated = this.featureStore.update(featureId, {
      tags: nextTags,
      level: nextTags.level ?? feature.level
    });
    this.adapter?.updateFeature(this.withFeatureCoordinates(updated));
    this.events.emit("tagsUpdated", { featureId, tags: updated.tags });
    this.events.emit("featureUpdated", { featureId });
    return updated;
  }

  deleteVertex(featureId: string, vertexIndex: number): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const wayId = this.requireFeatureWayId(feature);
    const editableNodeIds = getEditableNodeIds(feature);
    if (!canDeleteVertex(feature.geometryType, editableNodeIds.length)) {
      throw new VertexEditError("Cannot delete vertex because the feature would become invalid");
    }

    const removedNodeId = editableNodeIds[vertexIndex];
    if (removedNodeId === undefined) {
      throw new VertexEditError(`Vertex ${vertexIndex} does not exist`);
    }

    const nextNodeIds = editableNodeIds.filter((_, index) => index !== vertexIndex);
    const way = this.primitiveStore.updateWayNodes(wayId, nextNodeIds);
    this.deleteNodeIfUnreferenced(removedNodeId);
    const updated = this.featureStore.update(featureId, {
      primitiveRefs: { ...feature.primitiveRefs, nodeIds: way.nodes }
    });
    this.afterGeometryUpdate(updated, wayId);
    return updated;
  }

  moveVertex(featureId: string, vertexIndex: number, coordinate: Coordinate): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const nodeId = getEditableNodeIds(feature)[vertexIndex];
    if (nodeId === undefined) {
      throw new VertexEditError(`Vertex ${vertexIndex} does not exist`);
    }

    this.primitiveStore.updateNodeCoordinate(nodeId, coordinate);
    const updated = this.featureStore.update(featureId, {});
    this.events.emit("nodeMoved", { nodeId });
    this.afterGeometryUpdate(updated, feature.primitiveRefs.wayId);
    return updated;
  }

  insertVertex(featureId: string, edgeIndex: number, coordinate: Coordinate): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const wayId = this.requireFeatureWayId(feature);
    const editableNodeIds = getEditableNodeIds(feature);
    if (edgeIndex < 0 || edgeIndex >= editableNodeIds.length) {
      throw new VertexEditError(`Edge ${edgeIndex} does not exist`);
    }

    const node = this.primitiveStore.createNode({ lat: coordinate.lat, lon: coordinate.lon });
    const nextNodeIds = [
      ...editableNodeIds.slice(0, edgeIndex + 1),
      node.id,
      ...editableNodeIds.slice(edgeIndex + 1)
    ];
    const way = this.primitiveStore.updateWayNodes(wayId, nextNodeIds);
    const updated = this.featureStore.update(featureId, {
      primitiveRefs: { ...feature.primitiveRefs, nodeIds: way.nodes }
    });
    this.afterGeometryUpdate(updated, wayId);
    return updated;
  }

  moveFeature(featureId: string, delta: CoordinateDelta): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const movedNodeIds = uniqueNodeIds(feature.primitiveRefs.nodeIds);
    for (const nodeId of movedNodeIds) {
      const node = this.primitiveStore.getNode(nodeId);
      if (!node) {
        throw new VertexEditError(`Node ${nodeId} does not exist`);
      }
      this.primitiveStore.updateNodeCoordinate(nodeId, translateCoordinate(node, delta));
      this.events.emit("nodeMoved", { nodeId });
    }

    const updated = this.featureStore.update(featureId, {});
    this.afterGeometryUpdate(updated, feature.primitiveRefs.wayId);
    return updated;
  }

  getState(): Readonly<EditorStateSnapshot> {
    return immutableSnapshot({
      level: this.level,
      destroyed: this.destroyed,
      features: this.featureStore.list(),
      elements: this.primitiveStore.getElements()
    });
  }

  getElements(): readonly OsmElement[] {
    return immutableSnapshot(this.primitiveStore.getElements());
  }

  loadOsmInEdit(data: OsmInEditExport): void {
    const normalized = normalizeOsmInEditExport(data);
    const nextStore = new PrimitiveStore({ clock: this.clock, ids: this.ids });
    for (const element of normalized.elements) {
      nextStore.importElement(element);
    }

    nextStore.validateReferences();
    this.primitiveStore = nextStore;
    this.featureStore.rebuildFromElements(this.primitiveStore.getElements());
  }

  exportOsmInEdit(): OsmInEditExport {
    const exported = this.primitiveStore.exportOsmInEdit();
    this.events.emit("exportReady", { elements: exported.elements });
    return exported;
  }

  validate(): never {
    throw new UnsupportedOperationError("validate");
  }

  on<TName extends EditorEventName>(
    eventName: TName,
    handler: EventHandler<EditorEventMap[TName]>
  ): () => void {
    return this.events.on(eventName, handler);
  }

  off<TName extends EditorEventName>(
    eventName: TName,
    handler: EventHandler<EditorEventMap[TName]>
  ): void {
    this.events.off(eventName, handler);
  }

  private addDraftCoordinate(coordinate: Coordinate): void {
    if (!this.draft) {
      return;
    }

    this.draft.coordinates.push(coordinate);
    const geometry = buildTemporaryGeometry(this.draft);
    if (geometry) {
      this.adapter?.showTemporaryFeature("draft", geometry);
    }
    this.events.emit("drawingUpdated", { pointCount: this.draft.coordinates.length });
  }

  private finishPointDrawing(draft: DraftDrawingState): FeatureRecord {
    const coordinate = draft.coordinates[0];
    const node = this.primitiveStore.createNode({
      lat: coordinate.lat,
      lon: coordinate.lon,
      tags: draft.tags
    });

    return this.featureStore.add({
      kind: draft.kind,
      geometryType: "point",
      level: draft.level,
      tags: draft.tags,
      primitiveRefs: { nodeIds: [node.id], relationIds: [] },
      coordinates: [{ lat: node.lat, lon: node.lon }]
    });
  }

  private finishWayDrawing(draft: DraftDrawingState): FeatureRecord {
    const nodes = draft.coordinates.map((coordinate) =>
      this.primitiveStore.createNode({
        lat: coordinate.lat,
        lon: coordinate.lon,
        tags: {}
      })
    );
    const way = this.primitiveStore.createWay({
      nodes: nodes.map((node) => node.id),
      tags: draft.tags,
      closed: true
    });

    return this.featureStore.add({
      kind: draft.kind,
      geometryType: "polygon",
      level: draft.level,
      tags: draft.tags,
      primitiveRefs: { nodeIds: way.nodes, wayId: way.id, relationIds: [] },
      coordinates: coordinatesForNodeIds(way.nodes, this.primitiveStore)
    });
  }

  private clearDraft(): void {
    this.draft = undefined;
    this.adapter?.clearTemporaryFeature("draft");
  }

  private requireFeature(featureId: string): FeatureRecord {
    const feature = this.featureStore.get(featureId);
    if (!feature) {
      throw new VertexEditError(`Feature ${featureId} does not exist`);
    }
    return feature;
  }

  private requireFeatureWayId(feature: FeatureRecord): number {
    if (feature.primitiveRefs.wayId === undefined) {
      throw new VertexEditError(`Feature ${feature.id} is not backed by a way`);
    }
    return feature.primitiveRefs.wayId;
  }

  private refreshFeatureHandles(featureId: string): void {
    const feature = this.requireFeature(featureId);
    const handles = getEditableNodeIds(feature).map((nodeId, index) => {
      const node = this.primitiveStore.getNode(nodeId);
      if (!node) {
        throw new VertexEditError(`Node ${nodeId} does not exist`);
      }
      return {
        id: `${featureId}-vertex-${index}`,
        coordinate: { lat: node.lat, lon: node.lon }
      };
    });
    this.adapter?.showVertexHandles(featureId, handles);
  }

  private afterGeometryUpdate(feature: FeatureRecord, wayId?: number): void {
    this.adapter?.updateFeature(this.withFeatureCoordinates(feature));
    if (this.selectedFeatureId === feature.id) {
      this.refreshFeatureHandles(feature.id);
    }
    if (wayId !== undefined) {
      this.events.emit("wayUpdated", { wayId });
    }
    this.events.emit("featureUpdated", { featureId: feature.id });
  }

  private deleteNodeIfUnreferenced(nodeId: number): void {
    try {
      this.primitiveStore.deleteElement("node", nodeId);
    } catch {
      return;
    }
  }

  private withFeatureCoordinates(feature: FeatureRecord): FeatureRecord {
    return {
      ...feature,
      coordinates: coordinatesForNodeIds(feature.primitiveRefs.nodeIds, this.primitiveStore)
    };
  }
}

function getEditableNodeIds(feature: FeatureRecord): number[] {
  const nodeIds = feature.primitiveRefs.nodeIds;
  if (
    feature.geometryType === "polygon" &&
    nodeIds.length > 1 &&
    nodeIds[0] === nodeIds[nodeIds.length - 1]
  ) {
    return nodeIds.slice(0, -1);
  }
  return [...nodeIds];
}

function uniqueNodeIds(nodeIds: readonly number[]): number[] {
  return [...new Set(nodeIds)];
}

function coordinatesForNodeIds(nodeIds: readonly number[], primitiveStore: PrimitiveStore): Coordinate[] {
  return nodeIds.map((nodeId) => {
    const node = primitiveStore.getNode(nodeId);
    if (!node) {
      throw new VertexEditError(`Node ${nodeId} does not exist`);
    }
    return { lat: node.lat, lon: node.lon };
  });
}

function immutableSnapshot<T>(value: T): Readonly<T> {
  return deepFreeze(cloneJson(value));
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }

  return value as Readonly<T>;
}
