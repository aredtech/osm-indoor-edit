import type { Coordinate, RendererAdapter } from "./adapter";
import { type Clock, systemClock, toIsoTimestamp } from "./clock";
import {
  type CoordinateDelta,
  VertexEditError,
  canDeleteVertex,
  translateCoordinate
} from "./editing";
import {
  createMinimumTags,
  type DefaultTagsConfig,
  buildTemporaryGeometry,
  type DrawGeometryType,
  getMinimumPointCount,
  type DraftDrawingState,
  type DrawKind,
  resolveDrawGeometry,
  type StartDrawOptions
} from "./drawing";
import { DrawingIntegrityError, PresetCompatibilityError } from "./errors";
import {
  type EditorEventMap,
  type EventHandler,
  TypedEventEmitter,
  type EditorEventName
} from "./events";
import { FeatureStore, inferFeatureKind, type FeatureRecord } from "./feature-store";
import { normalizeOsmInEditExport } from "./import-export";
import { ElementIdAllocator, type ElementIdAllocatorOptions } from "./ids";
import { PrimitiveStore } from "./primitive-store";
import {
  applyPresetFieldValues as buildPresetFieldDiff,
  createPresetCatalog,
  createPresetChangeDiff,
  type PresetCatalog,
  type PresetCatalogOptions,
  type PresetMatchResult,
  type TagDiff
} from "./presets";
import type { CreateEditorRelationInput, RelationMemberInput, RelationMemberMatcher } from "./relations";
import {
  DEFAULT_SNAP_TOLERANCE_PX,
  resolveSnapCandidate,
  type ResolvedSnap,
  type SnapSettings
} from "./snapping";
import { collectSnapCandidates } from "./topology";
import type { OsmElement, OsmInEditExport, OsmRelation, Tags } from "./types";
import {
  builtInValidationRules,
  createValidationContext,
  runValidationRules,
  type ValidationResult,
  type ValidationRule
} from "./validation";

export interface EditorOptions {
  adapter?: RendererAdapter;
  target?: unknown;
  clock?: Clock;
  ids?: ElementIdAllocator;
  idStrategy?: ElementIdAllocator | ElementIdAllocatorOptions;
  defaultTags?: DefaultTagsConfig;
  defaultLevel?: string;
  snapping?: boolean | Partial<SnapSettings>;
  validationRules?: ValidationRule[];
  presets?: PresetCatalogOptions;
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
  getPresetCatalog(): PresetCatalog;
  matchFeaturePresets(featureId: string): PresetMatchResult;
  changeFeaturePreset(featureId: string, nextPresetId: string): FeatureRecord;
  applyPresetFieldValues(featureId: string, presetId: string, values: Record<string, unknown>): FeatureRecord;
  deleteVertex(featureId: string, vertexIndex: number): FeatureRecord;
  moveVertex(featureId: string, vertexIndex: number, coordinate: Coordinate): FeatureRecord;
  insertVertex(featureId: string, edgeIndex: number, coordinate: Coordinate): FeatureRecord;
  moveFeature(featureId: string, delta: CoordinateDelta): FeatureRecord;
  detachFeatureGeometry(featureId: string): FeatureRecord;
  createRelation(input: CreateEditorRelationInput): FeatureRecord;
  updateRelationTags(relationId: number, tags: Tags): FeatureRecord;
  appendRelationMember(relationId: number, member: RelationMemberInput): FeatureRecord;
  removeRelationMember(relationId: number, matcher: RelationMemberMatcher): FeatureRecord;
  setSnapping(options: boolean | Partial<SnapSettings>): void;
  getSnapping(): SnapSettings;
  getState(): Readonly<EditorStateSnapshot>;
  getElements(): readonly OsmElement[];
  loadOsmInEdit(data: OsmInEditExport): void;
  exportOsmInEdit(): OsmInEditExport;
  validate(): ValidationResult;
  registerValidationRule(rule: ValidationRule): () => void;
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
  private readonly defaultTags?: DefaultTagsConfig;
  private readonly presetCatalog: PresetCatalog;
  private level: string | undefined;
  private snapping: SnapSettings;
  private readonly validationRules: ValidationRule[];
  private draft: DraftDrawingState | undefined;
  private selectedFeatureId: string | null = null;
  private destroyed = false;

