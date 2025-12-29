# @bq/shared

Shared types, utilities, and constants for BrowserQuest.

## Installation

This package is internal to the monorepo. It's automatically linked via npm workspaces.

```typescript
import { MessageType, EntityKind, randomInt } from '@bq/shared';
```

## Exports

### Types (`types.ts`)

```typescript
// Message types for WebSocket protocol
enum MessageType {
  HELLO = 0,
  WELCOME = 1,
  SPAWN = 2,
  DESPAWN = 3,
  MOVE = 4,
  // ... 26 total
}

// Entity kinds (players, mobs, items, NPCs)
enum EntityKind {
  WARRIOR = 1,
  RAT = 2,
  SKELETON = 3,
  // ... 66 total
}

// Movement orientation
enum Orientation {
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
}
```

### Utilities (`utils.ts`)

```typescript
randomInt(min, max)        // Random integer in range
isPlayer(kind)             // Check if entity is player
isMob(kind)                // Check if entity is mob
isNpc(kind)                // Check if entity is NPC
isItem(kind)               // Check if entity is item
isArmor(kind)              // Check if item is armor
isWeapon(kind)             // Check if item is weapon
getKindAsString(kind)      // EntityKind → string name
getKindFromString(name)    // string name → EntityKind
getWeaponLevel(kind)       // Get weapon damage level
getArmorLevel(kind)        // Get armor defense level
```

### Formulas (`formulas.ts`)

```typescript
dmg(weaponLevel, armorLevel)  // Calculate damage
hp(armorKind)                 // Calculate max HP
```

### Properties (`properties.ts`)

Entity property definitions (HP, drops, etc.):

```typescript
Properties.rat    // { hp: 25, armor: 0, weapon: 0, drops: {...} }
Properties.boss   // { hp: 700, armor: 10, weapon: 10, drops: {...} }
```

## Building

```bash
npm run build  # Compiles to dist/
```

Output is ESM format with TypeScript declarations.
