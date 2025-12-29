export class Entity {
  id;
  type;
  kind;
  x;
  y;
  constructor(id, type, kind, x, y) {
    this.id = id;
    this.type = type;
    this.kind = kind;
    this.x = x;
    this.y = y;
  }
  destroy() {}
  getBaseState() {
    return [this.id, this.kind, this.x, this.y];
  }
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
}
