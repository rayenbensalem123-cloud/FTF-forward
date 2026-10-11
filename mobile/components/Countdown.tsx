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

function CountdownInner({ target, labels, boxed = false, compact = false }: { target: string; labels: CountdownLabels; boxed?: boolean; compact?: boolean }) {
  const { t } = useLanguage();
  const cd = useCountdown(target);
  const boxes: Array<[number, string]> = [
    [cd.days, labels.days],
    [cd.hours, labels.hrs],
    [cd.minutes, labels.min],
    [cd.seconds, labels.sec],
  ];
  return (
    <View style={[styles.countdown, boxed && styles.countdownBoxed, compact && styles.countdownCompact]} accessibilityRole="timer" accessibilityLabel={t('kickoffIn')}>
      {boxes.map(([v, label]) => (
        <View key={label} style={[styles.cdBox, boxed && styles.cdBoxed, compact && styles.cdBoxCompact]}>
          <Text style={[styles.cdValue, compact && styles.cdValueCompact]}>{pad2(v)}</Text>
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
 *
 * `boxed` puts each cell on a dark translucent tile so the countdown reads on
 * a photo banner; the default stays box-less for dark cards. `compact` lays
 * the four cells out as a 2x2 grid with smaller type, for the banner's narrow
 * center column under the date.
 */
export const Countdown = memo(CountdownInner);

const styles = StyleSheet.create({
  countdown: { flexDirection: 'row', gap: 14 },
  countdownBoxed: { gap: 6 },
  countdownCompact: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  cdBox: { alignItems: 'center', minWidth: 34 },
  cdBoxed: { backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8, minWidth: 46 },
  cdBoxCompact: { backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 6, minWidth: 48 },
  cdValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 22,
  },
  cdValueCompact: { fontSize: 15, lineHeight: 17 },
  cdLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
