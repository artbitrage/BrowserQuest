import { randomInt } from '@bq/shared';
export class Area {
    id;
    x;
    y;
    width;
    height;
    world;
    entities = [];
    hasCompletelyRespawned = true;
    emptyCallback;
    nbEntities = 0;
    constructor(id, x, y, width, height, world) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.world = world;
    }
    _getRandomPositionInsideArea() {
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
    removeFromArea(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
        if (this.isEmpty() && this.hasCompletelyRespawned) {
            this.hasCompletelyRespawned = false;
            this.emptyCallback?.();
        }
    }
    addToArea(entity) {
        if (entity) {
            this.entities.push(entity);
            entity.area = this;
        }
        if (this.isFull()) {
            this.hasCompletelyRespawned = true;
        }
    }
    setNumberOfEntities(nb) {
        this.nbEntities = nb;
    }
    isEmpty() {
        return !this.entities.some((entity) => !entity.isDead);
    }
    isFull() {
        return !this.isEmpty() && this.nbEntities === this.entities.length;
    }
    onEmpty(callback) {
        this.emptyCallback = callback;
    }
}
