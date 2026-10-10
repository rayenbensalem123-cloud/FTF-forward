import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Chips, Segmented, type Option } from '@/components/Chips';
import { PlayerRow } from '@/components/PlayerRow';
import { PlayerSheet } from '@/components/PlayerSheet';
import { SyncBanner } from '@/components/SyncBanner';
import { colors, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import type { Category, Player, Position } from '@/types';

type PositionFilter = 'ALL' | Position;

export default function SquadScreen() {
  const { t } = useLanguage();
  const { players, refreshing, refresh } = usePlayers();
  const [category, setCategory] = useState<Category>('Seniors');
  const [position, setPosition] = useState<PositionFilter>('ALL');
  const [selected, setSelected] = useState<Player | null>(null);

  const categories: Option<Category>[] = [
    { value: 'Seniors', label: t('seniors') },
    { value: 'U-20', label: t('u20') },
    { value: 'U-17', label: t('u17') },
  ];
  const positions: Option<PositionFilter>[] = [
    { value: 'ALL', label: t('all') },
    { value: 'GK', label: 'GK' },
    { value: 'DEF', label: 'DEF' },
    { value: 'MID', label: 'MID' },
    { value: 'FWD', label: 'FWD' },
  ];

  const list = useMemo(
    () =>
      players
        .filter((p) => p.category === category && (position === 'ALL' || p.position === position))
        .sort((a, b) => a.number - b.number),
    [players, category, position],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} colors={[colors.gold]} />}
        ItemSeparatorComponent={() => <View style={{ height: space.sm + 2 }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppHeader
              title={t('tabSquad')}
              subtitle={`${categories.find((c) => c.value === category)?.label ?? t('seniors')} · ${list.length} ${t('players')}`}
            />
            <SyncBanner />
            <Segmented options={categories} value={category} onChange={setCategory} />
            <Chips options={positions} value={position} onChange={setPosition} />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('noPlayers')}</Text>}
        renderItem={({ item }) => <PlayerRow player={item} onPress={setSelected} />}
      />
      <PlayerSheet player={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  header: { gap: space.md, marginBottom: space.md },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: space.xl * 2 },
});
