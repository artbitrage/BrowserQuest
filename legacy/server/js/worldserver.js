var cls = require('./lib/class'),
  _ = require('underscore'),
  Log = require('log'),
  Entity = require('./entity'),
  Character = require('./character'),
  Mob = require('./mob'),
  Map = require('./map'),
  Npc = require('./npc'),
  Player = require('./player'),
  Item = require('./item'),
  MobArea = require('./mobarea'),
  ChestArea = require('./chestarea'),
  Chest = require('./chest'),
  Messages = require('./message'),
  Properties = require('./properties'),
  Utils = require('./utils'),
  Types = require('../../shared/js/gametypes');

// ======= GAME SERVER ========

module.exports = World = cls.Class.extend({
  init: function (id, maxPlayers, websocketServer) {
    this.id = id;
    this.maxPlayers = maxPlayers;
    this.server = websocketServer;
    this.ups = 50;

    this.map = null;

    this.entities = {};
    this.players = {};
    this.mobs = {};
    this.attackers = {};
    this.items = {};
    this.equipping = {};
    this.hurt = {};
    this.npcs = {};
    this.mobAreas = [];
    this.chestAreas = [];
    this.groups = {};

    this.outgoingQueues = {};

    this.itemCount = 0;
    this.playerCount = 0;

    this.zoneGroupsReady = false;

    this.onPlayerConnect((player) => {
      player.onRequestPosition(() => {
        if (player.lastCheckpoint) {
          return player.lastCheckpoint.getRandomPosition();
        } else {
          return this.map.getRandomStartingPosition();
        }
      });
    });

    this.onPlayerEnter((player) => {
      log.info(player.name + ' has joined ' + this.id);

      if (!player.hasEnteredGame) {
        this.incrementPlayerCount();
      }

      // Number of players in this world
      this.pushToPlayer(player, new Messages.Population(this.playerCount));
      this.pushRelevantEntityListTo(player);

      var move_callback = (x, y) => {
        log.debug(player.name + ' is moving to (' + x + ', ' + y + ').');

        player.forEachAttacker((mob) => {
          var target = this.getEntityById(mob.target);
          if (target) {
            var pos = this.findPositionNextTo(mob, target);
            if (mob.distanceToSpawningPoint(pos.x, pos.y) > 50) {
              mob.clearTarget();
              mob.forgetEveryone();
              player.removeAttacker(mob);
            } else {
              this.moveEntity(mob, pos.x, pos.y);
            }
          }
        });
      };

      player.onMove(move_callback);
      player.onLootMove(move_callback);

      player.onZone(() => {
        var hasChangedGroups = this.handleEntityGroupMembership(player);

        if (hasChangedGroups) {
          this.pushToPreviousGroups(player, new Messages.Destroy(player));
          this.pushRelevantEntityListTo(player);
        }
      });

      player.onBroadcast((message, ignoreSelf) => {
        this.pushToAdjacentGroups(player.group, message, ignoreSelf ? player.id : null);
      });

      player.onBroadcastToZone((message, ignoreSelf) => {
        this.pushToGroup(player.group, message, ignoreSelf ? player.id : null);
      });

      player.onExit(() => {
        log.info(player.name + ' has left the game.');
        this.removePlayer(player);
        this.decrementPlayerCount();

        if (this.removed_callback) {
          this.removed_callback();
        }
      });

      if (this.added_callback) {
        this.added_callback();
      }
    });

    // Called when an entity is attacked by another entity
    this.onEntityAttack((attacker) => {
      var target = this.getEntityById(attacker.target);
      if (target && attacker.type === 'mob') {
        var pos = this.findPositionNextTo(attacker, target);
        this.moveEntity(attacker, pos.x, pos.y);
      }
    });

    this.onRegenTick(() => {
      this.forEachCharacter((character) => {
        if (!character.hasFullHealth()) {
          character.regenHealthBy(Math.floor(character.maxHitPoints / 25));

          if (character.type === 'player') {
            this.pushToPlayer(character, character.regen());
          }
        }
      });
    });
  },

  run: function (mapFilePath) {
    this.map = new Map(mapFilePath);

    this.map.ready(() => {
      this.initZoneGroups();

      this.map.generateCollisionGrid();

      // Populate all mob "roaming" areas
      _.each(this.map.mobAreas, (a) => {
        var area = new MobArea(a.id, a.nb, a.type, a.x, a.y, a.width, a.height, this);
        area.spawnMobs();
        area.onEmpty(this.handleEmptyMobArea.bind(this, area));

        this.mobAreas.push(area);
      });

      // Create all chest areas
      _.each(this.map.chestAreas, (a) => {
        var area = new ChestArea(a.id, a.x, a.y, a.w, a.h, a.tx, a.ty, a.i, this);
        this.chestAreas.push(area);
        area.onEmpty(this.handleEmptyChestArea.bind(this, area));
      });

      // Spawn static chests
      _.each(this.map.staticChests, (chest) => {
        var c = this.createChest(chest.x, chest.y, chest.i);
        this.addStaticItem(c);
      });

      // Spawn static entities
      this.spawnStaticEntities();

      // Set maximum number of entities contained in each chest area
      _.each(this.chestAreas, (area) => {
        area.setNumberOfEntities(area.entities.length);
      });
    });

    var regenCount = this.ups * 2;
    var updateCount = 0;
    setInterval(() => {
      this.processGroups();
      this.processQueues();

      if (updateCount < regenCount) {
        updateCount += 1;
      } else {
        if (this.regen_callback) {
          this.regen_callback();
        }
        updateCount = 0;
      }
    }, 1000 / this.ups);

    log.info('' + this.id + ' created (capacity: ' + this.maxPlayers + ' players).');
  },

  setUpdatesPerSecond: function (ups) {
    this.ups = ups;
  },

  onInit: function (callback) {
    this.init_callback = callback;
  },

  onPlayerConnect: function (callback) {
    this.connect_callback = callback;
  },

  onPlayerEnter: function (callback) {
    this.enter_callback = callback;
  },

  onPlayerAdded: function (callback) {
    this.added_callback = callback;
  },

  onPlayerRemoved: function (callback) {
    this.removed_callback = callback;
  },

  onRegenTick: function (callback) {
    this.regen_callback = callback;
  },

  pushRelevantEntityListTo: function (player) {
    var entities;

    if (player && player.group in this.groups) {
      entities = _.keys(this.groups[player.group].entities);
      entities = _.reject(entities, (id) => id == player.id);
      entities = _.map(entities, (id) => Number.parseInt(id));
      if (entities) {
        this.pushToPlayer(player, new Messages.List(entities));
      }
    }
  },

  pushSpawnsToPlayer: function (player, ids) {
    _.each(ids, (id) => {
      var entity = this.getEntityById(id);
      if (entity) {
        this.pushToPlayer(player, new Messages.Spawn(entity));
      }
    });

    log.debug('Pushed ' + _.size(ids) + ' new spawns to ' + player.id);
  },

  pushToPlayer: function (player, message) {
    if (player && player.id in this.outgoingQueues) {
      this.outgoingQueues[player.id].push(message.serialize());
    } else {
      log.error('pushToPlayer: player was undefined');
    }
  },

  pushToGroup: function (groupId, message, ignoredPlayer) {
    var group = this.groups[groupId];

    if (group) {
      _.each(group.players, (playerId) => {
        if (playerId != ignoredPlayer) {
          this.pushToPlayer(this.getEntityById(playerId), message);
        }
      });
    } else {
      log.error('groupId: ' + groupId + ' is not a valid group');
    }
  },

  pushToAdjacentGroups: function (groupId, message, ignoredPlayer) {
    this.map.forEachAdjacentGroup(groupId, (id) => {
      this.pushToGroup(id, message, ignoredPlayer);
    });
  },

  pushToPreviousGroups: function (player, message) {
    // Push this message to all groups which are not going to be updated anymore,
    // since the player left them.
    _.each(player.recentlyLeftGroups, (id) => {
      this.pushToGroup(id, message);
    });
    player.recentlyLeftGroups = [];
  },

  pushBroadcast: function (message, ignoredPlayer) {
    for (var id in this.outgoingQueues) {
      if (id != ignoredPlayer) {
        this.outgoingQueues[id].push(message.serialize());
      }
    }
  },

  processQueues: function () {
    var connection;

    for (var id in this.outgoingQueues) {
      if (this.outgoingQueues[id].length > 0) {
        connection = this.server.getConnection(id);
        connection.send(this.outgoingQueues[id]);
        this.outgoingQueues[id] = [];
      }
    }
  },

  addEntity: function (entity) {
    this.entities[entity.id] = entity;
    this.handleEntityGroupMembership(entity);
  },

  removeEntity: function (entity) {
    if (entity.id in this.entities) {
      delete this.entities[entity.id];
    }
    if (entity.id in this.mobs) {
      delete this.mobs[entity.id];
    }
    if (entity.id in this.items) {
      delete this.items[entity.id];
    }

    if (entity.type === 'mob') {
      this.clearMobAggroLink(entity);
      this.clearMobHateLinks(entity);
    }

    entity.destroy();
    this.removeFromGroups(entity);
    log.debug('Removed ' + Types.getKindAsString(entity.kind) + ' : ' + entity.id);
  },

  addPlayer: function (player) {
    this.addEntity(player);
    this.players[player.id] = player;
    this.outgoingQueues[player.id] = [];

    //log.info("Added player : " + player.id);
  },

  removePlayer: function (player) {
    player.broadcast(player.despawn());
    this.removeEntity(player);
    delete this.players[player.id];
    delete this.outgoingQueues[player.id];
  },

  addMob: function (mob) {
    this.addEntity(mob);
    this.mobs[mob.id] = mob;
  },

  addNpc: function (kind, x, y) {
    var npc = new Npc('8' + x + '' + y, kind, x, y);
    this.addEntity(npc);
    this.npcs[npc.id] = npc;

    return npc;
  },

  addItem: function (item) {
    this.addEntity(item);
    this.items[item.id] = item;

    return item;
  },

  createItem: function (kind, x, y) {
    var id = '9' + this.itemCount++,
      item = null;

    if (kind === Types.Entities.CHEST) {
      item = new Chest(id, x, y);
    } else {
      item = new Item(id, kind, x, y);
    }
    return item;
  },

  createChest: function (x, y, items) {
    var chest = this.createItem(Types.Entities.CHEST, x, y);
    chest.setItems(items);
    return chest;
  },

  addStaticItem: function (item) {
    item.isStatic = true;
    item.onRespawn(this.addStaticItem.bind(this, item));

    return this.addItem(item);
  },

  addItemFromChest: function (kind, x, y) {
    var item = this.createItem(kind, x, y);
    item.isFromChest = true;

    return this.addItem(item);
  },

  /**
   * The mob will no longer be registered as an attacker of its current target.
   */
  clearMobAggroLink: function (mob) {
    var player = null;
    if (mob.target) {
      player = this.getEntityById(mob.target);
      if (player) {
        player.removeAttacker(mob);
      }
    }
  },

  clearMobHateLinks: function (mob) {
    if (mob) {
      _.each(mob.hatelist, (obj) => {
        var player = this.getEntityById(obj.id);
        if (player) {
          player.removeHater(mob);
        }
      });
    }
  },

  forEachEntity: function (callback) {
    for (var id in this.entities) {
      callback(this.entities[id]);
    }
  },

  forEachPlayer: function (callback) {
    for (var id in this.players) {
      callback(this.players[id]);
    }
  },

  forEachMob: function (callback) {
    for (var id in this.mobs) {
      callback(this.mobs[id]);
    }
  },

  forEachCharacter: function (callback) {
    this.forEachPlayer(callback);
    this.forEachMob(callback);
  },

  handleMobHate: function (mobId, playerId, hatePoints) {
    var mob = this.getEntityById(mobId),
      player = this.getEntityById(playerId),
      mostHated;

    if (player && mob) {
      mob.increaseHateFor(playerId, hatePoints);
      player.addHater(mob);

      if (mob.hitPoints > 0) {
        // only choose a target if still alive
        this.chooseMobTarget(mob);
      }
    }
  },

  chooseMobTarget: function (mob, hateRank) {
    var player = this.getEntityById(mob.getHatedPlayerId(hateRank));

    // If the mob is not already attacking the player, create an attack link between them.
    if (player && !(mob.id in player.attackers)) {
      this.clearMobAggroLink(mob);

      player.addAttacker(mob);
      mob.setTarget(player);

      this.broadcastAttacker(mob);
      log.debug(mob.id + ' is now attacking ' + player.id);
    }
  },

  onEntityAttack: function (callback) {
    this.attack_callback = callback;
  },

  getEntityById: function (id) {
    if (id in this.entities) {
      return this.entities[id];
    } else {
      log.error('Unknown entity : ' + id);
    }
  },

  getPlayerCount: function () {
    var count = 0;
    for (var p in this.players) {
      if (this.players.hasOwnProperty(p)) {
        count += 1;
      }
    }
    return count;
  },

  broadcastAttacker: function (character) {
    if (character) {
      this.pushToAdjacentGroups(character.group, character.attack(), character.id);
    }
    if (this.attack_callback) {
      this.attack_callback(character);
    }
  },

  handleHurtEntity: function (entity, attacker, damage) {
    if (entity.type === 'player') {
      // A player is only aware of his own hitpoints
      this.pushToPlayer(entity, entity.health());
    }

    if (entity.type === 'mob') {
      // Let the mob's attacker (player) know how much damage was inflicted
      this.pushToPlayer(attacker, new Messages.Damage(entity, damage));
    }

    // If the entity is about to die
    if (entity.hitPoints <= 0) {
      if (entity.type === 'mob') {
        var mob = entity,
          item = this.getDroppedItem(mob);

        this.pushToPlayer(attacker, new Messages.Kill(mob));
        this.pushToAdjacentGroups(mob.group, mob.despawn()); // Despawn must be enqueued before the item drop
        if (item) {
          this.pushToAdjacentGroups(mob.group, mob.drop(item));
          this.handleItemDespawn(item);
        }
      }

      if (entity.type === 'player') {
        this.handlePlayerVanish(entity);
        this.pushToAdjacentGroups(entity.group, entity.despawn());
      }

      this.removeEntity(entity);
    }
  },

  despawn: function (entity) {
    this.pushToAdjacentGroups(entity.group, entity.despawn());

    if (entity.id in this.entities) {
      this.removeEntity(entity);
    }
  },

  spawnStaticEntities: function () {
    var count = 0;

    _.each(this.map.staticEntities, (kindName, tid) => {
      var kind = Types.getKindFromString(kindName),
        pos = this.map.tileIndexToGridPosition(tid);

      if (Types.isNpc(kind)) {
        this.addNpc(kind, pos.x + 1, pos.y);
      }
      if (Types.isMob(kind)) {
        var mob = new Mob('7' + kind + count++, kind, pos.x + 1, pos.y);
        mob.onRespawn(() => {
          mob.isDead = false;
          this.addMob(mob);
          if (mob.area && mob.area instanceof ChestArea) {
            mob.area.addToArea(mob);
          }
        });
        mob.onMove(this.onMobMoveCallback.bind(this));
        this.addMob(mob);
        this.tryAddingMobToChestArea(mob);
      }
      if (Types.isItem(kind)) {
        this.addStaticItem(this.createItem(kind, pos.x + 1, pos.y));
      }
    });
  },

  isValidPosition: function (x, y) {
    if (
      this.map &&
      _.isNumber(x) &&
      _.isNumber(y) &&
      !this.map.isOutOfBounds(x, y) &&
      !this.map.isColliding(x, y)
    ) {
      return true;
    }
    return false;
  },

  handlePlayerVanish: function (player) {
    var previousAttackers = [];

    // When a player dies or teleports, all of his attackers go and attack their second most hated player.
    player.forEachAttacker((mob) => {
      previousAttackers.push(mob);
      this.chooseMobTarget(mob, 2);
    });

    _.each(previousAttackers, (mob) => {
      player.removeAttacker(mob);
      mob.clearTarget();
      mob.forgetPlayer(player.id, 1000);
    });

    this.handleEntityGroupMembership(player);
  },

  setPlayerCount: function (count) {
    this.playerCount = count;
  },

  incrementPlayerCount: function () {
    this.setPlayerCount(this.playerCount + 1);
  },

  decrementPlayerCount: function () {
    if (this.playerCount > 0) {
      this.setPlayerCount(this.playerCount - 1);
    }
  },

  getDroppedItem: function (mob) {
    var kind = Types.getKindAsString(mob.kind),
      drops = Properties[kind].drops,
      v = Utils.random(100),
      p = 0,
      item = null;

    for (var itemName in drops) {
      var percentage = drops[itemName];

      p += percentage;
      if (v <= p) {
        item = this.addItem(this.createItem(Types.getKindFromString(itemName), mob.x, mob.y));
        break;
      }
    }

    return item;
  },

  onMobMoveCallback: function (mob) {
    this.pushToAdjacentGroups(mob.group, new Messages.Move(mob));
    this.handleEntityGroupMembership(mob);
  },

  findPositionNextTo: function (entity, target) {
    var valid = false,
      pos;

    while (!valid) {
      pos = entity.getPositionNextTo(target);
      valid = this.isValidPosition(pos.x, pos.y);
    }
    return pos;
  },

  initZoneGroups: function () {
    this.map.forEachGroup((id) => {
      this.groups[id] = { entities: {}, players: [], incoming: [] };
    });
    this.zoneGroupsReady = true;
  },

  removeFromGroups: function (entity) {
    var oldGroups = [];

    if (entity && entity.group) {
      var group = this.groups[entity.group];
      if (entity instanceof Player) {
        group.players = _.reject(group.players, (id) => id === entity.id);
      }

      this.map.forEachAdjacentGroup(entity.group, (id) => {
        if (entity.id in this.groups[id].entities) {
          delete this.groups[id].entities[entity.id];
          oldGroups.push(id);
        }
      });
      entity.group = null;
    }
    return oldGroups;
  },

  /**
   * Registers an entity as "incoming" into several groups, meaning that it just entered them.
   * All players inside these groups will receive a Spawn message when WorldServer.processGroups is called.
   */
  addAsIncomingToGroup: function (entity, groupId) {
    var isChest = entity && entity instanceof Chest,
      isItem = entity && entity instanceof Item,
      isDroppedItem = entity && isItem && !entity.isStatic && !entity.isFromChest;

    if (entity && groupId) {
      this.map.forEachAdjacentGroup(groupId, (id) => {
        var group = this.groups[id];

        if (group) {
          if (
            !_.include(group.entities, entity.id) &&
            //  Items dropped off of mobs are handled differently via DROP messages. See handleHurtEntity.
            (!isItem || isChest || (isItem && !isDroppedItem))
          ) {
            group.incoming.push(entity);
          }
        }
      });
    }
  },

  addToGroup: function (entity, groupId) {
    var newGroups = [];

    if (entity && groupId && groupId in this.groups) {
      this.map.forEachAdjacentGroup(groupId, (id) => {
        this.groups[id].entities[entity.id] = entity;
        newGroups.push(id);
      });
      entity.group = groupId;

      if (entity instanceof Player) {
        this.groups[groupId].players.push(entity.id);
      }
    }
    return newGroups;
  },

  logGroupPlayers: function (groupId) {
    log.debug('Players inside group ' + groupId + ':');
    _.each(this.groups[groupId].players, (id) => {
      log.debug('- player ' + id);
    });
  },

  handleEntityGroupMembership: function (entity) {
    var hasChangedGroups = false;
    if (entity) {
      var groupId = this.map.getGroupIdFromPosition(entity.x, entity.y);
      if (!entity.group || (entity.group && entity.group !== groupId)) {
        hasChangedGroups = true;
        this.addAsIncomingToGroup(entity, groupId);
        var oldGroups = this.removeFromGroups(entity);
        var newGroups = this.addToGroup(entity, groupId);

        if (_.size(oldGroups) > 0) {
          entity.recentlyLeftGroups = _.difference(oldGroups, newGroups);
          log.debug('group diff: ' + entity.recentlyLeftGroups);
        }
      }
    }
    return hasChangedGroups;
  },

  processGroups: function () {
    if (this.zoneGroupsReady) {
      this.map.forEachGroup((id) => {
        var spawns = [];
        if (this.groups[id].incoming.length > 0) {
          spawns = _.each(this.groups[id].incoming, (entity) => {
            if (entity instanceof Player) {
              this.pushToGroup(id, new Messages.Spawn(entity), entity.id);
            } else {
              this.pushToGroup(id, new Messages.Spawn(entity));
            }
          });
          this.groups[id].incoming = [];
        }
      });
    }
  },

  moveEntity: function (entity, x, y) {
    if (entity) {
      entity.setPosition(x, y);
      this.handleEntityGroupMembership(entity);
    }
  },

  handleItemDespawn: function (item) {
    if (item) {
      item.handleDespawn({
        beforeBlinkDelay: 10000,
        blinkCallback: () => {
          this.pushToAdjacentGroups(item.group, new Messages.Blink(item));
        },
        blinkingDuration: 4000,
        despawnCallback: () => {
          this.pushToAdjacentGroups(item.group, new Messages.Destroy(item));
          this.removeEntity(item);
        },
      });
    }
  },

  handleEmptyMobArea: (area) => {},

  handleEmptyChestArea: function (area) {
    if (area) {
      var chest = this.addItem(this.createChest(area.chestX, area.chestY, area.items));
      this.handleItemDespawn(chest);
    }
  },

  handleOpenedChest: function (chest, player) {
    this.pushToAdjacentGroups(chest.group, chest.despawn());
    this.removeEntity(chest);

    var kind = chest.getRandomItem();
    if (kind) {
      var item = this.addItemFromChest(kind, chest.x, chest.y);
      this.handleItemDespawn(item);
    }
  },

  tryAddingMobToChestArea: function (mob) {
    _.each(this.chestAreas, (area) => {
      if (area.contains(mob)) {
        area.addToArea(mob);
      }
    });
  },

  updatePopulation: function (totalPlayers) {
    this.pushBroadcast(
      new Messages.Population(this.playerCount, totalPlayers ? totalPlayers : this.playerCount),
    );
  },
});
