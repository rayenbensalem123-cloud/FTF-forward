import assert from 'node:assert/strict';
import { matchDayState } from './matchDayLogic.ts';
const now = new Date(2026, 9, 31, 15, 0);
assert.equal(matchDayState('2026-10-31', now), 'today');
assert.equal(matchDayState('2026-11-01', now), 'tomorrow', 'month rollover');
assert.equal(matchDayState('2026-11-02', now), null);
assert.equal(matchDayState(undefined, now), null);
console.log('matchDay ok');
