import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Segmented, type Option } from '@/components/Chips';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { SU } from '@/i18n/signUpStrings';
import { confirmCard, createPlayerAccount, finishSignUp, type CardSuggestion, type SignUpError } from '@/lib/signup';
import type { Language } from '@/types';

const LANGUAGES: Option<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

type Phase = 'form' | 'asking' | 'done';

/** Player sign-up. A name close to a player card pops up "Are you ...?" and links it on yes. */
export default function SignUpScreen() {
  const { language, setLanguage } = useLanguage();
  const T = SU[language];
  const router = useRouter();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<SignUpError | 'linkFailed' | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [queue, setQueue] = useState<CardSuggestion[]>([]);
  const [linked, setLinked] = useState(false);

  const ERR: Record<SignUpError | 'linkFailed', string> = {
    name: T.eName, username: T.eUsername, password: T.ePassword, taken: T.eTaken, confirm: T.eConfirm, network: T.eNetwork, weak: T.eWeak,
    linkFailed: T.linkFailed,
  };

  const finish = async (isLinked: boolean) => {
    setLinked(isLinked);
    await finishSignUp();
    setPhase('done');
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const r = await createPlayerAccount(first, last, username, password);
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    if (r.linked || r.suggestions.length === 0) {
      await finish(r.linked);
      return;
    }
    setQueue(r.suggestions);
    setPhase('asking');
  };

  const answerYes = async () => {
    const card = queue[0];
    setBusy(true);
    const ok = await confirmCard(card.memberId);
    setBusy(false);
    if (!ok) setError('linkFailed');
    await finish(ok);
  };

  // "No" moves to the next closest card; running out of cards ends the flow unlinked.
  const answerNo = async () => {
    if (queue.length > 1) setQueue(queue.slice(1));
    else await finish(false);
  };

  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppHeader showBell={false} />
          <Text style={styles.title}>{T.doneTitle}</Text>
          <Text style={styles.sub}>{T.donePending}</Text>
          <Text style={[styles.note, { color: linked ? colors.green : colors.muted }]}>{linked ? T.doneLinked : T.doneNotLinked}</Text>
          {error === 'linkFailed' && <Text style={styles.error}>{T.linkFailed}</Text>}
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/sign-in')} accessibilityRole="button">
            <Text style={styles.btnText}>{T.back}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const card = queue[0];
  const field = (label: string, value: string, on: (v: string) => void, extra: object = {}) => (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={on} placeholderTextColor={colors.muted} {...extra} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppHeader showBell={false} />
          <View style={{ gap: 6 }}>
            <Text style={styles.title}>{T.title}</Text>
            <Text style={styles.sub}>{T.sub}</Text>
          </View>
          {field(T.first, first, setFirst, { autoCapitalize: 'words', autoComplete: 'given-name' })}
          {field(T.last, last, setLast, { autoCapitalize: 'words', autoComplete: 'family-name' })}
          {field(T.username, username, setUsername, { autoCapitalize: 'none', autoCorrect: false, autoComplete: 'username' })}
          {field(T.password, password, setPassword, { secureTextEntry: true, autoCapitalize: 'none', autoComplete: 'new-password', onSubmitEditing: submit })}

          {error && <Text style={styles.error} accessibilityRole="alert">{ERR[error]}</Text>}
          <Segmented options={LANGUAGES} value={language} onChange={setLanguage} />

          <TouchableOpacity style={[styles.btn, busy && { opacity: 0.7 }]} onPress={submit} disabled={busy} accessibilityRole="button">
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>{T.create}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/sign-in')} accessibilityRole="link">
            <Text style={styles.link}>{T.haveAccount}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={phase === 'asking' && !!card} transparent animationType="fade" onRequestClose={answerNo}>
        <View style={styles.scrim}>
          {card && (
            <View style={styles.popup}>
              <Text style={styles.popTitle}>{T.areYou.replace('{name}', card.name)}</Text>
              <Text style={styles.sub}>{T.areYouSub}</Text>
              <View style={styles.card}>
                <Text style={styles.cardNum}>{card.number || '–'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardMeta}>{[card.position, card.category, card.club].filter(Boolean).join('  ·  ')}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.btn, busy && { opacity: 0.7 }]} onPress={answerYes} disabled={busy} accessibilityRole="button">
                {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>{T.yes}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={answerNo} disabled={busy} accessibilityRole="button">
                <Text style={styles.btnGhostText}>{queue.length > 1 ? T.no : T.noneOfThem}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg + 4, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  note: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  label: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  input: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, color: colors.white, paddingHorizontal: 14, height: 50, fontSize: 15 },
  error: { color: '#FF6B75', backgroundColor: colors.redSoft, borderRadius: radius.sm + 2, padding: 10, fontSize: 13 },
  btn: { height: 52, borderRadius: radius.md, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.goldBorder },
  btnGhostText: { color: colors.muted, fontWeight: '800', fontSize: 15 },
  link: { color: colors.gold, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: space.lg },
  popup: { backgroundColor: colors.navyDeep, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.goldBorder, padding: space.lg, gap: space.md },
  popTitle: { color: colors.white, fontSize: 22, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.gold, padding: space.md },
  cardNum: { color: colors.gold, fontSize: 34, fontWeight: '800', minWidth: 46, textAlign: 'center' },
  cardName: { color: colors.white, fontSize: 17, fontWeight: '800' },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
