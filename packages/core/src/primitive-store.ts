import { toIsoTimestamp, type Clock, systemClock } from "./clock";
import { DataIntegrityError } from "./errors";
import { ElementIdAllocator } from "./ids";
import type {
  OsmElement,
  OsmInEditExport,
  OsmNode,
  OsmRelation,
  OsmRelationMember,
  OsmWay,
  PrimitiveId,
  Tags
} from "./types";

export interface PrimitiveStoreOptions {
  clock?: Clock;
  ids?: ElementIdAllocator;
}

export interface CreateNodeInput {
  lat: number;
  lon: number;
  tags?: Tags;
}

export interface CreateWayInput {
  nodes: PrimitiveId[];
  tags?: Tags;
  featureTypeId?: number;
  closed?: boolean;
}

export interface CreateRelationInput {
  members: OsmRelationMember[];
  tags?: Tags;
}

export class PrimitiveStore {
  private readonly nodes = new Map<PrimitiveId, OsmNode>();
  private readonly ways = new Map<PrimitiveId, OsmWay>();
  private readonly relations = new Map<PrimitiveId, OsmRelation>();
  private readonly clock: Clock;
  private readonly ids: ElementIdAllocator;

  constructor(options: PrimitiveStoreOptions = {}) {
    this.clock = options.clock ?? systemClock;
    this.ids = options.ids ?? new ElementIdAllocator();
  }

  importElement(element: OsmElement): void {
    const clone = cloneElement(element);

    if (clone.type === "node") {
      this.nodes.set(clone.id, clone);
      return;
    }

    if (clone.type === "way") {
      this.assertWayReferences(clone);
      this.ways.set(clone.id, clone);
      return;
    }

    this.assertRelationReferences(clone);
    this.relations.set(clone.id, clone);
  }

  createNode(input: CreateNodeInput): OsmNode {
    const node: OsmNode = {
      type: "node",
      id: this.ids.nextNodeId(),
      lat: input.lat,
      lon: input.lon,
      tags: { ...(input.tags ?? {}) },
      timestamp: toIsoTimestamp(this.clock)
    };
    this.nodes.set(node.id, node);
    return cloneElement(node);
  }

  createWay(input: CreateWayInput): OsmWay {
    const nodes = input.closed ? closeNodeSequence(input.nodes) : [...input.nodes];
    const way: OsmWay = {
      type: "way",
      id: this.ids.nextWayId(),
      nodes,
      tags: { ...(input.tags ?? {}) },
      timestamp: toIsoTimestamp(this.clock),
      ...(input.featureTypeId === undefined ? {} : { featureTypeId: input.featureTypeId })
    };
    this.assertWayReferences(way);
    this.ways.set(way.id, way);
    return cloneElement(way);
  }

  createRelation(input: CreateRelationInput): OsmRelation {
    const relation: OsmRelation = {
      type: "relation",
      id: this.ids.nextRelationId(),
      members: input.members.map((member) => ({ ...member })),
      tags: { ...(input.tags ?? {}) },
      timestamp: toIsoTimestamp(this.clock)
    };
    this.assertRelationReferences(relation);
    this.relations.set(relation.id, relation);
    return cloneElement(relation);
  }

  getNode(id: PrimitiveId): OsmNode | undefined {
    const node = this.nodes.get(id);
    return node ? cloneElement(node) : undefined;
  }

  getWay(id: PrimitiveId): OsmWay | undefined {
    const way = this.ways.get(id);
    return way ? cloneElement(way) : undefined;
  }

  getRelation(id: PrimitiveId): OsmRelation | undefined {
    const relation = this.relations.get(id);
    return relation ? cloneElement(relation) : undefined;
  }

  getElements(): OsmElement[] {
    return [
      ...sortById(this.nodes.values()).map(cloneElement),
      ...sortById(this.ways.values()).map(cloneElement),
      ...sortById(this.relations.values()).map(cloneElement)
    ];
  }

  exportOsmInEdit(): OsmInEditExport {
    this.validateReferences();
    return {
      elements: this.getElements(),
      status: true
    };
  }

  validateReferences(): void {
    for (const way of this.ways.values()) {
      this.assertWayReferences(way);
    }

    for (const relation of this.relations.values()) {
      this.assertRelationReferences(relation);
    }
  }

  private assertWayReferences(way: OsmWay): void {
    for (const nodeId of way.nodes) {
      if (!this.nodes.has(nodeId)) {
        throw new DataIntegrityError(`Way ${way.id} references missing node ${nodeId}`);
      }
    }

    if (isClosedAreaWay(way) && !isClosedWay(way)) {
      throw new DataIntegrityError(`Closed way ${way.id} must repeat the first node at the end`);
    }
  }

  private assertRelationReferences(relation: OsmRelation): void {
    for (const member of relation.members) {
      const exists =
        (member.type === "node" && this.nodes.has(member.ref)) ||
        (member.type === "way" && this.ways.has(member.ref)) ||
        (member.type === "relation" && this.relations.has(member.ref));

      if (!exists) {
        throw new DataIntegrityError(
          `Relation ${relation.id} references missing ${member.type} ${member.ref}`
        );
      }
    }
  }
}

export function closeNodeSequence(nodes: PrimitiveId[]): PrimitiveId[] {
  if (nodes.length === 0) {
    return [];
  }

  const closed = [...nodes];
  if (closed[0] !== closed[closed.length - 1]) {
    closed.push(closed[0]);
  }
  return closed;
}

export function isClosedWay(way: OsmWay): boolean {
  return way.nodes.length > 0 && way.nodes[0] === way.nodes[way.nodes.length - 1];
}

export function isClosedAreaWay(way: OsmWay): boolean {
  const indoorKind = way.tags.indoor;
  return way.tags.area === "yes" || indoorKind === "room" || indoorKind === "corridor";
}

function sortById<T extends { id: PrimitiveId }>(items: Iterable<T>): T[] {
  return [...items].sort((left, right) => left.id - right.id);
}

function cloneElement<T extends OsmElement>(element: T): T {
  return structuredClone(element);
}
