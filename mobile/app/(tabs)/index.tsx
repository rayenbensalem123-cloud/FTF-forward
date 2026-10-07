import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, MapPin } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { SyncBanner } from '@/components/SyncBanner';
import { Card } from '@/components/Card';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatDate, pad2 } from '@/lib/format';
import { useCountdown } from '@/lib/useCountdown';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { players, nextMatch, upcoming, refresh, refreshing } = usePlayers();
  // The platform stores a date only, so the countdown runs to the start of that day.
  const cd = useCountdown(nextMatch ? `${nextMatch.date}T00:00:00` : '');
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
            <View style={styles.compBadge}><Text style={styles.compText}>{nextMatch?.competition || nextMatch?.category || 'WNT'}</Text></View>
            <Text style={styles.heroLabel}>{t('nextMatch')}</Text>
          </View>

          <View style={styles.teams}>
            <View style={styles.team}>
              <View style={[styles.crest, { backgroundColor: colors.red }]}><Text style={styles.crestText}>TUN</Text></View>
              <Text style={styles.teamName}>Tunisia</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.team}>
              <View style={[styles.crest, { backgroundColor: '#1E8E5A' }]}><Text style={styles.crestText}>{nextMatch ? code(nextMatch.opponent) : '?'}</Text></View>
              <Text style={styles.teamName}>{nextMatch?.opponent || t('noMatchScheduled')}</Text>
            </View>
          </View>

          <Text style={styles.kickoffIn}>{t('kickoffIn')}</Text>
          <View style={styles.countdown} accessibilityRole="timer">
            {([
              [cd.days, t('days')],
              [cd.hours, t('hrs')],
              [cd.minutes, t('min')],
              [cd.seconds, t('sec')],
            ] as const).map(([v, label]) => (
              <View key={label} style={styles.cdBox}>
                <Text style={styles.cdValue}>{pad2(v)}</Text>
                <Text style={styles.cdLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {!!nextMatch?.venue && (
            <View style={styles.infoRow}>
              <MapPin color={colors.gold} size={15} />
              <Text style={styles.infoText}>{nextMatch.venue}</Text>
            </View>
          )}
          {!!nextMatch && (
            <View style={styles.infoRow}>
              <Clock color={colors.gold} size={15} />
              <Text style={styles.infoText}>{formatDate(nextMatch.date)}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/match-details')} accessibilityRole="button">
            <Text style={styles.heroBtnText}>{t('viewDetails')}</Text>
            <ChevronRight color={colors.navy} size={18} />
          </TouchableOpacity>
        </LinearGradient>

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
                <Text style={styles.agendaTitle}>Tunisia vs {m.opponent}</Text>
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
  hero: { borderRadius: 26, padding: space.lg, borderWidth: 1, borderColor: colors.goldBorder, gap: space.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compBadge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  compText: { color: colors.navy, fontWeight: '800', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  teams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 4 },
  team: { alignItems: 'center', gap: 6, minWidth: 80 },
  crest: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  crestText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  teamName: { color: colors.white, fontWeight: '700', fontSize: 14 },
  vs: { color: colors.gold, fontWeight: '800', fontSize: 16 },
  kickoffIn: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center', marginTop: 4 },
  countdown: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  cdBox: { minWidth: 62, alignItems: 'center', backgroundColor: 'rgba(7,19,38,0.55)', borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 6 },
  cdValue: { color: colors.white, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cdLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: colors.white, fontSize: 13, flexShrink: 1 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48,
    borderRadius: radius.md, backgroundColor: colors.gold, marginTop: 4,
  },
  heroBtnText: { color: colors.navy, fontWeight: '800', fontSize: 14 },
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
