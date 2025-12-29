import {
  EntityKind,
  EntityKindMap,
  type EntityType,
  Orientation,
  RankedArmors,
  RankedWeapons,
} from './types.js';

export const getEntityType = (kind: EntityKind): EntityType | undefined => {
  return EntityKindMap[kind]?.[1];
};

export const isPlayer = (kind: EntityKind) => getEntityType(kind) === 'player';
export const isMob = (kind: EntityKind) => getEntityType(kind) === 'mob';
export const isNpc = (kind: EntityKind) => getEntityType(kind) === 'npc';
export const isCharacter = (kind: EntityKind) => isMob(kind) || isNpc(kind) || isPlayer(kind);
export const isArmor = (kind: EntityKind) => getEntityType(kind) === 'armor';
export const isWeapon = (kind: EntityKind) => getEntityType(kind) === 'weapon';
export const isObject = (kind: EntityKind) => getEntityType(kind) === 'object';
export const isChest = (kind: EntityKind) => kind === EntityKind.CHEST;
export const isItem = (kind: EntityKind) =>
  isWeapon(kind) || isArmor(kind) || (isObject(kind) && !isChest(kind));
export const isHealingItem = (kind: EntityKind) =>
  kind === EntityKind.FLASK || kind === EntityKind.BURGER;
export const isExpendableItem = (kind: EntityKind) =>
  isHealingItem(kind) || kind === EntityKind.FIREPOTION || kind === EntityKind.CAKE;

export const random = (range: number) => Math.floor(Math.random() * range);
export const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
export const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

export const clamp = (min: number, max: number, value: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const randomOrientation = (): Orientation => {
  const r = random(4);
  if (r === 0) return Orientation.LEFT;
  if (r === 1) return Orientation.RIGHT;
  if (r === 2) return Orientation.UP;
  return Orientation.DOWN;
};

export const distanceTo = (x: number, y: number, x2: number, y2: number) => {
  const distX = Math.abs(x - x2);
  const distY = Math.abs(y - y2);
  return distX > distY ? distX : distY;
};

export const getWeaponRank = (weaponKind: EntityKind) => RankedWeapons.indexOf(weaponKind);
export const getArmorRank = (armorKind: EntityKind) => RankedArmors.indexOf(armorKind);

export const getKindAsString = (kind: EntityKind): string | undefined => {
  return EntityKindMap[kind]?.[0];
};

export const getKindFromString = (kindStr: string): EntityKind | undefined => {
  const entry = Object.entries(EntityKindMap).find(([_, [name]]) => name === kindStr);
  return entry ? (Number.parseInt(entry[0]) as EntityKind) : undefined;
};

export const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};
