import {
  EntityKind,
  getKindAsString,
  getKindFromString,
  isItem,
  isMob,
  isNpc,
  randomInt,
} from '@bq/shared';
import { Properties } from '@bq/shared';
import pino from 'pino';
import { Chest } from './Chest.js';
import { ChestArea } from './ChestArea.js';
import { Item } from './Item.js';
import { Map } from './Map.js';
import * as Messages from './Messages.js';
import { MobArea } from './MobArea.js';
import type { Character } from './entities/Character.js';
import type { Entity } from './entities/Entity.js';
import { Mob } from './entities/Mob.js';
import { Npc } from './entities/Npc.js';
import { Player } from './player.js';

const log = pino();

export class WorldServer {
  public id: string;
  public maxPlayers: number;
  public server: any; // WebSocketServer
  public ups = 50;

  public map: Map | null = null;
  public entities: Record<string | number, Entity> = {};
  public players: Record<string | number, Player> = {};
  public mobs: Record<string | number, Mob> = {};
  public npcs: Record<string | number, Npc> = {};
  public items: Record<string | number, Item> = {};
  public mobAreas: MobArea[] = [];
  public chestAreas: ChestArea[] = [];
  public groups: Record<
    string,
    {
      entities: Record<string | number, Entity>;
      players: (string | number)[];
      incoming: Entity[];
    }
  > = {};

  private outgoingQueues: Record<string | number, any[][]> = {};
  private itemCount = 0;
  public playerCount = 0;
  public zoneGroupsReady = false;

  private connect_callback?: (player: Player) => void;
  private enter_callback?: (player: Player) => void;
  private added_callback?: (player: Player) => void;
  private removed_callback?: () => void;
  private regen_callback?: () => void;
  private attack_callback?: (attacker: Character) => void;

  constructor(id: string, maxPlayers: number, websocketServer: any) {
    this.id = id;
    this.maxPlayers = maxPlayers;
    this.server = websocketServer;

    this.onPlayerConnect((player) => {
      player.onRequestPosition(() => {
        if (player.lastCheckpoint) {
          return player.lastCheckpoint.getRandomPosition();
        }
        return this.map!.getRandomStartingPosition();
      });

      player.onHello(() => {
        this.enter_callback?.(player);
      });
    });

    this.onPlayerEnter((player) => {
      log.info(`${player.name} has joined ${this.id}`);

      if (!player.hasEnteredGame) {
        this.incrementPlayerCount();
      }

      this.pushToPlayer(
        player,
        new Messages.Welcome(player.id, player.name, player.x, player.y, player.kind),
      );
      this.pushToPlayer(player, new Messages.Population(this.playerCount, this.playerCount));
      this.pushRelevantEntityListTo(player);

      const moveHandler = (x: number, y: number) => {
        log.debug(`${player.name} is moving to (${x}, ${y}).`);

        if (this.isValidPosition(x, y)) {
          this.moveEntity(player, x, y);

          player.forEachAttacker((mob) => {
            if (mob instanceof Mob && mob.target) {
              const target = this.getEntityById(mob.target) as Player;
              if (target) {
                const pos = this.findPositionNextTo(mob, target);
                if (mob.distanceToSpawningPoint(pos.x, pos.y) > 50) {
                  mob.clearTarget();
                  mob.forgetEveryone();
                  player.removeAttacker(mob);
                } else {
                  this.moveEntity(mob, pos.x, pos.y);
                }
              }
            }
          });
        }
      };

      player.onMove(moveHandler);
      player.onLootMove(moveHandler);

      player.onZone(() => {
        const hasChangedGroups = this.handleEntityGroupMembership(player);

        if (hasChangedGroups) {
          this.pushToPreviousGroups(player, new Messages.Destroy(player.id));
          this.pushRelevantEntityListTo(player);
        }
      });

      player.onBroadcast((message, ignoreSelf) => {
        if (player.group) {
          this.pushToAdjacentGroups(player.group, message, ignoreSelf ? player.id : undefined);
        }
      });

      player.onBroadcastToZone((message, ignoreSelf) => {
        if (player.group) {
          this.pushToGroup(player.group, message, ignoreSelf ? player.id : undefined);
        }
      });

      player.onExit(() => {
        log.info(`${player.name} has left the game.`);
        this.removePlayer(player);
        this.decrementPlayerCount();
        this.removed_callback?.();
      });

      this.added_callback?.(player);
    });

    this.onEntityAttack((attacker) => {
      const target = this.getEntityById(attacker.target!) as Character;
      if (target && attacker instanceof Mob) {
        const pos = this.findPositionNextTo(attacker, target);
        this.moveEntity(attacker, pos.x, pos.y);
      }
    });

    this.onRegenTick(() => {
      this.forEachCharacter((character) => {
        if (!character.hasFullHealth()) {
          character.regenHealthBy(Math.floor(character.maxHitPoints / 25));

          if (character instanceof Player) {
            this.pushToPlayer(character, character.regen());
          }
        }
      });
    });
  }

