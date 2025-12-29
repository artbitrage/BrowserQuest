import type { WebSocket } from 'ws';
import { logger } from './Log.js';

export class Connection {
  private listenCallback?: (message: any) => void;
  private closeCallback?: () => void;

  constructor(
    public id: string,
    private socket: WebSocket,
  ) {
    this.socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.listenCallback?.(message);
      } catch (e) {
        logger.error({ err: e }, 'Failed to parse message');
      }
    });

    this.socket.on('close', () => {
      this.closeCallback?.();
    });
  }

  listen(callback: (message: any) => void) {
    this.listenCallback = callback;
  }

  onClose(callback: () => void) {
    this.closeCallback = callback;
  }

  send(message: any) {
    this.socket.send(JSON.stringify(message));
  }

  close(reason?: string) {
    logger.info({ id: this.id, reason }, 'Closing connection');
    this.socket.close();
  }
}
