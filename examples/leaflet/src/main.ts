import "leaflet/dist/leaflet.css";
import "./styles.css";
import * as L from "leaflet";
import {
  buildPresetTags,
  createEditor,
  type EditorEventName,
  type FeatureRecord,
  type PresetDefinition,
  type PresetField,
  type PresetGeometryType,
  type ValidationResult
} from "@aredtech/osm-indoor-edit";
import { createLeafletAdapter } from "@aredtech/osm-indoor-edit-leaflet";
import {
  eventLabel,
  formatJson,
  sampleIndoorData,
  summarizeValidation
} from "@aredtech/osm-indoor-edit-example-vanilla";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root");
}

app.innerHTML = `
  <div id="map" class="map"></div>
  <section class="controls" aria-label="Map editing controls">
    <div class="section-title">Host controls</div>
    <div class="button-grid">
      <button data-action="room">Draw room</button>
      <button data-action="corridor">Draw corridor</button>
      <button data-action="poi">Add POI</button>
      <button data-action="finish">Finish</button>
      <button data-action="cancel">Cancel</button>
      <button data-action="load-sample">Load sample</button>
      <button data-action="validate">Validate</button>
      <button data-action="delete-feature" class="danger">Delete feature</button>
      <button data-action="delete-vertex">Delete vertex</button>
    </div>
    <label class="toggle">
      <input data-role="snapping" type="checkbox" checked />
      <span>Snapping</span>
    </label>
    <label class="field">
      <span>Level</span>
      <select data-role="level">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
      </select>
    </label>
    <label class="field">
      <span>Selected name</span>
      <input data-role="name" placeholder="Feature name" />
    </label>
    <button data-action="apply-name">Apply name</button>
    <section class="preset-section" aria-label="Preset">
      <div class="section-title">Preset</div>
      <label class="field">
        <span>Feature preset</span>
        <select data-role="preset"></select>
      </label>
      <label class="field">
        <span>Geometry</span>
        <select data-role="preset-geometry"></select>
      </label>
      <button data-action="draw-preset">Draw preset</button>
      <div class="preset-fields" data-role="preset-fields"></div>
      <button data-action="apply-fields">Apply fields</button>
    </section>
    <p class="status" data-role="status">Level 0 ready</p>
    <ol class="event-log" data-role="events" aria-label="Recent events"></ol>
  </section>
  <aside class="validation-panel" aria-label="Validation issues">
    <h2>Validation issues</h2>
    <p data-role="validation-summary">No validation run yet.</p>
    <ul data-role="validation-issues"></ul>
  </aside>
  <aside class="export-panel" aria-label="Export JSON">
    <h1 data-role="export-heading">Export JSON</h1>
    <p data-role="empty-copy">Draw a room, corridor, POI, or preset feature to populate export JSON.</p>
    <pre data-role="export" tabindex="0"></pre>
  </aside>
`;

const mapElement = document.querySelector<HTMLDivElement>("#map");
if (!mapElement) {
  throw new Error("Missing map element");
}

const sampleCenter: L.LatLngExpression = [28.39186, 77.29243];

