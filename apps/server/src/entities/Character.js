import { randomOrientation } from '@bq/shared';
import { Entity } from './Entity.js';
export class Character extends Entity {
  orientation;
  attackers = {};
  target = null;
  hitPoints = 0;
  maxHitPoints = 0;
  constructor(id, type, kind, x, y) {
    super(id, type, kind, x, y);
    this.orientation = randomOrientation();
  }
  getState() {
    const state = [...this.getBaseState(), this.orientation];
    if (this.target !== null) {
      state.push(this.target);
    }
    return state;
  }
  resetHitPoints(maxHitPoints) {
    this.maxHitPoints = maxHitPoints;
    this.hitPoints = maxHitPoints;
  }
  regenHealthBy(value) {
    if (this.hitPoints < this.maxHitPoints) {
      this.hitPoints = Math.min(this.hitPoints + value, this.maxHitPoints);
    }
  }
  hasFullHealth() {
    return this.hitPoints === this.maxHitPoints;
  }
  setTarget(entity) {
    this.target = entity.id;
  }
  clearTarget() {
    this.target = null;
  }
  hasTarget() {
    return this.target !== null;
  }
  addAttacker(entity) {
    this.attackers[entity.id] = entity;
  }
  removeAttacker(entity) {
    delete this.attackers[entity.id];
  }
  forEachAttacker(callback) {
    for (const id in this.attackers) {
      callback(this.attackers[id]);
    }
  }
}
