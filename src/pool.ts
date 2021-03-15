export class PooledObject {
  private __locks = 0;

  __acquire(): void {
    this.__locks++;
  }

  __release(): void {
    if (--this.__locks < 0) throw new Error('Unmatched call to release()');
  }

  get available(): boolean {
    return this.__locks === 0;
  }
}


export class Pool<T extends PooledObject> {
  readonly pool: T[];
  private next = 0;

  constructor(readonly Class: {new() : T}, initialSize = 10) {
    this.pool = new Array(initialSize);
    for (let i = 0; i < initialSize; i++) {
      this.pool[i] = new Class();
    }
  }

  borrow(): T {
    let next = this.next;
    const initial = next;
    const length = this.pool.length;
    while (!this.pool[next].available) {
      next += 1;
      if (next === length) next = 0;
      if (next === initial) break;
    }
    let item = this.pool[next];
    if (!item) {
      item = new this.Class();
      this.pool.push(item);
      next = 0;
    }
    this.next = next;
    item.__acquire();
    return item;
  }
}
