export interface Store { get<T>(key: string): Promise<T | null>; set(key: string, value: unknown): Promise<void> }

/**
 * Network first, saved copy as the fallback. A fetch that throws (or, with `emptyIsFailure`, one that
 * returns nothing because the failure was swallowed) falls back to the last good copy; with no copy
 * the original error is thrown. A good result is saved for next time.
 */
export async function withCacheStore<T>(store: Store, key: string, fetcher: () => Promise<T>, emptyIsFailure = false): Promise<T> {
  try {
    const data = await fetcher();
    const empty = Array.isArray(data) && data.length === 0;
    if (!(emptyIsFailure && empty)) {
      await store.set(key, data);
      return data;
    }
    const saved = await store.get<T>(key);
    return saved ?? data;
  } catch (e) {
    const saved = await store.get<T>(key);
    if (saved != null) return saved;
    throw e;
  }
}
