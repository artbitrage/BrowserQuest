import { EntityKind, MessageType, Orientation } from './types.js';
export type EntityState = [
    id: string | number,
    kind: EntityKind,
    x: number,
    y: number,
    orientation: Orientation,
    target?: string | number
];
export type ClientMessage = [MessageType.HELLO, name: string] | [MessageType.MOVE, x: number, y: number] | [MessageType.LOOTMOVE, x: number, y: number] | [MessageType.AGGRO] | [MessageType.ATTACK, mobId: string | number] | [MessageType.HIT, entityId: string | number] | [MessageType.CHAT, message: string] | [MessageType.WHO] | [MessageType.ZONE];
export type ServerMessage = [MessageType.WELCOME, id: string | number, name: string, x: number, y: number, kind: number] | [MessageType.SPAWN, ...EntityState] | [MessageType.DESPAWN, entityId: string | number] | [MessageType.MOVE, entityId: string | number, x: number, y: number] | [MessageType.LOOTMOVE, entityId: string | number, itemId: string | number] | [MessageType.ATTACK, attackerId: string | number, targetId: string | number] | [MessageType.HEALTH, points: number, isRegen?: number] | [MessageType.HP, maxHitPoints: number] | [MessageType.EQUIP, playerId: string | number, itemKind: number] | [MessageType.DROP, mobId: string | number, itemId: string | number, itemKind: number, hatelist: (string | number)[]] | [MessageType.CHAT, playerId: string | number, message: string] | [MessageType.TELEPORT, entityId: string | number, x: number, y: number] | [MessageType.DAMAGE, entityId: string | number, points: number] | [MessageType.POPULATION, worldPlayers: number, totalPlayers: number] | [MessageType.KILL, kind: number] | [MessageType.LIST, ...ids: (string | number)[]] | [MessageType.DESTROY, entityId: string | number] | [MessageType.BLINK, itemId: string | number];
