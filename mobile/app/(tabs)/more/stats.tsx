import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { PlayerSheet } from '@/components/PlayerSheet';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import type { Player } from '@/types';

const RESULT_COLOR = { W: colors.green, D: colors.amber, L: colors.red } as const;

export default function StatsScreen() {
  const { t } = useLanguage();
  const { players, form: FORM, avgPossession } = usePlayers();
  const [selected, setSelected] = useState<Player | null>(null);

  const { scorers, assisters, capped } = useMemo(() => {
    const by = (key: 'goals' | 'assists' | 'caps') =>
      [...players].filter((p) => p[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, 3);
    return { scorers: by('goals'), assisters: by('assists'), capped: by('caps') };
  }, [players]);

  const goalsFor = FORM.reduce((s, f) => s + f.goalsFor, 0);
  const goalsAgainst = FORM.reduce((s, f) => s + f.goalsAgainst, 0);
  const goalsPerGame = (FORM.length ? goalsFor / FORM.length : 0).toFixed(1);
  const cleanSheetPct = FORM.length ? Math.round((FORM.filter((f) => f.goalsAgainst === 0).length / FORM.length) * 100) : 0;

  // Podium order: 2nd, 1st, 3rd
  const podium = [scorers[1], scorers[0], scorers[2]].filter(Boolean) as Player[];
  const podiumRank = (p: Player) => scorers.indexOf(p) + 1;
  const podiumPad = { 1: 0, 2: 22, 3: 38 } as const;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader showBell={false} back />

        {/* Team form */}
        <Card>
          <Text style={styles.section}>{t('teamForm')} · {t('last5')}</Text>
          <View style={styles.formRow}>
            {FORM.map((f, i) => (
              <View key={i} style={styles.formItem}>
                <View style={[styles.formDot, { backgroundColor: RESULT_COLOR[f.result] }]}>
                  <Text style={styles.formLetter}>{f.result}</Text>
                </View>
                <Text style={styles.formScore}>{f.goalsFor}-{f.goalsAgainst}</Text>
                <Text style={styles.formOpp}>{f.opponent}</Text>
              </View>
            ))}
          </View>
          <View style={styles.formTotals}>
            <Text style={styles.totalText}><Text style={styles.totalNum}>{goalsFor}</Text> {t('scored')}</Text>
            <Text style={styles.totalText}><Text style={styles.totalNum}>{goalsAgainst}</Text> {t('conceded')}</Text>
          </View>
        </Card>

        {/* Top scorers podium */}
        <View>
          <Text style={styles.heading}>{t('topScorers')}</Text>
          <View style={styles.podium}>
            {podium.map((p) => {
              const rank = podiumRank(p) as 1 | 2 | 3;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.podiumCard, rank === 1 && styles.podiumFirst, { paddingTop: space.md + podiumPad[rank] }]}
                  onPress={() => setSelected(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.rank, rank === 1 && { color: colors.gold }]}>{rank}</Text>
                  <Avatar name={p.name} size={rank === 1 ? 58 : 48} photoUrl={p.photoUrl} />
                  <Text style={styles.podiumName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.podiumClub} numberOfLines={1}>{p.club}</Text>
                  <Text style={styles.podiumGoals}>{p.goals}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Leaderboard title={t('mostAssists')} rows={assisters} value={(p) => p.assists} onPress={setSelected} />
        <Leaderboard title={t('mostCaps')} rows={capped} value={(p) => p.caps} onPress={setSelected} />

        {/* Competition stats */}
        <View>
          <Text style={styles.heading}>{t('competitionStats')}</Text>
          <View style={styles.tiles}>
            <View style={styles.tile}><Text style={styles.tileValue}>{goalsPerGame}</Text><Text style={styles.tileLabel}>{t('goalsPerGame')}</Text></View>
            <View style={styles.tile}><Text style={styles.tileValue}>{cleanSheetPct}%</Text><Text style={styles.tileLabel}>{t('cleanSheets')}</Text></View>
            <View style={styles.tile}><Text style={styles.tileValue}>{avgPossession !== null ? `${avgPossession}%` : '—'}</Text><Text style={styles.tileLabel}>{t('possession')}</Text></View>
          </View>
        </View>
      </ScrollView>
      <PlayerSheet player={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

function Leaderboard({
  title, rows, value, onPress,
}: { title: string; rows: Player[]; value: (p: Player) => number; onPress: (p: Player) => void }) {
  return (
    <View>
      <Text style={styles.heading}>{title}</Text>
      <Card style={{ paddingVertical: space.sm }}>
        {rows.map((p, i) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.lbRow, i > 0 && styles.lbDivider]}
            onPress={() => onPress(p)}
            activeOpacity={0.75}
          >
            <Text style={[styles.lbRank, i === 0 && { color: colors.gold }]}>{i + 1}</Text>
            <Avatar name={p.name} size={38} photoUrl={p.photoUrl} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.lbName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.lbClub} numberOfLines={1}>{p.club}</Text>
            </View>
            <Text style={styles.lbValue}>{value(p)}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  section: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  heading: { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between' },
  formItem: { alignItems: 'center', gap: 4, flex: 1 },
  formDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  formLetter: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  formScore: { color: colors.white, fontSize: 13, fontWeight: '700', marginTop: 2 },
  formOpp: { color: colors.muted, fontSize: 11 },
  formTotals: { flexDirection: 'row', gap: space.xl, marginTop: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  totalText: { color: colors.muted, fontSize: 13 },
  totalNum: { color: colors.white, fontSize: 18, fontWeight: '800' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  podiumCard: {
    flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.goldBorder, paddingHorizontal: 6, paddingBottom: space.md,
  },
  podiumFirst: { borderColor: colors.gold },
  rank: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  podiumName: { color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center', minHeight: 30 },
  podiumClub: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  podiumGoals: { color: colors.gold, fontSize: 26, fontWeight: '800' },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10 },
  lbDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  lbRank: { color: colors.muted, width: 16, textAlign: 'center', fontWeight: '800', fontSize: 15 },
  lbName: { color: colors.white, fontSize: 14, fontWeight: '700' },
  lbClub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  lbValue: { color: colors.white, fontSize: 20, fontWeight: '800' },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder,
    paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center', gap: 4,
  },
  tileValue: { color: colors.white, fontSize: 24, fontWeight: '800' },
  tileLabel: { color: colors.muted, fontSize: 11, textAlign: 'center' },
});
