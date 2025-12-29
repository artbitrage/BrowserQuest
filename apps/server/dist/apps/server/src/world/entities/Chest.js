import { EntityKind, randomInt } from '@bq/shared';
import { Item } from './Item.js';
export class Chest extends Item {
    items = [];
    constructor(id, x, y) {
        super(id, EntityKind.CHEST, x, y);
    }
    setItems(items) {
        this.items = items;
    }
    getRandomItem() {
        if (this.items.length === 0)
            return null;
        return this.items[randomInt(0, this.items.length - 1)];
    }
}
