import { TtlCache } from './ttl-cache.js';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('TtlCache', () => {
  it('serves a cached value without calling the loader again', async () => {
    const cache = new TtlCache();
    let calls = 0;
    const load = () => {
      calls++;
      return Promise.resolve('value');
    };

    expect(await cache.getOrLoad('k', 1000, load)).toBe('value');
    expect(await cache.getOrLoad('k', 1000, load)).toBe('value');
    expect(calls).toBe(1);
  });

  it('reloads once the entry has expired', async () => {
    const cache = new TtlCache();
    let calls = 0;
    const load = () => Promise.resolve(++calls);

    await cache.getOrLoad('k', 50, load);
    await sleep(70);
    await cache.getOrLoad('k', 50, load);

    expect(calls).toBe(2);
  });

  // The reason this exists: a page load asks for positions twice at once, and
  // the rate limiter makes the second caller wait rather than fail.
  it('collapses concurrent callers into one upstream request', async () => {
    const cache = new TtlCache();
    let calls = 0;
    const load = async () => {
      calls++;
      await sleep(30);
      return 'shared';
    };

    const results = await Promise.all([
      cache.getOrLoad('k', 1000, load),
      cache.getOrLoad('k', 1000, load),
      cache.getOrLoad('k', 1000, load),
    ]);

    expect(results).toEqual(['shared', 'shared', 'shared']);
    expect(calls).toBe(1);
  });

  it('keeps separate entries per key', async () => {
    const cache = new TtlCache();
    const a = await cache.getOrLoad('a', 1000, () => Promise.resolve('A'));
    const b = await cache.getOrLoad('b', 1000, () => Promise.resolve('B'));
    expect([a, b]).toEqual(['A', 'B']);
  });

  it('does not cache a failure, and recovers on the next call', async () => {
    const cache = new TtlCache();
    let calls = 0;
    const load = () => {
      calls++;
      return calls === 1
        ? Promise.reject(new Error('upstream down'))
        : Promise.resolve('ok');
    };

    await expect(cache.getOrLoad('k', 1000, load)).rejects.toThrow(
      'upstream down',
    );
    expect(await cache.getOrLoad('k', 1000, load)).toBe('ok');
  });

  it('goes upstream again after invalidate', async () => {
    const cache = new TtlCache();
    let calls = 0;
    const load = () => Promise.resolve(++calls);

    await cache.getOrLoad('k', 10_000, load);
    cache.invalidate('k');
    await cache.getOrLoad('k', 10_000, load);

    expect(calls).toBe(2);
  });
});
