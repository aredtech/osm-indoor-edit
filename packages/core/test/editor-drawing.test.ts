import { describe, expect, it } from "vitest";
import {
  createEditor,
  DrawingIntegrityError,
  ElementIdAllocator,
  FakeRendererAdapter,
  fixedClock,
  PresetCompatibilityError,
  type TemporaryGeometry
} from "../src";

function createDrawingEditor() {
  const adapter = new FakeRendererAdapter();
  const editor = createEditor({
    adapter,
    target: { id: "map" },
    defaultLevel: "0",
    ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
    clock: fixedClock("2026-05-12T09:10:00.000Z")
  });

  return { adapter, editor };
}

function lastTemporaryGeometry(adapter: FakeRendererAdapter): TemporaryGeometry | undefined {
  return adapter.calls
    .filter((call) => call.name === "showTemporaryFeature")
    .at(-1)?.args[1] as TemporaryGeometry | undefined;
}

describe("editor drawing lifecycle", () => {
  it("throws Select a level before drawing when level is missing", () => {
    const editor = createEditor();

    expect(() => editor.startDraw("room")).toThrow(DrawingIntegrityError);
    expect(() => editor.startDraw("room")).toThrow("Select a level before drawing");
  });

  it("commits room primitives and exports a closed way", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });
    adapter.emit("pointerDown", { coordinate: { lat: 5, lon: 6 } });
    const feature = editor.finishDraw();

    expect(feature.kind).toBe("room");
    expect(feature.tags).toEqual({ indoor: "room", level: "0" });
    expect(feature.primitiveRefs.nodeIds).toEqual([1, 2, 3, 1]);
    expect(feature.primitiveRefs.wayId).toBe(10);
    expect(editor.exportOsmInEdit().elements).toMatchObject([
      { type: "node", id: 1, lat: 1, lon: 2 },
      { type: "node", id: 2, lat: 3, lon: 4 },
      { type: "node", id: 3, lat: 5, lon: 6 },
      { type: "way", id: 10, nodes: [1, 2, 3, 1], tags: { indoor: "room", level: "0" } }
    ]);
    expect(adapter.calls.map((call) => call.name)).toContain("commitFeature");
  });

  it("commits POI primitives with host tags", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("poi", { tags: { amenity: "bench", name: "Rest point" } });
    adapter.emit("pointerDown", { coordinate: { lat: 7, lon: 8 } });
    const feature = editor.finishDraw();

    expect(feature.geometryType).toBe("point");
    expect(feature.tags).toEqual({ amenity: "bench", name: "Rest point", level: "0" });
    expect(editor.exportOsmInEdit().elements).toMatchObject([
      {
        type: "node",
        id: 1,
        lat: 7,
        lon: 8,
        tags: { amenity: "bench", name: "Rest point", level: "0" }
      }
    ]);
  });

  it("applies defaultTags while preserving required indoor and level values", () => {
    const adapter = new FakeRendererAdapter();
    const editor = createEditor({
      adapter,
      target: { id: "map" },
      defaultLevel: "0",
      defaultTags: {
        room: {
          source: "survey",
          survey: "yes",
          level: "should-not-win",
          indoor: "should-not-win"
        }
      }
    });

    editor.startDraw("room", { tags: { source: "host", name: "Room 1" } });
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });
    adapter.emit("pointerDown", { coordinate: { lat: 5, lon: 6 } });
    const feature = editor.finishDraw();

    expect(feature.tags).toEqual({
      indoor: "room",
      level: "0",
      source: "host",
      survey: "yes",
      name: "Room 1"
    });
  });

  it("supports idStrategy options for local numeric IDs", () => {
    const adapter = new FakeRendererAdapter();
    const editor = createEditor({
      adapter,
      target: { id: "map" },
      defaultLevel: "0",
      idStrategy: { nodeStart: 501, wayStart: 601, relationStart: 701 }
    });

    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });
    adapter.emit("pointerDown", { coordinate: { lat: 5, lon: 6 } });
    editor.finishDraw();

    expect(editor.exportOsmInEdit().elements).toMatchObject([
      { type: "node", id: 501 },
      { type: "node", id: 502 },
      { type: "node", id: 503 },
      { type: "way", id: 601, nodes: [501, 502, 503, 501] }
    ]);
  });

  it("rejects incomplete polygon finish without committing primitives", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("corridor");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });

    expect(() => editor.finishDraw()).toThrow("Add at least 3 points before finishing this polygon.");
    expect(editor.getElements()).toEqual([]);
  });

  it("cancelDraw clears draft visuals and emits drawingCancelled", () => {
    const { adapter, editor } = createDrawingEditor();
    const cancellations: string[] = [];
    editor.on("drawingCancelled", (event) => cancellations.push(event.reason ?? ""));

    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    editor.cancelDraw();

    expect(cancellations).toEqual(["cancelDraw"]);
    expect(adapter.calls.map((call) => call.name)).toContain("clearTemporaryFeature");
    expect(editor.getElements()).toEqual([]);
  });

  it("shows custom line draft geometry and requires Add at least 2 points", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("custom", { geometryType: "line", tags: { indoor: "wall" }, presetId: "indoor-wall" });
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });

    expect(lastTemporaryGeometry(adapter)).toMatchObject({
      geometryType: "line",
      coordinates: [{ lat: 1, lon: 2 }]
    });
    expect(() => editor.finishDraw()).toThrow("Add at least 2 points before finishing this line.");
    expect(editor.getElements()).toEqual([]);
  });

  it("rejects incompatible preset geometry and does not mutate primitives", () => {
    const { editor } = createDrawingEditor();

    expect(() =>
      editor.startDraw("custom", { geometryType: "line", tags: { shop: "motorcycle" }, presetId: "shop-motorcycle" })
    ).toThrow(PresetCompatibilityError);
    expect(editor.getElements()).toEqual([]);
  });

  it("commits custom point with preset metadata", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("custom", {
      geometryType: "point",
      tags: { shop: "motorcycle", name: "Ared Bikes" },
      presetId: "shop-motorcycle"
    });
    adapter.emit("pointerDown", { coordinate: { lat: 7, lon: 8 } });
    const feature = editor.finishDraw();

    expect(feature).toMatchObject({
      kind: "custom",
      geometryType: "point",
      preset: { id: "shop-motorcycle" },
      tags: { shop: "motorcycle", name: "Ared Bikes", level: "0" }
    });
    expect(editor.exportOsmInEdit().elements).toMatchObject([
      { type: "node", id: 1, tags: { shop: "motorcycle", name: "Ared Bikes", level: "0" } }
    ]);
  });

  it("commits custom line and custom polygon", () => {
    const { adapter, editor } = createDrawingEditor();

    editor.startDraw("custom", { geometryType: "line", tags: { indoor: "wall" }, presetId: "indoor-wall" });
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });
    const line = editor.finishDraw();

    editor.startDraw("custom", {
      geometryType: "polygon",
      tags: { shop: "motorcycle", name: "Ared Bikes" },
      presetId: "shop-motorcycle"
    });
    adapter.emit("pointerDown", { coordinate: { lat: 5, lon: 6 } });
    adapter.emit("pointerDown", { coordinate: { lat: 7, lon: 8 } });
    adapter.emit("pointerDown", { coordinate: { lat: 9, lon: 10 } });
    const polygon = editor.finishDraw();

    expect(line).toMatchObject({ kind: "custom", geometryType: "line", primitiveRefs: { nodeIds: [1, 2] } });
    expect(polygon).toMatchObject({
      kind: "custom",
      geometryType: "polygon",
      primitiveRefs: { nodeIds: [3, 4, 5, 3] }
    });
    const ways = editor.exportOsmInEdit().elements.filter((element) => element.type === "way");
    expect(ways).toMatchObject([
      { type: "way", id: 10, nodes: [1, 2], tags: { indoor: "wall", level: "0" } },
      { type: "way", id: 11, nodes: [3, 4, 5, 3], tags: { shop: "motorcycle", name: "Ared Bikes", level: "0" } }
    ]);
  });

  it("changeFeaturePreset and applyPresetFieldValues update tags and emit events", () => {
    const { adapter, editor } = createDrawingEditor();
    const events: string[] = [];
    editor.on("tagsUpdated", (payload) => events.push(`tagsUpdated:${payload.tags.amenity ?? payload.tags.shop}`));
    editor.on("featureUpdated", (payload) => events.push(`featureUpdated:${payload.featureId}`));

    editor.startDraw("custom", {
      geometryType: "polygon",
      tags: { shop: "motorcycle", name: "Ared Bikes", brand: "Honda" },
      presetId: "shop-motorcycle"
    });
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    adapter.emit("pointerDown", { coordinate: { lat: 3, lon: 4 } });
    adapter.emit("pointerDown", { coordinate: { lat: 5, lon: 6 } });
    const feature = editor.finishDraw();

    const cafe = editor.changeFeaturePreset(feature.id, "amenity-cafe");
    expect(cafe.tags).toEqual({ level: "0", name: "Ared Bikes", brand: "Honda", amenity: "cafe" });
    expect(cafe.preset?.id).toBe("amenity-cafe");

    const updated = editor.applyPresetFieldValues(feature.id, "amenity-cafe", { brand: "", wheelchair: "yes" });
    expect(updated.tags).toEqual({
      level: "0",
      name: "Ared Bikes",
      amenity: "cafe",
      brand: "Honda",
      wheelchair: "yes"
    });
    expect(events).toEqual([
      "tagsUpdated:cafe",
      `featureUpdated:${feature.id}`,
      "tagsUpdated:cafe",
      `featureUpdated:${feature.id}`
    ]);
  });
});
