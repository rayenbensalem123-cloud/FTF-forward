import assert from 'node:assert/strict';
import { dmyToIso, buildPayload, emptyForm, reportFromDb } from './clubReportsLogic.ts';

assert.equal(dmyToIso('09/10/2026'), '2026-10-09');
assert.equal(dmyToIso('31/02/2026'), null);
assert.equal(dmyToIso('nope'), null);

assert.equal(buildPayload({ ...emptyForm }, '2026-10-09').error, 'opponent');
assert.equal(buildPayload({ ...emptyForm, opponent: 'X', date: '99/99/2026' }, '2026-10-09').error, 'date');

const ok = buildPayload({ ...emptyForm, opponent: ' PSG ', goals: '2', rating: '12', isStarting: 'yes', hadInjury: 'no' }, '2026-10-09').payload;
assert.equal(ok.opponent, 'PSG');
assert.equal(ok.match_date, '2026-10-09');
assert.equal(ok.goals, 2);
assert.equal(ok.rating, 10);
assert.equal(ok.is_starting, true);
assert.equal(ok.had_injury, false);
assert.ok(!('competition' in ok));

const dnp = buildPayload({ ...emptyForm, opponent: 'PSG', didNotPlay: true, goals: '3', position: 'ST', rating: '8' }, '2026-10-09').payload;
assert.equal(dnp.goals, 0);
assert.equal(dnp.minutes_played, 0);
assert.ok(!('position_played' in dnp) && !('rating' in dnp));

const r = reportFromDb({ id: 1, member_id: 5, opponent: 'A', rating: '7.5', verified: true });
assert.equal(r.rating, 7.5);
assert.equal(r.verified, true);
assert.equal(r.minutes, 0);
console.log('clubReports ok');
