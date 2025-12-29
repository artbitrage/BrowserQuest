import fs from 'node:fs/promises';
import { randomInt } from '@bq/shared';
import { Checkpoint } from './Checkpoint.js';

export interface MapArea {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  nb: number;
}

export interface ChestArea {
  x: number;
  y: number;
  w: number;
  h: number;
  i: number[];
  tx: number;
  ty: number;
}

export interface Door {
  x: number;
  y: number;
  p: number;
  tx: number;
  ty: number;
  to: string;
}

export interface MapData {
  width: number;
  height: number;
  collisions: number[];
  roamingAreas: MapArea[];
  chestAreas: ChestArea[];
  staticChests: { x: number; y: number; i: number[] }[];
  staticEntities: Record<string, string>;
  doors: Door[];
  checkpoints: { id: number; x: number; y: number; w: number; h: number; s: number }[];
}

export class Map {
  public width = 0;
  public height = 0;
  public collisions: number[] = [];
  public mobAreas: MapArea[] = [];
  public chestAreas: ChestArea[] = [];
  public staticChests: { x: number; y: number; i: number[] }[] = [];
  public staticEntities: Record<string, string> = {};
  public isLoaded = false;

  public zoneWidth = 28;
  public zoneHeight = 12;
  public groupWidth = 0;
  public groupHeight = 0;

  private grid: number[][] = [];
  private connectedGroups: Record<string, { x: number; y: number }[]> = {};
  private checkpoints: Record<number, Checkpoint> = {};
  private startingAreas: Checkpoint[] = [];

  constructor(private filepath: string) {}

  async load() {
    const content = await fs.readFile(this.filepath, 'utf8');
    const data: MapData = JSON.parse(content);
    this.initMap(data);
  }

  private initMap(data: MapData) {
    this.width = data.width;
    this.height = data.height;
    this.collisions = data.collisions;
    this.mobAreas = data.roamingAreas;
    this.chestAreas = data.chestAreas;
    this.staticChests = data.staticChests;
    this.staticEntities = data.staticEntities;

    this.groupWidth = Math.floor(this.width / this.zoneWidth);
    this.groupHeight = Math.floor(this.height / this.zoneHeight);

    this.generateCollisionGrid();
    this.initConnectedGroups(data.doors);
    this.initCheckpoints(data.checkpoints);

    this.isLoaded = true;
  }

  private generateCollisionGrid() {
    this.grid = [];
    let tileIndex = 0;
    for (let i = 0; i < this.height; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.width; j++) {
        this.grid[i][j] = this.collisions.includes(tileIndex) ? 1 : 0;
        tileIndex++;
      }
    }
  }

  isOutOfBounds(x: number, y: number): boolean {
    return x <= 0 || x >= this.width || y <= 0 || y >= this.height;
  }

  isColliding(x: number, y: number): boolean {
    if (this.isOutOfBounds(x, y)) return false;
    return this.grid[y]?.[x] === 1;
  }

  getGroupIdFromPosition(x: number, y: number): string {
    const gx = Math.floor((x - 1) / this.zoneWidth);
    const gy = Math.floor((y - 1) / this.zoneHeight);
    return `${gx}-${gy}`;
  }

  private getGroupPositionFromId(id: string): { x: number; y: number } {
    const [x, y] = id.split('-').map(Number);
    return { x, y };
  }

  forEachGroup(callback: (id: string) => void) {
    for (let x = 0; x < this.groupWidth; x++) {
      for (let y = 0; y < this.groupHeight; y++) {
        callback(`${x}-${y}`);
      }
    }
  }

  forEachAdjacentGroup(groupId: string, callback: (id: string) => void) {
    if (!groupId) return;

    const { x, y } = this.getGroupPositionFromId(groupId);
    const adjacent: { x: number; y: number }[] = [];

    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        if (i >= 0 && j >= 0 && i < this.groupWidth && j < this.groupHeight) {
          adjacent.push({ x: i, y: j });
        }
      }
    }

    // Connected groups via doors
    const connected = this.connectedGroups[groupId] || [];
    for (const pos of connected) {
      if (!adjacent.some((a) => a.x === pos.x && a.y === pos.y)) {
        adjacent.push(pos);
      }
    }

    for (const pos of adjacent) {
      callback(`${pos.x}-${pos.y}`);
    }
  }

  private initConnectedGroups(doors: Door[]) {
    this.connectedGroups = {};
    for (const door of doors) {
      const groupId = this.getGroupIdFromPosition(door.x, door.y);
      const connectedGroupId = this.getGroupIdFromPosition(door.tx, door.ty);
      const connectedPos = this.getGroupPositionFromId(connectedGroupId);

      if (!this.connectedGroups[groupId]) this.connectedGroups[groupId] = [];
      this.connectedGroups[groupId].push(connectedPos);
    }
  }

  private initCheckpoints(cpList: MapData['checkpoints']) {
    this.checkpoints = {};
    this.startingAreas = [];
    for (const cp of cpList) {
      const checkpoint = new Checkpoint(cp.id, cp.x, cp.y, cp.w, cp.h, cp.s === 1);
      this.checkpoints[checkpoint.id] = checkpoint;
      if (checkpoint.isStartingArea) {
        this.startingAreas.push(checkpoint);
      }
    }
  }

  getCheckpoint(id: number): Checkpoint | undefined {
    return this.checkpoints[id];
  }

  getRandomStartingPosition(): { x: number; y: number } {
    const area = this.startingAreas[randomInt(0, this.startingAreas.length - 1)];
    return area.getRandomPosition();
  }

  tileIndexToGridPosition(tileNum: number): { x: number; y: number } {
    tileNum -= 1;
    const x = tileNum % this.width;
    const y = Math.floor(tileNum / this.width);
    return { x, y };
  }
}
