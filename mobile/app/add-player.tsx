import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Chips, type Option } from '@/components/Chips';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { isValidBirthdate } from '@/lib/mappers';
import { usePlayers } from '@/context/PlayersContext';
import type { Category, Position } from '@/types';

const POSITIONS: Option<Position>[] = [
  { value: 'GK', label: 'GK' }, { value: 'DEF', label: 'DEF' }, { value: 'MID', label: 'MID' }, { value: 'FWD', label: 'FWD' },
];
const CATEGORIES: Option<Category>[] = [
  { value: 'Seniors', label: 'Seniors' }, { value: 'U-20', label: 'U-20' }, { value: 'U-17', label: 'U-17' },
];

export default function AddPlayerScreen() {
  const { t } = useLanguage();
  const { addPlayer } = usePlayers();
  const { can } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [busy, setBusy] = useState(false);
  const [club, setClub] = useState('');
  const [position, setPosition] = useState<Position>('MID');
  const [category, setCategory] = useState<Category>('Seniors');

  const save = async () => {
    const n = parseInt(number, 10);
    if (!name.trim() || !Number.isFinite(n) || n < 1 || n > 99) {
      Alert.alert(t('addPlayer'), t('required'));
      return;
    }
    if (birthdate.trim() && !isValidBirthdate(birthdate.trim())) {
      Alert.alert(t('addPlayer'), t('birthdateInvalid'));
      return;
    }
    setBusy(true);
    try {
      await addPlayer({ name: name.trim(), number: n, position, category, club: club.trim() || 'Unattached', birthdate: birthdate.trim() });
      router.back();
    } catch {
      Alert.alert(t('addPlayer'), t('saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (!can('addPlayer')) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('addPlayer')}</Text>
          <TouchableOpacity style={styles.close} onPress={() => router.back()} accessibilityLabel={t('close')}>
            <X color={colors.white} size={18} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.amber, padding: space.lg }}>{t('viewOnly')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('addPlayer')}</Text>
          <TouchableOpacity style={styles.close} onPress={() => router.back()} accessibilityLabel={t('close')}>
            <X color={colors.white} size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field label={t('fullName')}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Aya Ben Youssef" placeholderTextColor={colors.muted} />
          </Field>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Field label={t('jerseyNumber')}>
                <TextInput style={styles.input} value={number} onChangeText={setNumber} keyboardType="number-pad" maxLength={2} placeholder="7" placeholderTextColor={colors.muted} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t('birthdate')}>
                <TextInput style={styles.input} value={birthdate} onChangeText={setBirthdate} keyboardType="numbers-and-punctuation" maxLength={10} placeholder="31/12/2001" placeholderTextColor={colors.muted} />
              </Field>
            </View>
          </View>
          <Field label={t('club')}>
            <TextInput style={styles.input} value={club} onChangeText={setClub} placeholder="Club name" placeholderTextColor={colors.muted} />
          </Field>
          <Field label={t('position')}><Chips options={POSITIONS} value={position} onChange={setPosition} /></Field>
          <Field label={t('category')}><Chips options={CATEGORIES} value={category} onChange={setCategory} /></Field>

          <TouchableOpacity style={[styles.save, busy && { opacity: 0.6 }]} onPress={save} disabled={busy} accessibilityRole="button">
            <Text style={styles.saveText}>{t('save')}</Text>
          </TouchableOpacity>
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
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  twoCol: { flexDirection: 'row', gap: space.md },
  label: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder,
    color: colors.white, paddingHorizontal: 14, height: 50, fontSize: 15,
  },
  save: { height: 52, borderRadius: radius.md, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
