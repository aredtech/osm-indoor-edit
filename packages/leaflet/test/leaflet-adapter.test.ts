// @vitest-environment happy-dom
import * as L from "leaflet";
import { afterEach, describe, expect, it } from "vitest";
import {
  createLeafletAdapter,
  mergeLeafletEditingStyles
} from "../src";

const maps: L.Map[] = [];

afterEach(() => {
  for (const map of maps.splice(0)) {
    map.remove();
  }
  document.body.replaceChildren();
});

describe("createLeafletAdapter", () => {
  it("creates the osminedit-editing pane and SDK-owned layer groups", () => {
    const map = createMap();
    const adapter = createLeafletAdapter();

    adapter.attach(map);

    expect(map.getPane("osminedit-editing")).toBeTruthy();
    expect(adapter.getLayerCounts()).toEqual({
      root: 4,
      committed: 0,
      draft: 0,
      selection: 0,
      handles: 0
    });
  });

  it("removes SDK layers and listeners on detach without throwing", () => {
    const map = createMap();
    const adapter = createLeafletAdapter();
    const seen: Array<{ lat: number; lon: number }> = [];
    adapter.on("pointerDown", (event) => {
      seen.push(event.coordinate);
    });

    adapter.attach(map);
    map.fire("click", {
      latlng: L.latLng(57.7, 11.9),
      originalEvent: new MouseEvent("click")
    });
    adapter.detach();
    map.fire("click", {
      latlng: L.latLng(58.1, 12.3),
      originalEvent: new MouseEvent("click")
    });

    expect(seen).toEqual([{ lat: 57.7, lon: 11.9 }]);
    expect(() => adapter.detach()).not.toThrow();
  });

  it("merges style overrides with defaults", () => {
    const styles = mergeLeafletEditingStyles({
      draftLine: { color: "#111827" },
      vertexHandle: { radius: 9 }
    });

    expect(styles.draftLine.color).toBe("#111827");
    expect(styles.draftLine.weight).toBe(2);
    expect(styles.vertexHandle.radius).toBe(9);
    expect(styles.vertexHandle.color).toBe("#F97316");
  });

  it("emits pointerDown coordinates with lat and lon", () => {
    const map = createMap();
    const adapter = createLeafletAdapter();
    const seen: Array<{ lat: number; lon: number }> = [];

    adapter.attach(map);
    adapter.on("pointerDown", (event) => {
      seen.push(event.coordinate);
    });
    map.fire("click", {
      latlng: L.latLng(57.7089, 11.9746),
      originalEvent: new MouseEvent("click")
    });

    expect(seen).toEqual([{ lat: 57.7089, lon: 11.9746 }]);
  });
});

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
