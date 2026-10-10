import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { pad2 } from '@/lib/format';
import { useCountdown } from '@/lib/useCountdown';

/**
 * Kept in its own memoized component so the one-second tick re-renders only
 * these four boxes instead of the whole home screen.
 */
export const Countdown = React.memo(function Countdown({ kickoff, label }: { kickoff: string; label: string }) {
  const { t } = useLanguage();
  const cd = useCountdown(kickoff);
  const cells = [
    [cd.days, t('days')],
    [cd.hours, t('hrs')],
    [cd.minutes, t('min')],
    [cd.seconds, t('sec')],
  ] as const;

  return (
    <View style={styles.countdown} accessibilityRole="timer" accessibilityLabel={label}>
      {cells.map(([value, cellLabel]) => (
        <View key={cellLabel} style={styles.cdBox}>
          <Text style={styles.cdValue}>{pad2(value)}</Text>
          <Text style={styles.cdLabel}>{cellLabel}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  countdown: { flexDirection: 'row', gap: 4 },
  cdBox: { minWidth: 36, alignItems: 'center', backgroundColor: 'rgba(7,19,38,0.55)', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 3 },
  cdValue: { color: colors.white, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cdLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});
