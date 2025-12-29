import { EntityKind, EntityKindMap, Orientation, RankedArmors, RankedWeapons, } from './types.js';
export const getEntityType = (kind) => {
    return EntityKindMap[kind]?.[1];
};
export const isPlayer = (kind) => getEntityType(kind) === 'player';
export const isMob = (kind) => getEntityType(kind) === 'mob';
export const isNpc = (kind) => getEntityType(kind) === 'npc';
export const isCharacter = (kind) => isMob(kind) || isNpc(kind) || isPlayer(kind);
export const isArmor = (kind) => getEntityType(kind) === 'armor';
export const isWeapon = (kind) => getEntityType(kind) === 'weapon';
export const isObject = (kind) => getEntityType(kind) === 'object';
export const isChest = (kind) => kind === EntityKind.CHEST;
export const isItem = (kind) => isWeapon(kind) || isArmor(kind) || (isObject(kind) && !isChest(kind));
export const isHealingItem = (kind) => kind === EntityKind.FLASK || kind === EntityKind.BURGER;
export const isExpendableItem = (kind) => isHealingItem(kind) || kind === EntityKind.FIREPOTION || kind === EntityKind.CAKE;
export const random = (range) => Math.floor(Math.random() * range);
export const randomRange = (min, max) => min + Math.random() * (max - min);
export const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
export const clamp = (min, max, value) => {
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
};
export const randomOrientation = () => {
    const r = random(4);
    if (r === 0)
        return Orientation.LEFT;
    if (r === 1)
        return Orientation.RIGHT;
    if (r === 2)
        return Orientation.UP;
    return Orientation.DOWN;
};
export const distanceTo = (x, y, x2, y2) => {
    const distX = Math.abs(x - x2);
    const distY = Math.abs(y - y2);
    return distX > distY ? distX : distY;
};
export const getWeaponRank = (weaponKind) => RankedWeapons.indexOf(weaponKind);
export const getArmorRank = (armorKind) => RankedArmors.indexOf(armorKind);
export const getKindAsString = (kind) => {
    return EntityKindMap[kind]?.[0];
};
export const getKindFromString = (kindStr) => {
    const entry = Object.entries(EntityKindMap).find(([_, [name]]) => name === kindStr);
    return entry ? Number.parseInt(entry[0]) : undefined;
};
export const getDistance = (x1, y1, x2, y2) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
};
