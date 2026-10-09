import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Segmented, type Option } from '@/components/Chips';
import { Flag } from '@/components/Flag';
import { SyncBanner } from '@/components/SyncBanner';
import { colors, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatDate } from '@/lib/format';
import { parseScore } from '@/lib/mappers';
import type { Category, Match } from '@/types';

type Filter = 'all' | Category;
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Fixtures and results from the platform's matches table (approved matches only). */
export default function MatchesScreen() {
  const { t } = useLanguage();
  const { matches, refresh, refreshing } = usePlayers();
  const [filter, setFilter] = useState<Filter>('all');

  const options: Option<Filter>[] = [
    { value: 'all', label: t('all') },
    { value: 'Seniors', label: t('seniors') },
    { value: 'U-20', label: t('u20') },
    { value: 'U-17', label: t('u17') },
  ];

  const { upcoming, results } = useMemo(() => {
    const today = todayIso();
    const list = matches.filter((m) => m.approved && m.date && (filter === 'all' || m.category === filter));
    return {
      upcoming: list.filter((m) => !m.result && m.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
      results: list.filter((m) => !!m.result).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [matches, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} colors={[colors.gold]} />}
      >
        <AppHeader />
        <SyncBanner />
        <Segmented options={options} value={filter} onChange={setFilter} />

        <Text style={styles.heading}>{t('upcomingLabel')}</Text>
        {upcoming.length === 0 ? <Text style={styles.empty}>{t('noUpcoming')}</Text> : upcoming.map((m) => <MatchRow key={m.id} m={m} />)}

        <Text style={styles.heading}>{t('resultsLabel')}</Text>
        {results.length === 0 ? <Text style={styles.empty}>{t('noResults')}</Text> : results.map((m) => <MatchRow key={m.id} m={m} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function MatchRow({ m }: { m: Match }) {
  const score = parseScore(m.result);
  const outcome = score ? (score.gf > score.ga ? 'W' : score.gf < score.ga ? 'L' : 'D') : null;
  const color = outcome === 'W' ? colors.green : outcome === 'L' ? colors.red : colors.amber;
  return (
    <Card style={{ gap: 8 }}>
      <View style={styles.meta}>
        <Text style={styles.date}>{formatDate(m.date)}</Text>
        <Text style={styles.comp} numberOfLines={1}>{[m.competition, m.category].filter(Boolean).join(' · ')}</Text>
      </View>
      <View style={styles.teams}>
        <View style={styles.team}><Flag name="Tunisia" width={24} /><Text style={styles.name} numberOfLines={1}>Tunisia</Text></View>
        {score ? (
          <View style={[styles.score, { backgroundColor: color }]}><Text style={styles.scoreText}>{score.gf} - {score.ga}</Text></View>
        ) : (
          <Text style={styles.vs}>VS</Text>
        )}
        <View style={[styles.team, { justifyContent: 'flex-end' }]}>
          <Text style={[styles.name, { textAlign: 'right' }]} numberOfLines={1}>{m.opponent || 'TBD'}</Text>
          <Flag name={m.opponent} width={24} />
        </View>
      </View>
      {!!m.venue && <Text style={styles.venue} numberOfLines={1}>{m.venue}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  heading: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: space.sm },
  empty: { color: colors.muted, fontSize: 13 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  date: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  comp: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  name: { color: colors.white, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  vs: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  score: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { color: colors.white, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  venue: { color: colors.muted, fontSize: 11 },
});
