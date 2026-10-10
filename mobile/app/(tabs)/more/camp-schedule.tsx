import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
// Legacy API path: the new expo-file-system export is object-based (File/Directory)
// and has no readAsStringAsync.
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import { CheckCircle, Clock, FileText, Send, Upload, X } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import {
  activitiesFromParsed, groupByDay, matchPlayerId, type CampActivity, type ParsedLine,
} from '@/lib/campProgram';
import { loadLatestSchedule, saveSchedule } from '@/lib/campSchedule';

/** Base URL of the Next.js server that hosts /api/camp-schedule/parse. */
// EXPO_PUBLIC_* does not reach the runtime in this project: every value that
// actually works here (the Supabase URL and key in lib/supabase.ts) comes from
// a hardcoded default, not from the env var. So the dev server is defaulted the
// same way, and the env var stays as an override for when it does resolve.
//
// The default must NOT be localhost. On a physical device localhost names the
// phone itself, so a missing env var turns into a connection error that reads
// like a malformed document. If the PC's address changes, this is the line to
// update - the error box below names the server it tried.
const DEFAULT_API_URL = 'http://192.168.1.72:3000';
const FROM_ENV = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
const API_URL = !FROM_ENV || FROM_ENV.startsWith('http://localhost') ? DEFAULT_API_URL : FROM_ENV;

interface ParseResponse extends ParsedLine {
  days: ParsedLine[];
}

