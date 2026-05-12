import { describe, expect, it } from "vitest";
import {
  createEditor,
  DataIntegrityError,
  normalizeOsmInEditExport,
  sortElementsForImport,
  type OsmInEditExport
} from "../src";
import customFixture from "./fixtures/imported-custom-way.json";
import relationFixture from "./fixtures/sample-relation.json";
import roomFixture from "./fixtures/sample-room.json";
import sharedRoomsFixture from "./fixtures/shared-rooms.json";
import exportSnapshot from "./snapshots/osminedit-export.snap.json";

const sampleRoom = roomFixture as unknown as OsmInEditExport;
const sampleRelation = relationFixture as unknown as OsmInEditExport;
const importedCustomWay = customFixture as unknown as OsmInEditExport;
const sharedRooms = sharedRoomsFixture as unknown as OsmInEditExport;

function roundTrip(fixture: OsmInEditExport): OsmInEditExport {
  const editor = createEditor();
  editor.loadOsmInEdit(fixture);
  return editor.exportOsmInEdit();
}

describe("import/export fixtures", () => {
  it("loads sample-room.json and preserves strict export shape", () => {
    const exported = roundTrip(sampleRoom);
    const way = exported.elements.find((element) => element.type === "way");

    expect(exported.status).toBe(true);
    expect(Object.keys(exported)).toEqual(["elements", "status"]);
    expect(way).toMatchObject({ type: "way", id: 10, tags: { indoor: "room", level: "0" } });
    expect(way?.type === "way" ? way.nodes[0] : undefined).toBe(
      way?.type === "way" ? way.nodes.at(-1) : undefined
    );
  });

  it("keeps nodes before ways and relations for sample-relation.json", () => {
    const exported = roundTrip(sampleRelation);

    expect(exported.elements.map((element) => element.type)).toEqual([
      "node",
      "node",
      "node",
      "way",
      "relation"
    ]);
    expect(exported.elements.at(-1)).toMatchObject({
      type: "relation",
      members: [{ type: "way", ref: 20, role: "outer" }]
    });
  });

  it("keeps relation-backed features in editor state without renderable geometry", () => {
    const editor = createEditor();

    editor.loadOsmInEdit(sampleRelation);

    expect(editor.getState().features).toContainEqual(
      expect.objectContaining({
        geometryType: "relation",
        primitiveRefs: expect.objectContaining({ relationIds: [30] })
      })
    );
  });

  it("loads imported-custom-way.json as a custom feature", () => {
    const editor = createEditor();

    editor.loadOsmInEdit(importedCustomWay);

    expect(editor.getState().features).toContainEqual(
      expect.objectContaining({
        kind: "custom",
        primitiveRefs: expect.objectContaining({ wayId: 40 })
      })
    );
  });

  it("loads shared-rooms and preserves shared references and unknown tags", () => {
    const editor = createEditor();

    editor.loadOsmInEdit(sharedRooms);
    editor.moveVertex("feature-1", 1, { lat: -1, lon: 11 });
    const exported = editor.exportOsmInEdit();
    const roomA = exported.elements.find((element) => element.type === "way" && element.id === 10);
    const roomB = exported.elements.find((element) => element.type === "way" && element.id === 11);
    const movedNode = exported.elements.find((element) => element.type === "node" && element.id === 2);

    expect(editor.getState().features.map((feature) => feature.primitiveRefs.nodeIds)).toEqual([
      [1, 2, 3, 4, 1],
      [2, 5, 6, 3, 2]
    ]);
    expect(roomA).toMatchObject({
      type: "way",
      nodes: [1, 2, 3, 4, 1],
      tags: { "source:floorplan": "survey" }
    });
    expect(roomB).toMatchObject({ type: "way", nodes: [2, 5, 6, 3, 2] });
    expect(movedNode).toMatchObject({ type: "node", id: 2, lat: -1, lon: 11 });
  });

  it("throws DataIntegrityError for structurally invalid imports", () => {
    expect(() =>
      roundTrip({
        status: true,
        elements: [
          {
            type: "way",
            id: 99,
            nodes: [1, 2, 1],
            tags: { indoor: "room", level: "0" },
            timestamp: "2026-05-12T09:00:00Z"
          }
        ]
      })
    ).toThrow(DataIntegrityError);
  });

  it("normalizes imports and matches the deterministic fixture snapshot", () => {
    expect({
      room: roundTrip(sampleRoom),
      relation: roundTrip(sampleRelation),
      custom: roundTrip(importedCustomWay)
    }).toEqual(exportSnapshot);
  });

  it("sortElementsForImport orders nodes before ways and relations by type and ID", () => {
    const sorted = sortElementsForImport([...sampleRelation.elements].reverse());

    expect(sorted.map((element) => `${element.type}:${element.id}`)).toEqual([
      "node:11",
      "node:12",
      "node:13",
      "way:20",
      "relation:30"
    ]);
  });

  it("normalizeOsmInEditExport preserves imported timestamps and IDs", () => {
    expect(normalizeOsmInEditExport(importedCustomWay).elements.at(-1)).toMatchObject({
      type: "way",
      id: 40,
      timestamp: "2026-05-11T16:42:41Z"
    });
  });
});
