import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Redirect, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth, type SignInResult } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FG } from '@/i18n/forgotStrings';
import { LG } from '@/i18n/loginStrings';
import type { StringKey } from '@/i18n/strings';
import { colors, fonts } from '@/constants/theme';

const ERRORS: Record<NonNullable<SignInResult>, StringKey> = {
  not_found: 'signInNotFound',
  wrong_password: 'signInWrongPassword',
  network: 'signInNetwork',
  pending: 'signInPending',
  suspended: 'signInSuspended',
  no_profile: 'signInNoProfile',
  not_configured: 'notConfigured',
};

const GROUND = '#0A1426';
const FIELD = '#111E37';
const RULE = 'rgba(148,170,210,0.16)';

/** Dark pitch-line sign in: faint centre circle behind the crest, plain fields, one red button. */
export default function SignInScreen() {
  const { t, language } = useLanguage();
  const { user, signIn } = useAuth();
  const router = useRouter();
  const L = LG[language];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Svg width="100%" height={420} viewBox="0 0 390 420" style={styles.pitch} pointerEvents="none">
            <Circle cx={195} cy={170} r={124} stroke={RULE} strokeWidth={2} fill="none" />
            <Path d="M0 170h71M319 170h71" stroke={RULE} strokeWidth={2} />
            <Circle cx={195} cy={170} r={4} fill={RULE} />
          </Svg>

          <View style={styles.hero}>
            <View style={styles.crest}>
              <Image source={require('../assets/ftf-logo.png')} style={{ width: 104, height: 104 }} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Tunisia Women's NT</Text>
            <Text style={styles.sub}>Sign in to your squad account</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t('username')}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t('username')}
              placeholderTextColor="#7F90AE"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>{L.accessKey}</Text>
              <TouchableOpacity onPress={() => router.push('/forgot-password')} accessibilityRole="link" style={styles.minTap}>
                <Text style={styles.link}>{FG[language].link}</Text>
              </TouchableOpacity>
            </View>
            <View>
              <TextInput
                style={[styles.input, { paddingRight: 56 }, error ? { borderColor: '#FF4F66' } : null]}
                value={password}
                onChangeText={setPassword}
                placeholder={L.accessKey}
                placeholderTextColor="#7F90AE"
                secureTextEntry={!show}
                autoCapitalize="none"
                textContentType="password"
                autoComplete="password"
                onSubmitEditing={submit}
              />
              <TouchableOpacity style={styles.eye} onPress={() => setShow(!show)} accessibilityLabel="Show password">
                {show ? <EyeOff color="#9AA9C4" size={20} /> : <Eye color="#9AA9C4" size={20} />}
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error} accessibilityRole="alert">{t(error)}</Text>}

            <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} accessibilityRole="button">
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/sign-up')} accessibilityRole="link" style={[styles.minTap, { alignSelf: 'center', minHeight: 44 }]}>
              <Text style={styles.sub}>New here? <Text style={styles.linkStrong}>Create an account</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GROUND },
  scroll: { flexGrow: 1 },
  pitch: { position: 'absolute', top: 0, left: 0 },
  hero: { alignItems: 'center', paddingTop: 56, paddingBottom: 28 },
  crest: { width: 128, height: 128, borderRadius: 64, backgroundColor: GROUND, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 36, color: colors.white, fontFamily: fonts.display, fontSize: 34, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  sub: { color: '#9AA9C4', fontSize: 15, marginTop: 6 },
  form: { paddingHorizontal: 24, paddingBottom: 28, gap: 8 },
  label: { color: '#9AA9C4', fontSize: 13, fontWeight: '600', letterSpacing: 0.4, marginTop: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  minTap: { minHeight: 32, justifyContent: 'center' },
  link: { color: colors.white, fontSize: 13, fontWeight: '600' },
  linkStrong: { color: colors.white, fontWeight: '700' },
  input: { height: 52, paddingHorizontal: 16, backgroundColor: FIELD, borderWidth: 1, borderColor: 'rgba(148,170,210,0.28)', borderRadius: 12, color: colors.white, fontSize: 16 },
  eye: { position: 'absolute', right: 4, top: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#FF4F66', fontSize: 13 },
  btn: { marginTop: 10, height: 56, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: fonts.display, fontSize: 19, letterSpacing: 1.5, textTransform: 'uppercase' },
});
