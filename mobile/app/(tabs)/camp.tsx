import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Trash2, Upload } from 'lucide-react-native';
import { colors, fonts, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { usePlayers } from '@/context/PlayersContext';
import { groupByDay, matchPlayerId, type CampActivity, type CampSchedule } from '@/lib/campProgram';
import { loadLatestSchedule, saveSchedule } from '@/lib/campSchedule';

/**
 * The coach's place to add or change the camp daily program.
 * Sessions are edited locally (add / remove), then saved as a draft or
 * published to the players, which bumps the version they see.
 */
export default function CampScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { players } = usePlayers();
  const [existing, setExisting] = useState<CampSchedule | null>(null);
  const [acts, setActs] = useState<CampActivity[]>([]);
  const [dayIdx, setDayIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState(false);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [who, setWho] = useState('');

  const load = useCallback(async () => {
    try {
      const s = await loadLatestSchedule();
      setExisting(s);
      setActs(s?.activities ?? []);
      setDirty(false);
    } catch {
      // keep what is on screen
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { if (!dirty) void load(); }, [load, dirty]));

  const days = useMemo(() => groupByDay(acts), [acts]);
  const current = days.find((d) => d.dayIndex === dayIdx) ?? days[0];
  const activeIndex = current?.dayIndex ?? 0;

  const addDay = () => {
    const next = acts.reduce((m, a) => Math.max(m, a.dayIndex), -1) + 1;
    setDayIdx(next);
    setAdding(true);
  };

  const addSession = () => {
    if (!title.trim()) return;
    const label = current?.dayLabel ?? `Day ${activeIndex + 1}`;
    const seq = acts.reduce((m, a) => Math.max(m, a.seq), -1) + 1;
    const playerLabel = who.trim();
    setActs([
      ...acts,
      {
        id: `new-${Date.now()}`,
        dayIndex: activeIndex,
        dayLabel: label,
        seq,
        time: time.trim(),
        activity: title.trim(),
        playerId: playerLabel ? matchPlayerId(playerLabel, players) : null,
        playerLabel,
      },
    ]);
    setTime(''); setTitle(''); setWho(''); setAdding(false); setDirty(true);
  };

  const removeSession = (id: string | number) => {
    setActs(acts.filter((a) => a.id !== id));
    setDirty(true);
  };

  const save = async (publish: boolean) => {
    setBusy(true);
    try {
      const saved = await saveSchedule(
        {
          title: existing?.title || 'Camp program',
          sourceFile: existing?.sourceFile || '',
          activities: acts,
          publish,
          author: user?.name ?? null,
        },
        existing ?? undefined,
      );
      setExisting(saved);
      setActs(saved.activities);
      setDirty(false);
      Alert.alert(publish ? 'Published' : 'Draft saved', publish ? 'Players can see the new program.' : 'Players will not see it until you publish.');
    } catch {
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.white} />}
      >
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Camp program</Text>
            {existing && (
              <View style={styles.badges}>
                <Text style={[styles.badge, existing.status === 'published' && styles.badgeGreen]}>
                  {existing.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                </Text>
                <Text style={styles.badge}>V{existing.version}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.importBtn} onPress={() => router.push('/more/camp-schedule')} accessibilityRole="button">
            <Upload color={colors.white} size={16} />
            <Text style={styles.importText}>Import</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color={colors.white} /> : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {(days.length ? days : [{ dayIndex: 0, dayLabel: 'Day 1', activities: [] }]).map((d) => {
                const on = d.dayIndex === activeIndex;
                return (
                  <TouchableOpacity key={d.dayIndex} style={[styles.dayChip, on && styles.dayChipOn]} onPress={() => setDayIdx(d.dayIndex)}>
                    <Text style={[styles.dayText, on && styles.dayTextOn]}>{d.dayLabel}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.dayChip} onPress={addDay} accessibilityLabel="Add day">
                <Plus color={colors.white} size={18} />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.list}>
              {(current?.activities ?? []).map((a, i) => (
                <View key={String(a.id)} style={[styles.row, i > 0 && styles.divider]}>
                  <Text style={styles.time}>{a.time || '--:--'}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.act}>{a.activity}</Text>
                    <Text style={[styles.who, !!a.playerLabel && { color: colors.red }]}>
                      {a.playerLabel ? `Only ${a.playerLabel}` : 'Everyone'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => removeSession(a.id)} accessibilityLabel="Remove session">
                    <Trash2 color={colors.muted} size={18} />
                  </TouchableOpacity>
                </View>
              ))}
              {(current?.activities ?? []).length === 0 && <Text style={styles.empty}>No sessions on this day yet.</Text>}
            </View>

            {adding ? (
              <View style={styles.form}>
                <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="Time, e.g. 09:00" placeholderTextColor={colors.muted} />
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Session title" placeholderTextColor={colors.muted} />
                <TextInput style={styles.input} value={who} onChangeText={setWho} placeholder="Player name (empty = everyone)" placeholderTextColor={colors.muted} />
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setAdding(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={addSession}><Text style={styles.btnText}>Add</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)} accessibilityRole="button">
                <Plus color={colors.white} size={18} />
                <Text style={styles.importText}>Add session</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost, busy && { opacity: 0.5 }]} disabled={busy} onPress={() => save(false)}>
                <Text style={styles.btnText}>Save draft</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnRed, busy && { opacity: 0.5 }]} disabled={busy} onPress={() => save(true)}>
                <Text style={styles.btnText}>Publish to players</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { color: colors.white, fontFamily: fonts.display, fontSize: 26, textTransform: 'uppercase' },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { color: colors.muted, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, overflow: 'hidden' },
  badgeGreen: { color: colors.green, borderColor: colors.green },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.cardRaised },
  importText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  dayChip: { minWidth: 44, minHeight: 44, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  dayChipOn: { backgroundColor: colors.red, borderColor: colors.red },
  dayText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  dayTextOn: { color: '#fff' },
  list: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  time: { width: 56, color: colors.white, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  act: { color: colors.white, fontSize: 14, fontWeight: '700' },
  who: { color: colors.muted, fontSize: 12, marginTop: 2 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  addBtn: { flexDirection: 'row', gap: 8, minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  form: { gap: space.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, padding: space.md },
  input: { minHeight: 48, borderRadius: radius.sm, backgroundColor: colors.cardRaised, color: colors.white, paddingHorizontal: 14, fontSize: 15 },
  btn: { flex: 1, minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnRed: { backgroundColor: colors.red },
  btnGhost: { backgroundColor: colors.cardRaised },
  btnText: { color: '#fff', fontFamily: fonts.display, fontSize: 15, letterSpacing: 0.8, textTransform: 'uppercase' },
});
