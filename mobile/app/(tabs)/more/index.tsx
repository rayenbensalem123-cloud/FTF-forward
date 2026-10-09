import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Bell, BarChart3, ChevronRight, Gamepad2, User, Users } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';
import type { StringKey } from '@/i18n/strings';

const ITEMS: { href: Href; icon: typeof Users; title: StringKey; desc: StringKey }[] = [
  { href: '/more/squad', icon: Users, title: 'tabSquad', desc: 'moreSquadDesc' },
  { href: '/more/stats', icon: BarChart3, title: 'tabStats', desc: 'moreStatsDesc' },
  { href: '/more/games', icon: Gamepad2, title: 'tabGames', desc: 'moreGamesDesc' },
  { href: '/notifications', icon: Bell, title: 'notifications', desc: 'moreNotificationsDesc' },
  { href: '/more/profile', icon: User, title: 'tabProfile', desc: 'moreProfileDesc' },
];

export default function MoreScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { unread } = useNotifications();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader showBell={false} />
        <Text style={styles.title}>{t('tabMore')}</Text>
        <View style={{ gap: space.sm + 2 }}>
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const badge = it.title === 'notifications' ? unread : 0;
            return (
              <TouchableOpacity
                key={it.title}
                style={styles.row}
                onPress={() => router.push(it.href)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t(it.title)}
              >
                <View style={styles.iconWrap}><Icon color={colors.gold} size={20} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle}>{t(it.title)}</Text>
                  <Text style={styles.rowDesc} numberOfLines={1}>{t(it.desc)}</Text>
                </View>
                {badge > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text></View>}
                <ChevronRight color={colors.muted} size={18} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, padding: space.md + 2,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  rowDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: colors.red, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
});
