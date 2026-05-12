import type { OsmRelationMember, Tags } from "./types";

export type RelationMemberInput = OsmRelationMember;

export interface CreateEditorRelationInput {
  members: RelationMemberInput[];
  tags?: Tags;
}

export interface UpdateRelationTagsInput {
  tags: Tags;
}

export type RelationMemberMatcher =
  | number
  | {
      type: OsmRelationMember["type"];
      ref: number;
      role?: string;
    };
