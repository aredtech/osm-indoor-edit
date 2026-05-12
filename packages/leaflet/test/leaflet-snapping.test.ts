// @vitest-environment happy-dom
import * as L from "leaflet";
import { afterEach, describe, expect, it } from "vitest";
import { createLeafletAdapter } from "../src";

const maps: L.Map[] = [];

afterEach(() => {
  for (const map of maps.splice(0)) {
    map.remove();
  }
  document.body.replaceChildren();
});

describe("Leaflet snapping visuals", () => {
  it("renders showSnapCandidate and clearSnapCandidate in a separate snap layer", () => {
    const adapter = createAttachedAdapter();

    adapter.showSnapCandidate({
      kind: "node",
      nodeId: 1,
      coordinate: { lat: 1, lon: 2 },
      distancePx: 0
    });

    expect(adapter.styles.snapIndicator.color).toBe("#22C55E");
    expect(adapter.getLayerCounts().snap).toBe(1);

    adapter.showSnapCandidate({
      kind: "edge",
      wayId: 10,
      edgeIndex: 0,
      fromNodeId: 1,
      toNodeId: 2,
      from: { lat: 1, lon: 2 },
      to: { lat: 1, lon: 6 },
      coordinate: { lat: 1, lon: 4 },
      distancePx: 1
    });

    expect(adapter.getLayerCounts().snap).toBe(2);

    adapter.clearSnapCandidate();

    expect(adapter.getLayerCounts().snap).toBe(0);
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
