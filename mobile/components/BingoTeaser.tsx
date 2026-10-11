import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { buildLeaderboard, type LeaderRow } from '@/lib/bingo-logic';
import { fetchPicks } from '@/lib/games';
import type { Match } from '@/types';

/**
 * The body of the Bingo card: the season leaderboard's top three, ranked by
 * points. It combines the saved prediction entries with the played matches,
 * exactly like the games screen's leaderboard tab, so the card always agrees
 * with the screen it opens.
 *
 * While the entries load a spinner shows; with no played entries yet the card
 * renders nothing rather than an empty table.
 */
export function BingoTeaser({ matches }: { matches: Match[] }) {
  const { t } = useLanguage();
  const [rows, setRows] = React.useState<LeaderRow[] | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetchPicks()
      .then((r) => {
        if (!alive) return;
        const played = matches.flatMap((m) => (m.bingo ? [m.bingo] : []));
        const board = [...buildLeaderboard(r.entries, played)].sort((a, b) => b.points - a.points);
        setRows(board.slice(0, 3));
      })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [matches]);

  if (rows === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }
  if (rows.length === 0) return null;

  const max = rows.reduce((m, r) => Math.max(m, r.points), 0);

  return (
    <View style={styles.list}>
      {rows.map((r, i) => (
        <View key={r.username} style={styles.row}>
          <Text style={styles.rank}>{i + 1}</Text>
          <View style={styles.who}>
            <Text style={styles.name} numberOfLines={1}>{r.username}</Text>
            <Text style={styles.meta}>{r.games} {t('bingoGames')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.points}>{r.points}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${max > 0 ? Math.max((r.points / max) * 100, 8) : 0}%` }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 10, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank: {
    fontFamily: fonts.display, fontSize: 20, fontWeight: '700',
    color: colors.gold, width: 20, textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  who: { flex: 1, minWidth: 0 },
  name: { color: colors.white, fontSize: 12, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.4, marginTop: 1 },
  stat: { alignItems: 'flex-end', width: 44 },
  points: { color: colors.white, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 3, width: '100%', borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.gold },
});
