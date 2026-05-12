export interface ElementIdAllocatorOptions {
  nodeStart?: number;
  wayStart?: number;
  relationStart?: number;
}

export class ElementIdAllocator {
  private nextNode: number;
  private nextWay: number;
  private nextRelation: number;

  constructor(options: ElementIdAllocatorOptions = {}) {
    this.nextNode = options.nodeStart ?? 1000000001000000;
    this.nextWay = options.wayStart ?? 1000000000800000;
    this.nextRelation = options.relationStart ?? 1000000000000000;
  }

  nextNodeId(): number {
    return this.nextNode++;
  }

  nextWayId(): number {
    return this.nextWay++;
  }

  nextRelationId(): number {
    return this.nextRelation++;
  }
}

