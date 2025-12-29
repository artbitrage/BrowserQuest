# 🎮 BrowserQuest

A modernized HTML5/JavaScript multiplayer game experiment, rebuilt with a bleeding-edge tech stack.

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

## ✨ Features

- **Modern Monorepo**: npm workspaces with `@bq/client`, `@bq/server`, `@bq/shared`
- **Real-time Multiplayer**: WebSocket-based networking with `ws`
- **Type-Safe**: End-to-end TypeScript with shared types
- **Docker Ready**: Multi-stage Dockerfiles with docker-compose orchestration
- **CI/CD**: GitHub Actions for lint, test, and build

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.0.0
- npm >= 10

### Development
```bash
# Install dependencies
npm install

# Start all services in development mode
npm run dev

# Or start individually
npm run dev --workspace @bq/client
npm run dev --workspace @bq/server
```

### Production (Docker)
```bash
# Build and run all services
docker-compose up --build

# Access:
# - Client: http://localhost:8080
# - Server: ws://localhost:8000
```

## 📁 Project Structure

```
browserquest-monorepo/
├── apps/
│   ├── client/          # React 19 + Vite 6 game client
│   │   ├── src/
│   │   │   ├── components/  # React UI (HUD, Login, Chat)
│   │   │   └── game/        # Canvas game engine
│   │   └── public/          # Static assets (sprites, audio)
│   └── server/          # Node.js WebSocket server
│       ├── src/
│       │   ├── entities/    # Game entities (Mob, Npc, Character)
│       │   ├── WorldServer.ts
│       │   └── player.ts
│       └── test/            # Vitest tests
├── packages/
│   └── shared/          # Shared types, utils, constants
└── legacy/              # Original BrowserQuest code (reference)
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Client** | React 19, Vite 6, TailwindCSS 4, Canvas 2D |
| **Server** | Node.js 22, WebSocket (ws), Pino |
| **Shared** | TypeScript 5.7, Zod |
| **Database** | Redis (via ioredis) |
| **CI/CD** | GitHub Actions, Docker |
| **Tooling** | Biome (lint/format), Vitest |

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services in dev mode |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run lint` | Check code with Biome |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code with Biome |

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run server tests only
npm run test --workspace @bq/server
```

**Test Coverage:**
- Unit tests for Player, WorldServer, Utils
- Integration tests for Game Loop (HELLO/WELCOME/MOVE handshake)

## 📄 License

- **Code**: [MPL 2.0](https://opensource.org/licenses/MPL-2.0)
- **Content**: [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

## 🙏 Credits

Original game created by [Little Workshop](http://www.littleworkshop.fr):
- Franck Lecollinet - [@whatthefranck](http://twitter.com/whatthefranck)
- Guillaume Lecollinet - [@glecollinet](http://twitter.com/glecollinet)

Modernization by the community.