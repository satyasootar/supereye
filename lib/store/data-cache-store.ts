import { create } from 'zustand';

type CacheEntry<T = unknown> = {
  data: T;
  fetchedAt: number;
  stale: boolean;
};

type DataCacheState = {
  entries: Record<string, CacheEntry>;
  getEntry: <T>(key: string) => CacheEntry<T> | undefined;
  setEntry: <T>(key: string, data: T) => void;
  markNamespaceStale: (namespace: string) => void;
  removeNamespace: (namespace: string) => void;
  clear: () => void;
};

function serializeQueryKey(key: unknown): string {
  return JSON.stringify(key);
}

export const useDataCacheStore = create<DataCacheState>((set, get) => ({
  entries: {},

  getEntry: <T>(key: string) => {
    const entry = get().entries[key];
    if (!entry || entry.stale) return undefined;
    return entry as CacheEntry<T>;
  },

  setEntry: <T>(key: string, data: T) =>
    set((state) => ({
      entries: {
        ...state.entries,
        [key]: { data, fetchedAt: Date.now(), stale: false },
      },
    })),

  markNamespaceStale: (namespace: string) =>
    set((state) => {
      const needle = `"${namespace}"`;
      const next = { ...state.entries };
      for (const key of Object.keys(next)) {
        if (key.includes(needle)) {
          next[key] = { ...next[key], stale: true };
        }
      }
      return { entries: next };
    }),

  removeNamespace: (namespace: string) =>
    set((state) => {
      const needle = `"${namespace}"`;
      const next = { ...state.entries };
      for (const key of Object.keys(next)) {
        if (key.includes(needle)) delete next[key];
      }
      return { entries: next };
    }),

  clear: () => set({ entries: {} }),
}));

export function queryKeyToCacheKey(queryKey: unknown): string {
  return serializeQueryKey(queryKey);
}

export function invalidateClientCacheNamespaces(namespaces: string[]): void {
  const store = useDataCacheStore.getState();
  for (const ns of namespaces) {
    store.markNamespaceStale(ns);
  }
}
