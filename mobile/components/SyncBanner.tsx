import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cloud, CloudOff, Database } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import { formatClock, formatDate } from '@/lib/format';

/** Shows where the squad data comes from: live backend, saved copy, or sample data. */
export function SyncBanner() {
  const { t } = useLanguage();
  const { status, lastSynced } = usePlayers();

  const when = lastSynced
    ? `${formatDate(new Date(lastSynced).toISOString().slice(0, 10))}, ${formatClock(lastSynced)}`
    : '';

  let tone: string = colors.muted;
  let bg: string = 'rgba(255,255,255,0.06)';
  let text = t('syncLoading');
  let Icon = Database;

  if (status === 'live') {
    tone = colors.green; bg = colors.greenSoft; Icon = Cloud;
    text = `${t('syncLive')} · ${when ? formatClock(lastSynced as number) : ''}`;
  } else if (status === 'offline') {
    tone = colors.amber; bg = colors.amberSoft; Icon = CloudOff;
    text = when ? `${t('syncOffline')} ${when}` : t('syncOffline');
  }

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]} accessibilityRole="text">
      <Icon color={tone} size={14} />
      <Text style={[styles.text, { color: tone }]} numberOfLines={2}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', maxWidth: '100%' },
  text: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
});
