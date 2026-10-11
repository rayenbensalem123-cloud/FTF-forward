import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { colors, fonts, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';

/**
 * The header, content-first. There is no bar and no container: the crest, the
 * wordmark and the meta line sit straight on the page, and a 2px rule fades
 * from the federation red through gold and out to nothing underneath them.
 *
 * A filled bar was tried and rejected -- on a dark page it reads heavier and
 * older than the rest of the design, and it fights the cards for the top of
 * the screen. The rule carries the brand colours instead, at a weight that
 * does not compete with content.
 *
 * The title is the display face at 20/700 uppercase. Arabic has no case, so
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
    <View>
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

      {/* Red into gold, fading out to the right -- a broadcast lower-third at
          hairline weight, and the only place the brand colours meet. */}
      <LinearGradient
        colors={[colors.red, colors.gold, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  // Both affordances are plain outlined discs. A square card here reads as
  // chrome; a circle reads as a control.
  round: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
  },
  logoTile: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.cardRaised,
    borderWidth: 1, borderColor: colors.hairline, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  logo: { width: 30, height: 30 },
  titles: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.display, fontSize: 20, fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase', color: colors.white, lineHeight: 23,
  },
  subtitle: {
    color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.9,
    textTransform: 'uppercase', marginTop: 2,
  },
  rule: { height: 2, borderRadius: 1, marginTop: space.sm },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
