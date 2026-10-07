import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';
import { timeAgo } from '@/lib/format';

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { feed, unread, markAllRead } = useNotifications();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('notifications')}</Text>
        <TouchableOpacity style={styles.close} onPress={() => router.back()} accessibilityLabel={t('close')}>
          <X color={colors.white} size={18} />
        </TouchableOpacity>
      </View>

      {unread > 0 && (
        <TouchableOpacity style={styles.markAll} onPress={markAllRead} accessibilityRole="button">
          <Text style={styles.markAllText}>{t('markAllRead')} ({unread})</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={feed}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: space.sm + 2 }} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('noNotifications')}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.item, !item.read && styles.itemUnread]}>
            <View style={[styles.dot, { backgroundColor: item.read ? 'transparent' : colors.red }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.itemTitle, !item.read && { fontWeight: '800' }]}>{item.title}</Text>
              {!!item.body && <Text style={styles.itemBody}>{item.body}</Text>}
              <Text style={styles.itemTime}>{timeAgo(item.time)}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.md },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  markAll: { alignSelf: 'flex-start', marginHorizontal: space.lg, marginTop: space.md, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.goldSoft },
  markAllText: { color: colors.gold, fontWeight: '800', fontSize: 13 },
  list: { padding: space.lg, paddingBottom: space.xl * 2 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: space.xl * 2 },
  item: {
    flexDirection: 'row', gap: space.md, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.goldBorder, padding: space.lg,
  },
  itemUnread: { borderColor: colors.gold },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  itemTitle: { color: colors.white, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  itemBody: { color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
  itemTime: { color: colors.muted, fontSize: 12, marginTop: 6 },
});