  async run(mapFilePath: string) {
    this.map = new Map(mapFilePath);
    await this.map.load();

    this.initZoneGroups();

    for (const a of this.map.mobAreas) {
      const area = new MobArea(a.id, a.nb, a.type, a.x, a.y, a.width, a.height, this);
      area.spawnMobs();
      area.onEmpty(() => this.handleEmptyMobArea(area));
      this.mobAreas.push(area);
    }

    this.map.chestAreas.forEach((a, index) => {
      const area = new ChestArea(`chest-area-${index}`, a.x, a.y, a.w, a.h, a.tx, a.ty, a.i, this);
      this.chestAreas.push(area);
      area.onEmpty(() => this.handleEmptyChestArea(area));
    });

    for (const chest of this.map.staticChests) {
      const c = this.createChest(chest.x, chest.y, chest.i);
      this.addStaticItem(c);
    }

    this.spawnStaticEntities();

    for (const area of this.chestAreas) {
      area.setNumberOfEntities(area.entities.length);
    }

    const regenCount = this.ups * 2;
    let updateCount = 0;
    setInterval(() => {
      this.processGroups();
      this.processQueues();

      if (updateCount < regenCount) {
        updateCount += 1;
      } else {
        this.regen_callback?.();
        updateCount = 0;
      }
    }, 1000 / this.ups);

    log.info(`${this.id} created (capacity: ${this.maxPlayers} players).`);
  }

  onPlayerConnect(callback: (player: Player) => void) {
    this.connect_callback = callback;
  }

  onPlayerEnter(callback: (player: Player) => void) {
    this.enter_callback = callback;
  }

  onEntityAttack(callback: (attacker: Character) => void) {
    this.attack_callback = callback;
  }

  onRegenTick(callback: () => void) {
    this.regen_callback = callback;
  }

  pushRelevantEntityListTo(player: Player) {
    if (player && player.group && player.group in this.groups) {
      const entities = Object.keys(this.groups[player.group].entities)
        .filter((id) => id !== player.id.toString())
        .map((id) => Number.parseInt(id));
      if (entities.length > 0) {
        this.pushToPlayer(player, new Messages.List(entities));
      }
    }
  }

  pushToPlayer(player: Player, message: Messages.Message) {
    if (player && player.id in this.outgoingQueues) {
      this.outgoingQueues[player.id].push(message.serialize());
    } else {
      log.error('pushToPlayer: player was undefined or queue not found');
    }
  }

  pushToGroup(groupId: string, message: Messages.Message, ignoredPlayer?: string | number) {
    const group = this.groups[groupId];
    if (group) {
      for (const playerId of group.players) {
        if (playerId !== ignoredPlayer) {
          const player = this.getEntityById(playerId) as Player;
          if (player) this.pushToPlayer(player, message);
        }
      }
    } else {
      log.error(`groupId: ${groupId} is not a valid group`);
    }
  }

  pushToAdjacentGroups(
    groupId: string,
    message: Messages.Message,
    ignoredPlayer?: string | number,
  ) {
    this.map?.forEachAdjacentGroup(groupId, (id) => {
      this.pushToGroup(id, message, ignoredPlayer);
    });
  }

  pushToPreviousGroups(player: Player, message: Messages.Message) {
    for (const id of player.recentlyLeftGroups) {
      this.pushToGroup(id, message);
    }
    player.recentlyLeftGroups = [];
  }

  pushBroadcast(message: Messages.Message, ignoredPlayer?: string | number) {
    for (const id in this.outgoingQueues) {
      if (id !== ignoredPlayer?.toString()) {
        this.outgoingQueues[id].push(message.serialize());
      }
    }
  }

  processQueues() {
    for (const id in this.outgoingQueues) {
      if (this.outgoingQueues[id].length > 0) {
        const connection = this.server.getConnection(id);
        if (connection) {
          connection.send(this.outgoingQueues[id]);
          this.outgoingQueues[id] = [];
        }
      }
    }
  }

