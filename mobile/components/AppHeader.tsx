import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { colors, fonts, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';

/**
 * The dashboard header: dark navy, with the crest, the wordmark in the display
 * face, an optional role badge, and a single circular affordance on the right.
 *
 * The red bar from the earlier attempt is gone. On a dark page a filled bar
 * reads heavier than the content below it; this header sits on the page
 * background and lets the hero card be the thing that carries colour.
 *
 * The title is the display face at 18/700 uppercase. Arabic has no case, so
 * `textTransform` is a no-op there and those headings fall back to the system
 * face per glyph.
 *
 * Screens pass their own `title`/`subtitle` ("Squad" / "Seniors · 23 Players");
 * without them the app name and the federation show, which is what the home
 * screens want.
 */
export function AppHeader({
  showBell = true,
  back = false,
  badge,
  title,
  subtitle,
}: {
  showBell?: boolean;
  back?: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const { unread } = useNotifications();

  return (
    <View style={styles.row}>
      {back && (
        <TouchableOpacity style={styles.round} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('back')}>
          <ChevronLeft color={colors.white} size={22} />
        </TouchableOpacity>
      )}
      {/* Bundled in the app, so it shows offline and on the first frame. Same crest as the website. */}
      {/* Placed directly with no tile and no ring: the file's corners are
          transparent, so the emblem sits on the header as-is. */}
      <Image source={require('../assets/ftf-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="FTF crest" />
      <View style={styles.titles}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title ?? t('appName')}</Text>
          {!!badge && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText} numberOfLines={1}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle ?? t('federation')}</Text>
      </View>
      {showBell && (
        <TouchableOpacity
          style={styles.round}
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel={`${t('notifications')}, ${unread}`}
        >
          <Bell color={colors.white} size={18} />
          {unread > 0 && (
            <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{unread > 9 ? '9+' : unread}</Text></View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  // Plain outlined discs; a square card here reads as chrome.
  round: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
  },
  // No tile, no ring: the file's corners are transparent, so the emblem sits
  // on the header as-is.
  logo: { width: 38, height: 38 },
  titles: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    fontFamily: fonts.display, fontSize: 18, fontWeight: '700', letterSpacing: 0.45,
    textTransform: 'uppercase', color: colors.white, lineHeight: 21,
  },
  // The role badge: a red dot and a muted label, as in the reference.
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.card, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red },
  badgeText: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  subtitle: {
    color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.9,
    textTransform: 'uppercase', marginTop: 2,
  },
  badgeCount: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeCountText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
