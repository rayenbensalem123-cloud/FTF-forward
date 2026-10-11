import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Squad readiness: a two-tab header (Readiness / Injury Report) over a fit
 * count and a progress bar. The active tab carries the gold dot that the
 * reference uses to mark the current section.
 */
export function ReadinessCard({
  fitCount,
  total,
  recoveryCount,
}: {
  fitCount: number;
  total: number;
  recoveryCount: number;
}) {
  const { t } = useLanguage();
  const ratio = total > 0 ? fitCount / total : 0;

  return (
    <View>
      <View style={styles.tabs}>
        <View style={styles.tab}>
          <View style={styles.dot} />
          <Text style={styles.tabActive}>{t('readiness')}</Text>
        </View>
        <Text style={styles.tabIdle}>{t('injuryReport')}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {fitCount}<Text style={styles.countSlash}> / {total}</Text>
          </Text>
          <Text style={styles.countLabel}>{t('playersFit')}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <View style={styles.recoveryChip}>
          <View style={styles.amberDot} />
          <Text style={styles.recoveryText}>{recoveryCount} {t('inRecovery')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  tabActive: { color: colors.white, fontSize: 15, fontWeight: '700' },
  tabIdle: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  panel: {
    backgroundColor: colors.card, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.hairline, padding: space.lg,
  },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  count: { color: colors.white, fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  countSlash: { color: colors.muted, fontSize: 20, fontWeight: '700' },
  countLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.green },
  recoveryChip: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.amberSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7,
  },
  amberDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.amber },
  recoveryText: { color: colors.amber, fontWeight: '700', fontSize: 12 },
});
