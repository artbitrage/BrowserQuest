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

  public send(message: any) {
    if (this.socket && this.connected) {
      if (Array.isArray(message)) {
        this.socket.send(JSON.stringify(message)); // Or custom serialization? server uses JSON.
      } else {
        this.socket.send(JSON.stringify(message));
      }
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
    this.send([0, name, 0, 0, 0]); // MessageType.HELLO = 0
  }

  public sendMove(x: number, y: number) {
    // MessageType.MOVE = 4
    this.send([4, x, y]);
  }

  public sendAttack() {
    // MessageType.ATTACK = 7 (from shared/types enum if I recall, but let's check)
    // Actually checking types.ts is better.
    // Based on previous file read MessageType.ATTACK = 7.
    this.send([7]);
  }
}
