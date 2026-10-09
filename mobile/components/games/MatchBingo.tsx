import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, Lock, RotateCcw, Timer, X } from 'lucide-react-native';
import { colors, radius, space } from '@/constants/theme';
import { GS, fmt } from '@/i18n/gameStrings';
import {
  LOCK_LIMIT, POINTS_LINE, POINTS_SQUARE, buildLeaderboard, dealCard, evaluateCard, findPlayed, matchKey, scoreCard,
  type BingoMatch, type PickEntry, type Square, type SquareState,
} from '@/lib/bingo-logic';
import { fetchPicks, savePicks, type StorageMode } from '@/lib/games';
import { formatDate } from '@/lib/format';
import type { Language, Match } from '@/types';
import { Board, Notice, gameButton } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

type Tab = 'next' | 'results' | 'board';

// ── the 3×3 card ─────────────────────────────
function CardGrid({ card, lang, locked, states, lines, onToggle }: {
  card: Square[]; lang: Language; locked: string[]; states?: SquareState[]; lines?: number[][]; onToggle?: (id: string) => void;
}) {
  const T = GS[lang];
  const inLine = new Set((lines ?? []).flat());
  return (
    <View>
      <View style={g.grid}>
        {card.map((sq, i) => {
          const isLocked = locked.includes(sq.id);
          const st = states?.[i];
          const interactive = !!onToggle && !st;
          const tile = [
            g.tile,
            st === 'yes' && g.tileYes,
            st === 'no' && (isLocked ? g.tileNo : g.tileMuted),
            st === 'void' && g.tileVoid,
            !st && isLocked && g.tileLocked,
            inLine.has(i) && g.tileLine,
          ];
          const Wrapper: any = interactive ? TouchableOpacity : View;
          return (
            <Wrapper
              key={sq.id}
              style={tile}
              {...(interactive ? { onPress: () => onToggle!(sq.id), activeOpacity: 0.8, accessibilityRole: 'button', accessibilityState: { selected: isLocked } } : {})}
            >
              <View style={[g.edge, { backgroundColor: st === 'yes' ? '#7FD6A8' : isLocked ? colors.red : 'transparent' }]} />
              <View style={g.tileTop}>
                <Text style={[g.label, st === 'yes' && { color: '#7FD6A8' }]}>{sq.label[lang]}</Text>
                {sq.kind === 'minute' && <Timer size={11} color={colors.gold} accessibilityLabel={T.bgMinuteHint} />}
              </View>
              <View style={g.tileBottom}>
                <Text style={[g.pts, isLocked && { color: colors.gold }]}>+{POINTS_SQUARE}</Text>
                {st === 'yes' && isLocked && <Check size={18} color="#7FD6A8" strokeWidth={3} />}
                {st === 'no' && isLocked && <X size={16} color="#FF5F72" strokeWidth={3} />}
                {st === 'void' && <Text style={g.na}>n/a</Text>}
                {!st && isLocked && <Lock size={12} color={colors.red} />}
              </View>
            </Wrapper>
          );
        })}
      </View>
      {!!lines && lines.length > 0 && (
        <Text style={g.lineDone}>{T.bgLineDone} +{lines.length * POINTS_LINE}</Text>
      )}
      {!!states && (
        <View style={g.legend}>
          <View style={g.legendItem}><Check size={10} color="#7FD6A8" /><Text style={g.legendText}>{T.bgYes}</Text></View>
          <View style={g.legendItem}><X size={10} color="#FF5F72" /><Text style={g.legendText}>{T.bgNo}</Text></View>
          <Text style={g.legendText}>n/a · {T.bgVoid}</Text>
        </View>
      )}
    </View>
  );
}

function LockPips({ used, lang }: { used: number; lang: Language }) {
  const T = GS[lang];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: LOCK_LIMIT }).map((_, i) => (
          <View key={i} style={[g.pip, i < used && g.pipOn]} />
        ))}
      </View>
      <Text style={g.lockText}>{fmt(T.bgLocked, { n: used, max: LOCK_LIMIT })}</Text>
    </View>
  );
}