  constructor(options: EditorOptions) {
    this.clock = options.clock ?? systemClock;
    this.ids = resolveElementIdAllocator(options);
    this.defaultTags = options.defaultTags;
    this.presetCatalog = createPresetCatalog(options.presets);
    this.primitiveStore = new PrimitiveStore({ clock: this.clock, ids: this.ids });
    this.adapter = options.adapter;
    this.level = options.defaultLevel;
    this.snapping = normalizeSnapSettings(options.snapping);
    this.validationRules = [...(options.validationRules ?? [])];

    if (this.adapter && "target" in options) {
      this.adapter.attach(options.target);
    }

    if (this.adapter) {
      this.adapterUnsubscribers.push(
        this.adapter.on("pointerDown", (event) =>
          this.runAdapterMutation(() => this.addDraftCoordinate(event.coordinate))
        ),
        this.adapter.on("pointerMove", (event) =>
          this.runAdapterMutation(() => this.previewDraftCoordinate(event.coordinate))
        ),
        this.adapter.on("featureClick", (event) =>
          this.runAdapterMutation(() => this.selectFeature(event.featureId))
        ),
        this.adapter.on("vertexDrag", (event) =>
          this.runAdapterMutation(() =>
            this.moveVertex(event.featureId, event.vertexIndex, event.coordinate)
          )
        ),
        this.adapter.on("draftVertexDrag", (event) =>
          this.runAdapterMutation(() => this.moveDraftVertex(event.vertexIndex, event.coordinate))
        ),
        this.adapter.on("midpointClick", (event) =>
          this.runAdapterMutation(() =>
            this.insertVertex(event.featureId, event.edgeIndex, event.coordinate)
          )
        ),
        this.adapter.on("featureDrag", (event) =>
          this.runAdapterMutation(() =>
            this.moveFeature(event.featureId, {
              lat: event.to.lat - event.from.lat,
              lon: event.to.lon - event.from.lon
            })
          )
        )
      );
    }

    this.enqueueReadyEvent();
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
    this.events.emit("destroyed", { timestamp: toIsoTimestamp(this.clock) });
  }

  setLevel(level: string | undefined): void {
    const previousLevel = this.level;
    if (this.draft) {
      this.clearDraft();
      this.events.emit("toolChanged", { tool: null });
      this.events.emit("drawingCancelled", { reason: "levelChanged" });
    }
    this.level = level;
    this.adapter?.setLevel?.(level);
    this.events.emit("levelChanged", { level, previousLevel });
  }

  getLevel(): string | undefined {
    return this.level;
  }

  startDraw(kind: DrawKind, options: StartDrawOptions = {}): void {
    if (!this.level) {
      throw new DrawingIntegrityError("Select a level before drawing");
    }

    const geometryType = this.resolveStartDrawGeometry(kind, options);
    this.assertPresetGeometryCompatibility(options.presetId, geometryType);

    this.clearDraft();
    this.draft = {
      kind,
      geometryType,
      level: this.level,
      tags: createMinimumTags(kind, this.level, {
        ...resolveDefaultTags(this.defaultTags, kind, this.level),
        ...(options.tags ?? {})
      }),
      coordinates: [],
      nodeIds: [],
      ...(options.presetId === undefined ? {} : { presetId: options.presetId })
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

    if (draft.coordinates.length < getMinimumPointCount(draft.geometryType)) {
      throw new DrawingIntegrityError(minimumPointMessage(draft.geometryType, draft.kind));
    }

    const feature = draft.geometryType === "point" ? this.finishPointDrawing(draft) : this.finishWayDrawing(draft);
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
    for (const relationId of feature.primitiveRefs.relationIds ?? []) {
      this.primitiveStore.deleteElement("relation", relationId);
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

  getPresetCatalog(): PresetCatalog {
    return this.presetCatalog;
  }

  matchFeaturePresets(featureId: string): PresetMatchResult {
    const feature = this.requireFeature(featureId);
    const geometryType = feature.geometryType === "relation" ? undefined : feature.geometryType;
    return this.presetCatalog.matchPresets(feature.tags, geometryType);
  }

  changeFeaturePreset(featureId: string, nextPresetId: string): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const nextPreset = this.requirePreset(nextPresetId);
    const previousPresetId = feature.preset?.id ?? this.matchFeaturePresets(featureId).functional[0]?.preset.id;
    const previousPreset = previousPresetId ? this.presetCatalog.getPreset(previousPresetId) : undefined;
    const diff = createPresetChangeDiff(previousPreset, nextPreset, feature.tags);
    return this.applyTagDiff(featureId, diff, { id: nextPreset.id });
  }

  applyPresetFieldValues(featureId: string, presetId: string, values: Record<string, unknown>): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const preset = this.requirePreset(presetId);
    const diff = buildPresetFieldDiff(preset, feature.tags, values);
    return this.applyTagDiff(featureId, diff, { id: preset.id });
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
    this.afterSharedGeometryUpdate([nodeId]);
    return this.requireFeature(featureId);
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
    }

    this.afterSharedGeometryUpdate(movedNodeIds);
    return this.requireFeature(featureId);
  }

