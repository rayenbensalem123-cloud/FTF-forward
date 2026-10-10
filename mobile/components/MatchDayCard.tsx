import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Shirt, Swords } from 'lucide-react-native';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { MD } from '@/i18n/toolStrings';
import { matchDayState } from '@/lib/matchDayLogic';
import type { Match } from '@/types';

/** On the day of the match (and the day before) Home puts the two things everyone needs one tap away. */
export function MatchDayCard({ match }: { match: Match | null | undefined }) {
  const { language } = useLanguage();
  const router = useRouter();
  const state = matchDayState(match?.date);
  if (!match || !state) return null;
  const T = MD[language];
  return (
    <View style={[styles.card, state === 'today' && styles.today]}>
      <View style={styles.head}>
        <Swords size={18} color={state === 'today' ? colors.red : colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{state === 'today' ? T.today : T.tomorrow}</Text>
          <Text style={styles.sub} numberOfLines={1}>{T.vs} {match.opponent}{match.venue ? `  ·  ${match.venue}` : ''}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/lineup')} accessibilityRole="button">
          <Shirt size={15} color={colors.white} />
          <Text style={styles.btnText}>{T.lineup}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/match-details')} accessibilityRole="button">
          <Text style={[styles.btnText, { color: colors.gold }]}>{T.details}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.goldBorder, padding: space.lg, gap: space.md },
  today: { borderColor: colors.red, borderWidth: 1.5 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { color: colors.white, fontSize: 16, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: space.sm },
  btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: radius.md, backgroundColor: colors.red },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.cardRaised },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
});
