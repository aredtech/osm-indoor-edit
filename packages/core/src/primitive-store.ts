import { toIsoTimestamp, type Clock, systemClock } from "./clock";
import { DataIntegrityError } from "./errors";
import { ElementIdAllocator } from "./ids";
import type { RelationMemberMatcher } from "./relations";
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
import type { Coordinate } from "./adapter";

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

  updateNodeCoordinate(id: PrimitiveId, coordinate: Coordinate): OsmNode {
    const node = this.nodes.get(id);
    if (!node) {
      throw new DataIntegrityError(`Node ${id} does not exist`);
    }

    const updated: OsmNode = {
      ...node,
      lat: coordinate.lat,
      lon: coordinate.lon
    };
    this.nodes.set(id, updated);
    return cloneElement(updated);
  }

  updateWayNodes(id: PrimitiveId, nodes: PrimitiveId[]): OsmWay {
    const way = this.ways.get(id);
    if (!way) {
      throw new DataIntegrityError(`Way ${id} does not exist`);
    }

    const nextNodes = isClosedAreaWay(way) ? closeNodeSequence(nodes) : [...nodes];
    const updated: OsmWay = {
      ...way,
      nodes: nextNodes
    };
    this.assertWayReferences(updated);
    this.ways.set(id, updated);
    return cloneElement(updated);
  }

  insertNodeInWayEdge(
    wayId: PrimitiveId,
    edgeIndex: number,
    coordinate: Coordinate
  ): { node: OsmNode; way: OsmWay } {
    const way = this.ways.get(wayId);
    if (!way) {
      throw new DataIntegrityError(`Way ${wayId} does not exist`);
    }

    if (edgeIndex < 0 || edgeIndex >= way.nodes.length - 1) {
      throw new DataIntegrityError(`Edge ${edgeIndex} does not exist in way ${wayId}`);
    }

    const node = this.createNode({ lat: coordinate.lat, lon: coordinate.lon });
    const editableNodes = isClosedAreaWay(way) && isClosedWay(way) ? way.nodes.slice(0, -1) : way.nodes;
    const nextNodes = [
      ...editableNodes.slice(0, edgeIndex + 1),
      node.id,
      ...editableNodes.slice(edgeIndex + 1)
    ];
    const updatedWay = this.updateWayNodes(wayId, nextNodes);

    return { node, way: updatedWay };
  }

  updateElementTags(type: OsmElement["type"], id: PrimitiveId, tags: Tags): OsmElement {
    if (type === "node") {
      const node = this.nodes.get(id);
      if (!node) {
        throw new DataIntegrityError(`Node ${id} does not exist`);
      }
      const updated = { ...node, tags: { ...tags } };
      this.nodes.set(id, updated);
      return cloneElement(updated);
    }

    if (type === "way") {
      const way = this.ways.get(id);
      if (!way) {
        throw new DataIntegrityError(`Way ${id} does not exist`);
      }
      const updated = { ...way, tags: { ...tags } };
      this.assertWayReferences(updated);
      this.ways.set(id, updated);
      return cloneElement(updated);
    }

    const relation = this.relations.get(id);
    if (!relation) {
      throw new DataIntegrityError(`Relation ${id} does not exist`);
    }
    const updated = { ...relation, tags: { ...tags } };
    this.relations.set(id, updated);
    return cloneElement(updated);
  }

  appendRelationMember(relationId: PrimitiveId, member: OsmRelationMember): OsmRelation {
    const relation = this.relations.get(relationId);
    if (!relation) {
      throw new DataIntegrityError(`Relation ${relationId} does not exist`);
    }

    const updated: OsmRelation = {
      ...relation,
      members: [...relation.members, { ...member }]
    };
    this.assertRelationReferences(updated);
    this.relations.set(relationId, updated);
    return cloneElement(updated);
  }

  removeRelationMember(relationId: PrimitiveId, matcher: RelationMemberMatcher): OsmRelation {
    const relation = this.relations.get(relationId);
    if (!relation) {
      throw new DataIntegrityError(`Relation ${relationId} does not exist`);
    }

    const index = typeof matcher === "number" ? matcher : relation.members.findIndex((member) =>
      member.type === matcher.type &&
      member.ref === matcher.ref &&
      (matcher.role === undefined || member.role === matcher.role)
    );
    if (index < 0 || index >= relation.members.length) {
      throw new DataIntegrityError(`Relation ${relationId} member does not exist`);
    }

    const updated: OsmRelation = {
      ...relation,
      members: relation.members.filter((_, memberIndex) => memberIndex !== index)
    };
    this.assertRelationReferences(updated);
    this.relations.set(relationId, updated);
    return cloneElement(updated);
  }

  deleteElement(type: OsmElement["type"], id: PrimitiveId): boolean {
    if (type === "node") {
      for (const way of this.ways.values()) {
        if (way.nodes.includes(id)) {
          throw new DataIntegrityError(`Node ${id} is referenced by way ${way.id}`);
        }
      }
      for (const relation of this.relations.values()) {
        if (relation.members.some((member) => member.type === "node" && member.ref === id)) {
          throw new DataIntegrityError(`Node ${id} is referenced by relation ${relation.id}`);
        }
      }
      return this.nodes.delete(id);
    }

    if (type === "way") {
      for (const relation of this.relations.values()) {
        if (relation.members.some((member) => member.type === "way" && member.ref === id)) {
          throw new DataIntegrityError(`Way ${id} is referenced by relation ${relation.id}`);
        }
      }
      return this.ways.delete(id);
    }

    return this.relations.delete(id);
  }

  getWaysReferencingNode(nodeId: PrimitiveId): OsmWay[] {
    return [...this.ways.values()]
      .filter((way) => way.nodes.includes(nodeId))
      .map(cloneElement);
  }

  getElementsReferencingNode(nodeId: PrimitiveId): OsmElement[] {
    const ways = this.getWaysReferencingNode(nodeId);
    const relations = [...this.relations.values()].filter((relation) =>
      relation.members.some((member) => member.type === "node" && member.ref === nodeId)
    );
    return [...ways, ...relations.map(cloneElement)];
  }

  getRelationsReferencing(type: OsmRelationMember["type"], ref: PrimitiveId): OsmRelation[] {
    return [...this.relations.values()]
      .filter((relation) => relation.members.some((member) => member.type === type && member.ref === ref))
      .map(cloneElement);
  }

  isNodeReferenced(nodeId: PrimitiveId): boolean {
    return (
      [...this.ways.values()].some((way) => way.nodes.includes(nodeId)) ||
      [...this.relations.values()].some((relation) =>
        relation.members.some((member) => member.type === "node" && member.ref === nodeId)
      )
    );
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

    if (isClosedAreaWay(way) && distinctNodeIds(way.nodes).length < 3) {
      throw new DataIntegrityError(`Closed way ${way.id} must contain at least 3 distinct nodes`);
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

function distinctNodeIds(nodes: PrimitiveId[]): PrimitiveId[] {
  return [...new Set(nodes)];
}

function sortById<T extends { id: PrimitiveId }>(items: Iterable<T>): T[] {
  return [...items].sort((left, right) => left.id - right.id);
}

function cloneElement<T extends OsmElement>(element: T): T {
  return structuredClone(element);
}
