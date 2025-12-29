import path from 'node:path';
import pino from 'pino';
import { WebSocketServer } from 'ws';
import { Connection } from './Connection.js';
import { WorldServer } from './WorldServer.js';
import { Player } from './player.js';
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
});
const PORT = Number.parseInt(process.env.PORT || '8000');
const MAX_PLAYERS_PER_WORLD = 100;
const NB_WORLDS = 1;
const MAP_FILE = path.join(process.cwd(), '../../legacy/server/maps/world_server.json');
class GameServer {
    wss;
    worlds = [];
    connections = {};
    connectionCounter = 0;
    constructor(port) {
        this.wss = new WebSocketServer({ port });
        this.wss.on('connection', (socket) => {
            const id = `5${Math.floor(Math.random() * 99)}${this.connectionCounter++}`;
            const connection = new Connection(id, socket);
            this.connections[id] = connection;
            connection.onClose(() => {
                delete this.connections[id];
            });
            // Find best world for player
            const world = this.worlds.reduce((prev, curr) => prev.playerCount < curr.playerCount ? prev : curr);
            if (world) {
                const player = new Player(connection, world);
                world.addPlayer(player);
            }
        });
        logger.info(`BrowserQuest server listening on port ${port}`);
    }
    async start() {
        for (let i = 0; i < NB_WORLDS; i++) {
            const world = new WorldServer(`world${i + 1}`, MAX_PLAYERS_PER_WORLD, this);
            await world.run(MAP_FILE);
            this.worlds.push(world);
        }
    }
    getConnection(id) {
        return this.connections[id];
    }
}
const server = new GameServer(PORT);
server.start().catch((err) => {
    logger.error(err, 'Failed to start server');
    process.exit(1);
});
