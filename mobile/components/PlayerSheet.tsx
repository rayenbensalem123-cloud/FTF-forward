import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ClipboardList, Pencil, Send, X } from 'lucide-react-native';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDate } from '@/lib/format';
import type { Player } from '@/types';
import { Avatar } from './Avatar';
import { FitnessBadge, STATUS_STYLE } from './FitnessBadge';

interface Props {
  /** Pass a player to open the sheet, null to close it. */
  player: Player | null;
  onClose: () => void;
}

export function PlayerSheet({ player, onClose }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { can } = useAuth();
  const router = useRouter();
  const canEdit = can('editPlayer') || can('editMedical');

  // Keep the last player mounted while the close animation runs.
  const [shown, setShown] = useState<Player | null>(player);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [showLog, setShowLog] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (player) {
      setShown(player);
      setComposing(false);
      setDraft('');
      setShowLog(false);
      drag.setValue(0);
      Animated.timing(progress, {
        toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShown(null);
      });
    }
  }, [player, progress, drag]);

  // Drag the handle area down to dismiss.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) drag.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 1) {
          onCloseRef.current();
        } else {
          Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
    drag,
  );

  // The sheet is a native Modal, so close it first and open the edit screen once it has slid away.
  const openEdit = () => {
    if (!shown) return;
    const id = shown.id;
    onClose();
    setTimeout(() => router.push({ pathname: '/edit-player', params: { id } }), 340);
  };

  const sendMessage = () => {
    if (!shown || !draft.trim()) return;
    Alert.alert(t('send'), `${shown.name}: demo only, no message was sent.`);
    setDraft('');
    setComposing(false);
  };

  return (
    <Modal visible={shown !== null} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel={t('close')} />
        </Animated.View>

        {shown && (
          <Animated.View style={[styles.sheet, { maxHeight: height * 0.92, transform: [{ translateY }] }]}>
            <View {...pan.panHandlers} style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel={t('close')}>
              <X color={colors.white} size={18} />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.xl, gap: space.lg }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Identity */}
              <View style={styles.identity}>
                <Avatar name={shown.name} number={shown.number} photoUrl={shown.photoUrl} size={104} />
                <Text style={styles.name}>{shown.name}</Text>
                <View style={styles.tags}>
                  <View style={styles.pill}><Text style={styles.pillText}>{shown.number ? `#${shown.number} · ` : ''}{shown.position}</Text></View>
                  {shown.age > 0 && <View style={styles.pill}><Text style={styles.pillText}>{t('age')} {shown.age}</Text></View>}
                  <View style={styles.pill}><Text style={styles.pillText}>{shown.category}</Text></View>
                </View>
                <Text style={styles.club}>{shown.club}</Text>
                <FitnessBadge status={shown.status} large />
              </View>

              {/* Career stats */}
              <View>
                <Text style={styles.section}>{t('careerStats')}</Text>
                <View style={styles.statRow}>
                  {([
                    ['caps', shown.caps],
                    ['goals', shown.goals],
                    ['assists', shown.assists],
                  ] as const).map(([k, v]) => (
                    <View key={k} style={styles.statTile}>
                      <Text style={styles.statValue}>{v.toLocaleString('en-US')}</Text>
                      <Text style={styles.statLabel} numberOfLines={1}>{t(k)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Medical */}
              <View style={[styles.panel, { borderColor: STATUS_STYLE[shown.status].color }]}>
                <Text style={styles.section}>{t('medical')}</Text>
                {shown.status === 'unknown' ? (
                  <Text style={styles.medicalNote}>{t('unknownStatus')}</Text>
                ) : (
                  <Text style={styles.medicalNote}>{shown.medicalNote || (shown.medicalLog.length === 0 ? t('noMedicalData') : '')}</Text>
                )}
                <Text style={styles.checkup}>{t('yellowCards')}: {shown.yellowCards} · {t('redCards')}: {shown.redCards}</Text>
                {showLog && (
                  <View style={styles.log}>
                    {shown.medicalLog.map((e) => (
                      <View key={e.date + e.note} style={styles.logRow}>
                        <Text style={styles.logDate}>{e.date ? formatDate(e.date) : '—'}</Text>
                        <Text style={styles.logNote}>{e.note}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Actions */}
              {composing && (
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t('messagePlaceholder')}
                  placeholderTextColor={colors.muted}
                  multiline
                  autoFocus
                />
              )}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={composing ? sendMessage : () => setComposing(true)}
                  accessibilityRole="button"
                >
                  <Send color={colors.white} size={16} />
                  <Text style={styles.primaryText}>{composing ? t('send') : t('messagePlayer')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowLog((v) => !v)} accessibilityRole="button">
                  <ClipboardList color={colors.gold} size={16} />
                  <Text style={styles.secondaryText}>{showLog ? t('hideMedicalLog') : t('medicalLog')}</Text>
                </TouchableOpacity>
                {canEdit && (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={openEdit} accessibilityRole="button">
                    <Pencil color={colors.gold} size={16} />
                    <Text style={styles.secondaryText}>{t('editPlayer')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.navy, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderBottomWidth: 0, borderColor: colors.goldBorder, overflow: 'hidden',
  },
  handleArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 14 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  closeBtn: {
    position: 'absolute', top: 12, right: 14, zIndex: 2, width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  identity: { alignItems: 'center', gap: 8 },
  name: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: { backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  club: { color: colors.muted, fontSize: 14 },
  section: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  statRow: { flexDirection: 'row', gap: 8 },
  statTile: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder,
    paddingVertical: 12, alignItems: 'center',
  },
  statValue: { color: colors.white, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  panel: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.goldBorder, padding: space.lg },
  medicalNote: { color: colors.white, fontSize: 14, lineHeight: 20 },
  checkup: { color: colors.muted, fontSize: 12, marginTop: 8 },
  log: { marginTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  logRow: { gap: 2 },
  logDate: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  logNote: { color: colors.white, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder,
    color: colors.white, padding: 14, minHeight: 84, textAlignVertical: 'top', fontSize: 15,
  },
  actions: { gap: 10 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50,
    borderRadius: radius.md, backgroundColor: colors.red,
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50,
    borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.goldBorder,
  },
  secondaryText: { color: colors.gold, fontWeight: '800', fontSize: 15 },
});
