import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

/**
 * A miniature football pitch: green, marked with a halfway line, centre circle
 * and both boxes, with dots for players. Used inside the tactic-board and
 * match-analysis feature cards, where a real pitch reads at a glance in a way
 * a list of names does not.
 *
 * Positions are percentages, so the same component draws either formation.
 */
export function PitchDiagram({
  players,
  showLabels = true,
}: {
  /** x/y as percentages of the pitch. */
  players: { x: number; y: number; label?: string }[];
  showLabels?: boolean;
}) {
  return (
    <View style={styles.pitch}>
      <View style={styles.halfway} />
      <View style={styles.circle} />
      <View style={styles.boxTop} />
      <View style={styles.boxBottom} />
      {players.map((p, i) => (
        <View key={i} style={[styles.dot, { left: `${p.x}%`, top: `${p.y}%` }]}>
          {showLabels && !!p.label && <Text style={styles.dotLabel} numberOfLines={1}>{p.label}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pitch: {
    height: 76,
    borderRadius: 8,
    backgroundColor: '#1E7A3C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  halfway: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  circle: {
    position: 'absolute', left: '50%', top: '50%', width: 34, height: 34,
    marginLeft: -17, marginTop: -17, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  boxTop: {
    position: 'absolute', left: '50%', top: 0, width: '34%', height: '16%',
    marginLeft: '-17%', borderWidth: 1, borderTopWidth: 0, borderColor: 'rgba(255,255,255,0.3)',
  },
  boxBottom: {
    position: 'absolute', left: '50%', bottom: 0, width: '34%', height: '16%',
    marginLeft: '-17%', borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.3)',
  },
  dot: {
    position: 'absolute', width: 16, height: 16, marginLeft: -8, marginTop: -8,
    borderRadius: 8, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)',
  },
  dotLabel: { color: '#06210F', fontSize: 7, fontWeight: '800' },
});
