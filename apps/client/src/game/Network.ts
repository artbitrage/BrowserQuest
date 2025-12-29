import { type ClientMessage, MessageType } from '@bq/shared';
import type { Game } from './Game';

export class Network {
  private game: Game;
  private socket: WebSocket | null = null;
  private connected = false;

  constructor(game: Game) {
    this.game = game;
  }

  public connect(url: string, name: string) {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.connected = true;
      console.log('Connected to server');
      this.sendHello(name);
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.socket.onclose = () => {
      this.connected = false;
      console.log('Disconnected from server');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  public send(message: ClientMessage) {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private handleMessage(data: any) {
    try {
      const message = JSON.parse(data);
      this.game.receiveMessage(message);
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  }

  public sendHello(name: string) {
    this.send([MessageType.HELLO, name]);
  }

  public sendMove(x: number, y: number) {
    this.send([MessageType.MOVE, x, y]);
  }

  public sendAttack(mobId?: string | number) {
    if (mobId !== undefined) {
      this.send([MessageType.ATTACK, mobId]);
    } else {
      this.send([MessageType.AGGRO]);
    }
  }
}
