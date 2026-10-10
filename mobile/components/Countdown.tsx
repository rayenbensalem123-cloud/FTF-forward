import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { pad2 } from '@/lib/format';
import { useCountdown } from '@/lib/useCountdown';

export interface CountdownLabels {
  days: string;
  hrs: string;
  min: string;
  sec: string;
}

function CountdownInner({ target, labels }: { target: string; labels: CountdownLabels }) {
  const { t } = useLanguage();
  const cd = useCountdown(target);
  const boxes: Array<[number, string]> = [
    [cd.days, labels.days],
    [cd.hours, labels.hrs],
    [cd.minutes, labels.min],
    [cd.seconds, labels.sec],
  ];
  return (
    <View style={styles.countdown} accessibilityRole="timer" accessibilityLabel={t('kickoffIn')}>
      {boxes.map(([v, label]) => (
        <View key={label} style={styles.cdBox}>
          <Text style={styles.cdValue}>{pad2(v)}</Text>
          <Text style={styles.cdLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * The second-by-second kickoff countdown, kept out of the home screen so the
 * 1-second tick only re-renders this tiny component instead of the whole screen.
 */
export const Countdown = memo(CountdownInner);

const styles = StyleSheet.create({
  countdown: { flexDirection: 'row', gap: 4 },
  cdBox: {
    minWidth: 36,
    alignItems: 'center',
    backgroundColor: 'rgba(7,19,38,0.55)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  cdValue: { color: colors.white, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cdLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});
