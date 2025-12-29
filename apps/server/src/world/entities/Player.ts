import { EntityKind, MessageType, getArmorLevel, getWeaponLevel } from '@bq/shared';
import type { Checkpoint } from '../Checkpoint.js';
import type { Connection } from '../../core/Connection.js';
import * as Messages from '../../protocol/Messages.js';
import type { WorldServer } from '../WorldServer.js';
import { Character } from './Character.js';
import { db } from '../../core/db/index.js';
import { users } from '../../core/db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../../core/Log.js';

export class Player extends Character {
  public name = '';
  public hasEnteredGame = false;
  public isDead = false;
  public armor = EntityKind.CLOTHARMOR;
  public weapon = EntityKind.SWORD1;
  public armorLevel = 1;
  public weaponLevel = 1;
  public lastCheckpoint: Checkpoint | null = null;

  private requestPositionCallback?: () => { x: number; y: number };
  private moveCallback?: (x: number, y: number) => void;
  private lootMoveCallback?: (x: number, y: number) => void;
  private zoneCallback?: () => void;
  private broadcastCallback?: (message: Messages.Message, ignoreSelf: boolean) => void;
  private broadcastToZoneCallback?: (message: Messages.Message, ignoreSelf: boolean) => void;
  private exitCallback?: () => void;

  private helloCallback?: () => void;
  private actionCallback?: () => void;

  constructor(
    public connection: Connection,
    private world: WorldServer,
  ) {
    super(connection.id, 'player', EntityKind.WARRIOR, 0, 0);

    this.connection.listen((message: any) => {
      const type = message[0];

      switch (type) {
        case MessageType.HELLO:
          this.name = message[1] as string;
          this.kind = EntityKind.WARRIOR;

          this.loadFromDb().then(() => {
            if (this.requestPositionCallback) {
              const pos = this.requestPositionCallback();
              this.setPosition(pos.x, pos.y);
            }
            if (this.helloCallback) this.helloCallback();
          });
          break;

        case MessageType.MOVE:
          if (this.moveCallback) this.moveCallback(message[1], message[2]);
          break;

        case MessageType.LOOTMOVE:
          if (this.lootMoveCallback) this.lootMoveCallback(message[1], message[2]);
          break;

        case MessageType.AGGRO:
          if (this.actionCallback) this.actionCallback();
          break;

        case MessageType.ATTACK: {
          const mobId = message[1];
          this.world.handleMobHate(mobId, this.id, 5);
          this.world.handleHurtEntity(
            this.world.getEntityById(mobId)!,
            this,
            getWeaponLevel(this.weapon),
          );
          break;
        }

        case MessageType.HIT: {
          const entityId = message[1];
          const entity = this.world.getEntityById(entityId);
          if (entity && entity instanceof Character) {
            this.world.handleHurtEntity(entity, this, getWeaponLevel(this.weapon));
          }
          break;
        }

        case MessageType.CHAT: {
          const msg = message[1] as string;
          if (msg && this.broadcastCallback) {
            this.broadcastCallback(new Messages.Chat(this.id as number, msg), false);
          }
          break;
        }

        case MessageType.WHO:
          this.connection.send([MessageType.WHO, this.world.playerCount]);
          break;

        case MessageType.ZONE:
          if (this.zoneCallback) this.zoneCallback();
          break;
      }
    });

    this.connection.onClose(() => {
      this.exitCallback?.();
    });
  }

  onHello(callback: () => void) {
    this.helloCallback = callback;
  }

  onAction(callback: () => void) {
    this.actionCallback = callback;
  }

  getState(): (number | string)[] {
    const basestate = this.getBaseState();
    const state: (number | string)[] = [this.name, this.orientation, this.armor, this.weapon];

    if (this.target !== null) {
      state.push(this.target);
    }

    return [...basestate, ...state];
  }

  equipArmor(kind: EntityKind) {
    this.armor = kind;
    this.armorLevel = getArmorLevel(kind);
  }

  equipWeapon(kind: EntityKind) {
    this.weapon = kind;
    this.weaponLevel = getWeaponLevel(kind);
  }

  onRequestPosition(callback: () => { x: number; y: number }) {
    this.requestPositionCallback = callback;
  }

  onMove(callback: (x: number, y: number) => void) {
    this.moveCallback = callback;
  }

  onLootMove(callback: (x: number, y: number) => void) {
    this.lootMoveCallback = callback;
  }

  onZone(callback: () => void) {
    this.zoneCallback = callback;
  }

  onBroadcast(callback: (message: Messages.Message, ignoreSelf: boolean) => void) {
    this.broadcastCallback = callback;
  }

  onBroadcastToZone(callback: (message: Messages.Message, ignoreSelf: boolean) => void) {
    this.broadcastToZoneCallback = callback;
  }

  onExit(callback: () => void) {
    this.exitCallback = callback;
  }

  broadcast(message: Messages.Message, ignoreSelf = false) {
    this.broadcastCallback?.(message, ignoreSelf);
  }

  broadcastToZone(message: Messages.Message, ignoreSelf = false) {
    this.broadcastToZoneCallback?.(message, ignoreSelf);
  }

  addHater(_mob: Character) {}
  removeHater(_mob: Character) {}

  despawn(): Messages.Despawn {
    return new Messages.Despawn(this.id as number);
  }

  health(): Messages.Health {
    return new Messages.Health(this.hitPoints, false);
  }

  async loadFromDb() {
    try {
      const [user] = await db.select().from(users).where(eq(users.name, this.name));
      if (user) {
        this.x = user.x;
        this.y = user.y;
        this.kind = user.kind as EntityKind;
        this.hitPoints = user.hp;
        this.maxHitPoints = user.maxHp;
        this.armor = user.armor as EntityKind;
        this.weapon = user.weapon as EntityKind;
        this.armorLevel = getArmorLevel(this.armor);
        this.weaponLevel = getWeaponLevel(this.weapon);
      } else {
        // Create new user record
        await db.insert(users).values({
          name: this.name,
          x: this.x,
          y: this.y,
          kind: this.kind,
          hp: this.hitPoints,
          maxHp: this.maxHitPoints,
          armor: this.armor,
          weapon: this.weapon,
        });
      }
    } catch (e) {
      console.error('Error loading player from DB:', e);
    }
  }

  async save() {
    try {
      await db.update(users)
        .set({
          x: this.x,
          y: this.y,
          hp: this.hitPoints,
          maxHp: this.maxHitPoints,
          armor: this.armor,
          weapon: this.weapon,
          lastLogin: new Date(),
        })
        .where(eq(users.name, this.name));
    } catch (e) {
      logger.error({ err: e }, 'Error saving player to DB');
    }
  }

  regen(): Messages.Health {
    return new Messages.Health(this.hitPoints, true);
  }
}
