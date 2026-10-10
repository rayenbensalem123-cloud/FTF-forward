import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { colors, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { NW } from '@/i18n/newsStrings';
import { ago, fetchNews, type NewsItem } from '@/lib/news';

export default function NewsScreen() {
  const { language } = useLanguage();
  const T = NW[language];
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const list = await fetchNews();
    setItems(list);
    setFailed(list.length === 0);
    setLoading(false);
    setRefreshing(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert(T.title, T.openFailed));

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
          : failed ? <Text style={styles.empty}>{T.failed}</Text>
          : items.map((n, i) => (
            <TouchableOpacity key={n.link + i} onPress={() => open(n.link)} activeOpacity={0.8} accessibilityRole="link">
              <Card style={{ gap: 6 }}>
                <Text style={styles.headline}>{n.title}</Text>
                <View style={styles.meta}>
                  <Text style={styles.source} numberOfLines={1}>{n.source}</Text>
                  <Text style={styles.time}>{ago(n.pubDate)}</Text>
                  <ExternalLink size={12} color={colors.muted} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
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
  headline: { color: colors.white, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  source: { color: colors.gold, fontSize: 12, fontWeight: '800', flexShrink: 1 },
  time: { color: colors.muted, fontSize: 12, flex: 1 },
});
