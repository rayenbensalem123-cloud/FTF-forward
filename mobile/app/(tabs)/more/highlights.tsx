import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Film } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { CS } from '@/i18n/careerStrings';
import { formatDate } from '@/lib/format';
import { fetchReports, type ClubReport } from '@/lib/clubReports';

export default function HighlightsScreen() {
  const { language } = useLanguage();
  const T = CS[language];
  const { user } = useAuth();
  const [reports, setReports] = useState<ClubReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const memberId = user?.memberId ?? null;

  const load = useCallback(async () => {
    try {
      const all = await fetchReports();
      setReports(memberId != null ? all.filter((r) => r.memberId === memberId) : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const clips = useMemo(
    () => [...reports].filter((r) => r.highlightsUrl).sort((a, b) => b.date.localeCompare(a.date)),
    [reports],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
      >
        <AppHeader back showBell={false} />
        <Text style={styles.title}>{T.highlights}</Text>

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: space.xl }} />
        ) : clips.length === 0 ? (
          <Text style={styles.empty}>{T.noHighlights}</Text>
        ) : (
          clips.map((r) => (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(r.highlightsUrl).catch(() => {})}
              accessibilityRole="link"
            >
              <Card style={styles.clip}>
                <View style={styles.clipThumb}><Film size={22} color={colors.gold} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.clipOpp} numberOfLines={1}>{r.opponent || '—'}</Text>
                  <Text style={styles.clipMeta}>{[r.date ? formatDate(r.date) : '', r.competition].filter(Boolean).join(' · ')}</Text>
                  <View style={styles.watchRow}>
                    <Text style={styles.watchText}>{T.watchHighlights}</Text>
                    <ExternalLink size={12} color="#7EC3FF" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: space.xl },
  clip: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  clipThumb: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.navyDeep, alignItems: 'center', justifyContent: 'center' },
  clipOpp: { color: colors.white, fontSize: 15, fontWeight: '800' },
  clipMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  watchText: { color: '#7EC3FF', fontSize: 12, fontWeight: '800' },
});
