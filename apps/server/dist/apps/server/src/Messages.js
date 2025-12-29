import { MessageType } from '@bq/shared';
export class Message {
    serialize() {
        return [];
    }
}
export class Spawn extends Message {
    entity;
    constructor(entity) {
        super();
        this.entity = entity;
    }
    serialize() {
        return [MessageType.SPAWN, ...this.entity.getState()];
    }
}
export class Welcome extends Message {
    id;
    name;
    x;
    y;
    kind;
    constructor(id, name, x, y, kind) {
        super();
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.kind = kind;
    }
    serialize() {
        return [MessageType.WELCOME, this.id, this.name, this.x, this.y, this.kind];
    }
}
export class Despawn extends Message {
    entityId;
    constructor(entityId) {
        super();
        this.entityId = entityId;
    }
    serialize() {
        return [MessageType.DESPAWN, this.entityId];
    }
}
export class Move extends Message {
    entity;
    constructor(entity) {
        super();
        this.entity = entity;
    }
    serialize() {
        return [MessageType.MOVE, this.entity.id, this.entity.x, this.entity.y];
    }
}
export class LootMove extends Message {
    entity;
    itemId;
    constructor(entity, itemId) {
        super();
        this.entity = entity;
        this.itemId = itemId;
    }
    serialize() {
        return [MessageType.LOOTMOVE, this.entity.id, this.itemId];
    }
}
export class Attack extends Message {
    attackerId;
    targetId;
    constructor(attackerId, targetId) {
        super();
        this.attackerId = attackerId;
        this.targetId = targetId;
    }
    serialize() {
        return [MessageType.ATTACK, this.attackerId, this.targetId];
    }
}
export class Health extends Message {
    points;
    isRegen;
    constructor(points, isRegen) {
        super();
        this.points = points;
        this.isRegen = isRegen;
    }
    serialize() {
        const health = [MessageType.HEALTH, this.points];
        if (this.isRegen)
            health.push(1);
        return health;
    }
}
export class HitPoints extends Message {
    maxHitPoints;
    constructor(maxHitPoints) {
        super();
        this.maxHitPoints = maxHitPoints;
    }
    serialize() {
        return [MessageType.HP, this.maxHitPoints];
    }
}
export class EquipItem extends Message {
    playerId;
    itemKind;
    constructor(playerId, itemKind) {
        super();
        this.playerId = playerId;
        this.itemKind = itemKind;
    }
    serialize() {
        return [MessageType.EQUIP, this.playerId, this.itemKind];
    }
}
export class Drop extends Message {
    mob;
    itemId;
    itemKind;
    constructor(mob, itemId, itemKind) {
        super();
        this.mob = mob;
        this.itemId = itemId;
        this.itemKind = itemKind;
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
    playerId;
    message;
    constructor(playerId, message) {
        super();
        this.playerId = playerId;
        this.message = message;
    }
    serialize() {
        return [MessageType.CHAT, this.playerId, this.message];
    }
}
export class Teleport extends Message {
    entity;
    constructor(entity) {
        super();
        this.entity = entity;
    }
    serialize() {
        return [MessageType.TELEPORT, this.entity.id, this.entity.x, this.entity.y];
    }
}
export class Damage extends Message {
    entityId;
    points;
    constructor(entityId, points) {
        super();
        this.entityId = entityId;
        this.points = points;
    }
    serialize() {
        return [MessageType.DAMAGE, this.entityId, this.points];
    }
}
export class Population extends Message {
    worldPlayers;
    totalPlayers;
    constructor(worldPlayers, totalPlayers) {
        super();
        this.worldPlayers = worldPlayers;
        this.totalPlayers = totalPlayers;
    }
    serialize() {
        return [MessageType.POPULATION, this.worldPlayers, this.totalPlayers];
    }
}
export class Kill extends Message {
    kind;
    constructor(kind) {
        super();
        this.kind = kind;
    }
    serialize() {
        return [MessageType.KILL, this.kind];
    }
}
export class List extends Message {
    ids;
    constructor(ids) {
        super();
        this.ids = ids;
    }
    serialize() {
        return [MessageType.LIST, ...this.ids];
    }
}
export class Destroy extends Message {
    entityId;
    constructor(entityId) {
        super();
        this.entityId = entityId;
    }
    serialize() {
        return [MessageType.DESTROY, this.entityId];
    }
}
export class Blink extends Message {
    itemId;
    constructor(itemId) {
        super();
        this.itemId = itemId;
    }
    serialize() {
        return [MessageType.BLINK, this.itemId];
    }
}
