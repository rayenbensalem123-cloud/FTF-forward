import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@/constants/theme';
import { FORMATIONS } from '@/data/formations';
import type { FormationId, Player } from '@/types';

interface Props {
  formation: FormationId;
  /** One entry per slot, in the formation's slot order. */
  players: (Player | null)[];
  selected?: number | null;
  /** Leave undefined for a read-only pitch. */
  onSlotPress?: (index: number) => void;
}

const pct = (n: number) => `${n * 100}%` as `${number}%`;

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export function Pitch({ formation, players, selected, onSlotPress }: Props) {
  const slots = FORMATIONS[formation];

  return (
    <View style={styles.pitch}>
      {/* Markings */}
      <View style={styles.halfway} />
      <View style={styles.centerCircle} />
      <View style={[styles.box, styles.boxTop]} />
      <View style={[styles.box, styles.boxBottom]} />

      {slots.map((slot, i) => {
        const p = players[i] ?? null;
        const active = selected === i;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.slot, { left: pct(slot.x), top: pct(slot.y) }]}
            disabled={!onSlotPress}
            onPress={() => onSlotPress?.(i)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={p ? `${slot.label}: ${p.name}, number ${p.number}` : `${slot.label}: empty`}
          >
            <View style={[styles.circle, p ? styles.circleFilled : styles.circleEmpty, active && styles.circleActive]}>
              <Text style={[styles.circleText, !p && { color: colors.muted, fontSize: 11 }]}>{p ? p.number || '·' : slot.label}</Text>
            </View>
            <Text style={styles.label} numberOfLines={1}>{p ? lastName(p.name) : ''}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const LINE = 'rgba(255,255,255,0.18)';

const styles = StyleSheet.create({
  pitch: {
    width: '100%', aspectRatio: 0.78, backgroundColor: '#0E3B2E', borderRadius: 20,
    borderWidth: 1, borderColor: colors.goldBorder, overflow: 'hidden',
  },
  halfway: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: LINE },
  centerCircle: {
    position: 'absolute', left: '50%', top: '50%', width: 84, height: 84, marginLeft: -42, marginTop: -42,
    borderRadius: 42, borderWidth: 1, borderColor: LINE,
  },
  box: { position: 'absolute', left: '22%', right: '22%', height: '16%', borderWidth: 1, borderColor: LINE },
  boxTop: { top: 0, borderTopWidth: 0 },
  boxBottom: { bottom: 0, borderBottomWidth: 0 },
  slot: { position: 'absolute', width: 72, marginLeft: -36, marginTop: -26, alignItems: 'center', gap: 3 },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  circleFilled: { backgroundColor: colors.red, borderColor: colors.white },
  circleEmpty: { backgroundColor: 'rgba(7,19,38,0.55)', borderColor: 'rgba(255,255,255,0.35)', borderStyle: 'dashed' },
  circleActive: { borderColor: colors.gold, borderStyle: 'solid', borderWidth: 3 },
  circleText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  label: {
    color: colors.white, fontSize: 11, fontWeight: '700', textAlign: 'center', maxWidth: 72, height: 14,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 },
  },
});
