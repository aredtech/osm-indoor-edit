import { BUILT_IN_PRESETS } from "./preset-data";
import type { Tags } from "./types";

export type PresetGeometryType = "point" | "line" | "polygon";
export type PresetRole = "structural" | "functional";
export type PresetFieldType = "text" | "number" | "combo" | "multiselect" | "check" | "textarea" | "reference";
export type PresetMatchMode = "keyvalue" | "key" | "none";

export interface PresetFieldOption {
  value: string;
  label?: string;
  description?: string;
}

export interface PresetField {
  id: string;
  type: PresetFieldType;
  label: string;
  key?: string;
  group?: string;
  options?: readonly PresetFieldOption[];
  defaultValue?: string | readonly string[] | boolean | number;
  readOnly?: boolean;
  description?: string;
}

export interface PresetDefinition {
  id: string;
  name: string;
  groupPath: string[];
  role: PresetRole;
  geometry: PresetGeometryType[];
  tags: Tags;
  fields: PresetField[];
  match?: Record<string, PresetMatchMode>;
  icon?: string;
  iconSvg?: string;
  terms?: string[];
}

export interface PresetCatalogOptions {
  presets?: readonly PresetDefinition[];
  overrides?: readonly PresetDefinition[];
}

export interface PresetSearchOptions {
  geometry?: PresetGeometryType;
  role?: PresetRole;
}

export interface PresetMatchCandidate {
  preset: PresetDefinition;
  score: number;
  reasons: string[];
}

export interface PresetMatchResult {
  structural: PresetMatchCandidate[];
  functional: PresetMatchCandidate[];
}

export interface TagDiff {
  set: Tags;
  unset: string[];
  protectedKeys: string[];
}

export interface PresetCatalog {
  listPresets(): PresetDefinition[];
  getPreset(id: string): PresetDefinition | undefined;
  browsePresets(path?: string[]): PresetDefinition[];
  searchPresets(query: string, options?: PresetSearchOptions): PresetDefinition[];
  getPresetGeometryOptions(id: string): PresetGeometryType[];
  matchPresets(tags: Tags, geometryType?: PresetGeometryType): PresetMatchResult;
}

interface ScoredPreset {
  preset: PresetDefinition;
  score: number;
}

export function createPresetCatalog(options: PresetCatalogOptions = {}): PresetCatalog {
  const presetsById = new Map<string, PresetDefinition>();

  for (const preset of BUILT_IN_PRESETS) {
    presetsById.set(preset.id, clonePreset(preset));
  }
  for (const preset of options.presets ?? []) {
    presetsById.set(preset.id, clonePreset(preset));
  }
  for (const preset of options.overrides ?? []) {
    presetsById.set(preset.id, clonePreset(preset));
  }

  const listInternal = () => Array.from(presetsById.values());

  return {
    listPresets() {
      return listInternal().map(clonePreset);
    },
    getPreset(id: string) {
      const preset = presetsById.get(id);
      return preset ? clonePreset(preset) : undefined;
    },
    browsePresets(path: string[] = []) {
      return listInternal()
        .filter((preset) => startsWithPath(preset.groupPath, path))
        .map(clonePreset);
    },
    searchPresets(query: string, searchOptions: PresetSearchOptions = {}) {
      const normalizedQuery = normalize(query);
      return listInternal()
        .filter((preset) => matchesFilters(preset, searchOptions))
        .map((preset): ScoredPreset => ({ preset, score: scoreSearchMatch(preset, normalizedQuery) }))
        .filter((entry) => normalizedQuery.length === 0 || entry.score > 0)
        .sort((left, right) => right.score - left.score || left.preset.name.localeCompare(right.preset.name))
        .map((entry) => clonePreset(entry.preset));
    },
    getPresetGeometryOptions(id: string) {
      return [...(presetsById.get(id)?.geometry ?? [])];
    },
    matchPresets(tags: Tags, geometryType?: PresetGeometryType) {
      const result: PresetMatchResult = { structural: [], functional: [] };
      for (const preset of listInternal()) {
        if (geometryType && !preset.geometry.includes(geometryType)) {
          continue;
        }
        const candidate = matchPreset(preset, tags);
        if (!candidate) {
          continue;
        }
        result[preset.role].push(candidate);
      }
      result.structural.sort(compareCandidate);
      result.functional.sort(compareCandidate);
      return {
        structural: result.structural.map(cloneCandidate),
        functional: result.functional.map(cloneCandidate)
      };
    }
  };
}

