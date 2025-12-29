import type { EntityKind, EntityType } from '@bq/shared';

export abstract class Entity {
  public id: string | number;
  public type: EntityType;
  public kind: EntityKind;
  public x: number;
  public y: number;
  public group: string | null = null;
  public recentlyLeftGroups: string[] = [];
  public area: any = null;

  constructor(id: string | number, type: EntityType, kind: EntityKind, x: number, y: number) {
    this.id = id;
    this.type = type;
    this.kind = kind;
    this.x = x;
    this.y = y;
  }

  destroy() {}

  protected getBaseState(): (number | string)[] {
    return [this.id, this.kind, this.x, this.y];
  }

  abstract getState(): (number | string)[];

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
