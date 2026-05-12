import type { RendererAdapter } from "./adapter";
import { type Clock, systemClock } from "./clock";
import { UnsupportedOperationError } from "./errors";
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
  startDraw(kind: string): never;
  cancelDraw(): never;
  finishDraw(): never;
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
  private readonly clock: Clock;
  private readonly ids: ElementIdAllocator;
  private level: string | undefined;
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
  }

  destroy(): void {
    if (this.destroyed) {
      return;
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

  startDraw(_kind: string): never {
    throw new UnsupportedOperationError("startDraw");
  }

  cancelDraw(): never {
    throw new UnsupportedOperationError("cancelDraw");
  }

  finishDraw(): never {
    throw new UnsupportedOperationError("finishDraw");
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
