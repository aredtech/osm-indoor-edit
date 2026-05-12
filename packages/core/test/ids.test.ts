import { describe, expect, it } from "vitest";
import { ElementIdAllocator, fixedClock, toIsoTimestamp } from "../src";

describe("ElementIdAllocator", () => {
  it("generates large numeric IDs by element type", () => {
    const ids = new ElementIdAllocator();

    expect(ids.nextNodeId()).toBe(1000000001000000);
    expect(ids.nextWayId()).toBe(1000000000800000);
    expect(ids.nextRelationId()).toBe(1000000000000000);
  });

  it("accepts deterministic starts for tests", () => {
    const ids = new ElementIdAllocator({
      nodeStart: 11,
      wayStart: 21,
      relationStart: 31
    });

    expect(ids.nextNodeId()).toBe(11);
    expect(ids.nextNodeId()).toBe(12);
    expect(ids.nextWayId()).toBe(21);
    expect(ids.nextRelationId()).toBe(31);
  });
});

describe("clock helpers", () => {
  it("returns deterministic ISO timestamps from a fixed clock", () => {
    expect(toIsoTimestamp(fixedClock("2026-05-11T16:40:38.000Z"))).toBe(
      "2026-05-11T16:40:38.000Z"
    );
  });
});

