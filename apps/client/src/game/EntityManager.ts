import { Orientation } from '@bq/shared';
import type { Game } from './Game';
import { Log } from './Log';

export interface Entity {
  id: number | string;
  kind: number;
  x: number;
  y: number;
  orientation: number;
  lastMove: number;
}

export class EntityManager {
  // private game: Game;
  public entities: Map<number | string, Entity> = new Map();
  public playerId: number | string | null = null;

  constructor(_game: Game) {
    // this.game = game;
  }

  public addEntity(id: number | string, kind: number, x: number, y: number) {
    if (this.entities.has(id)) {
      Log.warn('Entity already exists:', id);
      return;
    }
    const entity: Entity = {
      id,
      kind,
      x,
      y,
      orientation: Orientation.DOWN,
      lastMove: 0,
    };
    this.entities.set(id, entity);
    Log.info('Added entity:', id, kind, x, y);
  }

  public removeEntity(id: number | string) {
    if (this.entities.delete(id)) {
      Log.info('Removed entity:', id);
    }
  }

  public setPlayerId(id: number | string) {
    this.playerId = id;
    Log.info('Player ID set:', id);
  }

  public moveEntity(id: number | string, x: number, y: number) {
    const entity = this.entities.get(id);
    if (entity) {
      // Calculate orientation
      if (x > entity.x) entity.orientation = Orientation.RIGHT;
      else if (x < entity.x) entity.orientation = Orientation.LEFT;
      else if (y > entity.y) entity.orientation = Orientation.DOWN;
      else if (y < entity.y) entity.orientation = Orientation.UP;

      entity.x = x;
      entity.y = y;
      entity.lastMove = performance.now();
    }
  }

  public get(id: number | string) {
    return this.entities.get(id);
  }
}
