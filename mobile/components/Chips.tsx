import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, space } from '@/constants/theme';

export interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Greys the control out and ignores taps (view-only roles). */
  disabled?: boolean;
}

/** Full-width segmented control (category / language switchers). */
export function Segmented<T extends string>({ options, value, onChange, disabled }: Props<T>) {
  return (
    <View style={[styles.segment, disabled && styles.disabled]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.segmentItem, active && styles.segmentActive]}
            onPress={() => onChange(o.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !!disabled }}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Horizontally scrolling pill filters (positions, form choices). */
export function Chips<T extends string>({ options, value, onChange, disabled }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      style={disabled ? styles.disabled : undefined}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(o.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !!disabled }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },
  segment: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: 4,
    borderWidth: 1, borderColor: colors.goldBorder,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm + 2 },
  segmentActive: { backgroundColor: colors.red },
  segmentText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  segmentTextActive: { color: colors.white },
  chips: { gap: space.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.goldBorder,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: colors.navy },
});
