/** Minimal in-memory LRU with time-to-live. Good enough for a single API instance. */
export class TtlCache<V> {
  readonly #entries = new Map<string, { value: V; expires: number }>();
  readonly #max: number;
  readonly #ttlMs: number;

  constructor(max: number, ttlMs: number) {
    this.#max = max;
    this.#ttlMs = ttlMs;
  }

  get(key: string): V | undefined {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.#entries.delete(key);
      return undefined;
    }
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    this.#entries.delete(key);
    this.#entries.set(key, { value, expires: Date.now() + this.#ttlMs });
    while (this.#entries.size > this.#max) {
      const oldest = this.#entries.keys().next().value;
      if (oldest === undefined) break;
      this.#entries.delete(oldest);
    }
  }

  get size(): number {
    return this.#entries.size;
  }
}
