import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldServer } from '../src/WorldServer';
import { Player } from '../src/player';
import { MockConnection } from './mocks';

describe('WorldServer', () => {
  let world: WorldServer;

  beforeEach(() => {
    world = new WorldServer('test-world', 100, { getConnection: vi.fn() });

    // Mock Map
    world.map = {
      getGroupIdFromPosition: () => '0-0',
      forEachAdjacentGroup: (id: string, cb: any) => cb('0-0'),
      forEachGroup: (cb: any) => cb('0-0'),
      tileIndexToGridPosition: () => ({ x: 0, y: 0 }),
      staticEntities: {},
      mobAreas: [],
      chestAreas: [],
      staticChests: [],
    } as any;
    world.initZoneGroups();
  });

  it('should add player', () => {
    const conn = new MockConnection();
    const player = new Player(conn as any, world);

    world.addPlayer(player);

    expect(world.players[player.id]).toBe(player);
  });

  it('should remove player', () => {
    const conn = new MockConnection();
    const player = new Player(conn as any, world);

    world.addPlayer(player);
    world.removePlayer(player);

    expect(world.players[player.id]).toBeUndefined();
  });
});
