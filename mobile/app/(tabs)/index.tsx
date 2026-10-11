import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, ClipboardList, Gamepad2, IdCard, Newspaper, Trophy, Video } from 'lucide-react-native';
import { AnnouncementsCard } from '@/components/AnnouncementsCard';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { SectionHeader } from '@/components/SectionHeader';
import { FitnessBadge } from '@/components/FitnessBadge';
import { MatchTravelCard } from '@/components/MatchTravelCard';
import { CheckInCard, CheckInSummary } from '@/components/CheckIn';
import { MatchDayCard } from '@/components/MatchDayCard';
import { MatchHero } from '@/components/MatchHero';
import { PillTabs } from '@/components/PillTabs';
import { Flag } from '@/components/Flag';
import { SyncBanner } from '@/components/SyncBanner';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatDate } from '@/lib/format';
import type { Category, Match } from '@/types';

/**
 * The design puts four compact tiles straight under the header and gives them
 * to both roles. Players previously had no route at all to anything behind the
 * staff-only "More" tab, so these four are chosen for them: none of those
 * screens are role-gated inside -- Camp schedule is the only one that is.
 */
const STAFF_ACTIONS = [
  { href: '/more/camp-schedule', icon: Calendar, title: 'tabCampSchedule' },
  { href: '/more/meetings', icon: Video, title: 'tabMeetings' },
  { href: '/more/reports', icon: ClipboardList, title: 'tabReports' },
  { href: '/more/games', icon: Gamepad2, title: 'tabGames' },
] as const;

const PLAYER_ACTIONS = [
  { href: '/more/games', icon: Gamepad2, title: 'tabGames' },
  { href: '/more/news', icon: Newspaper, title: 'tabNews' },
  { href: '/more/career', icon: Trophy, title: 'tabCareer' },
  { href: '/id-card', icon: IdCard, title: 'tabIdCard' },
] as const;

const RESULT_COLOR = { W: colors.green, D: colors.amber, L: colors.red } as const;

/** "2-1" (Tunisia first) -> W/D/L, or null when not playable. */
function resultOf(m: Match): 'W' | 'D' | 'L' | null {
  const [a, b] = m.result.split('-').map(Number);
  if (m.result === '' || Number.isNaN(a) || Number.isNaN(b)) return null;
  return a > b ? 'W' : a === b ? 'D' : 'L';
}

