import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarPlus, ChevronRight, Film, IdCard } from 'lucide-react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { FitnessBadge } from '@/components/FitnessBadge';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { CS } from '@/i18n/careerStrings';
import { addMatchesToCalendar, addMatchToCalendar, type CalendarResult } from '@/lib/calendar';
import { formatDate } from '@/lib/format';
import { fetchReports, type ClubReport } from '@/lib/clubReports';

function RatingSparkline({ reports }: { reports: ClubReport[] }) {
  const rated = useMemo(
    () => [...reports].filter((r) => r.rating != null).sort((a, b) => a.date.localeCompare(b.date)),
    [reports],
  );
  if (rated.length < 2) return null;

  const W = 300;
  const H = 72;
  const PAD = 8;
  const step = (W - PAD * 2) / (rated.length - 1);
  const y = (v: number) => H - PAD - ((v / 10) * (H - PAD * 2));
  const points = rated.map((r, i) => `${PAD + i * step},${y(r.rating as number)}`).join(' ');
  const avg = rated.reduce((s, r) => s + (r.rating as number), 0) / rated.length;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Polyline points={points} fill="none" stroke={colors.gold} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {rated.map((r, i) => (
          <Circle key={r.id} cx={PAD + i * step} cy={y(r.rating as number)} r={3} fill={colors.gold} />
        ))}
      </Svg>
      <Text style={styles.avgText}>{avg.toFixed(1)}/10</Text>
    </View>
  );
}

