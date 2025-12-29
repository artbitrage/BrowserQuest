import { MessageType, type ServerMessage } from '@bq/shared';
import type { Entity } from '../world/entities/Entity.js';
import type { Mob } from '../world/entities/Mob.js';

export abstract class Message {
  abstract serialize(): ServerMessage;
}

export class Spawn extends Message {
  constructor(private entity: Entity) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.SPAWN, ...this.entity.getState()] as any;
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
  serialize(): ServerMessage {
    return [MessageType.WELCOME, this.id, this.name, this.x, this.y, this.kind] as ServerMessage;
  }
}

export class Despawn extends Message {
  constructor(private entityId: string | number) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.DESPAWN, this.entityId] as ServerMessage;
  }
}

export class Move extends Message {
  constructor(private entity: Entity) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.MOVE, this.entity.id, this.entity.x, this.entity.y] as ServerMessage;
  }
}

export class LootMove extends Message {
  constructor(
    private entity: Entity,
    private itemId: string | number,
  ) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.LOOTMOVE, this.entity.id, this.itemId] as ServerMessage;
  }
}

export class Attack extends Message {
  constructor(
    private attackerId: string | number,
    private targetId: string | number,
  ) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.ATTACK, this.attackerId, this.targetId] as ServerMessage;
  }
}

export class Health extends Message {
  constructor(
    private points: number,
    private isRegen: boolean,
  ) {
    super();
  }
  serialize(): ServerMessage {
    if (this.isRegen) {
      return [MessageType.HEALTH, this.points, 1] as ServerMessage;
    }
    return [MessageType.HEALTH, this.points] as ServerMessage;
  }
}

export class HitPoints extends Message {
  constructor(private maxHitPoints: number) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.HP, this.maxHitPoints] as ServerMessage;
  }
}

export class EquipItem extends Message {
  constructor(
    private playerId: string | number,
    private itemKind: number,
  ) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.EQUIP, this.playerId, this.itemKind] as ServerMessage;
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
  serialize(): ServerMessage {
    return [
      MessageType.DROP,
      this.mob.id,
      this.itemId,
      this.itemKind,
      this.mob.hatelist.map((e) => e.id),
    ] as ServerMessage;
  }
}

export class Chat extends Message {
  constructor(
    private playerId: string | number,
    private message: string,
  ) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.CHAT, this.playerId, this.message] as ServerMessage;
  }
}

export class Teleport extends Message {
  constructor(private entity: Entity) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.TELEPORT, this.entity.id, this.entity.x, this.entity.y] as ServerMessage;
  }
}

export class Damage extends Message {
  constructor(
    private entityId: string | number,
    private points: number,
  ) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.DAMAGE, this.entityId, this.points] as ServerMessage;
  }
}

export class Population extends Message {
  constructor(
    private worldPlayers: number,
    private totalPlayers: number,
  ) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.POPULATION, this.worldPlayers, this.totalPlayers] as ServerMessage;
  }
}

export class Kill extends Message {
  constructor(private kind: number) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.KILL, this.kind] as ServerMessage;
  }
}

export class List extends Message {
  constructor(private ids: (string | number)[]) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.LIST, ...this.ids] as ServerMessage;
  }
}

export class Destroy extends Message {
  constructor(private entityId: string | number) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.DESTROY, this.entityId] as ServerMessage;
  }
}

export class Blink extends Message {
  constructor(private itemId: string | number) {
    super();
  }
  serialize(): ServerMessage {
    return [MessageType.BLINK, this.itemId] as ServerMessage;
  }
}
