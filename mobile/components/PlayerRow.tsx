import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ForwardChevron } from '@/components/ForwardChevron';
import { colors, radius, space } from '@/constants/theme';
import type { Player } from '@/types';
import { Avatar } from './Avatar';
import { FitnessBadge } from './FitnessBadge';

export function PlayerRow({ player, onPress }: { player: Player; onPress: (p: Player) => void }) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={() => onPress(player)}
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, number ${player.number}, ${player.position}`}
    >
      <Avatar name={player.name} number={player.number} photoUrl={player.photoUrl} size={50} />
      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
        <View style={styles.meta}>
          <View style={styles.pill}><Text style={styles.pillText}>{player.position}</Text></View>
          <Text style={styles.club} numberOfLines={1}>{player.club}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <FitnessBadge status={player.status} />
      </View>
      <ForwardChevron />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, padding: space.md,
  },
  center: { flex: 1, minWidth: 0, gap: 5 },
  name: { color: colors.white, fontSize: 15, fontWeight: '800' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  club: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  right: { alignItems: 'flex-end' },
});
