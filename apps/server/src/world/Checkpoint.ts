import { randomInt } from '@bq/shared';

export class Checkpoint {
  constructor(
    public id: number,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public isStartingArea: boolean,
  ) {}

  getRandomPosition(): { x: number; y: number } {
    return {
      x: this.x + randomInt(0, this.width - 1),
      y: this.y + randomInt(0, this.height - 1),
    };
  }
}