const map = L.map(mapElement, {
  center: sampleCenter,
  zoom: 19,
  zoomControl: true,
  attributionControl: true
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 22,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let selectedFeatureId: string | null = null;
let latestFeature: FeatureRecord | null = null;
let selectedPresetId = "shop-motorcycle";
let selectedGeometry: PresetGeometryType = "polygon";
const emptyExport = { elements: [], status: true as const };
const recentEvents: string[] = [];

const status = document.querySelector<HTMLElement>('[data-role="status"]');
const exportHeading = document.querySelector<HTMLElement>('[data-role="export-heading"]');
const emptyCopy = document.querySelector<HTMLElement>('[data-role="empty-copy"]');
const exportOutput = document.querySelector<HTMLElement>('[data-role="export"]');
const levelSelect = document.querySelector<HTMLSelectElement>('[data-role="level"]');
const nameInput = document.querySelector<HTMLInputElement>('[data-role="name"]');
const snappingInput = document.querySelector<HTMLInputElement>('[data-role="snapping"]');
const presetSelect = document.querySelector<HTMLSelectElement>('[data-role="preset"]');
const geometrySelect = document.querySelector<HTMLSelectElement>('[data-role="preset-geometry"]');
const presetFields = document.querySelector<HTMLElement>('[data-role="preset-fields"]');
const validationSummary = document.querySelector<HTMLElement>('[data-role="validation-summary"]');
const validationIssues = document.querySelector<HTMLElement>('[data-role="validation-issues"]');
const eventLog = document.querySelector<HTMLElement>('[data-role="events"]');

const adapter = createLeafletAdapter();
const editor = createEditor({
  adapter,
  target: map,
  defaultLevel: "0",
  snapping: snappingInput?.checked ?? false
});
adapter.setLevel("0");

const geometryLabels: Record<PresetGeometryType, string> = {
  point: "Point",
  line: "Line",
  polygon: "Area"
};

function setStatus(message: string): void {
  if (status) {
    status.textContent = message;
  }
}

function renderExport(): void {
  const exported = editor.exportOsmInEdit();
  const data = exported.elements.length === 0 ? emptyExport : exported;
  if (exportOutput) {
    exportOutput.textContent = formatJson(data);
  }
  if (exportHeading) {
    exportHeading.textContent = "Export JSON";
  }
  if (emptyCopy) {
    emptyCopy.hidden = exported.elements.length > 0;
  }
}

function renderValidation(result: ValidationResult): void {
  const summary = summarizeValidation(result);
  if (validationSummary) {
    validationSummary.textContent = `${summary.total} total: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.infos} info`;
  }
  if (validationIssues) {
    validationIssues.innerHTML =
      result.issues.length === 0
        ? "<li>No issues found.</li>"
        : result.issues
            .map(
              (issue) =>
                `<li><strong>${issue.severity}</strong> ${issue.ruleId}: ${issue.message}</li>`
            )
            .join("");
  }
}

function renderEvents(): void {
  if (!eventLog) {
    return;
  }
  eventLog.innerHTML = recentEvents.map((entry) => `<li>${entry}</li>`).join("");
}

function selectedPreset(): PresetDefinition {
  const preset = editor.getPresetCatalog().getPreset(selectedPresetId);
  if (!preset) {
    throw new Error("Choose a preset before starting custom draw.");
  }
  return preset;
}

function renderPresetControls(): void {
  const catalog = editor.getPresetCatalog();
  const presets = catalog.listPresets().filter((preset) => preset.role === "functional");
  if (presetSelect) {
    presetSelect.innerHTML = presets
      .map((preset) => `<option value="${preset.id}">${preset.name}</option>`)
      .join("");
    presetSelect.value = selectedPresetId;
  }

  const geometries = catalog.getPresetGeometryOptions(selectedPresetId);
  if (!geometries.includes(selectedGeometry)) {
    selectedGeometry = geometries[0] ?? "point";
  }
  if (geometrySelect) {
    geometrySelect.innerHTML = geometries
      .map((geometry) => `<option value="${geometry}">${geometryLabels[geometry]}</option>`)
      .join("");
    geometrySelect.value = selectedGeometry;
  }
  renderPresetFields(selectedPreset());
}

function renderPresetFields(preset: PresetDefinition): void {
  if (!presetFields) {
    return;
  }
  const tags = latestFeature?.tags ?? {};
  presetFields.innerHTML = preset.fields.map((field) => renderPresetField(field, tags[field.key ?? ""] ?? "")).join("");
}

function renderPresetField(field: PresetField, value: string): string {
  const name = `preset-field-${field.id}`;
  const data = `data-preset-field="${field.id}"`;
  const common = `id="${name}" ${data}`;
  if (field.type === "textarea") {
    return `<label class="field preset-field"><span>${field.label}</span><textarea ${common}>${value}</textarea></label>`;
  }
  if (field.type === "combo" && field.options?.length) {
    const options = [
      '<option value=""></option>',
      ...field.options.map((option) => `<option value="${option.value}">${option.label ?? option.value}</option>`)
    ].join("");
    return `<label class="field preset-field"><span>${field.label}</span><select ${common}>${options}</select></label>`;
  }
  if (field.type === "check") {
    return `<label class="field preset-field"><span>${field.label}</span><select ${common}><option value=""></option><option value="yes">Yes</option><option value="no">No</option></select></label>`;
  }
  const inputType = field.type === "number" ? "number" : "text";
  return `<label class="field preset-field"><span>${field.label}</span><input ${common} type="${inputType}" value="${value}" /></label>`;
}

function collectPresetFieldValues(): Record<string, string> {
  const values: Record<string, string> = {};
  presetFields?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-preset-field]").forEach(
    (field) => {
      values[field.dataset.presetField ?? ""] = field.value;
    }
  );
  return values;
}

