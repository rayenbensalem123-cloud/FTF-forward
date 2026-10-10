import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '@/components/Card';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { CK } from '@/i18n/checkinStrings';
import { fetchRecentCheckins, saveCheckin, STATES, summarize, todayUtc, type Checkin, type CheckinState } from '@/lib/checkins';

const TONE: Record<CheckinState, string> = { fit: colors.green, tired: colors.amber, sore: colors.amber, unwell: colors.red };

/** Player side: one tap to tell staff how she feels today. Hidden until the database table exists. */
export function CheckInCard({ memberId }: { memberId: number }) {
  const { language } = useLanguage();
  const T = CK[language];
  const [current, setCurrent] = useState<CheckinState | null>(null);
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState<CheckinState | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentCheckins()
      .then((rows) => setCurrent(rows.find((r) => r.memberId === memberId && r.day === todayUtc())?.state ?? null))
      .catch(() => setAvailable(false));
  }, [memberId]);

  const pick = async (s: CheckinState) => {
    setBusy(s); setNote(null);
    try { await saveCheckin(memberId, s); setCurrent(s); setNote(T.saved); }
    catch { setNote(T.failed); }
    finally { setBusy(null); }
  };

  if (!available) return null;
  return (
    <Card style={{ gap: space.md }}>
      <Text style={styles.ask}>{T.ask}</Text>
      <View style={styles.row}>
        {STATES.map((s) => {
          const on = current === s;
          return (
            <TouchableOpacity key={s} style={[styles.chip, on && { backgroundColor: TONE[s], borderColor: TONE[s] }]}
              onPress={() => pick(s)} disabled={busy !== null} accessibilityRole="button" accessibilityState={{ selected: on }}>
              {busy === s ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={[styles.chipText, on && { color: colors.navy }]}>{T[s]}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      {!!note && <Text style={styles.note}>{note}</Text>}
    </Card>
  );
}

/** Staff side: today's answers, who needs attention, and who has not answered. */
export function CheckInSummary() {
  const { language } = useLanguage();
  const { players } = usePlayers();
  const T = CK[language];
  const [rows, setRows] = useState<Checkin[] | null>(null);
  const load = useCallback(() => { fetchRecentCheckins().then(setRows).catch(() => setRows(null)); }, []);
  useEffect(load, [load]);
  const nameOf = useMemo(() => new Map(players.map((p) => [Number(p.id), p.name])), [players]);
  const sum = useMemo(() => (rows ? summarize(rows, players.map((p) => Number(p.id))) : null), [rows, players]);
  if (!sum) return null;
  return (
    <Card style={{ gap: space.sm }}>
      <Text style={styles.title}>{T.title}</Text>
      <View style={styles.row}>
        {STATES.map((s) => (
          <View key={s} style={styles.count}>
            <Text style={[styles.countNum, { color: TONE[s] }]}>{sum.counts[s]}</Text>
            <Text style={styles.countLabel}>{T[s]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>{sum.answered} / {players.length} {T.answered}</Text>
      {sum.attention.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text style={styles.sub}>{T.needsAttention}</Text>
          {sum.attention.map((r) => (
            <Text key={r.memberId} style={styles.line}>
              <Text style={{ color: TONE[r.state], fontWeight: '800' }}>{T[r.state]}</Text>  {nameOf.get(r.memberId) ?? `#${r.memberId}`}{r.note ? ` — ${r.note}` : ''}
            </Text>
          ))}
        </View>
      )}
      {sum.missing.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text style={styles.sub}>{T.notYet} ({sum.missing.length})</Text>
          <Text style={styles.line}>{sum.missing.map((id) => nameOf.get(id) ?? `#${id}`).join(', ')}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  ask: { color: colors.white, fontSize: 15, fontWeight: '800' },
  title: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: space.sm },
  chip: { flex: 1, height: 42, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  note: { color: colors.muted, fontSize: 12 },
  count: { flex: 1, alignItems: 'center' },
  countNum: { fontSize: 22, fontWeight: '800' },
  countLabel: { color: colors.muted, fontSize: 11 },
  sub: { color: colors.white, fontSize: 12, fontWeight: '800', marginTop: 4 },
  line: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
