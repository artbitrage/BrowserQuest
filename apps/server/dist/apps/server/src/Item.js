import { getEntityType } from '@bq/shared';
import { Entity } from './entities/Entity.js';
export class Item extends Entity {
    isStatic = false;
    isFromChest = false;
    blinkTimeout;
    despawnTimeout;
    respawnCallback;
    constructor(id, kind, x, y) {
        super(id, getEntityType(kind) || 'object', kind, x, y);
    }
    getState() {
        return this.getBaseState();
    }
    handleDespawn(params) {
        this.blinkTimeout = setTimeout(() => {
            params.blinkCallback();
            this.despawnTimeout = setTimeout(params.despawnCallback, params.blinkingDuration);
        }, params.beforeBlinkDelay);
    }
    destroy() {
        if (this.blinkTimeout)
            clearTimeout(this.blinkTimeout);
        if (this.despawnTimeout)
            clearTimeout(this.despawnTimeout);
        if (this.isStatic) {
            this.scheduleRespawn(30000);
        }
    }
    scheduleRespawn(delay) {
        setTimeout(() => {
            this.respawnCallback?.();
        }, delay);
    }
    onRespawn(callback) {
        this.respawnCallback = callback;
    }
}
