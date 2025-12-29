# @bq/server

The BrowserQuest game server - a Node.js WebSocket server with TypeScript.

## Tech Stack

- **Runtime**: Node.js 22
- **WebSocket**: ws
- **Logging**: pino + pino-pretty
- **Cache**: ioredis (Redis client)
- **Validation**: Zod
- **Testing**: Vitest

## Scripts

```bash
npm run dev    # Start with hot reload (tsx watch)
npm run build  # Compile TypeScript
npm run start  # Run compiled JS
npm run test   # Run tests
```

## Architecture

```
src/
├── main.ts              # Entry point, GameServer class
├── WorldServer.ts       # Game world logic (21KB)
├── player.ts            # Player connection handling
├── Connection.ts        # WebSocket wrapper
├── Messages.ts          # Message serialization
├── Map.ts               # Server-side map data
├── Item.ts              # Loot items
├── Chest.ts             # Chest containers
├── Area.ts              # Base area class
├── MobArea.ts           # Mob spawn areas
├── ChestArea.ts         # Chest spawn areas
├── Checkpoint.ts        # Respawn points
└── entities/
    ├── Entity.ts        # Base entity
    ├── Character.ts     # Character (Player/Mob base)
    ├── Mob.ts           # Enemy AI
    └── Npc.ts           # Non-player characters
```

## Core Classes

| Class | Responsibility |
|-------|----------------|
| `GameServer` | WebSocket server, world management |
| `WorldServer` | Game logic, entity spawning, groups |
| `Player` | Connection, message routing, state |
| `Map` | Collision, pathfinding, spawn points |
| `Mob` | AI, aggro, combat |

## Message Protocol

### Client → Server
```typescript
[0, name, armor, weapon, avatar]  // HELLO
[4, x, y]                          // MOVE
[7, targetId]                      // ATTACK
[11, message]                      // CHAT
```

### Server → Client
```typescript
[1, id, name, x, y, kind]          // WELCOME
[2, ...entityState]                // SPAWN
[3, entityId]                      // DESPAWN
[4, entityId, x, y]                // MOVE
```

## Configuration

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `PORT` | 8000 | Server port |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `LOG_LEVEL` | info | Pino log level |

## Testing

```bash
npm run test           # Run all tests
npx vitest run         # Single run
npx vitest --coverage  # With coverage
```

Tests are in `test/`:
- `player.test.ts` - Player unit tests
- `world.test.ts` - WorldServer tests
- `utils.test.ts` - Utility function tests
- `integration/game_loop.test.ts` - Full game loop test
