import fs from 'node:fs/promises';
import { randomInt } from '@bq/shared';
import { Checkpoint } from './Checkpoint.js';
export class Map {
    filepath;
    width = 0;
    height = 0;
    collisions = [];
    mobAreas = [];
    chestAreas = [];
    staticChests = [];
    staticEntities = {};
    isLoaded = false;
    zoneWidth = 28;
    zoneHeight = 12;
    groupWidth = 0;
    groupHeight = 0;
    grid = [];
    connectedGroups = {};
    checkpoints = {};
    startingAreas = [];
    constructor(filepath) {
        this.filepath = filepath;
    }
    async load() {
        const content = await fs.readFile(this.filepath, 'utf8');
        const data = JSON.parse(content);
        this.initMap(data);
    }
    initMap(data) {
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
    generateCollisionGrid() {
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
    isOutOfBounds(x, y) {
        return x <= 0 || x >= this.width || y <= 0 || y >= this.height;
    }
    isColliding(x, y) {
        if (this.isOutOfBounds(x, y))
            return false;
        return this.grid[y]?.[x] === 1;
    }
    getGroupIdFromPosition(x, y) {
        const gx = Math.floor((x - 1) / this.zoneWidth);
        const gy = Math.floor((y - 1) / this.zoneHeight);
        return `${gx}-${gy}`;
    }
    getGroupPositionFromId(id) {
        const [x, y] = id.split('-').map(Number);
        return { x, y };
    }
    forEachGroup(callback) {
        for (let x = 0; x < this.groupWidth; x++) {
            for (let y = 0; y < this.groupHeight; y++) {
                callback(`${x}-${y}`);
            }
        }
    }
    forEachAdjacentGroup(groupId, callback) {
        if (!groupId)
            return;
        const { x, y } = this.getGroupPositionFromId(groupId);
        const adjacent = [];
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
    initConnectedGroups(doors) {
        this.connectedGroups = {};
        for (const door of doors) {
            const groupId = this.getGroupIdFromPosition(door.x, door.y);
            const connectedGroupId = this.getGroupIdFromPosition(door.tx, door.ty);
            const connectedPos = this.getGroupPositionFromId(connectedGroupId);
            if (!this.connectedGroups[groupId])
                this.connectedGroups[groupId] = [];
            this.connectedGroups[groupId].push(connectedPos);
        }
    }
    initCheckpoints(cpList) {
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
    getCheckpoint(id) {
        return this.checkpoints[id];
    }
    getRandomStartingPosition() {
        const area = this.startingAreas[randomInt(0, this.startingAreas.length - 1)];
        return area.getRandomPosition();
    }
    tileIndexToGridPosition(tileNum) {
        tileNum -= 1;
        const x = tileNum % this.width;
        const y = Math.floor(tileNum / this.width);
        return { x, y };
    }
}
