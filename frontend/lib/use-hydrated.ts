'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during server rendering and the hydration pass, true afterwards.
 *
 * Use it to gate anything that cannot produce the same output on both sides,
 * such as locale- or timezone-dependent formatting.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
