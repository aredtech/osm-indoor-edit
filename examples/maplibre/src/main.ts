import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import {
  createEditor,
  type EditorEventName,
  type FeatureRecord,
  type IndoorEditor,
  type ValidationResult
} from "@aredtech/osm-indoor-edit";
import { createMapLibreAdapter } from "@aredtech/osm-indoor-edit-maplibre";
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
  <section class="controls" aria-label="MapLibre map editing controls">
    <div class="section-title">MapLibre host controls</div>
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
      <span>Name</span>
      <input data-role="name" placeholder="Feature name" />
    </label>
    <button data-action="apply-name">Apply name</button>
    <p class="status" data-role="status">Map loading</p>
    <ol class="event-log" data-role="events" aria-label="Recent events"></ol>
  </section>
  <aside class="validation-panel" aria-label="Validation issues">
    <h2>Validation issues</h2>
    <p data-role="validation-summary">No validation run yet.</p>
    <ul data-role="validation-issues"></ul>
  </aside>
  <aside class="export-panel" aria-label="Export JSON">
    <h1 data-role="export-heading">Export JSON</h1>
    <p data-role="empty-copy">Draw a room, corridor, or POI to populate export JSON.</p>
    <pre data-role="export" tabindex="0"></pre>
  </aside>
`;

const mapElement = document.querySelector<HTMLDivElement>("#map");
if (!mapElement) {
  throw new Error("Missing map element");
}

const localStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#E8EEF5" }
    }
  ]
};

const map = new maplibregl.Map({
  container: mapElement,
  style: localStyle,
  center: [77.29243, 28.39186],
  zoom: 19,
  attributionControl: false
});

let editor: IndoorEditor | null = null;
let selectedFeatureId: string | null = null;
let latestFeature: FeatureRecord | null = null;
const emptyExport = { elements: [], status: true as const };
const recentEvents: string[] = [];

const status = document.querySelector<HTMLElement>('[data-role="status"]');
const exportHeading = document.querySelector<HTMLElement>('[data-role="export-heading"]');
const emptyCopy = document.querySelector<HTMLElement>('[data-role="empty-copy"]');
const exportOutput = document.querySelector<HTMLElement>('[data-role="export"]');
const levelSelect = document.querySelector<HTMLSelectElement>('[data-role="level"]');
const nameInput = document.querySelector<HTMLInputElement>('[data-role="name"]');
const snappingInput = document.querySelector<HTMLInputElement>('[data-role="snapping"]');
const validationSummary = document.querySelector<HTMLElement>('[data-role="validation-summary"]');
const validationIssues = document.querySelector<HTMLElement>('[data-role="validation-issues"]');
const eventLog = document.querySelector<HTMLElement>('[data-role="events"]');

function setStatus(message: string): void {
  if (status) {
    status.textContent = message;
  }
}

function requireEditor(): IndoorEditor {
  if (!editor) {
    throw new Error("MapLibre editor is still loading");
  }
  return editor;
}

function renderExport(): void {
  const activeEditor = editor;
  const exported = activeEditor?.exportOsmInEdit();
  const data = exported && exported.elements.length > 0 ? exported : emptyExport;
  if (exportOutput) {
    exportOutput.textContent = formatJson(data);
  }
  if (exportHeading) {
    exportHeading.textContent = "Export JSON";
  }
  if (emptyCopy) {
    emptyCopy.hidden = Boolean(exported && exported.elements.length > 0);
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

function recordEvent(eventName: EditorEventName): void {
  recentEvents.unshift(eventLabel(eventName));
  recentEvents.splice(5);
  renderEvents();
}

function runAction(action: string): void {
  try {
    const activeEditor = requireEditor();
    if (action === "room") {
      activeEditor.startDraw("room");
      setStatus("Drawing room");
    }
    if (action === "corridor") {
      activeEditor.startDraw("corridor");
      setStatus("Drawing corridor");
    }
    if (action === "poi") {
      activeEditor.startDraw("poi", { tags: { amenity: "poi" } });
      setStatus("Adding POI");
    }
    if (action === "finish") {
      latestFeature = activeEditor.finishDraw();
      selectedFeatureId = latestFeature.id;
      activeEditor.selectFeature(selectedFeatureId);
      setStatus(`Finished ${latestFeature.kind}`);
    }
    if (action === "cancel") {
      activeEditor.cancelDraw();
      setStatus(`Level ${activeEditor.getLevel()} ready`);
    }
    if (action === "load-sample") {
      activeEditor.loadOsmInEdit(sampleIndoorData);
      latestFeature = activeEditor.getState().features[0] ?? null;
      selectedFeatureId = latestFeature?.id ?? null;
      activeEditor.selectFeature(selectedFeatureId);
      setStatus("Sample loaded");
    }
    if (action === "validate") {
      renderValidation(activeEditor.validate());
      setStatus("Validation refreshed");
    }
    if (action === "delete-feature" && selectedFeatureId) {
      activeEditor.deleteFeature(selectedFeatureId);
      selectedFeatureId = null;
      latestFeature = null;
      setStatus("Feature deleted");
    }
    if (action === "delete-vertex" && selectedFeatureId) {
      latestFeature = activeEditor.deleteVertex(selectedFeatureId, 0);
      setStatus("Vertex deleted");
    }
    if (action === "apply-name" && selectedFeatureId && nameInput?.value) {
      latestFeature = activeEditor.updateTags(selectedFeatureId, { name: nameInput.value });
      setStatus("Name updated");
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

levelSelect?.addEventListener("change", () => {
  const activeEditor = requireEditor();
  activeEditor.setLevel(levelSelect.value);
  setStatus(`Level ${levelSelect.value} ready`);
  renderExport();
});

snappingInput?.addEventListener("change", () => {
  const activeEditor = requireEditor();
  activeEditor.setSnapping({ enabled: snappingInput.checked });
  setStatus(`Snapping ${snappingInput.checked ? "enabled" : "disabled"}`);
});

function initializeEditor(): void {
  const adapter = createMapLibreAdapter();
  editor = createEditor({ adapter, target: map, defaultLevel: "0" });

  editor.on("featureSelected", (event) => {
    selectedFeatureId = event.featureId;
    latestFeature = event.featureId
      ? editor?.getState().features.find((feature) => feature.id === event.featureId) ?? null
      : null;
    if (nameInput) {
      nameInput.value = latestFeature?.tags.name ?? "";
    }
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
  setStatus("Level 0 ready");
  renderExport();
}

map.on("load", initializeEditor);
renderExport();
