import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Pencil, X } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Flag } from '@/components/Flag';
import { Pitch } from '@/components/Pitch';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useMatch } from '@/context/MatchContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatDate } from '@/lib/format';

export default function MatchDetailsScreen() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const match = useMatch();
  const router = useRouter();
  const { nextMatch } = usePlayers();
  const hasLineup = match.lineupPlayers.some((p) => p !== null);
  const canSelect = can('selectSquad');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('matchDetails')}</Text>
        <TouchableOpacity style={styles.close} onPress={() => router.back()} accessibilityLabel={t('close')}>
          <X color={colors.white} size={18} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          {nextMatch ? (
            <View style={styles.vsRow}>
              <Flag name="Tunisia" width={30} />
              <Text style={styles.match}>Tunisia vs {nextMatch.opponent}</Text>
              <Flag name={nextMatch.opponent} width={30} />
            </View>
          ) : (
            <Text style={styles.match}>{t('noMatchScheduled')}</Text>
          )}
          {!!nextMatch?.competition && <Text style={styles.comp}>{nextMatch.competition}</Text>}
          {!!nextMatch && <Text style={styles.line}>{formatDate(nextMatch.date)} · {nextMatch.category}</Text>}
          {!!nextMatch?.venue && (
            <View style={styles.venue}>
              <MapPin color={colors.gold} size={15} />
              <Text style={styles.line}>{nextMatch.venue}</Text>
            </View>
          )}
        </Card>

        <View style={styles.rowBetween}>
          <Text style={styles.heading}>{t('lineupTab')} · {match.formation}</Text>
          <Text style={styles.count}>{match.callUps.length} {t('callUps').toLowerCase()}</Text>
        </View>

        {hasLineup ? (
          <Pitch formation={match.formation} players={match.lineupPlayers} />
        ) : (
          <Card><Text style={styles.empty}>{t('noLineup')}</Text></Card>
        )}

        {canSelect ? (
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/match-squad')} accessibilityRole="button">
            <Pencil color={colors.white} size={16} />
            <Text style={styles.btnText}>{hasLineup ? t('editMatchSquad') : t('pickLineup')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.viewOnly}>{t('viewOnly')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.md },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.md + 2, paddingBottom: space.xl * 2 },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  match: { color: colors.white, fontSize: 22, fontWeight: '800' },
  comp: { color: colors.gold, fontSize: 13, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  line: { color: colors.muted, fontSize: 14, marginTop: 8, flexShrink: 1 },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.sm },
  heading: { color: colors.white, fontSize: 18, fontWeight: '800' },
  count: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: space.md },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.md, backgroundColor: colors.red },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  viewOnly: { color: colors.amber, fontSize: 13, backgroundColor: colors.amberSoft, borderRadius: radius.sm + 2, padding: 10 },
});
