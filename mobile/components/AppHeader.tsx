import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';

/**
 * The redesign's header: a 44px logo tile, a sentence-case title (17/800) and
 * an uppercase meta line (11/600). Screens pass their own `title`/`subtitle`
 * ("Squad" / "Seniors · 23 Players"); without them the app name and the
 * federation show, which is what the home screens want.
 */
export function AppHeader({
  showBell = true,
  back = false,
  title,
  subtitle,
}: {
  showBell?: boolean;
  back?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const { unread } = useNotifications();

  return (
    <View style={styles.row}>
      {back && (
        <TouchableOpacity style={styles.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('back')}>
          <ChevronLeft color={colors.white} size={22} />
        </TouchableOpacity>
      )}
      {/* Bundled in the app, so it shows offline and on the first frame. Same crest as the website. */}
      <View style={styles.logoTile}>
        <Image source={require('../assets/ftf-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="FTF crest" />
      </View>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>{title ?? t('appName')}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle ?? t('federation')}</Text>
      </View>
      {showBell && (
        <TouchableOpacity
          style={styles.bell}
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel={`${t('notifications')}, ${unread}`}
        >
          <Bell color={colors.gold} size={18} />
          {unread > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  logoTile: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardRaised,
    borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
  },
  logo: { width: 30, height: 30 },
  titles: { flex: 1, minWidth: 0 },
  title: { color: colors.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: {
    color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.9,
    textTransform: 'uppercase', marginTop: 2,
  },
  bell: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
