import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/types';

/**
 * The platform's entry-screen look (login / register): the stadium photo under a navy and red
 * wash, the crest, a gold kicker and a frosted card with a red-to-gold bar.
 * Source: FedBg, LoginScreen and .fed-screen in the website.
 */
const NAVY = '#0A1226';
const GOLD = '#F6C744';
const RED = '#E30613';

const LANGS: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
  { value: 'ar', label: 'AR' },
];

interface Props {
  title: string;
  kicker: string;
  children: React.ReactNode;
  footer?: string;
}

export function FedScreen({ title, kicker, children, footer }: Props) {
  const { language, setLanguage } = useLanguage();
  return (
    <View style={styles.root}>
      <Image source={require('../assets/home-bg.jpg')} style={styles.photo} resizeMode="cover" accessibilityElementsHidden />
      {/* the website tints the photo red (mix-blend-color); a flat red wash is the closest match here */}
      <View style={styles.redWash} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(10,28,56,0.78)', 'rgba(10,19,34,0.52)', 'rgba(10,28,56,0.86)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient colors={['rgba(227,6,44,0.16)', 'transparent']} style={styles.aura} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.langRow}>
          {LANGS.map((l) => (
            <TouchableOpacity
              key={l.value}
              onPress={() => setLanguage(l.value)}
              style={[styles.langBtn, language === l.value && styles.langOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: language === l.value }}
            >
              <Text style={[styles.langText, language === l.value && { color: GOLD }]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Image source={require('../assets/ftf-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="FTF crest" />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.kicker}>{kicker}</Text>
            <View style={styles.card}>
              <LinearGradient colors={[RED, GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bar} />
              <View style={{ marginTop: 24, gap: 14 }}>{children}</View>
            </View>
            {!!footer && <Text style={styles.footer}>{footer}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export const fed = StyleSheet.create({
  field: { justifyContent: 'center' },
  icon: { position: 'absolute', left: 16, zIndex: 1 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    color: '#fff', paddingLeft: 44, paddingRight: 16, height: 50, fontSize: 14, fontWeight: '600',
  },
  btn: { marginTop: 6, height: 50, borderRadius: 12, overflow: 'hidden' },
  btnFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  error: { textAlign: 'center', color: '#FF4F66', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  link: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', paddingVertical: 4 },
  note: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.45, transform: [{ scale: 1.1 }] },
  redWash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(227,6,44,0.14)' },
  aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, paddingHorizontal: 16, paddingTop: 8 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(148,170,210,0.28)', backgroundColor: 'rgba(13,31,60,0.7)' },
  langOn: { borderColor: 'rgba(246,199,68,0.55)' },
  langText: { color: '#CDC2B0', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  logo: { height: 80, width: 140 },
  title: { marginTop: 32, color: '#fff', fontSize: 30, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, textAlign: 'center' },
  kicker: { marginTop: 12, color: GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 3.6, textTransform: 'uppercase', textAlign: 'center' },
  card: {
    marginTop: 32, width: '100%', maxWidth: 420, borderRadius: 24, padding: 28,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  bar: { height: 3, width: 56, borderRadius: 3, alignSelf: 'center' },
  footer: { marginTop: 28, color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: '700', letterSpacing: 2.4, textTransform: 'uppercase', textAlign: 'center' },
});
