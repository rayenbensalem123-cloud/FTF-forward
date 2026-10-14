import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, ClipboardList, FileDown, LogOut, Share2, Users } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ForwardChevron } from '@/components/ForwardChevron';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ToolsCard } from '@/components/ToolsCard';
import { Segmented, type Option } from '@/components/Chips';
import { colors, radius, sectionTitle, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications, type NotificationSettings } from '@/context/NotificationsContext';
import { usePlayers } from '@/context/PlayersContext';
import type { StringKey } from '@/i18n/strings';
import { exportRosterPdf } from '@/lib/roster';
import { fetchReports } from '@/lib/clubReports';
import { fetchCalendarUrl, toWebcal } from '@/lib/calendarFeed';
import { CAL } from '@/i18n/calendarStrings';
import type { Language, Role } from '@/types';

const LANGUAGES: Option<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

const ROLE_LABEL: Record<Role, StringKey> = { admin: 'roleAdmin', staff: 'roleStaff', player: 'rolePlayer' };

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const { players } = usePlayers();
  // A player account owns a members row: player.id is String(member_id).
  const me = user?.memberId != null ? players.find((p) => p.id === String(user.memberId)) ?? null : null;
  const { settings, setSetting } = useNotifications();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const shared = await exportRosterPdf(players);
      if (!shared) Alert.alert(t('exportRoster'), 'Sharing is not available on this device.');
    } catch {
      Alert.alert(t('exportRoster'), 'The PDF could not be created. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const C = CAL[language];
  const [calBusy, setCalBusy] = useState(false);
  const withCalUrl = async (regenerate: boolean, fn: (url: string) => Promise<void>) => {
    setCalBusy(true);
    try {
      await fn(await fetchCalendarUrl(regenerate));
    } catch {
      Alert.alert(C.title, C.failed);
    } finally {
      setCalBusy(false);
    }
  };
  const onCalSubscribe = () =>
    withCalUrl(false, async (url) => {
      try { await Linking.openURL(toWebcal(url)); } catch { Alert.alert(C.title, C.openFailed); }
    });
  const onCalShare = () => withCalUrl(false, async (url) => { await Share.share({ message: url }); });
  const onCalReset = () =>
    Alert.alert(C.title, C.resetAsk, [
      { text: C.cancel, style: 'cancel' },
      { text: C.reset, style: 'destructive', onPress: () => void withCalUrl(true, async (url) => { await Share.share({ message: url }); }) },
    ]);

  const onToggle = async (key: keyof NotificationSettings, value: boolean) => {
    const ok = await setSetting(key, value);
    if (!ok) Alert.alert(t('notificationSettings'), t('notifDenied'));
  };

  const onSignOut = () =>
    Alert.alert(t('signOut'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: () => void signOut() },
    ]);

  const isStaffRole = user?.role === 'staff' || user?.role === 'admin';
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    if (!isStaffRole) return;
    let alive = true;
    fetchReports()
      .then((rs) => {
        if (alive) setPending(rs.filter((r) => !r.verified).length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isStaffRole]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title={t('tabProfile')} subtitle={user?.name ?? ''} />

        {/* Prototype profile card: a 100px portrait with a light ring, name, role. */}
        <Card style={styles.profile}>
          <Avatar name={user?.name ?? 'Staff'} size={100} number={me?.number} photoUrl={me?.photoUrl} />
          <View style={styles.profileText}>
            <Text style={styles.name} numberOfLines={1}>{user?.name ?? ''}</Text>
            <Text style={styles.role}>{user ? t(ROLE_LABEL[user.role]) : ''}</Text>
          </View>
        </Card>

        {!isStaffRole && <ToolsCard />}

        {isStaffRole && (
          <View>
            <Text style={styles.heading}>
              {language === 'fr' ? 'Revue' : language === 'ar' ? 'مراجعة' : 'Review'}
            </Text>
            <Card style={{ paddingVertical: space.xs }}>
              <TouchableOpacity style={styles.action} onPress={() => router.push('/reports')} accessibilityRole="button">
                <View style={styles.actionIcon}><ClipboardList color={colors.white} size={18} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.actionText}>{t('tabReports')}</Text>
                  <Text style={styles.actionDesc} numberOfLines={1}>{t('moreReportsDesc')}</Text>
                </View>
                {pending != null && pending > 0 && (
                  <View style={styles.countPill}>
                    <Text style={styles.countText}>{pending}</Text>
                  </View>
                )}
                <ForwardChevron />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.action, styles.divider]}
                onPress={() => router.push('/squad')}
                accessibilityRole="button"
              >
                <View style={styles.actionIcon}><Users color={colors.white} size={18} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.actionText}>{t('tabSquad')}</Text>
                  <Text style={styles.actionDesc} numberOfLines={1}>
                    {language === 'fr' ? 'Ouvrir la fiche de chaque joueuse' : language === 'ar' ? 'افتحي بطاقة أي لاعبة' : 'Open any player card'}
                  </Text>
                </View>
                <ForwardChevron />
              </TouchableOpacity>
            </Card>
          </View>
        )}

        <View>
          <Text style={styles.heading}>{t('teamManagement')}</Text>
          <Card style={{ paddingVertical: space.xs }}>
            {isStaffRole && (
              <TouchableOpacity style={styles.action} onPress={() => router.push('/more/camp-schedule')} accessibilityRole="button">
                <View style={styles.actionIcon}><Calendar color={colors.white} size={18} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.actionText}>{t('tabCampSchedule')}</Text>
                  <Text style={styles.actionDesc} numberOfLines={1}>{t('moreCampScheduleDesc')}</Text>
                </View>
                <ForwardChevron />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.action, isStaffRole && styles.divider]}
              onPress={onExport}
              disabled={exporting}
              accessibilityRole="button"
            >
              <View style={styles.actionIcon}><FileDown color={colors.white} size={18} /></View>
              <Text style={styles.actionText}>{t('exportRoster')}</Text>
              {exporting ? <ActivityIndicator color={colors.white} /> : <ForwardChevron />}
            </TouchableOpacity>
          </Card>
        </View>

        <View>
          <Text style={styles.heading}>{C.title}</Text>
          <Card style={{ paddingVertical: space.xs }}>
            <Text style={[styles.actionDesc, { paddingVertical: 10 }]}>{C.intro}</Text>
            <TouchableOpacity style={[styles.action, styles.divider]} onPress={onCalSubscribe} disabled={calBusy} accessibilityRole="button">
              <View style={styles.actionIcon}><Calendar color={colors.white} size={18} /></View>
              <Text style={styles.actionText}>{C.subscribe}</Text>
              {calBusy ? <ActivityIndicator color={colors.white} /> : <ForwardChevron />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.divider]} onPress={onCalShare} disabled={calBusy} accessibilityRole="button">
              <View style={styles.actionIcon}><Share2 color={colors.white} size={18} /></View>
              <Text style={styles.actionText}>{C.share}</Text>
              <ForwardChevron />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.divider]} onPress={onCalReset} disabled={calBusy} accessibilityRole="button">
              <Text style={[styles.actionText, { color: colors.red }]}>{C.reset}</Text>
            </TouchableOpacity>
            <Text style={[styles.actionDesc, { paddingBottom: 10 }]}>{C.privateNote}</Text>
          </Card>
        </View>

        <View>
          <Text style={styles.heading}>{t('notificationSettings')}</Text>
          <Card style={{ paddingVertical: space.xs }}>
            <View style={styles.switchRow}>
              <Text style={styles.actionText}>{t('matchReminders')}</Text>
              <Switch
                value={settings.matchReminders}
                onValueChange={(v) => onToggle('matchReminders', v)}
                trackColor={{ false: colors.line, true: colors.red }}
                thumbColor={colors.white}
              />
            </View>
            <View style={[styles.switchRow, styles.divider]}>
              <Text style={styles.actionText}>{t('availabilityAlerts')}</Text>
              <Switch
                value={settings.availabilityAlerts}
                onValueChange={(v) => onToggle('availabilityAlerts', v)}
                trackColor={{ false: colors.line, true: colors.red }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        </View>

        <View>
          <Text style={styles.heading}>{t('language')}</Text>
          <Segmented options={LANGUAGES} value={language} onChange={setLanguage} />
        </View>

        <TouchableOpacity style={styles.signOut} onPress={onSignOut} accessibilityRole="button">
          <LogOut color={colors.red} size={18} />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  profile: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  profileText: { alignItems: 'center', gap: 4 },
  name: { color: colors.white, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  role: {
    color: colors.white, fontSize: 13, fontWeight: '700', letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  heading: sectionTitle,
  action: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '700' },
  actionDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  countPill: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50,
    borderRadius: radius.card, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redSoft,
  },
  signOutText: { color: colors.red, fontWeight: '800', fontSize: 15 },
});
