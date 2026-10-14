import assert from 'node:assert/strict';
import { campsForUser, planSync, campSig } from './campCalendarLogic.ts';

const mk = (id, over = {}) => ({ id, name: 'C' + id, location: 'Tunis', start: '2026-11-01', end: '2026-11-05', category: 'SENIORS', program: [], players: [], staffRoles: [], reportUrl: '', reportName: '', images: [], ...over });
const camps = [mk(1, { players: [7] }), mk(2, { players: [8], staffRoles: [{ memberId: 4, role: 'Coach' }] }), mk(3, { players: [7], start: '' })];

assert.deepEqual(campsForUser(camps, { role: 'player', memberId: 7 }).map((c) => c.id), [1]); // undated camp skipped
assert.deepEqual(campsForUser(camps, { role: 'player', memberId: 99 }), []);
assert.deepEqual(campsForUser(camps, { role: 'staff', memberId: 4 }).map((c) => c.id), [2]);
assert.deepEqual(campsForUser(camps, { role: 'staff', memberId: 7 }), []); // player id must not match as staff
assert.deepEqual(campsForUser(camps, { role: 'player', memberId: null }), []);

const w = [camps[0]];
let p = planSync(w, {});
assert.equal(p.create.length, 1);
p = planSync(w, { 1: { id: 'e1', sig: campSig(camps[0]) } });
assert.deepEqual([p.create.length, p.update.length, p.remove.length], [0, 0, 0]);
p = planSync([mk(1, { players: [7], start: '2026-11-02' })], { 1: { id: 'e1', sig: campSig(camps[0]) } });
assert.equal(p.update.length, 1);
p = planSync([], { 1: { id: 'e1', sig: 'x' } });
assert.deepEqual(p.remove, ['1']);
console.log('campCalendarLogic tests passed');
