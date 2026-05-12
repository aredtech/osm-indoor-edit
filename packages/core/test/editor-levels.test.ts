import { describe, expect, it } from "vitest";
import { createEditor, FakeRendererAdapter } from "../src";

describe("editor level changes", () => {
  it("cancels active draft when level changes", () => {
    const adapter = new FakeRendererAdapter();
    const editor = createEditor({ adapter, target: { id: "map" }, defaultLevel: "0" });
    const cancellations: string[] = [];
    editor.on("drawingCancelled", (event) => cancellations.push(event.reason ?? ""));

    editor.startDraw("room");
    adapter.emit("pointerDown", { coordinate: { lat: 1, lon: 2 } });
    editor.setLevel("1");

    expect(cancellations).toEqual(["levelChanged"]);
    expect(adapter.calls.map((call) => call.name)).toContain("clearTemporaryFeature");
    expect(() => editor.finishDraw()).toThrow("No active drawing");
  });

  it("forwards level changes to adapters", () => {
    const adapter = new FakeRendererAdapter();
    const editor = createEditor({ adapter, target: { id: "map" }, defaultLevel: "0" });

    editor.setLevel("2");

    expect(adapter.calls.some((call) => call.name === "setLevel")).toBe(true);
  });
});
