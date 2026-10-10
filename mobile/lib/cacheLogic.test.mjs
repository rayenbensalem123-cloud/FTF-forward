import assert from 'node:assert/strict';
import { withCacheStore } from './cacheLogic.ts';

const mem = new Map();
const store = { get: async (k) => mem.get(k) ?? null, set: async (k, v) => void mem.set(k, v) };

assert.deepEqual(await withCacheStore(store, 'a', async () => [1, 2]), [1, 2]);
assert.deepEqual(mem.get('a'), [1, 2], 'saved');
assert.deepEqual(await withCacheStore(store, 'a', async () => { throw new Error('offline'); }), [1, 2], 'offline -> saved copy');
await assert.rejects(withCacheStore(store, 'none', async () => { throw new Error('offline'); }), /offline/);
assert.deepEqual(await withCacheStore(store, 'a', async () => [], true), [1, 2], 'swallowed failure -> saved copy');
assert.deepEqual(await withCacheStore(store, 'a', async () => []), [], 'a genuinely empty list is saved');
assert.deepEqual(mem.get('a'), []);
assert.deepEqual(await withCacheStore(store, 'fresh', async () => [], true), [], 'empty and nothing saved -> empty');
console.log('cache ok');
