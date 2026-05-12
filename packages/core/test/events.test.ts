import { describe, expect, it } from "vitest";
import { TypedEventEmitter, type EditorEventMap } from "../src";

describe("TypedEventEmitter", () => {
  it("emits subscribed payloads", () => {
    const events = new TypedEventEmitter<EditorEventMap>();
    const seen: string[] = [];

    events.on("featureCreated", (payload) => {
      seen.push(payload.featureId);
    });

    events.emit("featureCreated", { featureId: "feature-1" });

    expect(seen).toEqual(["feature-1"]);
  });

  it("supports unsubscribe returned from on", () => {
    const events = new TypedEventEmitter<EditorEventMap>();
    let count = 0;

    const unsubscribe = events.on("validationChanged", () => {
      count += 1;
    });

    events.emit("validationChanged", { valid: true, issues: [] });
    unsubscribe();
    events.emit("validationChanged", {
      valid: false,
      issues: [{ ruleId: "invalid", severity: "error", message: "invalid" }]
    });

    expect(count).toBe(1);
  });

  it("supports off with the original handler", () => {
    const events = new TypedEventEmitter<EditorEventMap>();
    let selected: string | null = null;
    const handler = (payload: EditorEventMap["featureSelected"]) => {
      selected = payload.featureId;
    };

    events.on("featureSelected", handler);
    events.off("featureSelected", handler);
    events.emit("featureSelected", { featureId: "feature-2" });

    expect(selected).toBeNull();
  });
});
