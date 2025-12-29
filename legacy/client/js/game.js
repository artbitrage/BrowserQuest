define([
  'infomanager',
  'bubble',
  'renderer',
  'map',
  'animation',
  'sprite',
  'tile',
  'warrior',
  'gameclient',
  'audio',
  'updater',
  'transition',
  'pathfinder',
  'item',
  'mob',
  'npc',
  'player',
  'character',
  'chest',
  'mobs',
  'exceptions',
  'config',
  '../../shared/js/gametypes',
], (
  InfoManager,
  BubbleManager,
  Renderer,
  Map,
  Animation,
  Sprite,
  AnimatedTile,
  Warrior,
  GameClient,
  AudioManager,
  Updater,
  Transition,
  Pathfinder,
  Item,
  Mob,
  Npc,
  Player,
  Character,
  Chest,
  Mobs,
  Exceptions,
  config,
) => {
  var Game = Class.extend({
    init: function (app) {
      this.app = app;
      this.app.config = config;
      this.ready = false;
      this.started = false;
      this.hasNeverStarted = true;

      this.renderer = null;
      this.updater = null;
      this.pathfinder = null;
      this.chatinput = null;
      this.bubbleManager = null;
      this.audioManager = null;

      // Player
      this.player = new Warrior('player', '');

      // Game state
      this.entities = {};
      this.deathpositions = {};
      this.entityGrid = null;
      this.pathingGrid = null;
      this.renderingGrid = null;
      this.itemGrid = null;
      this.currentCursor = null;
      this.mouse = { x: 0, y: 0 };
      this.zoningQueue = [];
      this.previousClickPosition = {};

      this.selectedX = 0;
      this.selectedY = 0;
      this.selectedCellVisible = false;
      this.targetColor = 'rgba(255, 255, 255, 0.5)';
      this.targetCellVisible = true;
      this.hoveringTarget = false;
      this.hoveringMob = false;
      this.hoveringItem = false;
      this.hoveringCollidingTile = false;

      // combat
      this.infoManager = new InfoManager(this);

      // zoning
      this.currentZoning = null;

      this.cursors = {};

      this.sprites = {};

      // tile animation
      this.animatedTiles = null;

      // debug
      this.debugPathing = false;

      // sprites
      this.spriteNames = [
        'hand',
        'sword',
        'loot',
        'target',
        'talk',
        'sparks',
        'shadow16',
        'rat',
        'skeleton',
        'skeleton2',
        'spectre',
        'boss',
        'deathknight',
        'ogre',
        'crab',
        'snake',
        'eye',
        'bat',
        'goblin',
        'wizard',
        'guard',
        'king',
        'villagegirl',
        'villager',
        'coder',
        'agent',
        'rick',
        'scientist',
        'nyan',
        'priest',
        'sorcerer',
        'octocat',
        'beachnpc',
        'forestnpc',
        'desertnpc',
        'lavanpc',
        'clotharmor',
        'leatherarmor',
        'mailarmor',
        'platearmor',
        'redarmor',
        'goldenarmor',
        'firefox',
        'death',
        'sword1',
        'axe',
        'chest',
        'sword2',
        'redsword',
        'bluesword',
        'goldensword',
        'item-sword2',
        'item-axe',
        'item-redsword',
        'item-bluesword',
        'item-goldensword',
        'item-leatherarmor',
        'item-mailarmor',
        'item-platearmor',
        'item-redarmor',
        'item-goldenarmor',
        'item-flask',
        'item-cake',
        'item-burger',
        'morningstar',
        'item-morningstar',
        'item-firepotion',
      ];
    },

    setup: function ($bubbleContainer, canvas, background, foreground, input) {
      this.setBubbleManager(new BubbleManager($bubbleContainer));
      this.setRenderer(new Renderer(this, canvas, background, foreground));
      this.setChatInput(input);
    },

    setStorage: function (storage) {
      this.storage = storage;
    },

    setRenderer: function (renderer) {
      this.renderer = renderer;
    },

    setUpdater: function (updater) {
      this.updater = updater;
    },

    setPathfinder: function (pathfinder) {
      this.pathfinder = pathfinder;
    },

    setChatInput: function (element) {
      this.chatinput = element;
    },

    setBubbleManager: function (bubbleManager) {
      this.bubbleManager = bubbleManager;
    },

    loadMap: function () {
      this.map = new Map(!this.renderer.upscaledRendering, this);

      this.map.ready(() => {
        log.info('Map loaded.');
        var tilesetIndex = this.renderer.upscaledRendering ? 0 : this.renderer.scale - 1;
        this.renderer.setTileset(this.map.tilesets[tilesetIndex]);
      });
    },

    initPlayer: function () {
      if (this.storage.hasAlreadyPlayed()) {
        this.player.setSpriteName(this.storage.data.player.armor);
        this.player.setWeaponName(this.storage.data.player.weapon);
      }

      this.player.setSprite(this.sprites[this.player.getSpriteName()]);
      this.player.idle();

      log.debug('Finished initPlayer');
    },

    initShadows: function () {
      this.shadows = {};
      this.shadows['small'] = this.sprites['shadow16'];
    },

    initCursors: function () {
      this.cursors['hand'] = this.sprites['hand'];
      this.cursors['sword'] = this.sprites['sword'];
      this.cursors['loot'] = this.sprites['loot'];
      this.cursors['target'] = this.sprites['target'];
      this.cursors['arrow'] = this.sprites['arrow'];
      this.cursors['talk'] = this.sprites['talk'];
    },

    initAnimations: function () {
      this.targetAnimation = new Animation('idle_down', 4, 0, 16, 16);
      this.targetAnimation.setSpeed(50);

      this.sparksAnimation = new Animation('idle_down', 6, 0, 16, 16);
      this.sparksAnimation.setSpeed(120);
    },

    initHurtSprites: function () {
      Types.forEachArmorKind((kind, kindName) => {
        this.sprites[kindName].createHurtSprite();
      });
    },

    initSilhouettes: function () {
      Types.forEachMobOrNpcKind((kind, kindName) => {
        this.sprites[kindName].createSilhouette();
      });
      this.sprites['chest'].createSilhouette();
      this.sprites['item-cake'].createSilhouette();
    },

    initAchievements: function () {
      this.achievements = {
        A_TRUE_WARRIOR: {
          id: 1,
          name: 'A True Warrior',
          desc: 'Find a new weapon',
        },
        INTO_THE_WILD: {
          id: 2,
          name: 'Into the Wild',
          desc: 'Venture outside the village',
        },
        ANGRY_RATS: {
          id: 3,
          name: 'Angry Rats',
          desc: 'Kill 10 rats',
          isCompleted: () => this.storage.getRatCount() >= 10,
        },
        SMALL_TALK: {
          id: 4,
          name: 'Small Talk',
          desc: 'Talk to a non-player character',
        },
        FAT_LOOT: {
          id: 5,
          name: 'Fat Loot',
          desc: 'Get a new armor set',
        },
        UNDERGROUND: {
          id: 6,
          name: 'Underground',
          desc: 'Explore at least one cave',
        },
        AT_WORLDS_END: {
          id: 7,
          name: "At World's End",
          desc: 'Reach the south shore',
        },
        COWARD: {
          id: 8,
          name: 'Coward',
          desc: 'Successfully escape an enemy',
        },
        TOMB_RAIDER: {
          id: 9,
          name: 'Tomb Raider',
          desc: 'Find the graveyard',
        },
        SKULL_COLLECTOR: {
          id: 10,
          name: 'Skull Collector',
          desc: 'Kill 10 skeletons',
          isCompleted: () => this.storage.getSkeletonCount() >= 10,
        },
        NINJA_LOOT: {
          id: 11,
          name: 'Ninja Loot',
          desc: "Get hold of an item you didn't fight for",
        },
        NO_MANS_LAND: {
          id: 12,
          name: "No Man's Land",
          desc: 'Travel through the desert',
        },
        HUNTER: {
          id: 13,
          name: 'Hunter',
          desc: 'Kill 50 enemies',
          isCompleted: () => this.storage.getTotalKills() >= 50,
        },
        STILL_ALIVE: {
          id: 14,
          name: 'Still Alive',
          desc: 'Revive your character five times',
          isCompleted: () => this.storage.getTotalRevives() >= 5,
        },
        MEATSHIELD: {
          id: 15,
          name: 'Meatshield',
          desc: 'Take 5,000 points of damage',
          isCompleted: () => this.storage.getTotalDamageTaken() >= 5000,
        },
        HOT_SPOT: {
          id: 16,
          name: 'Hot Spot',
          desc: 'Enter the volcanic mountains',
        },
        HERO: {
          id: 17,
          name: 'Hero',
          desc: 'Defeat the final boss',
        },
        FOXY: {
          id: 18,
          name: 'Foxy',
          desc: 'Find the Firefox costume',
          hidden: true,
        },
        FOR_SCIENCE: {
          id: 19,
          name: 'For Science',
          desc: 'Enter into a portal',
          hidden: true,
        },
        RICKROLLD: {
          id: 20,
          name: "Rickroll'd",
          desc: 'Take some singing lessons',
          hidden: true,
        },
      };

      _.each(this.achievements, (obj) => {
        if (!obj.isCompleted) {
          obj.isCompleted = () => true;
        }
        if (!obj.hidden) {
          obj.hidden = false;
        }
      });

      this.app.initAchievementList(this.achievements);

      if (this.storage.hasAlreadyPlayed()) {
        this.app.initUnlockedAchievements(this.storage.data.achievements.unlocked);
      }
    },

    getAchievementById: function (id) {
      var found = null;
      _.each(this.achievements, (achievement, key) => {
        if (achievement.id === Number.parseInt(id)) {
          found = achievement;
        }
      });
      return found;
    },

    loadSprite: function (name) {
      if (this.renderer.upscaledRendering) {
        this.spritesets[0][name] = new Sprite(name, 1);
      } else {
        this.spritesets[1][name] = new Sprite(name, 2);
        if (!this.renderer.mobile && !this.renderer.tablet) {
          this.spritesets[2][name] = new Sprite(name, 3);
        }
      }
    },

    setSpriteScale: function (scale) {
      if (this.renderer.upscaledRendering) {
        this.sprites = this.spritesets[0];
      } else {
        this.sprites = this.spritesets[scale - 1];

        _.each(this.entities, (entity) => {
          entity.sprite = null;
          entity.setSprite(this.sprites[entity.getSpriteName()]);
        });
        this.initHurtSprites();
        this.initShadows();
        this.initCursors();
      }
    },

    loadSprites: function () {
      log.info('Loading sprites...');
      this.spritesets = [];
      this.spritesets[0] = {};
      this.spritesets[1] = {};
      this.spritesets[2] = {};
      _.map(this.spriteNames, this.loadSprite, this);
    },

    spritesLoaded: function () {
      if (_.any(this.sprites, (sprite) => !sprite.isLoaded)) {
        return false;
      }
      return true;
    },

    setCursor: function (name, orientation) {
      if (name in this.cursors) {
        this.currentCursor = this.cursors[name];
        this.currentCursorOrientation = orientation;
      } else {
        log.error('Unknown cursor name :' + name);
      }
    },

    updateCursorLogic: function () {
      if (this.hoveringCollidingTile && this.started) {
        this.targetColor = 'rgba(255, 50, 50, 0.5)';
      } else {
        this.targetColor = 'rgba(255, 255, 255, 0.5)';
      }

      if (this.hoveringMob && this.started) {
        this.setCursor('sword');
        this.hoveringTarget = false;
        this.targetCellVisible = false;
      } else if (this.hoveringNpc && this.started) {
        this.setCursor('talk');
        this.hoveringTarget = false;
        this.targetCellVisible = false;
      } else if ((this.hoveringItem || this.hoveringChest) && this.started) {
        this.setCursor('loot');
        this.hoveringTarget = false;
        this.targetCellVisible = true;
      } else {
        this.setCursor('hand');
        this.hoveringTarget = false;
        this.targetCellVisible = true;
      }
    },

    focusPlayer: function () {
      this.renderer.camera.lookAt(this.player);
    },

    addEntity: function (entity) {
      if (this.entities[entity.id] === undefined) {
        this.entities[entity.id] = entity;
        this.registerEntityPosition(entity);

        if (
          !(entity instanceof Item && entity.wasDropped) &&
          !(this.renderer.mobile || this.renderer.tablet)
        ) {
          entity.fadeIn(this.currentTime);
        }

        if (this.renderer.mobile || this.renderer.tablet) {
          entity.onDirty((e) => {
            if (this.camera.isVisible(e)) {
              e.dirtyRect = this.renderer.getEntityBoundingRect(e);
              this.checkOtherDirtyRects(e.dirtyRect, e, e.gridX, e.gridY);
            }
          });
        }
      } else {
        log.error('This entity already exists : ' + entity.id + ' (' + entity.kind + ')');
      }
    },

    removeEntity: function (entity) {
      if (entity.id in this.entities) {
        this.unregisterEntityPosition(entity);
        delete this.entities[entity.id];
      } else {
        log.error('Cannot remove entity. Unknown ID : ' + entity.id);
      }
    },

    addItem: function (item, x, y) {
      item.setSprite(this.sprites[item.getSpriteName()]);
      item.setGridPosition(x, y);
      item.setAnimation('idle', 150);
      this.addEntity(item);
    },

    removeItem: function (item) {
      if (item) {
        this.removeFromItemGrid(item, item.gridX, item.gridY);
        this.removeFromRenderingGrid(item, item.gridX, item.gridY);
        delete this.entities[item.id];
      } else {
        log.error('Cannot remove item. Unknown ID : ' + item.id);
      }
    },

    initPathingGrid: function () {
      this.pathingGrid = [];
      for (var i = 0; i < this.map.height; i += 1) {
        this.pathingGrid[i] = [];
        for (var j = 0; j < this.map.width; j += 1) {
          this.pathingGrid[i][j] = this.map.grid[i][j];
        }
      }
      log.info('Initialized the pathing grid with static colliding cells.');
    },

    initEntityGrid: function () {
      this.entityGrid = [];
      for (var i = 0; i < this.map.height; i += 1) {
        this.entityGrid[i] = [];
        for (var j = 0; j < this.map.width; j += 1) {
          this.entityGrid[i][j] = {};
        }
      }
      log.info('Initialized the entity grid.');
    },

    initRenderingGrid: function () {
      this.renderingGrid = [];
      for (var i = 0; i < this.map.height; i += 1) {
        this.renderingGrid[i] = [];
        for (var j = 0; j < this.map.width; j += 1) {
          this.renderingGrid[i][j] = {};
        }
      }
      log.info('Initialized the rendering grid.');
    },

    initItemGrid: function () {
      this.itemGrid = [];
      for (var i = 0; i < this.map.height; i += 1) {
        this.itemGrid[i] = [];
        for (var j = 0; j < this.map.width; j += 1) {
          this.itemGrid[i][j] = {};
        }
      }
      log.info('Initialized the item grid.');
    },

    /**
     *
     */
    initAnimatedTiles: function () {
      var m = this.map;

      this.animatedTiles = [];
      this.forEachVisibleTile((id, index) => {
        if (m.isAnimatedTile(id)) {
          var tile = new AnimatedTile(
              id,
              m.getTileAnimationLength(id),
              m.getTileAnimationDelay(id),
              index,
            ),
            pos = this.map.tileIndexToGridPosition(tile.index);

          tile.x = pos.x;
          tile.y = pos.y;
          this.animatedTiles.push(tile);
        }
      }, 1);
      //log.info("Initialized animated tiles.");
    },

    addToRenderingGrid: function (entity, x, y) {
      if (!this.map.isOutOfBounds(x, y)) {
        this.renderingGrid[y][x][entity.id] = entity;
      }
    },

    removeFromRenderingGrid: function (entity, x, y) {
      if (entity && this.renderingGrid[y][x] && entity.id in this.renderingGrid[y][x]) {
        delete this.renderingGrid[y][x][entity.id];
      }
    },

    removeFromEntityGrid: function (entity, x, y) {
      if (this.entityGrid[y][x][entity.id]) {
        delete this.entityGrid[y][x][entity.id];
      }
    },

    removeFromItemGrid: function (item, x, y) {
      if (item && this.itemGrid[y][x][item.id]) {
        delete this.itemGrid[y][x][item.id];
      }
    },

    removeFromPathingGrid: function (x, y) {
      this.pathingGrid[y][x] = 0;
    },

    /**
     * Registers the entity at two adjacent positions on the grid at the same time.
     * This situation is temporary and should only occur when the entity is moving.
     * This is useful for the hit testing algorithm used when hovering entities with the mouse cursor.
     *
     * @param {Entity} entity The moving entity
     */
    registerEntityDualPosition: function (entity) {
      if (entity) {
        this.entityGrid[entity.gridY][entity.gridX][entity.id] = entity;

        this.addToRenderingGrid(entity, entity.gridX, entity.gridY);

        if (entity.nextGridX >= 0 && entity.nextGridY >= 0) {
          this.entityGrid[entity.nextGridY][entity.nextGridX][entity.id] = entity;
          if (!(entity instanceof Player)) {
            this.pathingGrid[entity.nextGridY][entity.nextGridX] = 1;
          }
        }
      }
    },

    /**
     * Clears the position(s) of this entity in the entity grid.
     *
     * @param {Entity} entity The moving entity
     */
    unregisterEntityPosition: function (entity) {
      if (entity) {
        this.removeFromEntityGrid(entity, entity.gridX, entity.gridY);
        this.removeFromPathingGrid(entity.gridX, entity.gridY);

        this.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);

        if (entity.nextGridX >= 0 && entity.nextGridY >= 0) {
          this.removeFromEntityGrid(entity, entity.nextGridX, entity.nextGridY);
          this.removeFromPathingGrid(entity.nextGridX, entity.nextGridY);
        }
      }
    },

    registerEntityPosition: function (entity) {
      var x = entity.gridX,
        y = entity.gridY;

      if (entity) {
        if (entity instanceof Character || entity instanceof Chest) {
          this.entityGrid[y][x][entity.id] = entity;
          if (!(entity instanceof Player)) {
            this.pathingGrid[y][x] = 1;
          }
        }
        if (entity instanceof Item) {
          this.itemGrid[y][x][entity.id] = entity;
        }

        this.addToRenderingGrid(entity, x, y);
      }
    },

    setServerOptions: function (host, port, username) {
      this.host = host;
      this.port = port;
      this.username = username;
    },

    loadAudio: function () {
      this.audioManager = new AudioManager(this);
    },

    initMusicAreas: function () {
      _.each(this.map.musicAreas, (area) => {
        this.audioManager.addArea(area.x, area.y, area.w, area.h, area.id);
      });
    },

    run: function (started_callback) {
      this.loadSprites();
      this.setUpdater(new Updater(this));
      this.camera = this.renderer.camera;

      this.setSpriteScale(this.renderer.scale);

      var wait = setInterval(() => {
        if (this.map.isLoaded && this.spritesLoaded()) {
          this.ready = true;
          log.debug('All sprites loaded.');

          this.loadAudio();

          this.initMusicAreas();
          this.initAchievements();
          this.initCursors();
          this.initAnimations();
          this.initShadows();
          this.initHurtSprites();

          if (!this.renderer.mobile && !this.renderer.tablet && this.renderer.upscaledRendering) {
            this.initSilhouettes();
          }

          this.initEntityGrid();
          this.initItemGrid();
          this.initPathingGrid();
          this.initRenderingGrid();

          this.setPathfinder(new Pathfinder(this.map.width, this.map.height));

          this.initPlayer();
          this.setCursor('hand');

          this.connect(started_callback);

          clearInterval(wait);
        }
      }, 100);
    },

    tick: function () {
      this.currentTime = new Date().getTime();

      if (this.started) {
        this.updateCursorLogic();
        this.updater.update();
        this.renderer.renderFrame();
      }

      if (!this.isStopped) {
        requestAnimFrame(this.tick.bind(this));
      }
    },

    start: function () {
      this.tick();
      this.hasNeverStarted = false;
      log.info('Game loop started.');
    },

    stop: function () {
      log.info('Game stopped.');
      this.isStopped = true;
    },

    entityIdExists: function (id) {
      return id in this.entities;
    },

    getEntityById: function (id) {
      if (id in this.entities) {
        return this.entities[id];
      } else {
        log.error('Unknown entity id : ' + id, true);
      }
    },

    connect: function (started_callback) {
      var connecting = false; // always in dispatcher mode in the build version

      this.client = new GameClient(this.host, this.port);

      //>>excludeStart("prodHost", pragmas.prodHost);
      var config = this.app.config.local || this.app.config.dev;
      if (config) {
        this.client.connect(config.dispatcher); // false if the client connects directly to a game server
        connecting = true;
      }
      //>>excludeEnd("prodHost");

      //>>includeStart("prodHost", pragmas.prodHost);
      if (!connecting) {
        this.client.connect(true); // always use the dispatcher in production
      }
      //>>includeEnd("prodHost");

      this.client.onDispatched((host, port) => {
        log.debug('Dispatched to game server ' + host + ':' + port);

        this.client.host = host;
        this.client.port = port;
        this.client.connect(); // connect to actual game server
      });

      this.client.onConnected(() => {
        log.info('Starting client/server handshake');

        this.player.name = this.username;
        this.started = true;

        this.sendHello(this.player);
      });

      this.client.onEntityList((list) => {
        var entityIds = _.pluck(this.entities, 'id'),
          knownIds = _.intersection(entityIds, list),
          newIds = _.difference(list, knownIds);

        this.obsoleteEntities = _.reject(
          this.entities,
          (entity) => _.include(knownIds, entity.id) || entity.id === this.player.id,
        );

        // Destroy entities outside of the player's zone group
        this.removeObsoleteEntities();

        // Ask the server for spawn information about unknown entities
        if (_.size(newIds) > 0) {
          this.client.sendWho(newIds);
        }
      });

      this.client.onWelcome((id, name, x, y, hp) => {
        log.info('Received player ID from server : ' + id);
        this.player.id = id;
        this.playerId = id;
        // Always accept name received from the server which will
        // sanitize and shorten names exceeding the allowed length.
        this.player.name = name;
        this.player.setGridPosition(x, y);
        this.player.setMaxHitPoints(hp);

        this.updateBars();
        this.resetCamera();
        this.updatePlateauMode();
        this.audioManager.updateMusic();

        this.addEntity(this.player);
        this.player.dirtyRect = this.renderer.getEntityBoundingRect(this.player);

        setTimeout(() => {
          this.tryUnlockingAchievement('STILL_ALIVE');
        }, 1500);

        if (!this.storage.hasAlreadyPlayed()) {
          this.storage.initPlayer(this.player.name);
          this.storage.savePlayer(
            this.renderer.getPlayerImage(),
            this.player.getSpriteName(),
            this.player.getWeaponName(),
          );
          this.showNotification('Welcome to BrowserQuest!');
        } else {
          this.showNotification('Welcome back to BrowserQuest!');
          this.storage.setPlayerName(name);
        }

        this.player.onStartPathing((path) => {
          var i = path.length - 1,
            x = path[i][0],
            y = path[i][1];

          if (this.player.isMovingToLoot()) {
            this.player.isLootMoving = false;
          } else if (!this.player.isAttacking()) {
            this.client.sendMove(x, y);
          }

          // Target cursor position
          this.selectedX = x;
          this.selectedY = y;
          this.selectedCellVisible = true;

          if (this.renderer.mobile || this.renderer.tablet) {
            this.drawTarget = true;
            this.clearTarget = true;
            this.renderer.targetRect = this.renderer.getTargetBoundingRect();
            this.checkOtherDirtyRects(
              this.renderer.targetRect,
              null,
              this.selectedX,
              this.selectedY,
            );
          }
        });

        this.player.onCheckAggro(() => {
          this.forEachMob((mob) => {
            if (mob.isAggressive && !mob.isAttacking() && this.player.isNear(mob, mob.aggroRange)) {
              this.player.aggro(mob);
            }
          });
        });

        this.player.onAggro((mob) => {
          if (!mob.isWaitingToAttack(this.player) && !this.player.isAttackedBy(mob)) {
            this.player.log_info(
              'Aggroed by ' + mob.id + ' at (' + this.player.gridX + ', ' + this.player.gridY + ')',
            );
            this.client.sendAggro(mob);
            mob.waitToAttack(this.player);
          }
        });

        this.player.onBeforeStep(() => {
          var blockingEntity = this.getEntityAt(this.player.nextGridX, this.player.nextGridY);
          if (blockingEntity && blockingEntity.id !== this.playerId) {
            log.debug('Blocked by ' + blockingEntity.id);
          }
          this.unregisterEntityPosition(this.player);
        });

        this.player.onStep(() => {
          if (this.player.hasNextStep()) {
            this.registerEntityDualPosition(this.player);
          }

          if (this.isZoningTile(this.player.gridX, this.player.gridY)) {
            this.enqueueZoningFrom(this.player.gridX, this.player.gridY);
          }

          this.player.forEachAttacker((attacker) => {
            if (attacker.isAdjacent(attacker.target)) {
              attacker.lookAtTarget();
            } else {
              attacker.follow(this.player);
            }
          });

          if (
            (this.player.gridX <= 85 && this.player.gridY <= 179 && this.player.gridY > 178) ||
            (this.player.gridX <= 85 && this.player.gridY <= 266 && this.player.gridY > 265)
          ) {
            this.tryUnlockingAchievement('INTO_THE_WILD');
          }

          if (this.player.gridX <= 85 && this.player.gridY <= 293 && this.player.gridY > 292) {
            this.tryUnlockingAchievement('AT_WORLDS_END');
          }

          if (this.player.gridX <= 85 && this.player.gridY <= 100 && this.player.gridY > 99) {
            this.tryUnlockingAchievement('NO_MANS_LAND');
          }

          if (this.player.gridX <= 85 && this.player.gridY <= 51 && this.player.gridY > 50) {
            this.tryUnlockingAchievement('HOT_SPOT');
          }

          if (this.player.gridX <= 27 && this.player.gridY <= 123 && this.player.gridY > 112) {
            this.tryUnlockingAchievement('TOMB_RAIDER');
          }

          this.updatePlayerCheckpoint();

          if (!this.player.isDead) {
            this.audioManager.updateMusic();
          }
        });

        this.player.onStopPathing((x, y) => {
          if (this.player.hasTarget()) {
            this.player.lookAtTarget();
          }

          this.selectedCellVisible = false;

          if (this.isItemAt(x, y)) {
            var item = this.getItemAt(x, y);

            try {
              this.player.loot(item);
              this.client.sendLoot(item); // Notify the server that this item has been looted
              this.removeItem(item);
              this.showNotification(item.getLootMessage());

              if (item.type === 'armor') {
                this.tryUnlockingAchievement('FAT_LOOT');
              }

              if (item.type === 'weapon') {
                this.tryUnlockingAchievement('A_TRUE_WARRIOR');
              }

              if (item.kind === Types.Entities.CAKE) {
                this.tryUnlockingAchievement('FOR_SCIENCE');
              }

              if (item.kind === Types.Entities.FIREPOTION) {
                this.tryUnlockingAchievement('FOXY');
                this.audioManager.playSound('firefox');
              }

              if (Types.isHealingItem(item.kind)) {
                this.audioManager.playSound('heal');
              } else {
                this.audioManager.playSound('loot');
              }

              if (item.wasDropped && !_(item.playersInvolved).include(this.playerId)) {
                this.tryUnlockingAchievement('NINJA_LOOT');
              }
            } catch (e) {
              if (e instanceof Exceptions.LootException) {
                this.showNotification(e.message);
                this.audioManager.playSound('noloot');
              } else {
                throw e;
              }
            }
          }

          if (!this.player.hasTarget() && this.map.isDoor(x, y)) {
            var dest = this.map.getDoorDestination(x, y);

            this.player.setGridPosition(dest.x, dest.y);
            this.player.nextGridX = dest.x;
            this.player.nextGridY = dest.y;
            this.player.turnTo(dest.orientation);
            this.client.sendTeleport(dest.x, dest.y);

            if (this.renderer.mobile && dest.cameraX && dest.cameraY) {
              this.camera.setGridPosition(dest.cameraX, dest.cameraY);
              this.resetZone();
            } else {
              if (dest.portal) {
                this.assignBubbleTo(this.player);
              } else {
                this.camera.focusEntity(this.player);
                this.resetZone();
              }
            }

            if (_.size(this.player.attackers) > 0) {
              setTimeout(() => {
                this.tryUnlockingAchievement('COWARD');
              }, 500);
            }
            this.player.forEachAttacker((attacker) => {
              attacker.disengage();
              attacker.idle();
            });

            this.updatePlateauMode();

            this.checkUndergroundAchievement();

            if (this.renderer.mobile || this.renderer.tablet) {
              // When rendering with dirty rects, clear the whole screen when entering a door.
              this.renderer.clearScreen(this.renderer.context);
            }

            if (dest.portal) {
              this.audioManager.playSound('teleport');
            }

            if (!this.player.isDead) {
              this.audioManager.updateMusic();
            }
          }

          if (this.player.target instanceof Npc) {
            this.makeNpcTalk(this.player.target);
          } else if (this.player.target instanceof Chest) {
            this.client.sendOpen(this.player.target);
            this.audioManager.playSound('chest');
          }

          this.player.forEachAttacker((attacker) => {
            if (!attacker.isAdjacentNonDiagonal(this.player)) {
              attacker.follow(this.player);
            }
          });

          this.unregisterEntityPosition(this.player);
          this.registerEntityPosition(this.player);
        });

        this.player.onRequestPath((x, y) => {
          var ignored = [this.player]; // Always ignore self

          if (this.player.hasTarget()) {
            ignored.push(this.player.target);
          }
          return this.findPath(this.player, x, y, ignored);
        });

        this.player.onDeath(() => {
          log.info(this.playerId + ' is dead');

          this.player.stopBlinking();
          this.player.setSprite(this.sprites['death']);
          this.player.animate('death', 120, 1, () => {
            log.info(this.playerId + ' was removed');

            this.removeEntity(this.player);
            this.removeFromRenderingGrid(this.player, this.player.gridX, this.player.gridY);

            this.player = null;
            this.client.disable();

            setTimeout(() => {
              this.playerdeath_callback();
            }, 1000);
          });

          this.player.forEachAttacker((attacker) => {
            attacker.disengage();
            attacker.idle();
          });

          this.audioManager.fadeOutCurrentMusic();
          this.audioManager.playSound('death');
        });

        this.player.onHasMoved((player) => {
          this.assignBubbleTo(player);
        });

        this.player.onArmorLoot((armorName) => {
          this.player.switchArmor(this.sprites[armorName]);
        });

        this.player.onSwitchItem(() => {
          this.storage.savePlayer(
            this.renderer.getPlayerImage(),
            this.player.getArmorName(),
            this.player.getWeaponName(),
          );
          if (this.equipment_callback) {
            this.equipment_callback();
          }
        });

        this.player.onInvincible(() => {
          this.invincible_callback();
          this.player.switchArmor(this.sprites['firefox']);
        });

        this.client.onSpawnItem((item, x, y) => {
          log.info(
            'Spawned ' + Types.getKindAsString(item.kind) + ' (' + item.id + ') at ' + x + ', ' + y,
          );
          this.addItem(item, x, y);
        });

        this.client.onSpawnChest((chest, x, y) => {
          log.info('Spawned chest (' + chest.id + ') at ' + x + ', ' + y);
          chest.setSprite(this.sprites[chest.getSpriteName()]);
          chest.setGridPosition(x, y);
          chest.setAnimation('idle_down', 150);
          this.addEntity(chest, x, y);

          chest.onOpen(() => {
            chest.stopBlinking();
            chest.setSprite(this.sprites['death']);
            chest.setAnimation('death', 120, 1, () => {
              log.info(chest.id + ' was removed');
              this.removeEntity(chest);
              this.removeFromRenderingGrid(chest, chest.gridX, chest.gridY);
              this.previousClickPosition = {};
            });
          });
        });

        this.client.onSpawnCharacter((entity, x, y, orientation, targetId) => {
          if (!this.entityIdExists(entity.id)) {
            try {
              if (entity.id !== this.playerId) {
                entity.setSprite(this.sprites[entity.getSpriteName()]);
                entity.setGridPosition(x, y);
                entity.setOrientation(orientation);
                entity.idle();

                this.addEntity(entity);

                log.debug(
                  'Spawned ' +
                    Types.getKindAsString(entity.kind) +
                    ' (' +
                    entity.id +
                    ') at ' +
                    entity.gridX +
                    ', ' +
                    entity.gridY,
                );

                if (entity instanceof Character) {
                  entity.onBeforeStep(() => {
                    this.unregisterEntityPosition(entity);
                  });

                  entity.onStep(() => {
                    if (!entity.isDying) {
                      this.registerEntityDualPosition(entity);

                      entity.forEachAttacker((attacker) => {
                        if (attacker.isAdjacent(attacker.target)) {
                          attacker.lookAtTarget();
                        } else {
                          attacker.follow(entity);
                        }
                      });
                    }
                  });

                  entity.onStopPathing((x, y) => {
                    if (!entity.isDying) {
                      if (entity.hasTarget() && entity.isAdjacent(entity.target)) {
                        entity.lookAtTarget();
                      }

                      if (entity instanceof Player) {
                        var gridX = entity.destination.gridX,
                          gridY = entity.destination.gridY;

                        if (this.map.isDoor(gridX, gridY)) {
                          var dest = this.map.getDoorDestination(gridX, gridY);
                          entity.setGridPosition(dest.x, dest.y);
                        }
                      }

                      entity.forEachAttacker((attacker) => {
                        if (
                          !attacker.isAdjacentNonDiagonal(entity) &&
                          attacker.id !== this.playerId
                        ) {
                          attacker.follow(entity);
                        }
                      });

                      this.unregisterEntityPosition(entity);
                      this.registerEntityPosition(entity);
                    }
                  });

                  entity.onRequestPath((x, y) => {
                    var ignored = [entity], // Always ignore self
                      ignoreTarget = (target) => {
                        ignored.push(target);

                        // also ignore other attackers of the target entity
                        target.forEachAttacker((attacker) => {
                          ignored.push(attacker);
                        });
                      };

                    if (entity.hasTarget()) {
                      ignoreTarget(entity.target);
                    } else if (entity.previousTarget) {
                      // If repositioning before attacking again, ignore previous target
                      // See: tryMovingToADifferentTile()
                      ignoreTarget(entity.previousTarget);
                    }

                    return this.findPath(entity, x, y, ignored);
                  });

                  entity.onDeath(() => {
                    log.info(entity.id + ' is dead');

                    if (entity instanceof Mob) {
                      // Keep track of where mobs die in order to spawn their dropped items
                      // at the right position later.
                      this.deathpositions[entity.id] = { x: entity.gridX, y: entity.gridY };
                    }

                    entity.isDying = true;
                    entity.setSprite(this.sprites[entity instanceof Mobs.Rat ? 'rat' : 'death']);
                    entity.animate('death', 120, 1, () => {
                      log.info(entity.id + ' was removed');

                      this.removeEntity(entity);
                      this.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);
                    });

                    entity.forEachAttacker((attacker) => {
                      attacker.disengage();
                    });

                    if (this.player.target && this.player.target.id === entity.id) {
                      this.player.disengage();
                    }

                    // Upon death, this entity is removed from both grids, allowing the player
                    // to click very fast in order to loot the dropped item and not be blocked.
                    // The entity is completely removed only after the death animation has ended.
                    this.removeFromEntityGrid(entity, entity.gridX, entity.gridY);
                    this.removeFromPathingGrid(entity.gridX, entity.gridY);

                    if (this.camera.isVisible(entity)) {
                      this.audioManager.playSound('kill' + Math.floor(Math.random() * 2 + 1));
                    }

                    this.updateCursor();
                  });

                  entity.onHasMoved((entity) => {
                    this.assignBubbleTo(entity); // Make chat bubbles follow moving entities
                  });

                  if (entity instanceof Mob) {
                    if (targetId) {
                      var player = this.getEntityById(targetId);
                      if (player) {
                        this.createAttackLink(entity, player);
                      }
                    }
                  }
                }
              }
            } catch (e) {
              log.error(e);
            }
          } else {
            log.debug('Character ' + entity.id + " already exists. Don't respawn.");
          }
        });

        this.client.onDespawnEntity((entityId) => {
          var entity = this.getEntityById(entityId);

          if (entity) {
            log.info('Despawning ' + Types.getKindAsString(entity.kind) + ' (' + entity.id + ')');

            if (
              entity.gridX === this.previousClickPosition.x &&
              entity.gridY === this.previousClickPosition.y
            ) {
              this.previousClickPosition = {};
            }

            if (entity instanceof Item) {
              this.removeItem(entity);
            } else if (entity instanceof Character) {
              entity.forEachAttacker((attacker) => {
                if (attacker.canReachTarget()) {
                  attacker.hit();
                }
              });
              entity.die();
            } else if (entity instanceof Chest) {
              entity.open();
            }

            entity.clean();
          }
        });

        this.client.onItemBlink((id) => {
          var item = this.getEntityById(id);

          if (item) {
            item.blink(150);
          }
        });

        this.client.onEntityMove((id, x, y) => {
          var entity = null;

          if (id !== this.playerId) {
            entity = this.getEntityById(id);

            if (entity) {
              if (this.player.isAttackedBy(entity)) {
                this.tryUnlockingAchievement('COWARD');
              }
              entity.disengage();
              entity.idle();
              this.makeCharacterGoTo(entity, x, y);
            }
          }
        });

        this.client.onEntityDestroy((id) => {
          var entity = this.getEntityById(id);
          if (entity) {
            if (entity instanceof Item) {
              this.removeItem(entity);
            } else {
              this.removeEntity(entity);
            }
            log.debug('Entity was destroyed: ' + entity.id);
          }
        });

        this.client.onPlayerMoveToItem((playerId, itemId) => {
          var player, item;

          if (playerId !== this.playerId) {
            player = this.getEntityById(playerId);
            item = this.getEntityById(itemId);

            if (player && item) {
              this.makeCharacterGoTo(player, item.gridX, item.gridY);
            }
          }
        });

        this.client.onEntityAttack((attackerId, targetId) => {
          var attacker = this.getEntityById(attackerId),
            target = this.getEntityById(targetId);

          if (attacker && target && attacker.id !== this.playerId) {
            log.debug(attacker.id + ' attacks ' + target.id);

            if (
              attacker &&
              target instanceof Player &&
              target.id !== this.playerId &&
              target.target &&
              target.target.id === attacker.id &&
              attacker.getDistanceToEntity(target) < 3
            ) {
              setTimeout(() => {
                this.createAttackLink(attacker, target);
              }, 200); // delay to prevent other players attacking mobs from ending up on the same tile as they walk towards each other.
            } else {
              this.createAttackLink(attacker, target);
            }
          }
        });

        this.client.onPlayerDamageMob((mobId, points) => {
          var mob = this.getEntityById(mobId);
          if (mob && points) {
            this.infoManager.addDamageInfo(points, mob.x, mob.y - 15, 'inflicted');
          }
        });

        this.client.onPlayerKillMob((kind) => {
          var mobName = Types.getKindAsString(kind);

          if (mobName === 'skeleton2') {
            mobName = 'greater skeleton';
          }

          if (mobName === 'eye') {
            mobName = 'evil eye';
          }

          if (mobName === 'deathknight') {
            mobName = 'death knight';
          }

          if (mobName === 'boss') {
            this.showNotification('You killed the skeleton king');
          } else {
            if (_.include(['a', 'e', 'i', 'o', 'u'], mobName[0])) {
              this.showNotification('You killed an ' + mobName);
            } else {
              this.showNotification('You killed a ' + mobName);
            }
          }

          this.storage.incrementTotalKills();
          this.tryUnlockingAchievement('HUNTER');

          if (kind === Types.Entities.RAT) {
            this.storage.incrementRatCount();
            this.tryUnlockingAchievement('ANGRY_RATS');
          }

          if (kind === Types.Entities.SKELETON || kind === Types.Entities.SKELETON2) {
            this.storage.incrementSkeletonCount();
            this.tryUnlockingAchievement('SKULL_COLLECTOR');
          }

          if (kind === Types.Entities.BOSS) {
            this.tryUnlockingAchievement('HERO');
          }
        });

        this.client.onPlayerChangeHealth((points, isRegen) => {
          var player = this.player,
            diff,
            isHurt;

          if (player && !player.isDead && !player.invincible) {
            isHurt = points <= player.hitPoints;
            diff = points - player.hitPoints;
            player.hitPoints = points;

            if (player.hitPoints <= 0) {
              player.die();
            }
            if (isHurt) {
              player.hurt();
              this.infoManager.addDamageInfo(diff, player.x, player.y - 15, 'received');
              this.audioManager.playSound('hurt');
              this.storage.addDamage(-diff);
              this.tryUnlockingAchievement('MEATSHIELD');
              if (this.playerhurt_callback) {
                this.playerhurt_callback();
              }
            } else if (!isRegen) {
              this.infoManager.addDamageInfo('+' + diff, player.x, player.y - 15, 'healed');
            }
            this.updateBars();
          }
        });

        this.client.onPlayerChangeMaxHitPoints((hp) => {
          this.player.maxHitPoints = hp;
          this.player.hitPoints = hp;
          this.updateBars();
        });

        this.client.onPlayerEquipItem((playerId, itemKind) => {
          var player = this.getEntityById(playerId),
            itemName = Types.getKindAsString(itemKind);

          if (player) {
            if (Types.isArmor(itemKind)) {
              player.setSprite(this.sprites[itemName]);
            } else if (Types.isWeapon(itemKind)) {
              player.setWeaponName(itemName);
            }
          }
        });

        this.client.onPlayerTeleport((id, x, y) => {
          var entity = null,
            currentOrientation;

          if (id !== this.playerId) {
            entity = this.getEntityById(id);

            if (entity) {
              currentOrientation = entity.orientation;

              this.makeCharacterTeleportTo(entity, x, y);
              entity.setOrientation(currentOrientation);

              entity.forEachAttacker((attacker) => {
                attacker.disengage();
                attacker.idle();
                attacker.stop();
              });
            }
          }
        });

        this.client.onDropItem((item, mobId) => {
          var pos = this.getDeadMobPosition(mobId);

          if (pos) {
            this.addItem(item, pos.x, pos.y);
            this.updateCursor();
          }
        });

        this.client.onChatMessage((entityId, message) => {
          var entity = this.getEntityById(entityId);
          this.createBubble(entityId, message);
          this.assignBubbleTo(entity);
          this.audioManager.playSound('chat');
        });

        this.client.onPopulationChange((worldPlayers, totalPlayers) => {
          if (this.nbplayers_callback) {
            this.nbplayers_callback(worldPlayers, totalPlayers);
          }
        });

        this.client.onDisconnected((message) => {
          if (this.player) {
            this.player.die();
          }
          if (this.disconnect_callback) {
            this.disconnect_callback(message);
          }
        });

        this.gamestart_callback();

        if (this.hasNeverStarted) {
          this.start();
          started_callback();
        }
      });
    },

    /**
     * Links two entities in an attacker<-->target relationship.
     * This is just a utility method to wrap a set of instructions.
     *
     * @param {Entity} attacker The attacker entity
     * @param {Entity} target The target entity
     */
    createAttackLink: function (attacker, target) {
      if (attacker.hasTarget()) {
        attacker.removeTarget();
      }
      attacker.engage(target);

      if (attacker.id !== this.playerId) {
        target.addAttacker(attacker);
      }
    },

    /**
     * Sends a "hello" message to the server, as a way of initiating the player connection handshake.
     * @see GameClient.sendHello
     */
    sendHello: function () {
      this.client.sendHello(this.player);
    },

    /**
     * Converts the current mouse position on the screen to world grid coordinates.
     * @returns {Object} An object containing x and y properties.
     */
    getMouseGridPosition: function () {
      var mx = this.mouse.x,
        my = this.mouse.y,
        c = this.renderer.camera,
        s = this.renderer.scale,
        ts = this.renderer.tilesize,
        offsetX = mx % (ts * s),
        offsetY = my % (ts * s),
        x = (mx - offsetX) / (ts * s) + c.gridX,
        y = (my - offsetY) / (ts * s) + c.gridY;

      return { x: x, y: y };
    },

    /**
     * Moves a character to a given location on the world grid.
     *
     * @param {Number} x The x coordinate of the target location.
     * @param {Number} y The y coordinate of the target location.
     */
    makeCharacterGoTo: function (character, x, y) {
      if (!this.map.isOutOfBounds(x, y)) {
        character.go(x, y);
      }
    },

    /**
     *
     */
    makeCharacterTeleportTo: function (character, x, y) {
      if (!this.map.isOutOfBounds(x, y)) {
        this.unregisterEntityPosition(character);

        character.setGridPosition(x, y);

        this.registerEntityPosition(character);
        this.assignBubbleTo(character);
      } else {
        log.debug('Teleport out of bounds: ' + x + ', ' + y);
      }
    },

    /**
     * Moves the current player to a given target location.
     * @see makeCharacterGoTo
     */
    makePlayerGoTo: function (x, y) {
      this.makeCharacterGoTo(this.player, x, y);
    },

    /**
     * Moves the current player towards a specific item.
     * @see makeCharacterGoTo
     */
    makePlayerGoToItem: function (item) {
      if (item) {
        this.player.isLootMoving = true;
        this.makePlayerGoTo(item.gridX, item.gridY);
        this.client.sendLootMove(item, item.gridX, item.gridY);
      }
    },

    /**
     *
     */
    makePlayerTalkTo: function (npc) {
      if (npc) {
        this.player.setTarget(npc);
        this.player.follow(npc);
      }
    },

    makePlayerOpenChest: function (chest) {
      if (chest) {
        this.player.setTarget(chest);
        this.player.follow(chest);
      }
    },

    /**
     *
     */
    makePlayerAttack: function (mob) {
      this.createAttackLink(this.player, mob);
      this.client.sendAttack(mob);
    },

    /**
     *
     */
    makeNpcTalk: function (npc) {
      var msg;

      if (npc) {
        msg = npc.talk();
        this.previousClickPosition = {};
        if (msg) {
          this.createBubble(npc.id, msg);
          this.assignBubbleTo(npc);
          this.audioManager.playSound('npc');
        } else {
          this.destroyBubble(npc.id);
          this.audioManager.playSound('npc-end');
        }
        this.tryUnlockingAchievement('SMALL_TALK');

        if (npc.kind === Types.Entities.RICK) {
          this.tryUnlockingAchievement('RICKROLLD');
        }
      }
    },

    /**
     * Loops through all the entities currently present in the game.
     * @param {Function} callback The function to call back (must accept one entity argument).
     */
    forEachEntity: function (callback) {
      _.each(this.entities, (entity) => {
        callback(entity);
      });
    },

    /**
     * Same as forEachEntity but only for instances of the Mob subclass.
     * @see forEachEntity
     */
    forEachMob: function (callback) {
      _.each(this.entities, (entity) => {
        if (entity instanceof Mob) {
          callback(entity);
        }
      });
    },

    /**
     * Loops through all entities visible by the camera and sorted by depth :
     * Lower 'y' value means higher depth.
     * Note: This is used by the Renderer to know in which order to render entities.
     */
    forEachVisibleEntityByDepth: function (callback) {
      var m = this.map;

      this.camera.forEachVisiblePosition(
        (x, y) => {
          if (!m.isOutOfBounds(x, y)) {
            if (this.renderingGrid[y][x]) {
              _.each(this.renderingGrid[y][x], (entity) => {
                callback(entity);
              });
            }
          }
        },
        this.renderer.mobile ? 0 : 2,
      );
    },

    /**
     *
     */
    forEachVisibleTileIndex: function (callback, extra) {
      var m = this.map;

      this.camera.forEachVisiblePosition((x, y) => {
        if (!m.isOutOfBounds(x, y)) {
          callback(m.GridPositionToTileIndex(x, y) - 1);
        }
      }, extra);
    },

    /**
     *
     */
    forEachVisibleTile: function (callback, extra) {
      var m = this.map;

      if (m.isLoaded) {
        this.forEachVisibleTileIndex((tileIndex) => {
          if (_.isArray(m.data[tileIndex])) {
            _.each(m.data[tileIndex], (id) => {
              callback(id - 1, tileIndex);
            });
          } else {
            if (_.isNaN(m.data[tileIndex] - 1)) {
              //throw Error("Tile number for index:"+tileIndex+" is NaN");
            } else {
              callback(m.data[tileIndex] - 1, tileIndex);
            }
          }
        }, extra);
      }
    },

    /**
     *
     */
    forEachAnimatedTile: function (callback) {
      if (this.animatedTiles) {
        _.each(this.animatedTiles, (tile) => {
          callback(tile);
        });
      }
    },

    /**
     * Returns the entity located at the given position on the world grid.
     * @returns {Entity} the entity located at (x, y) or null if there is none.
     */
    getEntityAt: function (x, y) {
      if (this.map.isOutOfBounds(x, y) || !this.entityGrid) {
        return null;
      }

      var entities = this.entityGrid[y][x],
        entity = null;
      if (_.size(entities) > 0) {
        entity = entities[_.keys(entities)[0]];
      } else {
        entity = this.getItemAt(x, y);
      }
      return entity;
    },

    getMobAt: function (x, y) {
      var entity = this.getEntityAt(x, y);
      if (entity && entity instanceof Mob) {
        return entity;
      }
      return null;
    },

    getNpcAt: function (x, y) {
      var entity = this.getEntityAt(x, y);
      if (entity && entity instanceof Npc) {
        return entity;
      }
      return null;
    },

    getChestAt: function (x, y) {
      var entity = this.getEntityAt(x, y);
      if (entity && entity instanceof Chest) {
        return entity;
      }
      return null;
    },

    getItemAt: function (x, y) {
      if (this.map.isOutOfBounds(x, y) || !this.itemGrid) {
        return null;
      }
      var items = this.itemGrid[y][x],
        item = null;

      if (_.size(items) > 0) {
        // If there are potions/burgers stacked with equipment items on the same tile, always get expendable items first.
        _.each(items, (i) => {
          if (Types.isExpendableItem(i.kind)) {
            item = i;
          }
        });

        // Else, get the first item of the stack
        if (!item) {
          item = items[_.keys(items)[0]];
        }
      }
      return item;
    },

    /**
     * Returns true if an entity is located at the given position on the world grid.
     * @returns {Boolean} Whether an entity is at (x, y).
     */
    isEntityAt: function (x, y) {
      return !_.isNull(this.getEntityAt(x, y));
    },

    isMobAt: function (x, y) {
      return !_.isNull(this.getMobAt(x, y));
    },

    isItemAt: function (x, y) {
      return !_.isNull(this.getItemAt(x, y));
    },

    isNpcAt: function (x, y) {
      return !_.isNull(this.getNpcAt(x, y));
    },

    isChestAt: function (x, y) {
      return !_.isNull(this.getChestAt(x, y));
    },

    /**
     * Finds a path to a grid position for the specified character.
     * The path will pass through any entity present in the ignore list.
     */
    findPath: function (character, x, y, ignoreList) {
      var grid = this.pathingGrid;
      (path = []), (isPlayer = character === this.player);

      if (this.map.isColliding(x, y)) {
        return path;
      }

      if (this.pathfinder && character) {
        if (ignoreList) {
          _.each(ignoreList, (entity) => {
            this.pathfinder.ignoreEntity(entity);
          });
        }

        path = this.pathfinder.findPath(grid, character, x, y, false);

        if (ignoreList) {
          this.pathfinder.clearIgnoreList();
        }
      } else {
        log.error('Error while finding the path to ' + x + ', ' + y + ' for ' + character.id);
      }
      return path;
    },

    /**
     * Toggles the visibility of the pathing grid for debugging purposes.
     */
    togglePathingGrid: function () {
      if (this.debugPathing) {
        this.debugPathing = false;
      } else {
        this.debugPathing = true;
      }
    },

    /**
     * Toggles the visibility of the FPS counter and other debugging info.
     */
    toggleDebugInfo: function () {
      if (this.renderer && this.renderer.isDebugInfoVisible) {
        this.renderer.isDebugInfoVisible = false;
      } else {
        this.renderer.isDebugInfoVisible = true;
      }
    },

    /**
     *
     */
    movecursor: function () {
      var mouse = this.getMouseGridPosition(),
        x = mouse.x,
        y = mouse.y;

      if (this.player && !this.renderer.mobile && !this.renderer.tablet) {
        this.hoveringCollidingTile = this.map.isColliding(x, y);
        this.hoveringPlateauTile = this.player.isOnPlateau
          ? !this.map.isPlateau(x, y)
          : this.map.isPlateau(x, y);
        this.hoveringMob = this.isMobAt(x, y);
        this.hoveringItem = this.isItemAt(x, y);
        this.hoveringNpc = this.isNpcAt(x, y);
        this.hoveringChest = this.isChestAt(x, y);

        if (this.hoveringMob || this.hoveringNpc || this.hoveringChest) {
          var entity = this.getEntityAt(x, y);

          if (!entity.isHighlighted && this.renderer.supportsSilhouettes) {
            if (this.lastHovered) {
              this.lastHovered.setHighlight(false);
            }
            this.lastHovered = entity;
            entity.setHighlight(true);
          }
        } else if (this.lastHovered) {
          this.lastHovered.setHighlight(false);
          this.lastHovered = null;
        }
      }
    },

    /**
     * Processes game logic when the user triggers a click/touch event during the game.
     */
    click: function () {
      var pos = this.getMouseGridPosition(),
        entity;

      if (pos.x === this.previousClickPosition.x && pos.y === this.previousClickPosition.y) {
        return;
      } else {
        this.previousClickPosition = pos;
      }

      if (
        this.started &&
        this.player &&
        !this.isZoning() &&
        !this.isZoningTile(this.player.nextGridX, this.player.nextGridY) &&
        !this.player.isDead &&
        !this.hoveringCollidingTile &&
        !this.hoveringPlateauTile
      ) {
        entity = this.getEntityAt(pos.x, pos.y);

        if (entity instanceof Mob) {
          this.makePlayerAttack(entity);
        } else if (entity instanceof Item) {
          this.makePlayerGoToItem(entity);
        } else if (entity instanceof Npc) {
          if (this.player.isAdjacentNonDiagonal(entity) === false) {
            this.makePlayerTalkTo(entity);
          } else {
            this.makeNpcTalk(entity);
          }
        } else if (entity instanceof Chest) {
          this.makePlayerOpenChest(entity);
        } else {
          this.makePlayerGoTo(pos.x, pos.y);
        }
      }
    },

    isMobOnSameTile: function (mob, x, y) {
      var X = x || mob.gridX,
        Y = y || mob.gridY,
        list = this.entityGrid[Y][X],
        result = false;

      _.each(list, (entity) => {
        if (entity instanceof Mob && entity.id !== mob.id) {
          result = true;
        }
      });
      return result;
    },

    getFreeAdjacentNonDiagonalPosition: function (entity) {
      var result = null;

      entity.forEachAdjacentNonDiagonalPosition((x, y, orientation) => {
        if (!result && !this.map.isColliding(x, y) && !this.isMobAt(x, y)) {
          result = { x: x, y: y, o: orientation };
        }
      });
      return result;
    },

    tryMovingToADifferentTile: function (character) {
      var attacker = character,
        target = character.target;

      if (attacker && target && target instanceof Player) {
        if (!target.isMoving() && attacker.getDistanceToEntity(target) === 0) {
          var pos;

          switch (target.orientation) {
            case Types.Orientations.UP:
              pos = { x: target.gridX, y: target.gridY - 1, o: target.orientation };
              break;
            case Types.Orientations.DOWN:
              pos = { x: target.gridX, y: target.gridY + 1, o: target.orientation };
              break;
            case Types.Orientations.LEFT:
              pos = { x: target.gridX - 1, y: target.gridY, o: target.orientation };
              break;
            case Types.Orientations.RIGHT:
              pos = { x: target.gridX + 1, y: target.gridY, o: target.orientation };
              break;
          }

          if (pos) {
            attacker.previousTarget = target;
            attacker.disengage();
            attacker.idle();
            this.makeCharacterGoTo(attacker, pos.x, pos.y);
            target.adjacentTiles[pos.o] = true;

            return true;
          }
        }

        if (
          !target.isMoving() &&
          attacker.isAdjacentNonDiagonal(target) &&
          this.isMobOnSameTile(attacker)
        ) {
          var pos = this.getFreeAdjacentNonDiagonalPosition(target);

          // avoid stacking mobs on the same tile next to a player
          // by making them go to adjacent tiles if they are available
          if (pos && !target.adjacentTiles[pos.o]) {
            if (this.player.target && attacker.id === this.player.target.id) {
              return false; // never unstack the player's target
            }

            attacker.previousTarget = target;
            attacker.disengage();
            attacker.idle();
            this.makeCharacterGoTo(attacker, pos.x, pos.y);
            target.adjacentTiles[pos.o] = true;

            return true;
          }
        }
      }
      return false;
    },

    /**
     *
     */
    onCharacterUpdate: function (character) {
      var time = this.currentTime;

      // If mob has finished moving to a different tile in order to avoid stacking, attack again from the new position.
      if (character.previousTarget && !character.isMoving() && character instanceof Mob) {
        var t = character.previousTarget;

        if (this.getEntityById(t.id)) {
          // does it still exist?
          character.previousTarget = null;
          this.createAttackLink(character, t);
          return;
        }
      }

      if (character.isAttacking() && !character.previousTarget) {
        var isMoving = this.tryMovingToADifferentTile(character); // Don't let multiple mobs stack on the same tile when attacking a player.

        if (character.canAttack(time)) {
          if (!isMoving) {
            // don't hit target if moving to a different tile.
            if (
              character.hasTarget() &&
              character.getOrientationTo(character.target) !== character.orientation
            ) {
              character.lookAtTarget();
            }

            character.hit();

            if (character.id === this.playerId) {
              this.client.sendHit(character.target);
            }

            if (character instanceof Player && this.camera.isVisible(character)) {
              this.audioManager.playSound('hit' + Math.floor(Math.random() * 2 + 1));
            }

            if (
              character.hasTarget() &&
              character.target.id === this.playerId &&
              this.player &&
              !this.player.invincible
            ) {
              this.client.sendHurt(character);
            }
          }
        } else {
          if (
            character.hasTarget() &&
            character.isDiagonallyAdjacent(character.target) &&
            character.target instanceof Player &&
            !character.target.isMoving()
          ) {
            character.follow(character.target);
          }
        }
      }
    },

    /**
     *
     */
    isZoningTile: function (x, y) {
      var c = this.camera;

      x = x - c.gridX;
      y = y - c.gridY;

      if (x === 0 || y === 0 || x === c.gridW - 1 || y === c.gridH - 1) {
        return true;
      }
      return false;
    },

    /**
     *
     */
    getZoningOrientation: function (x, y) {
      var orientation = '',
        c = this.camera;

      x = x - c.gridX;
      y = y - c.gridY;

      if (x === 0) {
        orientation = Types.Orientations.LEFT;
      } else if (y === 0) {
        orientation = Types.Orientations.UP;
      } else if (x === c.gridW - 1) {
        orientation = Types.Orientations.RIGHT;
      } else if (y === c.gridH - 1) {
        orientation = Types.Orientations.DOWN;
      }

      return orientation;
    },

    startZoningFrom: function (x, y) {
      this.zoningOrientation = this.getZoningOrientation(x, y);

      if (this.renderer.mobile || this.renderer.tablet) {
        var z = this.zoningOrientation,
          c = this.camera,
          ts = this.renderer.tilesize,
          x = c.x,
          y = c.y,
          xoffset = (c.gridW - 2) * ts,
          yoffset = (c.gridH - 2) * ts;

        if (z === Types.Orientations.LEFT || z === Types.Orientations.RIGHT) {
          x = z === Types.Orientations.LEFT ? c.x - xoffset : c.x + xoffset;
        } else if (z === Types.Orientations.UP || z === Types.Orientations.DOWN) {
          y = z === Types.Orientations.UP ? c.y - yoffset : c.y + yoffset;
        }
        c.setPosition(x, y);

        this.renderer.clearScreen(this.renderer.context);
        this.endZoning();

        // Force immediate drawing of all visible entities in the new zone
        this.forEachVisibleEntityByDepth((entity) => {
          entity.setDirty();
        });
      } else {
        this.currentZoning = new Transition();
      }
      this.bubbleManager.clean();
      this.client.sendZone();
    },

    enqueueZoningFrom: function (x, y) {
      this.zoningQueue.push({ x: x, y: y });

      if (this.zoningQueue.length === 1) {
        this.startZoningFrom(x, y);
      }
    },

    endZoning: function () {
      this.currentZoning = null;
      this.resetZone();
      this.zoningQueue.shift();

      if (this.zoningQueue.length > 0) {
        var pos = this.zoningQueue[0];
        this.startZoningFrom(pos.x, pos.y);
      }
    },

    isZoning: function () {
      return !_.isNull(this.currentZoning);
    },

    resetZone: function () {
      this.bubbleManager.clean();
      this.initAnimatedTiles();
      this.renderer.renderStaticCanvases();
    },

    resetCamera: function () {
      this.camera.focusEntity(this.player);
      this.resetZone();
    },

    say: function (message) {
      this.client.sendChat(message);
    },

    createBubble: function (id, message) {
      this.bubbleManager.create(id, message, this.currentTime);
    },

    destroyBubble: function (id) {
      this.bubbleManager.destroyBubble(id);
    },

    assignBubbleTo: function (character) {
      var bubble = this.bubbleManager.getBubbleById(character.id);

      if (bubble) {
        var s = this.renderer.scale,
          t = 16 * s, // tile size
          x = (character.x - this.camera.x) * s,
          w = Number.parseInt(bubble.element.css('width')) + 24,
          offset = w / 2 - t / 2,
          offsetY,
          y;

        if (character instanceof Npc) {
          offsetY = 0;
        } else {
          if (s === 2) {
            if (this.renderer.mobile) {
              offsetY = 0;
            } else {
              offsetY = 15;
            }
          } else {
            offsetY = 12;
          }
        }

        y = (character.y - this.camera.y) * s - t * 2 - offsetY;

        bubble.element.css('left', x - offset + 'px');
        bubble.element.css('top', y + 'px');
      }
    },

    restart: function () {
      log.debug('Beginning restart');

      this.entities = {};
      this.initEntityGrid();
      this.initPathingGrid();
      this.initRenderingGrid();

      this.player = new Warrior('player', this.username);
      this.initPlayer();

      this.started = true;
      this.client.enable();
      this.sendHello(this.player);

      this.storage.incrementRevives();

      if (this.renderer.mobile || this.renderer.tablet) {
        this.renderer.clearScreen(this.renderer.context);
      }

      log.debug('Finished restart');
    },

    onGameStart: function (callback) {
      this.gamestart_callback = callback;
    },

    onDisconnect: function (callback) {
      this.disconnect_callback = callback;
    },

    onPlayerDeath: function (callback) {
      this.playerdeath_callback = callback;
    },

    onPlayerHealthChange: function (callback) {
      this.playerhp_callback = callback;
    },

    onPlayerHurt: function (callback) {
      this.playerhurt_callback = callback;
    },

    onPlayerEquipmentChange: function (callback) {
      this.equipment_callback = callback;
    },

    onNbPlayersChange: function (callback) {
      this.nbplayers_callback = callback;
    },

    onNotification: function (callback) {
      this.notification_callback = callback;
    },

    onPlayerInvincible: function (callback) {
      this.invincible_callback = callback;
    },

    resize: function () {
      var x = this.camera.x,
        y = this.camera.y,
        currentScale = this.renderer.scale,
        newScale = this.renderer.getScaleFactor();

      this.renderer.rescale(newScale);
      this.camera = this.renderer.camera;
      this.camera.setPosition(x, y);

      this.renderer.renderStaticCanvases();
    },

    updateBars: function () {
      if (this.player && this.playerhp_callback) {
        this.playerhp_callback(this.player.hitPoints, this.player.maxHitPoints);
      }
    },

    getDeadMobPosition: function (mobId) {
      var position;

      if (mobId in this.deathpositions) {
        position = this.deathpositions[mobId];
        delete this.deathpositions[mobId];
      }

      return position;
    },

    onAchievementUnlock: function (callback) {
      this.unlock_callback = callback;
    },

    tryUnlockingAchievement: function (name) {
      var achievement = null;
      if (name in this.achievements) {
        achievement = this.achievements[name];

        if (achievement.isCompleted() && this.storage.unlockAchievement(achievement.id)) {
          if (this.unlock_callback) {
            this.unlock_callback(achievement.id, achievement.name, achievement.desc);
            this.audioManager.playSound('achievement');
          }
        }
      }
    },

    showNotification: function (message) {
      if (this.notification_callback) {
        this.notification_callback(message);
      }
    },

    removeObsoleteEntities: function () {
      var nb = _.size(this.obsoleteEntities);

      if (nb > 0) {
        _.each(this.obsoleteEntities, (entity) => {
          if (entity.id != this.player.id) {
            // never remove yourself
            this.removeEntity(entity);
          }
        });
        log.debug(
          'Removed ' +
            nb +
            ' entities: ' +
            _.pluck(
              _.reject(this.obsoleteEntities, (id) => id === this.player.id),
              'id',
            ),
        );
        this.obsoleteEntities = null;
      }
    },

    /**
     * Fake a mouse move event in order to update the cursor.
     *
     * For instance, to get rid of the sword cursor in case the mouse is still hovering over a dying mob.
     * Also useful when the mouse is hovering a tile where an item is appearing.
     */
    updateCursor: function () {
      this.movecursor();
      this.updateCursorLogic();
    },

    /**
     * Change player plateau mode when necessary
     */
    updatePlateauMode: function () {
      if (this.map.isPlateau(this.player.gridX, this.player.gridY)) {
        this.player.isOnPlateau = true;
      } else {
        this.player.isOnPlateau = false;
      }
    },

    updatePlayerCheckpoint: function () {
      var checkpoint = this.map.getCurrentCheckpoint(this.player);

      if (checkpoint) {
        var lastCheckpoint = this.player.lastCheckpoint;
        if (!lastCheckpoint || (lastCheckpoint && lastCheckpoint.id !== checkpoint.id)) {
          this.player.lastCheckpoint = checkpoint;
          this.client.sendCheck(checkpoint.id);
        }
      }
    },

    checkUndergroundAchievement: function () {
      var music = this.audioManager.getSurroundingMusic(this.player);

      if (music) {
        if (music.name === 'cave') {
          this.tryUnlockingAchievement('UNDERGROUND');
        }
      }
    },

    forEachEntityAround: function (x, y, r, callback) {
      for (var i = x - r, max_i = x + r; i <= max_i; i += 1) {
        for (var j = y - r, max_j = y + r; j <= max_j; j += 1) {
          if (!this.map.isOutOfBounds(i, j)) {
            _.each(this.renderingGrid[j][i], (entity) => {
              callback(entity);
            });
          }
        }
      }
    },

    checkOtherDirtyRects: function (r1, source, x, y) {
      var r = this.renderer;

      this.forEachEntityAround(x, y, 2, (e2) => {
        if (source && source.id && e2.id === source.id) {
          return;
        }
        if (!e2.isDirty) {
          var r2 = r.getEntityBoundingRect(e2);
          if (r.isIntersecting(r1, r2)) {
            e2.setDirty();
          }
        }
      });

      if (source && !source.hasOwnProperty('index')) {
        this.forEachAnimatedTile((tile) => {
          if (!tile.isDirty) {
            var r2 = r.getTileBoundingRect(tile);
            if (r.isIntersecting(r1, r2)) {
              tile.isDirty = true;
            }
          }
        });
      }

      if (!this.drawTarget && this.selectedCellVisible) {
        var targetRect = r.getTargetBoundingRect();
        if (r.isIntersecting(r1, targetRect)) {
          this.drawTarget = true;
          this.renderer.targetRect = targetRect;
        }
      }
    },
  });

  return Game;
});
