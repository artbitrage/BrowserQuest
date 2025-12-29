import { type EntityKind, getEntityType } from '@bq/shared';
import { Entity } from './entities/Entity.js';

export interface DespawnParams {
  beforeBlinkDelay: number;
  blinkCallback: () => void;
  blinkingDuration: number;
  despawnCallback: () => void;
}

export class Item extends Entity {
  public isStatic = false;
  public isFromChest = false;
  private blinkTimeout?: NodeJS.Timeout;
  private despawnTimeout?: NodeJS.Timeout;
  private respawnCallback?: () => void;

  constructor(id: string | number, kind: EntityKind, x: number, y: number) {
    super(id, getEntityType(kind) || 'object', kind, x, y);
  }

  getState(): (number | string)[] {
    return this.getBaseState();
  }

  handleDespawn(params: DespawnParams) {
    this.blinkTimeout = setTimeout(() => {
      params.blinkCallback();
      this.despawnTimeout = setTimeout(params.despawnCallback, params.blinkingDuration);
    }, params.beforeBlinkDelay);
  }

  override destroy() {
    if (this.blinkTimeout) clearTimeout(this.blinkTimeout);
    if (this.despawnTimeout) clearTimeout(this.despawnTimeout);

    if (this.isStatic) {
      this.scheduleRespawn(30000);
    }
  }

  scheduleRespawn(delay: number) {
    setTimeout(() => {
      this.respawnCallback?.();
    }, delay);
  }

  onRespawn(callback: () => void) {
    this.respawnCallback = callback;
  }
}
