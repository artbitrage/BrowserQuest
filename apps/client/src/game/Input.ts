import type { Game } from './Game';
// import { Orientation } from '@bq/shared'; // If needed, but we don't strictly use it here yet except for logic

export class Input {
  private game: Game;
  private activeKeys: Set<string> = new Set();
  private lastMoveTime = 0;
  private moveCooldown = 200; // ms per tile

  constructor(game: Game) {
    this.game = game;
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  // Helper init if needed, but constructor handles it now.
  public init() {
    // no-op or specific re-init
  }

  /*
  private onMouseDown(_event: MouseEvent) {
    if (!this.game.entities.playerId) return;
    // Placeholder for future mouse interaction
  }
  */

  private onKeyDown(event: KeyboardEvent) {
    this.activeKeys.add(event.code);
    if (event.code === 'Space') {
      this.game.network.sendAttack();
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    this.activeKeys.delete(event.code);
  }

  public update() {
    if (!this.game.entities.playerId) return;
    const player = this.game.entities.get(this.game.entities.playerId);
    if (!player) return;

    const now = performance.now();
    if (now - this.lastMoveTime < this.moveCooldown) return;

    let dx = 0;
    let dy = 0;

    if (this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp')) dy = -1;
    else if (this.activeKeys.has('KeyS') || this.activeKeys.has('ArrowDown')) dy = 1;
    else if (this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft')) dx = -1;
    else if (this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight')) dx = 1;

    if (dx !== 0 || dy !== 0) {
      const targetX = player.x + dx;
      const targetY = player.y + dy;

      if (!this.game.map.isColliding(targetX, targetY)) {
        this.game.network.sendMove(targetX, targetY);
        this.lastMoveTime = now;
      }
    }
  }
}
