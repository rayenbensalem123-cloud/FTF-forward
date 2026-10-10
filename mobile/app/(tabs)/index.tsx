import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Gamepad2, MapPin } from 'lucide-react-native';
import { AnnouncementsCard } from '@/components/AnnouncementsCard';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { MatchTravelCard } from '@/components/MatchTravelCard';
import { Countdown } from '@/components/Countdown';
import { ForwardChevron } from '@/components/ForwardChevron';
import { Flag } from '@/components/Flag';
import { SyncBanner } from '@/components/SyncBanner';
import { flagCodeFor } from '@/lib/countryFlags';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatDate, pad2 } from '@/lib/format';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { players, nextMatch, upcoming, refresh, refreshing } = usePlayers();
  // The platform stores a date only, so the countdown runs to the start of that day.
  const known = players.filter((p) => p.status !== 'unknown');
  const total = known.length;
  const fitCount = known.filter((p) => p.status === 'fit').length;
  const recoveryCount = total - fitCount;
  const fitRatio = total > 0 ? fitCount / total : 0;
  const code = (name: string) => name.replace(/[^\p{L}]/gu, '').slice(0, 3).toUpperCase() || '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        <AppHeader />
        <SyncBanner />

        {/* Hero: upcoming match */}
        <LinearGradient colors={['#B30011', '#5B0A24', colors.navy]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.compBadge}><Text style={styles.compText} numberOfLines={1}>{nextMatch?.competition || nextMatch?.category || 'WNT'}</Text></View>
            <Text style={styles.heroLabel}>{t('nextMatch')}{nextMatch ? ` · ${formatDate(nextMatch.date)}` : ''}</Text>
          </View>

          <View style={styles.teams}>
            <View style={styles.team}>
              <Flag name="Tunisia" width={28} />
              <Text style={styles.teamName} numberOfLines={1}>Tunisia</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.team}>
              <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={1}>{nextMatch?.opponent || t('noMatchScheduled')}</Text>
              {nextMatch && flagCodeFor(nextMatch.opponent) ? (
                <Flag name={nextMatch.opponent} width={28} />
              ) : (
                <View style={styles.crest}><Text style={styles.crestText}>{nextMatch ? code(nextMatch.opponent) : '?'}</Text></View>
              )}
            </View>
          </View>

          <View style={styles.bottomRow}>
            {/* The platform stores a date only, so the countdown runs to the start of that day. */}
            <Countdown
              target={nextMatch ? `${nextMatch.date}T00:00:00` : ''}
              labels={{ days: t('days'), hrs: t('hrs'), min: t('min'), sec: t('sec') }}
            />
            <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/match-details')} accessibilityRole="button" accessibilityLabel={t('viewDetails')}>
              <Text style={styles.heroBtnText} numberOfLines={1}>{t('matchDetails')}</Text>
              <ForwardChevron color={colors.navy} size={14} />
            </TouchableOpacity>
          </View>

          {!!nextMatch?.venue && (
            <View style={styles.infoRow}>
              <MapPin color={colors.gold} size={12} />
              <Text style={styles.infoText} numberOfLines={1}>{nextMatch.venue}</Text>
            </View>
          )}
        </LinearGradient>

        <AnnouncementsCard />
        <MatchTravelCard />
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/more/games')} style={styles.gamesCard}>
          <View style={styles.gamesIcon}>
            <Gamepad2 size={22} color={colors.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gamesTitle}>{t('tabGames')}</Text>
            <Text style={styles.gamesDesc}>{t('moreGamesDesc')}</Text>
          </View>
          <ForwardChevron />
        </TouchableOpacity>

        {/* Squad readiness: hidden when this account cannot see medical data */}
        {total > 0 && (
        <Card>
          <Text style={styles.section}>{t('readiness')}</Text>
          <View style={styles.readyRow}>
            <Text style={styles.readyBig}>
              {fitCount}<Text style={styles.readySlash}> / {total}</Text>
            </Text>
            <Text style={styles.readyLabel}>{t('playersFit')}</Text>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${fitRatio * 100}%` }]} /></View>
          <View style={styles.recoveryChip}>
            <View style={styles.amberDot} />
            <Text style={styles.recoveryText}>{recoveryCount} {t('inRecovery')}</Text>
          </View>
        </Card>

        )}

        {/* Upcoming fixtures */}
        <Card>
          <Text style={styles.section}>{t('todaysAgenda')}</Text>
          {upcoming.length === 0 && <Text style={styles.agendaPlace}>{t('noUpcoming')}</Text>}
          {upcoming.map((m, i) => (
            <View key={m.id} style={[styles.agendaRow, i > 0 && styles.agendaDivider]}>
              <Text style={styles.agendaTime}>{formatDate(m.date).replace(/ \d{4}$/, '')}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.vsRow}><Flag name="Tunisia" width={18} /><Text style={styles.agendaTitle}>vs</Text><Flag name={m.opponent} width={18} /><Text style={[styles.agendaTitle, { flexShrink: 1 }]} numberOfLines={1}>{m.opponent}</Text></View>
                <Text style={styles.agendaPlace}>{[m.competition, m.venue].filter(Boolean).join(' · ') || m.category}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  hero: { borderRadius: 16, padding: space.md, borderWidth: 1, borderColor: colors.goldBorder, gap: space.sm },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compBadge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, flexShrink: 1 },
  compText: { color: colors.navy, fontWeight: '800', fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' },
  teams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crest: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.white, backgroundColor: '#1E8E5A', alignItems: 'center', justifyContent: 'center' },
  crestText: { color: colors.white, fontWeight: '800', fontSize: 9 },
  teamName: { color: colors.white, fontWeight: '700', fontSize: 13, flexShrink: 1 },
  vs: { color: colors.gold, fontWeight: '800', fontSize: 11 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { color: colors.white, fontSize: 11, flexShrink: 1 },
  heroBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 32,
    borderRadius: radius.sm + 2, backgroundColor: colors.gold, marginLeft: space.sm,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  heroBtnText: { color: colors.navy, fontWeight: '800', fontSize: 12 },
  gamesCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.goldBorder, padding: space.md },
  gamesIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  gamesTitle: { color: colors.white, fontSize: 15, fontWeight: '800' },
  gamesDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  section: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  readyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  readyBig: { color: colors.white, fontSize: 38, fontWeight: '800' },
  readySlash: { color: colors.muted, fontSize: 22, fontWeight: '700' },
  readyLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
  recoveryChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.amberSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  amberDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  recoveryText: { color: colors.amber, fontWeight: '700', fontSize: 13 },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: 12 },
  agendaDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  agendaTime: { color: colors.gold, fontSize: 15, fontWeight: '800', width: 74, fontVariant: ['tabular-nums'] },
  agendaTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  agendaPlace: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
