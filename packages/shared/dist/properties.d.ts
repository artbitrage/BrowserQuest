import type { EntityKind } from './types.js';
export interface EntityProperties {
    drops?: Record<string, number>;
    hp: number;
    armor: number;
    weapon: number;
}
export declare const Properties: Partial<Record<string, EntityProperties>>;
export declare const getArmorLevel: (kind: EntityKind) => number;
export declare const getWeaponLevel: (kind: EntityKind) => number;
export declare const getEntityMaxHp: (kind: EntityKind) => number;
