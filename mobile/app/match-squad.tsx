import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, Save, Sparkles, Trash2, X } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Chips, Segmented, type Option } from '@/components/Chips';
import { FitnessBadge } from '@/components/FitnessBadge';
import { Pitch } from '@/components/Pitch';
import { colors, radius, space } from '@/constants/theme';
import { FORMATION_IDS, MAX_CALL_UPS } from '@/data/formations';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useMatch } from '@/context/MatchContext';
import { usePlayers } from '@/context/PlayersContext';
import type { Category, FormationId, Player } from '@/types';

type Tab = 'lineup' | 'callups';

export default function MatchSquadScreen() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const { players, templates, saveTemplate, deleteTemplate } = usePlayers();
  const match = useMatch();
  const router = useRouter();
  const canSelect = can('selectSquad');

  const [tab, setTab] = useState<Tab>('lineup');
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const tabs: Option<Tab>[] = [
    { value: 'lineup', label: t('lineupTab') },
    { value: 'callups', label: `${t('callUpsTab')} (${match.callUps.length}/${MAX_CALL_UPS})` },
  ];
  const formations: Option<FormationId>[] = FORMATION_IDS.map((f) => ({ value: f, label: f }));

  const calledUp = useMemo(() => players.filter((p) => match.callUps.includes(p.id)), [players, match.callUps]);
  const inLineup = useMemo(() => new Set(match.lineup.filter((x): x is string => !!x)), [match.lineup]);
  const bench = useMemo(() => calledUp.filter((p) => !inLineup.has(p.id)), [calledUp, inLineup]);

  const selectedPos = slot !== null ? match.slots[slot]?.pos : undefined;
  const candidates = useMemo(() => {
    if (slot === null) return [];
    return bench
      .slice()
      .sort((a, b) => {
        const am = a.position === selectedPos ? 0 : 1;
        const bm = b.position === selectedPos ? 0 : 1;
        if (am !== bm) return am - bm;
        const af = a.status === 'fit' ? 0 : 1;
        const bf = b.status === 'fit' ? 0 : 1;
        return af - bf || b.caps - a.caps;
      });
  }, [bench, slot, selectedPos]);

  const onSlot = (i: number) => setSlot((cur) => (cur === i ? null : i));

  const saveLineup = async () => {
    const filled = match.lineup.filter(Boolean).length;
    if (!name.trim() || filled === 0) {
      Alert.alert(t('savedLineups'), t('lineupNameRequired'));
      return;
    }
    // Same rule of thumb as a coach: the category most of the eleven belong to.
    const counts = new Map<Category, number>();
    for (const p of match.lineupPlayers) if (p) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    const category = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Seniors';
    setBusy(true);
    try {
      await saveTemplate({ name: name.trim(), formation: match.formation, category, slots: match.toSlots() });
      setName('');
    } catch {
      Alert.alert(t('savedLineups'), t('saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const removeLineup = (id: number) => {
    Alert.alert(t('savedLineups'), t('confirmDeleteLineup'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deleteTemplate(id).catch(() => Alert.alert(t('savedLineups'), t('saveFailed'))),
      },
    ]);
  };

  const toggleCallUp = (id: string) => {
    if (!match.toggleCallUp(id)) Alert.alert(t('matchSquad'), t('callUpLimit'));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('matchSquad')}</Text>
        <TouchableOpacity style={styles.close} onPress={() => router.back()} accessibilityLabel={t('close')}>
          <X color={colors.white} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Segmented options={tabs} value={tab} onChange={setTab} />
        {!canSelect && <Text style={styles.viewOnly}>{t('viewOnly')}</Text>}

        {tab === 'lineup' ? (
          <>
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>{t('formation')}</Text>
              <Chips options={formations} value={match.formation} onChange={(f) => { match.setFormation(f); setSlot(null); }} disabled={!canSelect} />
            </View>

            <Pitch
              formation={match.formation}
              players={match.lineupPlayers}
              selected={slot}
              onSlotPress={canSelect ? onSlot : undefined}
            />

            {canSelect && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, { flex: 2 }]} onPress={() => { match.autoPick(); setSlot(null); }} accessibilityRole="button">
                  <Sparkles color={colors.white} size={16} />
                  <Text style={styles.btnText}>{t('autoPick')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnLine, { flex: 1 }]} onPress={() => { match.clearLineup(); setSlot(null); }} accessibilityRole="button">
                  <Text style={[styles.btnText, { color: colors.gold }]}>{t('clearLineup')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {canSelect && slot !== null && selectedPos && (
              <Card style={{ gap: space.sm }}>
                <Text style={styles.label}>{t('pickPlayer')} {selectedPos}</Text>
                {match.lineup[slot] && (
                  <TouchableOpacity style={styles.remove} onPress={() => { match.clearSlot(slot); }} accessibilityRole="button">
                    <Text style={styles.removeText}>{t('removeFromLineup')}</Text>
                  </TouchableOpacity>
                )}
                {candidates.length === 0 && <Text style={styles.empty}>–</Text>}
                {candidates.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.pickRow}
                    onPress={() => { match.assign(slot, p.id); setSlot(null); }}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.name}, ${p.position}`}
                  >
                    <Avatar name={p.name} number={p.number} size={40} photoUrl={p.photoUrl} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.pickName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.pickMeta}>{p.position === selectedPos ? p.position : `${p.position} · other position`}</Text>
                    </View>
                    <FitnessBadge status={p.status} />
                  </TouchableOpacity>
                ))}
              </Card>
            )}

            <Card style={{ gap: space.sm + 2 }}>
              <Text style={styles.label}>{t('savedLineups')}</Text>
              {canSelect && (
                <View style={styles.saveRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('lineupName')}
                    placeholderTextColor={colors.muted}
                  />
                  <TouchableOpacity style={[styles.saveBtn, busy && { opacity: 0.6 }]} onPress={saveLineup} disabled={busy} accessibilityRole="button" accessibilityLabel={t('save')}>
                    <Save color={colors.white} size={18} />
                  </TouchableOpacity>
                </View>
              )}
              {templates.length === 0 && <Text style={styles.empty}>{t('noSavedLineups')}</Text>}
              {templates.map((tpl) => (
                <View key={tpl.id} style={styles.tplRow}>
                  <TouchableOpacity style={{ flex: 1, minWidth: 0 }} onPress={() => { match.loadTemplate(tpl); setSlot(null); }} accessibilityRole="button" accessibilityLabel={`${t('loadLineup')} ${tpl.name}`}>
                    <Text style={styles.pickName} numberOfLines={1}>{tpl.name}</Text>
                    <Text style={styles.pickMeta}>{tpl.formation} · {tpl.category}{tpl.createdBy ? ` · ${tpl.createdBy}` : ''}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.loadBtn} onPress={() => { match.loadTemplate(tpl); setSlot(null); }} accessibilityRole="button">
                    <Text style={styles.loadText}>{t('loadLineup')}</Text>
                  </TouchableOpacity>
                  {canSelect && (
                    <TouchableOpacity onPress={() => removeLineup(tpl.id)} accessibilityRole="button" accessibilityLabel={t('delete')} style={styles.trash}>
                      <Trash2 color={colors.muted} size={16} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Card>

            <View style={{ gap: 8 }}>
              <Text style={styles.label}>{t('bench')} ({bench.length})</Text>
              <View style={styles.benchWrap}>
                {bench.map((p) => (
                  <View key={p.id} style={styles.benchPill}>
                    <Text style={styles.benchNo}>{p.number}</Text>
                    <Text style={styles.benchName}>{p.name.split(' ').slice(-1)[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={{ gap: space.sm + 2 }}>
            {players
              .slice()
              .sort((a, b) => a.category.localeCompare(b.category) || a.number - b.number)
              .map((p) => {
                const on = match.callUps.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickRow, styles.callRow, on && styles.callRowOn]}
                    disabled={!canSelect}
                    onPress={() => toggleCallUp(p.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: !canSelect }}
                  >
                    <Avatar name={p.name} number={p.number} size={40} photoUrl={p.photoUrl} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.pickName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.pickMeta}>{p.position} · {p.category}</Text>
                    </View>
                    <FitnessBadge status={p.status} />
                    <View style={[styles.check, on && styles.checkOn]}>{on && <Check color={colors.navy} size={14} />}</View>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.md },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  viewOnly: { color: colors.amber, fontSize: 13, backgroundColor: colors.amberSoft, borderRadius: radius.sm + 2, padding: 10 },
  label: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: space.sm + 2 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: radius.md, backgroundColor: colors.red },
  btnLine: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.goldBorder },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  remove: { alignSelf: 'flex-start', backgroundColor: colors.redSoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  removeText: { color: '#FF6B75', fontWeight: '800', fontSize: 13 },
  empty: { color: colors.muted },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 },
  pickName: { color: colors.white, fontSize: 14, fontWeight: '700' },
  pickMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  callRow: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, padding: space.md },
  callRowOn: { borderColor: colors.gold },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  saveRow: { flexDirection: 'row', gap: space.sm },
  nameInput: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: colors.navy, borderWidth: 1, borderColor: colors.goldBorder, color: colors.white, paddingHorizontal: 12, fontSize: 14 },
  saveBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  tplRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  loadBtn: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  loadText: { color: colors.gold, fontWeight: '800', fontSize: 12 },
  trash: { padding: 8 },
  benchWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  benchPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.goldBorder, paddingHorizontal: 10, paddingVertical: 5 },
  benchNo: { color: colors.gold, fontWeight: '800', fontSize: 12 },
  benchName: { color: colors.white, fontSize: 12, fontWeight: '600' },
});
