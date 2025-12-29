import { MessageType } from '@bq/shared';
import { EntityManager } from './EntityManager';
import { Input } from './Input';
import { Log } from './Log';
import { Map as GameMap } from './Map';
import { Network } from './Network';
import { Renderer } from './Renderer';

export class Game {
  public renderer: Renderer;
  public network: Network;
  public input: Input;
  public map: GameMap;
  public entities: EntityManager;

  private lastTime = 0;
  private running = false;
  private animationFrameId: number | null = null;
  public container: HTMLElement | null = null;

  public events: Map<string, Function[]> = new Map();

  constructor() {
    this.renderer = new Renderer(this);
    this.network = new Network(this);
    this.input = new Input(this);
    this.map = new GameMap(this);
    this.entities = new EntityManager(this);
    Log.info('Game engine initialized');
  }

  public on(event: string, callback: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(callback);
  }

  public off(event: string, callback: Function) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      this.events.set(
        event,
        callbacks.filter((cb: Function) => cb !== callback),
      );
    }
  }

  public emit(event: string, data?: any) {
    this.events.get(event)?.forEach((callback: Function) => callback(data));
  }

  public init(container: HTMLElement) {
    this.container = container;
    this.renderer.init(container);
    this.input.init();

    // Resize handler
    window.addEventListener('resize', () => {
      this.renderer.resize();
    });
  }

  public connect(name: string) {
    this.network.connect('ws://localhost:8000', name);
  }

  public receiveMessage(message: any) {
    const type = message[0];
    // Log.info('Game received:', message);

    switch (type) {
      case MessageType.WELCOME: // WELCOME
        // [0, id, name, x, y, kind]
        const id = message[1];
        const name = message[2];
        const x = message[3];
        const y = message[4];
        const kind = message[5];
        this.entities.setPlayerId(id);
        this.entities.addEntity(id, kind, x, y);
        Log.info('Welcome received', name);
        this.emit('welcome', { id, name, x, y, kind });
        break;
      case MessageType.SPAWN: // SPAWN
        this.entities.addEntity(message[1], message[2], message[3], message[4]);
        break;
      case MessageType.DESPAWN: // DESPAWN
        this.entities.removeEntity(message[1]);
        break;
      case MessageType.MOVE: // MOVE
        this.entities.moveEntity(message[1], message[2], message[3]);
        break;
      case MessageType.CHAT:
        this.emit('chat', message[1]);
        break;
    }
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
    Log.info('Game started');
  }

  public stop() {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private loop(timestamp: number) {
    if (!this.running) return;

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  private update(_dt: number) {
    this.input.update();
  }

  private render() {
    this.renderer.render();
  }
}
