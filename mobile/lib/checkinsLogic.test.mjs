import assert from 'node:assert/strict';
import { checkinFromDb, summarize, todayUtc } from './checkinsLogic.ts';

const today = '2026-10-10';
const rows = [
  checkinFromDb({ member_id: 1, day: today, state: 'fit' }),
  checkinFromDb({ member_id: 2, day: today, state: 'sore', note: 'calf' }),
  checkinFromDb({ member_id: 3, day: '2026-10-09', state: 'unwell' }),
  checkinFromDb({ member_id: 4, day: today, state: 'bogus' }),
];
const s = summarize(rows, [1, 2, 3, 4, 5], today);
assert.equal(s.answered, 3);
assert.deepEqual(s.counts, { fit: 2, tired: 0, sore: 1, unwell: 0 });
assert.deepEqual(s.attention.map((r) => r.memberId), [2]);
assert.deepEqual(s.missing, [3, 5], 'yesterday does not count');
assert.equal(todayUtc(new Date('2026-10-10T23:30:00Z')), '2026-10-10');
console.log('checkins ok');
