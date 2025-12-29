import { EntityKind, MessageType, getArmorLevel, getWeaponLevel } from '@bq/shared';
import * as Messages from './Messages.js';
import { Character } from './entities/Character.js';
export class Player extends Character {
    connection;
    world;
    name = '';
    hasEnteredGame = false;
    isDead = false;
    armor = EntityKind.CLOTHARMOR;
    weapon = EntityKind.SWORD1;
    armorLevel = 1;
    weaponLevel = 1;
    lastCheckpoint = null;
    requestPositionCallback;
    moveCallback;
    lootMoveCallback;
    zoneCallback;
    broadcastCallback;
    broadcastToZoneCallback;
    exitCallback;
    helloCallback;
    actionCallback;
    constructor(connection, world) {
        super(connection.id, 'player', EntityKind.WARRIOR, 0, 0);
        this.connection = connection;
        this.world = world;
        this.connection.listen((message) => {
            const type = message[0];
            switch (type) {
                case MessageType.HELLO:
                    this.name = message[1];
                    this.kind = EntityKind.WARRIOR; // Default or from message?
                    // Legacy: name, armor, weapon if resuming?
                    // For now just name.
                    if (this.requestPositionCallback) {
                        const pos = this.requestPositionCallback();
                        this.setPosition(pos.x, pos.y);
                    }
                    if (this.helloCallback)
                        this.helloCallback();
                    break;
                case MessageType.MOVE:
                    if (this.moveCallback)
                        this.moveCallback(message[1], message[2]);
                    break;
                case MessageType.LOOTMOVE:
                    if (this.lootMoveCallback)
                        this.lootMoveCallback(message[1], message[2]);
                    break;
                case MessageType.AGGRO:
                    if (this.actionCallback)
                        this.actionCallback();
                    break;
                case MessageType.ATTACK:
                    const mobId = message[1];
                    this.world.handleMobHate(mobId, this.id, 5);
                    this.world.handleHurtEntity(this.world.getEntityById(mobId), this, getWeaponLevel(this.weapon));
                    break;
                case MessageType.HIT:
                    const entityId = message[1];
                    const entity = this.world.getEntityById(entityId);
                    if (entity && entity instanceof Character) {
                        this.world.handleHurtEntity(entity, this, getWeaponLevel(this.weapon));
                    }
                    break;
                case MessageType.CHAT:
                    const msg = message[1];
                    if (msg && this.broadcastCallback) {
                        this.broadcastCallback(new Messages.Chat(this.id, msg), false);
                    }
                    break;
                case MessageType.WHO:
                    this.connection.send([MessageType.WHO, this.world.playerCount]);
                    break;
                case MessageType.ZONE:
                    if (this.zoneCallback)
                        this.zoneCallback();
                    break;
            }
        });
        this.connection.onClose(() => {
            this.exitCallback?.();
        });
    }
    onHello(callback) {
        this.helloCallback = callback;
    }
    onAction(callback) {
        this.actionCallback = callback;
    }
    getState() {
        const basestate = this.getBaseState();
        const state = [this.name, this.orientation, this.armor, this.weapon];
        if (this.target !== null) {
            state.push(this.target);
        }
        return [...basestate, ...state];
    }
    equipArmor(kind) {
        this.armor = kind;
        this.armorLevel = getArmorLevel(kind);
    }
    equipWeapon(kind) {
        this.weapon = kind;
        this.weaponLevel = getWeaponLevel(kind);
    }
    onRequestPosition(callback) {
        this.requestPositionCallback = callback;
    }
    onMove(callback) {
        this.moveCallback = callback;
    }
    onLootMove(callback) {
        this.lootMoveCallback = callback;
    }
    onZone(callback) {
        this.zoneCallback = callback;
    }
    onBroadcast(callback) {
        this.broadcastCallback = callback;
    }
    onBroadcastToZone(callback) {
        this.broadcastToZoneCallback = callback;
    }
    onExit(callback) {
        this.exitCallback = callback;
    }
    broadcast(message, ignoreSelf = false) {
        this.broadcastCallback?.(message, ignoreSelf);
    }
    broadcastToZone(message, ignoreSelf = false) {
        this.broadcastToZoneCallback?.(message, ignoreSelf);
    }
    addHater(_mob) { }
    removeHater(_mob) { }
    despawn() {
        return new Messages.Despawn(this.id);
    }
    health() {
        return new Messages.Health(this.hitPoints, false);
    }
    regen() {
        return new Messages.Health(this.hitPoints, true);
    }
}
