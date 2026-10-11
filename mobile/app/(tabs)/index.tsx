import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ForwardChevron } from '@/components/ForwardChevron';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { FitnessBadge } from '@/components/FitnessBadge';
import { MatchHero } from '@/components/MatchHero';
import { ReadinessCard } from '@/components/ReadinessCard';
import { PlayerStatRow } from '@/components/PlayerStatRow';
import { InsightCard } from '@/components/InsightCard';
import { BarChart, RadarChart } from '@/components/Charts';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import type { Match } from '@/types';

/**
 * The dashboard home, following the staff-portal reference: a dark header, a
 * maroon hero for the next match, squad readiness, a scannable list of player
 * stats, and a row of insight cards with charts.
 *
 * Staff get the full dashboard. Players get the hero and their own form --
 * the readiness and insight sections are staff concerns, so they are not
 * shown to them.
 */

/** The three insight cards. Values are 0..1 for the radars, raw for the bars. */
const SQUAD_FORM = { data: [0.8, 0.65, 0.7, 0.55, 0.6], labels: ['ST', 'RW', 'CM', 'CB', 'LB'] };
const OPPONENT_FORM = { data: [0.6, 0.5, 0.75, 0.45], labels: ['ATK', 'MID', 'DEF', 'SET'] };
const OPPONENT_MET = [
  { label: 'W', value: 6 },
  { label: 'D', value: 2 },
  { label: 'L', value: 3 },
];

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { players, matches, nextMatch, refresh, refreshing } = usePlayers();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  const known = players.filter((p) => p.status !== 'unknown');
  const total = known.length;
  const fitCount = known.filter((p) => p.status === 'fit').length;
  const recoveryCount = total - fitCount;

  // A player account owns a members row: player.id is String(member_id).
  const me = user?.memberId != null ? players.find((p) => p.id === String(user.memberId)) ?? null : null;

  const topPlayers = [...players]
    .sort((a, b) => b.goals - a.goals || b.caps - a.caps)
    .slice(0, 4);
  const maxGoals = topPlayers.reduce((m, p) => Math.max(m, p.goals), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        <AppHeader
          badge={isStaff ? t('staffPortal') : undefined}
          subtitle={user ? t(isStaff ? 'roleStaff' : 'rolePlayer') : undefined}
        />
        <MatchHero match={nextMatch} />

        {isStaff ? (
          <>
            <ReadinessCard fitCount={fitCount} total={total} recoveryCount={recoveryCount} />

            <View style={styles.group}>
              <SectionHeader title={t('topPlayers')} />
              <Card style={{ paddingVertical: space.xs }}>
                {topPlayers.map((p, i) => (
                  <View key={p.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <PlayerStatRow
                      name={p.name}
                      number={p.number}
                      position={p.position}
                      photoUrl={p.photoUrl}
                      stat={p.goals}
                      statLabel={t('goals')}
                      max={maxGoals}
                    />
                  </View>
                ))}
              </Card>
            </View>

            <View style={styles.group}>
              <View style={styles.insightsHeader}>
                <Text style={styles.insightsTitle}>{t('teamInsights')}</Text>
                <ForwardChevron color={colors.gold} size={16} />
              </View>
              <View style={styles.insightsRow}>
                <InsightCard title={t('squadForm')}>
                  <RadarChart data={SQUAD_FORM.data} labels={SQUAD_FORM.labels} />
                </InsightCard>
                <InsightCard title={t('opponentAnalysis')}>
                  <RadarChart data={OPPONENT_FORM.data} labels={OPPONENT_FORM.labels} color={colors.red} />
                </InsightCard>
                <InsightCard title={t('opponentMet')}>
                  <BarChart data={OPPONENT_MET} />
                </InsightCard>
              </View>
            </View>
          </>
        ) : (
          <>
            {user?.memberId != null && <Card>
              <SectionHeader title={t('myForm')} />
              <View style={styles.formHeader}>
                <Avatar name={me?.name ?? user?.name ?? '?'} number={me?.number} photoUrl={me?.photoUrl} size={48} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.formName} numberOfLines={1}>{me?.name ?? user?.name ?? ''}</Text>
                  <Text style={styles.formPos}>
                    {me ? `${me.position} · #${me.number}` : t('rolePlayer')}
                  </Text>
                </View>
                {me && <FitnessBadge status={me.status} large />}
              </View>
              <View style={styles.statGrid}>
                <StatCell value={me?.caps ?? 0} label={t('caps')} />
                <StatCell value={me?.goals ?? 0} label={t('goals')} />
                <StatCell value={me?.assists ?? 0} label={t('assists')} />
              </View>
            </Card>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },

  group: { gap: space.sm },
  divider: { height: 1, backgroundColor: colors.hairline },

  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightsTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  insightsRow: { flexDirection: 'row', gap: space.sm },

  formHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  formName: { color: colors.white, fontSize: 15, fontWeight: '800' },
  formPos: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statGrid: { flexDirection: 'row', gap: 10 },
  statCell: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
  },
  statValue: { color: colors.white, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statLabel: {
    color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginTop: 4,
  },
});
