import { Entity } from './Entity.js';
export class Npc extends Entity {
    constructor(id, kind, x, y) {
        super(id, 'npc', kind, x, y);
    }
    getState() {
        return this.getBaseState();
    }
}
