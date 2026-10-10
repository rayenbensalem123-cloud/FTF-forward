import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Send, Upload } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { currentSession } from '@/lib/supabase';

/** Base URL of the Next.js server that hosts /api/camp-schedule/parse. */
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CampActivity {
  id: string;
  day: string;
  time: string;
  activity: string;
  type: 'collective' | 'private';
  playerName?: string;
}

interface ParsedSchedule {
  days: CampActivity[];
  totalActivities: number;
  collectiveCount: number;
  privateCount: number;
  playersMentioned: string[];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CampScheduleScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [programText, setProgramText] = useState('');
  const [parsed, setParsed] = useState<ParsedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only staff can access this screen
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('accessDeniedStaff')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const parseSchedule = async () => {
    if (!programText.trim()) {
      setError(t('pleaseEnterProgram'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = currentSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/camp-schedule/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ text: programText }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || t('failedToParse'));
      }

      const result = await response.json();
      setParsed(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToParse'));
    } finally {
      setLoading(false);
    }
  };

  const sendToPlayers = async () => {
    // TODO: Persist the parsed schedule and push it to the camp players.
  };

  // Group activities by day
  const groupedByDay = parsed?.days.reduce((acc, activity) => {
    if (!acc[activity.day]) acc[activity.day] = [];
    acc[activity.day].push(activity);
    return acc;
  }, {} as Record<string, CampActivity[]>);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <Text style={styles.title}>{t('tabCampSchedule')}</Text>
        <Text style={styles.subtitle}>{t('campScheduleSubtitle')}</Text>

        {/* Upload Zone */}
        <TouchableOpacity style={styles.uploadZone} activeOpacity={0.8}>
          <Upload color={colors.gold} size={32} />
          <Text style={styles.uploadTitle}>{t('uploadProgram')}</Text>
          <Text style={styles.uploadDesc}>{t('uploadProgramDesc')}</Text>
          <View style={styles.formatRow}>
            <Text style={styles.format}>.docx</Text>
            <Text style={styles.format}>.pdf</Text>
            <Text style={styles.format}>.jpg</Text>
            <Text style={styles.format}>.png</Text>
          </View>
        </TouchableOpacity>

        {/* Text Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{t('orTypeManually')}</Text>
          <TextInput
            style={styles.textarea}
            value={programText}
            onChangeText={setProgramText}
            placeholder={'Day ONE - 21 October 2026\n09:00 Waking up\n10:00 Training - Main Pitch\n12:00 Lunch\n11:30 S. Gharbi: Meeting with Coach\n...'}
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Parse Button */}
        <TouchableOpacity
          style={[styles.parseBtn, loading && styles.parseBtnDisabled]}
          onPress={parseSchedule}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <Text style={styles.parseBtnText}>{t('parseSchedule')}</Text>
          )}
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {parsed && (
          <View style={styles.results}>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{parsed.totalActivities}</Text>
                <Text style={styles.statLabel}>{t('activitiesLabel')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{parsed.days.length}</Text>
                <Text style={styles.statLabel}>{t('daysLabel')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{parsed.playersMentioned.length}</Text>
                <Text style={styles.statLabel}>{t('playersLabel')}</Text>
              </View>
            </View>

            {/* Players with individual activities */}
            {parsed.playersMentioned.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('concernedPlayers')}</Text>
                <View style={styles.playerTags}>
                  {parsed.playersMentioned.map((name) => (
                    <View key={name} style={styles.playerTag}>
                      <Text style={styles.playerTagText}>👤 {name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Activities by day */}
            {groupedByDay && Object.entries(groupedByDay).map(([day, activities]) => (
              <View key={day} style={styles.section}>
                <Text style={styles.sectionTitle}>{day}</Text>
                <View style={styles.activityList}>
                  {activities.map((act) => (
                    <View key={act.id} style={[styles.activityItem, act.type === 'private' && styles.activityItemPrivate]}>
                      <View style={styles.activityTime}>
                        <Clock color={colors.gold} size={14} />
                        <Text style={styles.activityTimeText}>{act.time}</Text>
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>{act.activity}</Text>
                        {act.playerName && (
                          <Text style={styles.activityPlayer}>👤 {act.playerName}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Send Button */}
            <TouchableOpacity style={styles.sendBtn} onPress={sendToPlayers} activeOpacity={0.8}>
              <Send color={colors.navy} size={18} />
              <Text style={styles.sendBtnText}>{t('sendToPlayers')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.red, fontSize: 16, fontWeight: '700' },

  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },

  uploadZone: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.goldBorder,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  uploadTitle: { color: colors.white, fontSize: 16, fontWeight: '800', marginTop: 8 },
  uploadDesc: { color: colors.muted, fontSize: 13 },
  formatRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  format: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.cardRaised,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },

  inputSection: { gap: 8 },
  inputLabel: { color: colors.gold, fontSize: 13, fontWeight: '800', letterSpacing: 0.05, textTransform: 'uppercase' },
  textarea: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 16,
    color: colors.white,
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 200,
  },

  parseBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
  },
  parseBtnDisabled: { opacity: 0.6 },
  parseBtnText: { color: colors.navy, fontSize: 14, fontWeight: '800', letterSpacing: 0.05, textTransform: 'uppercase' },

  errorBox: {
    backgroundColor: colors.redSoft,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.red,
  },
  errorBoxText: { color: colors.red, fontSize: 13, fontWeight: '600' },

  results: { gap: space.lg },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { color: colors.white, fontSize: 28, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.08, textTransform: 'uppercase', marginTop: 4 },

  section: { gap: 10 },
  sectionTitle: { color: colors.gold, fontSize: 13, fontWeight: '800', letterSpacing: 0.12, textTransform: 'uppercase' },

  playerTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  playerTag: {
    backgroundColor: colors.cardRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  playerTagText: { color: colors.white, fontSize: 12, fontWeight: '700' },

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
  activityItemPrivate: { borderColor: colors.red },
  activityTime: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 50 },
  activityTimeText: { color: colors.gold, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  activityInfo: { flex: 1 },
  activityName: { color: colors.white, fontSize: 14, fontWeight: '700' },
  activityPlayer: { color: colors.muted, fontSize: 12, marginTop: 2 },

  sendBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnText: { color: colors.navy, fontSize: 14, fontWeight: '800', letterSpacing: 0.05, textTransform: 'uppercase' },
});
