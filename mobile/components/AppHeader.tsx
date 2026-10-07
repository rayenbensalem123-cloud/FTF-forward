import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { colors, FTF_LOGO_URL, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationsContext';

export function AppHeader({ showBell = true }: { showBell?: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { unread } = useNotifications();
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <View style={styles.row}>
      {logoFailed ? (
        <View style={[styles.logo, styles.logoFallback]}>
          <Text style={styles.logoText}>FTF</Text>
        </View>
      ) : (
        <Image
          source={{ uri: FTF_LOGO_URL }}
          style={styles.logo}
          resizeMode="contain"
          onError={() => setLogoFailed(true)}
          accessibilityLabel="FTF crest"
        />
      )}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>{t('appName')}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{t('federation')}</Text>
      </View>
      {showBell && (
        <TouchableOpacity
          style={styles.bell}
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel={`${t('notifications')}, ${unread}`}
        >
          <Bell color={colors.gold} size={20} />
          {unread > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  logo: { width: 44, height: 44 },
  logoFallback: { borderRadius: 22, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  titles: { flex: 1, minWidth: 0 },
  title: { color: colors.white, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 1 },
  bell: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.goldBorder, alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
