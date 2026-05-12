import type { CircleMarkerOptions, PathOptions } from "leaflet";

export interface LeafletEditingStyles {
  draftLine: PathOptions;
  draftVertex: CircleMarkerOptions;
  preview: PathOptions;
  committed: PathOptions & CircleMarkerOptions;
  selected: PathOptions;
  vertexHandle: CircleMarkerOptions;
  midpointHandle: CircleMarkerOptions;
  snapIndicator: CircleMarkerOptions & PathOptions;
}

export const DEFAULT_LEAFLET_EDITING_STYLES: LeafletEditingStyles = {
  draftLine: {
    color: "#2563EB",
    weight: 2,
    opacity: 0.9
  },
  draftVertex: {
    radius: 6,
    color: "#FFFFFF",
    weight: 2,
    fillColor: "#2563EB",
    fillOpacity: 1
  },
  preview: {
    color: "#2563EB",
    weight: 2,
    opacity: 0.9,
    fillColor: "#60A5FA",
    fillOpacity: 0.22
  },
  committed: {
    radius: 6,
    color: "#0F766E",
    weight: 2,
    opacity: 0.9,
    fillColor: "#99F6E4",
    fillOpacity: 0.18
  },
  selected: {
    color: "#F97316",
    weight: 3,
    opacity: 1,
    fillOpacity: 0.12
  },
  vertexHandle: {
    radius: 7,
    color: "#F97316",
    weight: 2,
    fillColor: "#FFFFFF",
    fillOpacity: 1
  },
  midpointHandle: {
    radius: 5,
    color: "#2563EB",
    weight: 2,
    opacity: 0.7,
    fillColor: "#FFFFFF",
    fillOpacity: 0.85
  },
  snapIndicator: {
    radius: 8,
    color: "#22C55E",
    weight: 2,
    opacity: 0.9,
    fillColor: "#22C55E",
    fillOpacity: 0.25
  }
};

export function mergeLeafletEditingStyles(
  overrides: Partial<LeafletEditingStyles> = {}
): LeafletEditingStyles {
  return {
    draftLine: { ...DEFAULT_LEAFLET_EDITING_STYLES.draftLine, ...overrides.draftLine },
    draftVertex: { ...DEFAULT_LEAFLET_EDITING_STYLES.draftVertex, ...overrides.draftVertex },
    preview: { ...DEFAULT_LEAFLET_EDITING_STYLES.preview, ...overrides.preview },
    committed: { ...DEFAULT_LEAFLET_EDITING_STYLES.committed, ...overrides.committed },
    selected: { ...DEFAULT_LEAFLET_EDITING_STYLES.selected, ...overrides.selected },
    vertexHandle: { ...DEFAULT_LEAFLET_EDITING_STYLES.vertexHandle, ...overrides.vertexHandle },
    midpointHandle: {
      ...DEFAULT_LEAFLET_EDITING_STYLES.midpointHandle,
      ...overrides.midpointHandle
    },
    snapIndicator: {
      ...DEFAULT_LEAFLET_EDITING_STYLES.snapIndicator,
      ...overrides.snapIndicator
    }
  };
}
