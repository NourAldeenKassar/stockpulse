interface Entry {
  at: number;
  value: unknown;
}

/**
 * Short-lived response cache that also collapses concurrent calls.
 *
 * Two things make this necessary upstream of a rate-limited API. A page load
 * asks for the same data more than once (the dashboard and the market overview
 * both want positions), and the rate limiter waits rather than failing, so
 * duplicate calls do not error — they queue, and the page appears to hang.
 *
 * Deduplicating in flight means simultaneous callers share one upstream
 * request; the TTL means a reload moments later costs nothing at all.
 */
export class TtlCache {
  private readonly entries = new Map<string, Entry>();
  private readonly inflight = new Map<string, Promise<unknown>>();

  async getOrLoad<T>(
    key: string,
    ttlMs: number,
    load: () => Promise<T>,
  ): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && Date.now() - cached.at < ttlMs) {
      return cached.value as T;
    }

    const pending = this.inflight.get(key);
    if (pending) return pending as Promise<T>;

    const request = load()
      .then((value) => {
        this.entries.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => {
        // Only clear if this is still the current request for the key.
        if (this.inflight.get(key) === request) this.inflight.delete(key);
      });

    this.inflight.set(key, request);
    return request;
  }

  /** Drops a cached value so the next read goes upstream. */
  invalidate(key: string): void {
    this.entries.delete(key);
  }

  /** Drops everything. In-flight requests are left to settle. */
  clear(): void {
    this.entries.clear();
  }
}
