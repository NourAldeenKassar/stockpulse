import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  it('allows calls up to the limit without delay', async () => {
    const limiter = new RateLimiter();
    const started = Date.now();

    await limiter.acquire('k', { maxCalls: 3, windowMs: 1000 });
    await limiter.acquire('k', { maxCalls: 3, windowMs: 1000 });
    await limiter.acquire('k', { maxCalls: 3, windowMs: 1000 });

    expect(Date.now() - started).toBeLessThan(50);
  });

  it('delays the call that exceeds the window', async () => {
    const limiter = new RateLimiter();
    const config = { maxCalls: 2, windowMs: 200 };
    const started = Date.now();

    await limiter.acquire('k', config);
    await limiter.acquire('k', config);
    await limiter.acquire('k', config);

    expect(Date.now() - started).toBeGreaterThanOrEqual(190);
  });

  // The previous implementation read the call log, checked it and recorded the
  // call without a lock. Concurrent callers all read the same snapshot, all
  // slept for the same duration and then all fired at once. Spacing the
  // acquisitions one window apart is what that version could not do.
  it('serialises concurrent callers instead of releasing them together', async () => {
    const limiter = new RateLimiter();
    const config = { maxCalls: 1, windowMs: 200 };
    const started = Date.now();

    const elapsed = await Promise.all(
      [0, 1, 2].map(async () => {
        await limiter.acquire('k', config);
        return Date.now() - started;
      }),
    );

    elapsed.sort((a, b) => a - b);
    expect(elapsed[0]).toBeLessThan(50);
    expect(elapsed[1]).toBeGreaterThanOrEqual(190);
    expect(elapsed[2]).toBeGreaterThanOrEqual(390);
  });

  it('keeps separate budgets per key', async () => {
    const limiter = new RateLimiter();
    const config = { maxCalls: 1, windowMs: 500 };
    const started = Date.now();

    await Promise.all([
      limiter.acquire('account-a:positions', config),
      limiter.acquire('account-b:positions', config),
    ]);

    expect(Date.now() - started).toBeLessThan(50);
  });
});
