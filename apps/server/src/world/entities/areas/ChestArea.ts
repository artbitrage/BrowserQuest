import { Area } from './Area.js';
import type { WorldServer } from '../../WorldServer.js';
import type { Entity } from '../Entity.js';

export class ChestArea extends Area {
  public items: number[];
  public chestX: number;
  public chestY: number;

  constructor(
    id: string | number,
    x: number,
    y: number,
    width: number,
    height: number,
    cx: number,
    cy: number,
    items: number[],
    world: WorldServer,
  ) {
    super(id, x, y, width, height, world);
    this.items = items;
    this.chestX = cx;
    this.chestY = cy;
  }

  contains(entity: Entity): boolean {
    if (entity) {
      return (
        entity.x >= this.x &&
        entity.y >= this.y &&
        entity.x < this.x + this.width &&
        entity.y < this.y + this.height
      );
    }
    return false;
  }
}
