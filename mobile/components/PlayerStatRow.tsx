import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/constants/theme';
import { Avatar } from '@/components/Avatar';

/**
 * A player stat row: crest avatar, name, position and number, then the stat
 * with a vertical bar whose height is the value relative to the row maximum.
 * The bar is what makes a list of numbers scannable without reading it.
 */
export function PlayerStatRow({
  name,
  number,
  position,
  photoUrl,
  stat,
  statLabel,
  max,
}: {
  name: string;
  number: number;
  position: string;
  photoUrl?: string;
  stat: number;
  statLabel: string;
  max: number;
}) {
  const ratio = max > 0 ? stat / max : 0;

  return (
    <View style={styles.row}>
      <Avatar name={name} number={number} photoUrl={photoUrl} size={40} />
      <View style={styles.who}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta}>{position} · #{number}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{stat}</Text>
        <Text style={styles.statLabel}>{statLabel}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.bar, { height: `${Math.max(ratio * 100, 6)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  who: { flex: 1, minWidth: 0 },
  name: { color: colors.white, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  stat: { alignItems: 'flex-end', marginRight: 10 },
  statValue: { color: colors.white, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 1 },
  barTrack: {
    width: 4, height: 34, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 2, backgroundColor: colors.green },
});