export default function HomeScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { players, matches, nextMatch, upcoming, refresh, refreshing } = usePlayers();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  // The model's pill row switches the age category, and the player lists on
  // this screen follow it rather than ignoring it.
  const [category, setCategory] = React.useState<Category>('Seniors');

  const known = players.filter((p) => p.status !== 'unknown');
  const total = known.length;
  const fitCount = known.filter((p) => p.status === 'fit').length;
  const recoveryCount = total - fitCount;
  const fitRatio = total > 0 ? fitCount / total : 0;

  // A player account owns a members row: player.id is String(member_id).
  const me = user?.memberId != null ? players.find((p) => p.id === String(user.memberId)) ?? null : null;

  const topPlayers = [...players]
    .filter((p) => p.category === category)
    .sort((a, b) => b.caps - a.caps || b.goals - a.goals)
    .slice(0, 4);
  const results = [...matches]
    .filter((m) => resultOf(m) !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        <AppHeader subtitle={user ? t(isStaff ? 'roleStaff' : 'rolePlayer') : undefined} />
        <SyncBanner />

        {/* The model's pill row: switches the age category, and the player
            lists below follow it rather than ignoring it. */}
        <PillTabs
          tabs={[
            { value: 'Seniors', label: t('seniors') },
            { value: 'U-20', label: t('u20') },
            { value: 'U-17', label: t('u17') },
          ]}
          value={category}
          onChange={setCategory}
        />

        {/* The model's hero: the next match on a photo of the squad, with one
            full-width call to action. Replaces the old gradient card, which
            carried a countdown and three competing buttons. */}
        <MatchHero match={nextMatch} />

        {/* The design's four-tile row, directly under the hero for both roles */}
        <View style={styles.actions}>
          {(isStaff ? STAFF_ACTIONS : PLAYER_ACTIONS).map((a) => (
            <IconTile key={a.href} href={a.href} icon={a.icon} label={t(a.title)} />
          ))}
        </View>

        <MatchDayCard match={nextMatch} />

        {isStaff ? (
          <>
            {/* Squad readiness */}
            {total > 0 && (
              <Card>
                <SectionHeader title={t('readiness')} />
                <View style={styles.readyRow}>
                  <Text style={styles.readyBig}>
                    {fitCount}<Text style={styles.readySlash}> / {total}</Text>
                  </Text>
                  <Text style={styles.readyLabel}>{t('playersFit')}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${fitRatio * 100}%` }]} />
                </View>
                <View style={styles.recoveryChip}>
                  <View style={styles.amberDot} />
                  <Text style={styles.recoveryText}>{recoveryCount} {t('inRecovery')}</Text>
                </View>
              </Card>
            )}

            <CheckInSummary />

            {/* Top players */}
            {topPlayers.length > 0 && (
              <View style={styles.group}>
                <SectionHeader title={t('topPlayers')} />
                <View style={styles.playerGrid}>
                  {topPlayers.map((p) => (
                    <View key={p.id} style={styles.playerCard}>
                      <Avatar name={p.name} number={p.number} photoUrl={p.photoUrl} size={64} />
                      <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.playerPos}>{p.position} · #{p.number}</Text>
                      <View style={styles.playerStats}>
                        <View style={styles.playerStat}>
                          <Text style={styles.playerStatNum}>{p.caps}</Text>
                          <Text style={styles.playerStatLbl}>{t('caps')}</Text>
                        </View>
                        <View style={styles.playerStat}>
                          <Text style={styles.playerStatNum}>{p.goals}</Text>
                          <Text style={styles.playerStatLbl}>{t('goals')}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recent results */}
            {results.length > 0 && (
              <View style={styles.group}>
                <SectionHeader title={t('recentResults')} />
                <Card style={{ paddingVertical: space.xs }}>
                  {results.map((m, i) => {
                    const r = resultOf(m)!;
                    return (
                      <View key={m.id} style={[styles.matchRow, i > 0 && styles.divider]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.matchDate}>{formatDate(m.date).replace(/ \d{4}$/, '')}</Text>
                          <View style={styles.matchTeams}>
                            <Flag name="Tunisia" width={20} />
                            <Text style={styles.matchVs}>vs</Text>
                            <Flag name={m.opponent} width={20} />
                            <Text style={styles.matchOpp} numberOfLines={1}>{m.opponent}</Text>
                          </View>
                        </View>
                        <View style={[styles.scorePill, { backgroundColor: RESULT_COLOR[r] }]}>
                          <Text style={[styles.scoreText, { color: r === 'D' ? colors.navyDeep : colors.white }]}>
                            {m.result}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              </View>
            )}
          </>
        ) : (
          <>
            {user?.memberId != null && <CheckInCard memberId={user.memberId} />}

            {/* My form: the signed-in player's own card */}
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

            <AnnouncementsCard />
            <MatchTravelCard />
          </>
        )}

        {/* Upcoming fixtures */}
        <View style={styles.group}>
          <SectionHeader title={t('todaysAgenda')} href="/matches" />
          <Card style={{ paddingVertical: space.xs }}>
            {upcoming.length === 0 && <Text style={styles.empty}>{t('noUpcoming')}</Text>}
            {upcoming.map((m, i) => (
              <View key={m.id} style={[styles.agendaRow, i > 0 && styles.divider]}>
                <Text style={styles.agendaTime}>{formatDate(m.date).replace(/ \d{4}$/, '')}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.vsRow}>
                    <Flag name="Tunisia" width={18} />
                    <Text style={styles.agendaTitle}>vs</Text>
                    <Flag name={m.opponent} width={18} />
                    <Text style={[styles.agendaTitle, { flexShrink: 1 }]} numberOfLines={1}>{m.opponent}</Text>
                  </View>
                  <Text style={styles.agendaPlace}>
                    {[m.competition, m.venue].filter(Boolean).join(' · ') || m.category}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
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
  actions: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },

  /* Sections */
  group: { gap: space.sm },

  /* Readiness */
  readyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  readyBig: { color: colors.white, fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'] },
  readySlash: { color: colors.muted, fontSize: 24, fontWeight: '700' },
  readyLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
  recoveryChip: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.amberSoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  amberDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  recoveryText: { color: colors.amber, fontWeight: '700', fontSize: 13 },

  /* Player grid */
  playerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  playerCard: {
    flexGrow: 1, flexBasis: '47%', backgroundColor: colors.card, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.hairline, padding: space.lg, alignItems: 'center',
  },
  playerName: { color: colors.white, fontSize: 14, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  playerPos: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', marginTop: 4 },
  playerStats: { flexDirection: 'row', gap: space.lg, marginTop: 12 },
  playerStat: { alignItems: 'center' },
  playerStatNum: { color: colors.gold, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  playerStatLbl: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 2 },

  /* My form */
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

  /* Lists */
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  matchDate: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  matchTeams: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  matchVs: { color: colors.muted, fontSize: 12 },
  matchOpp: { color: colors.white, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  scorePill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  scoreText: { fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },

  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: 14 },
  agendaTime: { color: colors.gold, fontSize: 15, fontWeight: '800', width: 74, fontVariant: ['tabular-nums'] },
  agendaTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  agendaPlace: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 12 },
});
