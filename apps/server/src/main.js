import pino from 'pino';
import { WebSocketServer } from 'ws';
const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});
const port = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port });
logger.info(`BrowserQuest Server starting on port ${port}...`);
wss.on('connection', (ws) => {
  logger.info('New client connected');
  ws.on('message', (message) => {
    logger.info(`Received message: ${message}`);
  });
  ws.on('close', () => {
    logger.info('Client disconnected');
  });
  ws.send('Welcome player! Server is running in Node 23.');
});
