import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, ChevronRight, RotateCcw, Search, X } from 'lucide-react-native';
import { colors, radius, space } from '@/constants/theme';
import { GS, fmt } from '@/i18n/gameStrings';
import { fetchTopScores, saveScore, type ScoreRow, type StorageMode } from '@/lib/games';
import type { Language, Player } from '@/types';
import { Board, Notice, gameButton } from './ui';

// "Who am I?": guess the player from clues, vague to specific, photo last. Same rules and points
// as the website. Only public profile data is used as a clue: never passports, contracts or injuries.

type ClueKey = 'position' | 'country' | 'club' | 'age' | 'height' | 'jersey' | 'caps' | 'goals';
interface Clue { key: ClueKey; value: string }

const ROUND_SIZE = 5, BASE = 100, STEP = 12, MIN_PTS = 10, GAME_ID = 'whoami', WIN_SCORE = 300;
const POSITION_LABEL: Record<Player['position'], string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const shuffle = <T,>(a: T[]) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
const pointsFor = (shown: number) => Math.max(MIN_PTS, BASE - STEP * (shown - 1));

function buildClues(p: Player, years: (n: number) => string): Clue[] {
  const out: Clue[] = [];
  out.push({ key: 'position', value: POSITION_LABEL[p.position] });
  const country = p.nationality.trim() || (p.leagueRegion ?? '').trim();
  if (country) out.push({ key: 'country', value: country });
  if (p.club && p.club !== 'Unattached') out.push({ key: 'club', value: p.club });
  if (p.age >= 10 && p.age <= 60) out.push({ key: 'age', value: years(p.age) });
  const h = p.height ?? 0;
  if (h > 100 && h < 230) out.push({ key: 'height', value: `${Math.round(h)} cm` });
  if (p.number > 0) out.push({ key: 'jersey', value: `Nº ${p.number}` });
  if (p.caps > 0) out.push({ key: 'caps', value: String(p.caps) });
  if (p.goals > 0) out.push({ key: 'goals', value: String(p.goals) });
  return out;
}

type Status = 'guessing' | 'correct' | 'failed';

interface Props { players: Player[]; username: string; lang: Language }

