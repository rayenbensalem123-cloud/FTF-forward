import assert from 'node:assert/strict';
import { campFromDb, campState, dmy, groupByDay } from './campsLogic.ts';

const c = campFromDb({ id: 3, name: 'March camp', start_date: '2026-03-01', end_date: '2026-03-05', players: [1, '2', 'x'], images: ['https://a/b.jpg', 'blob:zzz'],
  program: [{ day: 'Day 1', time: '9:00', activity: 'Fitness' }, { day: 'Day 1', time: '16:00', activity: 'Friendly' }, { day: 'Day 2', time: '9:00', activity: 'Video' }],
  staff_roles: [{ memberId: 7, role: 'Head Coach' }, null] });
assert.deepEqual(c.players, [1, 2]);
assert.equal(c.images.length, 1);
assert.equal(c.staffRoles.length, 1);
assert.equal(groupByDay(c.program).length, 2);
assert.equal(groupByDay(c.program)[0].items.length, 2);
assert.equal(campState(c, '2026-02-01'), 'upcoming');
assert.equal(campState(c, '2026-03-03'), 'live');
assert.equal(campState(c, '2026-03-06'), 'done');
assert.equal(dmy('2026-03-01'), '01/03/2026');
assert.equal(dmy(''), '—');
assert.deepEqual(campFromDb({ id: 1 }).program, []);
console.log('camps ok');
