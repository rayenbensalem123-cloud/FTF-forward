import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarOff, Clock } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { groupByDay, type CampSchedule } from '@/lib/campProgram';
import { loadLatestSchedule } from '@/lib/campSchedule';

/**
 * The player's day-by-day camp program.
 *
 * The database already strips what she must not see: a player only receives a
 * published schedule's shared lines plus the ones addressed to her own card,
 * so a private line simply appears here with a red border and the name, and
 * never exists for anyone else.
 */
export default function ScheduleScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<CampSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSchedule(await loadLatestSchedule());
    } catch {
      // Offline: the last cached state stays on screen.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const days = schedule ? groupByDay(schedule.activities) : [];
  // Lines written for a named player: hers show with a red border, the rest
  // (belonging to a teammate) were never returned by the database.
  const personalCount = schedule?.activities.filter((a) => a.playerId != null).length ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
      >
        <AppHeader />

        <Text style={styles.title}>{t('tabSchedule')}</Text>
        {schedule && (
          <Text style={styles.subtitle}>
            {schedule.title || t('tabCampSchedule')} · {t('versionLabel')} {schedule.version}
          </Text>
        )}

        {loading ? null : days.length === 0 ? (
          <View style={styles.empty}>
            <CalendarOff color={colors.muted} size={40} />
            <Text style={styles.emptyText}>{t('scheduleEmpty')}</Text>
          </View>
        ) : (
          days.map((day) => (
            <View key={day.dayIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{day.dayLabel}</Text>
              <View style={styles.activityList}>
                {day.activities.map((act) => {
                  const mine = act.playerId != null;
                  return (
                    <View key={String(act.id)} style={[styles.activityItem, mine && styles.activityItemMine]}>
                      <View style={styles.activityTime}>
                        <Clock color={colors.gold} size={14} />
                        <Text style={styles.activityTimeText}>{act.time}</Text>
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>{act.activity}</Text>
                        {mine && (
                          <Text style={styles.activityPlayer}>
                            👤 {act.playerLabel || user?.name || ''}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {personalCount > 0 && <Text style={styles.footnote}>{t('personalFootnote')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },

  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: -8 },

  empty: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 32,
  },
  emptyText: { color: colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'center' },

  section: { gap: 10 },
  sectionTitle: { color: colors.gold, fontSize: 13, fontWeight: '800', letterSpacing: 0.12, textTransform: 'uppercase' },

  activityList: { gap: 8 },
  activityItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityItemMine: { borderColor: colors.red },
  activityTime: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 56 },
  activityTimeText: { color: colors.gold, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  activityInfo: { flex: 1 },
  activityName: { color: colors.white, fontSize: 14, fontWeight: '700' },
  activityPlayer: { color: colors.muted, fontSize: 12, marginTop: 2 },

  footnote: { color: colors.muted, fontSize: 11, textAlign: 'center' },
});
