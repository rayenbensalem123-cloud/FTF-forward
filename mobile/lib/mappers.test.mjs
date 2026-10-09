import * as m from './mappers.ts';
import assert from 'node:assert/strict';
const now = new Date(2026, 9, 7);
assert.equal(m.ageFromBirthdate('05/03/2000', now), 26);
assert.equal(m.ageFromBirthdate('08/10/2000', now), 25);
assert.equal(m.ageFromBirthdate('2000-03-05', now), 26);
assert.equal(m.ageFromBirthdate('', now), 0);
assert.ok(m.isValidBirthdate('31/12/2001')); assert.ok(!m.isValidBirthdate('31/02/2001')); assert.ok(!m.isValidBirthdate('2001-01-01'));
const row = { id: 5, role: 'PLAYERS', name: 'A B', position: 'GOALKEEPER', team_category: 'U20', jersey_number: 1, goals: '3', nat_matches: '12', suspended: false, birthdate: '05/03/2005' };
let p = m.memberToPlayer(row, [], true); assert.equal(p.status, 'fit'); assert.equal(p.position, 'GK'); assert.equal(p.category, 'U-20'); assert.equal(p.caps, 12); assert.equal(p.goals, 3);
p = m.memberToPlayer(row, [], false); assert.equal(p.status, 'unknown');
p = m.memberToPlayer(row, [{ id: 1, member_id: 5, status: 'active', injury_type: 'ACL', notes: 'x' }], true); assert.equal(p.status, 'injured'); assert.equal(p.openInjuryId, 1); assert.equal(p.medicalNote, 'x');
p = m.memberToPlayer(row, [{ id: 2, member_id: 5, status: 'recovering' }], true); assert.equal(p.status, 'recovery');
p = m.memberToPlayer({ ...row, suspended: true }, [], true); assert.equal(p.status, 'suspended');
assert.equal(m.memberToPlayer({ ...row, role: 'COACHES' }, [], true), null);
const ms = [
 { id:1, opponent:'Morocco', date:'2026-10-10', competition:'X', category:'Seniors', venue:'', result:'', approved:true, tunisiaPossession:null },
 { id:2, opponent:'Algeria', date:'2026-09-01', competition:'X', category:'Seniors', venue:'', result:'2-0', approved:true, tunisiaPossession:60 },
 { id:3, opponent:'Ghana', date:'2026-09-10', competition:'X', category:'Seniors', venue:'', result:'1-1', approved:true, tunisiaPossession:50 },
 { id:4, opponent:'Egypt', date:'2026-08-10', competition:'X', category:'Seniors', venue:'', result:'0-3', approved:false, tunisiaPossession:null },
];
assert.equal(m.nextMatch(ms,'2026-10-07').id,1); assert.equal(m.nextMatch(ms,'2026-10-11'), null);
const f = m.recentForm(ms); assert.deepEqual(f.map(x=>x.result),['W','D']); assert.equal(f[0].opponent,'ALG');
assert.equal(m.averagePossession(ms),55);
const mm = m.matchFromDb({id:9,opponent:'T',match_date:'2026-10-12',category:'U17',details:{status:'pending',result:'1-0',venue:'V'}}); assert.equal(mm.approved,false); assert.equal(mm.category,'U-17');
const u = m.profileToUser({username:'u',first_name:'A',last_name:'B',role:'staff',permissions:{editPlayer:true,x:'no'},member_id:null}); assert.equal(u.name,'A B'); assert.equal(u.permissions.editPlayer,true); assert.equal(u.permissions.x,false);
const an = [m.announcementFromDb({id:1,title:'a',pinned:false,created_at:'2026-10-01T10:00:00Z'}), m.announcementFromDb({id:2,title:'b',pinned:false,created_at:'2026-10-05T10:00:00Z'}), m.announcementFromDb({id:3,title:'c',pinned:true,created_at:'2026-09-01T10:00:00Z'})];
assert.deepEqual(m.sortAnnouncements(an).map(x=>x.id),[3,2,1]);
console.log('mappers ok');
