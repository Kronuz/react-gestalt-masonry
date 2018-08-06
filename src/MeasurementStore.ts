import { Cache } from './Cache.js';

export default class MeasurementStore<T extends object, V> implements Cache<T, V> {
  map: WeakMap<T, V> = new WeakMap<T, V>();

  get(key: T): V | undefined {
    return this.map.get(key);
  }

  has(key: T): boolean {
    return this.map.has(key);
  }

  set(key: T, value: V): void {
    this.map.set(key, value);
  }

  reset(): void {
    this.map = new WeakMap<T, V>();
  }
}
