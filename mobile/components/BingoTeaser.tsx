import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Avatar } from '@/components/Avatar';
import { buildLeaderboard, type LeaderRow } from '@/lib/bingo-logic';
import { fetchPicks } from '@/lib/games';
import type { Match, Player } from '@/types';

/** Best effort: a bingo username matched to a roster photo, else initials. */
function photoFor(username: string, players: Player[]): Player | undefined {
  const fold = (s: string) => s.toLowerCase().replace(/[^\p{L}]/gu, '');
  const u = fold(username);
  if (!u) return undefined;
  return players.find((p) => {
    const n = fold(p.name);
    return n === u || n.startsWith(u) || n.endsWith(u);
  });
}

/**
 * The body of the Bingo card: the season leaderboard's top three, ranked by
 * points. It combines the saved prediction entries with the played matches,
 * exactly like the games screen's leaderboard tab, so the card always agrees
 * with the screen it opens.
 *
 * While the entries load a spinner shows; with no played entries yet the card
 * renders nothing rather than an empty table.
 */
export function BingoTeaser({ matches, players }: { matches: Match[]; players: Player[] }) {
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
        <ActivityIndicator size="small" color={colors.white} />
      </View>
    );
  }
  if (rows.length === 0) return null;

  const max = rows.reduce((m, r) => Math.max(m, r.points), 0);

  return (
    <View style={styles.list}>
      {rows.map((r) => {
        const player = photoFor(r.username, players);
        return (
          <View key={r.username} style={styles.row}>
            <Avatar name={r.username} number={player?.number} photoUrl={player?.photoUrl} size={30} />
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
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 10, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  who: { flex: 1, minWidth: 0 },
  name: { color: colors.white, fontSize: 12, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.4, marginTop: 1 },
  stat: { alignItems: 'flex-end', width: 44 },
  points: { color: colors.white, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 3, width: '100%', borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.white },
});
