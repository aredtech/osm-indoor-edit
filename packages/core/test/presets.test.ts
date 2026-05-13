import { describe, expect, it } from "vitest";
import {
  applyPresetFieldValues,
  buildPresetTags,
  createPresetCatalog,
  createPresetChangeDiff,
  type PresetDefinition
} from "../src";

describe("preset catalog", () => {
  it("returns cloned preset records", () => {
    const catalog = createPresetCatalog();
    const firstRoom = catalog.getPreset("indoor-room");

    expect(firstRoom?.name).toBe("Room");
    firstRoom!.tags.indoor = "mutated";

    expect(catalog.getPreset("indoor-room")?.tags.indoor).toBe("room");
  });

  it("searchPresets(\"motorcycle\") returns the motorcycle dealer preset", () => {
    const catalog = createPresetCatalog();

    const results = catalog.searchPresets("motorcycle");

    expect(results[0]?.id).toBe("shop-motorcycle");
    expect(results[0]?.geometry).toEqual(["point", "polygon"]);
    expect(results[0]?.fields.map((field) => field.key)).toEqual(
      expect.arrayContaining([
        "name",
        "operator",
        "brand",
        "second_hand",
        "service:motorcycle:sales",
        "service:motorcycle:rental",
        "opening_hours",
        "wheelchair"
      ])
    );
  });

  it("browses presets by group path and returns geometry options", () => {
    const catalog = createPresetCatalog();

    expect(catalog.browsePresets(["Building structure"]).map((preset) => preset.id)).toEqual(
      expect.arrayContaining(["indoor-room", "indoor-door", "indoor-elevator"])
    );
    expect(catalog.getPresetGeometryOptions("shop-motorcycle")).toEqual(["point", "polygon"]);
  });

  it("overrides built-in presets by id", () => {
    const catalog = createPresetCatalog({
      overrides: [
        {
          ...createPresetCatalog().getPreset("shop-motorcycle")!,
          name: "Motorcycle Showroom",
          terms: ["bike showroom"]
        }
      ]
    });

    expect(catalog.getPreset("shop-motorcycle")?.name).toBe("Motorcycle Showroom");
    expect(createPresetCatalog().getPreset("shop-motorcycle")?.name).toBe("Motorcycle dealer");
  });

  it("adds host presets without mutating built-ins", () => {
    const hostPreset: PresetDefinition = {
      id: "host-meeting-room",
      name: "Meeting room",
      groupPath: ["Host"],
      role: "functional",
      geometry: ["polygon"],
      tags: { room: "meeting" },
      fields: []
    };

    const catalog = createPresetCatalog({ presets: [hostPreset] });

    expect(catalog.getPreset("host-meeting-room")?.tags.room).toBe("meeting");
    expect(createPresetCatalog().getPreset("host-meeting-room")).toBeUndefined();
  });

  it("matches structural and functional presets separately", () => {
    const catalog = createPresetCatalog();

    const result = catalog.matchPresets({ indoor: "room", shop: "motorcycle" }, "polygon");

    expect(result.structural[0]?.preset.id).toBe("indoor-room");
    expect(result.structural[0]?.reasons).toContain("indoor=room");
    expect(result.functional[0]?.preset.id).toBe("shop-motorcycle");
    expect(result.functional[0]?.reasons).toContain("shop=motorcycle");
  });

  it("builds preset tags and applies sparse field values", () => {
    const motorcycle = createPresetCatalog().getPreset("shop-motorcycle")!;

    expect(buildPresetTags(motorcycle, { name: "Ared Bikes", wheelchair: "yes" })).toEqual({
      shop: "motorcycle",
      name: "Ared Bikes",
      wheelchair: "yes"
    });

    expect(
      applyPresetFieldValues(
        motorcycle,
        { shop: "motorcycle", name: "Ared Bikes", opening_hours: "Mo-Fr 09:00-17:00" },
        { name: "Ared Bikes", opening_hours: "" }
      )
    ).toEqual({
      set: { name: "Ared Bikes" },
      unset: ["opening_hours"],
      protectedKeys: ["shop"]
    });
  });

  it("empty optional field values unset tags", () => {
    const motorcycle = createPresetCatalog().getPreset("shop-motorcycle")!;

    expect(applyPresetFieldValues(motorcycle, { shop: "motorcycle", brand: "Honda" }, { brand: "" }).unset).toEqual([
      "brand"
    ]);
  });

  it("removes old hard tags and preserves non-conflicting tags", () => {
    const catalog = createPresetCatalog();
    const motorcycle = catalog.getPreset("shop-motorcycle")!;
    const cafe = catalog.getPreset("amenity-cafe")!;

    expect(
      createPresetChangeDiff(motorcycle, cafe, {
        shop: "motorcycle",
        name: "Ared Bikes",
        operator: "Ared",
        level: "0"
      })
    ).toEqual({
      set: { amenity: "cafe" },
      unset: ["shop"],
      protectedKeys: ["amenity"]
    });
  });
});