export default function CareerScreen() {
  const { language } = useLanguage();
  const T = CS[language];
  const { user } = useAuth();
  const { getPlayer, nextMatch, upcoming, refresh, refreshing } = usePlayers();
  const router = useRouter();
  const [reports, setReports] = useState<ClubReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<'one' | 'all' | null>(null);

  const memberId = user?.memberId ?? null;
  const player = memberId != null ? getPlayer(String(memberId)) : undefined;

  const load = useCallback(async () => {
    try {
      const all = await fetchReports();
      setReports(memberId != null ? all.filter((r) => r.memberId === memberId) : []);
    } catch {
      // offline or not linked: show what we have
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const played = useMemo(() => reports.filter((r) => !r.didNotPlay), [reports]);
  const clubGoals = played.reduce((s, r) => s + r.goals, 0);
  const clubAssists = played.reduce((s, r) => s + r.assists, 0);
  const clubMinutes = played.reduce((s, r) => s + r.minutes, 0);
  const clips = useMemo(
    () => [...reports].filter((r) => r.highlightsUrl).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
    [reports],
  );

  const onToast = (res: CalendarResult, okMsg: string) => {
    if (res === 'added') Alert.alert(T.addToCalendar, okMsg);
    else if (res === 'denied') Alert.alert(T.addToCalendar, T.calendarDenied);
    else Alert.alert(T.addToCalendar, T.calendarFailed);
  };

  const syncNext = async () => {
    if (!nextMatch) return;
    setSyncing('one');
    const res = await addMatchToCalendar(nextMatch);
    setSyncing(null);
    onToast(res, T.addedToCalendar);
  };

  const syncAll = async () => {
    const list = [nextMatch, ...upcoming].filter((m): m is NonNullable<typeof m> => !!m);
    if (list.length === 0) return;
    setSyncing('all');
    const res = await addMatchesToCalendar(list);
    setSyncing(null);
    onToast(res, T.allSynced);
  };

  if (!loading && memberId == null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppHeader back showBell={false} />
          <Text style={styles.title}>{T.career}</Text>
          <Text style={styles.empty}>{T.notLinked}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { load(); refresh(); }} tintColor={colors.gold} />}
      >
        <AppHeader back showBell={false} />
        <Text style={styles.title}>{T.career}</Text>

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: space.xl }} />
        ) : (
          <>
            <Card style={{ gap: space.md }}>
              <Text style={styles.section}>{T.nationalTeam}</Text>
              <View style={styles.statRow}>
                <View style={styles.statTile}><Text style={styles.statValue}>{player?.caps ?? 0}</Text><Text style={styles.statLabel}>{T.caps}</Text></View>
                <View style={styles.statTile}><Text style={[styles.statValue, { color: colors.green }]}>{player?.goals ?? 0}</Text><Text style={styles.statLabel}>{T.goals}</Text></View>
                <View style={styles.statTile}><Text style={[styles.statValue, { color: '#7EC3FF' }]}>{player?.assists ?? 0}</Text><Text style={styles.statLabel}>{T.assists}</Text></View>
              </View>
            </Card>

            <Card style={{ gap: space.md }}>
              <Text style={styles.section}>{T.clubSeason}</Text>
              <View style={styles.statRow}>
                <View style={styles.statTile}><Text style={styles.statValue}>{played.length}</Text><Text style={styles.statLabel}>{T.matches}</Text></View>
                <View style={styles.statTile}><Text style={[styles.statValue, { color: colors.green }]}>{clubGoals}</Text><Text style={styles.statLabel}>{T.goals}</Text></View>
                <View style={styles.statTile}><Text style={[styles.statValue, { color: '#7EC3FF' }]}>{clubAssists}</Text><Text style={styles.statLabel}>{T.assists}</Text></View>
                <View style={styles.statTile}><Text style={styles.statValue}>{clubMinutes}</Text><Text style={styles.statLabel}>{T.minutes}</Text></View>
              </View>
              <View>
                <Text style={styles.subSection}>{T.ratingTrend}</Text>
                <RatingSparkline reports={reports} />
                {played.filter((r) => r.rating != null).length === 0 && <Text style={styles.emptySmall}>{T.noRatings}</Text>}
              </View>
            </Card>

            <Card style={{ gap: space.sm }}>
              <View style={styles.rowBetween}>
                <Text style={styles.section}>{T.highlights}</Text>
                {clips.length > 0 && (
                  <TouchableOpacity onPress={() => router.push('/more/highlights')} accessibilityRole="button" style={styles.rowBetween}>
                    <Text style={styles.link}>{T.viewAllHighlights}</Text>
                    <ChevronRight size={14} color={colors.gold} />
                  </TouchableOpacity>
                )}
              </View>
              {clips.length === 0 ? (
                <Text style={styles.emptySmall}>{T.noHighlights}</Text>
              ) : (
                clips.map((r) => (
                  <TouchableOpacity key={r.id} style={styles.clipRow} onPress={() => router.push('/more/highlights')} accessibilityRole="button">
                    <View style={styles.clipIcon}><Film size={16} color={colors.gold} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.clipTitle} numberOfLines={1}>{r.opponent || '—'}</Text>
                      <Text style={styles.clipMeta}>{r.date ? formatDate(r.date) : ''}</Text>
                    </View>
                    <ChevronRight size={16} color={colors.muted} />
                  </TouchableOpacity>
                ))
              )}
            </Card>

            <Card style={{ gap: space.sm }}>
              <Text style={styles.section}>{T.injuryTimeline}</Text>
              {player && <FitnessBadge status={player.status} />}
              {!player || player.medicalLog.length === 0 ? (
                <Text style={styles.emptySmall}>{T.noInjuries}</Text>
              ) : (
                <View style={{ marginTop: space.sm }}>
                  {player.medicalLog.map((e, i) => (
                    <View key={`${e.date}-${i}`} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View style={[styles.timelineDot, i === 0 && player.status !== 'fit' && { backgroundColor: colors.red }]} />
                        {i < player.medicalLog.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={{ flex: 1, paddingBottom: space.md }}>
                        <Text style={styles.timelineDate}>{e.date ? formatDate(e.date) : '—'}</Text>
                        <Text style={styles.timelineNote}>{e.note}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <Card style={{ gap: space.sm }}>
              <View style={styles.rowStart}><CalendarPlus size={16} color={colors.gold} /><Text style={styles.section}>{T.addToCalendar}</Text></View>
              {nextMatch ? (
                <>
                  <TouchableOpacity style={styles.calBtn} onPress={syncNext} disabled={syncing !== null} accessibilityRole="button">
                    {syncing === 'one' ? <ActivityIndicator color={colors.navy} /> : <Text style={styles.calBtnText}>vs {nextMatch.opponent} · {formatDate(nextMatch.date)}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calBtnGhost} onPress={syncAll} disabled={syncing !== null} accessibilityRole="button">
                    {syncing === 'all' ? <ActivityIndicator color={colors.gold} /> : <Text style={styles.calBtnGhostText}>{T.syncAllMatches}</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptySmall}>—</Text>
              )}
            </Card>

            <TouchableOpacity style={styles.idCardCard} onPress={() => router.push('/id-card')} activeOpacity={0.85} accessibilityRole="button">
              <View style={styles.idCardIcon}><IdCard size={20} color={colors.navy} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.idCardTitle}>{T.idCard}</Text>
                <Text style={styles.idCardSub}>{T.idCardSub}</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: space.xl },
  emptySmall: { color: colors.muted, fontSize: 12, paddingVertical: space.sm },
  section: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  subSection: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statRow: { flexDirection: 'row', gap: space.sm },
  statTile: { flex: 1, backgroundColor: colors.navyDeep, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.goldBorder, paddingVertical: space.sm, alignItems: 'center' },
  statValue: { color: colors.white, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  avgText: { color: colors.gold, fontSize: 11, fontWeight: '800', textAlign: 'right', marginTop: 2 },
  link: { color: colors.gold, fontSize: 11, fontWeight: '800' },
  clipRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  clipIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  clipTitle: { color: colors.white, fontSize: 13, fontWeight: '700' },
  clipMeta: { color: colors.muted, fontSize: 11, marginTop: 1 },
  timelineRow: { flexDirection: 'row', gap: space.sm },
  timelineRail: { width: 14, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.amber, marginTop: 3 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.line, marginTop: 2 },
  timelineDate: { color: colors.gold, fontSize: 11, fontWeight: '800' },
  timelineNote: { color: colors.white, fontSize: 13, marginTop: 2 },
  calBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  calBtnText: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  calBtnGhost: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, paddingVertical: 12, alignItems: 'center' },
  calBtnGhostText: { color: colors.gold, fontWeight: '800', fontSize: 13 },
  idCardCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.goldBorder, padding: space.md },
  idCardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  idCardTitle: { color: colors.white, fontSize: 15, fontWeight: '800' },
  idCardSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
