import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { BingoTeaser } from '@/components/BingoTeaser';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FeatureCard } from '@/components/FeatureCard';
import { FitnessBadge } from '@/components/FitnessBadge';
import { MatchHero } from '@/components/MatchHero';
import { NewsTeaser } from '@/components/NewsTeaser';
import { PillTabs } from '@/components/PillTabs';
import { ProgramTeaser } from '@/components/ProgramTeaser';
import { ReportTeaser } from '@/components/ReportTeaser';
import { SectionHeader } from '@/components/SectionHeader';
import { ScreenBackground } from '@/components/ScreenBackground';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { GS } from '@/i18n/gameStrings';
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

export default function HomeScreen() {
  const { t, language } = useLanguage();
  const GT = GS[language];
  const router = useRouter();
  const { players, matches, nextMatch, refresh, refreshing } = usePlayers();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  // The banner's pill row switches the age category.
  const [category, setCategory] = React.useState<Category>('Seniors');

  // A player account owns a members row: player.id is String(member_id).
  const me = user?.memberId != null ? players.find((p) => p.id === String(user.memberId)) ?? null : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.white} />}
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
                title={t('todayProgram')}
                cta={t('openSchedule')}
                href="/more/camp-schedule"
              >
                <ProgramTeaser />
              </FeatureCard>

              <FeatureCard
                title={t('playersReport')}
                cta={t('viewReport')}
                href="/reports"
              >
                <ReportTeaser players={players} />
              </FeatureCard>

              <FeatureCard
                title={GT.bgTitle}
                cta={t('seeAll')}
                href="/games"
              >
                <BingoTeaser matches={matches} players={players} />
              </FeatureCard>

              <FeatureCard
                title={t('tabNews')}
                cta={t('seeAll')}
                href="/more/news"
              >
                <NewsTeaser />
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
              {/* Straight into the report form: players should not have to dig
                  through Profile > Tools > Reports to log a club match. */}
              <View style={{ marginTop: space.md }}>
                <Button title={t('logMatch')} onPress={() => router.push('/reports?new=1')} icon={<Text style={styles.logChevron}>+</Text>} />
              </View>
            </Card>
          )
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },

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
  logChevron: { color: colors.white, fontSize: 16, fontWeight: '700', lineHeight: 16 },
});
