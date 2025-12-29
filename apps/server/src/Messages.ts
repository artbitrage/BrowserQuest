import { MessageType } from '@bq/shared';
import type { Entity } from './entities/Entity.js';
import type { Mob } from './entities/Mob.js';

export class Message {
  serialize(): any[] {
    return [];
  }
}

export class Spawn extends Message {
  constructor(private entity: Entity) {
    super();
  }
  serialize() {
    return [MessageType.SPAWN, ...this.entity.getState()];
  }
}

export class Welcome extends Message {
  constructor(
    private id: string | number,
    private name: string,
    private x: number,
    private y: number,
    private kind: number,
  ) {
    super();
  }
  serialize() {
    return [MessageType.WELCOME, this.id, this.name, this.x, this.y, this.kind];
  }
}

export class Despawn extends Message {
  constructor(private entityId: string | number) {
    super();
  }
  serialize() {
    return [MessageType.DESPAWN, this.entityId];
  }
}

export class Move extends Message {
  constructor(private entity: Entity) {
    super();
  }
  serialize() {
    return [MessageType.MOVE, this.entity.id, this.entity.x, this.entity.y];
  }
}

export class LootMove extends Message {
  constructor(
    private entity: Entity,
    private itemId: string | number,
  ) {
    super();
  }
  serialize() {
    return [MessageType.LOOTMOVE, this.entity.id, this.itemId];
  }
}

export class Attack extends Message {
  constructor(
    private attackerId: string | number,
    private targetId: string | number,
  ) {
    super();
  }
  serialize() {
    return [MessageType.ATTACK, this.attackerId, this.targetId];
  }
}

export class Health extends Message {
  constructor(
    private points: number,
    private isRegen: boolean,
  ) {
    super();
  }
  serialize() {
    const health: any[] = [MessageType.HEALTH, this.points];
    if (this.isRegen) health.push(1);
    return health;
  }
}

export class HitPoints extends Message {
  constructor(private maxHitPoints: number) {
    super();
  }
  serialize() {
    return [MessageType.HP, this.maxHitPoints];
  }
}

export class EquipItem extends Message {
  constructor(
    private playerId: string | number,
    private itemKind: number,
  ) {
    super();
  }
  serialize() {
    return [MessageType.EQUIP, this.playerId, this.itemKind];
  }
}

export class Drop extends Message {
  constructor(
    private mob: Mob,
    private itemId: string | number,
    private itemKind: number,
  ) {
    super();
  }
  serialize() {
    return [
      MessageType.DROP,
      this.mob.id,
      this.itemId,
      this.itemKind,
      this.mob.hatelist.map((e) => e.id),
    ];
  }
}

export class Chat extends Message {
  constructor(
    private playerId: string | number,
    private message: string,
  ) {
    super();
  }
  serialize() {
    return [MessageType.CHAT, this.playerId, this.message];
  }
}

export class Teleport extends Message {
  constructor(private entity: Entity) {
    super();
  }
  serialize() {
    return [MessageType.TELEPORT, this.entity.id, this.entity.x, this.entity.y];
  }
}

export class Damage extends Message {
  constructor(
    private entityId: string | number,
    private points: number,
  ) {
    super();
  }
  serialize() {
    return [MessageType.DAMAGE, this.entityId, this.points];
  }
}

export class Population extends Message {
  constructor(
    private worldPlayers: number,
    private totalPlayers: number,
  ) {
    super();
  }
  serialize() {
    return [MessageType.POPULATION, this.worldPlayers, this.totalPlayers];
  }
}

export class Kill extends Message {
  constructor(private kind: number) {
    super();
  }
  serialize() {
    return [MessageType.KILL, this.kind];
  }
}

export class List extends Message {
  constructor(private ids: (string | number)[]) {
    super();
  }
  serialize() {
    return [MessageType.LIST, ...this.ids];
  }
}

export class Destroy extends Message {
  constructor(private entityId: string | number) {
    super();
  }
  serialize() {
    return [MessageType.DESTROY, this.entityId];
  }
}

export class Blink extends Message {
  constructor(private itemId: string | number) {
    super();
  }
  serialize() {
    return [MessageType.BLINK, this.itemId];
  }
}
