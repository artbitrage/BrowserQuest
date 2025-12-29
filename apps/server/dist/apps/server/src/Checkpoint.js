import { randomInt } from '@bq/shared';
export class Checkpoint {
    id;
    x;
    y;
    width;
    height;
    isStartingArea;
    constructor(id, x, y, width, height, isStartingArea) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isStartingArea = isStartingArea;
    }
    getRandomPosition() {
        return {
            x: this.x + randomInt(0, this.width - 1),
            y: this.y + randomInt(0, this.height - 1),
        };
    }
}
