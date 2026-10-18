import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ForwardChevron } from '@/components/ForwardChevron';
import { colors, fonts, radius, space } from '@/constants/theme';
import type { Player } from '@/types';
import { Avatar } from './Avatar';

/** Squad row: photo, jersey number, name with "Position · Club", chevron. No status. */
export function PlayerRow({ player, onPress }: { player: Player; onPress: (p: Player) => void }) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={() => onPress(player)}
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, number ${player.number}, ${player.position}`}
    >
      <Avatar name={player.name} size={48} photoUrl={player.photoUrl} />
      <Text style={styles.number}>{player.number || '–'}</Text>
      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {player.position}{player.club ? ` · ${player.club}` : ''}
        </Text>
      </View>
      <ForwardChevron />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, padding: space.md, minHeight: 68,
  },
  number: { width: 30, textAlign: 'center', color: colors.red, fontFamily: fonts.display, fontSize: 22 },
  center: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: colors.white, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12 },
});
