import { getJson, setJson } from '@/lib/storage';
import { withCacheStore } from '@/lib/cacheLogic';

/** Read-only screens (meetings, camps, staff, news) keep their last good copy, so they open with no signal. */
export const withCache = <T,>(key: string, fetcher: () => Promise<T>, emptyIsFailure = false) =>
  withCacheStore<T>({ get: getJson, set: setJson }, key, fetcher, emptyIsFailure);
