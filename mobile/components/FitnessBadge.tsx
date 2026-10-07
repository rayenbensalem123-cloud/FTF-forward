import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import type { StringKey } from '@/i18n/strings';
import type { Availability } from '@/types';

export const STATUS_STYLE: Record<Availability, { color: string; soft: string; label: StringKey }> = {
  fit: { color: colors.green, soft: colors.greenSoft, label: 'matchFit' },
  recovery: { color: colors.amber, soft: colors.amberSoft, label: 'recovery' },
  injured: { color: colors.red, soft: colors.redSoft, label: 'injured' },
  suspended: { color: colors.red, soft: colors.redSoft, label: 'suspended' },
  unknown: { color: colors.muted, soft: 'rgba(255,255,255,0.08)', label: 'unknownStatus' },
};

export function FitnessBadge({ status, large = false }: { status: Availability; large?: boolean }) {
  const { t } = useLanguage();
  const s = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.soft }, large && styles.large]}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={[styles.text, { color: s.color }, large && styles.textLarge]}>{t(s.label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  large: { paddingHorizontal: 12, paddingVertical: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 11, fontWeight: '700' },
  textLarge: { fontSize: 13 },
});
