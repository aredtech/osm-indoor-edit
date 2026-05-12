import type { Coordinate, RendererAdapter } from "./adapter";
import { type Clock, systemClock } from "./clock";
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
  selectFeature(featureId: string | null): never;
  deleteFeature(featureId: string): never;
  updateTags(featureId: string, tags: Tags): never;
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
        this.adapter.on("pointerDown", (event) => this.addDraftCoordinate(event.coordinate))
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
    this.adapter?.commitFeature(feature);
    this.events.emit("toolChanged", { tool: null });
    this.events.emit("drawingFinished", { featureId: feature.id });
    this.events.emit("featureCreated", { featureId: feature.id });
    return feature;
  }

  selectFeature(_featureId: string | null): never {
    throw new UnsupportedOperationError("selectFeature");
  }

  deleteFeature(_featureId: string): never {
    throw new UnsupportedOperationError("deleteFeature");
  }

  updateTags(_featureId: string, _tags: Tags): never {
    throw new UnsupportedOperationError("updateTags");
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
      primitiveRefs: { nodeIds: [node.id], relationIds: [] }
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
      primitiveRefs: { nodeIds: way.nodes, wayId: way.id, relationIds: [] }
    });
  }

  private clearDraft(): void {
    this.draft = undefined;
    this.adapter?.clearTemporaryFeature("draft");
  }
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
