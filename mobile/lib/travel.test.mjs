import * as t from './travel.ts';
import assert from 'node:assert/strict';
assert.equal(t.weatherKind(0), 'clear'); assert.equal(t.weatherKind(2), 'partly'); assert.equal(t.weatherKind(61), 'rain'); assert.equal(t.weatherKind(95), 'storm'); assert.equal(t.weatherKind(73), 'snow'); assert.equal(t.weatherKind(45), 'fog');
const km = t.distanceKm(36.8065, 10.1815, 33.5731, -7.5898); // Tunis - Casablanca
assert.ok(km > 1600 && km < 1700, String(km));
assert.equal(t.distanceKm(1, 1, 1, 1), 0);
assert.equal(t.flightMinutes(20), 0);
assert.equal(t.flightMinutes(2000), 195); // 150 + 45
assert.equal(t.formatDuration(195), '3 h 15'); assert.equal(t.formatDuration(120), '2 h'); assert.equal(t.formatDuration(45), '45 min');
assert.equal(t.timeDifferenceHours(3600), 0); assert.equal(t.timeDifferenceHours(0), -1); assert.equal(t.timeDifferenceHours(7200), 1); assert.equal(t.timeDifferenceHours(19800), 4.5);
assert.deepEqual(t.placeCandidates('Stade Hammadi Agrebi, Radès'), ['Radès', 'Stade Hammadi Agrebi', 'Stade Hammadi Agrebi, Radès']);
assert.deepEqual(t.placeCandidates('Cairo'), ['Cairo']);
assert.equal(t.daysUntil('2026-10-10', '2026-10-08'), 2); assert.equal(t.daysUntil('2026-11-01', '2026-10-30'), 2); assert.equal(t.daysUntil('2026-10-07', '2026-10-08'), -1);
console.log('travel ok');
