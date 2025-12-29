# @bq/client

The BrowserQuest game client - a React 19 + Vite 6 application with Canvas 2D rendering.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 6
- **Styling**: TailwindCSS 4, framer-motion
- **Audio**: Howler.js
- **Icons**: lucide-react

## Scripts

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

```
src/
├── components/      # React UI components
│   ├── GameCanvas.tsx   # Canvas wrapper
│   ├── LoginScreen.tsx  # Login form
│   └── hud/             # HUD components
│       ├── Chat.tsx
│       ├── HealthBar.tsx
│       ├── Inventory.tsx
│       └── HUD.tsx
├── game/            # Game engine (imperative)
│   ├── Game.ts          # Main loop orchestrator
│   ├── Renderer.ts      # Canvas 2D rendering
│   ├── Network.ts       # WebSocket client
│   ├── Input.ts         # Keyboard handling
│   ├── EntityManager.ts # Entity state
│   ├── Map.ts           # Tile map + collision
│   └── Log.ts           # Debug logging
├── App.tsx          # Root component
└── main.tsx         # Entry point
```

## Game Engine

The game engine is separate from React for performance:

| Class | Responsibility |
|-------|----------------|
| `Game` | Orchestrates loop, manages subsystems |
| `Renderer` | Draws entities and map to canvas |
| `Network` | WebSocket connection, message send/receive |
| `Input` | WASD/Arrow key handling, cooldown |
| `EntityManager` | Track player and entity positions |
| `Map` | Load world data, collision detection |

## Configuration

The client connects to the server at `ws://localhost:8000` by default.

## Assets

Located in `public/`:
- `audio/` - Sound effects and music
- `img/` - UI images
- `sprites/` - Entity spritesheets
- `maps/` - World data (JSON)
