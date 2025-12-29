import type { EntityKind } from '@bq/shared';
import { Entity } from './Entity.js';

export class Npc extends Entity {
  constructor(id: string | number, kind: EntityKind, x: number, y: number) {
    super(id, 'npc', kind, x, y);
  }

  getState(): (number | string)[] {
    return this.getBaseState();
  }
}
