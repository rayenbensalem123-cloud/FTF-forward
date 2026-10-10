import React from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, CalendarPlus, ClipboardList, Gamepad2, MapPin, Shirt } from 'lucide-react-native';
import { AnnouncementsCard } from '@/components/AnnouncementsCard';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { FitnessBadge } from '@/components/FitnessBadge';
import { MatchTravelCard } from '@/components/MatchTravelCard';
import { MatchDayCard } from '@/components/MatchDayCard';
import { Countdown } from '@/components/Countdown';
import { ForwardChevron } from '@/components/ForwardChevron';
import { Flag } from '@/components/Flag';
import { SyncBanner } from '@/components/SyncBanner';
import { flagCodeFor } from '@/lib/countryFlags';
import { colors, radius, sectionTitle, shadow, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatDate } from '@/lib/format';
import { addMatchToCalendar } from '@/lib/calendar';
import { CS } from '@/i18n/careerStrings';
import type { Match } from '@/types';

/** Prototype quick actions: a 2-column grid of tiles, each a real screen. */
const QUICK_ACTIONS = [
  { href: '/lineup', icon: Shirt, title: 'tabLineup' },
  { href: '/more/camp-schedule', icon: Calendar, title: 'tabCampSchedule' },
  { href: '/more/reports', icon: ClipboardList, title: 'tabReports' },
  { href: '/more/games', icon: Gamepad2, title: 'tabGames' },
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
  const CT = CS[language];
  const router = useRouter();
  const { players, matches, nextMatch, upcoming, refresh, refreshing } = usePlayers();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const [addingToCal, setAddingToCal] = React.useState(false);

  const onAddToCalendar = async () => {
    if (!nextMatch) return;
    setAddingToCal(true);
    const res = await addMatchToCalendar(nextMatch);
    setAddingToCal(false);
    if (res === 'added') Alert.alert(CT.addToCalendar, CT.addedToCalendar);
    else if (res === 'denied') Alert.alert(CT.addToCalendar, CT.calendarDenied);
    else Alert.alert(CT.addToCalendar, CT.calendarFailed);
  };
  const known = players.filter((p) => p.status !== 'unknown');
  const total = known.length;
  const fitCount = known.filter((p) => p.status === 'fit').length;
  const recoveryCount = total - fitCount;
  const fitRatio = total > 0 ? fitCount / total : 0;

  // A player account owns a members row: player.id is String(member_id).
  const me = user?.memberId != null ? players.find((p) => p.id === String(user.memberId)) ?? null : null;

  const topPlayers = [...players].sort((a, b) => b.caps - a.caps || b.goals - a.goals).slice(0, 4);
  const results = [...matches]
    .filter((m) => resultOf(m) !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const code = (name: string) => name.replace(/[^\p{L}]/gu, '').slice(0, 3).toUpperCase() || '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        <AppHeader subtitle={user ? t(isStaff ? 'roleStaff' : 'rolePlayer') : undefined} />
        <SyncBanner />

        {/* Hero: upcoming match — the broadcast card of the redesign */}
        <LinearGradient
          colors={['#B30011', '#5B0A24', colors.navy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.compBadge}>
              <Text style={styles.compText} numberOfLines={1}>
                {nextMatch?.competition || nextMatch?.category || 'WNT'}
              </Text>
            </View>
            <Text style={styles.heroLabel}>
              {t('nextMatch')}
              {nextMatch ? ` · ${formatDate(nextMatch.date)}` : ''}
            </Text>
          </View>

          <View style={styles.teams}>
            <View style={styles.team}>
              <View style={styles.crest}><Flag name="Tunisia" width={30} /></View>
              <Text style={styles.teamName} numberOfLines={1}>Tunisia</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={[styles.team, { justifyContent: 'flex-end' }]}>
              <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={1}>
                {nextMatch?.opponent || t('noMatchScheduled')}
              </Text>
              <View style={styles.crest}>
                {nextMatch && flagCodeFor(nextMatch.opponent) ? (
                  <Flag name={nextMatch.opponent} width={30} />
                ) : (
                  <Text style={styles.crestText}>{nextMatch ? code(nextMatch.opponent) : '?'}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Countdown
              target={nextMatch ? `${nextMatch.date}T00:00:00` : ''}
              labels={{ days: t('days'), hrs: t('hrs'), min: t('min'), sec: t('sec') }}
            />
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/match-details')}
              accessibilityRole="button"
              accessibilityLabel={t('matchDetails')}
            >
              <Text style={styles.heroBtnText} numberOfLines={1}>{t('matchDetails')}</Text>
              <ForwardChevron color={colors.navy} size={14} />
            </TouchableOpacity>
          </View>

          {!!nextMatch && (
            <View style={styles.infoRow}>
              {!!nextMatch.venue && (
                <>
                  <MapPin color={colors.gold} size={12} />
                  <Text style={[styles.infoText, { flex: 1 }]} numberOfLines={1}>{nextMatch.venue}</Text>
                </>
              )}
              <TouchableOpacity
                style={styles.calChip}
                onPress={onAddToCalendar}
                disabled={addingToCal}
                accessibilityRole="button"
                accessibilityLabel={CT.addToCalendar}
              >
                <CalendarPlus color={colors.gold} size={12} />
                <Text style={styles.calChipText}>{CT.addToCalendar}</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        <MatchDayCard match={nextMatch} />

        {isStaff ? (
          <>
            {/* Quick actions — 2-column grid */}
            <View style={styles.group}>
              <Text style={styles.section}>{t('quickActions')}</Text>
              <View style={styles.quickGrid}>
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <TouchableOpacity
                      key={a.href}
                      style={styles.quickAction}
                      activeOpacity={0.8}
                      onPress={() => router.push(a.href)}
                      accessibilityRole="button"
                      accessibilityLabel={t(a.title)}
                    >
                      <View style={styles.quickIcon}><Icon color={colors.gold} size={22} /></View>
                      <Text style={styles.quickLabel} numberOfLines={1}>{t(a.title)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Squad readiness */}
            {total > 0 && (
              <Card>
                <Text style={styles.section}>{t('readiness')}</Text>
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

            {/* Top players */}
            {topPlayers.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.section}>{t('topPlayers')}</Text>
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
                <Text style={styles.section}>{t('recentResults')}</Text>
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
            {/* My form: the signed-in player's own card */}
            <Card>
              <Text style={styles.section}>{t('myForm')}</Text>
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
          <View style={styles.sectionRow}>
            <Text style={styles.section}>{t('todaysAgenda')}</Text>
            <TouchableOpacity
              style={styles.moreLink}
              onPress={() => router.push('/matches')}
              accessibilityRole="button"
              accessibilityLabel={t('tabMatches')}
            >
              <Text style={styles.moreLinkText}>{t('tabMatches')}</Text>
              <ForwardChevron color={colors.gold} size={14} />
            </TouchableOpacity>
          </View>
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
  section: sectionTitle,

  /* Hero */
  hero: { borderRadius: radius.card, padding: space.lg, overflow: 'hidden', ...shadow.hero },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  compBadge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1 },
  compText: { color: colors.navy, fontWeight: '900', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  teams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginVertical: space.md },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crest: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.cardRaised,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  calChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(246,199,68,0.14)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  calChipText: { color: colors.gold, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  crestText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  teamName: { color: colors.white, fontWeight: '700', fontSize: 13, flexShrink: 1 },
  vs: { color: colors.gold, fontWeight: '900', fontSize: 14, letterSpacing: 0.7 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm },
  infoText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, flexShrink: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  heroBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2,
    height: 36, borderRadius: radius.pill, backgroundColor: colors.gold, marginLeft: space.sm,
  },
  heroBtnText: { color: colors.navy, fontWeight: '800', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },

  /* Sections */
  group: { gap: space.sm },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moreLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  moreLinkText: {
    color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* Quick actions */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: {
    flexGrow: 1, flexBasis: '47%', backgroundColor: colors.card, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.hairline, padding: space.lg, alignItems: 'center', gap: 8,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cardRaised,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center' },

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

  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: 14 },
  agendaTime: { color: colors.gold, fontSize: 15, fontWeight: '800', width: 74, fontVariant: ['tabular-nums'] },
  agendaTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  agendaPlace: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 12 },
});
