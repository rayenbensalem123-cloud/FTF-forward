import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { colors, fonts, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/Button';
import { Countdown } from '@/components/Countdown';
import { Flag } from '@/components/Flag';
import { flagCodeFor } from '@/lib/countryFlags';
import { formatDate } from '@/lib/format';
import { addMatchToCalendar } from '@/lib/calendar';
import { WeatherChip } from '@/components/WeatherChip';
import { CS } from '@/i18n/careerStrings';
import type { Match } from '@/types';

/**
 * The dashboard hero: the next match on a dark maroon gradient, with a gold
 * competition pill, a three-box countdown, the weather for the venue, a gold
 * primary button and a gold-outlined secondary one.
 *
 * Crests show the flag directly. The earlier version put each one on a blue
 * disc, which read as a coloured badge behind the flag rather than the flag
 * itself; a faint translucent backing is enough to lift it off the gradient.
 */
export function MatchHero({ match }: { match: Match | null }) {
  const { t, language } = useLanguage();
  const CT = CS[language];
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);

  const onAdd = async () => {
    if (!match) return;
    setAdding(true);
    const res = await addMatchToCalendar(match);
    setAdding(false);
    if (res === 'added') Alert.alert(CT.addToCalendar, CT.addedToCalendar);
    else if (res === 'denied') Alert.alert(CT.addToCalendar, CT.calendarDenied);
    else Alert.alert(CT.addToCalendar, CT.calendarFailed);
  };

  const opponentCode = match && flagCodeFor(match.opponent) ? match.opponent : null;

  return (
    <LinearGradient
      colors={['#3A0A16', '#1C060D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {(match?.competition || match?.category || 'WNT').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.nextLabel} numberOfLines={1}>
          {t('nextMatch')}{match ? ` · ${formatDate(match.date).toUpperCase()}` : ''}
        </Text>
      </View>

      <View style={styles.teams}>
        <View style={styles.team}>
          <View style={styles.crest}><Flag name="Tunisia" width={30} /></View>
          <Text style={styles.teamName} numberOfLines={1}>Tunisia</Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={[styles.team, styles.teamRight]}>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
            {match?.opponent || t('noMatchScheduled')}
          </Text>
          <View style={styles.crest}>
            {opponentCode ? (
              <Flag name={opponentCode} width={30} />
            ) : (
              <Text style={styles.crestText}>{match ? '?' : '—'}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Countdown
          target={match ? `${match.date}T00:00:00` : ''}
          labels={{ days: t('days'), hrs: t('hrs'), min: t('min'), sec: t('sec') }}
        />
        <View style={styles.primaryWrap}>
          <Button
            title={t('matchDetails')}
            onPress={() => router.push('/match-details')}
            icon={<Text style={styles.chevron}>›</Text>}
          />
        </View>
      </View>

      <View style={styles.venueRow}>
        {!!match?.venue && (
          <View style={styles.venue}>
            <MapPin color={colors.gold} size={12} />
            <Text style={styles.venueText} numberOfLines={1}>{match.venue}</Text>
          </View>
        )}
        {match?.venue ? <WeatherChip venue={match.venue} date={match.date} /> : null}
        <View style={styles.secondaryWrap}>
          <Button title={CT.addToCalendar} onPress={onAdd} variant="secondary" icon={<Text style={styles.plus}>＋</Text>} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: space.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  pill: {
    backgroundColor: colors.gold, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1,
  },
  pillText: { color: colors.navy, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  nextLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', flexShrink: 1 },
  teams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginVertical: space.md },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  teamRight: { justifyContent: 'flex-end' },
  // A faint translucent backing rather than a solid disc: the flag reads as
  // itself, not as an icon inside a coloured badge.
  crest: {
    width: 44, height: 44, borderRadius: 22, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  crestText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  teamName: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', letterSpacing: 0.5, color: colors.white, flexShrink: 1 },
  teamNameRight: { textAlign: 'right' },
  vs: { color: colors.gold, fontWeight: '900', fontSize: 14, letterSpacing: 0.7 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  primaryWrap: { flex: 1, marginLeft: space.sm },
  chevron: { color: colors.navy, fontSize: 16, fontWeight: '700', lineHeight: 16 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.sm },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  venueText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  secondaryWrap: { marginLeft: 'auto' },
  plus: { color: colors.gold, fontSize: 14, fontWeight: '700', lineHeight: 14 },
});
