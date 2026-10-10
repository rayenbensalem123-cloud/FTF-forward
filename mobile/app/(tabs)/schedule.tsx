import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarOff, Clock } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { colors, radius, sectionTitle, space } from '@/constants/theme';
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
        <AppHeader title={t('tabSchedule')} subtitle={schedule?.title || t('tabCampSchedule')} />
        <SyncLine version={schedule?.version} />

        {loading ? null : days.length === 0 ? (
          <View style={styles.empty}>
            <CalendarOff color={colors.muted} size={40} />
            <Text style={styles.emptyText}>{t('scheduleEmpty')}</Text>
          </View>
        ) : (
          days.map((day) => {
            const { num, rest } = splitDayLabel(day.dayLabel);
            return (
              <View key={day.dayIndex} style={styles.group}>
                <Text style={styles.section}>{day.dayLabel}</Text>
                <Card style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    {/* The prototype's date block: a heavy gold number over an uppercase meta line. */}
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateNum} numberOfLines={1}>{num}</Text>
                      {!!rest && <Text style={styles.dateRest} numberOfLines={1}>{rest}</Text>}
                    </View>
                    <View style={styles.dayRule} />
                  </View>

                  {day.activities.map((act, i) => {
                    const mine = act.playerId != null;
                    return (
                      <View key={String(act.id)} style={[styles.row, i > 0 && styles.divider, mine && styles.rowMine]}>
                        <View style={styles.timeCol}>
                          <Clock color={colors.gold} size={13} />
                          <Text style={styles.timeText}>{act.time || '—'}</Text>
                        </View>
                        <View style={styles.rowInfo}>
                          <Text style={styles.rowTitle}>{act.activity}</Text>
                          {mine && (
                            <Text style={styles.rowPlayer}>👤 {act.playerLabel || user?.name || ''}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </Card>
              </View>
            );
          })
        )}

        {personalCount > 0 && <Text style={styles.footnote}>{t('personalFootnote')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function SyncLine({ version }: { version?: number }) {
  const { t } = useLanguage();
  if (version == null) return null;
  return (
    <Text style={styles.version}>
      {t('versionLabel')} {version}
    </Text>
  );
}

/** "15 October" -> { num: "15", rest: "October" }; "Day 1" -> { num: "1", rest: "Day" }. */
function splitDayLabel(label: string): { num: string; rest: string } {
  const m = label.match(/(\d+)/);
  if (!m) return { num: label, rest: '' };
  return { num: m[0], rest: (label.slice(0, m.index) + label.slice((m.index ?? 0) + m[0].length)).trim() || label };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },

  version: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: -8 },

  empty: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 32,
  },
  emptyText: { color: colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'center' },

  group: { gap: space.sm },
  section: sectionTitle,

  dayCard: { padding: space.lg, gap: 0 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  dateBlock: { minWidth: 56, alignItems: 'center' },
  dateNum: { color: colors.gold, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'], lineHeight: 28 },
  dateRest: {
    color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginTop: 2,
  },
  dayRule: { flex: 1, height: 1, backgroundColor: colors.hairline },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  /* Personal line: a red border is the only difference the player ever sees.
     marginLeft/paddingLeft cancel each other so the text stays aligned with
     the other rows while the red rule sits at the card's edge. */
  rowMine: {
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
    backgroundColor: colors.redSoft,
    borderRadius: radius.sm,
    marginLeft: -space.md,
    marginRight: -space.md,
    paddingLeft: space.md - 3,
    paddingRight: space.md,
    paddingVertical: 12,
    marginBottom: 4,
  },
  timeCol: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 74, paddingTop: 1 },
  timeText: { color: colors.gold, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.white, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  rowPlayer: { color: colors.muted, fontSize: 12, marginTop: 3 },

  footnote: { color: colors.muted, fontSize: 11, textAlign: 'center' },
});
