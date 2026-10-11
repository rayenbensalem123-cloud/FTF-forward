import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutGrid, Search } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { Segmented } from '@/components/Chips';
import { MatchBingo, SeasonBoard } from '@/components/games/MatchBingo';
import { WhoAmI } from '@/components/games/WhoAmI';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { GS } from '@/i18n/gameStrings';
import type { Category } from '@/types';

type Game = 'bingo' | 'whoami';

/**
 * Staff games, linked to the platform's bingo_picks and game_scores tables.
 *
 * Two game buttons up top, the active game under them, and the season
 * leaderboard pinned to the bottom of the screen rather than buried in a
 * tab -- the board is the reason to come back, so it is always visible.
 */
export default function GamesScreen() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { players, matches } = usePlayers();
  const T = GS[language];
  const [game, setGame] = useState<Game>('bingo');
  const [category, setCategory] = useState<Category>('Seniors');

  const catPlayers = useMemo(() => players.filter((p) => p.category === category), [players, category]);
  const catMatches = useMemo(() => matches.filter((m) => m.category === category), [matches, category]);

  const games: { value: Game; title: string; desc: string; icon: typeof LayoutGrid }[] = [
    { value: 'bingo', title: T.bgTitle, desc: T.bgDesc, icon: LayoutGrid },
    { value: 'whoami', title: T.waTitle, desc: T.waDesc, icon: Search },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader showBell={false} />
        <View>
          <Text style={styles.title}>{T.gamesTitle}</Text>
          <Text style={styles.sub}>{T.gamesSub}</Text>
        </View>
        <Segmented
          options={[{ value: 'Seniors', label: t('seniors') }, { value: 'U-20', label: t('u20') }, { value: 'U-17', label: t('u17') }]}
          value={category}
          onChange={setCategory}
        />

        {/* The two games, as buttons rather than a toggle. */}
        <View style={styles.gameRow}>
          {games.map((g) => {
            const active = game === g.value;
            const Icon = g.icon;
            return (
              <TouchableOpacity
                key={g.value}
                style={[styles.gameBtn, active && styles.gameBtnActive]}
                onPress={() => setGame(g.value)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Icon color={active ? colors.white : colors.muted} size={22} />
                <Text style={[styles.gameTitle, active && styles.gameTitleActive]} numberOfLines={1}>{g.title}</Text>
                <Text style={styles.gameDesc} numberOfLines={2}>{g.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card>
          {!user ? null : game === 'bingo' ? (
            <MatchBingo matches={catMatches} username={user.username} lang={language} />
          ) : (
            <WhoAmI key={category} players={catPlayers} username={user.username} lang={language} />
          )}
        </Card>

        {/* The leaderboard lives at the bottom, always visible. */}
        {user && (
          <View style={styles.board}>
            <SectionHeader title={T.bgTabBoard} />
            <SeasonBoard matches={catMatches} username={user.username} lang={language} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  gameRow: { flexDirection: 'row', gap: space.md },
  gameBtn: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.hairline, padding: space.lg,
    alignItems: 'center', gap: 6,
  },
  gameBtnActive: { borderColor: colors.red, backgroundColor: colors.redSoft },
  gameTitle: { color: colors.muted, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  gameTitleActive: { color: colors.white },
  gameDesc: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  board: { gap: space.sm },
});
