import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Chips, type Option } from '@/components/Chips';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { isValidBirthdate } from '@/lib/mappers';
import type { Availability, Category, Position } from '@/types';

const POSITIONS: Option<Position>[] = [
  { value: 'GK', label: 'GK' }, { value: 'DEF', label: 'DEF' }, { value: 'MID', label: 'MID' }, { value: 'FWD', label: 'FWD' },
];
const CATEGORIES: Option<Category>[] = [
  { value: 'Seniors', label: 'Seniors' }, { value: 'U-20', label: 'U-20' }, { value: 'U-17', label: 'U-17' },
];

export default function EditPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { can } = useAuth();
  const { getPlayer, updatePlayer, setMedical } = usePlayers();
  const router = useRouter();

  const player = id ? getPlayer(id) : undefined;
  const canBasic = can('editPlayer');
  const canMedical = can('editMedical');

  const [name, setName] = useState(player?.name ?? '');
  const [number, setNumber] = useState(String(player?.number ?? ''));
  const [birthdate, setBirthdate] = useState(player?.birthdate ?? '');
  const [busy, setBusy] = useState(false);
  const [club, setClub] = useState(player?.club ?? '');
  const [position, setPosition] = useState<Position>(player?.position ?? 'MID');
  const [category, setCategory] = useState<Category>(player?.category ?? 'Seniors');
  const editable = player && (player.status === 'fit' || player.status === 'recovery' || player.status === 'injured');
  const [status, setStatus] = useState<'fit' | 'recovery' | 'injured'>(editable ? (player.status as 'fit' | 'recovery' | 'injured') : 'fit');
  const [note, setNote] = useState(player?.medicalNote ?? '');

  if (!player) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('editPlayer')}</Text>
          <TouchableOpacity style={styles.close} onPress={() => router.back()} accessibilityLabel={t('close')}>
            <X color={colors.white} size={18} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusOptions: Option<'fit' | 'recovery' | 'injured'>[] = [
    { value: 'fit', label: t('matchFit') },
    { value: 'recovery', label: t('recovery') },
    { value: 'injured', label: t('injured') },
  ];

  const save = async () => {
    const basic: Parameters<typeof updatePlayer>[1] = {};
    if (canBasic) {
      const n = parseInt(number, 10);
      if (!name.trim() || !Number.isFinite(n) || n < 1 || n > 99) {
        Alert.alert(t('editPlayer'), t('required'));
        return;
      }
      if (birthdate.trim() && !isValidBirthdate(birthdate.trim())) {
        Alert.alert(t('editPlayer'), t('birthdateInvalid'));
        return;
      }
      // Only send what changed, so a colleague's edit to another field is never overwritten.
      if (name.trim() !== player.name) basic.name = name.trim();
      if (n !== player.number) basic.number = n;
      if (club.trim() !== player.club && (club.trim() || player.club !== 'Unattached')) basic.club = club.trim() || 'Unattached';
      if (position !== player.position) basic.position = position;
      if (category !== player.category) basic.category = category;
      if (birthdate.trim() !== player.birthdate) basic.birthdate = birthdate.trim();
    }

    const medicalChanged = canMedical && !!editable && (status !== player.status || note.trim() !== player.medicalNote);

    setBusy(true);
    try {
      if (Object.keys(basic).length > 0) await updatePlayer(player.id, basic);
      if (medicalChanged) await setMedical(player.id, status, note);
      router.back();
    } catch {
      Alert.alert(t('editPlayer'), t('saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{t('editPlayer')}</Text>
          <TouchableOpacity style={styles.close} onPress={() => router.back()} accessibilityLabel={t('close')}>
            <X color={colors.white} size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!canBasic && <Text style={styles.viewOnly}>{t('viewOnly')}</Text>}

          <Field label={t('fullName')}>
            <TextInput style={[styles.input, !canBasic && styles.locked]} value={name} onChangeText={setName} editable={canBasic} placeholderTextColor={colors.muted} />
          </Field>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Field label={t('jerseyNumber')}>
                <TextInput style={[styles.input, !canBasic && styles.locked]} value={number} onChangeText={setNumber} editable={canBasic} keyboardType="number-pad" maxLength={2} placeholderTextColor={colors.muted} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t('birthdate')}>
                <TextInput style={[styles.input, !canBasic && styles.locked]} value={birthdate} onChangeText={setBirthdate} editable={canBasic} keyboardType="numbers-and-punctuation" maxLength={10} placeholderTextColor={colors.muted} />
              </Field>
            </View>
          </View>
          <Field label={t('club')}>
            <TextInput style={[styles.input, !canBasic && styles.locked]} value={club} onChangeText={setClub} editable={canBasic} placeholderTextColor={colors.muted} />
          </Field>
          <Field label={t('position')}><Chips options={POSITIONS} value={position} onChange={setPosition} disabled={!canBasic} /></Field>
          <Field label={t('category')}><Chips options={CATEGORIES} value={category} onChange={setCategory} disabled={!canBasic} /></Field>

          <View style={styles.divider} />
          {!canMedical && <Text style={styles.viewOnly}>{t('viewOnly')}</Text>}
          {canMedical && !editable && <Text style={styles.viewOnly}>{t(player.status === 'suspended' ? 'suspended' : 'unknownStatus')}</Text>}

          <Field label={t('status')}><Chips options={statusOptions} value={status} onChange={setStatus} disabled={!canMedical || !editable} /></Field>
          <Field label={t('medicalNote')}>
            <TextInput
              style={[styles.input, styles.note, !canMedical && styles.locked]}
              value={note}
              onChangeText={setNote}
              editable={canMedical && !!editable}
              multiline
              placeholderTextColor={colors.muted}
            />
          </Field>

          {(canBasic || canMedical) && (
            <TouchableOpacity style={[styles.save, busy && { opacity: 0.6 }]} onPress={save} disabled={busy} accessibilityRole="button">
              <Text style={styles.saveText}>{t('saveChanges')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.md },
  title: { color: colors.white, fontSize: 22, fontWeight: '800', flex: 1 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  viewOnly: { color: colors.amber, fontSize: 13, backgroundColor: colors.amberSoft, borderRadius: radius.sm + 2, padding: 10 },
  twoCol: { flexDirection: 'row', gap: space.md },
  label: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder,
    color: colors.white, paddingHorizontal: 14, height: 50, fontSize: 15,
  },
  note: { height: undefined, minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  locked: { opacity: 0.55 },
  divider: { height: 1, backgroundColor: colors.line },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  save: { height: 52, borderRadius: radius.md, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
