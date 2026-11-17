'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { createLocalStore } from './local-store';

const store = createLocalStore('privacy-hidden');

interface PrivacyContextValue {
  hidden: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  hidden: false,
  toggle: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  // Read through the store rather than a useState initializer: the server has
  // no localStorage, so initializing from it makes the first client render
  // disagree with the server HTML.
  const raw = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const hidden = raw === 'true';

  const toggle = useCallback(() => {
    store.set(store.getSnapshot() === 'true' ? 'false' : 'true');
  }, []);

  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);

  return (
    <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function Blur({ children }: { children: ReactNode }) {
  const { hidden } = usePrivacy();
  if (!hidden) return <>{children}</>;
  return (
    <span className="select-none blur-md transition-all duration-200">
      {children}
    </span>
  );
}
