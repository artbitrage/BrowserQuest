import path from 'node:path';
import pino from 'pino';
import { WebSocketServer } from 'ws';
import { Connection } from './core/Connection.js';
import { WorldServer } from './world/WorldServer.js';
import { Player } from './world/entities/Player.js';

import { logger } from './core/Log.js';

interface ServerConfig {
  port: number;
  maxPlayers: number;
  nbWorlds: number;
  mapFile: string;
}

const config = {
  port: Number.parseInt(process.env.PORT || '8000'),
  maxPlayers: 100,
  nbWorlds: 1,
  mapFile: path.join(process.cwd(), '../../legacy/server/maps/world_server.json'),
} satisfies ServerConfig;

class GameServer {
  private wss: WebSocketServer;
  private worlds: WorldServer[] = [];
  private connections: Record<string, Connection> = {};
  private connectionCounter = 0;

  constructor(port: number) {
    this.wss = new WebSocketServer({
      port,
      host: '0.0.0.0'
    });

    this.wss.on('connection', (socket) => {
      const id = `5${Math.floor(Math.random() * 99)}${this.connectionCounter++}`;
      const connection = new Connection(id, socket);
      this.connections[id] = connection;

      connection.onClose(() => {
        delete this.connections[id];
      });

      // Find best world for player
      const world = this.worlds.reduce((prev, curr) =>
        prev.playerCount < curr.playerCount ? prev : curr,
      );

      if (world) {
        const player = new Player(connection, world);
        world.addPlayer(player);
      }
    });

    logger.info(`BrowserQuest server listening on port ${port}`);
  }

  async start() {
    for (let i = 0; i < config.nbWorlds; i++) {
      const world = new WorldServer(`world${i + 1}`, config.maxPlayers, this);
      await world.run(config.mapFile);
      this.worlds.push(world);
    }
  }

  getConnection(id: string): Connection | undefined {
    return this.connections[id];
  }
}

const server = new GameServer(config.port);
server.start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
