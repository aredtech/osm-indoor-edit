import { describe, expect, it } from "vitest";
import {
  createEditor,
  FakeRendererAdapter,
  fixedClock,
  TypedEventEmitter,
  type EditorEventMap
} from "../src";

describe("TypedEventEmitter", () => {
  it("emits subscribed payloads", () => {
    const events = new TypedEventEmitter<EditorEventMap>();
    const seen: string[] = [];

    events.on("featureCreated", (payload) => {
      seen.push(payload.featureId);
    });

    events.emit("featureCreated", { featureId: "feature-1" });

    expect(seen).toEqual(["feature-1"]);
  });

  it("supports unsubscribe returned from on", () => {
    const events = new TypedEventEmitter<EditorEventMap>();
    let count = 0;

    const unsubscribe = events.on("validationChanged", () => {
      count += 1;
    });

    events.emit("validationChanged", { valid: true, issues: [] });
    unsubscribe();
    events.emit("validationChanged", {
      valid: false,
      issues: [{ ruleId: "invalid", severity: "error", message: "invalid" }]
    });

    expect(count).toBe(1);
  });

  it("supports off with the original handler", () => {
    const events = new TypedEventEmitter<EditorEventMap>();
    let selected: string | null = null;
    const handler = (payload: EditorEventMap["featureSelected"]) => {
      selected = payload.featureId;
    };

    events.on("featureSelected", handler);
    events.off("featureSelected", handler);
    events.emit("featureSelected", { featureId: "feature-2" });

    expect(selected).toBeNull();
  });

  it("emits ready and destroyed lifecycle events", async () => {
    const editor = createEditor({ clock: fixedClock("2026-05-12T10:00:00.000Z") });
    const events: string[] = [];

    editor.on("ready", (payload) => events.push(`ready:${payload.timestamp}`));
    await Promise.resolve();
    editor.on("destroyed", (payload) => events.push(`destroyed:${payload.timestamp}`));
    editor.destroy();

    expect(events).toEqual([
      "ready:2026-05-12T10:00:00.000Z",
      "destroyed:2026-05-12T10:00:00.000Z"
    ]);
  });

  it("emits error when adapter-driven mutations fail", () => {
    const adapter = new FakeRendererAdapter();
    const editor = createEditor({ adapter, target: { id: "map" } });
    const errors: string[] = [];
    editor.on("error", (payload) => errors.push(payload.error.message));

    expect(() =>
      adapter.emit("featureClick", {
        featureId: "missing-feature",
        coordinate: { lat: 1, lon: 2 }
      })
    ).toThrow("Feature missing-feature does not exist");
    expect(errors).toEqual(["Feature missing-feature does not exist"]);
  });

  it("emits host UI event payloads for drawing, feature, validation, and export flows", () => {
    const adapter = new FakeRendererAdapter();
    const editor = createEditor({
      adapter,
      target: { id: "map" },
      defaultLevel: "0"
    });
    const events: string[] = [];

    editor.on("toolChanged", (payload) => events.push(`tool:${payload.tool}`));
    editor.on("levelChanged", (payload) => events.push(`level:${payload.level}`));
    editor.on("drawingStarted", (payload) => events.push(`draw-start:${payload.kind}`));
    editor.on("drawingUpdated", (payload) => events.push(`draw-update:${payload.pointCount}`));
    editor.on("drawingFinished", (payload) => events.push(`draw-finish:${payload.featureId}`));
    editor.on("featureCreated", (payload) => events.push(`feature-created:${payload.featureId}`));
    editor.on("featureSelected", (payload) => events.push(`feature-selected:${payload.featureId}`));
    editor.on("tagsUpdated", (payload) => events.push(`tags:${payload.tags.name}`));
    editor.on("validationChanged", (payload) => events.push(`validation:${payload.valid}`));
    editor.on("exportReady", (payload) => events.push(`exportReady:${payload.elements.length}`));

    editor.setLevel("1");
    editor.startDraw("poi", { tags: { name: "Desk" } });
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    const feature = editor.finishDraw();
    editor.selectFeature(feature.id);
    editor.updateTags(feature.id, { name: "Desk A" });
    editor.validate();
    editor.exportOsmInEdit();

    expect(events).toContain("tool:poi");
    expect(events).toContain("level:1");
    expect(events).toContain("draw-start:poi");
    expect(events).toContain("draw-update:1");
    expect(events).toContain(`draw-finish:${feature.id}`);
    expect(events).toContain(`feature-created:${feature.id}`);
    expect(events).toContain(`feature-selected:${feature.id}`);
    expect(events).toContain("tags:Desk A");
    expect(events).toContain("validation:true");
    expect(events).toContain("exportReady:1");
  });
});
