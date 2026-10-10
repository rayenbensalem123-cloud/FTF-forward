import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, User } from 'lucide-react-native';
import { FedScreen, fed } from '@/components/FedScreen';
import { useLanguage } from '@/context/LanguageContext';
import { FG } from '@/i18n/forgotStrings';
import { postSite } from '@/lib/site';

/** Asks the website to email a reset link (the site holds the mail and service keys, never the app). */
export default function ForgotPasswordScreen() {
  const { language } = useLanguage();
  const router = useRouter();
  const T = FG[language];
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  const submit = async () => {
    if (!username.trim() || !email.trim()) { setNote({ text: T.need, ok: false }); return; }
    setBusy(true); setNote(null);
    const r = await postSite('/api/forgot-password', { username: username.trim(), email: email.trim() });
    setBusy(false);
    if (r.error === 'network') setNote({ text: T.network, ok: false });
    else if (r.error) setNote({ text: /Email delivery/i.test(r.error) ? T.noEmail : r.error, ok: false });
    else setNote({ text: T.sent, ok: true });
  };

  return (
    <FedScreen title={T.title} kicker="" footer={T.intro}>
      <View style={fed.field}>
        <View style={fed.icon}><User size={15} color="rgba(255,255,255,0.4)" /></View>
        <TextInput style={fed.input} value={username} onChangeText={setUsername} placeholder={T.username}
          placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="none" autoCorrect={false} />
      </View>
      <View style={fed.field}>
        <View style={fed.icon}><Mail size={15} color="rgba(255,255,255,0.4)" /></View>
        <TextInput style={fed.input} value={email} onChangeText={setEmail} placeholder={T.email}
          placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="none" autoCorrect={false}
          keyboardType="email-address" textContentType="emailAddress" onSubmitEditing={submit} />
      </View>
      {note && <Text style={note.ok ? [fed.error, { color: '#22C55E' }] : fed.error} accessibilityRole="alert">{note.text}</Text>}
      <TouchableOpacity style={[fed.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} accessibilityRole="button">
        <LinearGradient colors={['#E30613', '#8F0319']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={fed.btnFill}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={fed.btnText}>{T.send}</Text>}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} accessibilityRole="link">
        <Text style={fed.link}>{T.back}</Text>
      </TouchableOpacity>
    </FedScreen>
  );
}
