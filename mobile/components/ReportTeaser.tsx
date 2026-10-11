import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import type { Player } from '@/types';

/**
 * The body of the Players Report card: a ranked leaderboard of the top three
 * scorers. A report reads as rows of names and numbers, so the visual is
 * exactly that -- a gold rank numeral, the name and position, and the goals
 * with a bar scaled to the card maximum. The radar it replaces was the same
 * visual as the scouting card and said nothing on its own.
 */
export function ReportTeaser({ players }: { players: Player[] }) {
  const top = [...players].sort((a, b) => b.goals - a.goals || b.caps - a.caps).slice(0, 3);
  const max = top.reduce((m, p) => Math.max(m, p.goals), 0);

  if (top.length === 0) return null;

  return (
    <View style={styles.list}>
      {top.map((p, i) => (
        <View key={p.id} style={styles.row}>
          <Text style={styles.rank}>{i + 1}</Text>
          <View style={styles.who}>
            <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.meta}>{p.position} · #{p.number}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.goals}>{p.goals}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${max > 0 ? Math.max((p.goals / max) * 100, 8) : 0}%` }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank: {
    fontFamily: fonts.display, fontSize: 20, fontWeight: '700',
    color: colors.gold, width: 20, textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  who: { flex: 1, minWidth: 0 },
  name: { color: colors.white, fontSize: 12, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.4, marginTop: 1 },
  stat: { alignItems: 'flex-end', width: 44 },
  goals: { color: colors.white, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 3, width: '100%', borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.gold },
});