  addEntity(entity: Entity) {
    this.entities[entity.id] = entity;
    this.handleEntityGroupMembership(entity);
  }

  removeEntity(entity: Entity) {
    delete this.entities[entity.id];
    delete this.mobs[entity.id];
    delete this.items[entity.id];

    if (entity instanceof Mob) {
      this.clearMobAggroLink(entity);
      this.clearMobHateLinks(entity);
    }

    entity.destroy();
    this.removeFromGroups(entity);
  }

  addPlayer(player: Player) {
    this.addEntity(player);
    this.players[player.id] = player;
    this.outgoingQueues[player.id] = [];
    this.connect_callback?.(player);
  }

  removePlayer(player: Player) {
    player.broadcast(new Messages.Despawn(player.id));
    this.removeEntity(player);
    delete this.players[player.id];
    delete this.outgoingQueues[player.id];
  }

  addMob(mob: Mob) {
    this.addEntity(mob);
    this.mobs[mob.id] = mob;
  }

  addNpc(kind: EntityKind, x: number, y: number): Npc {
    const npc = new Npc(`8${x}${y}`, kind, x, y);
    this.addEntity(npc);
    this.npcs[npc.id] = npc;
    return npc;
  }

  addItem(item: Item): Item {
    this.addEntity(item);
    this.items[item.id] = item;
    return item;
  }

  createItem(kind: EntityKind, x: number, y: number): Item {
    const id = `9${this.itemCount++}`;
    if (kind === EntityKind.CHEST) {
      return new Chest(id, x, y);
    }
    return new Item(id, kind, x, y);
  }

  createChest(x: number, y: number, items: number[]): Chest {
    const chest = this.createItem(EntityKind.CHEST, x, y) as Chest;
    chest.setItems(items);
    return chest;
  }

  addStaticItem(item: Item): Item {
    item.isStatic = true;
    item.onRespawn(() => this.addStaticItem(item));
    return this.addItem(item);
  }

  addItemFromChest(kind: EntityKind, x: number, y: number): Item {
    const item = this.createItem(kind, x, y);
    item.isFromChest = true;
    return this.addItem(item);
  }

  clearMobAggroLink(mob: Mob) {
    if (mob.target) {
      const player = this.getEntityById(mob.target) as Player;
      if (player) {
        player.removeAttacker(mob);
      }
    }
  }

  clearMobHateLinks(mob: Mob) {
    for (const obj of mob.hatelist) {
      const player = this.getEntityById(obj.id) as Player;
      if (player) {
        player.removeHater(mob);
      }
    }
  }

  forEachEntity(callback: (entity: Entity) => void) {
    for (const id in this.entities) {
      callback(this.entities[id]);
    }
  }

  forEachPlayer(callback: (player: Player) => void) {
    for (const id in this.players) {
      callback(this.players[id]);
    }
  }

  forEachMob(callback: (mob: Mob) => void) {
    for (const id in this.mobs) {
      callback(this.mobs[id]);
    }
  }

  forEachCharacter(callback: (character: Character) => void) {
    this.forEachPlayer(callback);
    this.forEachMob(callback);
  }

  handleMobHate(mobId: number | string, playerId: number | string, hatePoints: number) {
    const mob = this.getEntityById(mobId) as Mob;
    const player = this.getEntityById(playerId) as Player;

    if (player && mob) {
      mob.increaseHateFor(playerId, hatePoints);
      player.addHater(mob);

      if (mob.hitPoints > 0) {
        this.chooseMobTarget(mob);
      }
    }
  }

  chooseMobTarget(mob: Mob, hateRank?: number) {
    const playerId = mob.getHatedPlayerId(hateRank);
    if (!playerId) return;

    const player = this.getEntityById(playerId) as Player;

    if (player && !(mob.id in player.attackers)) {
      this.clearMobAggroLink(mob);
      player.addAttacker(mob);
      mob.setTarget(player);
      this.broadcastAttacker(mob);
    }
  }

  getEntityById(id: string | number): Entity | undefined {
    return this.entities[id];
  }

  broadcastAttacker(character: Character) {
    if (character && character.group) {
      this.pushToAdjacentGroups(
        character.group,
        new Messages.Attack(character.id as number, character.target as number),
        character.id,
      );
    }
    this.attack_callback?.(character);
  }

