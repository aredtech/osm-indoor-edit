import { describe, expect, it } from "vitest";
import {
  buildTemporaryGeometry,
  createMinimumTags,
  getMinimumPointCount,
  type DraftDrawingState
} from "../src";

describe("drawing helpers", () => {
  it("creates minimum indoor=room tags for room drawing", () => {
    expect(createMinimumTags("room", "0")).toEqual({ indoor: "room", level: "0" });
  });

  it("creates corridor tags and preserves host tags for POIs", () => {
    expect(createMinimumTags("corridor", "1")).toEqual({
      indoor: "corridor",
      level: "1"
    });
    expect(createMinimumTags("poi", "2", { amenity: "toilets", name: "North WC" })).toEqual({
      amenity: "toilets",
      name: "North WC",
      level: "2"
    });
  });

  it("reports minimum point counts", () => {
    expect(getMinimumPointCount("room")).toBe(3);
    expect(getMinimumPointCount("corridor")).toBe(3);
    expect(getMinimumPointCount("poi")).toBe(1);
  });

  it("builds line draft geometry before polygon preview", () => {
    const draft: DraftDrawingState = {
      kind: "room",
      level: "0",
      tags: { indoor: "room", level: "0" },
      coordinates: [
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 }
      ]
    };

    expect(buildTemporaryGeometry(draft)).toEqual({
      geometryType: "line",
      coordinates: draft.coordinates,
      vertexCoordinates: draft.coordinates
    });
  });

  it("builds polygon preview once 3 coordinates exist", () => {
    const draft: DraftDrawingState = {
      kind: "room",
      level: "0",
      tags: { indoor: "room", level: "0" },
      coordinates: [
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 },
        { lat: 5, lon: 6 }
      ]
    };

    expect(buildTemporaryGeometry(draft)).toEqual({
      geometryType: "polygon",
      coordinates: [
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 },
        { lat: 5, lon: 6 },
        { lat: 1, lon: 2 }
      ],
      vertexCoordinates: draft.coordinates
    });
  });
});
