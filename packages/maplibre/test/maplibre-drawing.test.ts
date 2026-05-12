import { describe, expect, it } from "vitest";
import { createEditor, ElementIdAllocator, fixedClock } from "@osminedit-lib/core";
import { createMapLibreAdapter } from "../src";
import { FakeMapLibreMap } from "./fake-maplibre-map";

describe("MapLibre drawing workflows", () => {
  it("commits a room polygon through MapLibre clicks", () => {
    const { adapter, editor, map } = createMapLibreDrawingEditor();

    editor.startDraw("room");
    clickMap(map, 1, 2);
    clickMap(map, 3, 4);
    clickMap(map, 5, 6);

    expect(adapter.getSourceData("draft").features.length).toBeGreaterThan(0);

    const feature = editor.finishDraw();

    expect(feature.kind).toBe("room");
    expect(adapter.getSourceData("draft").features).toEqual([]);
    expect(featureIds(adapter.getSourceData("committed"))).toEqual([feature.id]);
    expect(editor.exportOsmInEdit().elements).toMatchObject([
      { type: "node", id: 1, lat: 1, lon: 2 },
      { type: "node", id: 2, lat: 3, lon: 4 },
      { type: "node", id: 3, lat: 5, lon: 6 },
      { type: "way", id: 10, nodes: [1, 2, 3, 1] }
    ]);
  });

  it("commits a corridor polygon through MapLibre clicks", () => {
    const { editor, map } = createMapLibreDrawingEditor();

    editor.startDraw("corridor");
    clickMap(map, 0, 0);
    clickMap(map, 0, 10);
    clickMap(map, 4, 10);
    const feature = editor.finishDraw();

    expect(feature.tags).toEqual({ indoor: "corridor", level: "0" });
    expect(editor.exportOsmInEdit().elements).toContainEqual(
      expect.objectContaining({ type: "way", id: 10, nodes: [1, 2, 3, 1] })
    );
  });

  it("commits a POI point through MapLibre clicks", () => {
    const { editor, map } = createMapLibreDrawingEditor();

    editor.startDraw("poi", { tags: { amenity: "bench" } });
    clickMap(map, 7, 8);

    expect(editor.finishDraw()).toMatchObject({
      geometryType: "point",
      tags: { amenity: "bench", level: "0" }
    });
    expect(editor.exportOsmInEdit().elements).toMatchObject([
      { type: "node", id: 1, lat: 7, lon: 8, tags: { amenity: "bench", level: "0" } }
    ]);
  });

  it("cancelDraw clears draft visuals", () => {
    const { adapter, editor, map } = createMapLibreDrawingEditor();

    editor.startDraw("room");
    clickMap(map, 1, 2);
    editor.cancelDraw();

    expect(adapter.getSourceData("draft").features).toEqual([]);
    expect(editor.getElements()).toEqual([]);
  });
});

export function createMapLibreDrawingEditor() {
  const map = new FakeMapLibreMap();
  const adapter = createMapLibreAdapter();
  const editor = createEditor({
    adapter,
    target: map,
    defaultLevel: "0",
    ids: new ElementIdAllocator({ nodeStart: 1, wayStart: 10, relationStart: 20 }),
    clock: fixedClock("2026-05-12T09:10:00.000Z")
  });
  return { adapter, editor, map };
}

export function clickMap(map: FakeMapLibreMap, lat: number, lon: number): void {
  map.fire("click", { lngLat: { lng: lon, lat } });
}

function featureIds(data: ReturnType<ReturnType<typeof createMapLibreAdapter>["getSourceData"]>): string[] {
  return [
    ...new Set(data.features.map((item) => item.properties.featureId).filter(isString))
  ];
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
