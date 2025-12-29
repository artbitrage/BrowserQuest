import { randomInt } from '@bq/shared';
import type { WorldServer } from '../../WorldServer.js';
import type { Entity } from '../Entity.js';

export abstract class Area {
  public entities: Entity[] = [];
  public hasCompletelyRespawned = true;
  protected emptyCallback?: () => void;
  protected nbEntities = 0;

  constructor(
    public id: string | number,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    protected world: WorldServer,
  ) {}

  protected _getRandomPositionInsideArea(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    let valid = false;

    while (!valid) {
      x = this.x + randomInt(0, this.width);
      y = this.y + randomInt(0, this.height);
      valid = this.world.isValidPosition(x, y);
    }
    return { x, y };
  }

  removeFromArea(entity: Entity) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }

    if (this.isEmpty() && this.hasCompletelyRespawned) {
      this.hasCompletelyRespawned = false;
      this.emptyCallback?.();
    }
  }

  addToArea(entity: Entity) {
    if (entity) {
      this.entities.push(entity);
      entity.area = this;
    }

    if (this.isFull()) {
      this.hasCompletelyRespawned = true;
    }
  }

  setNumberOfEntities(nb: number) {
    this.nbEntities = nb;
  }

  isEmpty(): boolean {
    return !this.entities.some((entity) => !(entity as any).isDead);
  }

  isFull(): boolean {
    return !this.isEmpty() && this.nbEntities === this.entities.length;
  }

  onEmpty(callback: () => void) {
    this.emptyCallback = callback;
  }
}
