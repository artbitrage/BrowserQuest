import {
  type EntityKind,
  getArmorLevel,
  getDistance,
  getEntityMaxHp,
  getWeaponLevel,
} from '@bq/shared';
import { Character } from './Character.js';

export interface HateEntry {
  id: string | number;
  hate: number;
}

export class Mob extends Character {
  public spawningX: number;
  public spawningY: number;
  public armorLevel: number;
  public weaponLevel: number;
  public hatelist: HateEntry[] = [];
  public isDead = false;
  private returnTimeout: NodeJS.Timeout | null = null;
  private respawnCallback?: () => void;
  private moveCallback?: (mob: Mob) => void;

  constructor(id: string | number, kind: EntityKind, x: number, y: number) {
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

  receiveDamage(points: number) {
    this.hitPoints -= points;
  }

  hates(playerId: string | number): boolean {
    return this.hatelist.some((entry) => entry.id === playerId);
  }

  increaseHateFor(playerId: string | number, points: number) {
    const entry = this.hatelist.find((e) => e.id === playerId);
    if (entry) {
      entry.hate += points;
    } else {
      this.hatelist.push({ id: playerId, hate: points });
    }

    if (this.returnTimeout) {
      clearTimeout(this.returnTimeout);
      this.returnTimeout = null;
    }
  }

  getHatedPlayerId(hateRank?: number): string | number | undefined {
    const sorted = [...this.hatelist].sort((a, b) => b.hate - a.hate);
    const index = hateRank && hateRank <= sorted.length ? hateRank - 1 : 0;
    return sorted[index]?.id;
  }

  forgetPlayer(playerId: string | number, duration?: number) {
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

  distanceToSpawningPoint(x: number, y: number): number {
    return getDistance(x, y, this.spawningX, this.spawningY);
  }

  move(x: number, y: number) {
    this.setPosition(x, y);
    this.moveCallback?.(this);
  }

  onMove(callback: (mob: Mob) => void) {
    this.moveCallback = callback;
  }

  onRespawn(callback: () => void) {
    this.respawnCallback = callback;
  }

  handleRespawn() {
    setTimeout(() => {
      this.respawnCallback?.();
    }, 30000);
  }
}