  detachFeatureGeometry(featureId: string): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const wayId = feature.primitiveRefs.wayId;
    if (wayId === undefined || feature.geometryType === "point" || feature.geometryType === "relation") {
      throw new VertexEditError(`Feature ${feature.id} cannot detach geometry`);
    }

    const clonedNodeIds = getEditableNodeIds(feature).map((nodeId) => {
      const node = this.requireNode(nodeId);
      return this.primitiveStore.createNode({ lat: node.lat, lon: node.lon }).id;
    });
    const way = this.primitiveStore.updateWayNodes(wayId, clonedNodeIds);
    const updated = this.featureStore.update(feature.id, {
      primitiveRefs: { ...feature.primitiveRefs, nodeIds: way.nodes }
    });
    this.afterGeometryUpdate(updated, wayId);
    return updated;
  }

  createRelation(input: CreateEditorRelationInput): FeatureRecord {
    const relation = this.primitiveStore.createRelation({
      members: input.members,
      tags: input.tags
    });
    const feature = this.syncRelationFeature(relation);
    this.events.emit("relationUpdated", { relationId: relation.id });
    this.events.emit("featureUpdated", { featureId: feature.id });
    return feature;
  }

  updateRelationTags(relationId: number, tags: Tags): FeatureRecord {
    const relation = this.primitiveStore.updateElementTags("relation", relationId, tags) as OsmRelation;
    const feature = this.syncRelationFeature(relation);
    this.events.emit("relationUpdated", { relationId });
    this.events.emit("featureUpdated", { featureId: feature.id });
    return feature;
  }

  appendRelationMember(relationId: number, member: RelationMemberInput): FeatureRecord {
    const relation = this.primitiveStore.appendRelationMember(relationId, member);
    const feature = this.syncRelationFeature(relation);
    this.events.emit("relationUpdated", { relationId });
    this.events.emit("featureUpdated", { featureId: feature.id });
    return feature;
  }

  removeRelationMember(relationId: number, matcher: RelationMemberMatcher): FeatureRecord {
    const relation = this.primitiveStore.removeRelationMember(relationId, matcher);
    const feature = this.syncRelationFeature(relation);
    this.events.emit("relationUpdated", { relationId });
    this.events.emit("featureUpdated", { featureId: feature.id });
    return feature;
  }

  setSnapping(options: boolean | Partial<SnapSettings>): void {
    this.snapping = normalizeSnapSettings(options);
    if (!this.snapping.enabled) {
      this.adapter?.clearSnapCandidate?.();
    }
  }

  getSnapping(): SnapSettings {
    return { ...this.snapping };
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
    for (const feature of this.featureStore.list()) {
      this.adapter?.removeFeature(feature.id);
    }
    this.adapter?.clearVertexHandles();
    this.adapter?.setSelectedFeature(null);
    this.selectedFeatureId = null;

    const normalized = normalizeOsmInEditExport(data);
    const nextStore = new PrimitiveStore({ clock: this.clock, ids: this.ids });
    for (const element of normalized.elements) {
      nextStore.importElement(element);
    }

    nextStore.validateReferences();
    this.primitiveStore = nextStore;
    this.featureStore.rebuildFromElements(this.primitiveStore.getElements());
    for (const feature of this.featureStore.list()) {
      this.adapter?.commitFeature(this.withFeatureCoordinates(feature));
    }
  }

  exportOsmInEdit(): OsmInEditExport {
    const exported = this.primitiveStore.exportOsmInEdit();
    this.events.emit("exportReady", { elements: exported.elements });
    return exported;
  }

  validate(): ValidationResult {
    const result = runValidationRules(
      createValidationContext({
        elements: this.primitiveStore.getElements(),
        features: this.featureStore.list()
      }),
      [...builtInValidationRules, ...this.validationRules]
    );
    this.events.emit("validationChanged", result);
    return result;
  }

  registerValidationRule(rule: ValidationRule): () => void {
    this.validationRules.push(rule);
    return () => {
      const index = this.validationRules.indexOf(rule);
      if (index >= 0) {
        this.validationRules.splice(index, 1);
      }
    };
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

    const snapped = this.resolveDraftSnap(coordinate);
    this.draft.coordinates.push(snapped.coordinate);
    this.draft.nodeIds?.push(snapped.nodeId);
    const geometry = buildTemporaryGeometry(this.draft);
    if (geometry) {
      this.adapter?.showTemporaryFeature("draft", geometry);
    }
    this.events.emit("drawingUpdated", { pointCount: this.draft.coordinates.length });
  }

  private previewDraftCoordinate(coordinate: Coordinate): void {
    if (!this.draft || this.draft.geometryType === "point") {
      return;
    }

    const previewCoordinate = this.resolveDraftPreviewSnap(coordinate);
    const geometry = buildTemporaryGeometry(this.draft, previewCoordinate);
    if (geometry) {
      this.adapter?.showTemporaryFeature("draft", geometry);
    }
  }

  private moveDraftVertex(vertexIndex: number, coordinate: Coordinate): void {
    if (!this.draft) {
      return;
    }

    if (vertexIndex < 0 || vertexIndex >= this.draft.coordinates.length) {
      throw new VertexEditError(`Draft vertex ${vertexIndex} does not exist`);
    }

    this.draft.coordinates[vertexIndex] = coordinate;
    if (this.draft.nodeIds) {
      this.draft.nodeIds[vertexIndex] = undefined;
    }
    const geometry = buildTemporaryGeometry(this.draft);
    if (geometry) {
      this.adapter?.showTemporaryFeature("draft", geometry);
    }
    this.events.emit("drawingUpdated", { pointCount: this.draft.coordinates.length });
  }

  private enqueueReadyEvent(): void {
    const emitReady = () => {
      if (!this.destroyed) {
        this.events.emit("ready", { timestamp: toIsoTimestamp(this.clock) });
      }
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(emitReady);
    } else {
      Promise.resolve().then(emitReady);
    }
  }

  private runAdapterMutation(action: () => void): void {
    try {
      action();
    } catch (error) {
      this.events.emit("error", { error: error instanceof Error ? error : new Error(String(error)) });
      throw error;
    }
  }

  private finishPointDrawing(draft: DraftDrawingState): FeatureRecord {
    const coordinate = draft.coordinates[0];
    const snappedNodeId = draft.nodeIds?.[0];
    const node =
      snappedNodeId === undefined
        ? this.primitiveStore.createNode({
            lat: coordinate.lat,
            lon: coordinate.lon,
            tags: draft.tags
          })
        : this.requireNode(snappedNodeId);

    return this.featureStore.add({
      kind: draft.kind,
      geometryType: "point",
      level: draft.level,
      tags: draft.tags,
      primitiveRefs: { nodeIds: [node.id], relationIds: [] },
      coordinates: [{ lat: node.lat, lon: node.lon }],
      ...(draft.presetId === undefined ? {} : { preset: { id: draft.presetId } })
    });
  }

  private finishWayDrawing(draft: DraftDrawingState): FeatureRecord {
    const nodeIds = draft.coordinates.map((coordinate, index) => {
      const existingNodeId = draft.nodeIds?.[index];
      if (existingNodeId !== undefined) {
        this.requireNode(existingNodeId);
        return existingNodeId;
      }
      return this.primitiveStore.createNode({
        lat: coordinate.lat,
        lon: coordinate.lon,
        tags: {}
      }).id;
    });
    const way =
      draft.geometryType === "line"
        ? this.primitiveStore.createWay({
            nodes: nodeIds,
            tags: draft.tags,
            closed: false
          })
        : this.primitiveStore.createWay({
            nodes: nodeIds,
            tags: draft.tags,
            closed: true
          });

    return this.featureStore.add({
      kind: draft.kind,
      geometryType: draft.geometryType,
      level: draft.level,
      tags: draft.tags,
      primitiveRefs: { nodeIds: way.nodes, wayId: way.id, relationIds: [] },
      coordinates: coordinatesForNodeIds(way.nodes, this.primitiveStore),
      ...(draft.presetId === undefined ? {} : { preset: { id: draft.presetId } })
    });
  }

  private resolveStartDrawGeometry(kind: DrawKind, options: StartDrawOptions): DrawGeometryType {
    try {
      return resolveDrawGeometry(kind, options);
    } catch (error) {
      throw new DrawingIntegrityError(error instanceof Error ? error.message : String(error));
    }
  }

  private assertPresetGeometryCompatibility(presetId: string | undefined, geometryType: DrawGeometryType): void {
    if (!presetId) {
      return;
    }

    const preset = this.presetCatalog.getPreset(presetId);
    if (!preset) {
      throw new PresetCompatibilityError(`Preset ${presetId} does not exist`);
    }
    if (!preset.geometry.includes(geometryType)) {
      throw new PresetCompatibilityError(`Preset ${presetId} does not support ${geometryType} geometry`);
    }
  }

  private requirePreset(presetId: string) {
    const preset = this.presetCatalog.getPreset(presetId);
    if (!preset) {
      throw new PresetCompatibilityError(`Preset ${presetId} does not exist`);
    }
    return preset;
  }

  private applyTagDiff(featureId: string, diff: TagDiff, preset?: { id: string }): FeatureRecord {
    const feature = this.requireFeature(featureId);
    const nextTags = { ...feature.tags };
    for (const key of diff.unset) {
      delete nextTags[key];
    }
    Object.assign(nextTags, diff.set);

    if (feature.primitiveRefs.wayId !== undefined) {
      this.primitiveStore.updateElementTags("way", feature.primitiveRefs.wayId, nextTags);
    } else {
      for (const nodeId of uniqueNodeIds(feature.primitiveRefs.nodeIds)) {
        this.primitiveStore.updateElementTags("node", nodeId, nextTags);
      }
    }

    const updated = this.featureStore.update(featureId, {
      tags: nextTags,
      level: nextTags.level ?? feature.level,
      ...(preset === undefined ? {} : { preset })
    });
    this.adapter?.updateFeature(this.withFeatureCoordinates(updated));
    this.events.emit("tagsUpdated", { featureId, tags: updated.tags });
    this.events.emit("featureUpdated", { featureId });
    return updated;
  }

  private clearDraft(): void {
    this.draft = undefined;
    this.adapter?.clearTemporaryFeature("draft");
    this.adapter?.clearSnapCandidate?.();
  }

  private resolveDraftSnap(coordinate: Coordinate): { coordinate: Coordinate; nodeId?: number } {
    const candidate = this.findDraftSnapCandidate(coordinate);
    if (!candidate) {
      this.adapter?.clearSnapCandidate?.();
      return { coordinate };
    }

    if (candidate.kind === "node") {
      this.adapter?.showSnapCandidate?.(candidate);
      return { coordinate: candidate.coordinate, nodeId: candidate.nodeId };
    }

    const { node, way } = this.primitiveStore.insertNodeInWayEdge(
      candidate.wayId,
      candidate.edgeIndex,
      candidate.coordinate
    );
    const resolved = { ...candidate, coordinate: { lat: node.lat, lon: node.lon } };
    this.refreshFeaturesForWay(candidate.wayId, way.nodes);
    this.adapter?.showSnapCandidate?.(resolved);
    return { coordinate: resolved.coordinate, nodeId: node.id };
  }

  private resolveDraftPreviewSnap(coordinate: Coordinate): Coordinate {
    const candidate = this.findDraftSnapCandidate(coordinate);
    if (!candidate) {
      this.adapter?.clearSnapCandidate?.();
      return coordinate;
    }

    this.adapter?.showSnapCandidate?.(candidate);
    return candidate.coordinate;
  }

  private findDraftSnapCandidate(coordinate: Coordinate): ResolvedSnap | undefined {
    if (!this.snapping.enabled || !this.adapter) {
      return undefined;
    }

    return resolveSnapCandidate(
      coordinate,
      collectSnapCandidates(this.primitiveStore.getElements()),
      (snapCoordinate) => this.adapter!.project(snapCoordinate),
      this.snapping.tolerancePx
    );
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

  private requireNode(nodeId: number) {
    const node = this.primitiveStore.getNode(nodeId);
    if (!node) {
      throw new VertexEditError(`Node ${nodeId} does not exist`);
    }
    return node;
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

  private afterSharedGeometryUpdate(changedNodeIds: readonly number[]): void {
    const affectedFeatures = new Map<string, FeatureRecord>();
    const affectedWayIds = new Set<number>();

    for (const nodeId of uniqueNodeIds(changedNodeIds)) {
      this.events.emit("nodeMoved", { nodeId });
      for (const way of this.primitiveStore.getWaysReferencingNode(nodeId)) {
        affectedWayIds.add(way.id);
      }
      for (const feature of this.featureStore.findByNodeId(nodeId)) {
        affectedFeatures.set(feature.id, feature);
        if (feature.primitiveRefs.wayId !== undefined) {
          affectedWayIds.add(feature.primitiveRefs.wayId);
        }
      }
    }

    for (const feature of affectedFeatures.values()) {
      const updated = this.featureStore.update(feature.id, {});
      this.adapter?.updateFeature(this.withFeatureCoordinates(updated));
      if (this.selectedFeatureId === feature.id) {
        this.refreshFeatureHandles(feature.id);
      }
      this.events.emit("featureUpdated", { featureId: feature.id });
    }

    for (const wayId of affectedWayIds) {
      this.events.emit("wayUpdated", { wayId });
    }
  }

  private refreshFeaturesForWay(wayId: number, nodeIds: number[]): void {
    for (const feature of this.featureStore.list()) {
      if (feature.primitiveRefs.wayId !== wayId) {
        continue;
      }

      const updated = this.featureStore.update(feature.id, {
        primitiveRefs: { ...feature.primitiveRefs, nodeIds }
      });
      this.adapter?.updateFeature(this.withFeatureCoordinates(updated));
      this.events.emit("featureUpdated", { featureId: feature.id });
    }
    this.events.emit("wayUpdated", { wayId });
  }

  private syncRelationFeature(relation: OsmRelation): FeatureRecord {
    const existing = this.featureStore.findByRelationId(relation.id)[0];
    const input = {
      kind: inferFeatureKind(relation.tags),
      geometryType: "relation" as const,
      level: relation.tags.level,
      tags: relation.tags,
      primitiveRefs: {
        nodeIds: relation.members
          .filter((member) => member.type === "node")
          .map((member) => member.ref),
        relationIds: [relation.id]
      }
    };

    if (existing) {
      return this.featureStore.update(existing.id, input);
    }

    return this.featureStore.add(input);
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

function minimumPointMessage(geometryType: DrawGeometryType, kind: DrawKind): string {
  if (geometryType === "point") {
    return kind === "poi" ? "Add a point before finishing this POI." : "Add a point before finishing this feature.";
  }

  if (geometryType === "line") {
    return "Add at least 2 points before finishing this line.";
  }

  return "Add at least 3 points before finishing this polygon.";
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

function resolveElementIdAllocator(options: EditorOptions): ElementIdAllocator {
  if (options.ids) {
    return options.ids;
  }

  if (options.idStrategy instanceof ElementIdAllocator) {
    return options.idStrategy;
  }

  return new ElementIdAllocator(options.idStrategy);
}

function resolveDefaultTags(
  config: DefaultTagsConfig | undefined,
  kind: DrawKind,
  level: string
): Tags {
  if (!config) {
    return {};
  }

  if (typeof config === "function") {
    return config(kind, level);
  }

  return config[kind] ?? {};
}

function normalizeSnapSettings(options: boolean | Partial<SnapSettings> | undefined): SnapSettings {
  if (options === true) {
    return { enabled: true, tolerancePx: DEFAULT_SNAP_TOLERANCE_PX };
  }

  if (options === false || options === undefined) {
    return { enabled: false, tolerancePx: DEFAULT_SNAP_TOLERANCE_PX };
  }

  return {
    enabled: options.enabled ?? false,
    tolerancePx: options.tolerancePx ?? DEFAULT_SNAP_TOLERANCE_PX
  };
}
