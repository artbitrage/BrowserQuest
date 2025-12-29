import { EntityKind, getKindFromString } from '@bq/shared';
import { Area } from './Area.js';
import { Mob } from '../Mob.js';
export class MobArea extends Area {
    nb;
    kind;
    constructor(id, nb, kind, x, y, width, height, world) {
        super(id, x, y, width, height, world);
        this.nb = nb;
        this.kind = kind;
        this.setNumberOfEntities(this.nb);
    }
    spawnMobs() {
        for (let i = 0; i < this.nb; i++) {
            this.addToArea(this._createMobInsideArea());
        }
    }
    _createMobInsideArea() {
        const k = getKindFromString(this.kind);
        if (!k) {
            throw new Error(`Invalid mob kind: ${this.kind}`);
        }
        const pos = this._getRandomPositionInsideArea();
        const mob = new Mob(`1${this.id}${k}${this.entities.length}`, k, pos.x, pos.y);
        mob.onMove(this.world.onMobMoveCallback.bind(this.world));
        return mob;
    }
    respawnMob(mob, delay) {
        this.removeFromArea(mob);
        setTimeout(() => {
            const pos = this._getRandomPositionInsideArea();
            mob.x = pos.x;
            mob.y = pos.y;
            mob.isDead = false;
            this.addToArea(mob);
            this.world.addMob(mob);
        }, delay);
    }
    createReward() {
        const pos = this._getRandomPositionInsideArea();
        return { x: pos.x, y: pos.y, kind: EntityKind.CHEST };
    }
}