function recordEvent(eventName: EditorEventName): void {
  recentEvents.unshift(eventLabel(eventName));
  recentEvents.splice(5);
  renderEvents();
}

function runAction(action: string): void {
  try {
    if (action === "room") {
      editor.startDraw("room");
      setStatus("Drawing room");
    }
    if (action === "corridor") {
      editor.startDraw("corridor");
      setStatus("Drawing corridor");
    }
    if (action === "poi") {
      editor.startDraw("poi", { tags: { amenity: "poi" } });
      setStatus("Adding POI");
    }
    if (action === "finish") {
      latestFeature = editor.finishDraw();
      selectedFeatureId = latestFeature.id;
      editor.selectFeature(selectedFeatureId);
      setStatus(`Finished ${latestFeature.kind}`);
    }
    if (action === "cancel") {
      editor.cancelDraw();
      setStatus(`Level ${editor.getLevel()} ready`);
    }
    if (action === "load-sample") {
      editor.loadOsmInEdit(sampleIndoorData);
      latestFeature = editor.getState().features[0] ?? null;
      selectedFeatureId = latestFeature?.id ?? null;
      editor.selectFeature(selectedFeatureId);
      map.setView(sampleCenter, 19);
      setStatus("Sample loaded");
    }
    if (action === "validate") {
      renderValidation(editor.validate());
      setStatus("Validation refreshed");
    }
    if (action === "delete-feature" && selectedFeatureId) {
      editor.deleteFeature(selectedFeatureId);
      selectedFeatureId = null;
      latestFeature = null;
      setStatus("Feature deleted");
    }
    if (action === "delete-vertex" && selectedFeatureId) {
      latestFeature = editor.deleteVertex(selectedFeatureId, 0);
      setStatus("Vertex deleted");
    }
    if (action === "apply-name" && selectedFeatureId && nameInput?.value) {
      latestFeature = editor.updateTags(selectedFeatureId, { name: nameInput.value });
      setStatus("Name updated");
    }
    if (action === "draw-preset") {
      const preset = selectedPreset();
      editor.startDraw("custom", {
        geometryType: selectedGeometry,
        presetId: preset.id,
        tags: buildPresetTags(preset)
      });
      setStatus(`Drawing ${preset.name} as ${geometryLabels[selectedGeometry]}`);
    }
    if (action === "apply-fields" && selectedFeatureId) {
      latestFeature = editor.applyPresetFieldValues(selectedFeatureId, selectedPresetId, collectPresetFieldValues());
      setStatus("Preset fields applied");
      renderPresetControls();
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Action failed");
  } finally {
    renderExport();
  }
}

document.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (button) {
    runAction(button.dataset.action ?? "");
  }
});

presetSelect?.addEventListener("change", () => {
  selectedPresetId = presetSelect.value;
  renderPresetControls();
});

geometrySelect?.addEventListener("change", () => {
  selectedGeometry = geometrySelect.value as PresetGeometryType;
});

levelSelect?.addEventListener("change", () => {
  editor.setLevel(levelSelect.value);
  setStatus(`Level ${levelSelect.value} ready`);
  renderExport();
});

snappingInput?.addEventListener("change", () => {
  editor.setSnapping({ enabled: snappingInput.checked });
  setStatus(`Snapping ${snappingInput.checked ? "enabled" : "disabled"}`);
});

editor.on("featureSelected", (event) => {
  selectedFeatureId = event.featureId;
  latestFeature = event.featureId
    ? editor.getState().features.find((feature) => feature.id === event.featureId) ?? null
    : null;
  if (nameInput) {
    nameInput.value = latestFeature?.tags.name ?? "";
  }
  if (latestFeature?.preset?.id) {
    selectedPresetId = latestFeature.preset.id;
  }
  renderPresetControls();
});

editor.on("featureCreated", (event) => {
  selectedFeatureId = event.featureId;
});

const trackedEvents = [
  "ready",
  "toolChanged",
  "levelChanged",
  "drawingStarted",
  "drawingFinished",
  "featureCreated",
  "featureSelected",
  "featureUpdated",
  "validationChanged",
  "exportReady",
  "error"
] as const;

for (const eventName of trackedEvents) {
  editor.on(eventName, () => recordEvent(eventName));
}

editor.on("validationChanged", renderValidation);
editor.on("error", (event) => setStatus(event.error.message));

renderPresetControls();
renderExport();
