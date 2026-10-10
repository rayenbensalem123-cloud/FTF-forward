import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { Key, User } from 'lucide-react-native';
import { FedScreen, fed } from '@/components/FedScreen';
import { useAuth, type SignInResult } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FG } from '@/i18n/forgotStrings';
import { LG } from '@/i18n/loginStrings';
import type { StringKey } from '@/i18n/strings';

const ERRORS: Record<NonNullable<SignInResult>, StringKey> = {
  not_found: 'signInNotFound',
  wrong_password: 'signInWrongPassword',
  network: 'signInNetwork',
  pending: 'signInPending',
  suspended: 'signInSuspended',
  no_profile: 'signInNoProfile',
  not_configured: 'notConfigured',
};

/** Same look as the platform's login: stadium background, crest, "System Locked", frosted card. */
export default function SignInScreen() {
  const { t, language } = useLanguage();
  const { user, signIn } = useAuth();
  const router = useRouter();
  const L = LG[language];
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
    <FedScreen title={L.systemLocked} kicker={L.authRequired} footer={L.footer}>
      <View style={fed.field}>
        <View style={fed.icon}><User size={15} color="rgba(255,255,255,0.4)" /></View>
        <TextInput
          style={fed.input}
          value={username}
          onChangeText={setUsername}
          placeholder={t('username')}
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username"
        />
      </View>
      <View style={fed.field}>
        <View style={fed.icon}><Key size={15} color="rgba(255,255,255,0.4)" /></View>
        <TextInput
          style={[fed.input, error ? { borderColor: '#FF4F66' } : null]}
          value={password}
          onChangeText={setPassword}
          placeholder={L.accessKey}
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
          autoComplete="password"
          onSubmitEditing={submit}
        />
      </View>

      {error && <Text style={fed.error} accessibilityRole="alert">{t(error)}</Text>}

      <TouchableOpacity style={[fed.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} accessibilityRole="button">
        <LinearGradient colors={['#E30613', '#8F0319']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={fed.btnFill}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={fed.btnText}>{L.authorize}</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/forgot-password')} accessibilityRole="link">
        <Text style={fed.link}>{FG[language].link}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/sign-up')} accessibilityRole="link">
        <Text style={fed.link}>{L.register}</Text>
      </TouchableOpacity>
    </FedScreen>
  );
}
