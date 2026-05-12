// @vitest-environment happy-dom
import * as L from "leaflet";
import { afterEach, describe, expect, it } from "vitest";
import { createLeafletAdapter } from "../src";
import type { FeatureRecord } from "@aredtech/osm-indoor-edit";

const maps: L.Map[] = [];

afterEach(() => {
  for (const map of maps.splice(0)) {
    map.remove();
  }
  document.body.replaceChildren();
});

describe("Leaflet level filtering", () => {
  it("filters committed layers by current level and repeat_on", () => {
    const map = createMap();
    const adapter = createLeafletAdapter();
    adapter.attach(map);

    adapter.commitFeature(feature("feature-0", "0"));
    adapter.commitFeature(feature("feature-1", "1"));
    adapter.commitFeature(feature("feature-repeat", "2", { repeat_on: "0;1" }));

    adapter.setLevel("0");
    expect(adapter.getLayerCounts().committed).toBe(2);

    adapter.setLevel("1");
    expect(adapter.getLayerCounts().committed).toBe(2);

    adapter.setLevel("2");
    expect(adapter.getLayerCounts().committed).toBe(1);

    adapter.setLevel(undefined);
    expect(adapter.getLayerCounts().committed).toBe(3);
  });
});

function feature(id: string, level: string, tags: Record<string, string> = {}): FeatureRecord {
  return {
    id,
    kind: "room",
    geometryType: "polygon",
    level,
    tags: { indoor: "room", level, ...tags },
    primitiveRefs: { nodeIds: [1, 2, 3, 1], wayId: 10, relationIds: [] },
    coordinates: [
      { lat: 1, lon: 2 },
      { lat: 3, lon: 4 },
      { lat: 5, lon: 6 },
      { lat: 1, lon: 2 }
    ]
  };
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
