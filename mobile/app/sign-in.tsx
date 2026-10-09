import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Segmented, type Option } from '@/components/Chips';
import { colors, radius, space } from '@/constants/theme';
import { useAuth, type SignInResult } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { StringKey } from '@/i18n/strings';
import { SU } from '@/i18n/signUpStrings';
import type { Language } from '@/types';

const LANGUAGES: Option<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

const ERRORS: Record<NonNullable<SignInResult>, StringKey> = {
  not_found: 'signInNotFound',
  wrong_password: 'signInWrongPassword',
  network: 'signInNetwork',
  pending: 'signInPending',
  suspended: 'signInSuspended',
  no_profile: 'signInNoProfile',
  not_configured: 'notConfigured',
};

export default function SignInScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Redirect href="/" />;

  const submit = async () => {
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    const result = await signIn(username, password);
    setBusy(false);
    if (result) setError(ERRORS[result]);
    else router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppHeader showBell={false} />
          <View style={{ gap: 6 }}>
            <Text style={styles.title}>{t('signInTitle')}</Text>
            <Text style={styles.sub}>{t('signInSub')}</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>{t('username')}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              onSubmitEditing={submit}
              placeholderTextColor={colors.muted}
            />
          </View>

          {error && <Text style={styles.error} accessibilityRole="alert">{t(error)}</Text>}

          <Segmented options={LANGUAGES} value={language} onChange={setLanguage} />

          <TouchableOpacity style={[styles.btn, busy && { opacity: 0.7 }]} onPress={submit} disabled={busy} accessibilityRole="button">
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>{t('continue')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/sign-up')} accessibilityRole="link">
            <Text style={styles.signUpLink}>{SU[language].link}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg + 4, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  role: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder, padding: space.lg,
  },
  roleActive: { borderColor: colors.gold },
  roleName: { color: colors.white, fontSize: 16, fontWeight: '800' },
  roleDesc: { color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  label: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.goldBorder,
    color: colors.white, paddingHorizontal: 14, height: 50, fontSize: 15,
  },
  signUpLink: { color: colors.gold, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  error: { color: '#FF6B75', backgroundColor: colors.redSoft, borderRadius: radius.sm + 2, padding: 10, fontSize: 13 },
  btn: { height: 52, borderRadius: radius.md, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
