import { EntityKind, randomInt } from '@bq/shared';
import { Item } from './Item.js';

export class Chest extends Item {
  private items: number[] = [];

  constructor(id: string | number, x: number, y: number) {
    super(id, EntityKind.CHEST, x, y);
  }

  setItems(items: number[]) {
    this.items = items;
  }

  getRandomItem(): number | null {
    if (this.items.length === 0) return null;
    return this.items[randomInt(0, this.items.length - 1)];
  }
}