export function WhoAmI({ players, username, lang }: Props) {
  const T = GS[lang];
  const years = useCallback((n: number) => fmt(T.waYears, { n }), [T]);

  const eligible = useMemo(() => players.filter((p) => buildClues(p, years).length >= 4), [players, years]);
  const guessable = useMemo(() => players.filter((p) => p.name.trim()), [players]);

  const [phase, setPhase] = useState<'start' | 'play' | 'done'>('start');
  const [round, setRound] = useState<Player[]>([]);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(1);
  const [status, setStatus] = useState<Status>('guessing');
  const [feedback, setFeedback] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [board, setBoard] = useState<{ rows: ScoreRow[]; mode: StorageMode } | null>(null);
  const [saveMode, setSaveMode] = useState<StorageMode | null>(null);
  const savedRef = useRef(false);

  const loadBoard = useCallback(() => { fetchTopScores(GAME_ID).then(setBoard).catch(() => {}); }, []);
  useEffect(() => { loadBoard(); }, [loadBoard]);

  const target = round[idx];
  const clues = useMemo(() => (target ? buildClues(target, years) : []), [target, years]);
  const photo = target?.photoUrl ?? '';
  const total = clues.length + (photo ? 1 : 0);
  const photoShown = !!photo && shown > clues.length;
  const finished = status !== 'guessing';

  const start = () => {
    setRound(shuffle(eligible).slice(0, ROUND_SIZE));
    setIdx(0); setShown(1); setStatus('guessing'); setFeedback(''); setScores([]); setQuery('');
    savedRef.current = false; setSaveMode(null); setPhase('play');
  };

  const suggestions = useMemo(() => {
    const q = norm(query);
    return q ? guessable.filter((p) => norm(p.name).includes(q)).slice(0, 5) : [];
  }, [query, guessable]);

  const guess = (p: Player) => {
    if (!target || finished) return;
    setQuery('');
    if (p.id === target.id) {
      const pts = pointsFor(shown);
      setScores((s) => [...s, pts]); setStatus('correct'); setFeedback(fmt(T.waCorrect, { n: pts }));
    } else if (shown < total) {
      setShown((s) => s + 1); setFeedback(T.waWrong);
    } else {
      setScores((s) => [...s, 0]); setStatus('failed'); setFeedback(fmt(T.waReveal, { name: target.name }));
    }
  };
  const giveUp = () => {
    if (!target || finished) return;
    setScores((s) => [...s, 0]); setStatus('failed'); setFeedback(fmt(T.waReveal, { name: target.name })); setQuery('');
  };
  const next = () => {
    if (idx + 1 >= round.length) { setPhase('done'); return; }
    setIdx((i) => i + 1); setShown(1); setStatus('guessing'); setFeedback(''); setQuery('');
  };

  const totalScore = scores.reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (phase !== 'done' || savedRef.current) return;
    savedRef.current = true;
    saveScore(username, GAME_ID, totalScore).then((m) => { setSaveMode(m); loadBoard(); }).catch(() => {});
  }, [phase, totalScore, username, loadBoard]);

  const boardView = (
    <View style={s.boardWrap}>
      <Text style={s.boardTitle}>{T.waBoard}</Text>
      {board && board.rows.length > 0 ? (
        <Board
          rows={board.rows.map((r) => ({ key: r.username, name: r.username, value: String(r.best), sub: fmt(T.waPlays, { n: r.plays }) }))}
          you={username} youLabel={T.bgYou} unit={T.waPts}
        />
      ) : <Text style={s.dim}>—</Text>}
      {board?.mode === 'device' && <Text style={[s.dim, { marginTop: 8 }]}>{T.bgDeviceOnly}</Text>}
    </View>
  );

  if (phase === 'start') {
    return (
      <View>
        <Text style={s.lead}>{T.waDesc}</Text>
        <Text style={s.range}>{BASE} → {MIN_PTS} {T.waPts}</Text>
        {eligible.length < ROUND_SIZE ? (
          <View style={{ marginTop: space.lg }}><Notice tone="gold" text={T.waNoData} /></View>
        ) : (
          <TouchableOpacity style={[gameButton.primary, { marginTop: space.lg }]} onPress={start} accessibilityRole="button">
            <Text style={gameButton.primaryText}>{T.waStart}</Text>
          </TouchableOpacity>
        )}
        {boardView}
      </View>
    );
  }

  if (phase === 'done') {
    const won = totalScore >= WIN_SCORE;
    return (
      <View>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.dimCaps}>{T.waDone}</Text>
          <Text style={[s.bigScore, won && { color: colors.gold }]}>{totalScore}</Text>
          <Text style={s.dim}>{fmt(T.waOutOf, { n: ROUND_SIZE * BASE })}</Text>
        </View>
        <View style={{ marginTop: space.lg, gap: 6 }}>
          {round.map((p, i) => (
            <View key={p.id} style={s.resultRow}>
              <View style={[s.dot, { backgroundColor: scores[i] > 0 ? 'rgba(127,214,168,0.18)' : 'rgba(227,6,19,0.18)' }]}>
                {scores[i] > 0 ? <Check size={12} color="#7FD6A8" strokeWidth={3} /> : <X size={12} color="#FF5F72" strokeWidth={3} />}
              </View>
              <Text style={s.resultName} numberOfLines={1}>{p.name}</Text>
              <Text style={[s.resultPts, !(scores[i] > 0) && { color: colors.muted }]}>{scores[i] ?? 0}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[gameButton.primary, { marginTop: space.lg }]} onPress={start} accessibilityRole="button">
          <RotateCcw size={14} color="#fff" /><Text style={gameButton.primaryText}>{T.waAgain}</Text>
        </TouchableOpacity>
        {saveMode === 'device' && <Text style={[s.dim, { marginTop: 8 }]}>{T.bgDeviceOnly}</Text>}
        {boardView}
      </View>
    );
  }

  const visible = clues.slice(0, Math.min(shown, clues.length));
  const pts = pointsFor(shown);
  return (
    <View>
      <View style={s.topRow}>
        <Text style={s.dimCaps}>{fmt(T.waRound, { n: idx + 1, t: round.length })}</Text>
        <Text style={s.runScore}>{totalScore} <Text style={s.unit}>{T.waPts}</Text></Text>
      </View>
      <View style={s.segments}>
        {round.map((_, i) => (
          <View
            key={i}
            style={[s.segment, {
              backgroundColor: i < scores.length ? (scores[i] > 0 ? '#7FD6A8' : colors.red) : i === idx ? 'rgba(227,6,19,0.5)' : colors.cardRaised,
            }]}
          />
        ))}
      </View>

      <View style={s.ptsRow}>
        <Text style={s.dim}>{fmt(T.waClue, { n: Math.min(shown, total), t: total })}</Text>
        <Text style={[s.ptsNow, finished && { color: colors.muted }]}>{pts}</Text>
      </View>
      <View style={s.track} accessibilityRole="progressbar" accessibilityLabel={T.waTarget} accessibilityValue={{ min: 0, max: BASE, now: pts }}>
        <View style={[s.fill, { width: `${pts}%`, opacity: finished ? 0.35 : 1 }]} />
      </View>

      <View style={s.clueGrid}>
        {visible.map((c) => (
          <View key={c.key} style={s.clue}>
            <View style={s.clueEdge} />
            <Text style={s.clueLabel}>{T[`clue_${c.key}` as keyof typeof T] as string}</Text>
            <Text style={s.clueValue} numberOfLines={1}>{c.value}</Text>
          </View>
        ))}
      </View>

      {(photoShown || (finished && !!photo)) && (
        <View style={s.photoBox}>
          <Image source={{ uri: photo }} style={s.photo} resizeMode="cover" blurRadius={finished ? 0 : 14} />
        </View>
      )}
      {!finished && !!photo && shown === clues.length && <Text style={[s.dim, { marginTop: 8 }]}>{T.waLastClue}</Text>}

      {!!feedback && (
        <View style={[s.feedback,
          status === 'correct' ? s.fbOk : status === 'failed' ? s.fbBad : s.fbWarn]}>
          {status === 'correct' ? <Check size={14} color="#7FD6A8" strokeWidth={3} /> : status === 'failed' ? <X size={14} color="#FF5F72" strokeWidth={3} /> : null}
          <Text style={[s.fbText, { color: status === 'correct' ? '#7FD6A8' : status === 'failed' ? '#FF5F72' : colors.gold }]}>{feedback}</Text>
        </View>
      )}

      {finished ? (
        <TouchableOpacity style={[gameButton.primary, { marginTop: space.md }]} onPress={next} accessibilityRole="button">
          <Text style={gameButton.primaryText}>{idx + 1 >= round.length ? T.waFinish : T.waNext}</Text>
          <ChevronRight size={16} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ marginTop: space.md }}>
          <View style={s.inputWrap}>
            <Search size={15} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={T.waPlaceholder}
              placeholderTextColor={colors.muted}
              autoCorrect={false}
              autoCapitalize="none"
              style={s.input}
              onSubmitEditing={() => { if (suggestions[0]) guess(suggestions[0]); }}
              returnKeyType="go"
            />
          </View>
          {!!query.trim() && (
            <View style={s.suggestions}>
              {suggestions.length === 0 ? (
                <Text style={[s.dim, { padding: space.md }]}>{T.waNoMatch}</Text>
              ) : suggestions.map((p) => (
                <TouchableOpacity key={p.id} style={s.suggestion} onPress={() => guess(p)} accessibilityRole="button">
                  <Text style={s.suggestionText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity onPress={giveUp} style={{ paddingVertical: 10 }} accessibilityRole="button">
            <Text style={s.giveUp}>{T.waGiveUp}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  range: { color: colors.gold, fontSize: 14, fontWeight: '800', marginTop: space.md, fontVariant: ['tabular-nums'] },
  dim: { color: colors.muted, fontSize: 11, fontWeight: '600', lineHeight: 16 },
  dimCaps: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  boardWrap: { marginTop: space.xl, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.line },
  boardTitle: { color: colors.white, fontSize: 13, fontWeight: '800', marginBottom: space.md },
  bigScore: { color: colors.red, fontSize: 72, fontWeight: '900', fontVariant: ['tabular-nums'], lineHeight: 80, marginTop: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.cardRaised, borderRadius: radius.sm, paddingVertical: 9, paddingHorizontal: space.md },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  resultName: { flex: 1, color: colors.white, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  resultPts: { color: colors.gold, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  runScore: { color: colors.gold, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  segments: { flexDirection: 'row', gap: 4, marginBottom: space.lg },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  ptsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  ptsNow: { color: colors.gold, fontSize: 32, fontWeight: '900', fontVariant: ['tabular-nums'], lineHeight: 36 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.cardRaised, overflow: 'hidden', marginBottom: space.md },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.gold },
  clueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clue: { width: '48.5%', backgroundColor: colors.cardRaised, borderRadius: radius.sm, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, overflow: 'hidden' },
  clueEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: colors.red },
  clueLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  clueValue: { color: colors.white, fontSize: 15, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  photoBox: { marginTop: space.md, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.cardRaised, alignItems: 'center' },
  photo: { width: '100%', height: 220 },
  feedback: { marginTop: space.md, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.md, paddingVertical: 10 },
  fbOk: { backgroundColor: 'rgba(127,214,168,0.12)', borderColor: 'rgba(127,214,168,0.3)' },
  fbBad: { backgroundColor: 'rgba(227,6,19,0.1)', borderColor: 'rgba(227,6,19,0.3)' },
  fbWarn: { backgroundColor: colors.goldSoft, borderColor: 'rgba(246,199,68,0.3)' },
  fbText: { fontSize: 13, fontWeight: '800', flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cardRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, paddingHorizontal: space.md },
  input: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '700', paddingVertical: 13, textTransform: 'uppercase' },
  suggestions: { marginTop: 6, backgroundColor: colors.cardRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, overflow: 'hidden' },
  suggestion: { paddingVertical: 12, paddingHorizontal: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  suggestionText: { color: colors.white, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  giveUp: { color: colors.muted, fontSize: 12, fontWeight: '700' },
});
