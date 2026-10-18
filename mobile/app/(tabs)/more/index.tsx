import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Tent, Newspaper, Users, Bell, ClipboardList, Gamepad2, IdCard, Trophy, User, Video } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { NT } from '@/i18n/toolStrings';
import { ForwardChevron } from '@/components/ForwardChevron';
import { colors, radius, sectionTitle, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';
import type { StringKey } from '@/i18n/strings';

/**
 * Staff "More", built as the prototype's two cards: Tools first, Settings
 * under it. Squad, Stats and Profile are tabs now, so they are no longer
 * listed here -- Profile stays in Settings because it is not a staff tab.
 */
const TOOLS: { href: Href; icon: typeof Video; title: StringKey; desc: StringKey }[] = [
  { href: '/reports', icon: ClipboardList, title: 'tabReports', desc: 'moreReportsDesc' },
  { href: '/more/meetings', icon: Video, title: 'tabMeetings', desc: 'moreMeetingsDesc' },
  { href: '/more/career', icon: Trophy, title: 'tabCareer', desc: 'moreCareerDesc' },
  { href: '/id-card', icon: IdCard, title: 'tabIdCard', desc: 'moreIdCardDesc' },
  { href: '/games', icon: Gamepad2, title: 'tabGames', desc: 'moreGamesDesc' },
];

export default function MoreScreen() {
  const { t, language } = useLanguage();
  const N = NT[language];
  const router = useRouter();
  const { unread } = useNotifications();

  const settings: { href: Href; icon: typeof Video; title: StringKey; desc: StringKey; badge?: number }[] = [
    { href: '/notifications', icon: Bell, title: 'notifications', desc: 'moreNotificationsDesc', badge: unread },
    { href: '/profile', icon: User, title: 'tabProfile', desc: 'moreProfileDesc' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title={t('tabMore')} subtitle={t('moreSubtitle')} />

        <View style={styles.group}>
          <Text style={styles.groupTitle}>{t('moreTools')}</Text>
          <View style={styles.grid}>
            {[
              ...TOOLS.map((it) => ({ href: it.href, icon: it.icon, label: t(it.title) })),
              { href: '/more/camps' as Href, icon: Tent, label: N.camps },
              { href: '/more/news' as Href, icon: Newspaper, label: N.news },
              { href: '/more/staff' as Href, icon: Users, label: N.staff },
            ].map((it) => {
              const Icon = it.icon;
              return (
                <TouchableOpacity key={it.label} style={styles.tile} onPress={() => router.push(it.href)} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={it.label}>
                  <View style={styles.iconWrap}><Icon color={colors.white} size={20} /></View>
                  <Text style={styles.tileText} numberOfLines={2}>{it.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>{t('moreSettings')}</Text>
          <Card style={{ paddingVertical: space.xs }}>
            {settings.map((it, i) => (
              <Row key={String(i) + it.title} item={it} first={i === 0} />
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  item,
  first,
}: {
  item: { href: Href; icon: typeof Video; title: StringKey; desc: StringKey; badge?: number };
  first: boolean;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const Icon = item.icon;
  return (
    <TouchableOpacity
      style={[styles.row, !first && styles.divider]}
      onPress={() => router.push(item.href)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={t(item.title)}
    >
      <View style={styles.iconWrap}><Icon color={colors.white} size={18} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle}>{t(item.title)}</Text>
        <Text style={styles.rowDesc} numberOfLines={1}>{t(item.desc)}</Text>
      </View>
      {!!item.badge && item.badge > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text></View>
      )}
      <ForwardChevron />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  group: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '47.8%', minHeight: 92, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.hairline, padding: space.md, gap: 10, justifyContent: 'space-between',
  },
  tileText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  groupTitle: sectionTitle,
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardRaised,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },
  rowDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
});
