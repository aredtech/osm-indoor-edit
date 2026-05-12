import type { Coordinate } from "./adapter";
import type { SnapCandidate } from "./snapping";
import type { OsmElement, OsmNode, OsmWay, PrimitiveId } from "./types";

export function collectSnapCandidates(elements: readonly OsmElement[]): SnapCandidate[] {
  const nodes = new Map<PrimitiveId, OsmNode>();
  const candidates: SnapCandidate[] = [];

  for (const element of elements) {
    if (element.type === "node") {
      nodes.set(element.id, element);
      candidates.push({
        kind: "node",
        nodeId: element.id,
        coordinate: coordinateFromNode(element)
      });
    }
  }

  for (const element of elements) {
    if (element.type !== "way") {
      continue;
    }

    candidates.push(...collectWayEdgeCandidates(element, nodes));
  }

  return candidates;
}

function collectWayEdgeCandidates(
  way: OsmWay,
  nodes: ReadonlyMap<PrimitiveId, OsmNode>
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];
  for (let index = 0; index < way.nodes.length - 1; index += 1) {
    const fromNodeId = way.nodes[index];
    const toNodeId = way.nodes[index + 1];
    const from = nodes.get(fromNodeId);
    const to = nodes.get(toNodeId);
    if (!from || !to) {
      continue;
    }

    candidates.push({
      kind: "edge",
      wayId: way.id,
      edgeIndex: index,
      fromNodeId,
      toNodeId,
      from: coordinateFromNode(from),
      to: coordinateFromNode(to)
    });
  }
  return candidates;
}

function coordinateFromNode(node: OsmNode): Coordinate {
  return { lat: node.lat, lon: node.lon };
}
