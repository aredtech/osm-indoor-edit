// @vitest-environment happy-dom
import * as L from "leaflet";
import { afterEach, describe, expect, it } from "vitest";
import { createLeafletAdapter } from "../src";
import type { FeatureRecord, VertexHandle } from "@aredtech/osm-indoor-edit";

const maps: L.Map[] = [];

const feature: FeatureRecord = {
  id: "feature-1",
  kind: "room",
  geometryType: "polygon",
  level: "0",
  tags: { indoor: "room", level: "0" },
  primitiveRefs: { nodeIds: [1, 2, 3, 1], wayId: 10, relationIds: [] },
  coordinates: [
    { lat: 1, lon: 2 },
    { lat: 3, lon: 4 },
    { lat: 5, lon: 6 },
    { lat: 1, lon: 2 }
  ]
};

const handles: VertexHandle[] = [
  { id: "feature-1-vertex-0", coordinate: { lat: 1, lon: 2 } },
  { id: "feature-1-vertex-1", coordinate: { lat: 3, lon: 4 } },
  { id: "feature-1-vertex-2", coordinate: { lat: 5, lon: 6 } }
];

afterEach(() => {
  for (const map of maps.splice(0)) {
    map.remove();
  }
  document.body.replaceChildren();
});

describe("Leaflet editing visuals", () => {
  it("emits featureClick for committed features", () => {
    const adapter = createAttachedAdapter();
    const seen: string[] = [];
    adapter.on("featureClick", (event) => seen.push(event.featureId));

    adapter.commitFeature(feature);
    adapter.fireCommittedFeatureClick(feature.id, { lat: 1, lon: 2 });

    expect(adapter.getCommittedLayerCount(feature.id)).toBe(1);
    expect(seen).toEqual([feature.id]);
  });

  it("renders selected state and #F97316 vertex handles", () => {
    const adapter = createAttachedAdapter();

    adapter.commitFeature(feature);
    adapter.setSelectedFeature(feature.id);
    adapter.showVertexHandles(feature.id, handles);

    expect(adapter.styles.vertexHandle.color).toBe("#F97316");
    expect(adapter.getLayerCounts().selection).toBe(1);
    expect(adapter.getHandleLayerCount(feature.id)).toBe(6);
  });

  it("emits vertexDrag, midpointClick, and featureDrag", () => {
    const adapter = createAttachedAdapter();
    const events: string[] = [];
    adapter.commitFeature(feature);
    adapter.showVertexHandles(feature.id, handles);
    adapter.on("vertexDrag", (event) => events.push(`vertex:${event.vertexIndex}`));
    adapter.on("midpointClick", (event) => events.push(`midpoint:${event.edgeIndex}`));
    adapter.on("featureDrag", (event) => events.push(`drag:${event.featureId}`));

    adapter.fireVertexDrag(feature.id, 1, { lat: 30, lon: 40 });
    adapter.fireMidpointClick(feature.id, 0, { lat: 2, lon: 3 });
    adapter.fireCommittedFeatureDrag(feature.id, { lat: 1, lon: 2 }, { lat: 2, lon: 3 });

    expect(events).toEqual(["vertex:1", "midpoint:0", "drag:feature-1"]);
  });

  it("cleans up committed feature and handles", () => {
    const adapter = createAttachedAdapter();
    adapter.commitFeature(feature);
    adapter.showVertexHandles(feature.id, handles);

    adapter.removeFeature(feature.id);

    expect(adapter.getLayerCounts().committed).toBe(0);
    expect(adapter.getLayerCounts().handles).toBe(0);
    expect(adapter.getHandleLayerCount(feature.id)).toBe(0);
  });
});

function createAttachedAdapter() {
  const map = createMap();
  const adapter = createLeafletAdapter();
  adapter.attach(map);
  return adapter;
}

function createMap(): L.Map {
  const container = document.createElement("div");
  container.style.width = "400px";
  container.style.height = "300px";
  document.body.append(container);
  const map = L.map(container, {
    center: [57.7089, 11.9746],
    zoom: 19,
    zoomControl: false,
    attributionControl: false
  });
  maps.push(map);
  return map;
}
