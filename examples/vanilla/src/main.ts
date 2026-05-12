import type { EditorEventName, OsmInEditExport, ValidationResult } from "@osminedit-lib/core";

export const sampleIndoorData: OsmInEditExport = {
  status: true,
  elements: [
    {
      type: "node",
      id: 9000000001,
      lat: 28.39182,
      lon: 77.29234,
      tags: { level: "0" },
      timestamp: "2026-05-12T09:00:00Z"
    },
    {
      type: "node",
      id: 9000000002,
      lat: 28.39182,
      lon: 77.29243,
      tags: { level: "0" },
      timestamp: "2026-05-12T09:00:00Z"
    },
    {
      type: "node",
      id: 9000000003,
      lat: 28.3919,
      lon: 77.29243,
      tags: { level: "0" },
      timestamp: "2026-05-12T09:00:00Z"
    },
    {
      type: "node",
      id: 9000000004,
      lat: 28.3919,
      lon: 77.29234,
      tags: { level: "0" },
      timestamp: "2026-05-12T09:00:00Z"
    },
    {
      type: "node",
      id: 9000000005,
      lat: 28.39182,
      lon: 77.29252,
      tags: { level: "0" },
      timestamp: "2026-05-12T09:00:00Z"
    },
    {
      type: "node",
      id: 9000000006,
      lat: 28.3919,
      lon: 77.29252,
      tags: { level: "0" },
      timestamp: "2026-05-12T09:00:00Z"
    },
    {
      type: "node",
      id: 9000000007,
      lat: 28.39186,
      lon: 77.292475,
      tags: {
        amenity: "drinking_water",
        indoor: "yes",
        level: "0",
        name: "Water point"
      },
      timestamp: "2026-05-12T09:00:00Z"
    },
    {
      type: "way",
      id: 9000000101,
      nodes: [9000000001, 9000000002, 9000000003, 9000000004, 9000000001],
      tags: {
        indoor: "room",
        level: "0",
        name: "Room A"
      },
      timestamp: "2026-05-12T09:00:00Z",
      featureTypeId: 1
    },
    {
      type: "way",
      id: 9000000102,
      nodes: [9000000002, 9000000005, 9000000006, 9000000003, 9000000002],
      tags: {
        indoor: "corridor",
        level: "0",
        name: "East corridor"
      },
      timestamp: "2026-05-12T09:00:00Z",
      featureTypeId: 2
    }
  ]
};

export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function summarizeValidation(result: ValidationResult): {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
} {
  return {
    total: result.issues.length,
    errors: result.issues.filter((issue) => issue.severity === "error").length,
    warnings: result.issues.filter((issue) => issue.severity === "warning").length,
    infos: result.issues.filter((issue) => issue.severity === "info").length
  };
}

export function eventLabel(eventName: EditorEventName): string {
  return eventName;
}
