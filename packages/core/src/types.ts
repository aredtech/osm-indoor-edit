export type PrimitiveId = number;

export type Tags = Record<string, string>;

export interface OsmNode {
  type: "node";
  id: PrimitiveId;
  lat: number;
  lon: number;
  tags: Tags;
  timestamp: string;
}

export interface OsmWay {
  type: "way";
  id: PrimitiveId;
  nodes: PrimitiveId[];
  tags: Tags;
  timestamp: string;
  featureTypeId?: number;
}

export interface OsmRelationMember {
  type: "node" | "way" | "relation";
  ref: PrimitiveId;
  role: string;
}

export interface OsmRelation {
  type: "relation";
  id: PrimitiveId;
  members: OsmRelationMember[];
  tags: Tags;
  timestamp: string;
}

export type OsmElement = OsmNode | OsmWay | OsmRelation;

export interface OsmInEditExport {
  elements: OsmElement[];
  status: true;
}

export type ElementType = OsmElement["type"];

