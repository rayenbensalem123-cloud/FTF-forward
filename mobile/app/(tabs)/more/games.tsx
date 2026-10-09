import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Segmented } from '@/components/Chips';
import { MatchBingo } from '@/components/games/MatchBingo';
import { WhoAmI } from '@/components/games/WhoAmI';
import { colors, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { GS } from '@/i18n/gameStrings';
import type { Category } from '@/types';

type Game = 'bingo' | 'whoami';

/** Staff games, linked to the platform's bingo_picks and game_scores tables. */
export default function GamesScreen() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { players, matches } = usePlayers();
  const T = GS[language];
  const [game, setGame] = useState<Game>('bingo');
  const [category, setCategory] = useState<Category>('Seniors');

  const catPlayers = useMemo(() => players.filter((p) => p.category === category), [players, category]);
  const catMatches = useMemo(() => matches.filter((m) => m.category === category), [matches, category]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader back showBell={false} />
        <View>
          <Text style={styles.title}>{T.gamesTitle}</Text>
          <Text style={styles.sub}>{T.gamesSub}</Text>
        </View>
        <Segmented
          options={[{ value: 'Seniors', label: t('seniors') }, { value: 'U-20', label: t('u20') }, { value: 'U-17', label: t('u17') }]}
          value={category}
          onChange={setCategory}
        />
        <Segmented
          options={[{ value: 'bingo', label: T.bgTitle }, { value: 'whoami', label: T.waTitle }]}
          value={game}
          onChange={setGame}
        />
        <Card>
          {!user ? null : game === 'bingo' ? (
            <MatchBingo matches={catMatches} username={user.username} lang={language} />
          ) : (
            <WhoAmI key={category} players={catPlayers} username={user.username} lang={language} />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
