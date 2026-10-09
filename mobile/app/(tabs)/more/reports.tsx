import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ShieldCheck, X } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Segmented } from '@/components/Chips';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { RS } from '@/i18n/reportStrings';
import {
  addReport, buildPayload, deleteReport, emptyForm, fetchReports, setVerified, type ClubReport, type ReportForm,
} from '@/lib/clubReports';

type Filter = 'pending' | 'all';

const digits = (v: string) => v.replace(/[^0-9]/g, '');
const todayIso = () => new Date().toISOString().slice(0, 10);

/** A player's own club matches, and for staff everyone's, with the platform's verify step. */
export default function ReportsScreen() {
  const { language } = useLanguage();
  const { user, can } = useAuth();
  const { players } = usePlayers();
  const T = RS[language];
  const [reports, setReports] = useState<ClubReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('pending');
  const [formOpen, setFormOpen] = useState(false);

  const memberId = user?.memberId ?? null;
  const canVerify = can('editPlayer') || can('addPlayer');
  const isStaff = canVerify || user?.permissions?.viewClubReports === true;
  const nameOf = useMemo(() => new Map(players.map((p) => [Number(p.id), p.name])), [players]);

  const load = useCallback(async () => {
    try {
      setReports(await fetchReports());
    } catch (e: any) {
      Alert.alert(T.title, e?.message ?? T.failed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [T]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    if (!isStaff) return reports.filter((r) => r.memberId === memberId);
    return filter === 'pending' ? reports.filter((r) => !r.verified) : reports;
  }, [reports, isStaff, filter, memberId]);
  const pendingCount = reports.filter((r) => !r.verified).length;

  const onVerify = async (r: ClubReport) => {
    try {
      await setVerified(r.id, !r.verified, user?.username ?? '');
      await load();
    } catch (e: any) {
      Alert.alert(T.title, e?.message ?? T.failed);
    }
  };

  const onDelete = (r: ClubReport) =>
    Alert.alert(T.title, T.confirmDelete, [
      { text: T.cancel, style: 'cancel' },
      {
        text: T.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReport(r.id);
            await load();
          } catch (e: any) {
            Alert.alert(T.title, e?.message ?? T.failed);
          }
        },
      },
    ]);

  const canLog = memberId != null;

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
          <Text style={styles.sub}>{isStaff ? `${pendingCount} ${T.waiting}` : T.sub}</Text>
        </View>

        {isStaff && (
          <Segmented
            options={[{ value: 'pending', label: `${T.pending} (${pendingCount})` }, { value: 'all', label: T.all }]}
            value={filter}
            onChange={setFilter}
          />
        )}

        {canLog && (
          <TouchableOpacity style={styles.logBtn} onPress={() => setFormOpen(true)} activeOpacity={0.85} accessibilityRole="button">
            <Plus size={16} color={colors.red} />
            <Text style={styles.logText}>{T.logMatch}</Text>
          </TouchableOpacity>
        )}
        {!canLog && !isStaff && <Text style={styles.empty}>{T.notLinked}</Text>}

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: space.xl }} />
        ) : shown.length === 0 ? (
          (canLog || isStaff) && <Text style={styles.empty}>{T.none}</Text>
        ) : (
          shown.map((r) => (
            <ReportCard
              key={r.id}
              r={r}
              T={T}
              who={isStaff ? nameOf.get(r.memberId) ?? `#${r.memberId}` : null}
              canVerify={canVerify}
              canDelete={r.memberId === memberId || canVerify}
              onVerify={() => onVerify(r)}
              onDelete={() => onDelete(r)}
            />
          ))
        )}
      </ScrollView>

      {formOpen && memberId != null && (
        <ReportForm_
          T={T}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await load();
          }}
          memberId={memberId}
        />
      )}
    </SafeAreaView>
  );
}

