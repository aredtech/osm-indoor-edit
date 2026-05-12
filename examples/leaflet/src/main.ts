import "leaflet/dist/leaflet.css";
import "./styles.css";
import * as L from "leaflet";
import { createEditor, type FeatureRecord } from "@osminedit-lib/core";
import { createLeafletAdapter } from "@osminedit-lib/leaflet";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root");
}

app.innerHTML = `
  <div id="map" class="map"></div>
  <section class="controls" aria-label="Map editing controls">
    <div class="button-grid">
      <button data-action="room">Draw room</button>
      <button data-action="corridor">Draw corridor</button>
      <button data-action="poi">Add POI</button>
      <button data-action="finish">Finish</button>
      <button data-action="cancel">Cancel</button>
      <button data-action="delete-feature" class="danger">Delete feature</button>
      <button data-action="delete-vertex">Delete vertex</button>
    </div>
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
    <p class="status" data-role="status">Level 0 ready</p>
  </section>
  <aside class="export-panel" aria-label="Export JSON">
    <h1 data-role="export-heading">No features yet</h1>
    <p data-role="empty-copy">Draw a room, corridor, or POI to populate export JSON.</p>
    <pre data-role="export" tabindex="0"></pre>
  </aside>
`;

const mapElement = document.querySelector<HTMLDivElement>("#map");
if (!mapElement) {
  throw new Error("Missing map element");
}

const map = L.map(mapElement, {
  center: [57.7089, 11.9746],
  zoom: 19,
  zoomControl: true,
  attributionControl: false
});

const adapter = createLeafletAdapter();
const editor = createEditor({ adapter, target: map, defaultLevel: "0" });
adapter.setLevel("0");

let selectedFeatureId: string | null = null;
let latestFeature: FeatureRecord | null = null;
const emptyExport = { elements: [], status: true as const };

const status = document.querySelector<HTMLElement>('[data-role="status"]');
const exportHeading = document.querySelector<HTMLElement>('[data-role="export-heading"]');
const emptyCopy = document.querySelector<HTMLElement>('[data-role="empty-copy"]');
const exportOutput = document.querySelector<HTMLElement>('[data-role="export"]');
const levelSelect = document.querySelector<HTMLSelectElement>('[data-role="level"]');
const nameInput = document.querySelector<HTMLInputElement>('[data-role="name"]');

function setStatus(message: string): void {
  if (status) {
    status.textContent = message;
  }
}

function renderExport(): void {
  const exported = editor.exportOsmInEdit();
  const data = exported.elements.length === 0 ? emptyExport : exported;
  if (exportOutput) {
    exportOutput.textContent = JSON.stringify(data, null, 2);
  }
  if (exportHeading) {
    exportHeading.textContent = exported.elements.length === 0 ? "No features yet" : "Export";
  }
  if (emptyCopy) {
    emptyCopy.hidden = exported.elements.length > 0;
  }
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
  editor.setLevel(levelSelect.value);
  adapter.setLevel(levelSelect.value);
  setStatus(`Level ${levelSelect.value} ready`);
  renderExport();
});

editor.on("featureSelected", (event) => {
  selectedFeatureId = event.featureId;
});

editor.on("featureCreated", (event) => {
  selectedFeatureId = event.featureId;
});

renderExport();