function FixtureChip({ opponent, date, active, tone, onPress }: { opponent: string; date: string; active: boolean; tone: 'red' | 'gold'; onPress: () => void }) {
  const accent = tone === 'red' ? colors.red : colors.gold;
  return (
    <TouchableOpacity
      style={[g.chip, active && { backgroundColor: tone === 'red' ? colors.redSoft : colors.goldSoft, borderBottomColor: accent }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={g.chipTitle} numberOfLines={1}>{opponent}</Text>
      <Text style={g.chipDate}>{formatDate(date)}</Text>
    </TouchableOpacity>
  );
}

interface Props { matches: Match[]; username: string; lang: Language }

export function MatchBingo({ matches, username, lang }: Props) {
  const T = GS[lang];
  const [tab, setTab] = useState<Tab>('next');
  const [entries, setEntries] = useState<PickEntry[]>([]);
  const [mode, setMode] = useState<StorageMode>('shared');
  const reload = useCallback(() => fetchPicks().then((r) => { setEntries(r.entries); setMode(r.mode); }).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);

  const today = todayStr();
  // Everything below judges squares against the recorded details, and skips matches still waiting for approval.
  const all = useMemo(() => matches.filter((m) => m.bingo).map((m) => m.bingo as BingoMatch), [matches]);
  const approved = useMemo(() => all.filter((m) => m.status !== 'pending'), [all]);

  const fixtures = useMemo(() => {
    const seen = new Set<string>();
    return all
      .filter((m) => m.date && m.date >= today && !m.result && !findPlayed(approved, matchKey(m)))
      .filter((m) => { const k = matchKey(m); if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [all, approved, today]);

  const playedList = useMemo(() => {
    const seen = new Set<string>();
    const out: BingoMatch[] = [];
    for (const m of approved) {
      if (!m.result) continue;
      const k = matchKey(m);
      if (seen.has(k)) continue;
      seen.add(k);
      const best = findPlayed(approved, k);
      if (best) out.push(best);
    }
    return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [approved]);

  const labelFor = (key: string) => {
    const m = all.find((x) => matchKey(x) === key);
    return m ? `${m.opponent || '?'} · ${formatDate(m.date || '')}` : key;
  };

  // next match: pick and save
  const [selKey, setSelKey] = useState('');
  useEffect(() => {
    if (!fixtures.some((f) => matchKey(f) === selKey)) setSelKey(fixtures[0] ? matchKey(fixtures[0]) : '');
  }, [fixtures, selKey]);

  const mine = useMemo(() => entries.filter((e) => e.username === username), [entries, username]);
  const [draft, setDraft] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => {
    // Do not overwrite what the person is in the middle of picking when a refresh lands.
    if (dirty) return;
    setDraft(mine.find((e) => e.matchKey === selKey)?.picks ?? []);
    setSavedFlash(false);
  }, [selKey, mine, dirty]);

  const card = useMemo(() => (selKey ? dealCard(selKey, username) : []), [selKey, username]);
  const toggle = (id: string) => {
    setSavedFlash(false);
    if (draft.includes(id)) { setDirty(true); setDraft(draft.filter((x) => x !== id)); return; }
    if (draft.length >= LOCK_LIMIT) return;
    setDirty(true); setDraft([...draft, id]);
  };
  const chooseFixture = (k: string) => { setDirty(false); setSelKey(k); };
  const save = async () => {
    setSaving(true);
    try {
      await savePicks(username, selKey, draft);
      await reload();
      setDirty(false); setSavedFlash(true);
    } finally { setSaving(false); }
  };

  // practice on a played match (nothing saved)
  const [practiceKey, setPracticeKey] = useState('');
  const [pDraft, setPDraft] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const practiceMatch = useMemo(() => (practiceKey ? findPlayed(approved, practiceKey) : null), [practiceKey, approved]);
  const pCard = useMemo(() => (practiceKey ? dealCard(practiceKey, username) : []), [practiceKey, username]);
  const pStates = useMemo(() => (practiceMatch && revealed ? evaluateCard(pCard, practiceMatch) : undefined), [practiceMatch, revealed, pCard]);
  const pScore = pStates ? scoreCard(pCard, pStates, pDraft) : null;
  const pToggle = (id: string) => {
    if (pDraft.includes(id)) { setPDraft(pDraft.filter((x) => x !== id)); return; }
    if (pDraft.length >= LOCK_LIMIT) return;
    setPDraft([...pDraft, id]);
  };
  const choosePractice = (k: string) => { setPracticeKey(k); setPDraft([]); setRevealed(false); };

  // my results
  const [openKey, setOpenKey] = useState('');
  const results = useMemo(() => mine
    .filter((e) => e.picks.length > 0)
    .map((e) => {
      const played = findPlayed(approved, e.matchKey);
      const c = dealCard(e.matchKey, username);
      const states = played ? evaluateCard(c, played) : undefined;
      const late = !!(played && e.updatedAt && played.date && e.updatedAt.slice(0, 10) > String(played.date).slice(0, 10));
      const sc = played && states && !late ? scoreCard(c, states, e.picks) : null;
      return { e, played, c, states, sc };
    })
    .sort((a, b) => b.e.matchKey.localeCompare(a.e.matchKey)), [mine, approved, username]);
  const totalPts = results.reduce((a, r) => a + (r.sc?.points ?? 0), 0);
  const board = useMemo(() => buildLeaderboard(entries, approved), [entries, approved]);

  const deviceNote = mode === 'device' ? <Text style={[g.dim, { marginTop: space.md }]}>{T.bgDeviceOnly}</Text> : null;

  return (
    <View>
      <View style={g.tabs}>
        {([['next', T.bgTabNext], ['results', T.bgTabResults], ['board', T.bgTabBoard]] as [Tab, string][]).map(([k, label]) => (
          <TouchableOpacity key={k} style={[g.tab, tab === k && g.tabOn]} onPress={() => setTab(k)} accessibilityRole="button" accessibilityState={{ selected: tab === k }}>
            <Text style={[g.tabText, tab === k && { color: colors.white }]} numberOfLines={1}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'next' && (
        <View>
          {fixtures.length === 0 ? <Notice text={T.bgNoFixture} /> : (
            <>
              <Text style={g.howTo}>{fmt(T.bgHowTo, { n: LOCK_LIMIT, p: POINTS_SQUARE, l: POINTS_LINE })}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.chips}>
                {fixtures.slice(0, 6).map((f) => (
                  <FixtureChip key={matchKey(f)} opponent={f.opponent || '?'} date={f.date || ''} active={selKey === matchKey(f)} tone="red" onPress={() => chooseFixture(matchKey(f))} />
                ))}
              </ScrollView>
              <View style={{ marginTop: space.md }}><CardGrid card={card} lang={lang} locked={draft} onToggle={toggle} /></View>
              <View style={g.footRow}>
                <View>
                  <LockPips used={draft.length} lang={lang} />
                  <Text style={g.upTo}>{fmt(T.bgUpTo, { n: draft.length * POINTS_SQUARE })}</Text>
                </View>
                <TouchableOpacity
                  style={[gameButton.primary, { paddingHorizontal: space.lg }, (saving || !dirty) && gameButton.disabled]}
                  onPress={save}
                  disabled={saving || !dirty}
                  accessibilityRole="button"
                >
                  {savedFlash && !dirty && !saving && <Check size={14} color="#fff" />}
                  <Text style={gameButton.primaryText}>{saving ? T.bgSaving : savedFlash && !dirty ? T.bgSaved : T.bgSave}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {playedList.length > 0 && (
            <View style={g.section}>
              <Text style={g.sectionTitle}>{T.bgPractice}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.chips}>
                {playedList.slice(0, 8).map((m) => (
                  <FixtureChip key={matchKey(m)} opponent={m.opponent || '?'} date={m.date || ''} active={practiceKey === matchKey(m)} tone="gold" onPress={() => choosePractice(matchKey(m))} />
                ))}
              </ScrollView>
              {practiceMatch && (
                <View style={{ marginTop: space.md }}>
                  <Text style={[g.dim, { marginBottom: 8 }]}>{T.bgPracticeNote}</Text>
                  <CardGrid card={pCard} lang={lang} locked={pDraft} states={pStates} lines={pScore?.lines} onToggle={pToggle} />
                  <View style={g.footRow}>
                    {pScore ? (
                      <View>
                        <Text style={g.practicePts}>{pScore.points} <Text style={g.unit}>{T.waPts}</Text></Text>
                        <Text style={g.dim}>{fmt(T.bgResultLine, { r: practiceMatch.result ?? '' })}</Text>
                      </View>
                    ) : <LockPips used={pDraft.length} lang={lang} />}
                    {revealed ? (
                      <TouchableOpacity style={gameButton.soft} onPress={() => choosePractice(practiceKey)} accessibilityRole="button">
                        <RotateCcw size={13} color={colors.white} /><Text style={gameButton.softText}>{T.bgReset}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[gameButton.soft, pDraft.length === 0 && gameButton.disabled]} onPress={() => setRevealed(true)} disabled={pDraft.length === 0} accessibilityRole="button">
                        <Text style={gameButton.softText}>{T.bgReveal}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
          {deviceNote}
        </View>
      )}

      {tab === 'results' && (
        <View>
          {results.length === 0 ? <Notice text={T.bgNoResults} /> : (
            <>
              <View style={g.totalRow}>
                <Text style={g.dimCaps}>{T.bgTotal}</Text>
                <Text style={g.total}>{totalPts}</Text>
              </View>
              <View style={{ gap: 8 }}>
                {results.map((r) => {
                  const open = openKey === r.e.matchKey;
                  return (
                    <View key={r.e.matchKey} style={g.resultCard}>
                      <TouchableOpacity style={g.resultHead} onPress={() => setOpenKey(open ? '' : r.e.matchKey)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={g.resultTitle} numberOfLines={1}>{labelFor(r.e.matchKey)}</Text>
                          <Text style={g.dim}>{r.played ? fmt(T.bgResultLine, { r: r.played.result ?? '' }) : T.bgWaiting}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={g.resultPts}>{r.sc ? r.sc.points : '—'}</Text>
                          {r.sc && <Text style={g.dim}>{fmt(T.bgLines, { n: r.sc.lines.length })}</Text>}
                        </View>
                      </TouchableOpacity>
                      {open && (
                        <View style={{ padding: space.md, paddingTop: 0 }}>
                          <CardGrid card={r.c} lang={lang} locked={r.e.picks} states={r.states} lines={r.sc?.lines} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
          {deviceNote}
        </View>
      )}

      {tab === 'board' && (
        <View>
          {board.length === 0 ? <Notice text={T.bgBoardEmpty} /> : (
            <Board
              rows={board.map((r) => ({ key: r.username, name: r.username, value: String(r.points), sub: `${r.correct} ${T.bgCorrect.toLowerCase()} · ${r.games} ${T.bgGames.toLowerCase()}` }))}
              you={username} youLabel={T.bgYou} unit={T.waPts}
            />
          )}
          {deviceNote}
        </View>
      )}
    </View>
  );
}

const g = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: space.lg },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.red },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  howTo: { color: colors.muted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  chips: { gap: 6, paddingTop: space.md },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.cardRaised, borderBottomWidth: 2, borderBottomColor: 'transparent', maxWidth: 170 },
  chipTitle: { color: colors.white, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  chipDate: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31.6%', minHeight: 104, borderRadius: 10, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.cardRaised, padding: 10, paddingLeft: 13, justifyContent: 'space-between', overflow: 'hidden' },
  tileLocked: { backgroundColor: colors.redSoft, borderColor: colors.red },
  tileYes: { backgroundColor: 'rgba(127,214,168,0.14)', borderColor: 'rgba(127,214,168,0.55)' },
  tileNo: { borderColor: colors.line },
  tileMuted: { borderColor: colors.line, opacity: 0.45 },
  tileVoid: { borderStyle: 'dashed', opacity: 0.7 },
  tileLine: { borderColor: colors.gold, borderWidth: 2 },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  tileBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, minHeight: 20 },
  label: { flex: 1, color: colors.white, fontSize: 10, fontWeight: '700', lineHeight: 13 },
  pts: { color: colors.muted, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  na: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  lineDone: { marginTop: 8, color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  pip: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.muted },
  pipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  lockText: { color: colors.white, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, marginTop: space.md },
  upTo: { color: colors.gold, fontSize: 11, fontWeight: '800', marginTop: 4 },
  section: { marginTop: space.xl, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.line },
  sectionTitle: { color: colors.white, fontSize: 13, fontWeight: '800' },
  practicePts: { color: colors.gold, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unit: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  dim: { color: colors.muted, fontSize: 11, fontWeight: '600', lineHeight: 16 },
  dimCaps: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: space.md, marginBottom: space.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  total: { color: colors.red, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] },
  resultCard: { backgroundColor: colors.cardRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, overflow: 'hidden' },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  resultTitle: { color: colors.white, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  resultPts: { color: colors.gold, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