  handleHurtEntity(entity: Entity, attacker: Character, damage: number) {
    if (entity instanceof Player) {
      this.pushToPlayer(entity, entity.health());
    }

    if (entity instanceof Mob && attacker instanceof Player) {
      this.pushToPlayer(attacker, new Messages.Damage(entity.id as number, damage));
    }

    if ((entity as any).hitPoints <= 0) {
      if (entity instanceof Mob && attacker instanceof Player) {
        const item = this.getDroppedItem(entity);
        this.pushToPlayer(attacker, new Messages.Kill(entity.kind));
        this.pushToAdjacentGroups(entity.group!, new Messages.Despawn(entity.id as number));
        if (item) {
          this.pushToAdjacentGroups(
            entity.group!,
            new Messages.Drop(entity, item.id as number, item.kind),
          );
          this.handleItemDespawn(item);
        }
      }

      if (entity instanceof Player) {
        this.handlePlayerVanish(entity);
        this.pushToAdjacentGroups(entity.group!, entity.despawn());
      }

      this.removeEntity(entity);
    }
  }

  despawn(entity: Entity) {
    if (entity.group) {
      this.pushToAdjacentGroups(entity.group, new Messages.Despawn(entity.id as number));
    }
    this.removeEntity(entity);
  }

  spawnStaticEntities() {
    if (!this.map) return;

    let count = 0;
    for (const [tid, kindName] of Object.entries(this.map.staticEntities)) {
      const kind = getKindFromString(kindName);
      if (kind === undefined) continue;

      const pos = this.map.tileIndexToGridPosition(Number.parseInt(tid));

      if (isNpc(kind)) {
        this.addNpc(kind, pos.x + 1, pos.y);
      }
      if (isMob(kind)) {
        const mob = new Mob(`7${kind}${count++}`, kind, pos.x + 1, pos.y);
        mob.onRespawn(() => {
          mob.isDead = false;
          this.addMob(mob);
          if (mob.area instanceof ChestArea) {
            mob.area.addToArea(mob);
          }
        });
        mob.onMove((m) => this.onMobMoveCallback(m as Mob));
        this.addMob(mob);
        this.tryAddingMobToChestArea(mob);
      }
      if (isItem(kind)) {
        this.addStaticItem(this.createItem(kind, pos.x + 1, pos.y));
      }
    }
  }

  isValidPosition(x: number, y: number): boolean {
    if (!this.map) return false;
    return !this.map.isOutOfBounds(x, y) && !this.map.isColliding(x, y);
  }

  handlePlayerVanish(player: Player) {
    const previousAttackers: Mob[] = [];

    player.forEachAttacker((mob) => {
      if (mob instanceof Mob) {
        previousAttackers.push(mob);
        this.chooseMobTarget(mob, 2);
      }
    });

    for (const mob of previousAttackers) {
      player.removeAttacker(mob);
      mob.clearTarget();
      mob.forgetPlayer(player.id, 1000);
    }

    this.handleEntityGroupMembership(player);
  }

  incrementPlayerCount() {
    this.playerCount++;
  }

  decrementPlayerCount() {
    if (this.playerCount > 0) this.playerCount--;
  }

  getDroppedItem(mob: Mob): Item | null {
    const kindStr = getKindAsString(mob.kind);
    if (!kindStr) return null;

    const properties = (Properties as any)[kindStr];
    if (!properties || !properties.drops) return null;

    const v = randomInt(0, 100);
    let p = 0;
    for (const [itemName, percentage] of Object.entries(properties.drops)) {
      p += percentage as number;
      if (v <= p) {
        const itemKind = getKindFromString(itemName);
        if (itemKind) {
          return this.addItem(this.createItem(itemKind, mob.x, mob.y));
        }
      }
    }
    return null;
  }

  onMobMoveCallback(mob: Mob) {
    if (mob.group) {
      this.pushToAdjacentGroups(mob.group, new Messages.Move(mob));
    }
    this.handleEntityGroupMembership(mob);
  }

  findPositionNextTo(entity: Character, target: Character): { x: number; y: number } {
    let valid = false;
    let pos = { x: 0, y: 0 };

    while (!valid) {
      pos = entity.getPositionNextTo(target);
      valid = this.isValidPosition(pos.x, pos.y);
    }
    return pos;
  }

  initZoneGroups() {
    if (!this.map) return;
    this.map.forEachGroup((id) => {
      this.groups[id] = { entities: {}, players: [], incoming: [] };
    });
    this.zoneGroupsReady = true;
  }