export default function CampScheduleScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { players } = usePlayers();

  const [file, setFile] = useState<{ name: string; uri: string; mimeType: string } | null>(null);
  const [programText, setProgramText] = useState('');
  const [activities, setActivities] = useState<CampActivity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  // The parse is a reading, not a decision. Nothing reaches the players until
  // the coach has looked at the rewritten programme and accepted it, so a
  // mis-read day or a mis-guessed name can be caught here instead of landing
  // on 24 phones.
  const [approved, setApproved] = useState(false);

  const isStaff = !!user && (user.role === 'staff' || user.role === 'admin');

  // Only staff can access this screen.
  if (!isStaff) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader back showBell={false} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('accessDeniedStaff')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ───────── Parse ─────────
  const parse = async () => {
    setError(null);
    setSent(false);
    setApproved(false); // a new reading has to be accepted again

    const hasFile = !!file;
    const hasText = !!programText.trim();
    if (!hasFile && !hasText) {
      setError(t('pleaseEnterProgram'));
      return;
    }

    setLoading(true);
    try {
      let res: Response;
      if (hasFile && file) {
        // Send the picked file as base64 JSON rather than as multipart.
        //
        // React Native's *native* networking (inside Expo Go) rejects the
        // {uri,name,type} object FormData expects, so a multipart upload fails
        // on device before the request is ever sent - it never reaches the
        // server. Reading the bytes in JS and posting them as JSON removes
        // that native handoff entirely.
        const base64 = await readAsStringAsync(file.uri, { encoding: EncodingType.Base64 });
        res = await fetch(`${API_URL}/api/camp-schedule/parse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.mimeType || 'application/octet-stream',
            base64,
          }),
        });
      } else {
        res = await fetch(`${API_URL}/api/camp-schedule/parse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: programText }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: t('failedToParse') }));
        throw new Error(err.error || t('failedToParse'));
      }

      const result: ParseResponse = await res.json();
      const lines = activitiesFromParsed(result.days ?? []);

      // Resolve "S. Gharbi" against the roster so the line reaches only her.
      const linked = lines.map((a) =>
        a.playerLabel ? { ...a, playerId: matchPlayerId(a.playerLabel, players) } : a,
      );
      setActivities(linked);
      if (linked.length === 0) setError(t('failedToParse'));
    } catch (err) {
      // A connection failure says nothing about the file that was picked, and
      // surfacing it bare makes a dead dev server, a stale LAN IP or a phone
      // on another network look like a malformed document. Name the server so
      // the two cases can be told apart at a glance.
      const msg = err instanceof Error ? err.message : t('failedToParse');
      const unreachable = /network request failed|could not connect|failed to fetch|fetch failed|aborted/i.test(msg);
      setError(unreachable ? `${msg}\n${API_URL}` : msg);
    } finally {
      setLoading(false);
    }
  };

  // ───────── Pick a file ─────────
  const pickFile = async () => {
    setError(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/*',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setFile({ name: a.name, uri: a.uri, mimeType: a.mimeType ?? '' });
    setActivities(null);
    setApproved(false);
  };

  // ───────── Send to the players ─────────
  const send = async () => {
    if (!activities || activities.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const existing = await loadLatestSchedule();
      await saveSchedule(
        {
          title: file?.name ? file.name.replace(/\.[^.]+$/, '') : t('tabCampSchedule'),
          sourceFile: file?.name ?? '',
          activities,
          publish: true,
          author: user?.username ?? null,
        },
        existing && existing.status === 'published' ? existing : undefined,
      );
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToParse'));
    } finally {
      setSaving(false);
    }
  };

  const days = activities ? groupByDay(activities) : [];
  const personalCount = activities?.filter((a) => a.playerLabel).length ?? 0;
  // A name the roster could not resolve stays staff-only until it is linked.
  const unlinked = activities?.filter((a) => a.playerLabel && !a.playerId).length ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader back showBell={false} title={t('tabCampSchedule')} subtitle={t('campScheduleSubtitle')} />

        {/* Upload zone */}
        {file ? (
          <View style={styles.fileRow}>
            <FileText color={colors.gold} size={20} />
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <TouchableOpacity onPress={() => { setFile(null); setActivities(null); setApproved(false); }} hitSlop={10}>
              <X color={colors.muted} size={18} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadZone} activeOpacity={0.8} onPress={pickFile}>
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
        )}

        {/* Manual input */}
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

        {/* Parse */}
        <TouchableOpacity
          style={[styles.parseBtn, loading && styles.parseBtnDisabled]}
          onPress={parse}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <Text style={styles.parseBtnText}>{t('parseSchedule')}</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        )}

        {sent && (
          <View style={styles.sentBox}>
            <Text style={styles.sentBoxText}>{t('scheduleSent')}</Text>
          </View>
        )}

        {/* Preview */}
        {activities && activities.length > 0 && (
          <View style={styles.results}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{activities.length}</Text>
                <Text style={styles.statLabel}>{t('activitiesLabel')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{days.length}</Text>
                <Text style={styles.statLabel}>{t('daysLabel')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{personalCount}</Text>
                <Text style={styles.statLabel}>{t('playersLabel')}</Text>
              </View>
            </View>

            {unlinked > 0 && (
              <View style={styles.warnBox}>
                <Text style={styles.warnBoxText}>{t('unlinkedWarning')}</Text>
              </View>
            )}

            {!approved && (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewBoxText}>{t('reviewPrompt')}</Text>
              </View>
            )}

            {days.map((day) => (
              <View key={day.dayIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{day.dayLabel}</Text>
                <View style={styles.activityList}>
                  {day.activities.map((act) => (
                    <View
                      key={String(act.id)}
                      style={[styles.activityItem, act.playerLabel && styles.activityItemPersonal]}
                    >
                      <View style={styles.activityTime}>
                        <Clock color={colors.gold} size={14} />
                        <Text style={styles.activityTimeText}>{act.time}</Text>
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>{act.activity}</Text>
                        {act.playerLabel ? (
                          <Text style={styles.activityPlayer}>👤 {act.playerLabel}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Approval gate. The parse is a reading, not a decision: nothing
                is published until the coach has looked at the rewritten
                programme and accepted it. */}
            {!approved ? (
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => setApproved(true)}
                activeOpacity={0.8}
              >
                <CheckCircle color={colors.navy} size={18} />
                <Text style={styles.sendBtnText}>{t('approveProgram')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.approvedBox}>
                  <Text style={styles.approvedBoxText}>{t('programApproved')}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sendBtn, saving && styles.parseBtnDisabled]}
                  onPress={send}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.navy} />
                  ) : (
                    <>
                      <Send color={colors.navy} size={18} />
                      <Text style={styles.sendBtnText}>{t('sendToPlayers')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
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

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 16,
  },
  fileName: { color: colors.white, fontSize: 14, fontWeight: '700', flex: 1 },

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
    minHeight: 180,
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

  sentBox: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  sentBoxText: { color: colors.white, fontSize: 13, fontWeight: '700' },

  warnBox: {
    backgroundColor: colors.cardRaised,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  warnBoxText: { color: colors.muted, fontSize: 12, fontWeight: '600' },

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
  activityItemPersonal: { borderColor: colors.red },
  activityTime: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 56 },
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

  approveBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approvedBox: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: 'center',
  },
  approvedBoxText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  reviewBox: {
    backgroundColor: colors.cardRaised,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  reviewBoxText: { color: colors.white, fontSize: 12, fontWeight: '600' },
});
