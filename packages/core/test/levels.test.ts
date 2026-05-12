import { describe, expect, it } from "vitest";
import { isFeatureVisibleOnLevel, parseRepeatOn, type FeatureRecord } from "../src";

const baseFeature: FeatureRecord = {
  id: "feature-1",
  kind: "room",
  geometryType: "polygon",
  level: "0",
  tags: { indoor: "room", level: "0" },
  primitiveRefs: { nodeIds: [1, 2, 3, 1], wayId: 10, relationIds: [] }
};

describe("level helpers", () => {
  it("parses repeat_on comma and semicolon values", () => {
    expect(parseRepeatOn("0, 1;2,,; 3")).toEqual(["0", "1", "2", "3"]);
  });

  it("checks level and repeat_on visibility", () => {
    expect(isFeatureVisibleOnLevel(baseFeature, undefined)).toBe(true);
    expect(isFeatureVisibleOnLevel(baseFeature, "0")).toBe(true);
    expect(isFeatureVisibleOnLevel(baseFeature, "1")).toBe(false);
    expect(
      isFeatureVisibleOnLevel(
        { ...baseFeature, level: undefined, tags: { repeat_on: "1; 2" } },
        "2"
      )
    ).toBe(true);
  });
});
