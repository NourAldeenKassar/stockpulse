export interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sliding-window limiter that serialises callers per key.
 *
 * Reserving is queued rather than checked-then-recorded, so two concurrent
 * callers cannot both observe room under the limit and both proceed.
 */
export class RateLimiter {
  private readonly calls = new Map<string, number[]>();
  private readonly queues = new Map<string, Promise<void>>();

  async acquire(key: string, config: RateLimitConfig): Promise<void> {
    const previous = this.queues.get(key) ?? Promise.resolve();
    const current = previous.then(() => this.reserve(key, config));

    // A rejected reservation must not poison the chain for later callers.
    const chained = current.catch(() => undefined);
    this.queues.set(key, chained);
    void chained.then(() => {
      if (this.queues.get(key) === chained) {
        this.queues.delete(key);
      }
    });

    return current;
  }

  private async reserve(key: string, config: RateLimitConfig): Promise<void> {
    for (;;) {
      const now = Date.now();
      const recent = (this.calls.get(key) ?? []).filter(
        (at) => at > now - config.windowMs,
      );

      if (recent.length < config.maxCalls) {
        recent.push(now);
        this.calls.set(key, recent);
        return;
      }

      // Wait until the oldest call leaves the window, then re-check.
      const waitMs = recent[0] + config.windowMs - now;
      this.calls.set(key, recent);
      await sleep(Math.max(waitMs, 10));
    }
  }
}
