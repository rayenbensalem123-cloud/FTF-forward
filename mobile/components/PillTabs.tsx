import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, space } from '@/constants/theme';

/**
 * The model's pill tab row: a horizontally scrollable strip where the active
 * pill is filled with the accent and the rest are dark. It switches between the
 * age categories (Seniors / U20 / U17) without a second navigation level, and
 * it is the one element in the model that is itself a control rather than a
 * label, so it gets the accent rather than white.
 */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <TouchableOpacity
            key={tab.value}
            style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
            onPress={() => onChange(tab.value)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, paddingVertical: space.sm },
  pill: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 6 },
  pillActive: { backgroundColor: colors.red },
  pillIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairline },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  labelActive: { color: colors.white },
  labelIdle: { color: colors.muted },
});
