import { DataIntegrityError } from "./errors";
import type { OsmElement, OsmInEditExport } from "./types";

export function normalizeOsmInEditExport(data: OsmInEditExport): OsmInEditExport {
  assertOsmInEditExport(data);
  return {
    status: true,
    elements: sortElementsForImport(data.elements).map(cloneElement)
  };
}

export function sortElementsForImport(elements: readonly OsmElement[]): OsmElement[] {
  const rank = { node: 0, way: 1, relation: 2 } satisfies Record<OsmElement["type"], number>;
  return [...elements].sort((left, right) => {
    const byType = rank[left.type] - rank[right.type];
    return byType === 0 ? left.id - right.id : byType;
  });
}

export function assertOsmInEditExport(data: OsmInEditExport): void {
  if (data.status !== true) {
    throw new DataIntegrityError("OsmInEdit export status must be true");
  }

  if (!Array.isArray(data.elements)) {
    throw new DataIntegrityError("OsmInEdit export elements must be an array");
  }
}

function cloneElement<T extends OsmElement>(element: T): T {
  return JSON.parse(JSON.stringify(element)) as T;
}
