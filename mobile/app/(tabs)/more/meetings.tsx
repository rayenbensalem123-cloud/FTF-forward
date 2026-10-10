import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayCircle, Video } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { MS } from '@/i18n/meetingStrings';
import { fetchMeetings, type Meeting } from '@/lib/meetings';

const LOCALE = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-TN' } as const;

export default function MeetingsScreen() {
  const { language } = useLanguage();
  const T = MS[language];
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fetchMeetings());
    } catch (e: any) {
      Alert.alert(T.title, e?.message ?? T.failed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [T]);
  useEffect(() => { load(); }, [load]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: items.filter((m) => new Date(m.at).getTime() >= now),
      past: items.filter((m) => new Date(m.at).getTime() < now).reverse(),
    };
  }, [items]);

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert(T.title, T.openFailed));
  const when = (iso: string) =>
    new Date(iso).toLocaleString(LOCALE[language], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const card = (m: Meeting, isPast: boolean) => (
    <Card key={m.id} style={{ gap: space.sm }}>
      <View style={styles.top}>
        <Video size={18} color={colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{m.title}</Text>
          <Text style={styles.meta}>{[when(m.at), m.team].filter(Boolean).join('  ·  ')}</Text>
        </View>
        {m.recordingUrl && <Text style={styles.badge}>{T.recorded}</Text>}
      </View>
      {!isPast && !!m.joinUrl && (
        <TouchableOpacity style={styles.join} onPress={() => open(m.joinUrl!)} accessibilityRole="button">
          <Text style={styles.joinText}>{T.join}</Text>
        </TouchableOpacity>
      )}
      {!!m.recordingUrl && (
        <TouchableOpacity style={styles.rec} onPress={() => open(m.recordingUrl!)} accessibilityRole="link">
          <PlayCircle size={16} color="#7EC3FF" />
          <Text style={styles.recText}>{T.recording}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

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
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: space.xl }} />
        ) : (
          <>
            <Text style={styles.section}>{T.upcoming}</Text>
            {upcoming.length === 0 ? <Text style={styles.empty}>{T.noUpcoming}</Text> : upcoming.map((m) => card(m, false))}
            <Text style={styles.section}>{T.past}</Text>
            {past.length === 0 ? <Text style={styles.empty}>{T.noPast}</Text> : past.map((m) => card(m, true))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  section: { color: colors.gold, fontSize: 14, fontWeight: '800', marginTop: space.sm },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: space.md },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  name: { color: colors.white, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: { color: colors.green, fontSize: 11, fontWeight: '800' },
  join: { backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  joinText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  rec: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recText: { color: '#7EC3FF', fontSize: 13, fontWeight: '800' },
});
