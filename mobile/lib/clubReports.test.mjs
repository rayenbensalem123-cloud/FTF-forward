import assert from 'node:assert/strict';
import { COMPETITIONS, POSITIONS, buildPayload, emptyForm, newPendingReports, reportFromDb } from './clubReportsLogic.ts';

assert.deepEqual(COMPETITIONS, ['League', 'Cup', 'Friendly']);
assert.deepEqual(POSITIONS, ['GK', 'DEF', 'MID', 'FWD']);

assert.equal(buildPayload({ ...emptyForm }, '2026-10-09').error, 'opponent');

const ok = buildPayload({ ...emptyForm, opponent: ' PSG ', competition: 'Cup', position: 'MID', goals: '2', rating: '12', isStarting: 'yes', hadInjury: 'no' }, '2026-10-09').payload;
assert.equal(ok.opponent, 'PSG');
// The date is always the day it was sent, never typed by the player.
assert.equal(ok.match_date, '2026-10-09');
assert.equal(ok.competition, 'Cup');
assert.equal(ok.position_played, 'MID');
assert.equal(ok.goals, 2);
assert.equal(ok.rating, 10);
assert.equal(ok.is_starting, true);
assert.equal(ok.had_injury, false);

const blank = buildPayload({ ...emptyForm, opponent: 'PSG' }, '2026-10-09').payload;
assert.ok(!('competition' in blank), 'a competition the player left alone is not stored');
assert.equal(blank.match_date, '2026-10-09');

const dnp = buildPayload({ ...emptyForm, opponent: 'PSG', didNotPlay: true, goals: '3', position: 'ST', rating: '8' }, '2026-10-09').payload;
assert.equal(dnp.goals, 0);
assert.equal(dnp.minutes_played, 0);
assert.ok(!('position_played' in dnp) && !('rating' in dnp));

const r = reportFromDb({ id: 1, member_id: 5, opponent: 'A', rating: '7.5', verified: true });
assert.equal(r.rating, 7.5);
assert.equal(r.verified, true);
assert.equal(r.minutes, 0);

// The staff alert: only reports nobody has been told about, and never a verified one.
const rows = [
  reportFromDb({ id: 10, member_id: 1, opponent: 'A', verified: false }),
  reportFromDb({ id: 11, member_id: 2, opponent: 'B', verified: true }),
  reportFromDb({ id: 12, member_id: 3, opponent: 'C', verified: false }),
];
assert.deepEqual(newPendingReports(new Set(), rows).map((x) => x.id), [10, 12]);
assert.deepEqual(newPendingReports(new Set([10]), rows).map((x) => x.id), [12]);
assert.deepEqual(newPendingReports(new Set([10, 12]), rows), []);
console.log('clubReports ok');
