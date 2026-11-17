/**
 * A localStorage key exposed as an external store.
 *
 * Reading localStorage during render causes a hydration mismatch, and reading
 * it in a mount effect means a synchronous setState. useSyncExternalStore is
 * the supported way out: it serves the server snapshot during hydration and
 * the real value afterwards.
 */
export interface LocalStore {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => string | null;
  getServerSnapshot: () => string | null;
  set: (value: string) => void;
  clear: () => void;
}

export function createLocalStore(key: string): LocalStore {
  const listeners = new Set<() => void>();
  let cache: string | null = null;
  let loaded = false;

  function read(): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function invalidate() {
    loaded = false;
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) invalidate();
  }

  return {
    subscribe(onChange) {
      if (listeners.size === 0 && typeof window !== 'undefined') {
        window.addEventListener('storage', onStorage);
      }
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0 && typeof window !== 'undefined') {
          window.removeEventListener('storage', onStorage);
        }
      };
    },

    // Must return a referentially stable value or React re-renders forever.
    getSnapshot() {
      if (!loaded) {
        cache = read();
        loaded = true;
      }
      return cache;
    },

    getServerSnapshot() {
      return null;
    },

    set(value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Private browsing: the value just will not persist.
      }
      cache = value;
      loaded = true;
      listeners.forEach((listener) => listener());
    },

    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        // nothing to remove
      }
      cache = null;
      loaded = true;
      listeners.forEach((listener) => listener());
    },
  };
}
