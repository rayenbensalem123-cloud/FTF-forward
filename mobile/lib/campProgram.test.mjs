import * as t from './campProgram.ts';
import assert from 'node:assert/strict';

// normName folds accents, case and punctuation.
assert.equal(t.normName('Béchir Abla'), 'bechirabla');
assert.equal(t.normName('  S. Gharbi '), 'sgharbi');
assert.equal(t.normName(''), '');

const P = (id, name) => ({ id, name });
const roster = [
  P(1, 'Sarra Gharbi'),
  P(2, 'Yasmine Ben Amor'),
  P(3, 'Mariem Mcharek'),
  P(4, 'Sana Bouazizi'),
  P(5, 'Nour Haddad'),
];

// Initial + last name finds the card even on a 100+ roster.
assert.equal(t.matchPlayerId('S. Gharbi', roster), 1);
assert.equal(t.matchPlayerId('Y. Ben Amor', roster), 2);
assert.equal(t.matchPlayerId('M. Mcharek', roster), 3);
// Full first name, no dot, different spacing.
assert.equal(t.matchPlayerId('Sarra Gharbi', roster), 1);
assert.equal(t.matchPlayerId('yasmine ben-amor', roster), 2);
// Last name only: unambiguous still resolves.
assert.equal(t.matchPlayerId('Haddad', roster), 5);
// The parser often keeps only the tail of a compound name ("Ben Amor"
// for "Yasmine Ben Amor") -- still links, because words align at the end.
assert.equal(t.matchPlayerId('Ben Amor', roster), 2);
assert.equal(t.matchPlayerId('Y. Ben Amor', roster), 2);
// Two players share the last name and the initial -> resolves to nobody,
// because showing a private line to the wrong player is worse than hiding it.
assert.equal(t.matchPlayerId('S. Gharbi', [P(1, 'Sarra Gharbi'), P(4, 'Sana Gharbi')]), null);
// Different initial on the same last name.
assert.equal(t.matchPlayerId('X. Gharbi', roster), null);
// Not a player at all.
assert.equal(t.matchPlayerId('Medical Check', roster), null);
assert.equal(t.matchPlayerId('', roster), null);

// groupByDay keeps day order and line order, and carries the day header.
const acts = [
  { id: 'a', dayIndex: 1, dayLabel: 'Day 2', seq: 0, time: '10:00', activity: 'Training', playerId: null, playerLabel: '' },
  { id: 'b', dayIndex: 0, dayLabel: 'Day 1', seq: 1, time: '12:00', activity: 'Lunch', playerId: null, playerLabel: '' },
  { id: 'c', dayIndex: 0, dayLabel: 'Day 1', seq: 0, time: '09:00', activity: 'Wake up', playerId: null, playerLabel: '' },
];
const days = t.groupByDay(acts);
assert.equal(days.length, 2);
assert.equal(days[0].dayLabel, 'Day 1');
assert.deepEqual(days[0].activities.map((a) => a.time), ['09:00', '12:00']);
assert.equal(days[1].dayLabel, 'Day 2');
assert.equal(t.groupByDay([]).length, 0);

// activitiesFromParsed numbers the days in order of first appearance.
const parsed = t.activitiesFromParsed([
  { id: 'act-0', day: 'Day ONE', time: '09:00', activity: 'Waking up', type: 'collective' },
  { id: 'act-1', day: 'Day ONE', time: '11:30', activity: 'Meeting with Coach', type: 'private', playerName: 'S. Gharbi' },
  { id: 'act-2', day: '21 Oct', time: '10:00', activity: 'Training', type: 'collective' },
  { id: 'act-3', time: '22:00', activity: 'Lights out', type: 'collective' }, // no day header
]);
assert.deepEqual(parsed.map((a) => a.dayIndex), [0, 0, 1, 2]);
assert.equal(parsed[0].dayLabel, 'Day ONE');
assert.equal(parsed[3].dayLabel, 'Day 1'); // falls back to a labelled day
assert.equal(parsed[1].playerLabel, 'S. Gharbi');
assert.equal(parsed[1].playerId, null); // linked later, against the roster
assert.equal(parsed[0].playerLabel, '');
assert.deepEqual(t.groupByDay(parsed).map((d) => d.activities.length), [2, 1, 1]);

console.log('campProgram ok');
