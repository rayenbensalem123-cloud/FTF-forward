import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, MapPin } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { CP } from '@/i18n/campStrings';
import { campState, dmy, fetchCamps, groupByDay, type Camp, type CampState } from '@/lib/camps';
import { fetchStaff } from '@/lib/staff';

const STATE_COLOR: Record<CampState, string> = { upcoming: colors.gold, live: colors.green, done: colors.muted };

/** The platform's national camps: dates, venue, program by day, call-ups, staff, report and photos. */
export default function CampsScreen() {
  const { language } = useLanguage();
  const { players } = usePlayers();
  const T = CP[language];
  const [camps, setCamps] = useState<Camp[]>([]);
  const [staffNames, setStaffNames] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const nameOf = useMemo(() => new Map(players.map((p) => [Number(p.id), p.name])), [players]);

  const load = useCallback(async () => {
    try {
      const list = await fetchCamps();
      setCamps(list);
      setOpen((cur) => cur ?? list.find((c) => campState(c) !== 'done')?.id ?? null);
      fetchStaff().then((s) => setStaffNames(new Map(s.map((m) => [m.id, m.name])))).catch(() => {});
    } catch (e: any) {
      Alert.alert(T.title, e?.message ?? T.failed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [T]);
  useEffect(() => { load(); }, [load]);

  const label: Record<CampState, string> = { upcoming: T.upcoming, live: T.live, done: T.done };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
      >
        <AppHeader back showBell={false} />
        <View>
          <Text style={styles.title}>{T.title}</Text>
          <Text style={styles.sub}>{T.sub}</Text>
        </View>
        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: space.xl }} />
          : camps.length === 0 ? <Text style={styles.empty}>{T.none}</Text>
          : camps.map((c) => {
            const st = campState(c);
            const isOpen = open === c.id;
            const days = groupByDay(c.program);
            return (
              <Card key={c.id} style={{ gap: space.sm }}>
                <TouchableOpacity onPress={() => setOpen(isOpen ? null : c.id)} activeOpacity={0.8} accessibilityRole="button">
                  <View style={styles.top}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{c.name}</Text>
                      <Text style={styles.meta}>{dmy(c.start)} → {dmy(c.end)}{c.category ? `  ·  ${c.category}` : ''}</Text>
                      {!!c.location && <View style={styles.loc}><MapPin size={12} color={colors.muted} /><Text style={styles.meta}>{c.location}</Text></View>}
                    </View>
                    <View style={[styles.badge, { borderColor: STATE_COLOR[st] }]}>
                      <Text style={[styles.badgeText, { color: STATE_COLOR[st] }]}>{label[st]}</Text>
                    </View>
                  </View>
                  <Text style={[styles.meta, { marginTop: 6 }]}>
                    {c.program.length} {c.program.length === 1 ? T.session : T.sessions}  ·  {c.players.length} {T.called}
                  </Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={{ gap: space.md, marginTop: space.xs }}>
                    <View>
                      <Text style={styles.section}>{T.program}</Text>
                      {days.length === 0 ? <Text style={styles.meta}>{T.noProgram}</Text> : days.map((d) => (
                        <View key={d.day} style={{ marginBottom: 8 }}>
                          <Text style={styles.day}>{d.day}</Text>
                          {d.items.map((s, i) => (
                            <View key={i} style={styles.session}>
                              <Text style={styles.time}>{s.time}</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.activity}>{s.activity}</Text>
                                {!!s.details && <Text style={styles.meta}>{s.details}</Text>}
                              </View>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>

                    <View>
                      <Text style={styles.section}>{T.players} ({c.players.length})</Text>
                      {c.players.length === 0 ? <Text style={styles.meta}>{T.noPlayers}</Text>
                        : <Text style={styles.names}>{c.players.map((id) => nameOf.get(id) ?? `#${id}`).join(', ')}</Text>}
                    </View>

                    {c.staffRoles.length > 0 && (
                      <View>
                        <Text style={styles.section}>{T.staff}</Text>
                        {c.staffRoles.map((s) => (
                          <Text key={s.memberId} style={styles.names}>{staffNames.get(s.memberId) ?? `#${s.memberId}`}{s.role ? ` — ${s.role}` : ''}</Text>
                        ))}
                      </View>
                    )}

                    {!!c.reportUrl && (
                      <TouchableOpacity style={styles.report} onPress={() => Linking.openURL(c.reportUrl).catch(() => {})} accessibilityRole="link">
                        <FileText size={16} color="#7EC3FF" />
                        <Text style={styles.reportText}>{c.reportName || T.openReport}</Text>
                      </TouchableOpacity>
                    )}

                    {c.images.length > 0 && (
                      <View>
                        <Text style={styles.section}>{T.photos}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                          {c.images.map((u) => <Image key={u} source={{ uri: u }} style={styles.photo} />)}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: space.xl },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  name: { color: colors.white, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  section: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  day: { color: colors.white, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  session: { flexDirection: 'row', gap: 10, paddingVertical: 3 },
  time: { color: colors.gold, fontSize: 12, fontWeight: '800', width: 62 },
  activity: { color: colors.white, fontSize: 13 },
  names: { color: colors.white, fontSize: 13, lineHeight: 20 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportText: { color: '#7EC3FF', fontSize: 13, fontWeight: '800' },
  photo: { width: 120, height: 90, borderRadius: 10, backgroundColor: colors.cardRaised },
});
