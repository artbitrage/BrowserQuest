import { type EntityKind, EntityKindMap, Orientation } from '@bq/shared';
import type { Entity } from './EntityManager';
import type { Game } from './Game';

interface SpriteAnimation {
  length: number;
  row: number;
}

interface SpriteData {
  id: string;
  width: number;
  height: number;
  animations: Record<string, SpriteAnimation>;
  offset_x?: number;
  offset_y?: number;
}

export class Renderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private tileset: HTMLImageElement;
  private tilesetLoaded = false;

  private sprites: Map<string, HTMLImageElement> = new Map();
  private spriteData: Map<string, SpriteData> = new Map();
  private loadingSprites: Set<string> = new Set();

  constructor(private game: Game) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    // Disable smoothing for pixel art look
    this.canvas.style.imageRendering = 'pixelated';

    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.tileset = new Image();
    this.tileset.src = '/img/1/tilesheet.png';
    this.tileset.onload = () => {
      this.tilesetLoaded = true;
    };
  }

  public init(container: HTMLElement) {
    container.appendChild(this.canvas);
    this.resize();
    // Start map loading
    this.game.map.load('/maps/world_client.json');
  }

  public resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  public render() {
    // Clear screen
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.game.map.isLoaded() || !this.tilesetLoaded) {
      this.ctx.fillStyle = 'white';
      this.ctx.font = '20px Arial';
      this.ctx.fillText('Loading...', 20, 40);
      return;
    }

    // Camera logic
    const scale = 2;
    const scaledTileSize = this.game.map.tileSize * scale;
    const player = this.game.entities.entities.get(this.game.entities.playerId || '');

    let cameraX = 0;
    let cameraY = 0;

    if (player) {
      cameraX = player.x * scaledTileSize - this.canvas.width / 2;
      cameraY = player.y * scaledTileSize - this.canvas.height / 2;

      // Clamp to map bounds
      const mapWidth = this.game.map.width * scaledTileSize;
      const mapHeight = this.game.map.height * scaledTileSize;

      cameraX = Math.max(0, Math.min(cameraX, mapWidth - this.canvas.width));
      cameraY = Math.max(0, Math.min(cameraY, mapHeight - this.canvas.height));
    }

    this.drawMap(cameraX, cameraY);
    this.drawEntities(cameraX, cameraY);
  }

  private drawMap(cameraX: number, cameraY: number) {
    const map = this.game.map;
    const tileSize = map.tileSize; // 16
    const scale = 2; // Zoom level
    const scaledTileSize = tileSize * scale;

    // Calculate visible range
    const startCol = Math.floor(cameraX / scaledTileSize);
    const endCol = startCol + this.canvas.width / scaledTileSize + 1;
    const startRow = Math.floor(cameraY / scaledTileSize);
    const endRow = startRow + this.canvas.height / scaledTileSize + 1;

    // Offset validation to avoid drawing glitches at edges
    // const offsetX = -cameraX + startCol * scaledTileSize;
    // const offsetY = -cameraY + startRow * scaledTileSize;

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;

        const tileData = map.getTile(x, y);

        // Calculate screen position relative to camera
        const screenX = x * scaledTileSize - cameraX;
        const screenY = y * scaledTileSize - cameraY;

        if (Array.isArray(tileData)) {
          tileData.forEach((tileIndex) => {
            this.drawTile(tileIndex, screenX, screenY, scaledTileSize);
          });
        } else if (typeof tileData === 'number' && tileData !== 0) {
          this.drawTile(tileData, screenX, screenY, scaledTileSize);
        }
      }
    }
  }

  private drawTile(tileIndex: number, x: number, y: number, size: number) {
    const tilesheetWidth = this.tileset.width / 16; // 16px tiles
    const sx = (tileIndex % tilesheetWidth) * 16;
    const sy = Math.floor(tileIndex / tilesheetWidth) * 16;

    // Round coordinates to avoid sub-pixel blurring
    this.ctx.drawImage(this.tileset, sx, sy, 16, 16, Math.floor(x), Math.floor(y), size, size);
  }

  private drawEntities(cameraX: number, cameraY: number) {
    const entities = this.game.entities.entities;
    // Sort entities by Y to simulate depth
    const sortedEntities = Array.from(entities.values()).sort((a, b) => a.y - b.y);

    sortedEntities.forEach((entity) => {
      this.drawEntity(entity, cameraX, cameraY);
    });
  }

  private drawEntity(entity: Entity, cameraX: number, cameraY: number) {
    const scale = 2;
    const tileSize = this.game.map.tileSize * scale;
    // Cast to unknown then EntityKind to satisfy TS
    const mapping = EntityKindMap[entity.kind as unknown as EntityKind];
    if (!mapping) return; // Unknown entity kind

    const spriteId = mapping[0]; // e.g. 'warrior', 'rat', 'clotharmor'

    // Load sprite if needed
    if (!this.sprites.has(spriteId) && !this.loadingSprites.has(spriteId)) {
      this.loadSprite(spriteId);
    }

    const img = this.sprites.get(spriteId);
    const data = this.spriteData.get(spriteId);

    if (img && data) {
      // Calculate frame
      const isMoving = performance.now() - entity.lastMove < 200; // Moving if updated recently
      const action = isMoving ? 'walk' : 'idle';

      let orientationStr = 'down';
      switch (entity.orientation) {
        case Orientation.UP:
          orientationStr = 'up';
          break;
        case Orientation.DOWN:
          orientationStr = 'down';
          break;
        case Orientation.LEFT:
          orientationStr = 'left';
          break;
        case Orientation.RIGHT:
          orientationStr = 'right';
          break;
      }

      const animKey = `${action}_${orientationStr}`;
      const anim = data.animations[animKey];

      if (anim) {
        const frameTime = 200; // ms per frame
        // If walking, use global time. If attacking (future), use localized time.
        const frameIndex = Math.floor(Date.now() / frameTime) % anim.length;

        const sx = frameIndex * data.width;
        const sy = anim.row * data.height;

        const screenX = entity.x * tileSize + (data.offset_x || 0) * scale - cameraX;
        const screenY = entity.y * tileSize + (data.offset_y || 0) * scale - cameraY;

        this.ctx.drawImage(
          img,
          sx,
          sy,
          data.width,
          data.height,
          Math.floor(screenX),
          Math.floor(screenY),
          data.width * scale,
          data.height * scale,
        );

        // Debug Name
        if (entity.id === this.game.entities.playerId) {
          // Draw name tag
          this.ctx.font = '10px Arial';
          this.ctx.fillStyle = 'white';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('You', screenX + (data.width * scale) / 2, screenY - 5);
        }

        return;
      }
    }

    // Fallback: draw colored rect
    const x = entity.x * tileSize - cameraX;
    const y = entity.y * tileSize - cameraY;
    this.ctx.fillStyle = entity.id === this.game.entities.playerId ? 'yellow' : 'red';
    this.ctx.fillRect(Math.floor(x), Math.floor(y), tileSize, tileSize);
  }

  private async loadSprite(id: string) {
    this.loadingSprites.add(id);
    try {
      // Load JSON
      const res = await fetch(`/sprites/${id}.json`);
      if (!res.ok) throw new Error(`Failed to load sprite json: ${id}`);
      const data: SpriteData = await res.json();
      this.spriteData.set(id, data);

      // Load Image
      const img = new Image();
      img.src = `/img/1/${id}.png`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      this.sprites.set(id, img);
    } catch (e) {
      console.error(`Error loading sprite ${id}:`, e);
    } finally {
      this.loadingSprites.delete(id);
    }
  }
}