export function buildPresetTags(preset: PresetDefinition, fieldValues: Record<string, unknown> = {}): Tags {
  const tags: Tags = { ...preset.tags };
  const fieldDiff = applyPresetFieldValues(preset, tags, fieldValues);
  return { ...tags, ...fieldDiff.set };
}

export function applyPresetFieldValues(
  preset: PresetDefinition,
  currentTags: Tags,
  values: Record<string, unknown>
): TagDiff {
  const set: Tags = {};
  const unset: string[] = [];
  const protectedKeys = Object.keys(preset.tags);

  for (const field of preset.fields) {
    if (!field.key || protectedKeys.includes(field.key) || !(field.id in values) && !(field.key in values)) {
      continue;
    }
    const rawValue = field.id in values ? values[field.id] : values[field.key];
    const normalizedValue = normalizeFieldValue(rawValue);
    if (normalizedValue === undefined) {
      if (field.key in currentTags) {
        unset.push(field.key);
      }
    } else {
      set[field.key] = normalizedValue;
    }
  }

  return { set, unset, protectedKeys };
}

export function createPresetChangeDiff(
  previousPreset: PresetDefinition | undefined,
  nextPreset: PresetDefinition,
  currentTags: Tags
): TagDiff {
  const set: Tags = { ...nextPreset.tags };
  const unset: string[] = [];
  const nextHardKeys = Object.keys(nextPreset.tags);

  if (previousPreset) {
    for (const [key, value] of Object.entries(previousPreset.tags)) {
      if (nextHardKeys.includes(key)) {
        continue;
      }
      if (currentTags[key] === value) {
        unset.push(key);
      }
    }
  }

  return { set, unset, protectedKeys: nextHardKeys };
}

function startsWithPath(groupPath: string[], path: string[]): boolean {
  return path.every((part, index) => groupPath[index] === part);
}

function matchesFilters(preset: PresetDefinition, options: PresetSearchOptions): boolean {
  return (!options.geometry || preset.geometry.includes(options.geometry)) && (!options.role || preset.role === options.role);
}

function scoreSearchMatch(preset: PresetDefinition, query: string): number {
  if (!query) {
    return 1;
  }
  let score = 0;
  const weightedTokens: Array<[string, number]> = [
    [preset.name, 8],
    [preset.id, 5],
    [preset.groupPath.join(" "), 3],
    [(preset.terms ?? []).join(" "), 6],
    [Object.keys(preset.tags).join(" "), 3],
    [Object.values(preset.tags).join(" "), 4]
  ];
  for (const [text, weight] of weightedTokens) {
    const normalizedText = normalize(text);
    if (normalizedText.includes(query)) {
      score += weight;
    }
  }
  return score;
}

function matchPreset(preset: PresetDefinition, tags: Tags): PresetMatchCandidate | undefined {
  const reasons: string[] = [];
  let score = 0;
  const matchModes = preset.match ?? {};

  for (const [key, value] of Object.entries(preset.tags)) {
    const mode = matchModes[key] ?? "keyvalue";
    if (mode === "none") {
      continue;
    }
    if (mode === "key" && key in tags) {
      reasons.push(key);
      score += 5;
      continue;
    }
    if (mode === "keyvalue" && tags[key] === value) {
      reasons.push(`${key}=${value}`);
      score += 10;
      continue;
    }
    return undefined;
  }

  if (score === 0) {
    return undefined;
  }

  return { preset: clonePreset(preset), score, reasons };
}

function compareCandidate(left: PresetMatchCandidate, right: PresetMatchCandidate): number {
  return right.score - left.score || left.preset.name.localeCompare(right.preset.name);
}

function cloneCandidate(candidate: PresetMatchCandidate): PresetMatchCandidate {
  return {
    preset: clonePreset(candidate.preset),
    score: candidate.score,
    reasons: [...candidate.reasons]
  };
}

function clonePreset(preset: PresetDefinition): PresetDefinition {
  return {
    ...preset,
    groupPath: [...preset.groupPath],
    geometry: [...preset.geometry],
    tags: { ...preset.tags },
    fields: preset.fields.map((field) => ({
      ...field,
      options: field.options?.map((option) => ({ ...option })),
      defaultValue: Array.isArray(field.defaultValue) ? [...field.defaultValue] : field.defaultValue
    })),
    match: preset.match ? { ...preset.match } : undefined,
    terms: preset.terms ? [...preset.terms] : undefined
  };
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function normalizeFieldValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === false) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const joined = value.map(String).filter(Boolean).join(";");
    return joined.length > 0 ? joined : undefined;
  }
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : undefined;
}
