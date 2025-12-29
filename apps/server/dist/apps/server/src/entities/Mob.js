import { getArmorLevel, getDistance, getEntityMaxHp, getWeaponLevel, } from '@bq/shared';
import { Character } from './Character.js';
export class Mob extends Character {
    spawningX;
    spawningY;
    armorLevel;
    weaponLevel;
    hatelist = [];
    isDead = false;
    returnTimeout = null;
    respawnCallback;
    moveCallback;
    constructor(id, kind, x, y) {
        super(id, 'mob', kind, x, y);
        this.spawningX = x;
        this.spawningY = y;
        this.armorLevel = getArmorLevel(kind);
        this.weaponLevel = getWeaponLevel(kind);
        this.updateHitPoints();
    }
    updateHitPoints() {
        this.resetHitPoints(getEntityMaxHp(this.kind));
    }
    receiveDamage(points) {
        this.hitPoints -= points;
    }
    hates(playerId) {
        return this.hatelist.some((entry) => entry.id === playerId);
    }
    increaseHateFor(playerId, points) {
        const entry = this.hatelist.find((e) => e.id === playerId);
        if (entry) {
            entry.hate += points;
        }
        else {
            this.hatelist.push({ id: playerId, hate: points });
        }
        if (this.returnTimeout) {
            clearTimeout(this.returnTimeout);
            this.returnTimeout = null;
        }
    }
    getHatedPlayerId(hateRank) {
        const sorted = [...this.hatelist].sort((a, b) => b.hate - a.hate);
        const index = hateRank && hateRank <= sorted.length ? hateRank - 1 : 0;
        return sorted[index]?.id;
    }
    forgetPlayer(playerId, duration) {
        this.hatelist = this.hatelist.filter((entry) => entry.id !== playerId);
        if (this.hatelist.length === 0) {
            this.returnToSpawningPosition(duration);
        }
    }
    forgetEveryone() {
        this.hatelist = [];
        this.returnToSpawningPosition();
    }
    returnToSpawningPosition(waitDuration = 4000) {
        this.clearTarget();
        this.returnTimeout = setTimeout(() => {
            this.setPosition(this.spawningX, this.spawningY);
            this.move(this.x, this.y);
        }, waitDuration);
    }
    distanceToSpawningPoint(x, y) {
        return getDistance(x, y, this.spawningX, this.spawningY);
    }
    move(x, y) {
        this.setPosition(x, y);
        this.moveCallback?.(this);
    }
    onMove(callback) {
        this.moveCallback = callback;
    }
    onRespawn(callback) {
        this.respawnCallback = callback;
    }
    handleRespawn() {
        setTimeout(() => {
            this.respawnCallback?.();
        }, 30000);
    }
}
