export interface Cache<K, V> {
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): void;
  reset(): void;
}
