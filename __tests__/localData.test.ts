import { describe, it, expect } from 'vitest';
import { clearLocalData } from '@/lib/localData';

// "Effacer mes données locales" is the button that makes the privacy promise
// true. It has to reach every surface this application can leave something on,
// and it has to keep going when one of them refuses.

function fakeStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    get size() {
      return map.size;
    },
    clear: () => map.clear(),
    keys: () => [...map.keys()]
  };
}

function fakeCaches(names: string[] = []) {
  let held = [...names];
  return {
    keys: async () => [...held],
    delete: async (name: string) => {
      const before = held.length;
      held = held.filter((n) => n !== name);
      return held.length < before;
    },
    remaining: () => held
  };
}

function fakeServiceWorkers(count = 1) {
  let registrations = Array.from({ length: count }, () => ({
    unregister: async () => {
      registrations = registrations.slice(1);
      return true;
    }
  }));
  return {
    getRegistrations: async () => [...registrations],
    remaining: () => registrations.length
  };
}

describe('clearLocalData', () => {
  it('empties local storage', async () => {
    const local = fakeStorage({ crible_test_v1: '{}', anything_else: 'x' });
    await clearLocalData({ local });
    expect(local.size).toBe(0);
  });

  it('empties session storage', async () => {
    const session = fakeStorage({ crible_compare_ref: '1aaa' });
    await clearLocalData({ session });
    expect(session.size).toBe(0);
  });

  it('deletes every cache the service worker wrote', async () => {
    // Cache Storage holds copies of pages, and it survives closing the tab.
    // A button that clears local storage and leaves it is not telling the
    // truth.
    const cacheStorage = fakeCaches(['crible-politique-v1', 'politicheck-v2']);
    await clearLocalData({ cacheStorage });
    expect(cacheStorage.remaining()).toEqual([]);
  });

  it('unregisters the service worker, so nothing repopulates the cache', async () => {
    const serviceWorkers = fakeServiceWorkers(2);
    await clearLocalData({ serviceWorkers });
    expect(serviceWorkers.remaining()).toBe(0);
  });

  it('reports what it actually cleared', async () => {
    const report = await clearLocalData({
      local: fakeStorage({ a: '1' }),
      session: fakeStorage(),
      cacheStorage: fakeCaches(['crible-politique-v1']),
      serviceWorkers: fakeServiceWorkers(1)
    });
    expect(report).toEqual({
      localStorage: true,
      sessionStorage: true,
      caches: 1,
      serviceWorkers: 1
    });
  });

  it('clears the other surfaces when one of them throws', async () => {
    // Storage can be unavailable (private mode, blocked cookies). A refusal on
    // one surface must not leave the others untouched.
    const cacheStorage = fakeCaches(['crible-politique-v1']);
    const report = await clearLocalData({
      local: {
        clear: () => {
          throw new Error('storage disabled');
        }
      } as unknown as Storage,
      cacheStorage
    });
    expect(report.localStorage).toBe(false);
    expect(cacheStorage.remaining()).toEqual([]);
    expect(report.caches).toBe(1);
  });

  it('is happy with a browser that offers none of them', async () => {
    expect(await clearLocalData({})).toEqual({
      localStorage: false,
      sessionStorage: false,
      caches: 0,
      serviceWorkers: 0
    });
  });
});
