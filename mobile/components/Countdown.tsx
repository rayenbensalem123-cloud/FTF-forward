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
 * Styled like the hero cells of the redesign: a heavy tabular number over an
 * uppercase micro-label, no box behind it.
 */
export const Countdown = memo(CountdownInner);

const styles = StyleSheet.create({
  countdown: { flexDirection: 'row', gap: 14 },
  cdBox: { alignItems: 'center', minWidth: 34 },
  cdValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 22,
  },
  cdLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
