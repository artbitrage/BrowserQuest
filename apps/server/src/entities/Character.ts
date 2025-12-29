import { type Orientation, getDistance, randomOrientation } from '@bq/shared';
import { Entity } from './Entity.js';

export abstract class Character extends Entity {
  public orientation: Orientation;
  public attackers: Record<string | number, Character> = {};
  public target: string | number | null = null;
  public hitPoints = 0;
  public maxHitPoints = 0;

  constructor(id: string | number, type: any, kind: any, x: number, y: number) {
    super(id, type, kind, x, y);
    this.orientation = randomOrientation();
  }

  getState(): (number | string)[] {
    const state = [...this.getBaseState(), this.orientation];
    if (this.target !== null) {
      state.push(this.target);
    }
    return state;
  }

  resetHitPoints(maxHitPoints: number) {
    this.maxHitPoints = maxHitPoints;
    this.hitPoints = maxHitPoints;
  }

  regenHealthBy(value: number) {
    if (this.hitPoints < this.maxHitPoints) {
      this.hitPoints = Math.min(this.hitPoints + value, this.maxHitPoints);
    }
  }

  hasFullHealth() {
    return this.hitPoints === this.maxHitPoints;
  }

  setTarget(entity: Entity) {
    this.target = entity.id;
  }

  clearTarget() {
    this.target = null;
  }

  hasTarget() {
    return this.target !== null;
  }

  addAttacker(entity: Character) {
    this.attackers[entity.id] = entity;
  }

  removeAttacker(entity: Character) {
    delete this.attackers[entity.id];
  }

  forEachAttacker(callback: (attacker: Character) => void) {
    for (const id in this.attackers) {
      callback(this.attackers[id]);
    }
  }

  getPositionNextTo(entity: Entity): { x: number; y: number } {
    const pos = { x: entity.x, y: entity.y };
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      pos.x += dx > 0 ? 1 : -1;
    } else {
      pos.y += dy > 0 ? 1 : -1;
    }

    return pos;
  }

  distanceToEntity(entity: Entity): number {
    return getDistance(this.x, this.y, entity.x, entity.y);
  }
}
