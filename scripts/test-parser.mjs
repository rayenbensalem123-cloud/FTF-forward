// Test the camp schedule parser with a realistic example
// Run: node scripts/test-parser.mjs

const testInput = `
Day ONE - 21 October 2026
09:00 Waking up
10:00 Training - Main Pitch
12:00 Lunch
14:00 Video Analysis - Team Meeting
16:00 Gym Session
18:00 Dinner
21:00 Lights out

Day TWO - 22 October 2026
08:00 Breakfast
09:30 Training - Tactical Drills
11:30 S. Gharbi: Meeting with Coach
12:30 Lunch
14:00 Pool Recovery
15:00 Y. Ben Amor: Physio Session
17:00 Free Time
19:00 Dinner
21:00 Lights out

Day THREE - 23 October 2026
09:00 Waking up
10:00 Match vs Nigeria - Stadium
12:00 Lunch
14:00 Debrief
16:00 M. Mcharek: Medical Check
18:00 Dinner
21:00 Lights out
`;

const ACTIVITY_KEYWORDS = [
  'waking up', 'wake up', 'training', 'lunch', 'dinner', 'breakfast',
  'match', 'meeting', 'therapy', 'gym', 'pool', 'stretch', 'yoga',
  'tactics', 'video analysis', 'team talk', 'medical', 'checkup',
  'recovery', 'massage', 'physio', 'nutrition', 'press', 'interview',
  'travel', 'arrival', 'departure', 'free time', 'rest', 'lights out',
  'briefing', 'debrief', 'warm up', 'cool down', 'fitness', 'running',
  'weights', 'skills', 'drills', 'scrimmage', 'practice', 'game',
];

const PRIVATE_INDICATORS = [
  'meeting with', 'private', 'one on one', '1:1', 'individual',
  'medical check', 'physio session', 'counseling', 'interview with',
  'coach talk', 'review', 'assessment', 'evaluation',
];

const TIME_REGEX = /(\d{1,2}):(\d{2})|(\d{1,2})\s*(am|pm|h)/gi;

function parseSchedule(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const activities = [];
  const playersMentioned = new Set();
  let currentDay = '';

  for (const line of lines) {
    const dayMatch = line.match(/(?:day\s+(?:\d+|one|two|three|four|five|six|seven))|(?:\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i);
    if (dayMatch && line.length < 50) {
      currentDay = dayMatch[0];
      continue;
    }

    const timeMatch = line.match(TIME_REGEX);
    if (!timeMatch) continue;

    const time = timeMatch[0];
    const timeIndex = line.indexOf(time);
    const beforeTime = line.substring(0, timeIndex).trim();
    const afterTime = line.substring(timeIndex + time.length).trim();

    const isPrivate = PRIVATE_INDICATORS.some(ind => line.toLowerCase().includes(ind));
    
    let playerName;
    if (isPrivate) {
      const colonMatch = line.match(/([A-Z][a-z]*\.?\s+[A-Z][a-z]+)\s*:/);
      if (colonMatch) {
        playerName = colonMatch[1];
      } else {
        const dashMatch = line.match(/[—–-]\s*([A-Z][a-z]*\.?\s+[A-Z][a-z]+)/);
        if (dashMatch) {
          playerName = dashMatch[1];
        } else {
          const nameMatch = line.match(/([A-Z][a-z]*\.?\s+[A-Z][a-z]+)/);
          if (nameMatch) {
            playerName = nameMatch[1];
          }
        }
      }
      if (playerName) {
        playersMentioned.add(playerName);
      }
    }

    let activity = beforeTime || afterTime || 'Activity';
    activity = activity.replace(/^[-–—]\s*/, '').trim();

    const hasKeyword = ACTIVITY_KEYWORDS.some(kw => activity.toLowerCase().includes(kw));
    if (!hasKeyword && !isPrivate) continue;

    activities.push({
      id: `act-${activities.length}`,
      day: currentDay || 'Day 1',
      time,
      activity,
      type: isPrivate ? 'private' : 'collective',
      playerName,
    });
  }

  return {
    days: activities,
    totalActivities: activities.length,
    collectiveCount: activities.filter(a => a.type === 'collective').length,
    privateCount: activities.filter(a => a.type === 'private').length,
    playersMentioned: Array.from(playersMentioned),
  };
}

const result = parseSchedule(testInput);

console.log('═══════════════════════════════════════');
console.log('  CAMP SCHEDULE PARSER TEST');
console.log('═══════════════════════════════════════\n');

console.log(`Total activities: ${result.totalActivities}`);
console.log(`Collective: ${result.collectiveCount}`);
console.log(`Private: ${result.privateCount}`);
console.log(`Players mentioned: ${result.playersMentioned.join(', ')}\n`);

console.log('───────────────────────────────────────');
console.log('  PARSED ACTIVITIES');
console.log('───────────────────────────────────────\n');

let currentDay = '';
for (const act of result.days) {
  if (act.day !== currentDay) {
    currentDay = act.day;
    console.log(`\n📅 ${currentDay}`);
    console.log('─'.repeat(40));
  }
  const typeIcon = act.type === 'private' ? '🔒' : '👥';
  const playerInfo = act.playerName ? ` (${act.playerName})` : '';
  console.log(`  ${typeIcon} ${act.time} — ${act.activity}${playerInfo}`);
}

console.log('\n\n───────────────────────────────────────');
console.log('  PRIVATE ACTIVITIES BREAKDOWN');
console.log('───────────────────────────────────────\n');

const privateActs = result.days.filter(a => a.type === 'private');
for (const act of privateActs) {
  console.log(`  ${act.day} ${act.time}: ${act.activity} → ${act.playerName}`);
}

console.log('\n✅ Parser test complete!\n');
