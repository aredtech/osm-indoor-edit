import { DataIntegrityError } from "./errors";
import type { Coordinate } from "./adapter";
import { isClosedWay } from "./primitive-store";
import type { OsmElement, OsmNode, OsmRelation, OsmWay, PrimitiveId, Tags } from "./types";

export type FeatureKind =
  | "room"
  | "corridor"
  | "poi"
  | "door"
  | "stairs"
  | "elevator"
  | "escalator"
  | "entrance"
  | "amenity"
  | "shop"
  | "office"
  | "floor-outline"
  | "building-outline"
  | "custom";

export type GeometryType = "point" | "line" | "polygon" | "relation";

export interface PrimitiveRefs {
  nodeIds: PrimitiveId[];
  wayId?: PrimitiveId;
  relationIds?: PrimitiveId[];
}

export interface FeatureRecord {
  id: string;
  kind: FeatureKind;
  geometryType: GeometryType;
  level?: string;
  tags: Tags;
  primitiveRefs: PrimitiveRefs;
  coordinates?: Coordinate[];
}

export interface AddFeatureInput {
  kind: FeatureKind;
  geometryType: GeometryType;
  level?: string;
  tags?: Tags;
  primitiveRefs: PrimitiveRefs;
  coordinates?: Coordinate[];
}

export type UpdateFeatureInput = Partial<Omit<AddFeatureInput, "primitiveRefs">> & {
  primitiveRefs?: PrimitiveRefs;
};

export class FeatureStore {
  private readonly features = new Map<string, FeatureRecord>();
  private nextFeatureId = 1;

  add(input: AddFeatureInput): FeatureRecord {
    const feature: FeatureRecord = {
      id: this.allocateFeatureId(),
      kind: input.kind,
      geometryType: input.geometryType,
      ...(input.level === undefined ? {} : { level: input.level }),
      tags: { ...(input.tags ?? {}) },
      primitiveRefs: clonePrimitiveRefs(input.primitiveRefs),
      ...(input.coordinates === undefined ? {} : { coordinates: cloneCoordinates(input.coordinates) })
    };

    this.features.set(feature.id, feature);
    return cloneFeature(feature);
  }

  get(id: string): FeatureRecord | undefined {
    const feature = this.features.get(id);
    return feature ? cloneFeature(feature) : undefined;
  }

  list(): FeatureRecord[] {
    return [...this.features.values()].map(cloneFeature);
  }

  findByNodeId(nodeId: PrimitiveId): FeatureRecord[] {
    return [...this.features.values()]
      .filter((feature) => feature.primitiveRefs.nodeIds.includes(nodeId))
      .map(cloneFeature);
  }

  findByWayId(wayId: PrimitiveId): FeatureRecord | undefined {
    const feature = [...this.features.values()].find(
      (candidate) => candidate.primitiveRefs.wayId === wayId
    );
    return feature ? cloneFeature(feature) : undefined;
  }

  findByRelationId(relationId: PrimitiveId): FeatureRecord[] {
    return [...this.features.values()]
      .filter((feature) => feature.primitiveRefs.relationIds?.includes(relationId))
      .map(cloneFeature);
  }

  update(id: string, input: UpdateFeatureInput): FeatureRecord {
    const existing = this.features.get(id);
    if (!existing) {
      throw new DataIntegrityError(`Feature ${id} does not exist`);
    }

    const updated: FeatureRecord = {
      ...existing,
      ...("kind" in input && input.kind !== undefined ? { kind: input.kind } : {}),
      ...("geometryType" in input && input.geometryType !== undefined
        ? { geometryType: input.geometryType }
        : {}),
      ...("level" in input ? (input.level === undefined ? {} : { level: input.level }) : {}),
      ...("tags" in input && input.tags !== undefined ? { tags: { ...input.tags } } : {}),
      ...("primitiveRefs" in input && input.primitiveRefs !== undefined
        ? { primitiveRefs: clonePrimitiveRefs(input.primitiveRefs) }
        : {}),
      ...("coordinates" in input && input.coordinates !== undefined
        ? { coordinates: cloneCoordinates(input.coordinates) }
        : {})
    };

    if ("level" in input && input.level === undefined) {
      delete updated.level;
    }

    this.features.set(id, updated);
    return cloneFeature(updated);
  }

  delete(id: string): boolean {
    return this.features.delete(id);
  }

  remove(id: string): boolean {
    return this.delete(id);
  }

  clear(): void {
    this.features.clear();
    this.nextFeatureId = 1;
  }

  rebuildFromElements(elements: OsmElement[]): FeatureRecord[] {
    this.clear();

    for (const element of elements) {
      if (element.type === "node" && hasStandaloneFeatureTags(element.tags)) {
        this.add(featureFromNode(element));
      }

      if (element.type === "way") {
        this.add(featureFromWay(element));
      }

      if (element.type === "relation") {
        this.add(featureFromRelation(element));
      }
    }

    return this.list();
  }

  private allocateFeatureId(): string {
    return `feature-${this.nextFeatureId++}`;
  }
}

export function inferFeatureKind(tags: Tags): FeatureKind {
  if (tags.indoor === "room") {
    return "room";
  }

  if (tags.indoor === "corridor") {
    return "corridor";
  }

  return "custom";
}

function featureFromNode(node: OsmNode): AddFeatureInput {
  return {
    kind: inferFeatureKind(node.tags),
    geometryType: "point",
    level: node.tags.level,
    tags: node.tags,
    primitiveRefs: { nodeIds: [node.id], relationIds: [] }
  };
}

function hasStandaloneFeatureTags(tags: Tags): boolean {
  return Object.keys(tags).some((key) => key !== "level");
}

function featureFromWay(way: OsmWay): AddFeatureInput {
  return {
    kind: inferFeatureKind(way.tags),
    geometryType: isClosedWay(way) ? "polygon" : "line",
    level: way.tags.level,
    tags: way.tags,
    primitiveRefs: { nodeIds: [...way.nodes], wayId: way.id, relationIds: [] }
  };
}

function featureFromRelation(relation: OsmRelation): AddFeatureInput {
  return {
    kind: inferFeatureKind(relation.tags),
    geometryType: "relation",
    level: relation.tags.level,
    tags: relation.tags,
    primitiveRefs: {
      nodeIds: relation.members
        .filter((member) => member.type === "node")
        .map((member) => member.ref),
      relationIds: [relation.id]
    }
  };
}

function cloneFeature(feature: FeatureRecord): FeatureRecord {
  return {
    ...feature,
    tags: { ...feature.tags },
    primitiveRefs: clonePrimitiveRefs(feature.primitiveRefs),
    ...(feature.coordinates === undefined ? {} : { coordinates: cloneCoordinates(feature.coordinates) })
  };
}

function clonePrimitiveRefs(refs: PrimitiveRefs): PrimitiveRefs {
  return {
    nodeIds: [...refs.nodeIds],
    ...(refs.wayId === undefined ? {} : { wayId: refs.wayId }),
    ...(refs.relationIds === undefined ? {} : { relationIds: [...refs.relationIds] })
  };
}

function cloneCoordinates(coordinates: Coordinate[]): Coordinate[] {
  return coordinates.map((coordinate) => ({ ...coordinate }));
}
