import type { OsmIndoorError } from "./errors";
import type { OsmElement, Tags } from "./types";
import type { ValidationIssue } from "./validation";

export interface EditorEventMap {
  ready: { timestamp: string };
  destroyed: { timestamp: string };
  toolChanged: { tool: string | null };
  levelChanged: { level: string | undefined; previousLevel: string | undefined };
  drawingStarted: { kind: string };
  drawingUpdated: { pointCount: number };
  drawingCancelled: { reason?: string };
  drawingFinished: { featureId: string };
  featureCreated: { featureId: string };
  featureSelected: { featureId: string | null };
  featureUpdated: { featureId: string };
  featureDeleted: { featureId: string };
  nodeMoved: { nodeId: number };
  wayUpdated: { wayId: number };
  relationUpdated: { relationId: number };
  tagsUpdated: { featureId: string; tags: Tags };
  validationChanged: { valid: boolean; issues: ValidationIssue[] };
  exportReady: { elements: OsmElement[] };
  error: { error: OsmIndoorError | Error };
}

export type EventHandler<TPayload> = (payload: TPayload) => void;

export type EditorEventName = keyof EditorEventMap;

export class TypedEventEmitter<TEventMap extends object = EditorEventMap> {
  private readonly handlers = new Map<keyof TEventMap, Set<EventHandler<TEventMap[keyof TEventMap]>>>();

  on<TName extends keyof TEventMap>(
    eventName: TName,
    handler: EventHandler<TEventMap[TName]>
  ): () => void {
    const handlers = this.handlers.get(eventName) ?? new Set<EventHandler<TEventMap[keyof TEventMap]>>();
    handlers.add(handler as EventHandler<TEventMap[keyof TEventMap]>);
    this.handlers.set(eventName, handlers);

    return () => this.off(eventName, handler);
  }

  off<TName extends keyof TEventMap>(
    eventName: TName,
    handler: EventHandler<TEventMap[TName]>
  ): void {
    this.handlers.get(eventName)?.delete(handler as EventHandler<TEventMap[keyof TEventMap]>);
  }

  emit<TName extends keyof TEventMap>(eventName: TName, payload: TEventMap[TName]): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      (handler as EventHandler<TEventMap[TName]>)(payload);
    }
  }
}
