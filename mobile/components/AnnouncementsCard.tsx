import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, Megaphone, Pin, Plus, X } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatDate } from '@/lib/format';

const SHOWN = 3;

/** Team announcements from the platform. Everyone reads; only admins can post or delete (the database enforces it). */
export function AnnouncementsCard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { announcements, postAnnouncement, deleteAnnouncement } = usePlayers();
  const isAdmin = user?.role === 'admin';
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  if (announcements.length === 0 && !isAdmin) return null;

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert(t('announcements'), t('announcementRequired'));
      return;
    }
    setBusy(true);
    try {
      await postAnnouncement({ title, body, pinned });
      setTitle('');
      setBody('');
      setPinned(false);
      setComposing(false);
    } catch {
      Alert.alert(t('announcements'), t('saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (id: number) => {
    if (!isAdmin) return;
    Alert.alert(t('announcements'), t('confirmDeleteAnnouncement'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deleteAnnouncement(id).catch(() => Alert.alert(t('announcements'), t('saveFailed'))),
      },
    ]);
  };

  return (
    <Card style={{ gap: space.sm + 2 }}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Megaphone color={colors.gold} size={14} />
          <Text style={styles.section}>{t('announcements')}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setComposing((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={t('newAnnouncement')}
          >
            {composing ? <X color={colors.white} size={16} /> : <Plus color={colors.white} size={16} />}
          </TouchableOpacity>
        )}
      </View>

      {composing && (
        <View style={styles.form}>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('announcementTitle')} placeholderTextColor={colors.muted} maxLength={120} />
          <TextInput style={[styles.input, styles.multi]} value={body} onChangeText={setBody} placeholder={t('announcementBody')} placeholderTextColor={colors.muted} multiline maxLength={2000} />
          <View style={styles.formRow}>
            <TouchableOpacity style={styles.pinRow} onPress={() => setPinned((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: pinned }}>
              <View style={[styles.check, pinned && styles.checkOn]}>{pinned && <Check color={colors.navy} size={12} />}</View>
              <Text style={styles.pinText}>{t('pinAnnouncement')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.postBtn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} accessibilityRole="button">
              {busy ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.postText}>{t('post')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {announcements.length === 0 && <Text style={styles.empty}>{t('noAnnouncementsAdmin')}</Text>}
      {announcements.slice(0, SHOWN).map((a, i) => (
        <TouchableOpacity
          key={a.id}
          activeOpacity={isAdmin ? 0.7 : 1}
          onLongPress={() => confirmDelete(a.id)}
          style={[styles.item, i > 0 && styles.divider]}
          accessibilityHint={isAdmin ? t('delete') : undefined}
        >
          <View style={styles.itemHead}>
            {a.pinned && <Pin color={colors.gold} size={12} />}
            <Text style={styles.itemTitle} numberOfLines={2}>{a.title}</Text>
          </View>
          <Text style={styles.itemBody} numberOfLines={4}>{a.body}</Text>
          <Text style={styles.meta}>{[a.author, formatDate(new Date(a.createdAt).toISOString().slice(0, 10))].filter(Boolean).join(' · ')}</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  section: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  addBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  form: { gap: space.sm },
  input: {
    backgroundColor: colors.navy, borderRadius: radius.sm + 2, borderWidth: 1, borderColor: colors.goldBorder,
    color: colors.white, paddingHorizontal: 12, height: 44, fontSize: 14,
  },
  multi: { height: undefined, minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  pinText: { color: colors.white, fontSize: 13 },
  postBtn: { minWidth: 76, height: 36, borderRadius: radius.sm + 2, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  postText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  empty: { color: colors.muted, fontSize: 12 },
  item: { gap: 4, paddingTop: 2 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space.sm + 2 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { color: colors.white, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  itemBody: { color: colors.white, opacity: 0.85, fontSize: 13, lineHeight: 18 },
  meta: { color: colors.muted, fontSize: 11 },
});
