import { describe, expect, it } from "vitest";
import {
  createEditor,
  DataIntegrityError,
  type OsmInEditExport,
  type ValidationRule
} from "../src";

const missingLevelFixture: OsmInEditExport = {
  status: true,
  elements: [
    { type: "node", id: 1, lat: 0, lon: 0, tags: {}, timestamp: "x" },
    { type: "node", id: 2, lat: 0, lon: 10, tags: {}, timestamp: "x" },
    { type: "node", id: 3, lat: 10, lon: 10, tags: {}, timestamp: "x" },
    { type: "way", id: 10, nodes: [1, 2, 3, 1], tags: { indoor: "room" }, timestamp: "x" }
  ]
};

describe("editor validation", () => {
  it("runs registerValidationRule custom rules and unregisters them", () => {
    const editor = createEditor({
      validationRules: [
        () => [{ ruleId: "constructor-rule", severity: "info", message: "constructor rule" }]
      ]
    });
    const customRule: ValidationRule = () => [
      { ruleId: "registered-rule", severity: "warning", message: "registered rule" }
    ];

    const unregister = editor.registerValidationRule(customRule);
    expect(editor.validate().issues.map((issue) => issue.ruleId)).toEqual([
      "constructor-rule",
      "registered-rule"
    ]);

    unregister();

    expect(editor.validate().issues.map((issue) => issue.ruleId)).toEqual(["constructor-rule"]);
  });

  it("emits validationChanged and exportOsmInEdit remains advisory", () => {
    const editor = createEditor();
    const events: boolean[] = [];
    editor.on("validationChanged", (event) => {
      events.push(event.valid);
      expect(event.issues[0]).toMatchObject({ ruleId: "missing-level" });
    });

    editor.loadOsmInEdit(missingLevelFixture);
    const result = editor.validate();
    const exported = editor.exportOsmInEdit();

    expect(result).toMatchObject({ valid: true });
    expect(result.issues).toContainEqual(expect.objectContaining({ ruleId: "missing-level" }));
    expect(exported.status).toBe(true);
    expect(events).toEqual([true]);
  });

  it("throws DataIntegrityError for structurally invalid imports before validation", () => {
    const editor = createEditor();

    expect(() =>
      editor.loadOsmInEdit({
        status: true,
        elements: [
          { type: "way", id: 10, nodes: [1, 2, 1], tags: { indoor: "room" }, timestamp: "x" }
        ]
      })
    ).toThrow(DataIntegrityError);
  });
});
