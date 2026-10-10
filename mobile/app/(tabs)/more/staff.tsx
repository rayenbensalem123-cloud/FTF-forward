import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { StaffCard } from '@/components/PlatformCard';
import { colors, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { SF } from '@/i18n/staffStrings';
import { fetchStaff, type StaffMember } from '@/lib/staff';

export default function StaffScreen() {
  const { language } = useLanguage();
  const T = SF[language];
  const [items, setItems] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await fetchStaff()); }
    catch (e: any) { Alert.alert(T.title, e?.message ?? T.failed); }
    finally { setLoading(false); setRefreshing(false); }
  }, [T]);
  useEffect(() => { load(); }, [load]);

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
          <Text style={styles.sub}>{T.sub}</Text>
        </View>
        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: space.xl }} />
          : items.length === 0 ? <Text style={styles.empty}>{T.none}</Text>
          : items.map((s) => <StaffCard key={s.id} staff={s} ageLabel={T.age} badge={T.badge} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: space.xl },
});
