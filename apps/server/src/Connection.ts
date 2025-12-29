import type { WebSocket } from 'ws';

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
        console.error('Failed to parse message:', e);
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
    console.log(`Closing connection ${this.id}: ${reason}`);
    this.socket.close();
  }
}
