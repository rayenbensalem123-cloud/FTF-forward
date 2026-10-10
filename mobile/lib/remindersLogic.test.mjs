import assert from 'node:assert/strict';
import { buildReminderPlan } from './remindersLogic.ts';

const now = new Date(2026, 9, 10, 12, 0).getTime();
const plan = buildReminderPlan({
  now,
  match: { date: '2026-10-20', opponent: 'Ghana' },
  meetings: [{ title: 'Video review', at: new Date(2026, 9, 11, 10, 0).toISOString() }, { title: 'Past', at: new Date(2026, 9, 1, 10, 0).toISOString() }],
  camps: [{ name: 'Camp A', start: '2026-10-15' }, { name: 'Camp old', start: '2026-09-01' }],
});
assert.deepEqual(plan.map((p) => p.title), ['Meeting in 30 minutes', 'Camp starts tomorrow', 'Match tomorrow', 'Match day']);
assert.equal(plan[0].at.getHours(), 9); assert.equal(plan[0].at.getMinutes(), 30);
assert.equal(plan[2].at.getDate(), 19); assert.equal(plan[2].at.getHours(), 18);
assert.equal(buildReminderPlan({ now }).length, 0);
assert.equal(buildReminderPlan({ now, match: { date: 'bad', opponent: 'x' } }).length, 0);
console.log('reminders ok');
