import type { FeatureRecord } from "./feature-store";
import type { ElementType, OsmElement, OsmNode, OsmRelation, OsmWay, PrimitiveId } from "./types";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  elementType?: ElementType;
  elementId?: PrimitiveId;
  featureId?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationContext {
  elements: readonly OsmElement[];
  features: readonly FeatureRecord[];
}

export type ValidationRule = (context: ValidationContext) => ValidationIssue[];

export function createValidationContext(input: {
  elements: readonly OsmElement[];
  features?: readonly FeatureRecord[];
}): ValidationContext {
  return {
    elements: structuredClone(input.elements),
    features: structuredClone(input.features ?? [])
  };
}

export function runValidationRules(
  context: ValidationContext,
  rules: readonly ValidationRule[] = builtInValidationRules
): ValidationResult {
  const issues = rules.flatMap((rule) => rule(context));
  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues
  };
}

export const builtInValidationRules: ValidationRule[] = [
  validateSemanticTags,
  validateReferences,
  validateDuplicateNodes,
  validateGeometry
];

function validateSemanticTags(context: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const way of ways(context)) {
    if (isIndoorLike(way) && !way.tags.level) {
      issues.push(issue("missing-level", "warning", `Way ${way.id} is missing level`, "way", way.id));
    }
    if (isClosedAreaCandidate(way) && way.tags.level && !way.tags.indoor && !way.tags.building) {
      issues.push(issue("missing-indoor", "warning", `Way ${way.id} is missing indoor`, "way", way.id));
    }
  }
  for (const relation of relations(context)) {
    if (isIndoorLike(relation) && !relation.tags.level) {
      issues.push(
        issue("missing-level", "warning", `Relation ${relation.id} is missing level`, "relation", relation.id)
      );
    }
  }
  return issues;
}

function validateReferences(context: ValidationContext): ValidationIssue[] {
  const nodesById = new Set(nodes(context).map((node) => node.id));
  const waysById = new Set(ways(context).map((way) => way.id));
  const relationsById = new Set(relations(context).map((relation) => relation.id));
  const issues: ValidationIssue[] = [];

  for (const way of ways(context)) {
    for (const nodeId of way.nodes) {
      if (!nodesById.has(nodeId)) {
        issues.push(
          issue(
            "broken-way-reference",
            "error",
            `Way ${way.id} references missing node ${nodeId}`,
            "way",
            way.id
          )
        );
      }
    }
  }

  for (const relation of relations(context)) {
    for (const member of relation.members) {
      const exists =
        (member.type === "node" && nodesById.has(member.ref)) ||
        (member.type === "way" && waysById.has(member.ref)) ||
        (member.type === "relation" && relationsById.has(member.ref));
      if (!exists) {
        issues.push(
          issue(
            "broken-relation-member",
            "error",
            `Relation ${relation.id} references missing ${member.type} ${member.ref}`,
            "relation",
            relation.id
          )
        );
      }
    }
  }

  return issues;
}

function validateDuplicateNodes(context: ValidationContext): ValidationIssue[] {
  const nodeMap = nodeLookup(context);
  const issues: ValidationIssue[] = [];
  for (const way of ways(context)) {
    const editableNodes = editableNodeIds(way);
    const seen = new Set<PrimitiveId>();
    for (const nodeId of editableNodes) {
      if (seen.has(nodeId)) {
        issues.push(issue("duplicate-node", "warning", `Way ${way.id} repeats node ${nodeId}`, "way", way.id));
        break;
      }
      seen.add(nodeId);
    }

    const seenCoordinates = new Set<string>();
    for (const nodeId of editableNodes) {
      const node = nodeMap.get(nodeId);
      if (!node) {
        continue;
      }
      const key = `${node.lat}:${node.lon}`;
      if (seenCoordinates.has(key)) {
        issues.push(
          issue("duplicate-node", "warning", `Way ${way.id} contains duplicate coordinates`, "way", way.id)
        );
        break;
      }
      seenCoordinates.add(key);
    }
  }
  return issues;
}

function validateGeometry(context: ValidationContext): ValidationIssue[] {
  const nodeMap = nodeLookup(context);
  const issues: ValidationIssue[] = [];
  for (const way of ways(context)) {
    if (!isClosedAreaCandidate(way)) {
      continue;
    }

    if (!isClosed(way)) {
      issues.push(issue("invalid-closed-way", "error", `Way ${way.id} is not closed`, "way", way.id));
      continue;
    }

    if (new Set(editableNodeIds(way)).size < 3) {
      issues.push(issue("too-few-way-nodes", "error", `Way ${way.id} has too few nodes`, "way", way.id));
      continue;
    }

    const ring = way.nodes.map((nodeId) => nodeMap.get(nodeId)).filter((node): node is OsmNode => Boolean(node));
    const geoJsonRing = ring.map((node) => [node.lon, node.lat]);
    if (geoJsonRing.length === way.nodes.length && isSelfIntersecting(ring)) {
      issues.push(
        issue(
          "self-intersecting-polygon",
          "error",
          `Way ${way.id} polygon self-intersects`,
          "way",
          way.id
        )
      );
    }
  }
  return issues;
}

function issue(
  ruleId: string,
  severity: ValidationSeverity,
  message: string,
  elementType?: ElementType,
  elementId?: PrimitiveId
): ValidationIssue {
  return { ruleId, severity, message, ...(elementType ? { elementType } : {}), ...(elementId ? { elementId } : {}) };
}

function nodes(context: ValidationContext): OsmNode[] {
  return context.elements.filter((element): element is OsmNode => element.type === "node");
}

function ways(context: ValidationContext): OsmWay[] {
  return context.elements.filter((element): element is OsmWay => element.type === "way");
}

function relations(context: ValidationContext): OsmRelation[] {
  return context.elements.filter((element): element is OsmRelation => element.type === "relation");
}

function nodeLookup(context: ValidationContext): Map<PrimitiveId, OsmNode> {
  return new Map(nodes(context).map((node) => [node.id, node]));
}

function isIndoorLike(element: OsmWay | OsmRelation): boolean {
  return element.tags.indoor !== undefined || element.tags.building !== undefined || element.tags["building:part"] !== undefined;
}

function isClosedAreaCandidate(way: OsmWay): boolean {
  return way.tags.area === "yes" || way.tags.indoor !== undefined || way.tags.building !== undefined;
}

function isClosed(way: OsmWay): boolean {
  return way.nodes.length > 0 && way.nodes[0] === way.nodes[way.nodes.length - 1];
}

function editableNodeIds(way: OsmWay): PrimitiveId[] {
  return isClosed(way) ? way.nodes.slice(0, -1) : [...way.nodes];
}

function isSelfIntersecting(ring: OsmNode[]): boolean {
  for (let left = 0; left < ring.length - 1; left += 1) {
    for (let right = left + 1; right < ring.length - 1; right += 1) {
      if (Math.abs(left - right) <= 1) {
        continue;
      }
      if (left === 0 && right === ring.length - 2) {
        continue;
      }
      if (segmentsIntersect(ring[left], ring[left + 1], ring[right], ring[right + 1])) {
        return true;
      }
    }
  }
  return false;
}

function segmentsIntersect(a: OsmNode, b: OsmNode, c: OsmNode, d: OsmNode): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

function orientation(a: OsmNode, b: OsmNode, c: OsmNode): number {
  return (b.lon - a.lon) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lon - a.lon);
}
