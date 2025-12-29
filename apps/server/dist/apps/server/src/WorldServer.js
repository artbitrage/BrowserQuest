import { EntityKind, getKindAsString, getKindFromString, isItem, isMob, isNpc, randomInt, } from '@bq/shared';
import { Properties } from '@bq/shared';
import pino from 'pino';
import { Chest } from './Chest.js';
import { ChestArea } from './ChestArea.js';
import { Item } from './Item.js';
import { Map } from './Map.js';
import * as Messages from './Messages.js';
import { MobArea } from './MobArea.js';
import { Mob } from './entities/Mob.js';
import { Npc } from './entities/Npc.js';
import { Player } from './player.js';
const log = pino();
export class WorldServer {
    id;
    maxPlayers;
    server; // WebSocketServer
    ups = 50;
    map = null;
    entities = {};
    players = {};
    mobs = {};
    npcs = {};
    items = {};
    mobAreas = [];
    chestAreas = [];
    groups = {};
    outgoingQueues = {};
    itemCount = 0;
    playerCount = 0;
    zoneGroupsReady = false;
    connect_callback;
    enter_callback;
    added_callback;
    removed_callback;
    regen_callback;
    attack_callback;
    constructor(id, maxPlayers, websocketServer) {
        this.id = id;
        this.maxPlayers = maxPlayers;
        this.server = websocketServer;
        this.onPlayerConnect((player) => {
            player.onRequestPosition(() => {
                if (player.lastCheckpoint) {
                    return player.lastCheckpoint.getRandomPosition();
                }
                return this.map?.getRandomStartingPosition();
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
            this.pushToPlayer(player, new Messages.Welcome(player.id, player.name, player.x, player.y, player.kind));
            this.pushToPlayer(player, new Messages.Population(this.playerCount, this.playerCount));
            this.pushRelevantEntityListTo(player);
            const moveHandler = (x, y) => {
                log.debug(`${player.name} is moving to (${x}, ${y}).`);
                if (this.isValidPosition(x, y)) {
                    this.moveEntity(player, x, y);
                    player.forEachAttacker((mob) => {
                        if (mob instanceof Mob && mob.target) {
                            const target = this.getEntityById(mob.target);
                            if (target) {
                                const pos = this.findPositionNextTo(mob, target);
                                if (mob.distanceToSpawningPoint(pos.x, pos.y) > 50) {
                                    mob.clearTarget();
                                    mob.forgetEveryone();
                                    player.removeAttacker(mob);
                                }
                                else {
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
            const target = this.getEntityById(attacker.target);
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
    async run(mapFilePath) {
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
            }
            else {
                this.regen_callback?.();
                updateCount = 0;
            }
        }, 1000 / this.ups);
        log.info(`${this.id} created (capacity: ${this.maxPlayers} players).`);
    }
    onPlayerConnect(callback) {
        this.connect_callback = callback;
    }
    onPlayerEnter(callback) {
        this.enter_callback = callback;
    }
    onEntityAttack(callback) {
        this.attack_callback = callback;
    }
    onRegenTick(callback) {
        this.regen_callback = callback;
    }
    pushRelevantEntityListTo(player) {
        if (player?.group && player.group in this.groups) {
            const entities = Object.keys(this.groups[player.group].entities)
                .filter((id) => id !== player.id.toString())
                .map((id) => Number.parseInt(id));
            if (entities.length > 0) {
                this.pushToPlayer(player, new Messages.List(entities));
            }
        }
    }
    pushToPlayer(player, message) {
        if (player && player.id in this.outgoingQueues) {
            this.outgoingQueues[player.id].push(message.serialize());
        }
        else {
            log.error('pushToPlayer: player was undefined or queue not found');
        }
    }
    pushToGroup(groupId, message, ignoredPlayer) {
        const group = this.groups[groupId];
        if (group) {
            for (const playerId of group.players) {
                if (playerId !== ignoredPlayer) {
                    const player = this.getEntityById(playerId);
                    if (player)
                        this.pushToPlayer(player, message);
                }
            }
        }
        else {
            log.error(`groupId: ${groupId} is not a valid group`);
        }
    }
    pushToAdjacentGroups(groupId, message, ignoredPlayer) {
        this.map?.forEachAdjacentGroup(groupId, (id) => {
            this.pushToGroup(id, message, ignoredPlayer);
        });
    }
    pushToPreviousGroups(player, message) {
        for (const id of player.recentlyLeftGroups) {
            this.pushToGroup(id, message);
        }
        player.recentlyLeftGroups = [];
    }
    pushBroadcast(message, ignoredPlayer) {
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
    addEntity(entity) {
        this.entities[entity.id] = entity;
        this.handleEntityGroupMembership(entity);
    }
    removeEntity(entity) {
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
    addPlayer(player) {
        this.addEntity(player);
        this.players[player.id] = player;
        this.outgoingQueues[player.id] = [];
        this.connect_callback?.(player);
    }
    removePlayer(player) {
        player.broadcast(new Messages.Despawn(player.id));
        this.removeEntity(player);
        delete this.players[player.id];
        delete this.outgoingQueues[player.id];
    }
    addMob(mob) {
        this.addEntity(mob);
        this.mobs[mob.id] = mob;
    }
    addNpc(kind, x, y) {
        const npc = new Npc(`8${x}${y}`, kind, x, y);
        this.addEntity(npc);
        this.npcs[npc.id] = npc;
        return npc;
    }
    addItem(item) {
        this.addEntity(item);
        this.items[item.id] = item;
        return item;
    }
    createItem(kind, x, y) {
        const id = `9${this.itemCount++}`;
        if (kind === EntityKind.CHEST) {
            return new Chest(id, x, y);
        }
        return new Item(id, kind, x, y);
    }
    createChest(x, y, items) {
        const chest = this.createItem(EntityKind.CHEST, x, y);
        chest.setItems(items);
        return chest;
    }
    addStaticItem(item) {
        item.isStatic = true;
        item.onRespawn(() => this.addStaticItem(item));
        return this.addItem(item);
    }
    addItemFromChest(kind, x, y) {
        const item = this.createItem(kind, x, y);
        item.isFromChest = true;
        return this.addItem(item);
    }
    clearMobAggroLink(mob) {
        if (mob.target) {
            const player = this.getEntityById(mob.target);
            if (player) {
                player.removeAttacker(mob);
            }
        }
    }
    clearMobHateLinks(mob) {
        for (const obj of mob.hatelist) {
            const player = this.getEntityById(obj.id);
            if (player) {
                player.removeHater(mob);
            }
        }
    }
    forEachEntity(callback) {
        for (const id in this.entities) {
            callback(this.entities[id]);
        }
    }
    forEachPlayer(callback) {
        for (const id in this.players) {
            callback(this.players[id]);
        }
    }
    forEachMob(callback) {
        for (const id in this.mobs) {
            callback(this.mobs[id]);
        }
    }
    forEachCharacter(callback) {
        this.forEachPlayer(callback);
        this.forEachMob(callback);
    }
    handleMobHate(mobId, playerId, hatePoints) {
        const mob = this.getEntityById(mobId);
        const player = this.getEntityById(playerId);
        if (player && mob) {
            mob.increaseHateFor(playerId, hatePoints);
            player.addHater(mob);
            if (mob.hitPoints > 0) {
                this.chooseMobTarget(mob);
            }
        }
    }
    chooseMobTarget(mob, hateRank) {
        const playerId = mob.getHatedPlayerId(hateRank);
        if (!playerId)
            return;
        const player = this.getEntityById(playerId);
        if (player && !(mob.id in player.attackers)) {
            this.clearMobAggroLink(mob);
            player.addAttacker(mob);
            mob.setTarget(player);
            this.broadcastAttacker(mob);
        }
    }
    getEntityById(id) {
        return this.entities[id];
    }
    broadcastAttacker(character) {
        if (character?.group) {
            this.pushToAdjacentGroups(character.group, new Messages.Attack(character.id, character.target), character.id);
        }
        this.attack_callback?.(character);
    }
    handleHurtEntity(entity, attacker, damage) {
        if (entity instanceof Player) {
            this.pushToPlayer(entity, entity.health());
        }
        if (entity instanceof Mob && attacker instanceof Player) {
            this.pushToPlayer(attacker, new Messages.Damage(entity.id, damage));
        }
        if (entity.hitPoints <= 0) {
            if (entity instanceof Mob && attacker instanceof Player) {
                const item = this.getDroppedItem(entity);
                this.pushToPlayer(attacker, new Messages.Kill(entity.kind));
                this.pushToAdjacentGroups(entity.group, new Messages.Despawn(entity.id));
                if (item) {
                    this.pushToAdjacentGroups(entity.group, new Messages.Drop(entity, item.id, item.kind));
                    this.handleItemDespawn(item);
                }
            }
            if (entity instanceof Player) {
                this.handlePlayerVanish(entity);
                this.pushToAdjacentGroups(entity.group, entity.despawn());
            }
            this.removeEntity(entity);
        }
    }
    despawn(entity) {
        if (entity.group) {
            this.pushToAdjacentGroups(entity.group, new Messages.Despawn(entity.id));
        }
        this.removeEntity(entity);
    }
    spawnStaticEntities() {
        if (!this.map)
            return;
        let count = 0;
        for (const [tid, kindName] of Object.entries(this.map.staticEntities)) {
            const kind = getKindFromString(kindName);
            if (kind === undefined)
                continue;
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
                mob.onMove((m) => this.onMobMoveCallback(m));
                this.addMob(mob);
                this.tryAddingMobToChestArea(mob);
            }
            if (isItem(kind)) {
                this.addStaticItem(this.createItem(kind, pos.x + 1, pos.y));
            }
        }
    }
    isValidPosition(x, y) {
        if (!this.map)
            return false;
        return !this.map.isOutOfBounds(x, y) && !this.map.isColliding(x, y);
    }
    handlePlayerVanish(player) {
        const previousAttackers = [];
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
        if (this.playerCount > 0)
            this.playerCount--;
    }
    getDroppedItem(mob) {
        const kindStr = getKindAsString(mob.kind);
        if (!kindStr)
            return null;
        const properties = Properties[kindStr];
        if (!properties || !properties.drops)
            return null;
        const v = randomInt(0, 100);
        let p = 0;
        for (const [itemName, percentage] of Object.entries(properties.drops)) {
            p += percentage;
            if (v <= p) {
                const itemKind = getKindFromString(itemName);
                if (itemKind) {
                    return this.addItem(this.createItem(itemKind, mob.x, mob.y));
                }
            }
        }
        return null;
    }
    onMobMoveCallback(mob) {
        if (mob.group) {
            this.pushToAdjacentGroups(mob.group, new Messages.Move(mob));
        }
        this.handleEntityGroupMembership(mob);
    }
    findPositionNextTo(entity, target) {
        let valid = false;
        let pos = { x: 0, y: 0 };
        while (!valid) {
            pos = entity.getPositionNextTo(target);
            valid = this.isValidPosition(pos.x, pos.y);
        }
        return pos;
    }
    initZoneGroups() {
        if (!this.map)
            return;
        this.map.forEachGroup((id) => {
            this.groups[id] = { entities: {}, players: [], incoming: [] };
        });
        this.zoneGroupsReady = true;
    }
    removeFromGroups(entity) {
        const oldGroups = [];
        if (entity?.group) {
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
    addAsIncomingToGroup(entity, groupId) {
        const isChest = entity instanceof Chest;
        const isItm = entity instanceof Item;
        const isDroppedItem = isItm && !entity.isStatic && !entity.isFromChest;
        if (entity && groupId) {
            this.map?.forEachAdjacentGroup(groupId, (id) => {
                const group = this.groups[id];
                if (group) {
                    if (!group.entities[entity.id] &&
                        (!isItm || isChest || (isItm && !isDroppedItem)) &&
                        !group.incoming.includes(entity)) {
                        group.incoming.push(entity);
                    }
                }
            });
        }
    }
    addToGroup(entity, groupId) {
        const newGroups = [];
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
    handleEntityGroupMembership(entity) {
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
                        }
                        else {
                            this.pushToGroup(id, new Messages.Spawn(entity));
                        }
                    }
                    group.incoming = [];
                }
            }
        }
    }
    moveEntity(entity, x, y) {
        if (entity) {
            entity.setPosition(x, y);
            this.handleEntityGroupMembership(entity);
        }
    }
    handleItemDespawn(item) {
        if (item) {
            item.handleDespawn({
                beforeBlinkDelay: 10000,
                blinkCallback: () => {
                    if (item.group) {
                        this.pushToAdjacentGroups(item.group, new Messages.Blink(item.id));
                    }
                },
                blinkingDuration: 4000,
                despawnCallback: () => {
                    if (item.group) {
                        this.pushToAdjacentGroups(item.group, new Messages.Destroy(item.id));
                    }
                    this.removeEntity(item);
                },
            });
        }
    }
    handleEmptyMobArea(_area) { }
    handleEmptyChestArea(area) {
        if (area) {
            const chest = this.addItem(this.createChest(area.chestX, area.chestY, area.items));
            this.handleItemDespawn(chest);
        }
    }
    handleOpenedChest(chest, _player) {
        if (chest.group) {
            this.pushToAdjacentGroups(chest.group, new Messages.Despawn(chest.id));
        }
        this.removeEntity(chest);
        const kind = chest.getRandomItem();
        if (kind) {
            const item = this.addItemFromChest(kind, chest.x, chest.y);
            this.handleItemDespawn(item);
        }
    }
    tryAddingMobToChestArea(mob) {
        for (const area of this.chestAreas) {
            if (area.contains(mob)) {
                area.addToArea(mob);
            }
        }
    }
    updatePopulation(totalPlayers) {
        this.pushBroadcast(new Messages.Population(this.playerCount, totalPlayers ? totalPlayers : this.playerCount));
    }
}