function ReportCard({ r, T, who, canVerify, canDelete, onVerify, onDelete }: {
  r: ClubReport; T: (typeof RS)['en']; who: string | null; canVerify: boolean; canDelete: boolean; onVerify: () => void; onDelete: () => void;
}) {
  return (
    <Card style={{ gap: space.sm }}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          {who && <Text style={styles.who}>{who}</Text>}
          <Text style={styles.opp}>{r.opponent || T.unknownOpponent}</Text>
          <Text style={styles.meta}>{[r.date, r.competition, r.result].filter(Boolean).join('  ·  ')}</Text>
        </View>
        {r.verified && (
          <View style={styles.verified}>
            <ShieldCheck size={12} color={colors.green} />
            <Text style={styles.verifiedText}>{T.verified}</Text>
          </View>
        )}
      </View>

      {r.didNotPlay ? (
        <Text style={styles.dnp}>{T.didNotPlay}</Text>
      ) : (
        <View style={styles.stats}>
          {r.isStarting != null && <Text style={[styles.stat, { color: r.isStarting ? '#7EC3FF' : colors.muted }]}>{r.isStarting ? T.started : T.bench}</Text>}
          {!!r.position && <Text style={styles.stat}>{r.position}</Text>}
          <Text style={styles.stat}>{r.minutes}&apos; {T.mins}</Text>
          <Text style={[styles.stat, { color: colors.green }]}>{r.goals} {T.goals}</Text>
          <Text style={[styles.stat, { color: '#7EC3FF' }]}>{r.assists} {T.assists}</Text>
          {r.yellow > 0 && <Text style={[styles.stat, { color: colors.gold }]}>{r.yellow} {T.yc}</Text>}
          {r.red > 0 && <Text style={[styles.stat, { color: colors.red }]}>{r.red} {T.rc}</Text>}
          {r.rating != null && <Text style={[styles.stat, { color: colors.gold }]}>{T.ratingShort} {r.rating}</Text>}
        </View>
      )}

      {r.hadInjury && <Text style={styles.injury}>{T.injuryFlag}{r.injuryNotes ? ` — ${r.injuryNotes}` : ''}</Text>}
      {!!r.notes && <Text style={styles.notes}>{r.notes}</Text>}
      {!!r.highlightsUrl && (
        <TouchableOpacity onPress={() => Linking.openURL(r.highlightsUrl).catch(() => {})} accessibilityRole="link">
          <Text style={styles.link}>{T.watchHighlights} ↗</Text>
        </TouchableOpacity>
      )}
      {r.verified && !!r.verifiedBy && <Text style={styles.meta}>{T.verifiedBy} {r.verifiedBy}</Text>}

      {(canVerify || canDelete) && (
        <View style={styles.actions}>
          {canDelete && (
            <TouchableOpacity onPress={onDelete} accessibilityRole="button">
              <Text style={[styles.action, { color: colors.red }]}>{T.remove}</Text>
            </TouchableOpacity>
          )}
          {canVerify && (
            <TouchableOpacity onPress={onVerify} accessibilityRole="button">
              <Text style={[styles.action, { color: colors.green }]}>{r.verified ? T.unverify : T.verify}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
}

function Toggle({ options, value, onChange }: { options: { value: string; label: string; tone?: string }[]; value: string; onChange: (v: any) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity key={o.value} style={[styles.toggle, on && { backgroundColor: o.tone ?? colors.red, borderColor: o.tone ?? colors.red }]} onPress={() => onChange(o.value)} accessibilityRole="button">
            <Text style={[styles.toggleText, on && { color: '#fff' }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ReportForm_({ T, memberId, onClose, onSaved }: { T: (typeof RS)['en']; memberId: number; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<ReportForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ReportForm>(k: K, v: ReportForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const num = (k: keyof ReportForm) => (v: string) => set(k, digits(v) as any);

  const save = async () => {
    const { payload, error } = buildPayload(f, todayIso());
    if (!payload) {
      Alert.alert(T.logMatch, error === 'opponent' ? T.needOpponent : T.needDate);
      return;
    }
    setSaving(true);
    try {
      await addReport(memberId, payload);
      onSaved();
    } catch (e: any) {
      Alert.alert(T.failed, e?.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  const input = (ph: string, value: string, on: (v: string) => void, extra: object = {}) => (
    <TextInput style={styles.input} placeholder={ph} placeholderTextColor={colors.muted} value={value} onChangeText={on} {...extra} />
  );
  const label = (s: string) => <Text style={styles.label}>{s}</Text>;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{T.logMatch}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={T.cancel}>
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ gap: space.md, paddingBottom: space.lg }} keyboardShouldPersistTaps="handled">
            {input(T.datePh, f.date, (v) => set('date', v), { keyboardType: 'numbers-and-punctuation', maxLength: 10 })}
            {input(T.opponentPh, f.opponent, (v) => set('opponent', v))}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={{ flex: 1 }}>{input(T.competitionPh, f.competition, (v) => set('competition', v))}</View>
              <View style={{ width: 110 }}>{input(T.resultPh, f.result, (v) => set('result', v))}</View>
            </View>

            {label(T.playedQuestion)}
            <Toggle value={f.didNotPlay ? 'no' : 'yes'} onChange={(v) => set('didNotPlay', v === 'no')} options={[{ value: 'yes', label: T.playedYes }, { value: 'no', label: T.playedNo }]} />

            {!f.didNotPlay && (
              <>
                {input(T.positionPh, f.position, (v) => set('position', v))}
                <View style={styles.grid}>
                  <View style={styles.cell}>{label(T.mins)}{input('0', f.minutes, num('minutes'), { keyboardType: 'number-pad' })}</View>
                  <View style={styles.cell}>{label(T.goals)}{input('0', f.goals, num('goals'), { keyboardType: 'number-pad' })}</View>
                  <View style={styles.cell}>{label(T.assists)}{input('0', f.assists, num('assists'), { keyboardType: 'number-pad' })}</View>
                  <View style={[styles.cell, { flexDirection: 'row', gap: space.sm }]}>
                    <View style={{ flex: 1 }}>{label(T.yc)}{input('0', f.yellow, num('yellow'), { keyboardType: 'number-pad' })}</View>
                    <View style={{ flex: 1 }}>{label(T.rc)}{input('0', f.red, num('red'), { keyboardType: 'number-pad' })}</View>
                  </View>
                </View>

                {label(T.startingQuestion)}
                <Toggle value={f.isStarting} onChange={(v) => set('isStarting', v)} options={[{ value: 'yes', label: T.startedLabel }, { value: 'no', label: T.benchLabel }]} />

                {label(T.ratingLabel)}
                {input(T.ratingPh, f.rating, (v) => {
                  const c = v.replace(/[^0-9.]/g, '');
                  const n = parseFloat(c);
                  if (c !== '' && !isNaN(n) && n > 10) return;
                  set('rating', c);
                }, { keyboardType: 'decimal-pad' })}

                {label(T.highlightsLabel)}
                {input(T.highlightsPh, f.highlightsUrl, (v) => set('highlightsUrl', v), { autoCapitalize: 'none', keyboardType: 'url' })}

                {label(T.injuryQuestion)}
                <Toggle value={f.hadInjury} onChange={(v) => set('hadInjury', v)} options={[{ value: 'no', label: T.noLabel, tone: '#27406B' }, { value: 'yes', label: T.yesLabel, tone: colors.red }]} />
                {f.hadInjury === 'yes' && input(T.injuryNotesPh, f.injuryNotes, (v) => set('injuryNotes', v), { multiline: true })}
              </>
            )}
            {input(T.notesPh, f.notes, (v) => set('notes', v), { multiline: true })}

            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose} accessibilityRole="button">
                <Text style={styles.btnGhostText}>{T.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { flex: 2 }, saving && { opacity: 0.6 }]} onPress={save} disabled={saving} accessibilityRole="button">
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{T.save}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: space.xl },
  logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(227,6,19,0.5)' },
  logText: { color: colors.red, fontWeight: '800', fontSize: 13 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  who: { color: colors.gold, fontSize: 12, fontWeight: '800', marginBottom: 2 },
  opp: { color: colors.white, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  dnp: { color: colors.muted, fontStyle: 'italic', fontWeight: '700', fontSize: 13 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  stat: { color: colors.white, fontSize: 12, fontWeight: '700' },
  injury: { color: colors.red, fontSize: 12, fontWeight: '700' },
  notes: { color: colors.muted, fontSize: 12 },
  link: { color: '#7EC3FF', fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.lg, paddingTop: space.xs },
  action: { fontSize: 12, fontWeight: '800' },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.navyDeep, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, maxHeight: '92%', borderWidth: 1, borderColor: colors.goldBorder },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  sheetTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  input: { backgroundColor: colors.card, color: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.goldBorder, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { width: '48%' },
  toggle: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.card, alignItems: 'center' },
  toggleText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  btn: { flex: 1, backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.goldBorder },
  btnGhostText: { color: colors.muted, fontWeight: '800', fontSize: 14 },
});
