import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Minus } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Avatar } from '@/components/Avatar';
import type { Player } from '@/types';

/**
 * The body of the Players Report card: the top three scorers as a plain list
 * -- a small photo avatar and the name on the left, a done-or-not indicator
 * on the right. Green filled check when the player is fit, a hollow muted
 * mark otherwise. No rank numerals, no bars: the card reads as a list, which
 * is what a report is.
 */
export function ReportTeaser({ players }: { players: Player[] }) {
  const top = [...players].sort((a, b) => b.goals - a.goals || b.caps - a.caps).slice(0, 3);

  if (top.length === 0) return null;

  return (
    <View style={styles.list}>
      {top.map((p) => {
        const done = p.status === 'fit';
        return (
          <View key={p.id} style={styles.row}>
            <Avatar name={p.name} number={p.number} photoUrl={p.photoUrl} size={30} />
            <View style={styles.who}>
              <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.meta}>{p.position} · #{p.number}</Text>
            </View>
            <View style={[styles.mark, done ? styles.markDone : styles.markIdle]}>
              {done ? <Check color={colors.white} size={12} strokeWidth={3} /> : <Minus color={colors.muted} size={12} strokeWidth={3} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  who: { flex: 1, minWidth: 0 },
  name: { color: colors.white, fontSize: 12, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.4, marginTop: 1 },
  mark: {
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  markDone: { backgroundColor: colors.green },
  markIdle: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.hairline },
});
