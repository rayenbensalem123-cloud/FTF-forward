import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { colors, fonts, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';

/**
 * The model's header: a full-bleed red bar, edge to edge, with the crest on a
 * white disc, the wordmark in the display face, and the avatar as a dark
 * translucent disc.
 *
 * It is full-bleed rather than an inset bar on purpose. An inset rounded bar
 * was tried and read as a button -- heavier and older than everything below
 * it. Breaking out to the screen edges is what makes it read as a header.
 *
 * Screens pad their own content, so the bar pulls itself out to the edges with
 * a negative margin and re-applies the padding inside itself.
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
        <TouchableOpacity style={styles.round} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('back')}>
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
          style={styles.round}
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel={`${t('notifications')}, ${unread}`}
        >
          <Bell color={colors.white} size={18} />
          {unread > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.red,
    // Full-bleed: pull out of the screen's content padding, then re-apply it
    // inside the bar so the contents still line up with the cards below.
    marginHorizontal: -space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
  },
  // Both affordances are translucent dark discs over the red, as in the model.
  round: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  // The crest sits on a white disc so it keeps its own contrast against the
  // red -- the model does exactly this rather than knocking it out.
  logoTile: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logo: { width: 30, height: 30 },
  titles: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.display, fontSize: 18, fontWeight: '700', letterSpacing: 0.45,
    textTransform: 'uppercase', color: colors.white, lineHeight: 21,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '600', letterSpacing: 0.9,
    textTransform: 'uppercase', marginTop: 2,
  },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
