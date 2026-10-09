import React, { useState } from 'react';
import {
  ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Key, Mail, User } from 'lucide-react-native';
import { FedScreen, fed } from '@/components/FedScreen';
import { colors, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { LG } from '@/i18n/loginStrings';
import { SU } from '@/i18n/signUpStrings';
import { confirmCard, createAccount, finishSignUp, type CardSuggestion, type SignUpError, type SignUpRole } from '@/lib/signup';
type Phase = 'form' | 'asking' | 'done';

/** Player sign-up. A name close to a player card pops up "Are you ...?" and links it on yes. */
export default function SignUpScreen() {
  const { language } = useLanguage();
  const T = SU[language];
  const L = LG[language];
  const router = useRouter();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<SignUpRole | ''>('');
  const [card, setCard] = useState<CardSuggestion | null>(null);
  const [error, setError] = useState<SignUpError | 'linkFailed' | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [queue, setQueue] = useState<CardSuggestion[]>([]);
  const [linked, setLinked] = useState(false);

  const ERR: Record<SignUpError | 'linkFailed', string> = {
    role: T.eRole, email: T.eEmail, emailTaken: T.eEmailTaken, name: T.eName, username: T.eUsername, password: T.ePassword, taken: T.eTaken, confirm: T.eConfirm, network: T.eNetwork, weak: T.eWeak,
    linkFailed: T.linkFailed,
  };

  const finish = async (isLinked: boolean, linkedCard: CardSuggestion | null = null) => {
    setLinked(isLinked);
    if (linkedCard) setCard(linkedCard);
    await finishSignUp();
    setPhase('done');
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const r = await createAccount(first, last, username, password, role, email);
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    if (r.linked || r.suggestions.length === 0) {
      await finish(r.linked, r.card);
      return;
    }
    setQueue(r.suggestions);
    setPhase('asking');
  };

  const answerYes = async () => {
    const chosen = queue[0];
    setBusy(true);
    const ok = await confirmCard(chosen.memberId);
    setBusy(false);
    if (!ok) setError('linkFailed');
    await finish(ok, ok ? chosen : null);
  };

  // "No" moves to the next closest card; running out of cards ends the flow unlinked.
  const answerNo = async () => {
    if (queue.length > 1) setQueue(queue.slice(1));
    else await finish(false);
  };

  const button = (label: string, onPress: () => void) => (
    <TouchableOpacity style={[fed.btn, busy && { opacity: 0.6 }]} onPress={onPress} disabled={busy} accessibilityRole="button">
      <LinearGradient colors={['#E30613', '#8F0319']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={fed.btnFill}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={fed.btnText}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (phase === 'done') {
    return (
      <FedScreen title={T.doneTitle} kicker={L.federation} footer={L.footer}>
        <Text style={fed.note}>{T.donePending}</Text>
        <Text style={[fed.note, { color: linked ? colors.green : 'rgba(255,255,255,0.55)', fontWeight: '700' }]}>
          {linked ? (card ? T.linkedTo.replace('{name}', card.name) : T.doneLinked) : role === 'staff' ? '' : T.doneNotLinked}
        </Text>
        {error === 'linkFailed' && <Text style={fed.error}>{T.linkFailed}</Text>}
        {button(T.back, () => router.replace('/sign-in'))}
      </FedScreen>
    );
  }

  const ask = queue[0];
  const field = (icon: React.ReactNode, placeholder: string, value: string, on: (v: string) => void, extra: object = {}) => (
    <View style={fed.field}>
      <View style={fed.icon}>{icon}</View>
      <TextInput
        style={fed.input}
        value={value}
        onChangeText={on}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        {...extra}
      />
    </View>
  );
  const dim = 'rgba(255,255,255,0.4)';

  return (
    <>
      <FedScreen title={L.registerTitle} kicker={L.federation} footer={L.footer}>
        {field(<User size={15} color={dim} />, T.first, first, setFirst, { autoCapitalize: 'words', autoComplete: 'given-name' })}
        {field(<User size={15} color={dim} />, T.last, last, setLast, { autoCapitalize: 'words', autoComplete: 'family-name' })}
        {field(<User size={15} color={dim} />, T.username, username, setUsername, { autoCapitalize: 'none', autoCorrect: false, autoComplete: 'username' })}
        {field(<Key size={15} color={dim} />, T.password, password, setPassword, { secureTextEntry: true, autoCapitalize: 'none', autoComplete: 'new-password', onSubmitEditing: submit })}
        {field(<Mail size={15} color={dim} />, T.emailPh, email, setEmail, { autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address', autoComplete: 'email' })}
        <View>
          <Text style={styles.joining}>{T.joiningAs}</Text>
          <View style={styles.roles}>
            <TouchableOpacity style={[styles.role, role === 'staff' && styles.roleStaff]} onPress={() => setRole('staff')} accessibilityRole="button" accessibilityState={{ selected: role === 'staff' }}>
              <Text style={[styles.roleText, role === 'staff' && { color: '#0C1F3D' }]}>{T.staff}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.role, role === 'player' && styles.rolePlayer]} onPress={() => setRole('player')} accessibilityRole="button" accessibilityState={{ selected: role === 'player' }}>
              <Text style={[styles.roleText, role === 'player' && { color: '#fff' }]}>⚽ {T.player}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {error && <Text style={fed.error} accessibilityRole="alert">{ERR[error]}</Text>}
        {button(T.create, submit)}
        <Text style={[fed.note, { fontSize: 10, color: 'rgba(255,255,255,0.45)' }]}>{T.emailNote}</Text>
        <TouchableOpacity onPress={() => router.replace('/sign-in')} accessibilityRole="link">
          <Text style={fed.link}>{T.haveAccount}</Text>
        </TouchableOpacity>
      </FedScreen>

      <Modal visible={phase === 'asking' && !!ask} transparent animationType="fade" onRequestClose={answerNo}>
        <View style={styles.scrim}>
          {ask && (
            <View style={styles.popup}>
              <Text style={styles.popTitle}>{T.areYou.replace('{name}', ask.name)}</Text>
              <Text style={styles.sub}>{T.areYouSub}</Text>
              <View style={styles.card}>
                <Text style={styles.cardNum}>{ask.number || '–'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{ask.name}</Text>
                  <Text style={styles.cardMeta}>{[ask.position, ask.category, ask.club].filter(Boolean).join('  ·  ')}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  joining: { color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' },
  roles: { flexDirection: 'row', gap: 8, marginTop: 6 },
  role: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  roleStaff: { backgroundColor: '#F6C744', borderColor: '#F6C744' },
  rolePlayer: { backgroundColor: '#E30613', borderColor: '#E30613' },
  roleText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' },
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