  removeFromGroups(entity: Entity) {
    const oldGroups: string[] = [];
    if (entity && entity.group) {
      const group = this.groups[entity.group];
      if (entity instanceof Player) {
        group.players = group.players.filter((id) => id !== entity.id);
      }

      this.map?.forEachAdjacentGroup(entity.group, (id) => {
        if (this.groups[id]?.entities[entity.id]) {
          delete this.groups[id].entities[entity.id];
          oldGroups.push(id);
        }
      });
      entity.group = null;
    }
    return oldGroups;
  }

  addAsIncomingToGroup(entity: Entity, groupId: string) {
    const isChest = entity instanceof Chest;
    const isItm = entity instanceof Item;
    const isDroppedItem = isItm && !entity.isStatic && !entity.isFromChest;

    if (entity && groupId) {
      this.map?.forEachAdjacentGroup(groupId, (id) => {
        const group = this.groups[id];
        if (group) {
          if (
            !group.entities[entity.id] &&
            (!isItm || isChest || (isItm && !isDroppedItem)) &&
            !group.incoming.includes(entity)
          ) {
            group.incoming.push(entity);
          }
        }
      });
    }
  }

  addToGroup(entity: Entity, groupId: string) {
    const newGroups: string[] = [];
    if (entity && groupId && this.groups[groupId]) {
      this.map?.forEachAdjacentGroup(groupId, (id) => {
        this.groups[id].entities[entity.id] = entity;
        newGroups.push(id);
      });
      entity.group = groupId;

      if (entity instanceof Player) {
        this.groups[groupId].players.push(entity.id);
      }
    }
    return newGroups;
  }

  handleEntityGroupMembership(entity: Entity) {
    let hasChangedGroups = false;
    if (entity && this.map) {
      const groupId = this.map.getGroupIdFromPosition(entity.x, entity.y);
      if (!entity.group || entity.group !== groupId) {
        hasChangedGroups = true;
        this.addAsIncomingToGroup(entity, groupId);
        const oldGroups = this.removeFromGroups(entity);
        const newGroups = this.addToGroup(entity, groupId);

        if (oldGroups.length > 0) {
          entity.recentlyLeftGroups = oldGroups.filter((id) => !newGroups.includes(id));
        }
      }
    }
    return hasChangedGroups;
  }

  processGroups() {
    if (this.zoneGroupsReady) {
      for (const id in this.groups) {
        const group = this.groups[id];
        if (group.incoming.length > 0) {
          for (const entity of group.incoming) {
            if (entity instanceof Player) {
              this.pushToGroup(id, new Messages.Spawn(entity), entity.id);
            } else {
              this.pushToGroup(id, new Messages.Spawn(entity));
            }
          }
          group.incoming = [];
        }
      }
    }
  }

  moveEntity(entity: Entity, x: number, y: number) {
    if (entity) {
      entity.setPosition(x, y);
      this.handleEntityGroupMembership(entity);
    }
  }

  handleItemDespawn(item: Item) {
    if (item) {
      item.handleDespawn({
        beforeBlinkDelay: 10000,
        blinkCallback: () => {
          if (item.group) {
            this.pushToAdjacentGroups(item.group, new Messages.Blink(item.id as number));
          }
        },
        blinkingDuration: 4000,
        despawnCallback: () => {
          if (item.group) {
            this.pushToAdjacentGroups(item.group, new Messages.Destroy(item.id as number));
          }
          this.removeEntity(item);
        },
      });
    }
  }

  handleEmptyMobArea(_area: MobArea) {}

  handleEmptyChestArea(area: ChestArea) {
    if (area) {
      const chest = this.addItem(this.createChest(area.chestX, area.chestY, area.items));
      this.handleItemDespawn(chest);
    }
  }

  handleOpenedChest(chest: Chest, _player: Player) {
    if (chest.group) {
      this.pushToAdjacentGroups(chest.group, new Messages.Despawn(chest.id as number));
    }
    this.removeEntity(chest);

    const kind = chest.getRandomItem();
    if (kind) {
      const item = this.addItemFromChest(kind, chest.x, chest.y);
      this.handleItemDespawn(item);
    }
  }

  tryAddingMobToChestArea(mob: Mob) {
    for (const area of this.chestAreas) {
      if (area.contains(mob)) {
        area.addToArea(mob);
      }
    }
  }

  updatePopulation(totalPlayers?: number) {
    this.pushBroadcast(
      new Messages.Population(this.playerCount, totalPlayers ? totalPlayers : this.playerCount),
    );
  }
}
