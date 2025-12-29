import { Log } from './Log';

export class Map {
  // private game: Game;
  public width = 0;
  public height = 0;
  public tileSize = 16;
  public data: any = null;
  public loaded = false;
  private collisionSet: Set<number> = new Set();

  public async load(url: string) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.data = data;
      this.width = data.width;
      this.height = data.height;
      this.tileSize = data.tilesize || 16;
      this.loaded = true;
      this.collisionSet = new Set(data.collisions);
      Log.info('Map loaded', this.width, this.height);
    } catch (e) {
      Log.error('Failed to load map', e);
    }
  }

  public isLoaded() {
    return this.loaded;
  }

  public getTile(x: number, y: number) {
    if (!this.loaded || x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    const index = y * this.width + x;
    return this.data.data[index];
  }

  public isColliding(x: number, y: number) {
    if (!this.loaded || x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
    const tile = this.getTile(x, y);
    return this.collisionSet.has(tile);
  }
}
