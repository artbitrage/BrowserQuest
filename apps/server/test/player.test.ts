import { EntityKind, MessageType } from '@bq/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Player } from '../src/world/entities/Player';
import { MockConnection, MockWorldServer } from './mocks';

// Mock DB to avoid connection attempts
vi.mock('../src/core/db/index', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe('Player', () => {
  let connection: MockConnection;
  let world: MockWorldServer;
  let player: Player;

  beforeEach(() => {
    connection = new MockConnection();
    world = new MockWorldServer();
    player = new Player(connection as any, world as any);
  });

  it('should initialize with default stats', () => {
    expect(player.id).toBe('mock-conn-id');
    expect(player.kind).toBe(EntityKind.WARRIOR);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
  });

  it('should handle HELLO message', async () => {
    const enterCallback = vi.fn();
    player.onHello(enterCallback);

    connection.receive([MessageType.HELLO, 'Hero', 0, 0]);

    expect(player.name).toBe('Hero');
    await vi.waitFor(() => {
      expect(enterCallback).toHaveBeenCalled();
    });
  });

  it('should handle MOVE message', () => {
    const moveCallback = vi.fn();
    player.onMove(moveCallback);

    connection.receive([MessageType.MOVE, 10, 20]);

    expect(moveCallback).toHaveBeenCalledWith(10, 20);
  });

  it('should handle WHO message', () => {
    world.playerCount = 42;
    connection.receive([MessageType.WHO]);
    expect(connection.send).toHaveBeenCalledWith([MessageType.WHO, 42]);
  });
});
