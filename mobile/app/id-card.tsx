import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Flag } from '@/components/Flag';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { CS } from '@/i18n/careerStrings';
import { cardCode, shareIdCard } from '@/lib/idCard';

export default function IdCardScreen() {
  const { language } = useLanguage();
  const T = CS[language];
  const { user } = useAuth();
  const { getPlayer } = usePlayers();
  const [sharing, setSharing] = useState(false);

  const player = user?.memberId != null ? getPlayer(String(user.memberId)) : undefined;

  const onShare = async () => {
    if (!player || !user) return;
    setSharing(true);
    try {
      const ok = await shareIdCard(player, user.username);
      if (!ok) Alert.alert(T.shareCard, 'Sharing is not available on this device.');
    } catch {
      Alert.alert(T.shareCard, 'Could not create the card. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader back showBell={false} />
        <Text style={styles.title}>{T.idCard}</Text>

        {!player ? (
          <Text style={styles.empty}>{T.notLinked}</Text>
        ) : (
          <>
            <LinearGradient colors={['#0C1F3D', '#15284d']} style={styles.card}>
              <Text style={styles.brand}>Tunisia WNT</Text>
              <Text style={styles.federation}>{T.idCardFooter}</Text>

              <View style={styles.headRow}>
                <Avatar name={player.name} number={player.number} photoUrl={player.photoUrl} size={88} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
                  <Text style={styles.sub}>#{player.number || '—'} · {player.position}</Text>
                  <View style={styles.flagRow}>
                    <Flag name={player.nationality} width={18} />
                    <Text style={styles.flagText}>{player.nationality || '—'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.cell}><Text style={styles.label}>{T.category}</Text><Text style={styles.value}>{player.category}</Text></View>
                <View style={styles.cell}><Text style={styles.label}>{T.club}</Text><Text style={styles.value} numberOfLines={1}>{player.club || '—'}</Text></View>
                <View style={styles.cell}><Text style={styles.label}>{T.caps}</Text><Text style={styles.value}>{player.caps}</Text></View>
                <View style={styles.cell}><Text style={styles.label}>{T.goals}</Text><Text style={styles.value}>{player.goals}</Text></View>
              </View>

              <View style={styles.qrWrap}>
                <View style={styles.qrBox}>
                  <QRCode value={cardCode(player)} size={92} color={colors.navy} backgroundColor="#fff" />
                </View>
                <Text style={styles.code}>{cardCode(player)}</Text>
                <Text style={styles.valid}>{T.validThrough}</Text>
              </View>
            </LinearGradient>

            <TouchableOpacity style={styles.shareBtn} onPress={onShare} disabled={sharing} accessibilityRole="button">
              {sharing ? <ActivityIndicator color={colors.navy} /> : (
                <>
                  <Share2 size={16} color={colors.navy} />
                  <Text style={styles.shareText}>{T.shareCard}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: space.xl },
  card: { borderRadius: 24, borderWidth: 2, borderColor: colors.gold, padding: space.lg, gap: space.md },
  brand: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
  federation: { color: colors.muted, fontSize: 11, textAlign: 'center', marginBottom: space.xs },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { color: colors.white, fontSize: 19, fontWeight: '800' },
  sub: { color: colors.gold, fontSize: 12, fontWeight: '800', marginTop: 3 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  flagText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space.md },
  cell: { width: '45%' },
  label: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: colors.white, fontSize: 14, fontWeight: '700', marginTop: 2 },
  qrWrap: { alignItems: 'center', marginTop: space.sm },
  qrBox: { backgroundColor: '#fff', padding: 10, borderRadius: radius.sm },
  code: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: space.sm },
  valid: { color: colors.muted, fontSize: 10, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.md, backgroundColor: colors.gold },
  shareText: { color: colors.navy, fontWeight: '800', fontSize: 15 },
});
