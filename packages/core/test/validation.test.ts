import { describe, expect, it } from "vitest";
import {
  builtInValidationRules,
  createValidationContext,
  runValidationRules,
  type FeatureRecord,
  type OsmElement,
  type ValidationSeverity
} from "../src";

const severityValues: ValidationSeverity[] = ["error", "warning", "info"];

function node(id: number, lat: number, lon: number): OsmElement {
  return { type: "node", id, lat, lon, tags: {}, timestamp: "2026-05-12T09:00:00Z" };
}

function context(elements: OsmElement[], features: FeatureRecord[] = []) {
  return createValidationContext({ elements, features });
}

describe("validation rule runner", () => {
  it("runs a custom rule and exposes severity union values", () => {
    const result = runValidationRules(
      context([]),
      [
        () => [
          {
            ruleId: "custom rule",
            severity: "info",
            message: "custom rule ran"
          }
        ]
      ]
    );

    expect(severityValues).toEqual(["error", "warning", "info"]);
    expect(result).toEqual({
      valid: true,
      issues: [{ ruleId: "custom rule", severity: "info", message: "custom rule ran" }]
    });
  });
});

describe("built-in validation rules", () => {
  it("reports missing-level and missing-indoor warnings", () => {
    const result = runValidationRules(
      context([
        node(1, 0, 0),
        node(2, 0, 10),
        node(3, 10, 10),
        { type: "way", id: 10, nodes: [1, 2, 3, 1], tags: { indoor: "room" }, timestamp: "x" },
        { type: "way", id: 11, nodes: [1, 2, 3, 1], tags: { area: "yes", level: "0" }, timestamp: "x" }
      ]),
      builtInValidationRules
    );

    expect(result.issues).toContainEqual(
      expect.objectContaining({ ruleId: "missing-level", severity: "warning", elementId: 10 })
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ ruleId: "missing-indoor", severity: "warning", elementId: 11 })
    );
  });

  it("reports broken-way-reference and broken-relation-member errors", () => {
    const result = runValidationRules(
      context([
        node(1, 0, 0),
        { type: "way", id: 10, nodes: [1, 999, 1], tags: { indoor: "room", level: "0" }, timestamp: "x" },
        {
          type: "relation",
          id: 20,
          members: [{ type: "way", ref: 999, role: "outer" }],
          tags: { type: "multipolygon" },
          timestamp: "x"
        }
      ]),
      builtInValidationRules
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ ruleId: "broken-way-reference", severity: "error" })
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ ruleId: "broken-relation-member", severity: "error" })
    );
  });

  it("reports duplicate-node and too-few-way-nodes", () => {
    const result = runValidationRules(
      context([
        node(1, 0, 0),
        node(2, 0, 10),
        { type: "way", id: 10, nodes: [1, 2, 2, 1], tags: { indoor: "room", level: "0" }, timestamp: "x" }
      ]),
      builtInValidationRules
    );

    expect(result.issues.map((issue) => issue.ruleId)).toEqual(
      expect.arrayContaining(["duplicate-node", "too-few-way-nodes"])
    );
  });

  it("reports invalid-closed-way and a bow-tie self-intersecting-polygon", () => {
    const result = runValidationRules(
      context([
        node(1, 0, 0),
        node(2, 10, 10),
        node(3, 0, 10),
        node(4, 10, 0),
        { type: "way", id: 10, nodes: [1, 2, 3, 4, 1], tags: { indoor: "room", level: "0" }, timestamp: "x" },
        { type: "way", id: 11, nodes: [1, 2, 3], tags: { indoor: "room", level: "0" }, timestamp: "x" }
      ]),
      builtInValidationRules
    );

    expect(result.issues.map((issue) => issue.ruleId)).toEqual(
      expect.arrayContaining(["self-intersecting-polygon", "invalid-closed-way"])
    );
  });

  it("does not report geometry issues for a valid room polygon", () => {
    const result = runValidationRules(
      context([
        node(1, 0, 0),
        node(2, 0, 10),
        node(3, 10, 10),
        node(4, 10, 0),
        { type: "way", id: 10, nodes: [1, 2, 3, 4, 1], tags: { indoor: "room", level: "0" }, timestamp: "x" }
      ]),
      builtInValidationRules
    );

    expect(result.issues).toEqual([]);
  });
});
