import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { FeatureCard } from '@/components/FeatureCard';
import { FitnessBadge } from '@/components/FitnessBadge';
import { MatchHero } from '@/components/MatchHero';
import { PitchDiagram } from '@/components/PitchDiagram';
import { PillTabs } from '@/components/PillTabs';
import { RadarChart } from '@/components/Charts';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import type { Category, Match } from '@/types';

/**
 * The dashboard home: a dark header, a maroon hero for the next match, and a
 * grid of feature cards that open the parts of the app otherwise buried
 * behind the staff-only "More" tab.
 *
 * The squad-readiness block was removed -- the fit count and progress bar
 * filled the screen with a single number that was not the point of landing
 * here. The feature cards are what the dashboard should be about.
 *
 * Staff get the hero and the grid. Players get the hero and their own form;
 * the feature cards are staff tools, so they are not shown to them.
 */

const TACTIC_PITCH = [
  { x: 50, y: 88 },
  { x: 22, y: 66 }, { x: 50, y: 70 }, { x: 78, y: 66 },
  { x: 30, y: 40 }, { x: 70, y: 40 },
  { x: 42, y: 16, label: 'YA' }, { x: 62, y: 14, label: 'SG' },
];

const ANALYSIS_PITCH = [
  { x: 50, y: 90 },
  { x: 20, y: 68 }, { x: 50, y: 72 }, { x: 80, y: 68 },
  { x: 28, y: 44 }, { x: 50, y: 48 }, { x: 72, y: 44 },
  { x: 36, y: 20 }, { x: 58, y: 18 },
];

const SCOUT_RADAR = { data: [0.8, 0.6, 0.7, 0.5, 0.65], labels: ['PAC', 'SHO', 'PAS', 'DRI', 'DEF'] };

export default function HomeScreen() {
  const { t } = useLanguage();
  const { players, nextMatch, refresh, refreshing } = usePlayers();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  // The banner's pill row switches the age category.
  const [category, setCategory] = React.useState<Category>('Seniors');

  // A player account owns a members row: player.id is String(member_id).
  const me = user?.memberId != null ? players.find((p) => p.id === String(user.memberId)) ?? null : null;

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

        {/* The banner's pill row: switches the age category. */}
        <PillTabs
          tabs={[
            { value: 'Seniors', label: t('seniors') },
            { value: 'U-20', label: t('u20') },
            { value: 'U-17', label: t('u17') },
          ]}
          value={category}
          onChange={setCategory}
        />

        <MatchHero match={nextMatch} />

        {isStaff ? (
          <View style={styles.group}>
            <SectionHeader title={t('availableFeatures')} />
            <View style={styles.grid}>
              <FeatureCard
                title={t('interactiveTacticBoard')}
                cta={t('designPlays')}
                href="/lineup"
              >
                <PitchDiagram players={TACTIC_PITCH} />
              </FeatureCard>

              <FeatureCard
                title={t('playersReport')}
                description={t('profileCards')}
                cta={t('viewDetails')}
                href="/more/reports"
              >
                <RadarChart data={SCOUT_RADAR.data} labels={SCOUT_RADAR.labels} size={88} />
              </FeatureCard>

              <FeatureCard
                title={t('injuryPreventionHub')}
                cta={t('accessRecoveryPlans')}
                href="/more/reports"
              >
                <View style={styles.checklist}>
                  <CheckRow icon={<View style={styles.tick} />} label={t('playerRecovery')} done />
                  <CheckRow icon={<View style={styles.tick} />} label={t('personalizedExercise')} done />
                  <CheckRow icon={<View style={styles.tick} />} label={t('mealPlanning')} />
                  <CheckRow icon={<View style={styles.tick} />} label={t('medicalCheckup')} />
                </View>
              </FeatureCard>

              <FeatureCard
                title={t('liveMatchAnalysis')}
                cta={t('compareOpponents')}
                href="/match-details"
              >
                <PitchDiagram players={ANALYSIS_PITCH} showLabels={false} />
              </FeatureCard>
            </View>
          </View>
        ) : (
          user?.memberId != null && (
            <Card>
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
            </Card>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CheckRow({ icon, label, done }: { icon: React.ReactNode; label: string; done?: boolean }) {
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkBox, done && styles.checkBoxDone]}>{icon}</View>
      <Text style={[styles.checkLabel, done && styles.checkLabelDone]} numberOfLines={1}>{label}</Text>
    </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },

  checklist: { gap: 6, justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkBox: {
    width: 14, height: 14, borderRadius: 4, borderWidth: 1,
    borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
  },
  checkBoxDone: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  tick: { width: 8, height: 5, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.green, transform: [{ rotate: '-45deg' }] },
  checkLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  checkLabelDone: { color: colors.white },

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
